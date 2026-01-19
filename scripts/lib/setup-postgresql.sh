#!/bin/bash
# =============================================================================
# setup-postgresql.sh - Configuração do PostgreSQL local
# Sistema de Câmara Municipal - Instalador
# =============================================================================

# Carrega dependências
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/colors.sh"
source "${SCRIPT_DIR}/utils.sh"
source "${SCRIPT_DIR}/validations.sh"

# =============================================================================
# Configuração do PostgreSQL
# =============================================================================

# Cria usuário e banco de dados
setup_postgresql_database() {
    local db_name="$1"
    local db_user="$2"
    local db_password="$3"

    info "Configurando banco de dados PostgreSQL..."

    # Verifica se PostgreSQL está rodando
    if ! service_is_active postgresql; then
        systemctl start postgresql
        sleep 2
    fi

    # Cria usuário se não existir
    info "Criando usuário ${db_user}..."
    sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname = '${db_user}'" | grep -q 1 || {
        sudo -u postgres psql -c "CREATE USER ${db_user} WITH PASSWORD '${db_password}' CREATEDB"
    }

    # Atualiza senha do usuário
    sudo -u postgres psql -c "ALTER USER ${db_user} WITH PASSWORD '${db_password}'"

    # Cria banco se não existir
    info "Criando banco de dados ${db_name}..."
    sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = '${db_name}'" | grep -q 1 || {
        sudo -u postgres psql -c "CREATE DATABASE ${db_name} OWNER ${db_user}"
    }

    # Garante propriedade
    sudo -u postgres psql -c "ALTER DATABASE ${db_name} OWNER TO ${db_user}"

    # Concede privilégios
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${db_name} TO ${db_user}"

    success "Banco de dados configurado"
    return 0
}

# Configura pg_hba.conf para conexões locais
configure_postgresql_access() {
    local pg_version
    local pg_hba_file

    # Encontra versão do PostgreSQL instalada
    pg_version=$(ls /etc/postgresql/ | sort -V | tail -n1)

    if [[ -z "$pg_version" ]]; then
        error "Não foi possível determinar versão do PostgreSQL"
        return 1
    fi

    pg_hba_file="/etc/postgresql/${pg_version}/main/pg_hba.conf"

    info "Configurando acesso PostgreSQL..."

    # Backup do arquivo original
    backup_file "$pg_hba_file"

    # Verifica se já tem configuração para localhost com md5/scram-sha-256
    if ! grep -q "^host.*127.0.0.1.*md5" "$pg_hba_file" && ! grep -q "^host.*127.0.0.1.*scram-sha-256" "$pg_hba_file"; then
        # Adiciona configuração para conexões locais
        cat >> "$pg_hba_file" << 'EOF'

# Configuração adicionada pelo instalador
# Permite conexões locais com autenticação por senha
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             ::1/128                 scram-sha-256
EOF
    fi

    # Reinicia PostgreSQL
    systemctl restart postgresql
    sleep 2

    if service_is_active postgresql; then
        success "Acesso PostgreSQL configurado"
        return 0
    fi

    error "PostgreSQL não reiniciou corretamente"
    return 1
}

# Testa conexão com o banco
test_postgresql_connection() {
    local db_name="$1"
    local db_user="$2"
    local db_password="$3"
    local host="${4:-localhost}"
    local port="${5:-5432}"

    info "Testando conexão com PostgreSQL..."

    # Tenta conectar
    PGPASSWORD="$db_password" psql -h "$host" -p "$port" -U "$db_user" -d "$db_name" -c "SELECT 1" >/dev/null 2>&1

    if [[ $? -eq 0 ]]; then
        success "Conexão com PostgreSQL OK"
        return 0
    fi

    error "Falha na conexão com PostgreSQL"
    return 1
}

# Gera URL de conexão
generate_database_url() {
    local db_name="$1"
    local db_user="$2"
    local db_password="$3"
    local host="${4:-localhost}"
    local port="${5:-5432}"

    # Escapa caracteres especiais na senha
    local encoded_password
    encoded_password=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$db_password', safe=''))" 2>/dev/null || echo "$db_password")

    echo "postgresql://${db_user}:${encoded_password}@${host}:${port}/${db_name}?schema=public"
}

# =============================================================================
# Coleta Interativa
# =============================================================================

