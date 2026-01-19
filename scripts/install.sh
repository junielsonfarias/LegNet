#!/bin/bash
# =============================================================================
# install.sh - Script Principal de Instalação
# Sistema de Câmara Municipal
# =============================================================================
#
# Uso:
#   curl -fsSL https://raw.githubusercontent.com/seu-repo/main/scripts/install.sh | sudo bash
#
# Ou localmente:
#   sudo ./scripts/install.sh
#
# =============================================================================

set -e

# =============================================================================
# Configuração Inicial
# =============================================================================

# Diretório do script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Verifica se está rodando a partir do repositório ou download direto
if [[ -f "${SCRIPT_DIR}/lib/colors.sh" ]]; then
    # Executando do repositório local
    LIB_DIR="${SCRIPT_DIR}/lib"
else
    # Baixando e executando diretamente
    LIB_DIR="/tmp/camara-install-lib"
    REPO_URL="https://raw.githubusercontent.com/seu-usuario/camara/main/scripts"

    mkdir -p "$LIB_DIR"

    echo "Baixando scripts de instalação..."
    for lib in colors utils validations install-deps setup-postgresql setup-supabase setup-docker setup-nginx setup-ssl setup-pm2 setup-app; do
        curl -fsSL "${REPO_URL}/lib/${lib}.sh" -o "${LIB_DIR}/${lib}.sh" 2>/dev/null || true
    done
fi

# Carrega bibliotecas
source "${LIB_DIR}/colors.sh"
source "${LIB_DIR}/utils.sh"
source "${LIB_DIR}/validations.sh"
source "${LIB_DIR}/install-deps.sh"
source "${LIB_DIR}/setup-postgresql.sh"
source "${LIB_DIR}/setup-supabase.sh"
source "${LIB_DIR}/setup-docker.sh"
source "${LIB_DIR}/setup-nginx.sh"
source "${LIB_DIR}/setup-ssl.sh"
source "${LIB_DIR}/setup-pm2.sh"
source "${LIB_DIR}/setup-app.sh"

# =============================================================================
# Constantes
# =============================================================================

VERSION="1.0.0"
APP_DIR="/var/www/camara"
REPO_URL="https://github.com/seu-usuario/camara.git"
BRANCH="main"

# Variáveis globais
INSTALL_TYPE=""
DOMAIN=""
SSL_EMAIL=""
DATABASE_URL=""
DIRECT_URL=""
ADMIN_EMAIL=""
ADMIN_PASSWORD=""
ADMIN_NAME=""
SITE_NAME=""

# =============================================================================
# Funções de Interface
# =============================================================================

# Exibe tela de boas-vindas
show_welcome() {
    print_header

    echo -e "   Este assistente irá guiá-lo na instalação do sistema."
    echo -e "   Pressione ${BOLD}ENTER${NC} para continuar ou ${BOLD}CTRL+C${NC} para cancelar."
    echo ""

    wait_enter
}

# Exibe menu de tipo de instalação
show_install_type_menu() {
    print_section "TIPO DE INSTALAÇÃO"

    echo "Selecione o tipo de instalação:"
    echo ""
    echo -e "  ${CYAN}[1]${NC} ${BOLD}🖥️  VPS Completa (PostgreSQL Local)${NC}"
    echo -e "      Recomendado para servidores dedicados"
    echo -e "      Banco de dados e aplicação na mesma máquina"
    echo ""
    echo -e "  ${CYAN}[2]${NC} ${BOLD}☁️  VPS + Supabase (Banco na Nuvem)${NC}"
    echo -e "      Recomendado para multi-tenant ou escalabilidade"
    echo -e "      Apenas aplicação na VPS, banco no Supabase"
    echo ""
    echo -e "  ${CYAN}[3]${NC} ${BOLD}🐳 Docker Compose${NC}"
    echo -e "      Recomendado para ambientes containerizados"
    echo -e "      Tudo em containers isolados"
    echo ""

    local choice
    while true; do
        echo -en "${WHITE}Digite sua escolha [1-3]:${NC} "
        read -r choice

        case "$choice" in
            1)
                INSTALL_TYPE="vps_local"
                success "Selecionado: VPS Completa (PostgreSQL Local)"
                break
                ;;
            2)
                INSTALL_TYPE="vps_supabase"
                success "Selecionado: VPS + Supabase"
                break
                ;;
            3)
                INSTALL_TYPE="docker"
                success "Selecionado: Docker Compose"
                break
                ;;
            *)
                error "Opção inválida. Digite 1, 2 ou 3."
                ;;
        esac
    done
}

