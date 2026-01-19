#!/bin/bash
# =============================================================================
# update.sh - Script de Atualização
# Sistema de Câmara Municipal
# =============================================================================
#
# Uso:
#   sudo ./scripts/update.sh
#   sudo ./scripts/update.sh --skip-backup
#
# =============================================================================

set -e

# =============================================================================
# Configuração
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${APP_DIR:-/var/www/camara}"
BRANCH="${BRANCH:-main}"
BACKUP_DIR="/var/backups/camara"
SKIP_BACKUP=false

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# =============================================================================
# Funções Auxiliares
# =============================================================================

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

error() {
    echo -e "${RED}[✗]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Verifica se é root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "Este script deve ser executado como root (use sudo)"
        exit 1
    fi
}

# Detecta tipo de instalação
detect_install_type() {
    if [[ -f "${APP_DIR}/docker-compose.prod.yml" ]] && docker ps 2>/dev/null | grep -q camara; then
        echo "docker"
    elif command -v pm2 &>/dev/null && pm2 list 2>/dev/null | grep -q camara; then
        echo "pm2"
    else
        echo "unknown"
    fi
}

# =============================================================================
# Backup
# =============================================================================

create_backup() {
    if [[ "$SKIP_BACKUP" == "true" ]]; then
        warning "Backup pulado (--skip-backup)"
        return 0
    fi

    local timestamp
    timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_path="${BACKUP_DIR}/backup_${timestamp}"

    info "Criando backup..."

    mkdir -p "$backup_path"

    # Backup do .env
    if [[ -f "${APP_DIR}/.env" ]]; then
        cp "${APP_DIR}/.env" "${backup_path}/.env.bak"
    fi

    # Backup do banco de dados (se PostgreSQL local)
    if command -v pg_dump &>/dev/null && [[ -f "${APP_DIR}/.env" ]]; then
        local db_url
        db_url=$(grep "^DATABASE_URL=" "${APP_DIR}/.env" | cut -d= -f2- | tr -d '"')

        if [[ -n "$db_url" && "$db_url" =~ localhost|127\.0\.0\.1 ]]; then
            info "Fazendo backup do banco de dados..."
            PGPASSWORD=$(echo "$db_url" | sed -E 's/.*:([^@]+)@.*/\1/') \
            pg_dump -h localhost -U $(echo "$db_url" | sed -E 's/.*\/\/([^:]+):.*/\1/') \
                    $(echo "$db_url" | sed -E 's/.*\/([^?]+).*/\1/') \
                    | gzip > "${backup_path}/database.sql.gz" 2>/dev/null || true
        fi
    fi

    # Backup de uploads
    if [[ -d "${APP_DIR}/public/uploads" ]]; then
        info "Fazendo backup de uploads..."
        tar -czf "${backup_path}/uploads.tar.gz" -C "${APP_DIR}/public" uploads 2>/dev/null || true
    fi

    success "Backup criado em: $backup_path"
}

# =============================================================================
# Atualização do Código
# =============================================================================

update_code() {
    info "Atualizando código..."

    cd "$APP_DIR" || exit 1

    # Salva alterações locais se existirem
    if [[ -n "$(git status --porcelain)" ]]; then
        warning "Alterações locais detectadas. Salvando em stash..."
        git stash
    fi

    # Fetch e pull
    git fetch origin
    git checkout "$BRANCH"
    git pull origin "$BRANCH"

    success "Código atualizado"
}

# =============================================================================
# Atualização de Dependências
# =============================================================================

update_dependencies() {
    info "Atualizando dependências..."

    cd "$APP_DIR" || exit 1

    # Instala dependências
    npm ci --only=production 2>/dev/null || npm install

    success "Dependências atualizadas"
}

# =============================================================================
# Migrations e Build
# =============================================================================

run_migrations() {
    info "Executando migrations..."

    cd "$APP_DIR" || exit 1

    # Gera cliente Prisma
    npx prisma generate

    # Executa migrations
    if ! npx prisma migrate deploy 2>/dev/null; then
        warning "Migrations falharam. Tentando db push..."
        npx prisma db push --accept-data-loss
    fi

    success "Migrations executadas"
}

build_application() {
    info "Executando build..."

    cd "$APP_DIR" || exit 1

    export NEXT_TELEMETRY_DISABLED=1
    npm run build

    success "Build concluído"
}

# =============================================================================
# Reinício da Aplicação
# =============================================================================

restart_application() {
    local install_type
    install_type=$(detect_install_type)

    info "Reiniciando aplicação..."

    case "$install_type" in
        pm2)
            pm2 reload camara
            success "Aplicação reiniciada (PM2)"
            ;;
        docker)
            cd "$APP_DIR" || exit 1
            docker compose -f docker-compose.prod.yml up -d --build
            success "Containers reiniciados (Docker)"
            ;;
        *)
            warning "Tipo de instalação não detectado. Reinicie manualmente."
            ;;
    esac
}

# =============================================================================
# Verificação
# =============================================================================

verify_update() {
    info "Verificando atualização..."

    sleep 5

    # Testa se aplicação está respondendo
    local max_attempts=30
    local attempt=0

    while [[ $attempt -lt $max_attempts ]]; do
        if curl -sf "http://localhost:3000" > /dev/null 2>&1; then
            success "Aplicação respondendo"
            return 0
        fi
        ((attempt++))
        sleep 2
    done

    error "Aplicação não está respondendo"
    return 1
}

# =============================================================================
# Função Principal
# =============================================================================

main() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}  ${GREEN}Sistema de Câmara Municipal - Atualização${NC}                     ${BLUE}║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    # Processa argumentos
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-backup)
                SKIP_BACKUP=true
                shift
                ;;
            *)
                shift
                ;;
        esac
    done

    check_root

    # Verifica se diretório existe
    if [[ ! -d "$APP_DIR" ]]; then
        error "Diretório da aplicação não encontrado: $APP_DIR"
        exit 1
    fi

    # Executa atualização
    create_backup
    update_code
    update_dependencies
    run_migrations
    build_application
    restart_application
    verify_update

    echo ""
    success "Atualização concluída com sucesso!"
    echo ""
}

# =============================================================================
# Execução
# =============================================================================

main "$@"
