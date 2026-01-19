#!/bin/bash
# =============================================================================
# setup-app.sh - Instalação da Aplicação
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

DEFAULT_APP_DIR="/var/www/camara"
DEFAULT_REPO_URL="https://github.com/seu-usuario/camara.git"
DEFAULT_BRANCH="main"

# =============================================================================
# Clonagem do Repositório
# =============================================================================

# Clona ou atualiza repositório
clone_or_update_repo() {
    local repo_url="${1:-$DEFAULT_REPO_URL}"
    local app_dir="${2:-$DEFAULT_APP_DIR}"
    local branch="${3:-$DEFAULT_BRANCH}"

    # Verifica se diretório já existe
    if [[ -d "$app_dir" ]]; then
        if [[ -d "${app_dir}/.git" ]]; then
            info "Repositório já existe. Atualizando..."

            cd "$app_dir" || return 1
            git fetch origin
            git checkout "$branch"
            git pull origin "$branch"

            success "Repositório atualizado"
            return 0
        else
            warning "Diretório existe mas não é um repositório git"

            if confirm "Deseja remover e clonar novamente?"; then
                rm -rf "$app_dir"
            else
                return 1
            fi
        fi
    fi

    # Cria diretório pai se necessário
    mkdir -p "$(dirname "$app_dir")"

    # Clona repositório
    info "Clonando repositório..."

    git clone --depth 1 --branch "$branch" "$repo_url" "$app_dir"

    if [[ -d "${app_dir}/.git" ]]; then
        success "Repositório clonado em $app_dir"
        return 0
    fi

    error "Falha ao clonar repositório"
    return 1
}

# =============================================================================
# Instalação de Dependências
# =============================================================================

# Instala dependências npm
install_npm_dependencies() {
    local app_dir="$1"

    info "Instalando dependências npm..."

    cd "$app_dir" || return 1

    # Limpa cache se houver problemas anteriores
    npm cache clean --force 2>/dev/null

    # Instala dependências
    npm ci --only=production 2>/dev/null || npm install

    if [[ -d "${app_dir}/node_modules" ]]; then
        success "Dependências npm instaladas"
        return 0
    fi

    error "Falha ao instalar dependências npm"
    return 1
}

# =============================================================================
# Configuração do Ambiente
# =============================================================================

# Gera arquivo .env
generate_env_file() {
    local app_dir="$1"
    local env_file="${app_dir}/.env"

    info "Gerando arquivo .env..."

    # Gera NEXTAUTH_SECRET se não definido
    if [[ -z "$NEXTAUTH_SECRET" ]]; then
        NEXTAUTH_SECRET=$(generate_nextauth_secret)
    fi

    cat > "$env_file" << EOF
# =============================================================================
# Configuração de Ambiente - Sistema de Câmara Municipal
# Gerado pelo instalador em $(date '+%Y-%m-%d %H:%M:%S')
# =============================================================================

# Banco de Dados
DATABASE_URL="${DATABASE_URL}"
DIRECT_URL="${DIRECT_URL:-$DATABASE_URL}"

# Autenticação
NEXTAUTH_URL="${NEXTAUTH_URL:-https://${DOMAIN:-localhost}}"
NEXTAUTH_SECRET="${NEXTAUTH_SECRET}"

# Identificação do Site
SITE_NAME="${SITE_NAME:-Câmara Municipal}"
SITE_URL="${SITE_URL:-https://${DOMAIN:-localhost}}"
NEXT_PUBLIC_SITE_NAME="${SITE_NAME:-Câmara Municipal}"
NEXT_PUBLIC_SITE_URL="${SITE_URL:-https://${DOMAIN:-localhost}}"

# Ambiente
NODE_ENV="production"

# Email (configurar se necessário)
# EMAIL_SERVER_HOST="smtp.gmail.com"
# EMAIL_SERVER_PORT=587
# EMAIL_SERVER_USER=""
# EMAIL_SERVER_PASSWORD=""
# EMAIL_FROM="noreply@${DOMAIN:-localhost}"

# Uploads
UPLOAD_DIR="./public/uploads"
MAX_FILE_SIZE=10485760
EOF

    # Define permissões restritivas
    chmod 600 "$env_file"

    if [[ -f "$env_file" ]]; then
        success "Arquivo .env gerado"
        return 0
    fi

    error "Falha ao gerar arquivo .env"
    return 1
}