# Coleta informações do banco de dados interativamente
collect_postgresql_info() {
    print_section "CONFIGURAÇÃO DO BANCO DE DADOS LOCAL"

    # Nome do banco
    local db_name
    while true; do
        echo -en "${WHITE}Nome do banco de dados${NC} [${DIM}camara_db${NC}]: "
        read -r db_name
        db_name="${db_name:-camara_db}"

        if validate_db_name "$db_name" >/dev/null; then
            break
        fi
        error "Nome inválido. Use apenas letras, números e underscores."
    done

    # Usuário do banco
    local db_user
    while true; do
        echo -en "${WHITE}Usuário do banco${NC} [${DIM}camara_admin${NC}]: "
        read -r db_user
        db_user="${db_user:-camara_admin}"

        if validate_username "$db_user" >/dev/null; then
            break
        fi
        error "Nome de usuário inválido."
    done

    # Senha do banco
    local db_password
    local attempts=0
    while true; do
        echo -en "${WHITE}Senha do banco (mínimo 12 caracteres):${NC} "
        read -rs db_password
        echo ""

        # Valida força
        if [[ ${#db_password} -lt 12 ]]; then
            error "Senha deve ter pelo menos 12 caracteres"
            ((attempts++))
            if [[ $attempts -ge 3 ]]; then
                error "Máximo de tentativas excedido"
                return 1
            fi
            continue
        fi

        # Confirma senha
        echo -en "${WHITE}Confirme a senha:${NC} "
        read -rs db_password_confirm
        echo ""

        if [[ "$db_password" == "$db_password_confirm" ]]; then
            success "Senha validada"
            break
        fi

        error "As senhas não coincidem"
        ((attempts++))
        if [[ $attempts -ge 3 ]]; then
            error "Máximo de tentativas excedido"
            return 1
        fi
    done

    # Exporta variáveis
    export DB_NAME="$db_name"
    export DB_USER="$db_user"
    export DB_PASSWORD="$db_password"
    export DB_HOST="localhost"
    export DB_PORT="5432"
    export DATABASE_URL=$(generate_database_url "$db_name" "$db_user" "$db_password")
    export DIRECT_URL="$DATABASE_URL"

    echo ""
    success "Configuração do banco de dados coletada"
    return 0
}

# =============================================================================
# Função Principal
# =============================================================================

# Setup completo do PostgreSQL
setup_postgresql_complete() {
    local db_name="${1:-$DB_NAME}"
    local db_user="${2:-$DB_USER}"
    local db_password="${3:-$DB_PASSWORD}"

    if [[ -z "$db_name" || -z "$db_user" || -z "$db_password" ]]; then
        error "Informações do banco de dados não fornecidas"
        return 1
    fi

    # Configura acesso
    configure_postgresql_access || return 1

    # Cria usuário e banco
    setup_postgresql_database "$db_name" "$db_user" "$db_password" || return 1

    # Testa conexão
    test_postgresql_connection "$db_name" "$db_user" "$db_password" || return 1

    # Gera URL
    DATABASE_URL=$(generate_database_url "$db_name" "$db_user" "$db_password")
    DIRECT_URL="$DATABASE_URL"

    export DATABASE_URL DIRECT_URL

    success "PostgreSQL configurado com sucesso"
    return 0
}

# =============================================================================
# Backup e Restore
# =============================================================================

# Cria backup do banco
backup_postgresql_database() {
    local db_name="$1"
    local db_user="$2"
    local db_password="$3"
    local backup_dir="${4:-/var/backups/camara}"
    local timestamp
    local backup_file

    timestamp=$(date +%Y%m%d_%H%M%S)
    backup_file="${backup_dir}/backup_${db_name}_${timestamp}.sql.gz"

    mkdir -p "$backup_dir"

    info "Criando backup do banco ${db_name}..."

    PGPASSWORD="$db_password" pg_dump -h localhost -U "$db_user" "$db_name" | gzip > "$backup_file"

    if [[ -f "$backup_file" && -s "$backup_file" ]]; then
        success "Backup criado: $backup_file"
        echo "$backup_file"
        return 0
    fi

    error "Falha ao criar backup"
    return 1
}

# Restaura backup do banco
restore_postgresql_database() {
    local db_name="$1"
    local db_user="$2"
    local db_password="$3"
    local backup_file="$4"

    if [[ ! -f "$backup_file" ]]; then
        error "Arquivo de backup não encontrado: $backup_file"
        return 1
    fi

    info "Restaurando backup para ${db_name}..."

    # Drop e recria banco
    PGPASSWORD="$db_password" psql -h localhost -U "$db_user" -c "DROP DATABASE IF EXISTS ${db_name}"
    PGPASSWORD="$db_password" psql -h localhost -U "$db_user" -c "CREATE DATABASE ${db_name}"

    # Restaura
    if [[ "$backup_file" == *.gz ]]; then
        gunzip -c "$backup_file" | PGPASSWORD="$db_password" psql -h localhost -U "$db_user" "$db_name"
    else
        PGPASSWORD="$db_password" psql -h localhost -U "$db_user" "$db_name" < "$backup_file"
    fi

    if [[ $? -eq 0 ]]; then
        success "Backup restaurado"
        return 0
    fi

    error "Falha ao restaurar backup"
    return 1
}

# =============================================================================
# Otimizações
# =============================================================================

# Aplica otimizações de performance no PostgreSQL
optimize_postgresql() {
    local pg_version
    local pg_conf_file

    pg_version=$(ls /etc/postgresql/ | sort -V | tail -n1)
    pg_conf_file="/etc/postgresql/${pg_version}/main/postgresql.conf"

    info "Aplicando otimizações no PostgreSQL..."

    # Backup
    backup_file "$pg_conf_file"

    # Obtém memória total em MB
    local total_mem_mb
    total_mem_mb=$(free -m | awk '/^Mem:/{print $2}')

    # Calcula valores otimizados
    local shared_buffers=$((total_mem_mb / 4))MB
    local effective_cache_size=$((total_mem_mb * 3 / 4))MB
    local maintenance_work_mem=$((total_mem_mb / 16))MB
    local work_mem=$((total_mem_mb / 64))MB

    # Aplica configurações
    cat >> "$pg_conf_file" << EOF

# Otimizações aplicadas pelo instalador
shared_buffers = ${shared_buffers}
effective_cache_size = ${effective_cache_size}
maintenance_work_mem = ${maintenance_work_mem}
work_mem = ${work_mem}
random_page_cost = 1.1
effective_io_concurrency = 200
EOF

    # Reinicia PostgreSQL
    systemctl restart postgresql
    sleep 2

    if service_is_active postgresql; then
        success "Otimizações aplicadas"
        return 0
    fi

    warning "PostgreSQL pode não ter reiniciado corretamente após otimizações"
    return 1
}
