#!/bin/bash
# ============================================================================
# RESTORE DOS DADOS MIGRADOS (SEED) NA PRODUÇÃO VPS
#
# Carrega o dump data-only do banco DEV (Câmara de Chaves, dados extraídos do
# backup CR2 + correções) no PostgreSQL local do VPS.
#
# PRÉ-REQUISITO: o install.sh já rodou e criou o SCHEMA (prisma db push).
# Este script NÃO cria schema — só popula os dados.
#
# Uso (no VPS, como root/sudo):
#   bash scripts/restore-dados-producao.sh [caminho-do-seed.sql.gz]
#   (padrão: /opt/camara/deploy/camara-seed.sql.gz)
#
# Idempotente: TRUNCATE em todas as tabelas antes de carregar (pode reexecutar).
# As FKs circulares (parlamentares/sessoes/emendas) são tratadas com
# session_replication_role=replica (exige superuser postgres).
# ============================================================================
set -euo pipefail

INSTALL_DIR="${INSTALL_DIR:-/opt/camara}"
DB_NAME="${DB_NAME:-camara_legislativo}"
SEED="${1:-$INSTALL_DIR/deploy/camara-seed.sql.gz}"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
log()  { echo -e "  ${GREEN}✓${NC} $1"; }
warn() { echo -e "  ${YELLOW}!${NC} $1"; }
err()  { echo -e "  ${RED}✗${NC} $1"; exit 1; }

echo -e "${CYAN}== Restore de dados — produção ==${NC}"

[ -f "$SEED" ] || err "Seed não encontrado: $SEED
    Copie da máquina DEV:  scp deploy/camara-seed.sql.gz root@<VPS>:$INSTALL_DIR/deploy/"

command -v psql >/dev/null || err "psql não encontrado (rode o install.sh antes)."
command -v gunzip >/dev/null || err "gunzip não encontrado."

# Confere que o schema existe (tabela proposicoes) antes de popular.
if ! sudo -u postgres psql -d "$DB_NAME" -tAc "SELECT to_regclass('public.proposicoes');" | grep -q proposicoes; then
  err "Schema ausente no banco '$DB_NAME'. Rode o install.sh (prisma db push) primeiro."
fi

echo -e "  ${CYAN}Seed:${NC}   $SEED  ($(du -h "$SEED" | cut -f1))"
echo -e "  ${CYAN}Banco:${NC}  $DB_NAME (PostgreSQL local)"
echo -en "  Isto irá APAGAR os dados atuais de '$DB_NAME' e recarregar do seed. Continuar? [s/N]: "
read -r resp
case "$resp" in s|S|sim|Sim) ;; *) warn "Cancelado."; exit 0;; esac

log "Truncando tabelas e carregando dados (FK desligada na sessão)..."

{
  echo "SET session_replication_role = replica;"
  # Trunca todas as tabelas do schema public (idempotência).
  echo "DO \$\$ DECLARE r RECORD; BEGIN"
  echo "  FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname='public') LOOP"
  echo "    EXECUTE 'TRUNCATE TABLE public.'||quote_ident(r.tablename)||' RESTART IDENTITY CASCADE';"
  echo "  END LOOP; END \$\$;"
  gunzip -c "$SEED"
  echo "SET session_replication_role = DEFAULT;"
} | sudo -u postgres psql -d "$DB_NAME" -q -v ON_ERROR_STOP=1

log "Dados carregados. Verificação:"
sudo -u postgres psql -d "$DB_NAME" -tAc \
  "SELECT 'proposicoes='||count(*) FROM proposicoes
   UNION ALL SELECT 'parlamentares='||count(*) FROM parlamentares
   UNION ALL SELECT 'sessoes='||count(*) FROM sessoes
   UNION ALL SELECT 'presencas='||count(*) FROM presencas_sessao;" | sed 's/^/    /'

echo -e "  ${GREEN}✓ Restore concluído.${NC} Reinicie o app:  pm2 restart camara-legislativo"
echo -e "  ${YELLOW}!${NC} Troque a senha do admin após o primeiro acesso (os usuários vieram do DEV)."
