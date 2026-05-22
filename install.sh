#!/bin/bash
# ============================================================================
# INSTALADOR DO SISTEMA LEGISLATIVO - CAMARA MUNICIPAL
# Versao: 2.0
# Compativel: Ubuntu 20.04/22.04/24.04, Debian 11/12
# ============================================================================

set -uo pipefail

# ============================================================================
# CORES E FORMATACAO
# ============================================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

LOG_FILE="/var/log/camara-install.log"
INSTALL_DIR="/opt/camara"
REPO_URL="https://github.com/junielsonfarias/LegNet.git"

# ============================================================================
# PROGRESSO
# ============================================================================
TOTAL_STEPS=15
CURRENT_STEP=0
INSTALL_START_TIME=0

STEP_NAMES=(
  "Dependencias do sistema"
  "Node.js 20 LTS"
  "PostgreSQL 15"
  "Nginx"
  "Redis"
  "PM2"
  "Clonar repositorio"
  "Configuracao (.env)"
  "Dependencias npm"
  "Banco de dados (schema + tabelas)"
  "Compilar aplicacao"
  "Configurar Nginx"
  "Firewall e SSL"
  "Iniciar PM2"
  "Verificacao final"
)

progress_bar() {
  local current=$1
  local total=$2
  local pct=$((current * 100 / total))
  local filled=$((pct / 5))
  local empty=$((20 - filled))
  local bar=""

  for ((i=0; i<filled; i++)); do bar+="█"; done
  for ((i=0; i<empty; i++)); do bar+="░"; done

  # Tempo decorrido
  local elapsed=0
  if [ "$INSTALL_START_TIME" -gt 0 ]; then
    elapsed=$(( $(date +%s) - INSTALL_START_TIME ))
  fi
  local mins=$((elapsed / 60))
  local secs=$((elapsed % 60))

  # Limpar linha e imprimir barra
  printf "\r\033[K"
  printf "  ${CYAN}[${bar}]${NC} ${BOLD}%3d%%${NC}  ${BLUE}Etapa %d/%d${NC}  ${YELLOW}%02d:%02d${NC}" \
    "$pct" "$current" "$total" "$mins" "$secs"
}

step() {
  CURRENT_STEP=$((CURRENT_STEP + 1))
  local step_name="${1:-${STEP_NAMES[$((CURRENT_STEP-1))]}}"

  echo ""
  progress_bar "$CURRENT_STEP" "$TOTAL_STEPS"
  echo ""
  echo -e "  ${CYAN}▸ ${step_name}${NC}"
  echo ""
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [STEP $CURRENT_STEP/$TOTAL_STEPS] $step_name" >> "$LOG_FILE"
}

# ============================================================================
# FUNCOES UTILITARIAS
# ============================================================================

log() { echo -e "    ${GREEN}✓${NC} $1"; echo "[$(date '+%Y-%m-%d %H:%M:%S')] [OK] $1" >> "$LOG_FILE"; }
warn() { echo -e "    ${YELLOW}!${NC} $1"; echo "[$(date '+%Y-%m-%d %H:%M:%S')] [AVISO] $1" >> "$LOG_FILE"; }
error() { echo -e "    ${RED}✗${NC} $1"; echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERRO] $1" >> "$LOG_FILE"; }
info() { echo -e "    ${BLUE}→${NC} $1"; echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] $1" >> "$LOG_FILE"; }
header() {
  # Usado apenas nas etapas pre-instalacao (requisitos, coleta de dados)
  echo -e "\n${CYAN}${BOLD}  ── $1 ──${NC}\n"
}

check_command() {
  if ! command -v "$1" &> /dev/null; then
    return 1
  fi
  return 0
}

generate_secret() {
  openssl rand -base64 "$1" | tr -d '/+=' | head -c "$1"
}

# ============================================================================
# VERIFICACAO INICIAL
# ============================================================================

check_root() {
  if [ "$EUID" -ne 0 ]; then
    error "Este script deve ser executado como root (sudo)"
    echo -e "  Execute: ${BOLD}sudo bash install.sh${NC}"
    exit 1
  fi
}

check_os() {
  if [ ! -f /etc/os-release ]; then
    error "Sistema operacional nao suportado"
    exit 1
  fi

  . /etc/os-release

  case "$ID" in
    ubuntu)
      case "$VERSION_ID" in
        20.04|22.04|24.04) log "Sistema detectado: Ubuntu $VERSION_ID" ;;
        *) warn "Ubuntu $VERSION_ID nao foi testado. Recomendamos 22.04 ou 24.04" ;;
      esac
      ;;
    debian)
      case "$VERSION_ID" in
        11|12|13) log "Sistema detectado: Debian $VERSION_ID" ;;
        *) warn "Debian $VERSION_ID nao foi testado. Recomendamos 11, 12 ou 13" ;;
      esac
      ;;
    *)
      error "Sistema $ID nao suportado. Use Ubuntu 20.04+ ou Debian 11+"
      exit 1
      ;;
  esac
}

check_requirements() {
  header "VERIFICANDO REQUISITOS"

  # RAM minima: 1GB
  TOTAL_RAM=$(free -m | awk '/^Mem:/{print $2}')
  if [ "$TOTAL_RAM" -lt 1024 ]; then
    error "RAM insuficiente: ${TOTAL_RAM}MB (minimo: 1024MB)"
    exit 1
  fi
  log "RAM: ${TOTAL_RAM}MB (OK)"

  # Disco minimo: 5GB
  TOTAL_DISK=$(df -BG / | awk 'NR==2{print $4}' | tr -d 'G')
  if [ "$TOTAL_DISK" -lt 5 ]; then
    error "Espaco em disco insuficiente: ${TOTAL_DISK}GB (minimo: 5GB)"
    exit 1
  fi
  log "Disco disponivel: ${TOTAL_DISK}GB (OK)"

  check_os
}

# ============================================================================
# BANNER
# ============================================================================

show_banner() {
  clear
  echo -e "${CYAN}${BOLD}"
  echo "  ╔══════════════════════════════════════════════════════╗"
  echo "  ║                                                      ║"
  echo "  ║    SISTEMA LEGISLATIVO - CAMARA MUNICIPAL            ║"
  echo "  ║    Instalador Automatizado para VPS Linux            ║"
  echo "  ║    Versao 3.1                                        ║"
  echo "  ║                                                      ║"
  echo "  ╚══════════════════════════════════════════════════════╝"
  echo -e "${NC}"
}

# ============================================================================
# DETECCAO DE INSTALACAO EXISTENTE
# ============================================================================

INSTALL_MODE="fresh"  # fresh | update | reinstall

