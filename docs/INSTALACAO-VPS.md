# Guia de Instalação em VPS

Este guia detalha como instalar o Sistema de Câmara Municipal em uma VPS (Virtual Private Server).

---

## Índice

1. [Requisitos](#requisitos)
2. [Instalação Rápida](#instalação-rápida)
3. [Cenários de Deploy](#cenários-de-deploy)
4. [Instalação Manual](#instalação-manual)
5. [Configuração Pós-Instalação](#configuração-pós-instalação)
6. [Manutenção](#manutenção)
7. [Troubleshooting](#troubleshooting)

---

## Requisitos

### Hardware Mínimo

| Recurso | Mínimo | Recomendado |
|---------|--------|-------------|
| CPU | 1 vCPU | 2+ vCPU |
| RAM | 1 GB | 2+ GB |
| Disco | 5 GB | 20+ GB |

### Sistema Operacional

- **Ubuntu** 20.04 LTS ou superior (recomendado: 22.04 LTS)
- **Debian** 11 ou superior

### Pré-requisitos

- Acesso root ou sudo
- Conexão com a internet
- Domínio apontando para o IP da VPS (opcional, mas recomendado)

---

## Instalação Rápida

### Opção 1: Script Automático (Recomendado)

```bash
# Baixa e executa o instalador
curl -fsSL https://raw.githubusercontent.com/seu-usuario/camara/main/scripts/install.sh | sudo bash
```

O instalador irá:
1. Verificar requisitos do sistema
2. Perguntar o tipo de instalação desejado
3. Coletar informações da Câmara e domínio
4. Instalar todas as dependências
5. Configurar banco de dados, Nginx e SSL
6. Iniciar a aplicação

### Opção 2: Clone e Execute

```bash
# Clona o repositório
git clone https://github.com/seu-usuario/camara.git
cd camara

# Executa o instalador
sudo ./scripts/install.sh
```

---

## Cenários de Deploy

### 1. VPS Completa (PostgreSQL Local)

**Ideal para:** Servidores dedicados com recursos adequados.

**Componentes instalados:**
- Node.js 20 LTS
- PostgreSQL 15
- Nginx
- PM2
- Certbot (SSL)

**Diagrama:**
```
┌─────────────────────────────────────────┐
│                  VPS                     │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐ │
│  │  Nginx  │──│  PM2    │──│ Postgres│ │
│  │  :80/:443│  │  :3000  │  │  :5432  │ │
│  └─────────┘  └─────────┘  └─────────┘ │
└─────────────────────────────────────────┘
```

### 2. VPS + Supabase (Banco na Nuvem)

**Ideal para:** Multi-tenant, escalabilidade, backups automáticos.

**Componentes na VPS:**
- Node.js 20 LTS
- Nginx
- PM2
- Certbot (SSL)

**Componentes no Supabase:**
- PostgreSQL 15
- Backups automáticos
- Connection pooling

**Diagrama:**
```
┌─────────────────────────┐     ┌─────────────────┐
│         VPS             │     │    Supabase     │
│  ┌─────────┐ ┌───────┐ │     │  ┌───────────┐  │
│  │  Nginx  │─│  PM2  │─┼─────┼──│ PostgreSQL│  │
│  │  :80/:443│ │ :3000 │ │     │  │   :5432   │  │
│  └─────────┘ └───────┘ │     │  └───────────┘  │
└─────────────────────────┘     └─────────────────┘
```

### 3. Docker Compose

**Ideal para:** Ambientes containerizados, portabilidade.

**Containers:**
- `camara-app`: Aplicação Next.js
- `camara-db`: PostgreSQL 15
- `camara-nginx`: Nginx reverse proxy

**Diagrama:**
```
┌─────────────────────────────────────────────────────┐
│                    Docker Host                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │ camara-nginx│──│  camara-app │──│  camara-db  │ │
│  │   :80/:443  │  │    :3000    │  │    :5432    │ │
│  └─────────────┘  └─────────────┘  └─────────────┘ │
│                   camara-network                     │
└─────────────────────────────────────────────────────┘
```

---

## Instalação Manual

### 1. Preparação do Sistema

```bash
# Atualiza o sistema
sudo apt update && sudo apt upgrade -y

# Instala dependências básicas
sudo apt install -y curl wget git build-essential
```

### 2. Instalar Node.js 20

```bash
# Adiciona repositório NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Instala Node.js
sudo apt install -y nodejs

# Verifica instalação
node --version  # Deve mostrar v20.x.x
npm --version
```

### 3. Instalar PostgreSQL 15 (se necessário)

```bash
# Adiciona repositório PostgreSQL
sudo sh -c 'echo "deb https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update

# Instala PostgreSQL
sudo apt install -y postgresql-15 postgresql-contrib-15

# Cria usuário e banco
sudo -u postgres psql << EOF
CREATE USER camara_admin WITH PASSWORD 'sua_senha_segura';
CREATE DATABASE camara_db OWNER camara_admin;
GRANT ALL PRIVILEGES ON DATABASE camara_db TO camara_admin;
EOF
```

### 4. Instalar Nginx

```bash
sudo apt install -y nginx

# Remove configuração padrão
sudo rm /etc/nginx/sites-enabled/default
```

### 5. Clonar Repositório

```bash
# Cria diretório
sudo mkdir -p /var/www/camara

# Clona repositório
sudo git clone https://github.com/seu-usuario/camara.git /var/www/camara
cd /var/www/camara
```

### 6. Configurar Aplicação

```bash
# Instala dependências
npm ci --only=production

# Cria arquivo .env
cat > .env << EOF
DATABASE_URL="postgresql://camara_admin:sua_senha@localhost:5432/camara_db?schema=public"
DIRECT_URL="postgresql://camara_admin:sua_senha@localhost:5432/camara_db?schema=public"
NEXTAUTH_URL="https://seu-dominio.com.br"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
SITE_NAME="Câmara Municipal de Sua Cidade"
SITE_URL="https://seu-dominio.com.br"
NODE_ENV="production"
EOF

# Gera cliente Prisma
npx prisma generate

# Executa migrations
npx prisma migrate deploy

# Build
npm run build
```

### 7. Configurar PM2

```bash
# Instala PM2
sudo npm install -g pm2

# Cria diretório de logs
sudo mkdir -p /var/log/pm2

# Cria arquivo de configuração
cat > ecosystem.config.js << EOF
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
    }
  }]
};
EOF

# Inicia aplicação
pm2 start ecosystem.config.js

# Configura startup automático
pm2 startup
pm2 save
```

### 8. Configurar Nginx

```bash
# Cria configuração
sudo cat > /etc/nginx/sites-available/camara << EOF
upstream app {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name seu-dominio.com.br;

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
    }
}
EOF

# Habilita site
sudo ln -s /etc/nginx/sites-available/camara /etc/nginx/sites-enabled/

# Testa e reinicia
sudo nginx -t
sudo systemctl reload nginx
```

### 9. Configurar SSL com Certbot

```bash
# Instala Certbot
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot

# Gera certificado
sudo certbot --nginx -d seu-dominio.com.br --email seu@email.com --agree-tos --no-eff-email
```

---

## Configuração Pós-Instalação

### Criar Usuário Administrador

```bash
cd /var/www/camara

# Execute o script ou crie via código
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('sua_senha_admin', 12);
  await prisma.user.upsert({
    where: { email: 'admin@seudominio.com.br' },
    update: { password: hash },
    create: {
      name: 'Administrador',
      email: 'admin@seudominio.com.br',
      password: hash,
      role: 'ADMIN',
      emailVerified: new Date()
    }
  });
  console.log('Admin criado!');
}
main().finally(() => prisma.\$disconnect());
"
```

### Configurar Firewall

```bash
# Instala e configura UFW
sudo apt install -y ufw

sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

sudo ufw enable
```

---

## Manutenção

### Atualizar Sistema

```bash
cd /var/www/camara
sudo ./scripts/update.sh
```

### Backup Manual

```bash
# Backup do banco
pg_dump -U camara_admin camara_db | gzip > backup_$(date +%Y%m%d).sql.gz

# Backup de uploads
tar -czf uploads_$(date +%Y%m%d).tar.gz /var/www/camara/public/uploads
```

### Logs

```bash
# Logs da aplicação
pm2 logs camara

# Logs do Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Logs do PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

### Monitoramento

```bash
# Status da aplicação
pm2 status

# Uso de recursos
pm2 monit

# Status dos serviços
sudo systemctl status nginx
sudo systemctl status postgresql
```

---

## Troubleshooting

### Aplicação não inicia

```bash
# Verifica logs
pm2 logs camara --lines 50

# Verifica se porta está em uso
sudo lsof -i :3000

# Reinicia aplicação
pm2 restart camara
```

### Erro de conexão com banco

```bash
# Testa conexão
psql -U camara_admin -h localhost -d camara_db -c "SELECT 1"

# Verifica se PostgreSQL está rodando
sudo systemctl status postgresql

# Verifica configuração de acesso
sudo cat /etc/postgresql/15/main/pg_hba.conf
```

### Nginx retorna 502

```bash
# Verifica se aplicação está rodando
pm2 status

# Verifica configuração Nginx
sudo nginx -t

# Verifica logs
sudo tail -f /var/log/nginx/error.log
```

### SSL não funciona

```bash
# Verifica certificado
sudo certbot certificates

# Renova manualmente
sudo certbot renew

# Verifica configuração Nginx
sudo nginx -t
```

### Memória insuficiente

```bash
# Cria swap se não existir
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Reduz instâncias PM2
pm2 scale camara 1
```

---

## Comandos Úteis

```bash
# Reiniciar aplicação
pm2 restart camara

# Recarregar sem downtime
pm2 reload camara

# Ver status
pm2 status

# Ver logs
pm2 logs camara

# Monitorar recursos
pm2 monit

# Reiniciar Nginx
sudo systemctl reload nginx

# Reiniciar PostgreSQL
sudo systemctl restart postgresql

# Verificar espaço em disco
df -h

# Verificar uso de memória
free -h

# Verificar processos
htop
```

---

## Suporte

- **Documentação:** https://github.com/seu-usuario/camara/docs
- **Issues:** https://github.com/seu-usuario/camara/issues
- **Email:** suporte@exemplo.com
