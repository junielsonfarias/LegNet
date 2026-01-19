#!/bin/bash
# =============================================================================
# uninstall.sh - Script de Desinstalação
# Sistema de Câmara Municipal
# =============================================================================
#
# Uso:
#   sudo ./scripts/uninstall.sh
#   sudo ./scripts/uninstall.sh --keep-database
#   sudo ./scripts/uninstall.sh --full
#
# =============================================================================

set -e

# =============================================================================
# Configuração
# =============================================================================

APP_DIR="${APP_DIR:-/var/www/camara}"
BACKUP_DIR="/var/backups/camara"
KEEP_DATABASE=false
FULL_UNINSTALL=false

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
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

confirm() {
    local message="$1"
    local response

    echo -en "${YELLOW}${message}${NC} [s/N]: "
    read -r response

    case "$response" in
        [sS]|[sS][iI][mM]|[yY]|[yY][eE][sS])
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "Este script deve ser executado como root (use sudo)"
        exit 1
    fi
}

# =============================================================================
# Backup Antes de Desinstalar
# =============================================================================

create_final_backup() {
    local timestamp
    timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_path="${BACKUP_DIR}/uninstall_backup_${timestamp}"

    info "Criando backup final..."

    mkdir -p "$backup_path"

    # Backup do .env
    if [[ -f "${APP_DIR}/.env" ]]; then
        cp "${APP_DIR}/.env" "${backup_path}/.env.bak"
    fi

    # Backup do banco de dados
    if command -v pg_dump &>/dev/null && [[ -f "${APP_DIR}/.env" ]]; then
        local db_url
        db_url=$(grep "^DATABASE_URL=" "${APP_DIR}/.env" 2>/dev/null | cut -d= -f2- | tr -d '"')

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
# Remoção de Componentes
# =============================================================================

stop_pm2() {
    if command -v pm2 &>/dev/null; then
        info "Parando PM2..."

        pm2 delete camara 2>/dev/null || true
        pm2 save 2>/dev/null || true

        success "PM2 parado"
    fi
}

stop_docker() {
    if [[ -f "${APP_DIR}/docker-compose.prod.yml" ]]; then
        info "Parando containers Docker..."

        cd "$APP_DIR" 2>/dev/null || true
        docker compose -f docker-compose.prod.yml down 2>/dev/null || true

        if [[ "$FULL_UNINSTALL" == "true" ]]; then
            docker compose -f docker-compose.prod.yml down -v 2>/dev/null || true
        fi

        success "Containers Docker parados"
    fi
}

remove_nginx_config() {
    info "Removendo configuração Nginx..."

    # Remove configurações de sites
    local domain
    for config in /etc/nginx/sites-enabled/*camara* /etc/nginx/sites-available/*camara*; do
        if [[ -f "$config" || -L "$config" ]]; then
            rm -f "$config"
        fi
    done

    # Remove configurações com domínio específico
    if [[ -f "${APP_DIR}/.env" ]]; then
        domain=$(grep "^NEXTAUTH_URL=" "${APP_DIR}/.env" 2>/dev/null | sed -E 's|.*://([^/]+).*|\1|' | tr -d '"')

        if [[ -n "$domain" ]]; then
            rm -f "/etc/nginx/sites-enabled/${domain}"
            rm -f "/etc/nginx/sites-available/${domain}"
        fi
    fi

    # Recarrega Nginx
    if systemctl is-active --quiet nginx; then
        nginx -t 2>/dev/null && systemctl reload nginx
    fi

    success "Configuração Nginx removida"
}

remove_ssl_certificate() {
    if [[ "$FULL_UNINSTALL" == "true" ]]; then
        info "Removendo certificados SSL..."

        if [[ -f "${APP_DIR}/.env" ]]; then
            local domain
            domain=$(grep "^NEXTAUTH_URL=" "${APP_DIR}/.env" 2>/dev/null | sed -E 's|.*://([^/]+).*|\1|' | tr -d '"')

            if [[ -n "$domain" && -d "/etc/letsencrypt/live/${domain}" ]]; then
                certbot delete --cert-name "$domain" 2>/dev/null || true
            fi
        fi

        success "Certificados SSL removidos"
    fi
}

remove_database() {
    if [[ "$KEEP_DATABASE" == "true" ]]; then
        warning "Banco de dados mantido (--keep-database)"
        return 0
    fi

    if [[ -f "${APP_DIR}/.env" ]]; then
        local db_url
        db_url=$(grep "^DATABASE_URL=" "${APP_DIR}/.env" 2>/dev/null | cut -d= -f2- | tr -d '"')

        # Só remove se for banco local
        if [[ -n "$db_url" && "$db_url" =~ localhost|127\.0\.0\.1 ]]; then
            local db_name db_user

            db_name=$(echo "$db_url" | sed -E 's/.*\/([^?]+).*/\1/')
            db_user=$(echo "$db_url" | sed -E 's/.*\/\/([^:]+):.*/\1/')

            if [[ -n "$db_name" && -n "$db_user" ]]; then
                info "Removendo banco de dados..."

                sudo -u postgres psql -c "DROP DATABASE IF EXISTS ${db_name}" 2>/dev/null || true
                sudo -u postgres psql -c "DROP USER IF EXISTS ${db_user}" 2>/dev/null || true

                success "Banco de dados removido"
            fi
        else
            info "Banco de dados remoto (Supabase) - nenhuma ação necessária"
        fi
    fi
}

remove_application_files() {
    info "Removendo arquivos da aplicação..."

    if [[ -d "$APP_DIR" ]]; then
        rm -rf "$APP_DIR"
        success "Diretório da aplicação removido: $APP_DIR"
    fi
}

remove_pm2_startup() {
    if command -v pm2 &>/dev/null; then
        info "Removendo startup do PM2..."

        pm2 unstartup systemd 2>/dev/null || true

        success "Startup do PM2 removido"
    fi
}

remove_logs() {
    if [[ "$FULL_UNINSTALL" == "true" ]]; then
        info "Removendo logs..."

        rm -rf /var/log/pm2/camara* 2>/dev/null || true
        rm -rf /var/log/camara-install 2>/dev/null || true

        success "Logs removidos"
    fi
}

remove_system_packages() {
    if [[ "$FULL_UNINSTALL" == "true" ]]; then
        warning "Remoção de pacotes do sistema (Node.js, PostgreSQL, etc.) não é recomendada"
        warning "Outros serviços podem depender deles"

        if confirm "Deseja realmente remover os pacotes do sistema?"; then
            info "Removendo pacotes..."

            # Remove PM2
            npm uninstall -g pm2 2>/dev/null || true

            # NÃO remove Node.js, PostgreSQL, Nginx por segurança
            warning "Node.js, PostgreSQL e Nginx foram mantidos"
            warning "Remova-os manualmente se desejar"
        fi
    fi
}

# =============================================================================
# Função Principal
# =============================================================================

main() {
    echo ""
    echo -e "${RED}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║${NC}  ${BOLD}Sistema de Câmara Municipal - Desinstalação${NC}                   ${RED}║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    # Processa argumentos
    while [[ $# -gt 0 ]]; do
        case $1 in
            --keep-database)
                KEEP_DATABASE=true
                shift
                ;;
            --full)
                FULL_UNINSTALL=true
                shift
                ;;
            *)
                shift
                ;;
        esac
    done

    check_root

    # Aviso
    warning "Esta ação irá remover o Sistema de Câmara Municipal"
    echo ""

    if [[ "$FULL_UNINSTALL" == "true" ]]; then
        warning "Modo FULL: Todos os dados serão removidos!"
    fi

    if [[ "$KEEP_DATABASE" == "true" ]]; then
        info "Banco de dados será mantido (--keep-database)"
    fi

    echo ""

    if ! confirm "Tem certeza que deseja continuar?"; then
        echo ""
        info "Desinstalação cancelada"
        exit 0
    fi

    echo ""

    # Cria backup final
    create_final_backup

    # Remove componentes
    stop_pm2
    stop_docker
    remove_nginx_config
    remove_ssl_certificate
    remove_database
    remove_pm2_startup
    remove_logs
    remove_application_files

    if [[ "$FULL_UNINSTALL" == "true" ]]; then
        remove_system_packages
    fi

    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║${NC}  ${BOLD}Desinstalação Concluída${NC}                                       ${GREEN}║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    echo "Os backups foram salvos em: ${BACKUP_DIR}"
    echo ""

    if [[ "$KEEP_DATABASE" == "true" ]]; then
        echo "O banco de dados foi mantido para reinstalação futura."
    fi

    echo ""
}

# =============================================================================
# Execução
# =============================================================================

main "$@"