detect_existing_installation() {
  # Verificar se ja existe uma instalacao
  if [ ! -d "$INSTALL_DIR" ] || [ ! -f "$INSTALL_DIR/package.json" ]; then
    INSTALL_MODE="fresh"
    echo -e "  ${GREEN}Nova instalacao detectada${NC}"
    echo -e "  Este instalador ira configurar automaticamente:"
    echo -e "  ${GREEN}✓${NC} PostgreSQL 15 (banco de dados)"
    echo -e "  ${GREEN}✓${NC} Node.js 20 LTS"
    echo -e "  ${GREEN}✓${NC} Nginx (servidor web)"
    echo -e "  ${GREEN}✓${NC} PM2 (gerenciador de processos)"
    echo -e "  ${GREEN}✓${NC} SSL/HTTPS (Let's Encrypt)"
    echo -e "  ${GREEN}✓${NC} Firewall (UFW)"
    echo -e "  ${GREEN}✓${NC} Sistema legislativo completo"
    echo ""
    return
  fi

  # Existe instalacao - ler dados
  local existing_version=""
  if [ -f "$INSTALL_DIR/package.json" ]; then
    existing_version=$(grep -o '"version": *"[^"]*"' "$INSTALL_DIR/package.json" | head -1 | cut -d'"' -f4)
  fi

  local existing_env=""
  if [ -f "$INSTALL_DIR/.env" ]; then
    existing_env="Configurado"
  else
    existing_env="Sem .env"
  fi

  local pm2_status="Parado"
  if check_command pm2 && pm2 list 2>/dev/null | grep -q "online"; then
    pm2_status="Rodando"
  fi

  local db_status="Desconhecido"
  if check_command psql && sudo -u postgres psql -lqt 2>/dev/null | grep -q "camara_legislativo"; then
    db_status="Ativo (com dados)"
  fi

  echo -e "${YELLOW}${BOLD}"
  echo "  ┌──────────────────────────────────────────────┐"
  echo "  │   INSTALACAO EXISTENTE DETECTADA!             │"
  echo "  └──────────────────────────────────────────────┘"
  echo -e "${NC}"
  echo -e "  ${CYAN}Diretorio:${NC}    $INSTALL_DIR"
  echo -e "  ${CYAN}Versao:${NC}       ${existing_version:-desconhecida}"
  echo -e "  ${CYAN}Ambiente:${NC}     ${existing_env}"
  echo -e "  ${CYAN}Aplicacao:${NC}    ${pm2_status}"
  echo -e "  ${CYAN}Banco:${NC}        ${db_status}"
  echo ""
  echo -e "  Escolha uma opcao:"
  echo ""
  echo -e "  ${GREEN}1)${NC} ${BOLD}Atualizar${NC} - Atualiza o codigo e recompila"
  echo -e "     Mantem banco de dados, configuracoes e dados existentes"
  echo ""
  echo -e "  ${YELLOW}2)${NC} ${BOLD}Reinstalar${NC} - Instalacao limpa do zero"
  echo -e "     ${RED}APAGA TUDO: banco, configuracoes, dados, arquivos${NC}"
  echo ""
  echo -e "  ${BLUE}3)${NC} ${BOLD}Cancelar${NC} - Sair sem fazer nada"
  echo ""

  while true; do
    read -rp "$(echo -e ${CYAN}Opcao [1/2/3]${NC}: )" CHOICE < /dev/tty
    case "$CHOICE" in
      1)
        INSTALL_MODE="update"
        log "Modo selecionado: ATUALIZACAO"
        break
        ;;
      2)
        INSTALL_MODE="reinstall"
        echo ""
        echo -e "  ${RED}${BOLD}ATENCAO: Todos os dados serao APAGADOS permanentemente!${NC}"
        echo -e "  ${RED}Isso inclui: parlamentares, sessoes, votacoes, noticias, etc.${NC}"
        echo ""
        read -rp "$(echo -e ${RED}Tem certeza que deseja apagar tudo?${NC} Digite ${BOLD}SIM${NC} para confirmar: )" CONFIRM_DELETE < /dev/tty
        if [ "$CONFIRM_DELETE" != "SIM" ]; then
          warn "Reinstalacao cancelada"
          exit 0
        fi
        log "Modo selecionado: REINSTALACAO LIMPA"
        break
        ;;
      3)
        info "Instalacao cancelada"
        exit 0
        ;;
      *)
        warn "Opcao invalida! Digite 1, 2 ou 3"
        ;;
    esac
  done
}

# ============================================================================
# FUNCOES DE ATUALIZACAO
# ============================================================================

