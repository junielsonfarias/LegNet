# Guia de Deploy - Câmara Municipal de Mojuí dos Campos

## Visão Geral

Este guia descreve os passos para fazer o deploy do sistema em ambiente de produção.

---

## Pré-requisitos

### Servidor
- **CPU**: Mínimo 2 cores
- **RAM**: Mínimo 4GB
- **Disco**: Mínimo 20GB SSD
- **SO**: Ubuntu 22.04 LTS (recomendado) ou Windows Server 2019+

### Software
- Node.js 18.x ou superior
- PostgreSQL 14.x ou superior
- Nginx (para proxy reverso)
- PM2 (para gerenciamento de processos)
- Certbot (para SSL)

---

## Configuração do Ambiente

### 1. Variáveis de Ambiente

Crie um arquivo `.env.production` com as seguintes variáveis:

```env
# Banco de Dados
DATABASE_URL="postgresql://user:password@host:5432/camara_db?schema=public"

# NextAuth.js
NEXTAUTH_URL="https://seudominio.gov.br"
NEXTAUTH_SECRET="sua-chave-secreta-super-segura-de-32-caracteres"

# Email (SMTP)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="noreply@camara.gov.br"
EMAIL_SERVER_PASSWORD="sua-senha-smtp"
EMAIL_FROM="Câmara Municipal <noreply@camara.gov.br>"

# Upload de Arquivos
UPLOAD_DIR="/var/www/camara/uploads"
MAX_FILE_SIZE=10485760

# Site
SITE_NAME="Câmara Municipal de Mojuí dos Campos"
SITE_URL="https://seudominio.gov.br"

# Logs
LOG_LEVEL="info"
LOG_DIR="/var/log/camara"
```

### 2. Banco de Dados PostgreSQL

```bash
# Conectar ao PostgreSQL
sudo -u postgres psql

# Criar usuário e banco
CREATE USER camara_user WITH PASSWORD 'senha_segura';
CREATE DATABASE camara_db OWNER camara_user;
GRANT ALL PRIVILEGES ON DATABASE camara_db TO camara_user;

# Sair
\q
```

---

## Deploy com PM2 (Recomendado)

### 1. Instalação

```bash
# Clonar repositório
git clone <url-do-repositorio> /var/www/camara
cd /var/www/camara

# Instalar dependências
npm ci --production

# Configurar banco de dados
npm run db:generate
npm run db:push
npm run db:seed

# Build de produção
npm run build

# Instalar PM2 globalmente
npm install -g pm2
```

### 2. Configuração do PM2

Crie o arquivo `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'camara-mojui',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/camara',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/camara/pm2-error.log',
    out_file: '/var/log/camara/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    max_memory_restart: '1G',
    restart_delay: 3000,
    max_restarts: 10
  }]
}
```

### 3. Iniciar Aplicação

```bash
# Iniciar com PM2
pm2 start ecosystem.config.js --env production

# Salvar configuração para auto-restart
pm2 save
pm2 startup

# Verificar status
pm2 status
pm2 logs camara-mojui
```

---

## Configuração do Nginx

### 1. Instalar Nginx

```bash
sudo apt update
sudo apt install nginx
```

### 2. Configuração do Virtual Host

Crie `/etc/nginx/sites-available/camara`:

```nginx
upstream nextjs_upstream {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name seudominio.gov.br www.seudominio.gov.br;

    # Redirecionar para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name seudominio.gov.br www.seudominio.gov.br;

    # SSL
    ssl_certificate /etc/letsencrypt/live/seudominio.gov.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seudominio.gov.br/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Logs
    access_log /var/log/nginx/camara_access.log;
    error_log /var/log/nginx/camara_error.log;

    # Tamanho máximo de upload
    client_max_body_size 10M;

    # Compressão Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;

    # Headers de segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval';" always;

    # Arquivos estáticos do Next.js
    location /_next/static {
        alias /var/www/camara/.next/static;
        expires 365d;
        access_log off;
        add_header Cache-Control "public, immutable";
    }

    # Arquivos públicos
    location /uploads {
        alias /var/www/camara/uploads;
        expires 7d;
        add_header Cache-Control "public";
    }

    # Favicon e robots
    location ~ ^/(favicon\.ico|robots\.txt|sitemap\.xml)$ {
        root /var/www/camara/public;
        expires 7d;
        access_log off;
    }

    # Proxy para Next.js
    location / {
        proxy_pass http://nextjs_upstream;
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
}
```

### 3. Habilitar Site

```bash
sudo ln -s /etc/nginx/sites-available/camara /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## SSL com Let's Encrypt

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d seudominio.gov.br -d www.seudominio.gov.br

# Renovação automática (já configurado por padrão)
sudo certbot renew --dry-run
```

---

## Backup Automático

### 1. Script de Backup

Crie `/opt/backup/backup-camara.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/opt/backup/camara"
DATE=$(date +%Y-%m-%d_%H-%M)
DB_NAME="camara_db"
DB_USER="camara_user"

# Criar diretório
mkdir -p $BACKUP_DIR

# Backup do banco de dados
pg_dump -U $DB_USER $DB_NAME | gzip > "$BACKUP_DIR/db_$DATE.sql.gz"

# Backup dos uploads
tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" /var/www/camara/uploads

# Manter apenas os últimos 30 dias
find $BACKUP_DIR -type f -mtime +30 -delete

echo "Backup concluído: $DATE"
```

### 2. Agendamento com Cron

```bash
# Editar crontab
sudo crontab -e

# Adicionar linha para backup diário às 3h
0 3 * * * /opt/backup/backup-camara.sh >> /var/log/backup-camara.log 2>&1
```

---

## Monitoramento

### Health Check

O sistema disponibiliza endpoints de monitoramento:

- `GET /api/health` - Status geral
- `GET /api/readiness` - Verificação de prontidão

### Métricas

```bash
# Ver métricas do PM2
pm2 monit

# Ver logs em tempo real
pm2 logs camara-mojui --lines 100
```

---

## Deploy com Docker (Alternativo)

### Dockerfile

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/camara
      - NEXTAUTH_URL=http://localhost:3000
      - NEXTAUTH_SECRET=your-secret
    depends_on:
      - db

  db:
    image: postgres:14-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=camara

volumes:
  postgres_data:
```

### Comandos Docker

```bash
# Build e iniciar
docker-compose up -d --build

# Ver logs
docker-compose logs -f app

# Parar
docker-compose down
```

---

## Checklist de Deploy

- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados criado e populado
- [ ] Build de produção executado
- [ ] PM2 configurado e iniciado
- [ ] Nginx configurado como proxy reverso
- [ ] SSL/HTTPS habilitado
- [ ] Backup automático configurado
- [ ] Monitoramento ativo
- [ ] Teste de todas as funcionalidades principais
- [ ] DNS apontando para o servidor

---

## Rollback

Em caso de problemas:

```bash
# Restaurar versão anterior
cd /var/www/camara
git checkout <commit-anterior>
npm ci
npm run build
pm2 restart camara-mojui

# Restaurar banco de dados
gunzip < /opt/backup/camara/db_YYYY-MM-DD.sql.gz | psql -U camara_user camara_db
```

---

## Suporte

Para problemas de deploy:
- Verifique os logs: `pm2 logs` e `/var/log/nginx/camara_error.log`
- Consulte a documentação: `docs/ERROS-E-SOLUCOES.md`
- Entre em contato com o suporte técnico
