#!/bin/bash
# =============================================================================
# setup-supabase.sh - Configuração do Supabase
# Sistema de Câmara Municipal - Instalador
# =============================================================================

# Carrega dependências
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/colors.sh"
source "${SCRIPT_DIR}/utils.sh"
source "${SCRIPT_DIR}/validations.sh"

# =============================================================================
# Constantes
# =============================================================================

SUPABASE_POOLER_PORT="6543"
SUPABASE_DIRECT_PORT="5432"

# =============================================================================
# Validação do Supabase
# =============================================================================

# Extrai host da URL do Supabase
extract_supabase_host() {
    local url="$1"

    # Extrai host da URL PostgreSQL
    echo "$url" | sed -E 's|.*@([^:/]+).*|\1|'
}

# Extrai porta da URL do Supabase
extract_supabase_port() {
    local url="$1"

    # Extrai porta da URL PostgreSQL
    echo "$url" | sed -E 's|.*:([0-9]+)/.*|\1|'
}

# Verifica se URL é do Supabase Pooler (Transaction Mode)
is_pooler_url() {
    local url="$1"
    local port

    port=$(extract_supabase_port "$url")

    [[ "$port" == "$SUPABASE_POOLER_PORT" ]] || [[ "$url" =~ "pgbouncer=true" ]]
}

# Verifica se URL é conexão direta (Session Mode)
is_direct_url() {
    local url="$1"
    local port

    port=$(extract_supabase_port "$url")

    [[ "$port" == "$SUPABASE_DIRECT_PORT" ]] && ! [[ "$url" =~ "pgbouncer" ]]
}

# =============================================================================
# Teste de Conexão
# =============================================================================

# Testa conexão com Supabase
test_supabase_connection() {
    local url="$1"
    local timeout="${2:-10}"

    info "Testando conexão com Supabase..."

    # Tenta conectar usando psql se disponível
    if command_exists psql; then
        PGCONNECT_TIMEOUT=$timeout psql "$url" -c "SELECT 1" >/dev/null 2>&1

        if [[ $? -eq 0 ]]; then
            success "Conexão com Supabase OK"
            return 0
        fi
    fi

    # Fallback: tenta conexão TCP com o host e porta
    local host port
    host=$(extract_supabase_host "$url")
    port=$(extract_supabase_port "$url")

    if test_connection "$host" "$port" "$timeout"; then
        success "Host Supabase acessível"
        return 0
    fi

    error "Falha na conexão com Supabase"
    return 1
}