do_update() {
  header "ATUALIZANDO SISTEMA"

  # Perguntar se quer alterar identidade visual
  echo ""
  read -rp "$(echo -e ${CYAN}Deseja alterar a identidade visual \(cores do portal\)?${NC} [s/N]: )" CHANGE_THEME < /dev/tty
  CHANGE_THEME="${CHANGE_THEME,,}"
  if [ "$CHANGE_THEME" = "s" ]; then
    select_identity
    UPDATE_THEME=true
  else
    UPDATE_THEME=false
    COR_PRIMARIA=""
    COR_SECUNDARIA=""
    COR_ACENTO=""
  fi

  INSTALL_START_TIME=$(date +%s)
  TOTAL_STEPS=6
  CURRENT_STEP=0

  # Etapa 1: Parar aplicacao
  step "Parando aplicacao"
  if check_command pm2; then
    pm2 stop all >> "$LOG_FILE" 2>&1 || true
    log "Aplicacao parada"
  fi

  # Etapa 2: Backup rapido
  step "Backup de seguranca"
  local BACKUP_DIR="/opt/backups/pre-update-$(date +%Y%m%d_%H%M%S)"
  mkdir -p "$BACKUP_DIR"
  cp "${INSTALL_DIR}/.env" "$BACKUP_DIR/.env.backup" 2>/dev/null || true
  if check_command pg_dump; then
    sudo -u postgres pg_dump camara_legislativo 2>/dev/null | gzip > "$BACKUP_DIR/db_backup.sql.gz" || true
  fi
  log "Backup salvo em $BACKUP_DIR"

  # Etapa 3: Atualizar codigo
  step "Baixando atualizacoes"
  cd "$INSTALL_DIR"
  git stash >> "$LOG_FILE" 2>&1 || true
  git pull origin main >> "$LOG_FILE" 2>&1
  log "Codigo atualizado"

  # Etapa 4: Dependencias
  step "Atualizando dependencias"
  npm ci --production=false >> "$LOG_FILE" 2>&1 || {
    warn "npm ci falhou, tentando npm install..."
    rm -rf node_modules >> "$LOG_FILE" 2>&1
    npm install --production=false >> "$LOG_FILE" 2>&1
  }
  npx prisma generate >> "$LOG_FILE" 2>&1
  log "Dependencias atualizadas"

  # Adicionar variaveis ausentes ao .env (migracao de versoes antigas)
  if [ -f "${INSTALL_DIR}/.env" ]; then
    if ! grep -q "^INTERNAL_API_SECRET=" "${INSTALL_DIR}/.env"; then
      local NEW_INTERNAL_SECRET
      NEW_INTERNAL_SECRET=$(generate_secret 32)
      echo "" >> "${INSTALL_DIR}/.env"
      echo "# --- Seguranca (adicionado em update) ---" >> "${INSTALL_DIR}/.env"
      echo "INTERNAL_API_SECRET=\"${NEW_INTERNAL_SECRET}\"" >> "${INSTALL_DIR}/.env"
      log "INTERNAL_API_SECRET adicionado ao .env"
    fi
  fi

  # Etapa 5: Banco de dados
  step "Atualizando banco de dados"

  # 5a) Garantir que TODAS as tabelas e sequences tenham OWNER = camara_app
  # (evita "must be owner of table X" no db push). Roda como superuser postgres.
  local DB_USER_RUNTIME="${DB_USER:-camara_app}"
  if [ -f "${INSTALL_DIR}/scripts/sql/fix-table-ownership.sql" ]; then
    sudo -u postgres psql camara_legislativo \
      -v "db_user=${DB_USER_RUNTIME}" \
      -f "${INSTALL_DIR}/scripts/sql/fix-table-ownership.sql" \
      >> "$LOG_FILE" 2>&1 || warn "fix-table-ownership.sql retornou erro - verifique $LOG_FILE"
  fi

  # 5b) Aplicar schema do Prisma
  # --accept-data-loss aceita avisos automaticamente (necessario porque stdout
  # esta redirecionado e prompts interativos receberiam "no" como default,
  # cancelando o push silenciosamente). Nao implica perda real - apenas autoriza
  # migracoes "potencialmente arriscadas" (UNIQUE, ALTER TYPE).
  if ! npx prisma db push --accept-data-loss --skip-generate >> "$LOG_FILE" 2>&1; then
    error "Falha ao aplicar schema do banco - verifique $LOG_FILE"
    warn "Possiveis causas: duplicatas que violam constraint UNIQUE, conexao ao banco, schema invalido"
    warn "Comando manual: cd ${INSTALL_DIR} && npx prisma db push --accept-data-loss"
    exit 1
  fi
  log "Schema do banco atualizado (novas tabelas criadas, dados preservados)"

  # 5c) Migracoes SQL idempotentes pos-schema (criam tabelas que o Prisma nao
  # cria automaticamente quando ja existem indices/constraints conflitantes)
  if [ -f "${INSTALL_DIR}/scripts/sql/add-cotas-parlamentar.sql" ]; then
    sudo -u postgres psql camara_legislativo \
      -f "${INSTALL_DIR}/scripts/sql/add-cotas-parlamentar.sql" \
      >> "$LOG_FILE" 2>&1 || warn "add-cotas-parlamentar.sql retornou aviso - verifique $LOG_FILE"
    # Reaplicar ownership porque a tabela recem-criada pode ter ficado com owner=postgres
    if [ -f "${INSTALL_DIR}/scripts/sql/fix-table-ownership.sql" ]; then
      sudo -u postgres psql camara_legislativo \
        -v "db_user=${DB_USER_RUNTIME}" \
        -f "${INSTALL_DIR}/scripts/sql/fix-table-ownership.sql" \
        >> "$LOG_FILE" 2>&1 || true
    fi
  fi

  # 5d) PLANO-CORRECOES-MAIO-2026 — F1.1: cpfHash em Ouvidoria + e-SIC (RN-166)
  if [ -f "${INSTALL_DIR}/scripts/sql/add-cpf-hash-ouvidoria-esic.sql" ]; then
    sudo -u postgres psql camara_legislativo \
      -f "${INSTALL_DIR}/scripts/sql/add-cpf-hash-ouvidoria-esic.sql" \
      >> "$LOG_FILE" 2>&1 || warn "add-cpf-hash-ouvidoria-esic.sql retornou aviso - verifique $LOG_FILE"
    log "Migration F1.1 aplicada (cpfHash em Ouvidoria + e-SIC)"
  fi

  # 5e) PLANO-CORRECOES-MAIO-2026 — F3.5: 13 indices FK ausentes
  if [ -f "${INSTALL_DIR}/scripts/sql/add-fk-indexes-2026-05.sql" ]; then
    sudo -u postgres psql camara_legislativo \
      -f "${INSTALL_DIR}/scripts/sql/add-fk-indexes-2026-05.sql" \
      >> "$LOG_FILE" 2>&1 || warn "add-fk-indexes-2026-05.sql retornou aviso - verifique $LOG_FILE"
    log "Migration F3.5 aplicada (indices FK em 8 modelos)"
  fi

  # 5h) RN-168: Publicacao Direta de Proposicoes — coluna documentos JSONB
  if [ -f "${INSTALL_DIR}/scripts/sql/add-proposicao-documentos.sql" ]; then
    sudo -u postgres psql camara_legislativo \
      -f "${INSTALL_DIR}/scripts/sql/add-proposicao-documentos.sql" \
      >> "$LOG_FILE" 2>&1 || warn "add-proposicao-documentos.sql retornou aviso - verifique $LOG_FILE"
    log "Migration RN-168 aplicada (documentos JSONB em proposicoes)"
  fi

  # 5i) RN-169: Publicacao Direta de Documentos Administrativos
  #     - documentos JSONB em publicacoes
  #     - valores novos no enum TipoPublicacao (ATA_SESSAO, ATO_MESA, etc)
  if [ -f "${INSTALL_DIR}/scripts/sql/add-publicacao-documentos-tipos.sql" ]; then
    sudo -u postgres psql camara_legislativo \
      -f "${INSTALL_DIR}/scripts/sql/add-publicacao-documentos-tipos.sql" \
      >> "$LOG_FILE" 2>&1 || warn "add-publicacao-documentos-tipos.sql retornou aviso - verifique $LOG_FILE"
    log "Migration RN-169 aplicada (documentos JSONB + tipos administrativos em publicacoes)"
  fi

  # 5j) RN-172: Pauta/Ata de Reuniao de Comissao
  #     - arquivoAta, arquivoPauta, dataPublicacaoAta, dataPublicacaoPauta em reunioes_comissao
  if [ -f "${INSTALL_DIR}/scripts/sql/add-reuniao-comissao-arquivos.sql" ]; then
    sudo -u postgres psql camara_legislativo \
      -f "${INSTALL_DIR}/scripts/sql/add-reuniao-comissao-arquivos.sql" \
      >> "$LOG_FILE" 2>&1 || warn "add-reuniao-comissao-arquivos.sql retornou aviso - verifique $LOG_FILE"
    log "Migration RN-172 aplicada (arquivos de ata/pauta em reunioes de comissao)"
  fi

  # 5k) RN-174: Publicacao de Emenda
  #     - arquivoUrl, arquivoNome, dataPublicacao em emendas
  if [ -f "${INSTALL_DIR}/scripts/sql/add-emenda-arquivos.sql" ]; then
    sudo -u postgres psql camara_legislativo \
      -f "${INSTALL_DIR}/scripts/sql/add-emenda-arquivos.sql" \
      >> "$LOG_FILE" 2>&1 || warn "add-emenda-arquivos.sql retornou aviso - verifique $LOG_FILE"
    log "Migration RN-174 aplicada (arquivo PDF + dataPublicacao em emendas)"
  fi

  # 5l) Commit C gaps CR2: planos de cargos, cargos, valores de diaria, fornecedores
  if [ -f "${INSTALL_DIR}/scripts/sql/add-cargos-diarias-fornecedores.sql" ]; then
    sudo -u postgres psql camara_legislativo \
      -f "${INSTALL_DIR}/scripts/sql/add-cargos-diarias-fornecedores.sql" \
      >> "$LOG_FILE" 2>&1 || warn "add-cargos-diarias-fornecedores.sql retornou aviso - verifique $LOG_FILE"
    log "Migration Commit C aplicada (planos de cargos, cargos, valores de diaria, fornecedores)"
  fi

  # 5f) Reaplicar ownership apos novas migrations criarem objetos
  if [ -f "${INSTALL_DIR}/scripts/sql/fix-table-ownership.sql" ]; then
    sudo -u postgres psql camara_legislativo \
      -v "db_user=${DB_USER_RUNTIME}" \
      -f "${INSTALL_DIR}/scripts/sql/fix-table-ownership.sql" \
      >> "$LOG_FILE" 2>&1 || true
  fi

  # 5g) Backfill de CPF (criptografia + cpfHash) — idempotente; pula registros ja migrados
  # Cobre Servidor (Fase 1 Q2), ManifestacaoOuvidoria e SolicitacaoESIC (F1.1 Maio/26).
  if [ -f "${INSTALL_DIR}/scripts/backfill-cpf-encryption.ts" ]; then
    info "Rodando backfill de CPF (criptografia + cpfHash)..."
    if ! npx tsx scripts/backfill-cpf-encryption.ts >> "$LOG_FILE" 2>&1; then
      warn "backfill-cpf-encryption.ts retornou erro - verifique $LOG_FILE"
      warn "Comando manual: cd ${INSTALL_DIR} && npx tsx scripts/backfill-cpf-encryption.ts --dry-run"
    else
      log "Backfill de CPF concluido (idempotente)"
    fi
  fi

  # Aplicar identidade visual se solicitado
  if [ "$UPDATE_THEME" = true ]; then
    info "Aplicando nova identidade visual..."
    cat > /tmp/update-theme.ts << 'TSEOF'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const corPrimaria = process.env.COR_PRIMARIA!
  const corSecundaria = process.env.COR_SECUNDARIA!
  const corAcento = process.env.COR_ACENTO!
  await prisma.configuracaoInstitucional.upsert({
    where: { slug: 'principal' },
    update: { corPrimaria, corSecundaria, corAcento },
    create: {
      slug: 'principal',
      nomeCasa: 'Camara Municipal',
      tipoEnte: 'CAMARA_MUNICIPAL',
      corPrimaria, corSecundaria, corAcento
    }
  })
  console.log('Identidade visual atualizada:', corPrimaria, '/', corSecundaria, '/', corAcento)
}
main().catch(console.error).finally(() => prisma.$disconnect())
TSEOF
    COR_PRIMARIA="$COR_PRIMARIA" \
    COR_SECUNDARIA="$COR_SECUNDARIA" \
    COR_ACENTO="$COR_ACENTO" \
    npx tsx /tmp/update-theme.ts >> "$LOG_FILE" 2>&1
    rm -f /tmp/update-theme.ts
    log "Identidade visual atualizada: ${COR_PRIMARIA} / ${COR_SECUNDARIA} / ${COR_ACENTO}"
  fi

  # Etapa 6: Build, Nginx e restart
  step "Recompilando e reiniciando"
  if ! npm run build >> "$LOG_FILE" 2>&1; then
    error "Build do Next.js falhou - verifique $LOG_FILE"
    warn "Comando manual: cd ${INSTALL_DIR} && npm run build"
    exit 1
  fi

  # Garantir pastas necessarias existem
  mkdir -p "${INSTALL_DIR}/public/uploads/parlamentares" 2>/dev/null
  mkdir -p "${INSTALL_DIR}/public/uploads/documentos" 2>/dev/null
  mkdir -p "${INSTALL_DIR}/public/uploads/anexos" 2>/dev/null

  # Atualizar Nginx se configuracao mudou
  if [ -f /etc/nginx/sites-available/camara ]; then
    local NGINX_CHANGED=false

    # Adicionar bloco /uploads/ se nao existe
    if ! grep -q "location /uploads/" /etc/nginx/sites-available/camara; then
      sed -i '/# Upload de arquivos/i\    # Servir arquivos de upload (fotos, documentos)\n    location /uploads/ {\n        alias '"${INSTALL_DIR}"'/public/uploads/;\n        expires 30d;\n        add_header Cache-Control "public, max-age=2592000";\n        try_files $uri =404;\n    }\n' /etc/nginx/sites-available/camara
      NGINX_CHANGED=true
      log "Nginx: bloco /uploads/ adicionado"
    fi

    # Remover Content-Security-Policy do nginx (conflita com middleware Next.js)
    if grep -q "add_header Content-Security-Policy" /etc/nginx/sites-available/camara; then
      sed -i '/add_header Content-Security-Policy/d' /etc/nginx/sites-available/camara
      NGINX_CHANGED=true
      log "Nginx: CSP removido (agora controlado pelo middleware Next.js)"
    fi

    if [ "$NGINX_CHANGED" = true ]; then
      nginx -t >> "$LOG_FILE" 2>&1 && systemctl reload nginx >> "$LOG_FILE" 2>&1
      log "Nginx recarregado"
    fi
  fi

  # Verificar se o build gerou a pasta .next corretamente
  if [ ! -d "${INSTALL_DIR}/.next" ]; then
    error "Build falhou - pasta .next nao encontrada"
    warn "Verifique o log: tail -100 $LOG_FILE"
    exit 1
  fi

  # restart funciona se o processo esta online ou stopped, mas falha se foi deletado.
  # Fallback: tentar start via ecosystem se restart falhar.
  if ! pm2 restart camara-legislativo >> "$LOG_FILE" 2>&1; then
    info "pm2 restart falhou - tentando start..."
    if [ -f "${INSTALL_DIR}/ecosystem.config.js" ]; then
      pm2 start "${INSTALL_DIR}/ecosystem.config.js" >> "$LOG_FILE" 2>&1 || true
    else
      cd "$INSTALL_DIR" && pm2 start npm --name camara-legislativo -- start >> "$LOG_FILE" 2>&1 || true
    fi
  fi
  pm2 save >> "$LOG_FILE" 2>&1 || true

  # Aguardar app iniciar e verificar
  sleep 5
  if pm2 list 2>/dev/null | grep -q "errored\|stopped"; then
    warn "PM2 reportou erro - verificando logs..."
    pm2 logs --nostream --lines 20 >> "$LOG_FILE" 2>&1
    # Tentar mais uma vez
    pm2 restart camara-legislativo >> "$LOG_FILE" 2>&1 || true
    sleep 5
  fi
  log "Aplicacao recompilada e reiniciada"

  # Barra final
  echo ""
  progress_bar "$TOTAL_STEPS" "$TOTAL_STEPS"
  echo ""

  local total_time=$(( $(date +%s) - INSTALL_START_TIME ))
  local total_mins=$((total_time / 60))
  local total_secs=$((total_time % 60))

  echo ""
  echo -e "${GREEN}${BOLD}"
  echo "  ╔══════════════════════════════════════════════════════╗"
  echo "  ║                                                      ║"
  echo "  ║    ATUALIZACAO CONCLUIDA COM SUCESSO!                ║"
  echo "  ║                                                      ║"
  echo "  ╚══════════════════════════════════════════════════════╝"
  echo -e "${NC}"
  echo -e "  ${GREEN}Tempo total: ${total_mins}m ${total_secs}s${NC}"
  echo -e "  ${CYAN}Backup:${NC} $BACKUP_DIR"
  echo ""
  echo -e "  ${BOLD}Seus dados foram preservados:${NC}"
  echo -e "  ${GREEN}✓${NC} Banco de dados intacto (novas tabelas criadas automaticamente)"
  echo -e "  ${GREEN}✓${NC} Configuracoes (.env) mantidas"
  echo -e "  ${GREEN}✓${NC} Parlamentares, sessoes, votacoes preservados"
  echo -e "  ${GREEN}✓${NC} Novos modulos disponiveis: e-SIC, Ouvidoria, Organograma"
  echo -e "  ${GREEN}✓${NC} Novos modulos disponiveis: Diarias, Verbas, Concursos"
  if [ "$UPDATE_THEME" = true ]; then
    echo -e "  ${GREEN}✓${NC} Identidade visual atualizada: ${COR_PRIMARIA} / ${COR_SECUNDARIA} / ${COR_ACENTO}"
  fi
  echo ""

  # Verificar
  sleep 2
  if pm2 list | grep -q "online"; then
    log "Aplicacao online"
    echo -e "  ${GREEN}✓${NC} Aplicacao respondendo normalmente"
  else
    warn "Aplicacao pode levar alguns segundos para iniciar"
  fi
  echo ""
}