# Exibe resumo e pede confirmação
show_summary() {
    print_section "RESUMO DA INSTALAÇÃO"

    echo -e "${BOLD}Tipo de instalação:${NC}    $INSTALL_TYPE"
    echo -e "${BOLD}Nome da Câmara:${NC}        ${SITE_NAME:-Não definido}"
    echo -e "${BOLD}Domínio:${NC}               ${DOMAIN:-localhost}"
    echo -e "${BOLD}SSL:${NC}                   ${SETUP_SSL:-Não}"
    echo -e "${BOLD}Administrador:${NC}         ${ADMIN_EMAIL:-Não definido}"
    echo ""

    echo "As seguintes ações serão realizadas:"

    case "$INSTALL_TYPE" in
        vps_local)
            echo -e "  ${CYAN}•${NC} Instalar Node.js 20 LTS"
            echo -e "  ${CYAN}•${NC} Instalar PostgreSQL 15"
            echo -e "  ${CYAN}•${NC} Instalar Nginx"
            echo -e "  ${CYAN}•${NC} Configurar firewall (UFW)"
            echo -e "  ${CYAN}•${NC} Clonar repositório"
            echo -e "  ${CYAN}•${NC} Configurar banco de dados"
            if [[ "$SETUP_SSL" == "true" ]]; then
                echo -e "  ${CYAN}•${NC} Gerar certificado SSL"
            fi
            echo -e "  ${CYAN}•${NC} Configurar PM2 para produção"
            ;;
        vps_supabase)
            echo -e "  ${CYAN}•${NC} Instalar Node.js 20 LTS"
            echo -e "  ${CYAN}•${NC} Instalar Nginx"
            echo -e "  ${CYAN}•${NC} Configurar firewall (UFW)"
            echo -e "  ${CYAN}•${NC} Clonar repositório"
            echo -e "  ${CYAN}•${NC} Configurar conexão com Supabase"
            if [[ "$SETUP_SSL" == "true" ]]; then
                echo -e "  ${CYAN}•${NC} Gerar certificado SSL"
            fi
            echo -e "  ${CYAN}•${NC} Configurar PM2 para produção"
            ;;
        docker)
            echo -e "  ${CYAN}•${NC} Instalar Docker e Docker Compose"
            echo -e "  ${CYAN}•${NC} Configurar firewall (UFW)"
            echo -e "  ${CYAN}•${NC} Clonar repositório"
            echo -e "  ${CYAN}•${NC} Gerar docker-compose.yml"
            echo -e "  ${CYAN}•${NC} Iniciar containers"
            ;;
    esac

    echo ""

    if ! confirm "Deseja continuar?"; then
        echo ""
        warning "Instalação cancelada pelo usuário"
        exit 0
    fi
}

