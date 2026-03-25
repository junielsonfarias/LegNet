#!/bin/bash
# ============================================================================
# INSTALADOR DO SISTEMA LEGISLATIVO - CAMARA MUNICIPAL
# Versao: 2.0
# Compativel: Ubuntu 20.04/22.04/24.04, Debian 11/12
# ============================================================================

set -euo pipefail

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
REPO_URL="https://github.com/seu-usuario/camara.git"

# ============================================================================
# FUNCOES UTILITARIAS
# ============================================================================

log() { echo -e "${GREEN}[OK]${NC} $1"; echo "[$(date '+%Y-%m-%d %H:%M:%S')] [OK] $1" >> "$LOG_FILE"; }
warn() { echo -e "${YELLOW}[AVISO]${NC} $1"; echo "[$(date '+%Y-%m-%d %H:%M:%S')] [AVISO] $1" >> "$LOG_FILE"; }
error() { echo -e "${RED}[ERRO]${NC} $1"; echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERRO] $1" >> "$LOG_FILE"; }
info() { echo -e "${BLUE}[INFO]${NC} $1"; echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] $1" >> "$LOG_FILE"; }
header() { echo -e "\n${CYAN}${BOLD}========================================${NC}"; echo -e "${CYAN}${BOLD}  $1${NC}"; echo -e "${CYAN}${BOLD}========================================${NC}\n"; }

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
        11|12) log "Sistema detectado: Debian $VERSION_ID" ;;
        *) warn "Debian $VERSION_ID nao foi testado. Recomendamos 11 ou 12" ;;
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
  echo "  ║    Versao 2.0                                        ║"
  echo "  ║                                                      ║"
  echo "  ╚══════════════════════════════════════════════════════╝"
  echo -e "${NC}"
  echo -e "  Este instalador ira configurar automaticamente:"
  echo -e "  ${GREEN}✓${NC} PostgreSQL 15 (banco de dados)"
  echo -e "  ${GREEN}✓${NC} Node.js 20 LTS"
  echo -e "  ${GREEN}✓${NC} Nginx (servidor web)"
  echo -e "  ${GREEN}✓${NC} PM2 (gerenciador de processos)"
  echo -e "  ${GREEN}✓${NC} SSL/HTTPS (Let's Encrypt)"
  echo -e "  ${GREEN}✓${NC} Firewall (UFW)"
  echo -e "  ${GREEN}✓${NC} Sistema legislativo completo"
  echo ""
}

# ============================================================================
# COLETA DE DADOS
# ============================================================================

