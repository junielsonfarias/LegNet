#!/bin/bash
# ============================================================================
# MIGRACAO DE DADOS - CAMARA MUNICIPAL DE CHAVES
# Executa todos os passos necessarios em sequencia
#
# Uso:
#   cd /opt/camara && bash scripts/migrar-dados-chaves.sh
# ============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

INSTALL_DIR="/opt/camara"
JSON_FILE="$INSTALL_DIR/docs/cm-chaves-limpo.json"
LOG_FILE="/var/log/camara-migracao.log"

log() { echo -e "  ${GREEN}✓${NC} $1"; echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"; }
warn() { echo -e "  ${YELLOW}!${NC} $1"; echo "[$(date '+%Y-%m-%d %H:%M:%S')] [AVISO] $1" >> "$LOG_FILE"; }
error() { echo -e "  ${RED}✗${NC} $1"; echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERRO] $1" >> "$LOG_FILE"; exit 1; }

echo -e "${CYAN}${BOLD}"
echo "  ╔══════════════════════════════════════════════════════╗"
echo "  ║                                                      ║"
echo "  ║    MIGRACAO DE DADOS - CAMARA DE CHAVES              ║"
echo "  ║    Portal Antigo (CR2) → Sistema LegNet              ║"
echo "  ║                                                      ║"
echo "  ╚══════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Verificar se esta no diretorio correto
if [ ! -d "$INSTALL_DIR/prisma" ]; then
  error "Execute este script do diretorio $INSTALL_DIR"
fi

cd "$INSTALL_DIR"

# Verificar se o JSON existe
if [ ! -f "$JSON_FILE" ]; then
  echo ""
  warn "Arquivo JSON nao encontrado: $JSON_FILE"
  echo ""
  echo -e "  ${YELLOW}Copie o arquivo para a VPS usando:${NC}"
  echo -e "  ${CYAN}scp \"docs/cm-chaves-MAXIMO (2).json\" root@$(hostname -I | awk '{print $1}'):${INSTALL_DIR}/docs/${NC}"
  echo ""
  exit 1
fi

echo ""
echo -e "  ${CYAN}Fonte:${NC} $JSON_FILE"
echo -e "  ${CYAN}Destino:${NC} Banco PostgreSQL local"
echo ""

# Confirmar
echo -en "  Deseja continuar com a migracao? [S/n]: "
read -r resposta
if [[ "$resposta" =~ ^[Nn] ]]; then
  echo "  Migracao cancelada."
  exit 0
fi

echo ""

# Etapa 1: Atualizar codigo
echo -e "\n  ${CYAN}▸ Etapa 1/5: Atualizando codigo...${NC}"
git pull origin main >> "$LOG_FILE" 2>&1 || true
log "Codigo atualizado"

# Etapa 2: Aplicar mudancas no schema
echo -e "\n  ${CYAN}▸ Etapa 2/5: Aplicando schema ao banco...${NC}"
npx prisma generate >> "$LOG_FILE" 2>&1
npx prisma db push >> "$LOG_FILE" 2>&1
log "Schema aplicado (novos campos: valorHomologado, numeroPortaria, dataPortaria, status)"

# Etapa 3: Criar diretorios de upload
echo -e "\n  ${CYAN}▸ Etapa 3/5: Preparando diretorios...${NC}"
mkdir -p "$INSTALL_DIR/public/uploads/parlamentares"
mkdir -p "$INSTALL_DIR/public/uploads/documentos"
mkdir -p "$INSTALL_DIR/public/uploads/contratos"
mkdir -p "$INSTALL_DIR/public/uploads/normas"
mkdir -p "$INSTALL_DIR/public/uploads/licitacoes"
log "Diretorios de upload criados"

# Etapa 4: Executar migracao
echo -e "\n  ${CYAN}▸ Etapa 4/5: Executando migracao de dados...${NC}"
echo ""
npx tsx prisma/migrate-chaves.ts 2>&1 | tee -a "$LOG_FILE"
echo ""
log "Migracao de dados concluida"

# Etapa 5: Rebuild e restart
echo -e "\n  ${CYAN}▸ Etapa 5/5: Recompilando e reiniciando...${NC}"
npm run build >> "$LOG_FILE" 2>&1
pm2 restart camara-legislativo >> "$LOG_FILE" 2>&1
log "Aplicacao recompilada e reiniciada"

# Resumo
echo ""
echo -e "${GREEN}${BOLD}"
echo "  ╔══════════════════════════════════════════════════════╗"
echo "  ║                                                      ║"
echo "  ║    MIGRACAO CONCLUIDA COM SUCESSO!                   ║"
echo "  ║                                                      ║"
echo "  ╚══════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "  ${GREEN}Dados migrados:${NC}"
echo -e "  ${GREEN}✓${NC} Parlamentares (fotos baixadas)"
echo -e "  ${GREEN}✓${NC} Materias Legislativas → Proposicoes"
echo -e "  ${GREEN}✓${NC} Normas Juridicas → Publicacoes (PDFs)"
echo -e "  ${GREEN}✓${NC} Contratos (PDFs)"
echo -e "  ${GREEN}✓${NC} Licitacoes"
echo -e "  ${GREEN}✓${NC} Diarias"
echo -e "  ${GREEN}✓${NC} Documentos Administrativos (PDFs)"
echo ""
echo -e "  ${CYAN}Arquivos baixados em:${NC} $INSTALL_DIR/public/uploads/"
echo -e "  ${CYAN}Log completo em:${NC} $LOG_FILE"
echo ""
echo -e "  ${BOLD}Verifique os dados em:${NC}"
echo -e "  • /admin/parlamentares"
echo -e "  • /admin/proposicoes"
echo -e "  • /admin/transparencia"
echo -e "  • /admin/contratos"
echo -e "  • /admin/licitacoes"
echo -e "  • /admin/diarias"
echo ""
