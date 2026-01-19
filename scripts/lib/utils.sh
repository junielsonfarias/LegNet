#!/bin/bash
# =============================================================================
# utils.sh - Funções utilitárias gerais
# Sistema de Câmara Municipal - Instalador
# =============================================================================

# Carrega colors.sh se não estiver carregado
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
[[ -z "$NC" ]] && source "${SCRIPT_DIR}/colors.sh"

# =============================================================================
# Detecção de Sistema
# =============================================================================

# Detecta o sistema operacional
detect_os() {
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        OS_NAME="$ID"
        OS_VERSION="$VERSION_ID"
        OS_PRETTY="$PRETTY_NAME"
    elif [[ -f /etc/lsb-release ]]; then
        . /etc/lsb-release
        OS_NAME="$DISTRIB_ID"
        OS_VERSION="$DISTRIB_RELEASE"
        OS_PRETTY="$DISTRIB_DESCRIPTION"
    else
        OS_NAME="unknown"
        OS_VERSION="unknown"
        OS_PRETTY="Sistema desconhecido"
    fi

    export OS_NAME OS_VERSION OS_PRETTY
}

# Verifica se o sistema é suportado
is_supported_os() {
    detect_os

    case "$OS_NAME" in
        ubuntu)
            if [[ "${OS_VERSION%%.*}" -ge 20 ]]; then
                return 0
            fi
            ;;
        debian)
            if [[ "${OS_VERSION%%.*}" -ge 11 ]]; then
                return 0
            fi
            ;;
    esac

    return 1
}

# Detecta arquitetura do sistema
detect_arch() {
    local arch
    arch=$(uname -m)

    case "$arch" in
        x86_64|amd64)
            echo "amd64"
            ;;
        aarch64|arm64)
            echo "arm64"
            ;;
        armv7l)
            echo "armv7"
            ;;
        *)
            echo "$arch"
            ;;
    esac
}

# =============================================================================
# Verificações de Requisitos
# =============================================================================

# Verifica se está rodando como root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "Este script deve ser executado como root (use sudo)"
        return 1
    fi
    return 0
}

# Verifica se um comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verifica memória RAM disponível (em MB)
check_ram() {
    local min_mb="${1:-1024}"
    local total_mb

    total_mb=$(free -m | awk '/^Mem:/{print $2}')

    if [[ $total_mb -lt $min_mb ]]; then
        return 1
    fi

    echo "$total_mb"
    return 0
}

# Verifica espaço em disco disponível (em GB)
check_disk_space() {
    local path="${1:-/}"
    local min_gb="${2:-5}"
    local available_gb

    available_gb=$(df -BG "$path" | awk 'NR==2 {gsub(/G/, "", $4); print $4}')

    if [[ $available_gb -lt $min_gb ]]; then
        return 1
    fi

    echo "$available_gb"
    return 0
}

# Verifica se uma porta está em uso
port_in_use() {
    local port="$1"

    if command_exists ss; then
        ss -tuln | grep -q ":${port} "
    elif command_exists netstat; then
        netstat -tuln | grep -q ":${port} "
    else
        # Fallback: tenta conectar na porta
        (echo >/dev/tcp/localhost/"$port") 2>/dev/null
    fi
}

# Verifica conectividade com a internet
check_internet() {
    local test_hosts=("google.com" "github.com" "cloudflare.com")

    for host in "${test_hosts[@]}"; do
        if ping -c 1 -W 5 "$host" >/dev/null 2>&1; then
            return 0
        fi
    done

    return 1
}

# =============================================================================
# Geração de Valores Seguros
# =============================================================================

# Gera uma senha segura
generate_password() {
    local length="${1:-16}"

    if command_exists openssl; then
        openssl rand -base64 "$((length * 2))" | tr -dc 'a-zA-Z0-9!@#$%^&*' | head -c "$length"
    elif [[ -f /dev/urandom ]]; then
        tr -dc 'a-zA-Z0-9!@#$%^&*' < /dev/urandom | head -c "$length"
    else
        # Fallback básico
        date +%s%N | sha256sum | base64 | head -c "$length"
    fi
}

# Gera NEXTAUTH_SECRET
generate_nextauth_secret() {
    if command_exists openssl; then
        openssl rand -base64 32
    else
        generate_password 32
    fi
}

# Gera um slug a partir de um texto
generate_slug() {
    local text="$1"

    echo "$text" | \
        iconv -t ascii//TRANSLIT 2>/dev/null || echo "$text" | \
        tr '[:upper:]' '[:lower:]' | \
        sed -E 's/[^a-z0-9]+/-/g' | \
        sed -E 's/^-+|-+$//g'
}

