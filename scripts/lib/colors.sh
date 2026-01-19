#!/bin/bash
# =============================================================================
# colors.sh - Cores e formatação do terminal
# Sistema de Câmara Municipal - Instalador
# =============================================================================

# Cores ANSI
export RED='\033[0;31m'
export GREEN='\033[0;32m'
export YELLOW='\033[1;33m'
export BLUE='\033[0;34m'
export MAGENTA='\033[0;35m'
export CYAN='\033[0;36m'
export WHITE='\033[1;37m'
export GRAY='\033[0;90m'
export NC='\033[0m' # No Color

# Estilos
export BOLD='\033[1m'
export DIM='\033[2m'
export UNDERLINE='\033[4m'
export BLINK='\033[5m'
export REVERSE='\033[7m'
export RESET='\033[0m'

# Cores de fundo
export BG_RED='\033[41m'
export BG_GREEN='\033[42m'
export BG_YELLOW='\033[43m'
export BG_BLUE='\033[44m'

# =============================================================================
# Funções de Output
# =============================================================================

# Imprime mensagem de informação
info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Imprime mensagem de sucesso
success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

# Imprime mensagem de erro
error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Imprime mensagem de aviso
warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Imprime mensagem de debug (só se DEBUG=1)
debug() {
    if [[ "${DEBUG:-0}" == "1" ]]; then
        echo -e "${GRAY}[DEBUG]${NC} $1"
    fi
}

# Imprime um separador
separator() {
    echo -e "${GRAY}────────────────────────────────────────────────────────────────${NC}"
}

# Imprime um título
title() {
    echo ""
    echo -e "${BOLD}${CYAN}$1${NC}"
    separator
}

# Imprime subtítulo
subtitle() {
    echo -e "${BOLD}${WHITE}$1${NC}"
}

# =============================================================================
# Boxes e Frames
# =============================================================================

