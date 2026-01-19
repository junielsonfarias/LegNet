#!/bin/bash
# =============================================================================
# setup-nginx.sh - Configuração do Nginx
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

NGINX_SITES_AVAILABLE="/etc/nginx/sites-available"
NGINX_SITES_ENABLED="/etc/nginx/sites-enabled"
NGINX_CONF_D="/etc/nginx/conf.d"

# =============================================================================
# Configuração do Nginx
# =============================================================================

# Gera configuração Nginx sem SSL (HTTP)
generate_nginx_http_config() {
    local domain="$1"
    local app_port="${2:-3000}"
    local config_file="${NGINX_SITES_AVAILABLE}/${domain}"

    info "Gerando configuração Nginx para ${domain}..."

    cat > "$config_file" << EOF
# =============================================================================
# Configuração Nginx - ${domain}
# Gerado pelo instalador em $(date '+%Y-%m-%d %H:%M:%S')
# =============================================================================

upstream app_${domain//./_} {
    server 127.0.0.1:${app_port};
    keepalive 64;
}

server {
    listen 80;
    listen [::]:80;
    server_name ${domain};

    # Logs
    access_log /var/log/nginx/${domain}.access.log;
    error_log /var/log/nginx/${domain}.error.log;

    # Tamanho máximo de upload
    client_max_body_size 50M;

    # Headers de segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml
        application/xml+rss
        application/x-font-ttf
        font/opentype
        image/svg+xml;

    # Arquivos estáticos do Next.js
    location /_next/static {
        proxy_pass http://app_${domain//./_};
        proxy_cache_valid 60m;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Arquivos públicos
    location /uploads {
        alias /var/www/camara/public/uploads;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # API
    location /api {
        proxy_pass http://app_${domain//./_};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }

    # Aplicação
    location / {
        proxy_pass http://app_${domain//./_};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;

        # Timeout para SSR
        proxy_connect_timeout 60s;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }

    # Healthcheck
    location /health {
        access_log off;
        return 200 "OK";
        add_header Content-Type text/plain;
    }

    # Bloqueia acesso a arquivos sensíveis
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    location ~ ^/(\.env|package\.json|package-lock\.json) {
        deny all;
        access_log off;
        log_not_found off;
    }
}
EOF

    if [[ -f "$config_file" ]]; then
        success "Configuração HTTP gerada: $config_file"
        return 0
    fi

    error "Falha ao gerar configuração Nginx"
    return 1
}

# Gera configuração Nginx com SSL (HTTPS)
generate_nginx_https_config() {
    local domain="$1"
    local app_port="${2:-3000}"
    local config_file="${NGINX_SITES_AVAILABLE}/${domain}"

    info "Gerando configuração Nginx com SSL para ${domain}..."

    cat > "$config_file" << EOF
# =============================================================================
# Configuração Nginx com SSL - ${domain}
# Gerado pelo instalador em $(date '+%Y-%m-%d %H:%M:%S')
# =============================================================================

upstream app_${domain//./_} {
    server 127.0.0.1:${app_port};
    keepalive 64;
}

# Redirect HTTP para HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name ${domain};

    # ACME challenge para renovação SSL
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

# HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${domain};

    # Certificados SSL
    ssl_certificate /etc/letsencrypt/live/${domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${domain}/privkey.pem;

    # Configurações SSL modernas
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    # Protocolos e cifras seguras
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;

    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;

    # Logs
    access_log /var/log/nginx/${domain}.access.log;
    error_log /var/log/nginx/${domain}.error.log;

    # Tamanho máximo de upload
    client_max_body_size 50M;

    # Headers de segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;" always;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml
        application/xml+rss
        application/x-font-ttf
        font/opentype
        image/svg+xml;

    # Arquivos estáticos do Next.js
    location /_next/static {
        proxy_pass http://app_${domain//./_};
        proxy_cache_valid 60m;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Arquivos públicos
    location /uploads {
        alias /var/www/camara/public/uploads;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # API
    location /api {
        proxy_pass http://app_${domain//./_};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }

    # Aplicação
    location / {
        proxy_pass http://app_${domain//./_};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;

        # Timeout para SSR
        proxy_connect_timeout 60s;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }

    # Healthcheck
    location /health {
        access_log off;
        return 200 "OK";
        add_header Content-Type text/plain;
    }

    # Bloqueia acesso a arquivos sensíveis
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    location ~ ^/(\.env|package\.json|package-lock\.json) {
        deny all;
        access_log off;
        log_not_found off;
    }
}
EOF

    if [[ -f "$config_file" ]]; then
        success "Configuração HTTPS gerada: $config_file"
        return 0
    fi

    error "Falha ao gerar configuração Nginx"
    return 1
}

# =============================================================================
# Gerenciamento de Sites
# =============================================================================

# Habilita site
enable_nginx_site() {
    local domain="$1"
    local config_file="${NGINX_SITES_AVAILABLE}/${domain}"
    local link_file="${NGINX_SITES_ENABLED}/${domain}"

    if [[ ! -f "$config_file" ]]; then
        error "Configuração não encontrada: $config_file"
        return 1
    fi

    # Remove configuração padrão se existir
    rm -f "${NGINX_SITES_ENABLED}/default"

    # Cria link simbólico
    ln -sf "$config_file" "$link_file"

    if [[ -L "$link_file" ]]; then
        success "Site ${domain} habilitado"
        return 0
    fi

    error "Falha ao habilitar site"
    return 1
}

# Desabilita site
disable_nginx_site() {
    local domain="$1"
    local link_file="${NGINX_SITES_ENABLED}/${domain}"

    if [[ -L "$link_file" ]]; then
        rm "$link_file"
        success "Site ${domain} desabilitado"
    fi

    return 0
}

# =============================================================================
# Validação e Reload
# =============================================================================

# Testa configuração do Nginx
test_nginx_config() {
    info "Testando configuração do Nginx..."

    nginx -t 2>&1

    if [[ $? -eq 0 ]]; then
        success "Configuração do Nginx válida"
        return 0
    fi

    error "Configuração do Nginx inválida"
    return 1
}

# Recarrega Nginx
reload_nginx() {
    info "Recarregando Nginx..."

    if test_nginx_config; then
        systemctl reload nginx

        if service_is_active nginx; then
            success "Nginx recarregado"
            return 0
        fi
    fi

    error "Falha ao recarregar Nginx"
    return 1
}

# Reinicia Nginx
restart_nginx() {
    info "Reiniciando Nginx..."

    if test_nginx_config; then
        systemctl restart nginx
        sleep 2

        if service_is_active nginx; then
            success "Nginx reiniciado"
            return 0
        fi
    fi

    error "Falha ao reiniciar Nginx"
    return 1
}

# =============================================================================
# Função Principal
# =============================================================================

# Setup completo do Nginx
setup_nginx_complete() {
    local domain="$1"
    local app_port="${2:-3000}"
    local with_ssl="${3:-false}"

    # Cria diretórios se não existirem
    mkdir -p "$NGINX_SITES_AVAILABLE" "$NGINX_SITES_ENABLED" /var/www/certbot

    # Gera configuração
    if [[ "$with_ssl" == "true" ]]; then
        # Verifica se certificado existe
        if [[ -f "/etc/letsencrypt/live/${domain}/fullchain.pem" ]]; then
            generate_nginx_https_config "$domain" "$app_port" || return 1
        else
            warning "Certificado SSL não encontrado. Gerando configuração HTTP..."
            generate_nginx_http_config "$domain" "$app_port" || return 1
        fi
    else
        generate_nginx_http_config "$domain" "$app_port" || return 1
    fi

    # Habilita site
    enable_nginx_site "$domain" || return 1

    # Recarrega Nginx
    reload_nginx || return 1

    success "Nginx configurado para ${domain}"
    return 0
}

# Atualiza configuração de HTTP para HTTPS
upgrade_nginx_to_https() {
    local domain="$1"
    local app_port="${2:-3000}"

    info "Atualizando Nginx para HTTPS..."

    # Backup da configuração atual
    backup_file "${NGINX_SITES_AVAILABLE}/${domain}"

    # Gera nova configuração com SSL
    generate_nginx_https_config "$domain" "$app_port" || return 1

    # Recarrega
    reload_nginx || return 1

    success "Nginx atualizado para HTTPS"
    return 0
}

# =============================================================================
# Diagnóstico
# =============================================================================

# Diagnostica problemas do Nginx
diagnose_nginx() {
    title "Diagnóstico do Nginx"

    # Verifica se está instalado
    if ! command_exists nginx; then
        error "Nginx não está instalado"
        return 1
    fi
    progress_item "done" "Nginx instalado"

    # Verifica se está rodando
    if service_is_active nginx; then
        progress_item "done" "Nginx está rodando"
    else
        progress_item "error" "Nginx não está rodando"
        echo ""
        info "Tentando iniciar Nginx..."
        systemctl start nginx
    fi

    # Testa configuração
    if nginx -t 2>/dev/null; then
        progress_item "done" "Configuração válida"
    else
        progress_item "error" "Configuração inválida"
        echo ""
        nginx -t
    fi

    # Lista sites habilitados
    echo ""
    info "Sites habilitados:"
    ls -la "$NGINX_SITES_ENABLED" 2>/dev/null || echo "  Nenhum"

    # Verifica portas
    echo ""
    info "Portas em uso:"
    ss -tlnp | grep nginx || echo "  Nginx não está escutando em nenhuma porta"

    echo ""
    return 0
}
