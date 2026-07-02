#!/bin/bash
# ============================================================================
# INSTALAÇÃO AUTOMÁTICA (NÃO-INTERATIVA) — VPS Debian/Ubuntu, PostgreSQL local
#
# Faz TUDO: pré-flight (swap + PostgreSQL + Node) → install.sh (unattended,
# provisiona nginx/PM2/SSL, gera .env, cria schema, build) → restaura o seed
# de dados → define o admin → reinicia e valida.
#
# PRÉ-REQUISITO: copie o seed para o VPS antes (a pasta deploy/ não vem no git):
#   scp deploy/camara-seed.sql.gz root@<IP>:/root/camara-seed.sql.gz
#
# USO (como root no VPS):
#   export ADMIN_EMAIL="voce@dominio"  ADMIN_PASSWORD="SenhaForte123" \
#          ENCRYPTION_KEY="<mesma chave do .env DEV>"
#   curl -fsSL https://raw.githubusercontent.com/junielsonfarias/LegNet/main/scripts/instalar-producao.sh | bash
#
# Variáveis (têm padrão, sobrescreva via env):
#   SITE_DOMAIN, CAMARA_NOME, SSL_EMAIL, SEED_FILE, INSTALL_REDIS, COR_*
# Obrigatórias: ADMIN_EMAIL, ADMIN_PASSWORD, ENCRYPTION_KEY
# ============================================================================
set -uo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
step() { echo -e "\n${CYAN}==> $1${NC}"; }
ok()   { echo -e "  ${GREEN}✓${NC} $1"; }
die()  { echo -e "  ${RED}✗ $1${NC}"; exit 1; }

# ---- Config (obrigatórias) ----
: "${ADMIN_EMAIL:?defina ADMIN_EMAIL}"
: "${ADMIN_PASSWORD:?defina ADMIN_PASSWORD (>=8 caracteres)}"
: "${ENCRYPTION_KEY:?defina ENCRYPTION_KEY (a MESMA do .env DEV, p/ decifrar dados)}"
[ "${#ADMIN_PASSWORD}" -ge 8 ] || die "ADMIN_PASSWORD deve ter >= 8 caracteres"

# ---- Config (padrões) ----
export SITE_DOMAIN="${SITE_DOMAIN:-siscam.vps-kinghost.net}"
export CAMARA_NOME="${CAMARA_NOME:-Câmara Municipal de Chaves}"
export SSL_EMAIL="${SSL_EMAIL:-$ADMIN_EMAIL}"
export INSTALL_REDIS="${INSTALL_REDIS:-n}"
export COR_PRIMARIA="${COR_PRIMARIA:-#1e40af}"
export COR_SECUNDARIA="${COR_SECUNDARIA:-#3b82f6}"
export COR_ACENTO="${COR_ACENTO:-#059669}"
export ADMIN_EMAIL ADMIN_PASSWORD ENCRYPTION_KEY
export CAMARA_UNATTENDED=1
# Como tratar uma instalacao JA existente (o install.sh detecta sozinho):
#   update    (padrao) -> atualiza codigo/schema, PRESERVA banco/config/dados
#   reinstall           -> APAGA tudo e instala do zero (repopula com o seed)
export AUTO_INSTALL_MODE="${AUTO_INSTALL_MODE:-update}"
SEED_FILE="${SEED_FILE:-/root/camara-seed.sql.gz}"
INSTALL_DIR="/opt/camara"
DB_NAME="camara_legislativo"

[ "$(id -u)" = "0" ] || die "Rode como root (sudo)."

# Detecta ANTES do install.sh se ja existe uma instalacao, para decidir se o seed
# deve ser (re)carregado. Regra: instalacao nova ou reinstall -> popula o seed;
# atualizacao de uma instalacao existente -> NAO mexe nos dados (a menos de RESTORE_SEED=1).
PREEXISTING=0
[ -f "$INSTALL_DIR/package.json" ] && PREEXISTING=1
if [ "$PREEXISTING" = "1" ] && [ "$AUTO_INSTALL_MODE" != "reinstall" ] && [ "${RESTORE_SEED:-0}" != "1" ]; then
  DO_RESTORE=0
else
  DO_RESTORE=1
fi
[ "$PREEXISTING" = "1" ] && echo -e "  ${YELLOW}! Instalacao existente detectada — modo: ${AUTO_INSTALL_MODE} (restore do seed: $([ "$DO_RESTORE" = 1 ] && echo SIM || echo NAO))${NC}"

