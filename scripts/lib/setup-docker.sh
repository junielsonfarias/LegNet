#!/bin/bash
# =============================================================================
# setup-docker.sh - Configuração do Docker e Docker Compose
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

DOCKER_COMPOSE_FILE="docker-compose.prod.yml"
DOCKER_DATA_DIR="/var/lib/docker"

# =============================================================================
# Verificação do Docker
# =============================================================================

# Verifica se Docker está instalado e rodando
check_docker_ready() {
    if ! command_exists docker; then
        return 1
    fi

    if ! service_is_active docker; then
        systemctl start docker
        sleep 2
    fi

    docker info >/dev/null 2>&1
}

# Verifica se Docker Compose está disponível
check_docker_compose_ready() {
    # Verifica plugin primeiro
    if docker compose version >/dev/null 2>&1; then
        export DOCKER_COMPOSE_CMD="docker compose"
        return 0
    fi

    # Verifica standalone
    if command_exists docker-compose; then
        export DOCKER_COMPOSE_CMD="docker-compose"
        return 0
    fi

    return 1
}

# =============================================================================
# Geração de docker-compose.yml
# =============================================================================

# Gera docker-compose.yml para produção
generate_docker_compose() {
    local app_dir="$1"
    local db_name="${2:-camara_db}"
    local db_user="${3:-camara_admin}"
    local db_password="${4:-}"
    local domain="${5:-localhost}"

    local compose_file="${app_dir}/${DOCKER_COMPOSE_FILE}"

    info "Gerando ${DOCKER_COMPOSE_FILE}..."

    # Gera senha se não fornecida
    if [[ -z "$db_password" ]]; then
        db_password=$(generate_password 24)
    fi

    cat > "$compose_file" << EOF
version: '3.8'

services:
  # ==========================================================================
  # Aplicação Next.js
  # ==========================================================================
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: camara-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://${db_user}:${db_password}@db:5432/${db_name}?schema=public
      - DIRECT_URL=postgresql://${db_user}:${db_password}@db:5432/${db_name}?schema=public
    env_file:
      - .env.production
    depends_on:
      db:
        condition: service_healthy
    networks:
      - camara-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  # ==========================================================================
  # Banco de Dados PostgreSQL
  # ==========================================================================
  db:
    image: postgres:15-alpine
    container_name: camara-db
    restart: unless-stopped
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/init-db:/docker-entrypoint-initdb.d:ro
    environment:
      POSTGRES_USER: ${db_user}
      POSTGRES_PASSWORD: ${db_password}
      POSTGRES_DB: ${db_name}
      PGDATA: /var/lib/postgresql/data/pgdata
    networks:
      - camara-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${db_user} -d ${db_name}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ==========================================================================
  # Nginx Reverse Proxy
  # ==========================================================================
  nginx:
    image: nginx:alpine
    container_name: camara-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./docker/nginx/conf.d:/etc/nginx/conf.d:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - ./public:/var/www/public:ro
    depends_on:
      - app
    networks:
      - camara-network
    healthcheck:
      test: ["CMD", "nginx", "-t"]
      interval: 30s
      timeout: 10s
      retries: 3

  # ==========================================================================
  # Redis (Cache - Opcional)
  # ==========================================================================
  # redis:
  #   image: redis:7-alpine
  #   container_name: camara-redis
  #   restart: unless-stopped
  #   volumes:
  #     - redis_data:/data
  #   networks:
  #     - camara-network
  #   healthcheck:
  #     test: ["CMD", "redis-cli", "ping"]
  #     interval: 10s
  #     timeout: 5s
  #     retries: 5

# ==========================================================================
# Networks
# ==========================================================================
networks:
  camara-network:
    driver: bridge

# ==========================================================================
# Volumes
# ==========================================================================
volumes:
  postgres_data:
    driver: local
  # redis_data:
  #   driver: local
EOF

    if [[ -f "$compose_file" ]]; then
        success "docker-compose.yml gerado"

        # Exporta variáveis
        export DOCKER_DB_PASSWORD="$db_password"

        return 0
    fi

    error "Falha ao gerar docker-compose.yml"
    return 1
}