# =============================================================================
# Build da Aplicação
# =============================================================================

# Gera cliente Prisma
generate_prisma_client() {
    local app_dir="$1"

    info "Gerando cliente Prisma..."

    cd "$app_dir" || return 1

    npx prisma generate

    if [[ $? -eq 0 ]]; then
        success "Cliente Prisma gerado"
        return 0
    fi

    error "Falha ao gerar cliente Prisma"
    return 1
}

# Executa migrations do banco
run_prisma_migrations() {
    local app_dir="$1"

    info "Executando migrations..."

    cd "$app_dir" || return 1

    # Executa migrations
    npx prisma migrate deploy

    if [[ $? -eq 0 ]]; then
        success "Migrations executadas"
        return 0
    fi

    error "Falha ao executar migrations"
    return 1
}

# Executa push do schema (alternativa a migrations)
push_prisma_schema() {
    local app_dir="$1"

    info "Aplicando schema ao banco..."

    cd "$app_dir" || return 1

    npx prisma db push --accept-data-loss

    if [[ $? -eq 0 ]]; then
        success "Schema aplicado ao banco"
        return 0
    fi

    error "Falha ao aplicar schema"
    return 1
}

# Executa seed
run_prisma_seed() {
    local app_dir="$1"

    info "Executando seed..."

    cd "$app_dir" || return 1

    # Verifica se tem script de seed
    if [[ -f "${app_dir}/prisma/seed.ts" ]] || [[ -f "${app_dir}/prisma/seed.js" ]]; then
        npx prisma db seed

        if [[ $? -eq 0 ]]; then
            success "Seed executado"
            return 0
        fi

        warning "Seed pode ter falhado"
        return 0
    fi

    info "Nenhum script de seed encontrado"
    return 0
}

# Executa build do Next.js
build_nextjs() {
    local app_dir="$1"

    info "Executando build do Next.js..."

    cd "$app_dir" || return 1

    # Variáveis de ambiente para build
    export NEXT_TELEMETRY_DISABLED=1

    npm run build

    if [[ -d "${app_dir}/.next" ]]; then
        success "Build concluído"
        return 0
    fi

    error "Falha no build"
    return 1
}

# =============================================================================
# Criação do Usuário Admin
# =============================================================================

# Cria usuário administrador
create_admin_user() {
    local app_dir="$1"
    local admin_name="$2"
    local admin_email="$3"
    local admin_password="$4"

    info "Criando usuário administrador..."

    cd "$app_dir" || return 1

    # Script para criar admin via Prisma
    cat > "${app_dir}/create-admin.js" << EOF
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('${admin_password}', 12);

  const user = await prisma.user.upsert({
    where: { email: '${admin_email}' },
    update: {
      name: '${admin_name}',
      password: hashedPassword,
      role: 'ADMIN',
      emailVerified: new Date(),
    },
    create: {
      name: '${admin_name}',
      email: '${admin_email}',
      password: hashedPassword,
      role: 'ADMIN',
      emailVerified: new Date(),
    },
  });

  console.log('Admin criado:', user.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.\$disconnect());
EOF

    # Executa script
    node "${app_dir}/create-admin.js"

    local result=$?

    # Remove script temporário
    rm -f "${app_dir}/create-admin.js"

    if [[ $result -eq 0 ]]; then
        success "Usuário administrador criado"
        return 0
    fi

    error "Falha ao criar usuário administrador"
    return 1
}

# =============================================================================
# Coleta Interativa
# =============================================================================

