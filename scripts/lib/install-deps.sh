#!/bin/bash
# =============================================================================
# install-deps.sh - Instalação de dependências do sistema
# Sistema de Câmara Municipal - Instalador
# =============================================================================

# Carrega dependências
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/colors.sh"
source "${SCRIPT_DIR}/utils.sh"

# =============================================================================
# Constantes
# =============================================================================

NODE_VERSION="20"  # LTS
POSTGRESQL_VERSION="15"

# =============================================================================
# Atualização do Sistema
# =============================================================================

# Atualiza o sistema
update_system() {
    info "Atualizando lista de pacotes..."

    if command_exists apt-get; then
        export DEBIAN_FRONTEND=noninteractive

        apt-get update -qq || {
            error "Falha ao atualizar lista de pacotes"
            return 1
        }

        info "Atualizando pacotes instalados..."
        apt-get upgrade -y -qq || {
            warning "Alguns pacotes não foram atualizados"
        }

        success "Sistema atualizado"
        return 0
    fi

    error "Gerenciador de pacotes não suportado"
    return 1
}

# Instala pacotes essenciais
install_essential_packages() {
    info "Instalando pacotes essenciais..."

    local packages=(
        curl
        wget
        gnupg
        ca-certificates
        lsb-release
        software-properties-common
        apt-transport-https
        build-essential
        git
        unzip
        htop
        net-tools
    )

    install_package "${packages[@]}" || {
        error "Falha ao instalar pacotes essenciais"
        return 1
    }

    success "Pacotes essenciais instalados"
    return 0
}

# =============================================================================
# Node.js
# =============================================================================

# Instala Node.js via NodeSource
install_nodejs() {
    local version="${1:-$NODE_VERSION}"

    # Verifica se já está instalado com versão correta
    if command_exists node; then
        local current_version
        current_version=$(node --version | sed 's/v//' | cut -d. -f1)

        if [[ "$current_version" -ge "$version" ]]; then
            success "Node.js v$(node --version) já está instalado"
            return 0
        fi

        warning "Node.js desatualizado. Atualizando..."
    fi

    info "Instalando Node.js ${version}.x..."

    # Adiciona repositório NodeSource
    if ! curl -fsSL "https://deb.nodesource.com/setup_${version}.x" | bash - >/dev/null 2>&1; then
        error "Falha ao adicionar repositório NodeSource"
        return 1
    fi

    # Instala Node.js
    if ! install_package nodejs; then
        error "Falha ao instalar Node.js"
        return 1
    fi

    # Verifica instalação
    if command_exists node && command_exists npm; then
        success "Node.js $(node --version) instalado"
        success "npm $(npm --version) instalado"

        # Atualiza npm para última versão
        npm install -g npm@latest >/dev/null 2>&1

        return 0
    fi

    error "Instalação do Node.js falhou"
    return 1
}

# Instala pacotes npm globais
install_npm_globals() {
    info "Instalando pacotes npm globais..."

    local packages=(
        pm2
    )

    for pkg in "${packages[@]}"; do
        if npm list -g "$pkg" >/dev/null 2>&1; then
            success "$pkg já está instalado"
        else
            npm install -g "$pkg" >/dev/null 2>&1 || {
                warning "Falha ao instalar $pkg"
            }
        fi
    done

    return 0
}

# =============================================================================
# PostgreSQL
# =============================================================================

# Instala PostgreSQL
install_postgresql() {
    local version="${1:-$POSTGRESQL_VERSION}"

    # Verifica se já está instalado
    if command_exists psql; then
        local current_version
        current_version=$(psql --version | grep -oP '\d+' | head -1)

        if [[ "$current_version" -ge "${version%%.*}" ]]; then
            success "PostgreSQL ${current_version} já está instalado"
            return 0
        fi
    fi

    info "Instalando PostgreSQL ${version}..."

    # Adiciona repositório oficial do PostgreSQL
    if [[ ! -f /etc/apt/sources.list.d/pgdg.list ]]; then
        curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /usr/share/keyrings/postgresql-keyring.gpg

        echo "deb [signed-by=/usr/share/keyrings/postgresql-keyring.gpg] https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list

        apt-get update -qq
    fi

    # Instala PostgreSQL
    if ! install_package "postgresql-${version}" "postgresql-contrib-${version}"; then
        # Tenta versão padrão do sistema
        if ! install_package postgresql postgresql-contrib; then
            error "Falha ao instalar PostgreSQL"
            return 1
        fi
    fi

    # Inicia serviço
    systemctl enable postgresql
    systemctl start postgresql

    # Verifica
    if service_is_active postgresql; then
        success "PostgreSQL instalado e rodando"
        return 0
    fi

    error "PostgreSQL não está rodando"
    return 1
}