# =============================================================================
# Manipulação de Arquivos
# =============================================================================

# Faz backup de um arquivo
backup_file() {
    local file="$1"
    local backup_dir="${2:-/var/backups/camara}"
    local timestamp

    timestamp=$(date +%Y%m%d_%H%M%S)

    if [[ -f "$file" ]]; then
        mkdir -p "$backup_dir"
        cp "$file" "${backup_dir}/$(basename "$file").${timestamp}.bak"
        return 0
    fi

    return 1
}

# Substitui variáveis em um template
# Uso: render_template "input.tpl" "output.conf" "VAR1=value1" "VAR2=value2"
render_template() {
    local template="$1"
    local output="$2"
    shift 2

    local content
    content=$(cat "$template")

    for var in "$@"; do
        local key="${var%%=*}"
        local value="${var#*=}"
        content="${content//\{\{$key\}\}/$value}"
    done

    echo "$content" > "$output"
}

# Adiciona linha ao arquivo se não existir
add_line_if_not_exists() {
    local file="$1"
    local line="$2"

    if ! grep -qF "$line" "$file" 2>/dev/null; then
        echo "$line" >> "$file"
        return 0
    fi

    return 1
}

# =============================================================================
# Gerenciamento de Serviços
# =============================================================================

# Verifica se um serviço está ativo
service_is_active() {
    local service="$1"
    systemctl is-active --quiet "$service" 2>/dev/null
}

# Verifica se um serviço existe
service_exists() {
    local service="$1"
    systemctl list-unit-files --type=service | grep -q "^${service}.service"
}

# Reinicia um serviço com verificação
restart_service() {
    local service="$1"

    if service_exists "$service"; then
        systemctl restart "$service"
        sleep 2

        if service_is_active "$service"; then
            return 0
        fi
    fi

    return 1
}

# =============================================================================
# Logging
# =============================================================================

# Diretório de logs
LOG_DIR="${LOG_DIR:-/var/log/camara-install}"
LOG_FILE="${LOG_FILE:-${LOG_DIR}/install.log}"

# Inicializa logging
init_logging() {
    mkdir -p "$LOG_DIR"
    touch "$LOG_FILE"
    chmod 644 "$LOG_FILE"

    # Redireciona stdout e stderr para log também
    exec 3>&1 4>&2
    exec > >(tee -a "$LOG_FILE") 2>&1
}

# Escreve no log
log() {
    local level="${1:-INFO}"
    local message="$2"
    local timestamp

    timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    echo "[${timestamp}] [${level}] ${message}" >> "$LOG_FILE"
}

# Log de comando executado
log_cmd() {
    local cmd="$1"
    log "CMD" "Executando: $cmd"
}

# =============================================================================
# Gerenciamento de Pacotes
# =============================================================================

# Atualiza lista de pacotes
update_packages() {
    if command_exists apt-get; then
        apt-get update -qq
    elif command_exists dnf; then
        dnf check-update -q
    elif command_exists yum; then
        yum check-update -q
    fi
}

# Instala pacote(s)
install_package() {
    local packages=("$@")

    if command_exists apt-get; then
        DEBIAN_FRONTEND=noninteractive apt-get install -y -qq "${packages[@]}"
    elif command_exists dnf; then
        dnf install -y -q "${packages[@]}"
    elif command_exists yum; then
        yum install -y -q "${packages[@]}"
    else
        error "Gerenciador de pacotes não encontrado"
        return 1
    fi
}

# Remove pacote(s)
remove_package() {
    local packages=("$@")

    if command_exists apt-get; then
        apt-get remove -y -qq "${packages[@]}"
    elif command_exists dnf; then
        dnf remove -y -q "${packages[@]}"
    elif command_exists yum; then
        yum remove -y -q "${packages[@]}"
    fi
}

# Verifica se pacote está instalado
package_installed() {
    local package="$1"

    if command_exists dpkg; then
        dpkg -l "$package" 2>/dev/null | grep -q "^ii"
    elif command_exists rpm; then
        rpm -q "$package" >/dev/null 2>&1
    else
        return 1
    fi
}

# =============================================================================
# Configuração do Firewall
# =============================================================================

# Configura UFW
setup_ufw() {
    if ! command_exists ufw; then
        install_package ufw
    fi

    # Regras básicas
    ufw default deny incoming
    ufw default allow outgoing

    # Permite SSH
    ufw allow ssh

    # Permite HTTP e HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp

    # Habilita sem confirmação
    echo "y" | ufw enable

    return 0
}

# Abre uma porta no firewall
open_port() {
    local port="$1"
    local protocol="${2:-tcp}"

    if command_exists ufw; then
        ufw allow "${port}/${protocol}"
    elif command_exists firewall-cmd; then
        firewall-cmd --permanent --add-port="${port}/${protocol}"
        firewall-cmd --reload
    fi
}