do_clean_reinstall() {
  info "Removendo instalacao anterior..."

  # Parar PM2
  if check_command pm2; then
    pm2 stop all >> "$LOG_FILE" 2>&1 || true
    pm2 delete all >> "$LOG_FILE" 2>&1 || true
  fi

  # Backup de emergencia do banco (por seguranca)
  local EMERGENCY_BACKUP="/opt/backups/emergency-$(date +%Y%m%d_%H%M%S)"
  mkdir -p "$EMERGENCY_BACKUP"
  if check_command psql && sudo -u postgres psql -lqt 2>/dev/null | grep -q "camara_legislativo"; then
    info "Salvando backup de emergencia do banco antes de apagar..."
    sudo -u postgres pg_dump camara_legislativo 2>/dev/null | gzip > "$EMERGENCY_BACKUP/db_antes_reinstalar.sql.gz" || true
    warn "Backup de emergencia salvo em $EMERGENCY_BACKUP"
  fi

  # Dropar banco
  if check_command psql; then
    sudo -u postgres psql -c "DROP DATABASE IF EXISTS camara_legislativo;" >> "$LOG_FILE" 2>&1 || true
    info "Banco de dados removido"
  fi

  # Remover diretorio
  rm -rf "$INSTALL_DIR"
  log "Diretorio $INSTALL_DIR removido"
  log "Instalacao anterior removida completamente"
}

# ============================================================================
# IDENTIDADE VISUAL
# ============================================================================

# Temas predefinidos: nome|corPrimaria|corSecundaria|corAcento
TEMAS_PREDEFINIDOS=(
  "Azul Institucional|#1e40af|#3b82f6|#059669"
  "Verde Amazonia|#065f46|#10b981|#0891b2"
  "Vermelho Republicano|#991b1b|#dc2626|#ca8a04"
  "Marrom Terra|#78350f|#a16207|#047857"
  "Roxo Legislativo|#581c87|#7c3aed|#0891b2"
  "Cinza Moderno|#1f2937|#4b5563|#0d9488"
  "Dourado Oficial|#713f12|#b45309|#1d4ed8"
  "Azul Marinho|#0c4a6e|#0284c7|#f59e0b"
)

select_identity() {
  echo ""
  echo -e "  ${BOLD}=== IDENTIDADE VISUAL ===${NC}"
  echo -e "  ${YELLOW}Escolha o tema de cores do portal:${NC}"
  echo ""

  local i=1
  for tema in "${TEMAS_PREDEFINIDOS[@]}"; do
    local nome=$(echo "$tema" | cut -d'|' -f1)
    local cor1=$(echo "$tema" | cut -d'|' -f2)
    local cor2=$(echo "$tema" | cut -d'|' -f3)
    local cor3=$(echo "$tema" | cut -d'|' -f4)
    echo -e "  ${GREEN}${i})${NC} ${BOLD}${nome}${NC}"
    echo -e "     Primaria: ${cor1}  Secundaria: ${cor2}  Acento: ${cor3}"
    i=$((i + 1))
  done

  echo ""
  echo -e "  ${GREEN}${i})${NC} ${BOLD}Personalizado${NC} - Informe suas proprias cores (hex)"
  echo ""

  local max_option=$i
  while true; do
    read -rp "$(echo -e ${CYAN}Opcao [1-${max_option}]${NC} [1]: )" TEMA_ESCOLHA < /dev/tty
    TEMA_ESCOLHA="${TEMA_ESCOLHA:-1}"

    if [[ "$TEMA_ESCOLHA" =~ ^[0-9]+$ ]] && [ "$TEMA_ESCOLHA" -ge 1 ] && [ "$TEMA_ESCOLHA" -le "$max_option" ]; then
      break
    fi
    warn "Opcao invalida! Digite um numero de 1 a ${max_option}"
  done

  if [ "$TEMA_ESCOLHA" -eq "$max_option" ]; then
    # Personalizado
    echo ""
    echo -e "  ${YELLOW}Informe as cores em formato hexadecimal (ex: #1e40af)${NC}"
    echo ""

    while true; do
      read -rp "$(echo -e ${CYAN}Cor primaria${NC} [#1e40af]: )" COR_PRIMARIA < /dev/tty
      COR_PRIMARIA="${COR_PRIMARIA:-#1e40af}"
      if echo "$COR_PRIMARIA" | grep -qE '^#[0-9a-fA-F]{6}$'; then break; fi
      warn "Formato invalido! Use #RRGGBB (ex: #1e40af)"
    done

    while true; do
      read -rp "$(echo -e ${CYAN}Cor secundaria${NC} [#3b82f6]: )" COR_SECUNDARIA < /dev/tty
      COR_SECUNDARIA="${COR_SECUNDARIA:-#3b82f6}"
      if echo "$COR_SECUNDARIA" | grep -qE '^#[0-9a-fA-F]{6}$'; then break; fi
      warn "Formato invalido! Use #RRGGBB (ex: #3b82f6)"
    done

    while true; do
      read -rp "$(echo -e ${CYAN}Cor de acento${NC} [#059669]: )" COR_ACENTO < /dev/tty
      COR_ACENTO="${COR_ACENTO:-#059669}"
      if echo "$COR_ACENTO" | grep -qE '^#[0-9a-fA-F]{6}$'; then break; fi
      warn "Formato invalido! Use #RRGGBB (ex: #059669)"
    done

    TEMA_NOME="Personalizado"
  else
    # Predefinido
    local tema="${TEMAS_PREDEFINIDOS[$((TEMA_ESCOLHA - 1))]}"
    TEMA_NOME=$(echo "$tema" | cut -d'|' -f1)
    COR_PRIMARIA=$(echo "$tema" | cut -d'|' -f2)
    COR_SECUNDARIA=$(echo "$tema" | cut -d'|' -f3)
    COR_ACENTO=$(echo "$tema" | cut -d'|' -f4)
  fi

  info "Tema selecionado: ${TEMA_NOME} (${COR_PRIMARIA} / ${COR_SECUNDARIA} / ${COR_ACENTO})"
}