# Exibe tela de conclusão
show_completion() {
    print_success_final

    echo -e "Seu sistema está disponível em:"
    if [[ "$SETUP_SSL" == "true" ]]; then
        echo -e "  ${CYAN}🌐 https://${DOMAIN}${NC}"
    else
        echo -e "  ${CYAN}🌐 http://${DOMAIN}${NC}"
    fi
    echo ""

    echo -e "Credenciais de acesso:"
    echo -e "  ${CYAN}📧${NC} Email: ${ADMIN_EMAIL}"
    echo -e "  ${CYAN}🔑${NC} Senha: (a que você definiu)"
    echo ""

    echo -e "${BOLD}Próximos passos:${NC}"
    echo "  1. Acesse o painel administrativo em /admin"
    echo "  2. Configure os dados institucionais"
    echo "  3. Cadastre os parlamentares"
    echo "  4. Importe documentos e publicações"
    echo ""

    echo -e "${BOLD}Comandos úteis:${NC}"
    case "$INSTALL_TYPE" in
        vps_local|vps_supabase)
            echo -e "  • Ver status:     ${CYAN}pm2 status${NC}"
            echo -e "  • Ver logs:       ${CYAN}pm2 logs camara${NC}"
            echo -e "  • Reiniciar:      ${CYAN}pm2 restart camara${NC}"
            echo -e "  • Atualizar:      ${CYAN}cd ${APP_DIR} && ./scripts/update.sh${NC}"
            ;;
        docker)
            echo -e "  • Ver status:     ${CYAN}docker compose ps${NC}"
            echo -e "  • Ver logs:       ${CYAN}docker compose logs -f${NC}"
            echo -e "  • Reiniciar:      ${CYAN}docker compose restart${NC}"
            echo -e "  • Atualizar:      ${CYAN}cd ${APP_DIR} && ./scripts/update.sh${NC}"
            ;;
    esac
    echo ""

    echo -e "${DIM}Documentação: https://github.com/seu-repo/docs${NC}"
    echo ""

    wait_enter "Pressione ENTER para finalizar"
}

# =============================================================================
# Fluxo de Instalação
# =============================================================================

# Instala dependências baseado no tipo
install_dependencies() {
    title "Instalando Dependências"

    case "$INSTALL_TYPE" in
        vps_local)
            progress_item "running" "Atualizando sistema"
            update_system
            progress_item "done" "Sistema atualizado"

            progress_item "running" "Instalando pacotes essenciais"
            install_essential_packages
            progress_item "done" "Pacotes essenciais instalados"

            progress_item "running" "Instalando Node.js"
            install_nodejs
            progress_item "done" "Node.js instalado"

            progress_item "running" "Instalando PostgreSQL"
            install_postgresql
            progress_item "done" "PostgreSQL instalado"

            progress_item "running" "Instalando Nginx"
            install_nginx
            progress_item "done" "Nginx instalado"

            progress_item "running" "Instalando Certbot"
            install_certbot
            progress_item "done" "Certbot instalado"

            progress_item "running" "Configurando firewall"
            install_ufw
            progress_item "done" "Firewall configurado"
            ;;

        vps_supabase)
            progress_item "running" "Atualizando sistema"
            update_system
            progress_item "done" "Sistema atualizado"

            progress_item "running" "Instalando pacotes essenciais"
            install_essential_packages
            progress_item "done" "Pacotes essenciais instalados"

            progress_item "running" "Instalando Node.js"
            install_nodejs
            progress_item "done" "Node.js instalado"

            progress_item "running" "Instalando Nginx"
            install_nginx
            progress_item "done" "Nginx instalado"

            progress_item "running" "Instalando Certbot"
            install_certbot
            progress_item "done" "Certbot instalado"

            progress_item "running" "Configurando firewall"
            install_ufw
            progress_item "done" "Firewall configurado"
            ;;

        docker)
            progress_item "running" "Atualizando sistema"
            update_system
            progress_item "done" "Sistema atualizado"

            progress_item "running" "Instalando pacotes essenciais"
            install_essential_packages
            progress_item "done" "Pacotes essenciais instalados"

            progress_item "running" "Instalando Docker"
            install_docker
            progress_item "done" "Docker instalado"

            progress_item "running" "Instalando Docker Compose"
            install_docker_compose
            progress_item "done" "Docker Compose instalado"

            progress_item "running" "Configurando firewall"
            install_ufw
            progress_item "done" "Firewall configurado"
            ;;
    esac

    success "Dependências instaladas"
}

# Configura banco de dados
configure_database() {
    title "Configurando Banco de Dados"

    case "$INSTALL_TYPE" in
        vps_local)
            progress_item "running" "Configurando PostgreSQL local"
            setup_postgresql_complete "$DB_NAME" "$DB_USER" "$DB_PASSWORD"
            progress_item "done" "PostgreSQL configurado"
            ;;

        vps_supabase)
            progress_item "done" "Usando Supabase (já configurado)"
            ;;

        docker)
            progress_item "pending" "Banco será configurado no container"
            ;;
    esac

    success "Banco de dados configurado"
}