# Gera Dockerfile para a aplicação
generate_dockerfile() {
    local app_dir="$1"
    local dockerfile="${app_dir}/Dockerfile"

    info "Gerando Dockerfile..."

    cat > "$dockerfile" << 'EOF'
# =============================================================================
# Dockerfile - Sistema de Câmara Municipal
# Multi-stage build para produção
# =============================================================================

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Instala dependências
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Cria usuário não-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copia apenas arquivos necessários
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
EOF

    if [[ -f "$dockerfile" ]]; then
        success "Dockerfile gerado"
        return 0
    fi

    error "Falha ao gerar Dockerfile"
    return 1
}

# Gera configuração Nginx para Docker
generate_docker_nginx_config() {
    local app_dir="$1"
    local domain="${2:-localhost}"
    local nginx_dir="${app_dir}/docker/nginx"

    mkdir -p "${nginx_dir}/conf.d"

    info "Gerando configuração Nginx para Docker..."

    # nginx.conf principal
    cat > "${nginx_dir}/nginx.conf" << 'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    multi_accept on;
    use epoll;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript
               application/xml application/xml+rss text/javascript application/x-font-ttf
               font/opentype image/svg+xml;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    include /etc/nginx/conf.d/*.conf;
}
EOF

    # Configuração do site
    cat > "${nginx_dir}/conf.d/default.conf" << EOF
upstream app {
    server app:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name ${domain};

    # Redirect to HTTPS (descomentar quando SSL estiver configurado)
    # return 301 https://\$server_name\$request_uri;

    location / {
        proxy_pass http://app;
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

    # Arquivos estáticos
    location /_next/static {
        proxy_pass http://app;
        proxy_cache_valid 60m;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Healthcheck
    location /health {
        access_log off;
        return 200 "OK";
        add_header Content-Type text/plain;
    }
}

# HTTPS (descomentar quando certificado estiver disponível)
# server {
#     listen 443 ssl http2;
#     server_name ${domain};
#
#     ssl_certificate /etc/letsencrypt/live/${domain}/fullchain.pem;
#     ssl_certificate_key /etc/letsencrypt/live/${domain}/privkey.pem;
#
#     ssl_session_timeout 1d;
#     ssl_session_cache shared:SSL:50m;
#     ssl_session_tickets off;
#
#     ssl_protocols TLSv1.2 TLSv1.3;
#     ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
#     ssl_prefer_server_ciphers off;
#
#     location / {
#         proxy_pass http://app;
#         proxy_http_version 1.1;
#         proxy_set_header Upgrade \$http_upgrade;
#         proxy_set_header Connection 'upgrade';
#         proxy_set_header Host \$host;
#         proxy_set_header X-Real-IP \$remote_addr;
#         proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
#         proxy_set_header X-Forwarded-Proto \$scheme;
#         proxy_cache_bypass \$http_upgrade;
#     }
# }
EOF

    success "Configuração Nginx para Docker gerada"
    return 0
}

# =============================================================================
# Operações com Docker Compose
# =============================================================================

# Inicia containers
docker_compose_up() {
    local app_dir="$1"
    local compose_file="${app_dir}/${DOCKER_COMPOSE_FILE}"

    if [[ ! -f "$compose_file" ]]; then
        error "Arquivo ${DOCKER_COMPOSE_FILE} não encontrado"
        return 1
    fi

    info "Iniciando containers..."

    cd "$app_dir" || return 1

    $DOCKER_COMPOSE_CMD -f "$DOCKER_COMPOSE_FILE" up -d --build

    if [[ $? -eq 0 ]]; then
        success "Containers iniciados"
        return 0
    fi

    error "Falha ao iniciar containers"
    return 1
}

# Para containers
docker_compose_down() {
    local app_dir="$1"
    local compose_file="${app_dir}/${DOCKER_COMPOSE_FILE}"

    if [[ ! -f "$compose_file" ]]; then
        return 0
    fi

    info "Parando containers..."

    cd "$app_dir" || return 1

    $DOCKER_COMPOSE_CMD -f "$DOCKER_COMPOSE_FILE" down

    success "Containers parados"
    return 0
}

# Exibe logs
docker_compose_logs() {
    local app_dir="$1"
    local service="${2:-}"

    cd "$app_dir" || return 1

    if [[ -n "$service" ]]; then
        $DOCKER_COMPOSE_CMD -f "$DOCKER_COMPOSE_FILE" logs -f "$service"
    else
        $DOCKER_COMPOSE_CMD -f "$DOCKER_COMPOSE_FILE" logs -f
    fi
}

# Exibe status dos containers
docker_compose_status() {
    local app_dir="$1"

    cd "$app_dir" || return 1

    $DOCKER_COMPOSE_CMD -f "$DOCKER_COMPOSE_FILE" ps
}

# Executa comando em um container
docker_compose_exec() {
    local app_dir="$1"
    local service="$2"
    shift 2
    local cmd=("$@")

    cd "$app_dir" || return 1

    $DOCKER_COMPOSE_CMD -f "$DOCKER_COMPOSE_FILE" exec "$service" "${cmd[@]}"
}

# =============================================================================
# Migrations com Docker
# =============================================================================

# Executa migrations do Prisma no container
docker_run_migrations() {
    local app_dir="$1"

    info "Executando migrations..."

    cd "$app_dir" || return 1

    # Espera banco estar pronto
    local attempts=0
    while ! docker_compose_exec "$app_dir" db pg_isready -U camara_admin >/dev/null 2>&1; do
        ((attempts++))
        if [[ $attempts -ge 30 ]]; then
            error "Banco de dados não ficou pronto"
            return 1
        fi
        sleep 2
    done

    # Executa migrations
    $DOCKER_COMPOSE_CMD -f "$DOCKER_COMPOSE_FILE" exec app npx prisma migrate deploy

    if [[ $? -eq 0 ]]; then
        success "Migrations executadas"
        return 0
    fi

    error "Falha ao executar migrations"
    return 1
}

# Executa seed no container
docker_run_seed() {
    local app_dir="$1"

    info "Executando seed..."

    cd "$app_dir" || return 1

    $DOCKER_COMPOSE_CMD -f "$DOCKER_COMPOSE_FILE" exec app npx prisma db seed

    if [[ $? -eq 0 ]]; then
        success "Seed executado"
        return 0
    fi

    warning "Seed pode ter falhado ou não existir"
    return 0
}

# =============================================================================
# Função Principal
# =============================================================================

# Setup completo com Docker
setup_docker_complete() {
    local app_dir="${1:-/var/www/camara}"
    local domain="${2:-localhost}"
    local db_name="${3:-camara_db}"
    local db_user="${4:-camara_admin}"
    local db_password="${5:-}"

    # Verifica Docker
    if ! check_docker_ready; then
        error "Docker não está pronto"
        return 1
    fi

    if ! check_docker_compose_ready; then
        error "Docker Compose não está disponível"
        return 1
    fi

    # Gera arquivos
    generate_docker_compose "$app_dir" "$db_name" "$db_user" "$db_password" "$domain" || return 1
    generate_dockerfile "$app_dir" || return 1
    generate_docker_nginx_config "$app_dir" "$domain" || return 1

    # Cria diretório para scripts de inicialização do banco
    mkdir -p "${app_dir}/docker/init-db"

    # Inicia containers
    docker_compose_up "$app_dir" || return 1

    # Aguarda aplicação
    info "Aguardando aplicação iniciar..."
    sleep 30

    # Executa migrations
    docker_run_migrations "$app_dir" || return 1

    success "Setup Docker completo"
    return 0
}