# =============================================================================
# Usuários e Permissões
# =============================================================================

# Cria usuário do sistema
create_system_user() {
    local username="$1"
    local home_dir="${2:-/home/$username}"

    if ! id "$username" &>/dev/null; then
        useradd -r -m -d "$home_dir" -s /bin/bash "$username"
        return 0
    fi

    return 1
}

# Adiciona usuário a um grupo
add_user_to_group() {
    local user="$1"
    local group="$2"

    usermod -aG "$group" "$user"
}

# =============================================================================
# Rede
# =============================================================================

# Obtém IP público
get_public_ip() {
    local services=(
        "https://api.ipify.org"
        "https://ifconfig.me"
        "https://icanhazip.com"
    )

    for service in "${services[@]}"; do
        local ip
        ip=$(curl -s --max-time 5 "$service" 2>/dev/null)

        if [[ -n "$ip" && "$ip" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            echo "$ip"
            return 0
        fi
    done

    return 1
}

# Obtém IP local
get_local_ip() {
    hostname -I | awk '{print $1}'
}

# Testa conexão com host:porta
test_connection() {
    local host="$1"
    local port="$2"
    local timeout="${3:-5}"

    if command_exists nc; then
        nc -z -w "$timeout" "$host" "$port" 2>/dev/null
    elif command_exists timeout; then
        timeout "$timeout" bash -c "echo >/dev/tcp/$host/$port" 2>/dev/null
    else
        (echo >/dev/tcp/"$host"/"$port") 2>/dev/null
    fi
}

# =============================================================================
# Git
# =============================================================================

# Clona repositório
clone_repo() {
    local repo_url="$1"
    local dest_dir="$2"
    local branch="${3:-main}"

    if [[ -d "$dest_dir" ]]; then
        warning "Diretório $dest_dir já existe"
        return 1
    fi

    git clone --depth 1 --branch "$branch" "$repo_url" "$dest_dir"
}

# Atualiza repositório
update_repo() {
    local repo_dir="$1"
    local branch="${2:-main}"

    if [[ ! -d "$repo_dir/.git" ]]; then
        error "$repo_dir não é um repositório git"
        return 1
    fi

    cd "$repo_dir" || return 1
    git fetch origin
    git checkout "$branch"
    git pull origin "$branch"
}

# =============================================================================
# Verificação de Instalação
# =============================================================================

# Verifica se a instalação foi bem sucedida
verify_installation() {
    local domain="$1"
    local max_attempts="${2:-30}"
    local delay="${3:-2}"

    info "Verificando instalação..."

    for ((i=1; i<=max_attempts; i++)); do
        if curl -sf "http://localhost:3000" > /dev/null 2>&1; then
            success "Aplicação respondendo em localhost:3000"
            return 0
        fi

        sleep "$delay"
    done

    error "Aplicação não respondeu após $((max_attempts * delay)) segundos"
    return 1
}

# Verifica se serviços estão rodando
verify_services() {
    local services=("$@")
    local all_ok=true

    for service in "${services[@]}"; do
        if service_is_active "$service"; then
            success "Serviço $service está ativo"
        else
            error "Serviço $service não está ativo"
            all_ok=false
        fi
    done

    $all_ok
}

# =============================================================================
# Cleanup
# =============================================================================

# Registra função de cleanup para ser executada no exit
cleanup_functions=()

register_cleanup() {
    cleanup_functions+=("$1")
}

run_cleanup() {
    for func in "${cleanup_functions[@]}"; do
        $func
    done
}

# Trap para cleanup em caso de erro
trap run_cleanup EXIT

# =============================================================================
# Misc
# =============================================================================

# Converte para maiúsculas
to_upper() {
    echo "$1" | tr '[:lower:]' '[:upper:]'
}

# Converte para minúsculas
to_lower() {
    echo "$1" | tr '[:upper:]' '[:lower:]'
}

# Trim de espaços
trim() {
    local var="$1"
    var="${var#"${var%%[![:space:]]*}"}"
    var="${var%"${var##*[![:space:]]}"}"
    echo "$var"
}

# Verifica se string está vazia
is_empty() {
    local var="$1"
    [[ -z "$(trim "$var")" ]]
}

# Espera um processo terminar
wait_for_process() {
    local pid="$1"
    local timeout="${2:-60}"
    local start_time=$SECONDS

    while kill -0 "$pid" 2>/dev/null; do
        if ((SECONDS - start_time >= timeout)); then
            return 1
        fi
        sleep 1
    done

    return 0
}