collect_data() {
  header "CONFIGURACAO DA CAMARA"

  echo -e "${BOLD}Responda as perguntas abaixo para configurar o sistema:${NC}\n"

  # Nome da Camara
  read -rp "$(echo -e ${CYAN}Nome da Camara Municipal${NC} [ex: Camara Municipal de Mojui dos Campos]: )" CAMARA_NOME
  CAMARA_NOME="${CAMARA_NOME:-Camara Municipal}"

  # Dominio
  echo ""
  read -rp "$(echo -e ${CYAN}Dominio do site${NC} [ex: camara.mojuidoscampos.pa.gov.br]: )" SITE_DOMAIN
  while [ -z "$SITE_DOMAIN" ]; do
    warn "Dominio e obrigatorio!"
    read -rp "$(echo -e ${CYAN}Dominio do site${NC}: )" SITE_DOMAIN
  done

  # Email admin
  echo ""
  read -rp "$(echo -e ${CYAN}Email do administrador${NC} [ex: admin@camara.gov.br]: )" ADMIN_EMAIL
  ADMIN_EMAIL="${ADMIN_EMAIL:-admin@${SITE_DOMAIN}}"

  # Senha admin
  echo ""
  while true; do
    read -srp "$(echo -e ${CYAN}Senha do administrador${NC} [minimo 8 caracteres]: )" ADMIN_PASSWORD
    echo ""
    if [ ${#ADMIN_PASSWORD} -lt 8 ]; then
      warn "Senha deve ter no minimo 8 caracteres!"
      continue
    fi
    read -srp "$(echo -e ${CYAN}Confirme a senha${NC}: )" ADMIN_PASSWORD_CONFIRM
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
  read -rp "$(echo -e ${CYAN}Email para certificado SSL${NC} [${ADMIN_EMAIL}]: )" SSL_EMAIL
  SSL_EMAIL="${SSL_EMAIL:-$ADMIN_EMAIL}"

  # Redis
  echo ""
  read -rp "$(echo -e ${CYAN}Instalar Redis para rate limiting?${NC} [s/N]: )" INSTALL_REDIS
  INSTALL_REDIS="${INSTALL_REDIS,,}"

  # Repositorio
  echo ""
  read -rp "$(echo -e ${CYAN}URL do repositorio Git${NC} [${REPO_URL}]: )" CUSTOM_REPO
  REPO_URL="${CUSTOM_REPO:-$REPO_URL}"

  # Diretorio de instalacao
  echo ""
  read -rp "$(echo -e ${CYAN}Diretorio de instalacao${NC} [${INSTALL_DIR}]: )" CUSTOM_DIR
  INSTALL_DIR="${CUSTOM_DIR:-$INSTALL_DIR}"

  # Gerar secrets
  NEXTAUTH_SECRET=$(generate_secret 48)
  INTERNAL_API_SECRET=$(generate_secret 32)
  DB_NAME="camara_legislativo"
  DB_USER="camara_app"

  # Confirmar
  header "CONFIRME AS CONFIGURACOES"
  echo -e "  ${BOLD}Camara:${NC}       $CAMARA_NOME"
  echo -e "  ${BOLD}Dominio:${NC}      $SITE_DOMAIN"
  echo -e "  ${BOLD}URL:${NC}          https://$SITE_DOMAIN"
  echo -e "  ${BOLD}Email Admin:${NC}  $ADMIN_EMAIL"
  echo -e "  ${BOLD}Banco:${NC}        PostgreSQL local ($DB_NAME)"
  echo -e "  ${BOLD}Redis:${NC}        $([ "$INSTALL_REDIS" = "s" ] && echo 'Sim' || echo 'Nao')"
  echo -e "  ${BOLD}Diretorio:${NC}    $INSTALL_DIR"
  echo -e "  ${BOLD}Repositorio:${NC}  $REPO_URL"
  echo ""

  read -rp "$(echo -e ${YELLOW}Tudo correto? Iniciar instalacao?${NC} [S/n]: )" CONFIRM
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
  apt-get update -qq >> "$LOG_FILE" 2>&1
  apt-get upgrade -y -qq >> "$LOG_FILE" 2>&1
  log "Sistema atualizado"

  info "Instalando pacotes essenciais..."
  apt-get install -y -qq \
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
    read -rp "$(echo -e ${YELLOW}Deseja remover e clonar novamente?${NC} [s/N]: )" OVERWRITE
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

  SITE_URL="https://${SITE_DOMAIN}"

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
  npm ci --production=false >> "$LOG_FILE" 2>&1
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

  info "Populando banco com dados iniciais..."
  npx tsx prisma/seed.ts >> "$LOG_FILE" 2>&1
  log "Dados iniciais inseridos"
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
    server_name ${SITE_DOMAIN};

    # Redirecionar HTTP para HTTPS (ativado apos SSL)
    # return 301 https://\$server_name\$request_uri;

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
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;

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

    # Cache para assets estaticos
    location /_next/static {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
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

  if check_command certbot; then
    log "Certbot ja esta instalado"
  else
    apt-get install -y -qq certbot python3-certbot-nginx >> "$LOG_FILE" 2>&1
    log "Certbot instalado"
  fi

  info "Obtendo certificado SSL para ${SITE_DOMAIN}..."
  info "Certifique-se de que o DNS do dominio aponta para este servidor!"
  echo ""

  read -rp "$(echo -e ${YELLOW}O DNS do dominio ja esta apontando para este servidor?${NC} [S/n]: )" DNS_OK
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

  const hashedPassword = await bcrypt.hash(password, 12)

  // Atualizar admin
  await prisma.user.updateMany({
    where: { role: 'ADMIN' },
    data: {
      email,
      password: hashedPassword
    }
  })

  // Atualizar configuracao institucional
  await prisma.configuracaoInstitucional.upsert({
    where: { slug: 'principal' },
    update: { nomeCasa: nomeCamara },
    create: {
      slug: 'principal',
      nomeCasa: nomeCamara,
      tipoEnte: 'CAMARA_MUNICIPAL'
    }
  })

  console.log('Credenciais atualizadas com sucesso!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
TSEOF

  ADMIN_EMAIL="$ADMIN_EMAIL" \
  ADMIN_PASSWORD="$ADMIN_PASSWORD" \
  CAMARA_NOME="$CAMARA_NOME" \
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
  echo -e "  ${CYAN}URL do Sistema:${NC}     https://${SITE_DOMAIN}"
  echo -e "  ${CYAN}Email Admin:${NC}        ${ADMIN_EMAIL}"
  echo -e "  ${CYAN}Senha Admin:${NC}        (a que voce definiu)"
  echo ""
  echo -e "  ${BOLD}=== BANCO DE DADOS ===${NC}"
  echo ""
  echo -e "  ${CYAN}Host:${NC}               localhost"
  echo -e "  ${CYAN}Porta:${NC}              5432"
  echo -e "  ${CYAN}Banco:${NC}              ${DB_NAME}"
  echo -e "  ${CYAN}Usuario:${NC}            ${DB_USER}"
  echo -e "  ${CYAN}Senha:${NC}              ${DB_PASSWORD}"
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
  echo -e "  1. Acesse ${GREEN}https://${SITE_DOMAIN}${NC}"
  echo -e "  2. Faca login com as credenciais acima"
  echo -e "  3. Va em ${BOLD}Administracao > Configuracoes${NC} para personalizar"
  echo -e "  4. Cadastre os parlamentares e comece a usar!"
  echo ""

  # Salvar credenciais em arquivo seguro
  cat > "${INSTALL_DIR}/CREDENCIAIS.txt" << CREDEOF
============================================
CREDENCIAIS DO SISTEMA - ${CAMARA_NOME}
Gerado em: $(date '+%Y-%m-%d %H:%M:%S')
============================================

URL: https://${SITE_DOMAIN}
Email Admin: ${ADMIN_EMAIL}

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
  collect_data

  # Instalacao
  install_system_deps
  install_nodejs
  install_postgresql
  install_nginx
  install_redis
  install_pm2

  # Aplicacao
  clone_repository
  create_env
  install_dependencies
  setup_database
  update_admin_credentials
  build_application

  # Infraestrutura
  configure_nginx
  configure_firewall
  configure_ssl
  configure_pm2

  # Verificacao
  if verify_installation; then
    show_summary
  else
    error "Instalacao concluida com avisos. Verifique o log: $LOG_FILE"
    show_summary
  fi
}

# Executar
main "$@"