# Coleta informações da Câmara
collect_camara_info() {
    print_section "CONFIGURAÇÃO DA CÂMARA MUNICIPAL"

    # Nome completo
    local site_name
    while true; do
        echo -en "${WHITE}Nome completo da Câmara:${NC} "
        read -r site_name

        if [[ ${#site_name} -ge 10 ]]; then
            break
        fi
        error "Nome deve ter pelo menos 10 caracteres"
    done

    # Sigla (opcional)
    local sigla
    echo -en "${WHITE}Sigla (opcional):${NC} "
    read -r sigla

    # CNPJ (opcional)
    local cnpj
    echo -en "${WHITE}CNPJ (opcional):${NC} "
    read -r cnpj

    if [[ -n "$cnpj" ]]; then
        if ! validate_cnpj_format "$cnpj" >/dev/null; then
            warning "CNPJ com formato inválido, mas continuando..."
        fi
    fi

    # UF
    local uf
    while true; do
        echo -en "${WHITE}Estado (UF):${NC} "
        read -r uf

        if validate_uf "$uf" >/dev/null; then
            uf=$(echo "$uf" | tr '[:lower:]' '[:upper:]')
            break
        fi
        error "UF inválida"
    done

    # Cidade
    local cidade
    while true; do
        echo -en "${WHITE}Cidade:${NC} "
        read -r cidade

        if [[ ${#cidade} -ge 3 ]]; then
            break
        fi
        error "Nome da cidade deve ter pelo menos 3 caracteres"
    done

    # Exporta variáveis
    export SITE_NAME="$site_name"
    export SITE_SIGLA="$sigla"
    export SITE_CNPJ="$cnpj"
    export SITE_UF="$uf"
    export SITE_CIDADE="$cidade"

    success "Informações da Câmara coletadas"
    return 0
}

# Coleta informações do domínio
collect_domain_info() {
    print_section "CONFIGURAÇÃO DE DOMÍNIO E SSL"

    # Domínio
    local domain
    while true; do
        echo -en "${WHITE}Domínio do site (sem http://):${NC} "
        read -r domain

        if validated=$(validate_domain "$domain"); then
            domain="$validated"
            break
        fi
        error "Domínio inválido"
    done

    # Email para SSL
    local ssl_email
    while true; do
        echo -en "${WHITE}Email para certificado SSL (Let's Encrypt):${NC} "
        read -r ssl_email

        if validate_email "$ssl_email" >/dev/null; then
            break
        fi
        error "Email inválido"
    done

    # Configurar SSL?
    local setup_ssl
    if confirm "Configurar SSL automaticamente?"; then
        setup_ssl="true"
    else
        setup_ssl="false"
    fi

    # Exporta variáveis
    export DOMAIN="$domain"
    export SSL_EMAIL="$ssl_email"
    export SETUP_SSL="$setup_ssl"
    export SITE_URL="https://${domain}"
    export NEXTAUTH_URL="https://${domain}"

    success "Informações do domínio coletadas"
    return 0
}

# Coleta informações do administrador
collect_admin_info() {
    print_section "CRIAÇÃO DO USUÁRIO ADMINISTRADOR"

    # Nome
    local admin_name
    while true; do
        echo -en "${WHITE}Nome do administrador:${NC} "
        read -r admin_name

        if [[ ${#admin_name} -ge 3 ]]; then
            break
        fi
        error "Nome deve ter pelo menos 3 caracteres"
    done

    # Email
    local admin_email
    while true; do
        echo -en "${WHITE}Email do administrador:${NC} "
        read -r admin_email

        if validate_email "$admin_email" >/dev/null; then
            break
        fi
        error "Email inválido"
    done

    # Senha
    local admin_password
    local attempts=0
    while true; do
        echo -en "${WHITE}Senha (mínimo 8 caracteres):${NC} "
        read -rs admin_password
        echo ""

        if [[ ${#admin_password} -lt 8 ]]; then
            error "Senha deve ter pelo menos 8 caracteres"
            ((attempts++))
            if [[ $attempts -ge 3 ]]; then
                error "Máximo de tentativas excedido"
                return 1
            fi
            continue
        fi

        echo -en "${WHITE}Confirme a senha:${NC} "
        read -rs admin_password_confirm
        echo ""

        if [[ "$admin_password" == "$admin_password_confirm" ]]; then
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
    export ADMIN_NAME="$admin_name"
    export ADMIN_EMAIL="$admin_email"
    export ADMIN_PASSWORD="$admin_password"

    success "Informações do administrador coletadas"
    return 0
}

# =============================================================================
# Função Principal
# =============================================================================

# Setup completo da aplicação
setup_app_complete() {
    local app_dir="${1:-$DEFAULT_APP_DIR}"
    local repo_url="${2:-$DEFAULT_REPO_URL}"
    local branch="${3:-$DEFAULT_BRANCH}"

    # Clona repositório
    clone_or_update_repo "$repo_url" "$app_dir" "$branch" || return 1

    # Instala dependências
    install_npm_dependencies "$app_dir" || return 1

    # Gera .env
    generate_env_file "$app_dir" || return 1

    # Gera cliente Prisma
    generate_prisma_client "$app_dir" || return 1

    # Executa migrations
    if ! run_prisma_migrations "$app_dir"; then
        warning "Migrations falharam. Tentando db push..."
        push_prisma_schema "$app_dir" || return 1
    fi

    # Executa seed
    run_prisma_seed "$app_dir"

    # Build
    build_nextjs "$app_dir" || return 1

    # Cria admin se informações disponíveis
    if [[ -n "$ADMIN_EMAIL" && -n "$ADMIN_PASSWORD" ]]; then
        create_admin_user "$app_dir" "$ADMIN_NAME" "$ADMIN_EMAIL" "$ADMIN_PASSWORD"
    fi

    success "Aplicação configurada com sucesso"
    return 0
}

# =============================================================================
# Permissões
# =============================================================================

# Configura permissões de arquivos
setup_file_permissions() {
    local app_dir="$1"
    local user="${2:-www-data}"

    info "Configurando permissões..."

    # Diretório de uploads
    mkdir -p "${app_dir}/public/uploads"
    chmod -R 755 "${app_dir}/public/uploads"

    # .env deve ser restritivo
    chmod 600 "${app_dir}/.env"

    # Arquivos de log
    mkdir -p /var/log/camara
    chmod 755 /var/log/camara

    success "Permissões configuradas"
    return 0
}

# =============================================================================
# Diagnóstico
# =============================================================================

# Verifica se aplicação está funcionando
verify_app_health() {
    local app_dir="$1"
    local max_attempts="${2:-30}"
    local port="${3:-3000}"

    info "Verificando saúde da aplicação..."

    for ((i=1; i<=max_attempts; i++)); do
        if curl -sf "http://localhost:${port}" > /dev/null 2>&1; then
            success "Aplicação respondendo em localhost:${port}"
            return 0
        fi

        echo -n "."
        sleep 2
    done

    echo ""
    error "Aplicação não respondeu após $((max_attempts * 2)) segundos"
    return 1
}

# Diagnóstico completo da aplicação
diagnose_app() {
    local app_dir="${1:-$DEFAULT_APP_DIR}"

    title "Diagnóstico da Aplicação"

    # Verifica diretório
    if [[ -d "$app_dir" ]]; then
        progress_item "done" "Diretório existe: $app_dir"
    else
        progress_item "error" "Diretório não encontrado: $app_dir"
        return 1
    fi

    # Verifica .env
    if [[ -f "${app_dir}/.env" ]]; then
        progress_item "done" "Arquivo .env existe"
    else
        progress_item "error" "Arquivo .env não encontrado"
    fi

    # Verifica node_modules
    if [[ -d "${app_dir}/node_modules" ]]; then
        progress_item "done" "Dependências instaladas"
    else
        progress_item "error" "node_modules não encontrado"
    fi

    # Verifica build
    if [[ -d "${app_dir}/.next" ]]; then
        progress_item "done" "Build presente"
    else
        progress_item "error" "Build não encontrado (.next)"
    fi

    # Verifica conectividade local
    echo ""
    info "Testando conectividade..."

    if curl -sf "http://localhost:3000" > /dev/null 2>&1; then
        progress_item "done" "Aplicação respondendo em localhost:3000"
    else
        progress_item "error" "Aplicação não responde em localhost:3000"
    fi

    echo ""
    return 0
}