# ============================================================================
# COLETA DE DADOS
# ============================================================================

collect_data() {
  header "CONFIGURACAO DA CAMARA"

  echo -e "${BOLD}Responda as perguntas abaixo para configurar o sistema:${NC}\n"

  # Nome da Camara
  read -rp "$(echo -e ${CYAN}Nome da Camara Municipal${NC} [ex: Camara Municipal de Sua Cidade]: )" CAMARA_NOME < /dev/tty
  CAMARA_NOME="${CAMARA_NOME:-Camara Municipal}"

  # Dominio ou IP
  echo ""
  echo -e "  ${YELLOW}Informe o dominio OU o IP do servidor.${NC}"
  echo -e "  Exemplos: ${BOLD}camara.suacidade.gov.br${NC} ou ${BOLD}187.77.252.170${NC}"
  echo -e "  ${YELLOW}NAO inclua http:// ou https:// nem barra final.${NC}"
  echo ""
  read -rp "$(echo -e ${CYAN}Dominio ou IP${NC}: )" SITE_DOMAIN < /dev/tty
  while [ -z "$SITE_DOMAIN" ]; do
    warn "Dominio ou IP e obrigatorio!"
    read -rp "$(echo -e ${CYAN}Dominio ou IP${NC}: )" SITE_DOMAIN < /dev/tty
  done

  # Sanitizar: remover protocolo, barras, espacos
  SITE_DOMAIN=$(echo "$SITE_DOMAIN" | sed -E 's|^https?://||; s|/+$||; s|^www\.||; s|[[:space:]]||g')

  # Detectar se e IP ou dominio
  IS_IP=false
  if echo "$SITE_DOMAIN" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$'; then
    IS_IP=true
    info "Detectado IP: $SITE_DOMAIN (SSL nao sera configurado)"
  elif echo "$SITE_DOMAIN" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+:[0-9]+$'; then
    IS_IP=true
    info "Detectado IP com porta: $SITE_DOMAIN (SSL nao sera configurado)"
  else
    info "Detectado dominio: $SITE_DOMAIN"
  fi

  # Email admin
  echo ""
  read -rp "$(echo -e ${CYAN}Email do administrador${NC} [ex: admin@camara.gov.br]: )" ADMIN_EMAIL < /dev/tty
  ADMIN_EMAIL="${ADMIN_EMAIL:-admin@${SITE_DOMAIN}}"

  # Senha admin
  echo ""
  while true; do
    read -srp "$(echo -e ${CYAN}Senha do administrador${NC} [minimo 8 caracteres]: )" ADMIN_PASSWORD < /dev/tty
    echo ""
    if [ ${#ADMIN_PASSWORD} -lt 8 ]; then
      warn "Senha deve ter no minimo 8 caracteres!"
      continue
    fi
    read -srp "$(echo -e ${CYAN}Confirme a senha${NC}: )" ADMIN_PASSWORD_CONFIRM < /dev/tty
    echo ""
    if [ "$ADMIN_PASSWORD" != "$ADMIN_PASSWORD_CONFIRM" ]; then
      warn "Senhas nao conferem!"
      continue
    fi
    break
  done

  # Senha banco de dados
  echo ""
  info "Gerando senha segura para o banco de dados..."
  DB_PASSWORD=$(generate_secret 32)
  log "Senha do banco gerada automaticamente"

  # Email SSL
  echo ""
  read -rp "$(echo -e ${CYAN}Email para certificado SSL${NC} [${ADMIN_EMAIL}]: )" SSL_EMAIL < /dev/tty
  SSL_EMAIL="${SSL_EMAIL:-$ADMIN_EMAIL}"

  # Identidade Visual
  select_identity

  # Redis
  echo ""
  read -rp "$(echo -e ${CYAN}Instalar Redis para rate limiting?${NC} [s/N]: )" INSTALL_REDIS < /dev/tty
  INSTALL_REDIS="${INSTALL_REDIS,,}"

  # Repositorio
  echo ""
  read -rp "$(echo -e ${CYAN}URL do repositorio Git${NC} [${REPO_URL}]: )" CUSTOM_REPO < /dev/tty
  REPO_URL="${CUSTOM_REPO:-$REPO_URL}"

  # Diretorio de instalacao
  echo ""
  read -rp "$(echo -e ${CYAN}Diretorio de instalacao${NC} [${INSTALL_DIR}]: )" CUSTOM_DIR < /dev/tty
  INSTALL_DIR="${CUSTOM_DIR:-$INSTALL_DIR}"

  # Gerar secrets
  NEXTAUTH_SECRET=$(generate_secret 48)
  INTERNAL_API_SECRET=$(generate_secret 32)
  DB_NAME="camara_legislativo"
  DB_USER="camara_app"

  # Definir protocolo e URL
  if [ "$IS_IP" = true ]; then
    SITE_URL="http://${SITE_DOMAIN}"
  else
    SITE_URL="https://${SITE_DOMAIN}"
  fi

  # Confirmar
  header "CONFIRME AS CONFIGURACOES"
  echo -e "  ${BOLD}Camara:${NC}       $CAMARA_NOME"
  echo -e "  ${BOLD}Dominio/IP:${NC}   $SITE_DOMAIN"
  echo -e "  ${BOLD}URL:${NC}          $SITE_URL"
  echo -e "  ${BOLD}Email Admin:${NC}  $ADMIN_EMAIL"
  echo -e "  ${BOLD}Tema:${NC}         $TEMA_NOME ($COR_PRIMARIA / $COR_SECUNDARIA / $COR_ACENTO)"
  echo -e "  ${BOLD}Banco:${NC}        PostgreSQL local ($DB_NAME)"
  echo -e "  ${BOLD}Redis:${NC}        $([ "$INSTALL_REDIS" = "s" ] && echo 'Sim' || echo 'Nao')"
  echo -e "  ${BOLD}Diretorio:${NC}    $INSTALL_DIR"
  echo -e "  ${BOLD}Repositorio:${NC}  $REPO_URL"
  echo ""

  read -rp "$(echo -e ${YELLOW}Tudo correto? Iniciar instalacao?${NC} [S/n]: )" CONFIRM < /dev/tty
  if [ "${CONFIRM,,}" = "n" ]; then
    warn "Instalacao cancelada pelo usuario"
    exit 0
  fi
}

# ============================================================================
# INSTALACAO DE DEPENDENCIAS
# ============================================================================

install_system_deps() {
  header "INSTALANDO DEPENDENCIAS DO SISTEMA"

  info "Atualizando pacotes do sistema..."
  apt-get update >> "$LOG_FILE" 2>&1 || { error "Falha ao atualizar lista de pacotes"; }
  DEBIAN_FRONTEND=noninteractive apt-get upgrade -y >> "$LOG_FILE" 2>&1 || warn "Alguns pacotes nao puderam ser atualizados"
  log "Sistema atualizado"

  info "Instalando pacotes essenciais..."
  DEBIAN_FRONTEND=noninteractive apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    unzip \
    openssl \
    >> "$LOG_FILE" 2>&1

  if [ $? -ne 0 ]; then
    error "Falha ao instalar pacotes essenciais. Verifique o log: $LOG_FILE"
    error "Tentando instalar pacotes individualmente..."
    for pkg in curl wget git build-essential ca-certificates gnupg lsb-release unzip openssl; do
      DEBIAN_FRONTEND=noninteractive apt-get install -y "$pkg" >> "$LOG_FILE" 2>&1 || warn "Pacote $pkg nao instalado"
    done
  fi
  log "Pacotes essenciais instalados"
}

install_nodejs() {
  header "INSTALANDO NODE.JS 20 LTS"

  if check_command node; then
    NODE_VERSION=$(node -v | tr -d 'v' | cut -d. -f1)
    if [ "$NODE_VERSION" -ge 20 ]; then
      log "Node.js $(node -v) ja esta instalado"
      return
    fi
  fi

  info "Adicionando repositorio NodeSource..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >> "$LOG_FILE" 2>&1

  info "Instalando Node.js..."
  apt-get install -y -qq nodejs >> "$LOG_FILE" 2>&1

  log "Node.js $(node -v) instalado"
  log "npm $(npm -v) instalado"
}

install_postgresql() {
  header "INSTALANDO POSTGRESQL 15"

  if check_command psql; then
    log "PostgreSQL ja esta instalado"
  else
    info "Adicionando repositorio PostgreSQL..."
    sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
    curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /etc/apt/trusted.gpg.d/postgresql.gpg
    apt-get update -qq >> "$LOG_FILE" 2>&1
    apt-get install -y -qq postgresql-15 postgresql-client-15 >> "$LOG_FILE" 2>&1
    log "PostgreSQL 15 instalado"
  fi

  # Garantir que esta rodando
  systemctl enable postgresql >> "$LOG_FILE" 2>&1
  systemctl start postgresql >> "$LOG_FILE" 2>&1

  info "Configurando banco de dados..."

  # Criar usuario e banco
  sudo -u postgres psql -c "DO \$\$
  BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${DB_USER}') THEN
      CREATE ROLE ${DB_USER} WITH LOGIN PASSWORD '${DB_PASSWORD}';
    ELSE
      ALTER ROLE ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
    END IF;
  END
  \$\$;" >> "$LOG_FILE" 2>&1

  sudo -u postgres psql -c "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};" >> "$LOG_FILE" 2>&1

  sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};" >> "$LOG_FILE" 2>&1
  sudo -u postgres psql -d "${DB_NAME}" -c "GRANT ALL ON SCHEMA public TO ${DB_USER};" >> "$LOG_FILE" 2>&1

  log "Banco '${DB_NAME}' criado com usuario '${DB_USER}'"
}

install_nginx() {
  header "INSTALANDO NGINX"

  if check_command nginx; then
    log "Nginx ja esta instalado"
  else
    apt-get install -y -qq nginx >> "$LOG_FILE" 2>&1
    log "Nginx instalado"
  fi

  systemctl enable nginx >> "$LOG_FILE" 2>&1
  systemctl start nginx >> "$LOG_FILE" 2>&1
}

install_redis() {
  if [ "$INSTALL_REDIS" = "s" ]; then
    header "INSTALANDO REDIS"

    if check_command redis-server; then
      log "Redis ja esta instalado"
    else
      apt-get install -y -qq redis-server >> "$LOG_FILE" 2>&1
      log "Redis instalado"
    fi

    systemctl enable redis-server >> "$LOG_FILE" 2>&1
    systemctl start redis-server >> "$LOG_FILE" 2>&1
  fi
}

install_pm2() {
  header "INSTALANDO PM2"

  if check_command pm2; then
    log "PM2 ja esta instalado"
  else
    npm install -g pm2 >> "$LOG_FILE" 2>&1
    log "PM2 instalado"
  fi
}

# ============================================================================
# CONFIGURACAO DA APLICACAO
# ============================================================================

clone_repository() {
  header "CLONANDO REPOSITORIO"

  if [ -d "$INSTALL_DIR" ]; then
    warn "Diretorio $INSTALL_DIR ja existe"
    read -rp "$(echo -e ${YELLOW}Deseja remover e clonar novamente?${NC} [s/N]: )" OVERWRITE < /dev/tty
    if [ "${OVERWRITE,,}" = "s" ]; then
      rm -rf "$INSTALL_DIR"
    else
      info "Usando diretorio existente"
      return
    fi
  fi

  info "Clonando repositorio..."
  git clone "$REPO_URL" "$INSTALL_DIR" >> "$LOG_FILE" 2>&1
  log "Repositorio clonado em $INSTALL_DIR"
}

create_env() {
  header "GERANDO ARQUIVO DE CONFIGURACAO (.env)"

  # SITE_URL ja definido em collect_data()

  cat > "${INSTALL_DIR}/.env" << ENVEOF
# ============================================================================
# CONFIGURACAO DO SISTEMA LEGISLATIVO
# Gerado automaticamente em $(date '+%Y-%m-%d %H:%M:%S')
# ============================================================================

# --- Banco de Dados (PostgreSQL Local) ---
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}?schema=public"
DIRECT_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}?schema=public"