# Imprime uma box decorativa
print_box() {
    local text="$1"
    local width="${2:-64}"
    local padding=$(( (width - ${#text} - 2) / 2 ))

    echo -e "${CYAN}╔$(printf '═%.0s' $(seq 1 $width))╗${NC}"
    echo -e "${CYAN}║${NC}$(printf ' %.0s' $(seq 1 $padding))${BOLD}$text${NC}$(printf ' %.0s' $(seq 1 $((width - padding - ${#text}))))${CYAN}║${NC}"
    echo -e "${CYAN}╚$(printf '═%.0s' $(seq 1 $width))╝${NC}"
}

# Imprime header principal
print_header() {
    clear
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}                                                                ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}   ${BOLD}🏛️  SISTEMA DE CÂMARA MUNICIPAL - INSTALADOR${NC}                 ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}                                                                ${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Imprime seção com título
print_section() {
    local title="$1"
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}  ${BOLD}${WHITE}$title${NC}$(printf ' %.0s' $(seq 1 $((62 - ${#title}))))${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# =============================================================================
# Spinners e Progresso
# =============================================================================

# Caracteres do spinner
SPINNER_CHARS='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'

# Inicia um spinner em background
# Uso: start_spinner "Mensagem"
start_spinner() {
    local message="$1"
    local delay=0.1
    local i=0

    tput civis # Esconde cursor

    while true; do
        local char="${SPINNER_CHARS:$i:1}"
        printf "\r${CYAN}${char}${NC} ${message}..."
        i=$(( (i + 1) % ${#SPINNER_CHARS} ))
        sleep $delay
    done &

    SPINNER_PID=$!
}

# Para o spinner
stop_spinner() {
    local status="$1"

    if [[ -n "$SPINNER_PID" ]]; then
        kill "$SPINNER_PID" 2>/dev/null
        wait "$SPINNER_PID" 2>/dev/null
    fi

    tput cnorm # Mostra cursor

    if [[ "$status" == "success" ]]; then
        printf "\r${GREEN}[✓]${NC} %s\n" "$2"
    elif [[ "$status" == "error" ]]; then
        printf "\r${RED}[✗]${NC} %s\n" "$2"
    else
        printf "\r    %s\n" "$2"
    fi

    SPINNER_PID=""
}

# Barra de progresso
# Uso: progress_bar 50 "Instalando..."
progress_bar() {
    local percent="$1"
    local message="${2:-Processando}"
    local width=40
    local filled=$(( percent * width / 100 ))
    local empty=$(( width - filled ))

    printf "\r${message}: ["
    printf "${GREEN}%${filled}s${NC}" | tr ' ' '█'
    printf "${GRAY}%${empty}s${NC}" | tr ' ' '░'
    printf "] ${BOLD}%3d%%${NC}" "$percent"
}

# Lista de progresso com checkmarks
# Uso: progress_item "done" "Instalando Node.js"
#      progress_item "running" "Configurando banco"
#      progress_item "pending" "Iniciando aplicação"
progress_item() {
    local status="$1"
    local message="$2"
    local percent="${3:-}"

    case "$status" in
        done|completed|success)
            echo -e "${GREEN}[✓]${NC} $message $([ -n "$percent" ] && echo "[${percent}%]")"
            ;;
        running|in_progress)
            echo -e "${CYAN}[▶]${NC} $message $([ -n "$percent" ] && echo "[${percent}%]")"
            ;;
        error|failed)
            echo -e "${RED}[✗]${NC} $message"
            ;;
        pending|waiting)
            echo -e "${GRAY}[ ]${NC} $message"
            ;;
        skip|skipped)
            echo -e "${YELLOW}[~]${NC} $message ${DIM}(pulado)${NC}"
            ;;
    esac
}

# =============================================================================
# Prompts Interativos
# =============================================================================

# Prompt para entrada de texto
# Uso: result=$(prompt_input "Digite seu nome")
prompt_input() {
    local message="$1"
    local default="${2:-}"
    local result

    if [[ -n "$default" ]]; then
        echo -en "${WHITE}${message}${NC} [${DIM}${default}${NC}]: "
    else
        echo -en "${WHITE}${message}:${NC} "
    fi

    read -r result

    if [[ -z "$result" && -n "$default" ]]; then
        echo "$default"
    else
        echo "$result"
    fi
}

# Prompt para senha (não mostra input)
# Uso: password=$(prompt_password "Digite a senha")
prompt_password() {
    local message="$1"
    local password

    echo -en "${WHITE}${message}:${NC} "
    read -rs password
    echo ""

    echo "$password"
}

# Prompt de confirmação (S/n)
# Uso: if confirm "Deseja continuar?"; then ...
confirm() {
    local message="$1"
    local default="${2:-s}"
    local response

    if [[ "$default" == "s" || "$default" == "S" ]]; then
        echo -en "${WHITE}${message}${NC} [${GREEN}S${NC}/n]: "
    else
        echo -en "${WHITE}${message}${NC} [s/${GREEN}N${NC}]: "
    fi

    read -r response

    if [[ -z "$response" ]]; then
        response="$default"
    fi

    case "$response" in
        [sS]|[yY]|[sS][iI][mM]|[yY][eE][sS])
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

# Menu de seleção
# Uso: choice=$(menu_select "Opção 1" "Opção 2" "Opção 3")
menu_select() {
    local options=("$@")
    local selected=0
    local key

    tput civis # Esconde cursor

    while true; do
        # Renderiza opções
        for i in "${!options[@]}"; do
            if [[ $i -eq $selected ]]; then
                echo -e "  ${CYAN}▶${NC} ${BOLD}${options[$i]}${NC}"
            else
                echo -e "    ${options[$i]}"
            fi
        done

        # Lê tecla
        read -rsn1 key

        case "$key" in
            A) # Seta para cima
                ((selected--))
                [[ $selected -lt 0 ]] && selected=$((${#options[@]} - 1))
                ;;
            B) # Seta para baixo
                ((selected++))
                [[ $selected -ge ${#options[@]} ]] && selected=0
                ;;
            '') # Enter
                break
                ;;
        esac

        # Move cursor para cima para re-renderizar
        tput cuu ${#options[@]}
    done

    tput cnorm # Mostra cursor
    echo $((selected + 1))
}

# =============================================================================
# Mensagens de Status Final
# =============================================================================

# Mensagem de sucesso final
print_success_final() {
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║${NC}                                                                ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}   ${BOLD}${GREEN}✅ INSTALAÇÃO CONCLUÍDA COM SUCESSO!${NC}                         ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}                                                                ${GREEN}║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Mensagem de erro final
print_error_final() {
    local message="${1:-Ocorreu um erro durante a instalação}"
    echo ""
    echo -e "${RED}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║${NC}                                                                ${RED}║${NC}"
    echo -e "${RED}║${NC}   ${BOLD}${RED}❌ ERRO NA INSTALAÇÃO${NC}                                        ${RED}║${NC}"
    echo -e "${RED}║${NC}                                                                ${RED}║${NC}"
    echo -e "${RED}║${NC}   ${WHITE}$message${NC}$(printf ' %.0s' $(seq 1 $((52 - ${#message}))))${RED}║${NC}"
    echo -e "${RED}║${NC}                                                                ${RED}║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Mensagem de aviso final
print_warning_final() {
    local message="${1:-Atenção}"
    echo ""
    echo -e "${YELLOW}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║${NC}                                                                ${YELLOW}║${NC}"
    echo -e "${YELLOW}║${NC}   ${BOLD}${YELLOW}⚠️  ATENÇÃO${NC}                                                   ${YELLOW}║${NC}"
    echo -e "${YELLOW}║${NC}                                                                ${YELLOW}║${NC}"
    echo -e "${YELLOW}║${NC}   ${WHITE}$message${NC}$(printf ' %.0s' $(seq 1 $((52 - ${#message}))))${YELLOW}║${NC}"
    echo -e "${YELLOW}║${NC}                                                                ${YELLOW}║${NC}"
    echo -e "${YELLOW}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# =============================================================================
# Utilidades de Terminal
# =============================================================================

# Limpa a linha atual
clear_line() {
    printf "\r\033[K"
}

# Move cursor N linhas para cima
move_up() {
    local lines="${1:-1}"
    tput cuu "$lines"
}

# Move cursor N linhas para baixo
move_down() {
    local lines="${1:-1}"
    tput cud "$lines"
}

# Esconde cursor
hide_cursor() {
    tput civis
}

# Mostra cursor
show_cursor() {
    tput cnorm
}

# Espera por Enter
wait_enter() {
    local message="${1:-Pressione ENTER para continuar}"
    echo ""
    echo -en "${DIM}${message}...${NC}"
    read -r
}

# Contagem regressiva
countdown() {
    local seconds="$1"
    local message="${2:-Continuando em}"

    for ((i=seconds; i>0; i--)); do
        printf "\r${message} ${BOLD}%d${NC} segundos... " "$i"
        sleep 1
    done
    printf "\r%-50s\n" ""
}
