#!/bin/bash
# =============================================================================
# setup-ssl.sh - Configuração de SSL/Certbot
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

LETSENCRYPT_DIR="/etc/letsencrypt"
CERTBOT_WEBROOT="/var/www/certbot"

# =============================================================================
# Verificação
# =============================================================================

# Verifica se certificado existe para o domínio
certificate_exists() {
    local domain="$1"
    [[ -f "${LETSENCRYPT_DIR}/live/${domain}/fullchain.pem" ]]
}

# Verifica se certificado é válido
certificate_valid() {
    local domain="$1"
    local cert_file="${LETSENCRYPT_DIR}/live/${domain}/fullchain.pem"

    if [[ ! -f "$cert_file" ]]; then
        return 1
    fi

    # Verifica se não está expirado
    local expiry
    expiry=$(openssl x509 -enddate -noout -in "$cert_file" 2>/dev/null | cut -d= -f2)

    if [[ -z "$expiry" ]]; then
        return 1
    fi

    local expiry_epoch
    local now_epoch

    expiry_epoch=$(date -d "$expiry" +%s 2>/dev/null)
    now_epoch=$(date +%s)

    # Considera inválido se expira em menos de 7 dias
    if [[ $((expiry_epoch - now_epoch)) -lt 604800 ]]; then
        return 1
    fi

    return 0
}

# Obtém data de expiração do certificado
get_certificate_expiry() {
    local domain="$1"
    local cert_file="${LETSENCRYPT_DIR}/live/${domain}/fullchain.pem"

    if [[ -f "$cert_file" ]]; then
        openssl x509 -enddate -noout -in "$cert_file" 2>/dev/null | cut -d= -f2
    fi
}

# =============================================================================
# Geração de Certificado
# =============================================================================

# Gera certificado SSL com Certbot (webroot)
generate_ssl_certificate_webroot() {
    local domain="$1"
    local email="$2"

    info "Gerando certificado SSL para ${domain}..."

    # Cria diretório webroot
    mkdir -p "$CERTBOT_WEBROOT"

    # Gera certificado
    certbot certonly \
        --webroot \
        --webroot-path="$CERTBOT_WEBROOT" \
        --domain "$domain" \
        --email "$email" \
        --agree-tos \
        --no-eff-email \
        --non-interactive

    if certificate_exists "$domain"; then
        success "Certificado SSL gerado para ${domain}"
        return 0
    fi

    error "Falha ao gerar certificado SSL"
    return 1
}

# Gera certificado SSL com Certbot (standalone)
generate_ssl_certificate_standalone() {
    local domain="$1"
    local email="$2"

    info "Gerando certificado SSL (modo standalone)..."

    # Para Nginx temporariamente
    systemctl stop nginx 2>/dev/null
    sleep 2

    # Gera certificado
    certbot certonly \
        --standalone \
        --domain "$domain" \
        --email "$email" \
        --agree-tos \
        --no-eff-email \
        --non-interactive

    local result=$?

    # Reinicia Nginx
    systemctl start nginx 2>/dev/null

    if [[ $result -eq 0 ]] && certificate_exists "$domain"; then
        success "Certificado SSL gerado para ${domain}"
        return 0
    fi

    error "Falha ao gerar certificado SSL"
    return 1
}

# Gera certificado usando plugin nginx
generate_ssl_certificate_nginx() {
    local domain="$1"
    local email="$2"

    info "Gerando certificado SSL (plugin nginx)..."

    certbot --nginx \
        --domain "$domain" \
        --email "$email" \
        --agree-tos \
        --no-eff-email \
        --non-interactive \
        --redirect

    if certificate_exists "$domain"; then
        success "Certificado SSL gerado e Nginx configurado"
        return 0
    fi

    error "Falha ao gerar certificado SSL"
    return 1
}

# =============================================================================
# Renovação
# =============================================================================

# Renova certificados
renew_certificates() {
    info "Renovando certificados SSL..."

    certbot renew --quiet

    if [[ $? -eq 0 ]]; then
        success "Certificados renovados"

        # Recarrega Nginx
        systemctl reload nginx 2>/dev/null

        return 0
    fi

    error "Falha ao renovar certificados"
    return 1
}