# --- Autenticacao ---
NEXTAUTH_URL="${SITE_URL}"
NEXTAUTH_SECRET="${NEXTAUTH_SECRET}"

# --- Identificacao do Site ---
SITE_NAME="${CAMARA_NOME}"
SITE_URL="${SITE_URL}"
SITE_DESCRIPTION="Portal Institucional da ${CAMARA_NOME} - Transparencia, Democracia e Cidadania"
NEXT_PUBLIC_SITE_NAME="${CAMARA_NOME}"
NEXT_PUBLIC_SITE_URL="${SITE_URL}"
NEXT_PUBLIC_APP_URL="${SITE_URL}"

# --- Seguranca ---
INTERNAL_API_SECRET="${INTERNAL_API_SECRET}"
NODE_ENV="production"
LOG_LEVEL="info"

# --- Redis (Rate Limiting) ---
REDIS_URL="redis://localhost:6379"
REDIS_ENABLED="$([ "$INSTALL_REDIS" = "s" ] && echo 'true' || echo 'false')"

# --- Email (Configure depois com seu servico de email) ---
# RESEND_API_KEY="re_xxxxxxxxxxxxxxxx"
# EMAIL_FROM="${CAMARA_NOME} <noreply@${SITE_DOMAIN}>"
ENVEOF

  chmod 600 "${INSTALL_DIR}/.env"
  log "Arquivo .env criado com permissoes seguras"
}

install_dependencies() {
  header "INSTALANDO DEPENDENCIAS DO PROJETO"

  cd "$INSTALL_DIR"

  info "Instalando pacotes npm (isso pode levar alguns minutos)..."
  npm ci --production=false >> "$LOG_FILE" 2>&1 || {
    warn "npm ci falhou, tentando npm install..."
    rm -rf node_modules >> "$LOG_FILE" 2>&1
    npm install --production=false >> "$LOG_FILE" 2>&1
  }
  log "Dependencias npm instaladas"
}

setup_database() {
  header "CONFIGURANDO BANCO DE DADOS"

  cd "$INSTALL_DIR"

  info "Gerando cliente Prisma..."
  npx prisma generate >> "$LOG_FILE" 2>&1
  log "Cliente Prisma gerado"

  info "Aplicando schema ao banco de dados..."
  npx prisma db push >> "$LOG_FILE" 2>&1
  log "Schema aplicado ao banco"

  info "Criando dados minimos (admin + configuracao + identidade visual)..."
  ADMIN_EMAIL="$ADMIN_EMAIL" \
  ADMIN_PASSWORD="$ADMIN_PASSWORD" \
  CAMARA_NOME="$CAMARA_NOME" \
  COR_PRIMARIA="$COR_PRIMARIA" \
  COR_SECUNDARIA="$COR_SECUNDARIA" \
  COR_ACENTO="$COR_ACENTO" \
  npx tsx prisma/seed-vps.ts >> "$LOG_FILE" 2>&1
  log "Banco inicializado (limpo, pronto para cadastro)"
}

build_application() {
  header "COMPILANDO APLICACAO"

  cd "$INSTALL_DIR"

  info "Compilando aplicacao Next.js (isso pode levar varios minutos)..."
  npm run build >> "$LOG_FILE" 2>&1
  log "Aplicacao compilada com sucesso"

  # Criar diretorio de logs
  mkdir -p "${INSTALL_DIR}/logs"
}

