#!/bin/bash
# =============================================================================
# validations.sh - Validações de entrada
# Sistema de Câmara Municipal - Instalador
# =============================================================================

# Carrega dependências
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
[[ -z "$NC" ]] && source "${SCRIPT_DIR}/colors.sh"

# =============================================================================
# Validação de Domínio
# =============================================================================

# Valida formato de domínio
validate_domain() {
    local domain="$1"

    # Remove protocolo se presente
    domain="${domain#http://}"
    domain="${domain#https://}"
    domain="${domain%%/*}"

    # Regex para domínio válido
    local regex="^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$"

    if [[ "$domain" =~ $regex ]]; then
        echo "$domain"
        return 0
    fi

    return 1
}

# Verifica se domínio resolve para um IP
validate_domain_dns() {
    local domain="$1"

    if command_exists dig; then
        dig +short "$domain" | grep -q "^[0-9]"
    elif command_exists nslookup; then
        nslookup "$domain" 2>/dev/null | grep -q "Address:"
    elif command_exists host; then
        host "$domain" 2>/dev/null | grep -q "has address"
    else
        # Fallback: tenta ping
        ping -c 1 -W 2 "$domain" >/dev/null 2>&1
    fi
}

# Verifica se domínio aponta para este servidor
validate_domain_points_here() {
    local domain="$1"
    local my_ip
    local domain_ip

    my_ip=$(get_public_ip)

    if command_exists dig; then
        domain_ip=$(dig +short "$domain" | head -n1)
    elif command_exists nslookup; then
        domain_ip=$(nslookup "$domain" 2>/dev/null | awk '/^Address: / { print $2 }' | tail -n1)
    else
        return 1
    fi

    [[ "$my_ip" == "$domain_ip" ]]
}

# =============================================================================
# Validação de Email
# =============================================================================

# Valida formato de email
validate_email() {
    local email="$1"

    # Regex básico para email
    local regex="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"

    if [[ "$email" =~ $regex ]]; then
        echo "$email"
        return 0
    fi

    return 1
}

# =============================================================================
# Validação de Senha
# =============================================================================