# Configura aplicação
configure_application() {
    title "Configurando Aplicação"

    progress_item "running" "Clonando repositório"
    clone_or_update_repo "$REPO_URL" "$APP_DIR" "$BRANCH"
    progress_item "done" "Repositório clonado"

    if [[ "$INSTALL_TYPE" != "docker" ]]; then
        progress_item "running" "Instalando dependências npm"
        install_npm_dependencies "$APP_DIR"
        progress_item "done" "Dependências npm instaladas"

        progress_item "running" "Gerando arquivo .env"
        generate_env_file "$APP_DIR"
        progress_item "done" "Arquivo .env gerado"

        progress_item "running" "Gerando cliente Prisma"
        generate_prisma_client "$APP_DIR"
        progress_item "done" "Cliente Prisma gerado"

        progress_item "running" "Executando migrations"
        if run_prisma_migrations "$APP_DIR"; then
            progress_item "done" "Migrations executadas"
        else
            progress_item "running" "Aplicando schema ao banco"
            push_prisma_schema "$APP_DIR"
            progress_item "done" "Schema aplicado"
        fi

        progress_item "running" "Executando seed"
        run_prisma_seed "$APP_DIR"
        progress_item "done" "Seed executado"

        progress_item "running" "Executando build"
        build_nextjs "$APP_DIR"
        progress_item "done" "Build concluído"
    fi

    success "Aplicação configurada"
}

# Configura servidor web
configure_webserver() {
    title "Configurando Servidor Web"

    case "$INSTALL_TYPE" in
        vps_local|vps_supabase)
            progress_item "running" "Configurando Nginx"
            setup_nginx_complete "$DOMAIN" 3000 false
            progress_item "done" "Nginx configurado"

            if [[ "$SETUP_SSL" == "true" ]]; then
                progress_item "running" "Gerando certificado SSL"
                if setup_ssl_complete "$DOMAIN" "$SSL_EMAIL"; then
                    progress_item "done" "Certificado SSL gerado"

                    progress_item "running" "Atualizando Nginx para HTTPS"
                    upgrade_nginx_to_https "$DOMAIN"
                    progress_item "done" "Nginx atualizado para HTTPS"
                else
                    progress_item "error" "Falha no SSL - continuando sem HTTPS"
                    SETUP_SSL="false"
                fi
            fi
            ;;

        docker)
            progress_item "running" "Gerando configurações Docker"
            generate_docker_compose "$APP_DIR" "${DB_NAME:-camara_db}" "${DB_USER:-camara_admin}" "$DOCKER_DB_PASSWORD" "$DOMAIN"
            generate_dockerfile "$APP_DIR"
            generate_docker_nginx_config "$APP_DIR" "$DOMAIN"
            progress_item "done" "Configurações Docker geradas"
            ;;
    esac

    success "Servidor web configurado"
}

# Inicia aplicação
start_application() {
    title "Iniciando Aplicação"

    case "$INSTALL_TYPE" in
        vps_local|vps_supabase)
            progress_item "running" "Configurando PM2"
            setup_pm2_complete "$APP_DIR" 3000
            progress_item "done" "PM2 configurado e aplicação iniciada"
            ;;

        docker)
            progress_item "running" "Iniciando containers"
            docker_compose_up "$APP_DIR"
            progress_item "done" "Containers iniciados"

            progress_item "running" "Aguardando aplicação"
            sleep 30
            progress_item "done" "Aplicação pronta"

            progress_item "running" "Executando migrations"
            docker_run_migrations "$APP_DIR"
            progress_item "done" "Migrations executadas"
            ;;
    esac

    success "Aplicação iniciada"
}

# Cria usuário admin
create_admin() {
    title "Criando Usuário Administrador"

    if [[ -n "$ADMIN_EMAIL" && -n "$ADMIN_PASSWORD" ]]; then
        progress_item "running" "Criando usuário administrador"

        case "$INSTALL_TYPE" in
            vps_local|vps_supabase)
                create_admin_user "$APP_DIR" "$ADMIN_NAME" "$ADMIN_EMAIL" "$ADMIN_PASSWORD"
                ;;
            docker)
                # Executa no container
                docker_compose_exec "$APP_DIR" app node /app/create-admin.js 2>/dev/null || true
                ;;
        esac

        progress_item "done" "Usuário administrador criado"
    else
        progress_item "skip" "Usuário admin não configurado"
    fi

    success "Configuração de usuário concluída"
}