# =============================================================================
# Nginx
# =============================================================================

# Instala Nginx
install_nginx() {
    # Verifica se já está instalado
    if command_exists nginx; then
        success "Nginx já está instalado: $(nginx -v 2>&1 | cut -d/ -f2)"
        return 0
    fi

    info "Instalando Nginx..."

    if ! install_package nginx; then
        error "Falha ao instalar Nginx"
        return 1
    fi

    # Remove configuração padrão
    rm -f /etc/nginx/sites-enabled/default

    # Inicia serviço
    systemctl enable nginx
    systemctl start nginx

    if service_is_active nginx; then
        success "Nginx instalado e rodando"
        return 0
    fi

    error "Nginx não está rodando"
    return 1
}

# =============================================================================
# Certbot (Let's Encrypt)
# =============================================================================

# Instala Certbot
install_certbot() {
    # Verifica se já está instalado
    if command_exists certbot; then
        success "Certbot já está instalado: $(certbot --version 2>&1 | head -1)"
        return 0
    fi

    info "Instalando Certbot..."

    # Instala snapd se necessário
    if ! command_exists snap; then
        install_package snapd
        systemctl enable snapd
        systemctl start snapd
        sleep 5
    fi

    # Instala certbot via snap
    snap install core 2>/dev/null
    snap refresh core 2>/dev/null
    snap install --classic certbot 2>/dev/null

    # Cria link simbólico
    ln -sf /snap/bin/certbot /usr/bin/certbot

    if command_exists certbot; then
        success "Certbot instalado"
        return 0
    fi

    # Fallback: instala via apt
    if install_package certbot python3-certbot-nginx; then
        success "Certbot instalado via apt"
        return 0
    fi

    error "Falha ao instalar Certbot"
    return 1
}

# =============================================================================
# Docker
# =============================================================================

# Instala Docker
install_docker() {
    # Verifica se já está instalado
    if command_exists docker; then
        success "Docker já está instalado: $(docker --version | cut -d, -f1)"
        return 0
    fi

    info "Instalando Docker..."

    # Remove versões antigas
    apt-get remove -y docker docker-engine docker.io containerd runc 2>/dev/null

    # Adiciona repositório oficial
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list

    apt-get update -qq

    # Instala Docker
    if ! install_package docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin; then
        error "Falha ao instalar Docker"
        return 1
    fi

    # Inicia serviço
    systemctl enable docker
    systemctl start docker

    if service_is_active docker; then
        success "Docker instalado e rodando"
        return 0
    fi

    error "Docker não está rodando"
    return 1
}