# Valida força da senha
validate_password_strength() {
    local password="$1"
    local min_length="${2:-8}"
    local errors=()

    # Verifica tamanho mínimo
    if [[ ${#password} -lt $min_length ]]; then
        errors+=("Senha deve ter pelo menos $min_length caracteres")
    fi

    # Verifica se tem letras maiúsculas
    if [[ ! "$password" =~ [A-Z] ]]; then
        errors+=("Senha deve conter pelo menos uma letra maiúscula")
    fi

    # Verifica se tem letras minúsculas
    if [[ ! "$password" =~ [a-z] ]]; then
        errors+=("Senha deve conter pelo menos uma letra minúscula")
    fi

    # Verifica se tem números
    if [[ ! "$password" =~ [0-9] ]]; then
        errors+=("Senha deve conter pelo menos um número")
    fi

    # Retorna erros se houver
    if [[ ${#errors[@]} -gt 0 ]]; then
        printf '%s\n' "${errors[@]}"
        return 1
    fi

    return 0
}

# Valida se senhas coincidem
validate_passwords_match() {
    local password1="$1"
    local password2="$2"

    [[ "$password1" == "$password2" ]]
}

# =============================================================================
# Validação de URLs de Banco de Dados
# =============================================================================

# Valida formato de URL PostgreSQL
validate_postgres_url() {
    local url="$1"

    # Regex para URL PostgreSQL
    local regex="^postgres(ql)?://[^:]+:[^@]+@[^:/]+:[0-9]+/[^?]+"

    if [[ "$url" =~ $regex ]]; then
        return 0
    fi

    return 1
}

# Valida formato de URL Supabase
validate_supabase_url() {
    local url="$1"

    # Verifica se contém domínio Supabase
    if [[ "$url" =~ supabase\.com ]] || [[ "$url" =~ supabase\.co ]]; then
        # Verifica formato básico de PostgreSQL
        if validate_postgres_url "$url"; then
            return 0
        fi
    fi

    return 1
}

# Testa conexão com banco de dados PostgreSQL
test_postgres_connection() {
    local url="$1"
    local timeout="${2:-10}"

    # Tenta conectar usando psql
    if command_exists psql; then
        PGCONNECT_TIMEOUT=$timeout psql "$url" -c "SELECT 1" >/dev/null 2>&1
        return $?
    fi

    # Fallback: tenta conectar usando node
    if command_exists node; then
        node -e "
            const { Client } = require('pg');
            const client = new Client({ connectionString: '$url' });
            client.connect()
                .then(() => { client.end(); process.exit(0); })
                .catch(() => process.exit(1));
        " 2>/dev/null
        return $?
    fi

    # Se não tem ferramentas, assume sucesso
    warning "Não foi possível testar conexão com banco de dados"
    return 0
}

# =============================================================================
# Validação de CNPJ
# =============================================================================

# Valida formato de CNPJ
validate_cnpj_format() {
    local cnpj="$1"

    # Remove caracteres não numéricos
    cnpj="${cnpj//[^0-9]/}"

    # Verifica se tem 14 dígitos
    if [[ ${#cnpj} -ne 14 ]]; then
        return 1
    fi

    echo "$cnpj"
    return 0
}

# Valida dígitos verificadores do CNPJ
validate_cnpj() {
    local cnpj="$1"

    # Remove caracteres não numéricos
    cnpj="${cnpj//[^0-9]/}"

    # Verifica tamanho
    if [[ ${#cnpj} -ne 14 ]]; then
        return 1
    fi

    # Verifica se não são todos iguais
    if [[ "$cnpj" =~ ^(.)\1+$ ]]; then
        return 1
    fi

    # Calcula primeiro dígito verificador
    local sum=0
    local weight=(5 4 3 2 9 8 7 6 5 4 3 2)

    for ((i=0; i<12; i++)); do
        sum=$((sum + ${cnpj:$i:1} * ${weight[$i]}))
    done

    local remainder=$((sum % 11))
    local digit1=$((remainder < 2 ? 0 : 11 - remainder))

    # Calcula segundo dígito verificador
    sum=0
    weight=(6 5 4 3 2 9 8 7 6 5 4 3 2)

    for ((i=0; i<13; i++)); do
        sum=$((sum + ${cnpj:$i:1} * ${weight[$i]}))
    done

    remainder=$((sum % 11))
    local digit2=$((remainder < 2 ? 0 : 11 - remainder))

    # Verifica dígitos
    if [[ "${cnpj:12:1}" == "$digit1" ]] && [[ "${cnpj:13:1}" == "$digit2" ]]; then
        return 0
    fi

    return 1
}

# =============================================================================
# Validação de UF
# =============================================================================

# Lista de UFs válidas
VALID_UFS=(
    "AC" "AL" "AP" "AM" "BA" "CE" "DF" "ES" "GO" "MA"
    "MT" "MS" "MG" "PA" "PB" "PR" "PE" "PI" "RJ" "RN"
    "RS" "RO" "RR" "SC" "SP" "SE" "TO"
)

# Valida UF
validate_uf() {
    local uf="$1"

    # Converte para maiúsculas
    uf=$(echo "$uf" | tr '[:lower:]' '[:upper:]')

    for valid_uf in "${VALID_UFS[@]}"; do
        if [[ "$uf" == "$valid_uf" ]]; then
            echo "$uf"
            return 0
        fi
    done

    return 1
}

# =============================================================================
# Validação de Nome
# =============================================================================

# Valida nome (mínimo de caracteres)
validate_name() {
    local name="$1"
    local min_length="${2:-3}"

    # Remove espaços extras
    name=$(echo "$name" | tr -s ' ')
    name=$(trim "$name")

    if [[ ${#name} -ge $min_length ]]; then
        echo "$name"
        return 0
    fi

    return 1
}

# Valida nome de banco de dados
validate_db_name() {
    local name="$1"

    # Apenas letras, números e underscores
    local regex="^[a-zA-Z][a-zA-Z0-9_]*$"

    if [[ "$name" =~ $regex ]] && [[ ${#name} -le 63 ]]; then
        echo "$name"
        return 0
    fi

    return 1
}

# Valida nome de usuário
validate_username() {
    local username="$1"

    # Apenas letras, números, underscores e hífens
    local regex="^[a-zA-Z][a-zA-Z0-9_-]*$"

    if [[ "$username" =~ $regex ]] && [[ ${#username} -ge 3 ]] && [[ ${#username} -le 32 ]]; then
        echo "$username"
        return 0
    fi

    return 1
}

# =============================================================================
# Validação de Porta
# =============================================================================

# Valida número de porta
validate_port() {
    local port="$1"

    if [[ "$port" =~ ^[0-9]+$ ]] && [[ $port -ge 1 ]] && [[ $port -le 65535 ]]; then
        echo "$port"
        return 0
    fi

    return 1
}

# =============================================================================
# Validação de IP
# =============================================================================

# Valida endereço IPv4
validate_ipv4() {
    local ip="$1"
    local regex="^([0-9]{1,3}\.){3}[0-9]{1,3}$"

    if [[ "$ip" =~ $regex ]]; then
        # Verifica cada octeto
        IFS='.' read -ra octets <<< "$ip"
        for octet in "${octets[@]}"; do
            if [[ $octet -gt 255 ]]; then
                return 1
            fi
        done

        echo "$ip"
        return 0
    fi

    return 1
}

# =============================================================================
# Validação de Path
# =============================================================================

# Valida caminho de diretório
validate_path() {
    local path="$1"
    local must_exist="${2:-false}"

    # Verifica se path é absoluto
    if [[ "$path" != /* ]]; then
        return 1
    fi

    # Verifica se contém caracteres inválidos
    if [[ "$path" =~ [[:cntrl:]] ]]; then
        return 1
    fi

    # Verifica existência se necessário
    if [[ "$must_exist" == "true" ]] && [[ ! -d "$path" ]]; then
        return 1
    fi

    echo "$path"
    return 0
}

# =============================================================================
# Funções de Input com Validação
# =============================================================================

# Solicita input com validação
# Uso: result=$(prompt_validated "Mensagem" "validate_function" "erro" "default")
prompt_validated() {
    local message="$1"
    local validator="$2"
    local error_msg="${3:-Valor inválido}"
    local default="$4"
    local max_attempts="${5:-3}"
    local attempts=0
    local value

    while true; do
        if [[ -n "$default" ]]; then
            echo -en "${WHITE}${message}${NC} [${DIM}${default}${NC}]: "
        else
            echo -en "${WHITE}${message}:${NC} "
        fi

        read -r value

        # Usa default se vazio
        if [[ -z "$value" && -n "$default" ]]; then
            value="$default"
        fi

        # Valida
        if validated=$($validator "$value" 2>/dev/null); then
            echo "$validated"
            return 0
        fi

        ((attempts++))

        if [[ $attempts -ge $max_attempts ]]; then
            error "Máximo de tentativas excedido"
            return 1
        fi

        error "$error_msg"
    done
}

# Solicita senha com confirmação
prompt_password_confirmed() {
    local message="${1:-Senha}"
    local min_length="${2:-8}"
    local max_attempts="${3:-3}"
    local attempts=0

    while true; do
        echo -en "${WHITE}${message}:${NC} "
        read -rs password1
        echo ""

        # Valida força
        local errors
        errors=$(validate_password_strength "$password1" "$min_length")

        if [[ -n "$errors" ]]; then
            error "Senha fraca:"
            echo "$errors" | while read -r err; do
                echo -e "  ${RED}•${NC} $err"
            done

            ((attempts++))
            if [[ $attempts -ge $max_attempts ]]; then
                error "Máximo de tentativas excedido"
                return 1
            fi
            continue
        fi

        # Confirma senha
        echo -en "${WHITE}Confirme a senha:${NC} "
        read -rs password2
        echo ""

        if validate_passwords_match "$password1" "$password2"; then
            success "Senha validada"
            echo "$password1"
            return 0
        fi

        error "As senhas não coincidem"
        ((attempts++))

        if [[ $attempts -ge $max_attempts ]]; then
            error "Máximo de tentativas excedido"
            return 1
        fi
    done
}

# =============================================================================
# Validação de Requisitos do Sistema
# =============================================================================

# Verifica todos os requisitos do sistema
check_system_requirements() {
    local errors=()

    # Verifica SO
    if ! is_supported_os; then
        errors+=("Sistema operacional não suportado. Use Ubuntu 20.04+ ou Debian 11+")
    fi

    # Verifica RAM
    local ram
    if ! ram=$(check_ram 1024); then
        errors+=("Memória RAM insuficiente. Mínimo: 1GB")
    fi

    # Verifica espaço em disco
    local disk
    if ! disk=$(check_disk_space "/" 5); then
        errors+=("Espaço em disco insuficiente. Mínimo: 5GB")
    fi

    # Verifica internet
    if ! check_internet; then
        errors+=("Sem conexão com a internet")
    fi

    # Retorna erros
    if [[ ${#errors[@]} -gt 0 ]]; then
        printf '%s\n' "${errors[@]}"
        return 1
    fi

    return 0
}

# Exibe status dos requisitos
display_requirements_status() {
    title "Verificando requisitos do sistema..."

    # Sistema Operacional
    detect_os
    if is_supported_os; then
        progress_item "done" "Sistema Operacional: $OS_PRETTY"
    else
        progress_item "error" "Sistema Operacional: $OS_PRETTY (não suportado)"
    fi

    # Memória RAM
    local ram
    if ram=$(check_ram 1024); then
        progress_item "done" "Memória RAM: ${ram}MB (mínimo: 1024MB)"
    else
        ram=$(free -m | awk '/^Mem:/{print $2}')
        progress_item "error" "Memória RAM: ${ram}MB (mínimo: 1024MB)"
    fi

    # Espaço em disco
    local disk
    if disk=$(check_disk_space "/" 5); then
        progress_item "done" "Espaço em disco: ${disk}GB livres (mínimo: 5GB)"
    else
        disk=$(df -BG "/" | awk 'NR==2 {gsub(/G/, "", $4); print $4}')
        progress_item "error" "Espaço em disco: ${disk}GB livres (mínimo: 5GB)"
    fi

    # Usuário root/sudo
    if check_root 2>/dev/null; then
        progress_item "done" "Usuário com sudo: Sim"
    else
        progress_item "error" "Usuário com sudo: Não"
    fi

    # Conexão com internet
    if check_internet; then
        progress_item "done" "Conexão com internet: OK"
    else
        progress_item "error" "Conexão com internet: Falhou"
    fi

    # Node.js
    if command_exists node; then
        local node_version
        node_version=$(node --version)
        progress_item "done" "Node.js: $node_version"
    else
        progress_item "error" "Node.js: Não instalado"
    fi

    # Git
    if command_exists git; then
        progress_item "done" "Git: Instalado"
    else
        progress_item "error" "Git: Não instalado"
    fi

    echo ""
}