# ---- 1. Pré-flight ----
step "1/5 Pré-flight (swap + PostgreSQL + Node + base)"
apt-get update -qq || die "apt update falhou"
if [ "$(free -m | awk '/Swap:/{print $2}')" -lt 2000 ] && [ ! -f /swap2 ]; then
  fallocate -l 2G /swap2 && chmod 600 /swap2 && mkswap /swap2 >/dev/null && swapon /swap2
  grep -q '/swap2' /etc/fstab || echo '/swap2 none swap sw 0 0' >> /etc/fstab
  ok "swap 2G criado"
fi
DEBIAN_FRONTEND=noninteractive apt-get install -y -qq git curl ca-certificates gnupg postgresql postgresql-client >/dev/null 2>&1 \
  && ok "base + PostgreSQL nativo" || die "falha ao instalar base/PostgreSQL"
if ! command -v node >/dev/null 2>&1 || [ "$(node -v 2>/dev/null | tr -d v | cut -d. -f1)" -lt 20 ]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null 2>&1
  DEBIAN_FRONTEND=noninteractive apt-get install -y -qq nodejs >/dev/null 2>&1
fi
command -v node >/dev/null 2>&1 && ok "Node $(node -v)" || die "Node não instalou"

# ---- 2. install.sh (unattended) ----
step "2/5 install.sh (provisiona nginx/PM2/SSL, .env, schema, build) — leva ~10 min"
curl -fsSL https://raw.githubusercontent.com/junielsonfarias/LegNet/main/install.sh -o /root/install.sh || die "download do install.sh falhou"
bash /root/install.sh
[ -f "$INSTALL_DIR/.env" ] && [ -d "$INSTALL_DIR/.next" ] || die "install.sh não concluiu (.env/.next ausentes) — veja /var/log/camara-install.log"
ok "app provisionado em $INSTALL_DIR"

# ---- 3. Restore do seed ----
step "3/5 Restaurando os dados migrados (seed)"
if [ "$DO_RESTORE" != "1" ]; then
  echo -e "  ${YELLOW}! Atualizacao de instalacao existente — dados PRESERVADOS (nao recarreguei o seed).${NC}"
  echo -e "  ${YELLOW}  Para forcar a recarga do seed: RESTORE_SEED=1 ...  |  para instalar do zero: AUTO_INSTALL_MODE=reinstall${NC}"
else
  mkdir -p "$INSTALL_DIR/deploy"
  if [ -f "$SEED_FILE" ]; then
    cp "$SEED_FILE" "$INSTALL_DIR/deploy/camara-seed.sql.gz"
  fi
  if [ -f "$INSTALL_DIR/deploy/camara-seed.sql.gz" ]; then
    bash "$INSTALL_DIR/scripts/restore-dados-producao.sh" --yes || die "restore falhou"
  else
    echo -e "  ${YELLOW}! Seed não encontrado em $SEED_FILE — pulei o restore (base ficará vazia).${NC}"
  fi
fi

# ---- 4. Admin (email/senha do config) ----
# So (re)define o admin quando recarregamos o seed (usuarios vieram do DEV).
# Numa atualizacao, o admin de producao e preservado.
step "4/5 Definindo o administrador"
cd "$INSTALL_DIR"
if [ "$DO_RESTORE" != "1" ]; then
  echo -e "  ${YELLOW}! Atualizacao — admin de producao preservado (nao alterei email/senha).${NC}"
else
  HASH=$(node -e "console.log(require('bcryptjs').hashSync(process.argv[1],12))" "$ADMIN_PASSWORD")
  sudo -u postgres psql -d "$DB_NAME" -c \
    "UPDATE users SET email='$ADMIN_EMAIL', password='$HASH', ativo=true WHERE role='ADMIN';" >/dev/null 2>&1 \
    && ok "admin = $ADMIN_EMAIL" || echo -e "  ${YELLOW}! não foi possível atualizar o admin (verifique manualmente)${NC}"
fi

# ---- 5. Restart + validação ----
step "5/5 Reiniciando e validando"
pm2 restart camara-legislativo >/dev/null 2>&1 || (cd "$INSTALL_DIR" && pm2 start npm --name camara-legislativo -- start >/dev/null 2>&1)
pm2 save >/dev/null 2>&1 || true
sleep 4
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null || echo "000")
echo ""
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo -e "${GREEN}  INSTALAÇÃO CONCLUÍDA${NC}"
echo -e "  Health local: HTTP $HEALTH"
echo -e "  Acesse:  https://$SITE_DOMAIN"
echo -e "  Login:   $ADMIN_EMAIL"
echo -e "${GREEN}════════════════════════════════════════════${NC}"