# Verifica se as URLs do Supabase são válidas
validate_supabase_urls() {
    local pooler_url="$1"
    local direct_url="$2"
    local errors=()

    # Valida formato da URL do pooler
    if ! validate_postgres_url "$pooler_url"; then
        errors+=("DATABASE_URL inválida")
    elif ! is_pooler_url "$pooler_url"; then
        warning "DATABASE_URL não parece ser uma URL de pooler (porta 6543)"
    fi

    # Valida formato da URL direta
    if ! validate_postgres_url "$direct_url"; then
        errors+=("DIRECT_URL inválida")
    elif ! is_direct_url "$direct_url"; then
        warning "DIRECT_URL não parece ser uma conexão direta (porta 5432)"
    fi

    # Verifica se hosts são do Supabase
    if ! [[ "$pooler_url" =~ supabase ]] && ! [[ "$pooler_url" =~ pooler ]]; then
        warning "DATABASE_URL não parece ser do Supabase"
    fi

    # Retorna erros
    if [[ ${#errors[@]} -gt 0 ]]; then
        printf '%s\n' "${errors[@]}"
        return 1
    fi

    return 0
}

# =============================================================================
# Coleta Interativa
# =============================================================================

# Coleta URLs do Supabase interativamente
collect_supabase_info() {
    print_section "CONFIGURAÇÃO DO SUPABASE"

    echo -e "${YELLOW}Para obter as URLs do Supabase:${NC}"
    echo -e "  1. Acesse o painel do seu projeto no Supabase"
    echo -e "  2. Vá em Project Settings > Database"
    echo -e "  3. Copie as Connection Strings"
    echo ""

    # DATABASE_URL (Pooler / Transaction Mode)
    local database_url
    while true; do
        echo -e "${WHITE}Cole a DATABASE_URL do Supabase (com pooling/porta 6543):${NC}"
        echo -en "> "
        read -r database_url

        if [[ -z "$database_url" ]]; then
            error "DATABASE_URL é obrigatória"
            continue
        fi

        if validate_postgres_url "$database_url"; then
            break
        fi

        error "URL inválida. Verifique o formato: postgresql://user:password@host:port/database"
    done

    # DIRECT_URL (Session Mode)
    local direct_url
    while true; do
        echo ""
        echo -e "${WHITE}Cole a DIRECT_URL do Supabase (porta 5432):${NC}"
        echo -en "> "
        read -r direct_url

        if [[ -z "$direct_url" ]]; then
            error "DIRECT_URL é obrigatória"
            continue
        fi

        if validate_postgres_url "$direct_url"; then
            break
        fi

        error "URL inválida. Verifique o formato: postgresql://user:password@host:port/database"
    done

    echo ""

    # Valida URLs
    local validation_errors
    validation_errors=$(validate_supabase_urls "$database_url" "$direct_url" 2>&1)

    if [[ -n "$validation_errors" ]]; then
        error "Erros na validação:"
        echo "$validation_errors"

        if ! confirm "Deseja continuar mesmo assim?"; then
            return 1
        fi
    fi

    # Testa conexão
    echo ""
    if ! test_supabase_connection "$database_url"; then
        warning "Não foi possível testar a conexão com o Supabase"

        if ! confirm "Deseja continuar sem testar a conexão?"; then
            return 1
        fi
    fi

    # Exporta variáveis
    export DATABASE_URL="$database_url"
    export DIRECT_URL="$direct_url"

    echo ""
    success "Configuração do Supabase coletada"
    return 0
}

# =============================================================================
# Função Principal
# =============================================================================

# Setup completo do Supabase
setup_supabase_complete() {
    local database_url="${1:-$DATABASE_URL}"
    local direct_url="${2:-$DIRECT_URL}"

    if [[ -z "$database_url" || -z "$direct_url" ]]; then
        error "URLs do Supabase não fornecidas"
        return 1
    fi

    # Valida URLs
    if ! validate_supabase_urls "$database_url" "$direct_url"; then
        return 1
    fi

    # Testa conexão
    if ! test_supabase_connection "$database_url"; then
        error "Não foi possível conectar ao Supabase"
        return 1
    fi

    # Exporta variáveis
    export DATABASE_URL="$database_url"
    export DIRECT_URL="$direct_url"

    success "Supabase configurado com sucesso"
    return 0
}

# =============================================================================
# Instruções para o Usuário
# =============================================================================

# Exibe instruções detalhadas para configurar Supabase
show_supabase_instructions() {
    print_section "INSTRUÇÕES PARA CONFIGURAR O SUPABASE"

    echo -e "${BOLD}Passo 1: Crie um projeto no Supabase${NC}"
    echo "  1. Acesse https://supabase.com/"
    echo "  2. Clique em 'Start your project'"
    echo "  3. Crie uma nova organização ou use existente"
    echo "  4. Crie um novo projeto"
    echo "  5. Anote a senha do banco de dados"
    echo ""

    echo -e "${BOLD}Passo 2: Obtenha as Connection Strings${NC}"
    echo "  1. No painel do projeto, vá em 'Project Settings'"
    echo "  2. Clique em 'Database' no menu lateral"
    echo "  3. Em 'Connection string', selecione 'URI'"
    echo "  4. Copie as duas URLs:"
    echo ""
    echo -e "     ${CYAN}Transaction (Pooler) - porta 6543${NC}"
    echo "     Use para: DATABASE_URL (Prisma queries)"
    echo ""
    echo -e "     ${CYAN}Session (Direct) - porta 5432${NC}"
    echo "     Use para: DIRECT_URL (Prisma migrations)"
    echo ""

    echo -e "${BOLD}Passo 3: Configure SSL${NC}"
    echo "  - Adicione '?sslmode=require' ao final das URLs se necessário"
    echo ""

    echo -e "${BOLD}Exemplo de URLs:${NC}"
    echo -e "  ${DIM}DATABASE_URL:${NC}"
    echo "  postgresql://postgres.xxxxx:senha@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
    echo ""
    echo -e "  ${DIM}DIRECT_URL:${NC}"
    echo "  postgresql://postgres.xxxxx:senha@aws-0-sa-east-1.pooler.supabase.com:5432/postgres"
    echo ""

    wait_enter "Pressione ENTER quando estiver pronto para continuar"
}

# =============================================================================
# Diagnóstico
# =============================================================================

# Diagnostica problemas de conexão com Supabase
diagnose_supabase_connection() {
    local url="$1"

    info "Diagnosticando conexão com Supabase..."

    local host port
    host=$(extract_supabase_host "$url")
    port=$(extract_supabase_port "$url")

    echo ""
    echo -e "${BOLD}Host:${NC} $host"
    echo -e "${BOLD}Porta:${NC} $port"
    echo ""

    # Testa DNS
    echo -n "Resolvendo DNS... "
    if host "$host" >/dev/null 2>&1; then
        local ip
        ip=$(host "$host" | awk '/has address/ { print $4 }' | head -1)
        echo -e "${GREEN}OK${NC} ($ip)"
    else
        echo -e "${RED}FALHOU${NC}"
        error "DNS não resolveu. Verifique se o host está correto."
        return 1
    fi

    # Testa conectividade TCP
    echo -n "Testando conectividade TCP... "
    if test_connection "$host" "$port" 10; then
        echo -e "${GREEN}OK${NC}"
    else
        echo -e "${RED}FALHOU${NC}"
        error "Não foi possível conectar na porta $port"
        echo ""
        echo "Possíveis causas:"
        echo "  - Firewall bloqueando conexões de saída"
        echo "  - Projeto Supabase pausado ou deletado"
        echo "  - IP não autorizado no Supabase"
        return 1
    fi

    # Testa autenticação
    echo -n "Testando autenticação... "
    if test_supabase_connection "$url" 15; then
        echo -e "${GREEN}OK${NC}"
    else
        echo -e "${RED}FALHOU${NC}"
        error "Autenticação falhou"
        echo ""
        echo "Possíveis causas:"
        echo "  - Senha incorreta"
        echo "  - Usuário não existe"
        echo "  - Banco de dados não existe"
        return 1
    fi

    success "Conexão com Supabase OK"
    return 0
}