# ============================================================================
# CONFIGURACAO DO NGINX
# ============================================================================

configure_nginx() {
  header "CONFIGURANDO NGINX"

  cat > /etc/nginx/sites-available/camara << NGINXEOF
# Configuracao Nginx - Sistema Legislativo
# Gerado automaticamente em $(date '+%Y-%m-%d %H:%M:%S')

server {
    listen 80;
    listen [::]:80;
    server_name ${SITE_DOMAIN} _;

    # Redirecionar HTTP para HTTPS (ativado apos SSL)
    # return 301 https://\$server_name\$request_uri;

    # Paginas HTML e APIs - SEM cache (evita problemas apos deploy)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_cache off;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";

        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 16k;
        proxy_buffers 4 32k;
    }

    # SSE (Server-Sent Events) - Painel em tempo real
    location /api/painel/stream {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400s;
    }

    # Assets estaticos do Next.js - cache longo (arquivos com hash no nome)
    location /_next/static {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache off;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Servir arquivos de upload diretamente (fotos, documentos)
    location /uploads/ {
        alias ${INSTALL_DIR}/public/uploads/;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
        try_files \$uri =404;
    }

    # Upload de arquivos (limite de 50MB)
    client_max_body_size 50M;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
}
NGINXEOF

  # Ativar site
  ln -sf /etc/nginx/sites-available/camara /etc/nginx/sites-enabled/
  rm -f /etc/nginx/sites-enabled/default

  # Testar configuracao
  nginx -t >> "$LOG_FILE" 2>&1
  systemctl reload nginx
  log "Nginx configurado para ${SITE_DOMAIN}"
}

# ============================================================================
# FIREWALL
# ============================================================================

configure_firewall() {
  header "CONFIGURANDO FIREWALL"

  ufw --force reset >> "$LOG_FILE" 2>&1
  ufw default deny incoming >> "$LOG_FILE" 2>&1
  ufw default allow outgoing >> "$LOG_FILE" 2>&1
  ufw allow ssh >> "$LOG_FILE" 2>&1
  ufw allow 'Nginx Full' >> "$LOG_FILE" 2>&1
  ufw --force enable >> "$LOG_FILE" 2>&1
  log "Firewall configurado (SSH + HTTP/HTTPS)"
}

# ============================================================================
# SSL/HTTPS
# ============================================================================

configure_ssl() {
  header "CONFIGURANDO SSL/HTTPS (Let's Encrypt)"

  # SSL nao funciona com IP - apenas com dominio
  if [ "$IS_IP" = true ]; then
    warn "SSL nao pode ser configurado com IP (${SITE_DOMAIN})"
    warn "O sistema funcionara em HTTP. Para HTTPS, configure um dominio depois."
    echo ""
    echo -e "  Para configurar SSL depois com um dominio:"
    echo -e "  ${BOLD}sudo certbot --nginx -d SEU_DOMINIO --email ${SSL_EMAIL} --agree-tos --non-interactive${NC}"
    return
  fi

  if check_command certbot; then
    log "Certbot ja esta instalado"
  else
    apt-get install -y -qq certbot python3-certbot-nginx >> "$LOG_FILE" 2>&1
    log "Certbot instalado"
  fi

  info "Obtendo certificado SSL para ${SITE_DOMAIN}..."
  info "Certifique-se de que o DNS do dominio aponta para este servidor!"
  echo ""

  read -rp "$(echo -e ${YELLOW}O DNS do dominio ja esta apontando para este servidor?${NC} [S/n]: )" DNS_OK < /dev/tty
  if [ "${DNS_OK,,}" = "n" ]; then
    warn "SSL sera configurado depois. Para ativar SSL manualmente, execute:"
    echo -e "  ${BOLD}sudo certbot --nginx -d ${SITE_DOMAIN} --email ${SSL_EMAIL} --agree-tos --non-interactive${NC}"
    return
  fi

  certbot --nginx -d "${SITE_DOMAIN}" --email "${SSL_EMAIL}" --agree-tos --non-interactive >> "$LOG_FILE" 2>&1 || {
    warn "Falha ao obter certificado SSL. Verifique se o DNS esta apontando corretamente."
    warn "Execute manualmente depois: sudo certbot --nginx -d ${SITE_DOMAIN}"
    return
  }

  # Renovacao automatica
  systemctl enable certbot.timer >> "$LOG_FILE" 2>&1
  log "SSL configurado! Renovacao automatica ativada"
}

# ============================================================================
# PM2 - GERENCIAMENTO DE PROCESSOS
# ============================================================================

configure_pm2() {
  header "CONFIGURANDO PM2"

  cd "$INSTALL_DIR"

  # Parar processos existentes
  pm2 delete all >> "$LOG_FILE" 2>&1 || true

  # Iniciar aplicacao
  pm2 start ecosystem.config.js --env production >> "$LOG_FILE" 2>&1
  log "Aplicacao iniciada com PM2"

  # Salvar configuracao
  pm2 save >> "$LOG_FILE" 2>&1

  # Configurar startup (iniciar automaticamente no boot)
  pm2 startup systemd -u root --hp /root >> "$LOG_FILE" 2>&1
  log "PM2 configurado para iniciar no boot"
}

# ============================================================================
# ATUALIZAR CREDENCIAIS DO ADMIN
# ============================================================================