# Instala Docker Compose (standalone)
install_docker_compose() {
    # Verifica se já está instalado (plugin ou standalone)
    if docker compose version >/dev/null 2>&1; then
        success "Docker Compose já está instalado (plugin)"
        return 0
    fi

    if command_exists docker-compose; then
        success "Docker Compose já está instalado: $(docker-compose --version | cut -d, -f1)"
        return 0
    fi

    info "Instalando Docker Compose..."

    # Pega última versão
    local latest_version
    latest_version=$(curl -fsSL https://api.github.com/repos/docker/compose/releases/latest | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')

    if [[ -z "$latest_version" ]]; then
        latest_version="v2.24.0"
    fi

    # Download e instala
    curl -fsSL "https://github.com/docker/compose/releases/download/${latest_version}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

    chmod +x /usr/local/bin/docker-compose

    if command_exists docker-compose; then
        success "Docker Compose instalado: $(docker-compose --version | cut -d, -f1)"
        return 0
    fi

    error "Falha ao instalar Docker Compose"
    return 1
}

# =============================================================================
# UFW (Firewall)
# =============================================================================

# Instala e configura UFW
install_ufw() {
    # Verifica se já está instalado
    if ! command_exists ufw; then
        info "Instalando UFW..."
        install_package ufw
    fi

    info "Configurando firewall..."

    # Regras padrão
    ufw default deny incoming >/dev/null 2>&1
    ufw default allow outgoing >/dev/null 2>&1

    # Permite SSH
    ufw allow ssh >/dev/null 2>&1
    ufw allow 22/tcp >/dev/null 2>&1

    # Permite HTTP e HTTPS
    ufw allow 80/tcp >/dev/null 2>&1
    ufw allow 443/tcp >/dev/null 2>&1

    # Habilita UFW
    echo "y" | ufw enable >/dev/null 2>&1

    if ufw status | grep -q "Status: active"; then
        success "Firewall configurado"
        return 0
    fi

    warning "Firewall não foi ativado"
    return 1
}

# =============================================================================
# Função Principal
# =============================================================================

# Instala todas as dependências para VPS Completa
install_all_vps_deps() {
    info "Instalando dependências para VPS Completa..."

    update_system || return 1
    install_essential_packages || return 1
    install_nodejs || return 1
    install_npm_globals || return 1
    install_postgresql || return 1
    install_nginx || return 1
    install_certbot || return 1
    install_ufw || return 1

    success "Todas as dependências instaladas"
    return 0
}

# Instala dependências para VPS + Supabase
install_supabase_deps() {
    info "Instalando dependências para VPS + Supabase..."

    update_system || return 1
    install_essential_packages || return 1
    install_nodejs || return 1
    install_npm_globals || return 1
    install_nginx || return 1
    install_certbot || return 1
    install_ufw || return 1

    success "Dependências para Supabase instaladas"
    return 0
}

# Instala dependências para Docker
install_docker_deps() {
    info "Instalando dependências para Docker..."

    update_system || return 1
    install_essential_packages || return 1
    install_docker || return 1
    install_docker_compose || return 1
    install_ufw || return 1

    success "Dependências Docker instaladas"
    return 0
}

# =============================================================================
# Verificação de Dependências Instaladas
# =============================================================================

# Verifica todas as dependências
check_all_deps() {
    local missing=()

    command_exists node || missing+=("Node.js")
    command_exists npm || missing+=("npm")
    command_exists git || missing+=("Git")
    command_exists nginx || missing+=("Nginx")

    if [[ ${#missing[@]} -gt 0 ]]; then
        echo "${missing[*]}"
        return 1
    fi

    return 0
}

# Exibe status das dependências
display_deps_status() {
    title "Status das Dependências"

    # Node.js
    if command_exists node; then
        progress_item "done" "Node.js: $(node --version)"
    else
        progress_item "error" "Node.js: Não instalado"
    fi

    # npm
    if command_exists npm; then
        progress_item "done" "npm: v$(npm --version)"
    else
        progress_item "error" "npm: Não instalado"
    fi

    # PM2
    if command_exists pm2; then
        progress_item "done" "PM2: $(pm2 --version)"
    else
        progress_item "pending" "PM2: Não instalado"
    fi

    # Git
    if command_exists git; then
        progress_item "done" "Git: $(git --version | cut -d' ' -f3)"
    else
        progress_item "error" "Git: Não instalado"
    fi

    # PostgreSQL
    if command_exists psql; then
        progress_item "done" "PostgreSQL: $(psql --version | grep -oP '\d+\.\d+')"
    else
        progress_item "pending" "PostgreSQL: Não instalado"
    fi

    # Nginx
    if command_exists nginx; then
        progress_item "done" "Nginx: $(nginx -v 2>&1 | cut -d/ -f2)"
    else
        progress_item "pending" "Nginx: Não instalado"
    fi

    # Certbot
    if command_exists certbot; then
        progress_item "done" "Certbot: Instalado"
    else
        progress_item "pending" "Certbot: Não instalado"
    fi

    # Docker
    if command_exists docker; then
        progress_item "done" "Docker: $(docker --version | cut -d, -f1 | cut -d' ' -f3)"
    else
        progress_item "pending" "Docker: Não instalado"
    fi

    echo ""
}
