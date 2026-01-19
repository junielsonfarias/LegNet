# Guia Detalhado de Instalação em VPS

Este guia apresenta o passo a passo completo para instalar o Sistema de Câmara Municipal em uma VPS, cobrindo todos os cenários de banco de dados.

---

## Índice

1. [Pré-requisitos](#1-pré-requisitos)
2. [Preparação da VPS](#2-preparação-da-vps)
3. [Cenário 1: PostgreSQL Local](#3-cenário-1-postgresql-local)
4. [Cenário 2: Supabase (Cloud)](#4-cenário-2-supabase-cloud)
5. [Cenário 3: Docker Compose](#5-cenário-3-docker-compose)
6. [Cenário 4: PostgreSQL Remoto (RDS/Cloud SQL)](#6-cenário-4-postgresql-remoto)
7. [Configuração de Domínio e SSL](#7-configuração-de-domínio-e-ssl)
8. [Pós-Instalação](#8-pós-instalação)
9. [Troubleshooting](#9-troubleshooting)
10. [Comandos de Manutenção](#10-comandos-de-manutenção)

---

## 1. Pré-requisitos

### 1.1 Requisitos de Hardware

| Recurso | Mínimo | Recomendado | Ideal |
|---------|--------|-------------|-------|
| **CPU** | 1 vCPU | 2 vCPU | 4 vCPU |
| **RAM** | 1 GB | 2 GB | 4 GB |
| **Disco** | 10 GB SSD | 20 GB SSD | 40 GB SSD |
| **Banda** | 1 TB | 2 TB | Ilimitado |

### 1.2 Requisitos de Software

- **Sistema Operacional**: Ubuntu 22.04 LTS (recomendado) ou Debian 12
- **Acesso**: Root ou usuário com sudo
- **Rede**: IP público fixo
- **DNS**: Domínio apontando para o IP da VPS

### 1.3 Informações Necessárias

Antes de iniciar, tenha em mãos:

```
□ IP da VPS: ___________________
□ Domínio: ___________________
□ Email para SSL: ___________________
□ Nome da Câmara: ___________________
□ UF/Cidade: ___________________
□ Email do administrador: ___________________
□ Senha do administrador: ___________________
```

### 1.4 Provedores de VPS Recomendados

| Provedor | Plano Básico | Localização Brasil |
|----------|--------------|-------------------|
| DigitalOcean | $12/mês (2GB) | São Paulo |
| Vultr | $12/mês (2GB) | São Paulo |
| Linode | $12/mês (2GB) | São Paulo |
| Contabo | €5/mês (4GB) | Alemanha |
| Hostinger | R$29/mês (2GB) | São Paulo |
| Locaweb | R$49/mês (2GB) | São Paulo |

---

## 2. Preparação da VPS

### 2.1 Primeiro Acesso

```bash
# Conecte via SSH
ssh root@SEU_IP_DA_VPS

# Ou se usar chave SSH
ssh -i ~/.ssh/sua_chave root@SEU_IP_DA_VPS
```

### 2.2 Atualização do Sistema

```bash
# Atualiza lista de pacotes
apt update

# Atualiza pacotes instalados
apt upgrade -y

# Instala pacotes essenciais
apt install -y curl wget git build-essential unzip htop net-tools
```

### 2.3 Configuração de Timezone

```bash
# Define timezone para Brasil
timedatectl set-timezone America/Sao_Paulo

# Verifica
date
```

### 2.4 Configuração de Swap (se RAM < 2GB)

```bash
# Verifica se já tem swap
swapon --show

# Se não tiver, cria swap de 2GB
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# Torna permanente
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Otimiza uso de swap
echo 'vm.swappiness=10' >> /etc/sysctl.conf
sysctl -p
```

### 2.5 Configuração de Firewall (UFW)

```bash
# Instala UFW
apt install -y ufw

# Configurações padrão
ufw default deny incoming
ufw default allow outgoing

# Permite SSH (IMPORTANTE: faça isso antes de habilitar!)
ufw allow ssh
ufw allow 22/tcp

# Permite HTTP e HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Habilita firewall
ufw enable

# Verifica status
ufw status verbose
```

### 2.6 Criação de Usuário de Deploy (Opcional, Recomendado)

```bash
# Cria usuário
adduser deploy

# Adiciona ao grupo sudo
usermod -aG sudo deploy

# Permite usar sudo sem senha (opcional)
echo "deploy ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/deploy

# Copia chaves SSH
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# A partir daqui, pode usar: ssh deploy@SEU_IP
```

---

## 3. Cenário 1: PostgreSQL Local

Este cenário instala o PostgreSQL diretamente na VPS, ideal para instalações simples de uma única câmara.

### 3.1 Instalação do Node.js 20 LTS

```bash
# Adiciona repositório NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -

# Instala Node.js
apt install -y nodejs

# Verifica instalação
node --version   # Deve mostrar v20.x.x
npm --version    # Deve mostrar 10.x.x
```

### 3.2 Instalação do PostgreSQL 15

```bash
# Adiciona repositório oficial PostgreSQL
sh -c 'echo "deb https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'

# Importa chave GPG
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /etc/apt/trusted.gpg.d/postgresql.gpg

# Atualiza e instala
apt update
apt install -y postgresql-15 postgresql-contrib-15

# Verifica se está rodando
systemctl status postgresql
```

### 3.3 Configuração do Banco de Dados

```bash
# Acessa PostgreSQL como superusuário
sudo -u postgres psql

# Dentro do PostgreSQL, execute:
```

```sql
-- Cria usuário para a aplicação
CREATE USER camara_admin WITH PASSWORD 'SUA_SENHA_SEGURA_AQUI';

-- Cria banco de dados
CREATE DATABASE camara_db OWNER camara_admin;

-- Concede privilégios
GRANT ALL PRIVILEGES ON DATABASE camara_db TO camara_admin;

-- Permite criar extensões
ALTER USER camara_admin WITH SUPERUSER;

-- Sai do PostgreSQL
\q
```

```bash
# Testa conexão
psql -h localhost -U camara_admin -d camara_db -c "SELECT version();"
# Quando pedir senha, digite a senha que você definiu
```

### 3.4 Configuração de Acesso Local

```bash
# Edita pg_hba.conf para permitir conexões locais com senha
nano /etc/postgresql/15/main/pg_hba.conf

# Encontre a linha:
# local   all             all                                     peer
# E altere para:
# local   all             all                                     scram-sha-256

# Adicione também (se não existir):
# host    all             all             127.0.0.1/32            scram-sha-256

# Reinicia PostgreSQL
systemctl restart postgresql
```

### 3.5 Instalação do Nginx

```bash
# Instala Nginx
apt install -y nginx

# Habilita na inicialização
systemctl enable nginx

# Remove configuração padrão
rm -f /etc/nginx/sites-enabled/default

# Verifica status
systemctl status nginx
```

### 3.6 Instalação do PM2

```bash
# Instala PM2 globalmente
npm install -g pm2

# Verifica instalação
pm2 --version
```

### 3.7 Instalação do Certbot (SSL)

```bash
# Instala snapd se necessário
apt install -y snapd

# Instala certbot via snap
snap install core
snap refresh core
snap install --classic certbot

# Cria link simbólico
ln -sf /snap/bin/certbot /usr/bin/certbot

# Verifica instalação
certbot --version
```

### 3.8 Clone e Configuração da Aplicação

```bash
# Cria diretório
mkdir -p /var/www
cd /var/www

# Clona repositório (substitua pela URL real)
git clone https://github.com/seu-usuario/camara.git
cd camara

# Instala dependências
npm ci

# Cria arquivo .env
nano .env
```

Conteúdo do arquivo `.env`:

```env
# =============================================================================
# Configuração - Câmara Municipal
# =============================================================================

# Banco de Dados (PostgreSQL Local)
DATABASE_URL="postgresql://camara_admin:SUA_SENHA_SEGURA@localhost:5432/camara_db?schema=public"
DIRECT_URL="postgresql://camara_admin:SUA_SENHA_SEGURA@localhost:5432/camara_db?schema=public"

# Autenticação
NEXTAUTH_URL="https://SEU_DOMINIO.gov.br"
NEXTAUTH_SECRET="gere_uma_chave_com_openssl_rand_base64_32"

# Identificação do Site
SITE_NAME="Câmara Municipal de SUA_CIDADE"
SITE_URL="https://SEU_DOMINIO.gov.br"
NEXT_PUBLIC_SITE_NAME="Câmara Municipal de SUA_CIDADE"
NEXT_PUBLIC_SITE_URL="https://SEU_DOMINIO.gov.br"

# Ambiente
NODE_ENV="production"

# Uploads
UPLOAD_DIR="./public/uploads"
MAX_FILE_SIZE=10485760
```

```bash
# Gera NEXTAUTH_SECRET
openssl rand -base64 32
# Copie o resultado e cole no .env

# Define permissões do .env
chmod 600 .env
```

### 3.9 Configuração do Prisma e Build

```bash
cd /var/www/camara

# Gera cliente Prisma
npx prisma generate

# Executa migrations
npx prisma migrate deploy

# Se migrations falharem, use:
# npx prisma db push

# Executa seed (dados iniciais)
npx prisma db seed

# Build da aplicação
npm run build
```

### 3.10 Configuração do PM2

```bash
# Cria arquivo de configuração PM2
cat > /var/www/camara/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'camara',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/camara',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    // Logs
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    error_file: '/var/log/pm2/camara-error.log',
    out_file: '/var/log/pm2/camara-out.log',
    merge_logs: true,
    // Restart
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '500M'
  }]
};
EOF

# Cria diretório de logs
mkdir -p /var/log/pm2

# Inicia aplicação
pm2 start ecosystem.config.js

# Verifica se está rodando
pm2 status

# Configura para iniciar no boot
pm2 startup systemd -u root --hp /root
pm2 save
```

### 3.11 Criação do Usuário Administrador

```bash
cd /var/www/camara

# Cria script para criar admin
cat > create-admin.js << 'EOF'
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('SENHA_DO_ADMIN', 12);

  const user = await prisma.user.upsert({
    where: { email: 'admin@seudominio.gov.br' },
    update: { password },
    create: {
      name: 'Administrador',
      email: 'admin@seudominio.gov.br',
      password,
      role: 'ADMIN',
      emailVerified: new Date()
    }
  });

  console.log('Admin criado:', user.email);
}

main().finally(() => prisma.$disconnect());
EOF

# Edite o script com seus dados
nano create-admin.js

# Execute
node create-admin.js

# Remove script (segurança)
rm create-admin.js
```

### 3.12 Configuração do Nginx

```bash
# Cria configuração do site
cat > /etc/nginx/sites-available/camara << 'EOF'
upstream camara_app {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    listen [::]:80;
    server_name SEU_DOMINIO.gov.br;

    # Tamanho máximo de upload
    client_max_body_size 50M;

    # Headers de segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # Proxy para aplicação
    location / {
        proxy_pass http://camara_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
    }

    # Arquivos estáticos
    location /_next/static {
        proxy_pass http://camara_app;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
EOF

# Edita com seu domínio real
nano /etc/nginx/sites-available/camara

# Habilita o site
ln -sf /etc/nginx/sites-available/camara /etc/nginx/sites-enabled/

# Testa configuração
nginx -t

# Recarrega Nginx
systemctl reload nginx
```

### 3.13 Configuração do SSL

```bash
# Certifique-se que o domínio já aponta para o IP da VPS!
# Teste: dig SEU_DOMINIO.gov.br

# Gera certificado SSL
certbot --nginx -d SEU_DOMINIO.gov.br --email seu@email.com --agree-tos --no-eff-email

# O Certbot irá automaticamente:
# - Gerar o certificado
# - Configurar o Nginx para HTTPS
# - Configurar redirect HTTP → HTTPS

# Testa renovação automática
certbot renew --dry-run
```

### 3.14 Verificação Final

```bash
# Verifica se tudo está rodando
pm2 status
systemctl status nginx
systemctl status postgresql

# Testa localmente
curl -I http://localhost:3000

# Testa externamente
curl -I https://SEU_DOMINIO.gov.br
```

---

## 4. Cenário 2: Supabase (Cloud)

Este cenário usa o Supabase como banco de dados na nuvem, ideal para múltiplas câmaras ou quando se deseja backups automáticos.

### 4.1 Criação do Projeto no Supabase

1. Acesse [https://supabase.com/](https://supabase.com/)
2. Clique em **Start your project**
3. Faça login com GitHub
4. Clique em **New project**
5. Preencha:
   - **Name**: `camara-sua-cidade`
   - **Database Password**: anote essa senha!
   - **Region**: South America (São Paulo)
6. Clique em **Create new project**
7. Aguarde a criação (~2 minutos)

### 4.2 Obtenção das Connection Strings

1. No painel do Supabase, vá em **Project Settings** (engrenagem)
2. Clique em **Database** no menu lateral
3. Role até **Connection string**
4. Selecione a aba **URI**
5. Copie as duas URLs:

**Transaction (Pooler) - Porta 6543:**
```
postgresql://postgres.XXXX:[SUA-SENHA]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Session (Direct) - Porta 5432:**
```
postgresql://postgres.XXXX:[SUA-SENHA]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
```

### 4.3 Instalação na VPS (Node.js + Nginx)

```bash
# Mesmos passos do Cenário 1:
# - Seção 3.1 (Node.js)
# - Seção 3.5 (Nginx)
# - Seção 3.6 (PM2)
# - Seção 3.7 (Certbot)

# NÃO instale PostgreSQL localmente!
```

### 4.4 Clone e Configuração da Aplicação

```bash
mkdir -p /var/www
cd /var/www

git clone https://github.com/seu-usuario/camara.git
cd camara

npm ci

# Cria arquivo .env
nano .env
```

Conteúdo do arquivo `.env` para Supabase:

```env
# =============================================================================
# Configuração - Câmara Municipal (Supabase)
# =============================================================================

# Banco de Dados Supabase
# Use a URL de Transaction (6543) para DATABASE_URL
DATABASE_URL="postgresql://postgres.XXXX:[SUA-SENHA]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&schema=public"

# Use a URL de Session (5432) para DIRECT_URL (migrations)
DIRECT_URL="postgresql://postgres.XXXX:[SUA-SENHA]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres?schema=public"

# Autenticação
NEXTAUTH_URL="https://SEU_DOMINIO.gov.br"
NEXTAUTH_SECRET="gere_com_openssl_rand_base64_32"

# Identificação do Site
SITE_NAME="Câmara Municipal de SUA_CIDADE"
SITE_URL="https://SEU_DOMINIO.gov.br"
NEXT_PUBLIC_SITE_NAME="Câmara Municipal de SUA_CIDADE"
NEXT_PUBLIC_SITE_URL="https://SEU_DOMINIO.gov.br"

# Ambiente
NODE_ENV="production"
```

```bash
chmod 600 .env
```

### 4.5 Configuração do Prisma e Build

```bash
cd /var/www/camara

# Gera cliente Prisma
npx prisma generate

# Executa migrations no Supabase
npx prisma migrate deploy

# Se der erro de conexão, verifique:
# 1. Se as URLs estão corretas
# 2. Se a senha está correta
# 3. Se o IP da VPS não está bloqueado

# Seed
npx prisma db seed

# Build
npm run build
```

### 4.6 Restante da Configuração

Siga os mesmos passos do Cenário 1:
- Seção 3.10 (PM2)
- Seção 3.11 (Admin)
- Seção 3.12 (Nginx)
- Seção 3.13 (SSL)
- Seção 3.14 (Verificação)

### 4.7 Configurações Adicionais no Supabase

No painel do Supabase:

1. **Database → Extensions**
   - Habilite `uuid-ossp` se não estiver habilitado

2. **Authentication → Providers** (se usar auth do Supabase)
   - Configure conforme necessário

3. **Settings → API**
   - Anote o `anon key` e `service_role key` se precisar

---

## 5. Cenário 3: Docker Compose

Este cenário usa containers Docker, ideal para portabilidade e ambientes padronizados.

### 5.1 Instalação do Docker

```bash
# Remove versões antigas
apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null

# Instala dependências
apt install -y ca-certificates curl gnupg lsb-release

# Adiciona chave GPG do Docker
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Adiciona repositório
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list

# Instala Docker
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Verifica instalação
docker --version
docker compose version

# Habilita Docker na inicialização
systemctl enable docker
```

### 5.2 Clone do Repositório

```bash
mkdir -p /var/www
cd /var/www

git clone https://github.com/seu-usuario/camara.git
cd camara
```

### 5.3 Configuração do docker-compose.yml

```bash
cat > docker-compose.prod.yml << 'EOF'
version: '3.8'

services:
  # Aplicação Next.js
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
      - DATABASE_URL=postgresql://camara_admin:SENHA_SEGURA@db:5432/camara_db?schema=public
      - DIRECT_URL=postgresql://camara_admin:SENHA_SEGURA@db:5432/camara_db?schema=public
    env_file:
      - .env.production
    depends_on:
      db:
        condition: service_healthy
    networks:
      - camara-network

  # Banco de Dados PostgreSQL
  db:
    image: postgres:15-alpine
    container_name: camara-db
    restart: unless-stopped
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: camara_admin
      POSTGRES_PASSWORD: SENHA_SEGURA
      POSTGRES_DB: camara_db
    networks:
      - camara-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U camara_admin -d camara_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Nginx Reverse Proxy
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
    depends_on:
      - app
    networks:
      - camara-network

networks:
  camara-network:
    driver: bridge

volumes:
  postgres_data:
EOF
```

### 5.4 Configuração do Dockerfile

```bash
cat > Dockerfile << 'EOF'
# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN npx prisma generate
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
EOF
```

### 5.5 Configuração do Nginx para Docker

```bash
mkdir -p docker/nginx/conf.d

# nginx.conf principal
cat > docker/nginx/nginx.conf << 'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    keepalive_timeout 65;
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    include /etc/nginx/conf.d/*.conf;
}
EOF

# Configuração do site
cat > docker/nginx/conf.d/default.conf << 'EOF'
upstream app {
    server app:3000;
}

server {
    listen 80;
    server_name SEU_DOMINIO.gov.br;

    client_max_body_size 50M;

    location / {
        proxy_pass http://app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
```

### 5.6 Arquivo .env.production

```bash
cat > .env.production << 'EOF'
NEXTAUTH_URL="https://SEU_DOMINIO.gov.br"
NEXTAUTH_SECRET="gere_com_openssl_rand_base64_32"
SITE_NAME="Câmara Municipal de SUA_CIDADE"
SITE_URL="https://SEU_DOMINIO.gov.br"
NEXT_PUBLIC_SITE_NAME="Câmara Municipal de SUA_CIDADE"
NEXT_PUBLIC_SITE_URL="https://SEU_DOMINIO.gov.br"
NODE_ENV="production"
EOF
```

### 5.7 Build e Inicialização

```bash
cd /var/www/camara

# Build e inicia containers
docker compose -f docker-compose.prod.yml up -d --build

# Aguarda banco de dados ficar pronto
sleep 10

# Executa migrations
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy

# Executa seed
docker compose -f docker-compose.prod.yml exec app npx prisma db seed

# Verifica logs
docker compose -f docker-compose.prod.yml logs -f
```

### 5.8 SSL com Docker

```bash
# Para SSL, instale Certbot no host
apt install -y certbot

# Pare o nginx temporariamente
docker compose -f docker-compose.prod.yml stop nginx

# Gere o certificado
certbot certonly --standalone -d SEU_DOMINIO.gov.br --email seu@email.com --agree-tos --no-eff-email

# Atualize a configuração do nginx para HTTPS
cat > docker/nginx/conf.d/default.conf << 'EOF'
upstream app {
    server app:3000;
}

server {
    listen 80;
    server_name SEU_DOMINIO.gov.br;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name SEU_DOMINIO.gov.br;

    ssl_certificate /etc/letsencrypt/live/SEU_DOMINIO.gov.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/SEU_DOMINIO.gov.br/privkey.pem;

    client_max_body_size 50M;

    location / {
        proxy_pass http://app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Reinicia nginx
docker compose -f docker-compose.prod.yml up -d nginx
```

---

## 6. Cenário 4: PostgreSQL Remoto

Este cenário usa um PostgreSQL gerenciado na nuvem (AWS RDS, Google Cloud SQL, Azure Database, etc.).

### 6.1 Criação do Banco no AWS RDS (Exemplo)

1. Acesse AWS Console → RDS
2. Create database
3. Configurações:
   - Engine: PostgreSQL 15
   - Template: Free tier (ou Production)
   - DB instance identifier: `camara-db`
   - Master username: `camara_admin`
   - Master password: (anote!)
   - Instance: db.t3.micro (ou maior)
   - Storage: 20 GB gp2
   - VPC: default
   - Public access: Yes (configure Security Group!)
   - Database name: `camara_db`

4. No Security Group, adicione:
   - Inbound: PostgreSQL (5432) from `IP_DA_SUA_VPS/32`

### 6.2 String de Conexão

```
DATABASE_URL="postgresql://camara_admin:SENHA@endpoint.rds.amazonaws.com:5432/camara_db?schema=public"
DIRECT_URL="postgresql://camara_admin:SENHA@endpoint.rds.amazonaws.com:5432/camara_db?schema=public"
```

### 6.3 Instalação na VPS

Siga os mesmos passos do Cenário 2 (Supabase), apenas substituindo as URLs de conexão.

---

## 7. Configuração de Domínio e SSL

### 7.1 Configuração de DNS

No painel do seu registrador de domínio:

| Tipo | Nome | Valor | TTL |
|------|------|-------|-----|
| A | @ | IP_DA_VPS | 300 |
| A | www | IP_DA_VPS | 300 |
| CNAME | www | seudominio.gov.br | 300 |

### 7.2 Verificação de DNS

```bash
# Verifica se DNS está propagado
dig seudominio.gov.br +short
# Deve retornar o IP da VPS

# Ou use
nslookup seudominio.gov.br
```

### 7.3 Geração de Certificado SSL

```bash
# Certifique-se que Nginx está rodando na porta 80
# e que o domínio aponta para a VPS

# Gera certificado
certbot --nginx -d seudominio.gov.br -d www.seudominio.gov.br

# Ou para Docker (modo standalone)
certbot certonly --standalone -d seudominio.gov.br

# Configura renovação automática
systemctl enable certbot.timer
systemctl start certbot.timer

# Testa renovação
certbot renew --dry-run
```

---

## 8. Pós-Instalação

### 8.1 Verificações Obrigatórias

```bash
# 1. Aplicação respondendo
curl -I https://seudominio.gov.br

# 2. Login admin funcionando
# Acesse https://seudominio.gov.br/admin

# 3. SSL válido
echo | openssl s_client -connect seudominio.gov.br:443 2>/dev/null | openssl x509 -noout -dates

# 4. Serviços rodando
pm2 status          # Para PM2
docker compose ps   # Para Docker
```

### 8.2 Configuração Inicial no Sistema

1. **Acesse o Admin**: https://seudominio.gov.br/admin
2. **Configure dados institucionais**:
   - Logo da câmara
   - Endereço
   - Telefone
   - Email
   - Redes sociais
3. **Cadastre a legislatura atual**
4. **Cadastre os parlamentares**
5. **Configure a mesa diretora**
6. **Cadastre as comissões**

### 8.3 Backup Automático

```bash
# Cria script de backup
cat > /usr/local/bin/backup-camara.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/camara"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

# Backup do banco (PostgreSQL local)
PGPASSWORD="SUA_SENHA" pg_dump -h localhost -U camara_admin camara_db | gzip > "${BACKUP_DIR}/db_${DATE}.sql.gz"

# Backup de uploads
tar -czf "${BACKUP_DIR}/uploads_${DATE}.tar.gz" /var/www/camara/public/uploads

# Backup do .env
cp /var/www/camara/.env "${BACKUP_DIR}/env_${DATE}.bak"

# Remove backups antigos (mantém 30 dias)
find "$BACKUP_DIR" -type f -mtime +30 -delete

echo "Backup concluído: $(date)"
EOF

chmod +x /usr/local/bin/backup-camara.sh

# Adiciona ao cron (diário às 3h)
(crontab -l 2>/dev/null; echo "0 3 * * * /usr/local/bin/backup-camara.sh >> /var/log/backup-camara.log 2>&1") | crontab -
```

---

## 9. Troubleshooting

### 9.1 Aplicação Não Inicia

```bash
# Verifica logs do PM2
pm2 logs camara --lines 50

# Verifica se porta está em uso
lsof -i :3000

# Verifica variáveis de ambiente
cat /var/www/camara/.env

# Tenta iniciar manualmente
cd /var/www/camara && npm start
```

### 9.2 Erro de Conexão com Banco

```bash
# Testa conexão PostgreSQL local
psql -h localhost -U camara_admin -d camara_db -c "SELECT 1"

# Verifica se PostgreSQL está rodando
systemctl status postgresql

# Verifica logs do PostgreSQL
tail -f /var/log/postgresql/postgresql-15-main.log

# Para Supabase, verifica URL
# Certifique-se que a senha não tem caracteres especiais sem escape
```

### 9.3 Nginx Retorna 502 Bad Gateway

```bash
# Verifica se aplicação está rodando
pm2 status
curl http://localhost:3000

# Verifica configuração Nginx
nginx -t

# Verifica logs do Nginx
tail -f /var/log/nginx/error.log
```

### 9.4 SSL Não Funciona

```bash
# Verifica certificado
certbot certificates

# Verifica se porta 443 está aberta
ufw status
ss -tlnp | grep 443

# Renova manualmente
certbot renew --force-renewal
```

### 9.5 Erro de Permissão

```bash
# Corrige permissões
chown -R www-data:www-data /var/www/camara/public/uploads
chmod -R 755 /var/www/camara/public/uploads
chmod 600 /var/www/camara/.env
```

---

## 10. Comandos de Manutenção

### 10.1 Comandos PM2

```bash
# Status
pm2 status

# Logs em tempo real
pm2 logs camara

# Reiniciar
pm2 restart camara

# Reload (zero downtime)
pm2 reload camara

# Monitoramento
pm2 monit

# Info detalhada
pm2 show camara
```

### 10.2 Comandos Docker

```bash
# Status
docker compose -f docker-compose.prod.yml ps

# Logs
docker compose -f docker-compose.prod.yml logs -f

# Reiniciar
docker compose -f docker-compose.prod.yml restart

# Rebuild
docker compose -f docker-compose.prod.yml up -d --build

# Parar tudo
docker compose -f docker-compose.prod.yml down

# Limpar volumes (CUIDADO: apaga dados!)
docker compose -f docker-compose.prod.yml down -v
```

### 10.3 Atualização do Sistema

```bash
cd /var/www/camara

# Para aplicação
pm2 stop camara

# Backup
/usr/local/bin/backup-camara.sh

# Atualiza código
git pull origin main

# Atualiza dependências
npm ci

# Atualiza banco
npx prisma migrate deploy

# Rebuild
npm run build

# Reinicia
pm2 restart camara
```

### 10.4 Monitoramento de Recursos

```bash
# Uso de CPU e memória
htop

# Uso de disco
df -h

# Logs do sistema
journalctl -f

# Conexões de rede
ss -tuln
```

---

## Referência Rápida

| Comando | Descrição |
|---------|-----------|
| `pm2 status` | Status da aplicação |
| `pm2 logs camara` | Ver logs |
| `pm2 restart camara` | Reiniciar |
| `nginx -t` | Testar config Nginx |
| `systemctl reload nginx` | Recarregar Nginx |
| `certbot renew` | Renovar SSL |
| `psql -U camara_admin -d camara_db` | Acessar banco |
| `npx prisma studio` | Interface visual do banco |

---

## Suporte

- **Documentação**: `/docs` no repositório
- **Issues**: GitHub Issues
- **Email**: suporte@exemplo.com

---

> **Última atualização**: Janeiro/2026