# Verifica instalação
verify_installation_complete() {
    title "Verificando Instalação"

    local all_ok=true

    # Verifica se aplicação está respondendo
    progress_item "running" "Verificando aplicação"
    if verify_app_health "$APP_DIR" 30 3000; then
        progress_item "done" "Aplicação respondendo"
    else
        progress_item "error" "Aplicação não está respondendo"
        all_ok=false
    fi

    # Verifica serviços
    case "$INSTALL_TYPE" in
        vps_local|vps_supabase)
            if service_is_active nginx; then
                progress_item "done" "Nginx ativo"
            else
                progress_item "error" "Nginx não está ativo"
                all_ok=false
            fi

            if is_app_running; then
                progress_item "done" "PM2 rodando"
            else
                progress_item "error" "PM2 não está rodando"
                all_ok=false
            fi
            ;;

        docker)
            if docker ps | grep -q camara-app; then
                progress_item "done" "Container app rodando"
            else
                progress_item "error" "Container app não está rodando"
                all_ok=false
            fi

            if docker ps | grep -q camara-nginx; then
                progress_item "done" "Container nginx rodando"
            else
                progress_item "error" "Container nginx não está rodando"
                all_ok=false
            fi
            ;;
    esac

    if $all_ok; then
        success "Todas as verificações passaram"
    else
        warning "Algumas verificações falharam"
    fi
}

# =============================================================================
# Função Principal
# =============================================================================

main() {
    # Verifica se é root
    if ! check_root; then
        error "Este script deve ser executado como root (use sudo)"
        exit 1
    fi

    # Tela de boas-vindas
    show_welcome

    # Verifica requisitos
    display_requirements_status

    if ! is_supported_os; then
        error "Sistema operacional não suportado"
        echo "Sistemas suportados: Ubuntu 20.04+, Debian 11+"
        exit 1
    fi

    # Verifica dependências faltantes
    local missing
    missing=$(check_system_requirements 2>&1)

    if [[ -n "$missing" ]]; then
        warning "Requisitos não atendidos:"
        echo "$missing"
        echo ""

        if confirm "Deseja instalar as dependências faltantes?"; then
            update_system
            install_essential_packages
        else
            exit 1
        fi
    fi

    # Seleciona tipo de instalação
    show_install_type_menu

    # Coleta informações da Câmara
    collect_camara_info || exit 1

    # Coleta informações do domínio
    collect_domain_info || exit 1

    # Coleta informações do banco de dados
    case "$INSTALL_TYPE" in
        vps_local)
            collect_postgresql_info || exit 1
            ;;
        vps_supabase)
            show_supabase_instructions
            collect_supabase_info || exit 1
            ;;
        docker)
            # Gera senha automática para Docker
            DOCKER_DB_PASSWORD=$(generate_password 24)
            ;;
    esac

    # Coleta informações do admin
    collect_admin_info || exit 1

    # Exibe resumo e pede confirmação
    show_summary

    # Inicia instalação
    print_section "INSTALANDO..."

    install_dependencies
    configure_database
    configure_application
    configure_webserver
    start_application
    create_admin
    verify_installation_complete

    # Conclusão
    show_completion
}

# =============================================================================
# Tratamento de Erros
# =============================================================================

# Handler de erro
error_handler() {
    local line_no=$1
    local error_code=$2

    print_error_final "Erro na linha $line_no (código: $error_code)"
    echo ""
    echo "Verifique os logs em /var/log/camara-install/install.log"
    echo ""
    echo "Para obter ajuda, acesse:"
    echo "  https://github.com/seu-repo/issues"

    exit 1
}

# Registra handler
trap 'error_handler ${LINENO} $?' ERR

# =============================================================================
# Execução
# =============================================================================

# Inicializa logging
mkdir -p /var/log/camara-install
exec > >(tee -a /var/log/camara-install/install.log) 2>&1

# Executa
main "$@"