update_admin_credentials() {
  header "CONFIGURANDO CREDENCIAIS DO ADMINISTRADOR"

  cd "$INSTALL_DIR"

  # Criar script temporario para atualizar email e senha do admin
  cat > /tmp/update-admin.ts << 'TSEOF'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = process.env.ADMIN_EMAIL!
  const password = process.env.ADMIN_PASSWORD!
  const nomeCamara = process.env.CAMARA_NOME!
  const corPrimaria = process.env.COR_PRIMARIA
  const corSecundaria = process.env.COR_SECUNDARIA
  const corAcento = process.env.COR_ACENTO

  const hashedPassword = await bcrypt.hash(password, 12)

  // Atualizar admin
  await prisma.user.updateMany({
    where: { role: 'ADMIN' },
    data: {
      email,
      password: hashedPassword
    }
  })

  // Atualizar configuracao institucional (incluindo cores se fornecidas)
  const updateData: Record<string, string> = { nomeCasa: nomeCamara }
  if (corPrimaria) updateData.corPrimaria = corPrimaria
  if (corSecundaria) updateData.corSecundaria = corSecundaria
  if (corAcento) updateData.corAcento = corAcento

  await prisma.configuracaoInstitucional.upsert({
    where: { slug: 'principal' },
    update: updateData,
    create: {
      slug: 'principal',
      nomeCasa: nomeCamara,
      tipoEnte: 'CAMARA_MUNICIPAL',
      corPrimaria: corPrimaria || '#1e40af',
      corSecundaria: corSecundaria || '#3b82f6',
      corAcento: corAcento || '#059669'
    }
  })

  console.log('Credenciais e identidade visual atualizadas com sucesso!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
TSEOF

  ADMIN_EMAIL="$ADMIN_EMAIL" \
  ADMIN_PASSWORD="$ADMIN_PASSWORD" \
  CAMARA_NOME="$CAMARA_NOME" \
  COR_PRIMARIA="$COR_PRIMARIA" \
  COR_SECUNDARIA="$COR_SECUNDARIA" \
  COR_ACENTO="$COR_ACENTO" \
  npx tsx /tmp/update-admin.ts >> "$LOG_FILE" 2>&1

  rm -f /tmp/update-admin.ts
  log "Credenciais do administrador atualizadas"
}

# ============================================================================
# VERIFICACAO FINAL
# ============================================================================

verify_installation() {
  header "VERIFICANDO INSTALACAO"

  ERRORS=0

  # Verificar PostgreSQL
  if systemctl is-active --quiet postgresql; then
    log "PostgreSQL: ativo"
  else
    error "PostgreSQL: inativo"
    ERRORS=$((ERRORS + 1))
  fi

  # Verificar Nginx
  if systemctl is-active --quiet nginx; then
    log "Nginx: ativo"
  else
    error "Nginx: inativo"
    ERRORS=$((ERRORS + 1))
  fi

  # Verificar Redis
  if [ "$INSTALL_REDIS" = "s" ]; then
    if systemctl is-active --quiet redis-server; then
      log "Redis: ativo"
    else
      error "Redis: inativo"
      ERRORS=$((ERRORS + 1))
    fi
  fi

  # Verificar PM2
  if pm2 list | grep -q "online"; then
    log "PM2: aplicacao online"
  else
    error "PM2: aplicacao offline"
    ERRORS=$((ERRORS + 1))
  fi

  # Verificar aplicacao respondendo
  sleep 3
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|302"; then
    log "Aplicacao: respondendo na porta 3000"
  else
    warn "Aplicacao: pode levar alguns segundos para iniciar completamente"
  fi

  # Verificar APIs de transparencia
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/publico/conformidade | grep -q "200"; then
    log "API Transparencia PNTP: ativa"
  else
    warn "API Transparencia PNTP: pode levar alguns segundos"
  fi

  # Verificar API e-SIC
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/e-sic/estatisticas | grep -q "200"; then
    log "API e-SIC: ativa"
  else
    warn "API e-SIC: pode levar alguns segundos"
  fi

  return $ERRORS
}

# ============================================================================
# RESUMO FINAL
# ============================================================================

show_summary() {
  echo ""
  echo -e "${GREEN}${BOLD}"
  echo "  ╔══════════════════════════════════════════════════════╗"
  echo "  ║                                                      ║"
  echo "  ║    INSTALACAO CONCLUIDA COM SUCESSO!                 ║"
  echo "  ║                                                      ║"
  echo "  ╚══════════════════════════════════════════════════════╝"
  echo -e "${NC}"
  echo -e "  ${BOLD}=== DADOS DE ACESSO ===${NC}"
  echo ""
  echo -e "  ${CYAN}URL do Sistema:${NC}     ${SITE_URL}"
  echo -e "  ${CYAN}Email Admin:${NC}        ${ADMIN_EMAIL}"
  echo -e "  ${CYAN}Senha Admin:${NC}        (a que voce definiu)"
  echo ""
  echo -e "  ${BOLD}=== BANCO DE DADOS ===${NC}"
  echo ""
  echo -e "  ${CYAN}Host:${NC}               localhost"
  echo -e "  ${CYAN}Porta:${NC}              5432"
  echo -e "  ${CYAN}Banco:${NC}              ${DB_NAME}"
  echo -e "  ${CYAN}Usuario:${NC}            ${DB_USER}"
  echo -e "  ${CYAN}Senha:${NC}              (salva em CREDENCIAIS.txt)"
  echo ""
  echo -e "  ${BOLD}=== ARQUIVOS IMPORTANTES ===${NC}"
  echo ""
  echo -e "  ${CYAN}Aplicacao:${NC}          ${INSTALL_DIR}"
  echo -e "  ${CYAN}Configuracao:${NC}       ${INSTALL_DIR}/.env"
  echo -e "  ${CYAN}Logs PM2:${NC}           ${INSTALL_DIR}/logs/"
  echo -e "  ${CYAN}Nginx:${NC}              /etc/nginx/sites-available/camara"
  echo -e "  ${CYAN}Log instalacao:${NC}     ${LOG_FILE}"
  echo ""
  echo -e "  ${BOLD}=== COMANDOS UTEIS ===${NC}"
  echo ""
  echo -e "  ${YELLOW}pm2 status${NC}                    Ver status da aplicacao"
  echo -e "  ${YELLOW}pm2 logs${NC}                      Ver logs em tempo real"
  echo -e "  ${YELLOW}pm2 restart all${NC}               Reiniciar aplicacao"
  echo -e "  ${YELLOW}cd ${INSTALL_DIR} && npm run build${NC}  Recompilar"
  echo -e "  ${YELLOW}sudo certbot renew${NC}            Renovar SSL"
  echo -e "  ${YELLOW}sudo systemctl restart nginx${NC}  Reiniciar Nginx"
  echo ""
  echo -e "  ${BOLD}=== PROXIMOS PASSOS ===${NC}"
  echo ""
  echo -e "  1. Acesse ${GREEN}${SITE_URL}${NC}"
  echo -e "  2. Faca login com as credenciais acima"
  echo -e "  3. Va em ${BOLD}Administracao > Configuracoes${NC} para ajustar cores e dados"
  echo -e "  4. Cadastre parlamentares, legislaturas e comissoes"
  echo -e "  5. Configure o ${BOLD}Organograma${NC} em Admin > Transparencia > Organograma"
  echo -e "  6. Cadastre ${BOLD}Conteudos Educativos${NC} em Admin > Atendimento > Conteudos"
  echo -e "  7. O portal de ${BOLD}Transparencia${NC} e ${BOLD}e-SIC${NC} ja estao ativos!"
  echo ""

  # Salvar credenciais em arquivo seguro
  cat > "${INSTALL_DIR}/CREDENCIAIS.txt" << CREDEOF
============================================
CREDENCIAIS DO SISTEMA - ${CAMARA_NOME}
Gerado em: $(date '+%Y-%m-%d %H:%M:%S')
============================================

URL: ${SITE_URL}
Email Admin: ${ADMIN_EMAIL}

Identidade Visual:
  Tema: ${TEMA_NOME}
  Primaria: ${COR_PRIMARIA}
  Secundaria: ${COR_SECUNDARIA}
  Acento: ${COR_ACENTO}

Banco de Dados:
  Host: localhost:5432
  Banco: ${DB_NAME}
  Usuario: ${DB_USER}
  Senha: ${DB_PASSWORD}

IMPORTANTE: Guarde estas informacoes em local seguro
e DELETE este arquivo apos anotar os dados!
============================================
CREDEOF

  chmod 600 "${INSTALL_DIR}/CREDENCIAIS.txt"
  warn "Credenciais salvas em ${INSTALL_DIR}/CREDENCIAIS.txt"
  warn "IMPORTANTE: Anote as credenciais e DELETE o arquivo por seguranca!"
}

# ============================================================================
# EXECUCAO PRINCIPAL
# ============================================================================

main() {
  # Inicializar log
  mkdir -p "$(dirname "$LOG_FILE")"
  echo "=== Instalacao iniciada em $(date) ===" > "$LOG_FILE"

  check_root
  show_banner
  check_requirements

  # Detectar instalacao existente
  detect_existing_installation

  # Se for atualizacao, fluxo simplificado
  if [ "$INSTALL_MODE" = "update" ]; then
    do_update
    exit 0
  fi

  # Se for reinstalacao, limpar tudo primeiro
  if [ "$INSTALL_MODE" = "reinstall" ]; then
    do_clean_reinstall
  fi

  # Instalacao nova (fresh ou reinstall)
  collect_data

  # Iniciar cronometro
  INSTALL_START_TIME=$(date +%s)

  echo ""
  echo -e "${CYAN}${BOLD}  ┌──────────────────────────────────────────────┐${NC}"
  echo -e "${CYAN}${BOLD}  │       INICIANDO INSTALACAO AUTOMATICA        │${NC}"
  echo -e "${CYAN}${BOLD}  └──────────────────────────────────────────────┘${NC}"

  # Etapa 1: Dependencias do sistema
  step "Dependencias do sistema"
  install_system_deps

  # Etapa 2: Node.js
  step "Node.js 20 LTS"
  install_nodejs

  # Etapa 3: PostgreSQL
  step "PostgreSQL 15"
  install_postgresql

  # Etapa 4: Nginx
  step "Nginx"
  install_nginx

  # Etapa 5: Redis
  step "Redis"
  install_redis

  # Etapa 6: PM2
  step "PM2 (gerenciador de processos)"
  install_pm2

  # Etapa 7: Clonar repositorio
  step "Clonar repositorio"
  clone_repository

  # Etapa 8: Configuracao
  step "Gerar configuracao (.env)"
  create_env

  # Etapa 9: Dependencias npm
  step "Instalar dependencias npm"
  install_dependencies

  # Etapa 10: Banco de dados
  step "Configurar banco de dados"
  setup_database

  # Etapa 11: Build
  step "Compilar aplicacao (pode levar varios minutos)"
  build_application

  # Etapa 12: Nginx config
  step "Configurar Nginx"
  configure_nginx

  # Etapa 13: Firewall + SSL
  step "Firewall e SSL"
  configure_firewall
  configure_ssl

  # Etapa 14: PM2
  step "Iniciar aplicacao com PM2"
  configure_pm2

  # Barra final
  echo ""
  progress_bar "$TOTAL_STEPS" "$TOTAL_STEPS"
  echo ""

  # Tempo total
  local total_time=$(( $(date +%s) - INSTALL_START_TIME ))
  local total_mins=$((total_time / 60))
  local total_secs=$((total_time % 60))
  echo ""
  echo -e "  ${GREEN}${BOLD}Instalacao concluida em ${total_mins}m ${total_secs}s${NC}"

  # Verificacao
  echo ""
  verify_installation
  show_summary
}

# Executar
main "$@"