# Configura renovação automática via cron
setup_auto_renewal() {
    info "Configurando renovação automática..."

    # Verifica se já existe cron job
    if crontab -l 2>/dev/null | grep -q "certbot renew"; then
        success "Renovação automática já configurada"
        return 0
    fi

    # Adiciona cron job para renovação
    (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -

    success "Renovação automática configurada (diariamente às 3h)"
    return 0
}

# Configura renovação automática via systemd timer
setup_auto_renewal_systemd() {
    info "Configurando renovação automática via systemd..."

    # Cria timer
    cat > /etc/systemd/system/certbot-renewal.timer << 'EOF'
[Unit]
Description=Timer for Certbot Renewal

[Timer]
OnCalendar=*-*-* 03:00:00
RandomizedDelaySec=3600
Persistent=true

[Install]
WantedBy=timers.target
EOF

    # Cria service
    cat > /etc/systemd/system/certbot-renewal.service << 'EOF'
[Unit]
Description=Certbot Renewal

[Service]
Type=oneshot
ExecStart=/usr/bin/certbot renew --quiet
ExecStartPost=/bin/systemctl reload nginx
EOF

    # Habilita timer
    systemctl daemon-reload
    systemctl enable certbot-renewal.timer
    systemctl start certbot-renewal.timer

    success "Renovação automática configurada via systemd"
    return 0
}

# =============================================================================
# Coleta Interativa
# =============================================================================

# Coleta informações para SSL
collect_ssl_info() {
    local domain="$1"

    print_section "CONFIGURAÇÃO SSL (Let's Encrypt)"

    # Verifica se domínio aponta para este servidor
    info "Verificando DNS do domínio..."

    if validate_domain_points_here "$domain"; then
        success "Domínio aponta para este servidor"
    else
        warning "Domínio pode não apontar para este servidor"
        echo ""
        echo -e "${YELLOW}ATENÇÃO:${NC} O certificado SSL só será gerado se o domínio"
        echo "         estiver apontando para o IP deste servidor."
        echo ""

        if ! confirm "Deseja tentar gerar o certificado mesmo assim?"; then
            return 1
        fi
    fi

    # Email para notificações
    local email
    while true; do
        echo -en "${WHITE}Email para notificações SSL:${NC} "
        read -r email

        if validate_email "$email" >/dev/null; then
            break
        fi
        error "Email inválido"
    done

    export SSL_EMAIL="$email"

    success "Informações SSL coletadas"
    return 0
}

# =============================================================================
# Função Principal
# =============================================================================

# Setup completo do SSL
setup_ssl_complete() {
    local domain="$1"
    local email="${2:-$SSL_EMAIL}"
    local method="${3:-webroot}"

    if [[ -z "$email" ]]; then
        error "Email não fornecido para SSL"
        return 1
    fi

    # Verifica se certificado já existe e é válido
    if certificate_valid "$domain"; then
        local expiry
        expiry=$(get_certificate_expiry "$domain")
        success "Certificado válido existente (expira em: $expiry)"

        if ! confirm "Deseja regenerar o certificado?"; then
            return 0
        fi
    fi

    # Cria diretório webroot se necessário
    mkdir -p "$CERTBOT_WEBROOT"

    # Tenta gerar certificado
    case "$method" in
        webroot)
            generate_ssl_certificate_webroot "$domain" "$email"
            ;;
        standalone)
            generate_ssl_certificate_standalone "$domain" "$email"
            ;;
        nginx)
            generate_ssl_certificate_nginx "$domain" "$email"
            ;;
        *)
            error "Método inválido: $method"
            return 1
            ;;
    esac

    local result=$?

    if [[ $result -eq 0 ]]; then
        # Configura renovação automática
        setup_auto_renewal_systemd || setup_auto_renewal

        success "SSL configurado com sucesso"
        return 0
    fi

    # Se webroot falhou, tenta standalone
    if [[ "$method" == "webroot" ]]; then
        warning "Método webroot falhou. Tentando standalone..."
        generate_ssl_certificate_standalone "$domain" "$email"

        if [[ $? -eq 0 ]]; then
            setup_auto_renewal_systemd || setup_auto_renewal
            success "SSL configurado com sucesso (modo standalone)"
            return 0
        fi
    fi

    error "Não foi possível gerar certificado SSL"
    return 1
}

# =============================================================================
# Diagnóstico
# =============================================================================

# Diagnostica problemas de SSL
diagnose_ssl() {
    local domain="$1"

    title "Diagnóstico SSL para ${domain}"

    # Verifica certbot
    if command_exists certbot; then
        progress_item "done" "Certbot instalado: $(certbot --version 2>&1 | head -1)"
    else
        progress_item "error" "Certbot não instalado"
        return 1
    fi

    # Verifica certificado
    if certificate_exists "$domain"; then
        local expiry
        expiry=$(get_certificate_expiry "$domain")
        progress_item "done" "Certificado existe"
        echo "         Expira em: $expiry"

        if certificate_valid "$domain"; then
            progress_item "done" "Certificado válido"
        else
            progress_item "error" "Certificado expirado ou próximo de expirar"
        fi
    else
        progress_item "error" "Certificado não encontrado"
    fi

    # Verifica renovação automática
    if systemctl is-enabled certbot-renewal.timer >/dev/null 2>&1; then
        progress_item "done" "Renovação automática (systemd)"
    elif crontab -l 2>/dev/null | grep -q "certbot renew"; then
        progress_item "done" "Renovação automática (cron)"
    else
        progress_item "pending" "Renovação automática não configurada"
    fi

    # Testa conexão HTTPS
    echo ""
    info "Testando conexão HTTPS..."

    if curl -sI "https://${domain}" 2>/dev/null | grep -q "200\|301\|302"; then
        progress_item "done" "HTTPS respondendo"
    else
        progress_item "error" "HTTPS não está respondendo"
    fi

    echo ""
    return 0
}

# =============================================================================
# Revogação
# =============================================================================

# Revoga certificado
revoke_certificate() {
    local domain="$1"

    warning "Revogando certificado para ${domain}..."

    if ! confirm "Tem certeza que deseja revogar o certificado?"; then
        return 1
    fi

    certbot revoke --cert-path "${LETSENCRYPT_DIR}/live/${domain}/cert.pem" --delete-after-revoke

    if [[ $? -eq 0 ]]; then
        success "Certificado revogado"
        return 0
    fi

    error "Falha ao revogar certificado"
    return 1
}
