# Guia Multi-Tenant: Sistema para Múltiplas Câmaras Municipais

Este documento apresenta recomendações, arquitetura e estratégias para implantar o sistema em múltiplas Câmaras Municipais de Vereadores.

---

## Índice

1. [Visão Geral](#visão-geral)
2. [Estratégias de Multi-Tenancy](#estratégias-de-multi-tenancy)
3. [Arquitetura Recomendada](#arquitetura-recomendada)
4. [Configuração por Estratégia](#configuração-por-estratégia)
5. [Gestão Centralizada](#gestão-centralizada)
6. [Segurança e Isolamento](#segurança-e-isolamento)
7. [Custos e Escalabilidade](#custos-e-escalabilidade)
8. [Monitoramento](#monitoramento)
9. [Backup e Disaster Recovery](#backup-e-disaster-recovery)
10. [Checklist de Implantação](#checklist-de-implantação)

---

## Visão Geral

### O Desafio

Ao implantar o sistema para múltiplas Câmaras Municipais, é necessário considerar:

- **Isolamento de dados**: Cada câmara deve acessar apenas seus próprios dados
- **Personalização**: Cada câmara tem identidade visual, regimento e configurações próprias
- **Escalabilidade**: O sistema deve suportar desde 1 até centenas de câmaras
- **Custo-benefício**: Otimizar recursos computacionais e custos operacionais
- **Manutenção**: Atualizações devem ser simples e centralizadas
- **Conformidade**: LGPD, transparência pública, acessibilidade

### Perfis de Uso

| Perfil | Câmaras | Infraestrutura Recomendada |
|--------|---------|---------------------------|
| **Pequeno** | 1-5 | VPS única com instâncias separadas |
| **Médio** | 6-20 | VPS com banco centralizado + subdomínios |
| **Grande** | 21-100 | Kubernetes ou múltiplas VPS + Load Balancer |
| **Enterprise** | 100+ | Cloud completo (AWS/GCP/Azure) com auto-scaling |

---

## Estratégias de Multi-Tenancy

### Estratégia 1: Banco de Dados Separado por Tenant

```
┌─────────────────────────────────────────────────────────────┐
│                        VPS / Cloud                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   App 1     │  │   App 2     │  │   App 3     │        │
│  │ camara-a.br │  │ camara-b.br │  │ camara-c.br │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │                │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐        │
│  │   DB: A     │  │   DB: B     │  │   DB: C     │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

**Vantagens:**
- Isolamento completo de dados
- Fácil backup/restore por tenant
- Performance previsível
- Fácil migração de tenant

**Desvantagens:**
- Mais recursos necessários
- Manutenção de múltiplos schemas
- Custo maior

**Quando usar:**
- Requisitos rigorosos de isolamento
- Câmaras de grande porte
- Contratos que exigem separação física

---

### Estratégia 2: Schema Separado por Tenant (Mesmo Banco)

```
┌─────────────────────────────────────────────────────────────┐
│                        VPS / Cloud                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    Aplicação                         │   │
│  │  (identifica tenant pelo domínio/subdomínio)        │   │
│  └─────────────────────────┬───────────────────────────┘   │
│                            │                                │
│  ┌─────────────────────────▼───────────────────────────┐   │
│  │              PostgreSQL Database                     │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │   │
│  │  │ schema_a │  │ schema_b │  │ schema_c │          │   │
│  │  └──────────┘  └──────────┘  └──────────┘          │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Vantagens:**
- Isolamento lógico de dados
- Compartilha recursos do banco
- Único servidor de banco

**Desvantagens:**
- Complexidade no Prisma (múltiplos schemas)
- Backup mais complexo
- Risco de "noisy neighbor"

**Quando usar:**
- Número moderado de câmaras (5-30)
- Orçamento limitado
- Câmaras de pequeno/médio porte

---

### Estratégia 3: Coluna tenant_id (Dados Compartilhados)

```
┌─────────────────────────────────────────────────────────────┐
│                        VPS / Cloud                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    Aplicação                         │   │
│  │  (filtra por tenant_id em todas as queries)         │   │
│  └─────────────────────────┬───────────────────────────┘   │
│                            │                                │
│  ┌─────────────────────────▼───────────────────────────┐   │
│  │              PostgreSQL Database                     │   │
│  │  ┌────────────────────────────────────────────────┐ │   │
│  │  │  Tabelas com coluna tenant_id                  │ │   │
│  │  │  parlamentar (id, tenant_id, nome, ...)        │ │   │
│  │  │  sessao (id, tenant_id, data, ...)             │ │   │
│  │  └────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Vantagens:**
- Máxima eficiência de recursos
- Queries cross-tenant fáceis (relatórios)
- Manutenção simplificada

**Desvantagens:**
- Risco de vazamento de dados (bugs)
- Performance pode degradar com muitos tenants
- Complexidade em RLS (Row Level Security)

**Quando usar:**
- Muitos tenants pequenos
- Necessidade de relatórios consolidados
- Equipe com experiência em multi-tenancy

---

### Estratégia 4: Instâncias Completamente Separadas

```
┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│    VPS 1       │  │    VPS 2       │  │    VPS 3       │
│  camara-a.br   │  │  camara-b.br   │  │  camara-c.br   │
│  ┌──────────┐  │  │  ┌──────────┐  │  │  ┌──────────┐  │
│  │   App    │  │  │  │   App    │  │  │  │   App    │  │
│  ├──────────┤  │  │  ├──────────┤  │  │  ├──────────┤  │
│  │    DB    │  │  │  │    DB    │  │  │  │    DB    │  │
│  └──────────┘  │  │  └──────────┘  │  │  └──────────┘  │
└────────────────┘  └────────────────┘  └────────────────┘
```

**Vantagens:**
- Isolamento total
- Independência de versões
- Facilidade de gestão individual
- Sem riscos de contaminação

**Desvantagens:**
- Maior custo de infraestrutura
- Mais trabalho de manutenção
- Atualizações manuais em cada instância

**Quando usar:**
- Câmaras que exigem independência total
- Diferentes contratos/SLAs
- Versões customizadas por cliente

---

## Arquitetura Recomendada

### Para Empresas/Consórcios (5-50 Câmaras)

Recomendamos a **Estratégia 2 (Schema por Tenant)** com Supabase:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Arquitetura Recomendada                      │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Load Balancer / CDN                       │   │
│  │                    (Cloudflare / AWS ALB)                    │   │
│  └──────────────────────────┬──────────────────────────────────┘   │
│                             │                                       │
│  ┌──────────────────────────▼──────────────────────────────────┐   │
│  │                      VPS Principal                           │   │
│  │  ┌─────────────────────────────────────────────────────┐    │   │
│  │  │                    Nginx                             │    │   │
│  │  │  (routing por domínio → instância correta)          │    │   │
│  │  └─────────────────────────────────────────────────────┘    │   │
│  │                                                              │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │   │
│  │  │  PM2: App1  │  │  PM2: App2  │  │  PM2: App3  │         │   │
│  │  │  :3001      │  │  :3002      │  │  :3003      │         │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘         │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                             │                                       │
│  ┌──────────────────────────▼──────────────────────────────────┐   │
│  │                    Supabase (Cloud)                          │   │
│  │  ┌──────────────────────────────────────────────────────┐   │   │
│  │  │  Projeto por Câmara OU Schemas separados             │   │   │
│  │  │  - Backups automáticos                               │   │   │
│  │  │  - Connection Pooling (PgBouncer)                    │   │   │
│  │  │  - Alta disponibilidade                              │   │   │
│  │  └──────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Configuração por Estratégia

### Opção A: Múltiplas Instâncias na Mesma VPS

Estrutura de diretórios:
```
/var/www/
├── camara-a/
│   ├── .env              # DATABASE_URL específico
│   ├── ecosystem.config.js
│   └── ...
├── camara-b/
│   ├── .env
│   ├── ecosystem.config.js
│   └── ...
└── camara-c/
    ├── .env
    ├── ecosystem.config.js
    └── ...
```

Configuração Nginx (`/etc/nginx/sites-available/camaras`):
```nginx
# Câmara A
server {
    listen 443 ssl http2;
    server_name camara-a.gov.br;

    ssl_certificate /etc/letsencrypt/live/camara-a.gov.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/camara-a.gov.br/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Câmara B
server {
    listen 443 ssl http2;
    server_name camara-b.gov.br;

    ssl_certificate /etc/letsencrypt/live/camara-b.gov.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/camara-b.gov.br/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3002;
        # ... mesmas configurações
    }
}
```

PM2 Ecosystem para múltiplas instâncias:
```javascript
// /var/www/ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'camara-a',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/camara-a',
      env: { PORT: 3001, NODE_ENV: 'production' }
    },
    {
      name: 'camara-b',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/camara-b',
      env: { PORT: 3002, NODE_ENV: 'production' }
    },
    {
      name: 'camara-c',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/camara-c',
      env: { PORT: 3003, NODE_ENV: 'production' }
    }
  ]
};
```

### Opção B: Aplicação Única com Multi-Tenant

Modificação no `middleware.ts`:
```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';

  // Extrai o tenant do subdomínio ou domínio
  let tenant = 'default';

  if (hostname.includes('.')) {
    // Subdomínio: santarem.camaras.gov.br
    const subdomain = hostname.split('.')[0];
    if (subdomain !== 'www' && subdomain !== 'camaras') {
      tenant = subdomain;
    }
  }

  // Adiciona tenant ao header para uso na aplicação
  const response = NextResponse.next();
  response.headers.set('x-tenant', tenant);

  return response;
}
```

Modificação no Prisma para multi-schema:
```typescript
// src/lib/prisma-tenant.ts
import { PrismaClient } from '@prisma/client';

const prismaClients: Map<string, PrismaClient> = new Map();

export function getPrismaClient(tenant: string): PrismaClient {
  if (!prismaClients.has(tenant)) {
    const client = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL?.replace('schema=public', `schema=${tenant}`)
        }
      }
    });
    prismaClients.set(tenant, client);
  }

  return prismaClients.get(tenant)!;
}
```

---

## Gestão Centralizada

### Painel de Administração Master

Recomenda-se criar um painel central para gerenciar todas as câmaras:

```
/admin-master
├── /tenants              # Lista de câmaras
├── /tenants/new          # Adicionar nova câmara
├── /tenants/:id          # Detalhes da câmara
├── /tenants/:id/config   # Configurações
├── /tenants/:id/users    # Usuários da câmara
├── /monitoring           # Status de todas as câmaras
├── /updates              # Gerenciar atualizações
└── /reports              # Relatórios consolidados
```

### Script de Provisionamento Automático

```bash
#!/bin/bash
# provision-tenant.sh - Provisiona nova câmara

TENANT_NAME="$1"
DOMAIN="$2"
ADMIN_EMAIL="$3"

# Valida parâmetros
if [[ -z "$TENANT_NAME" || -z "$DOMAIN" || -z "$ADMIN_EMAIL" ]]; then
    echo "Uso: $0 <tenant_name> <domain> <admin_email>"
    exit 1
fi

APP_DIR="/var/www/${TENANT_NAME}"
PORT=$((3000 + $(ls -d /var/www/camara-* 2>/dev/null | wc -l) + 1))

echo "Provisionando: $TENANT_NAME"
echo "Domínio: $DOMAIN"
echo "Porta: $PORT"

# 1. Clona repositório
git clone --depth 1 https://github.com/seu-repo/camara.git "$APP_DIR"

# 2. Configura .env
cat > "${APP_DIR}/.env" << EOF
DATABASE_URL="postgresql://user:pass@supabase.com:6543/postgres?schema=${TENANT_NAME}"
DIRECT_URL="postgresql://user:pass@supabase.com:5432/postgres?schema=${TENANT_NAME}"
NEXTAUTH_URL="https://${DOMAIN}"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
SITE_NAME="Câmara Municipal de ${TENANT_NAME}"
SITE_URL="https://${DOMAIN}"
NODE_ENV="production"
EOF

# 3. Instala dependências e build
cd "$APP_DIR"
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build

# 4. Configura PM2
cat > "${APP_DIR}/ecosystem.config.js" << EOF
module.exports = {
  apps: [{
    name: '${TENANT_NAME}',
    script: 'npm',
    args: 'start',
    cwd: '${APP_DIR}',
    env: { PORT: ${PORT}, NODE_ENV: 'production' }
  }]
};
EOF

pm2 start "${APP_DIR}/ecosystem.config.js"
pm2 save

# 5. Configura Nginx
cat > "/etc/nginx/sites-available/${DOMAIN}" << EOF
server {
    listen 80;
    server_name ${DOMAIN};
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${DOMAIN};

    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF

ln -sf "/etc/nginx/sites-available/${DOMAIN}" "/etc/nginx/sites-enabled/"

# 6. Gera certificado SSL
certbot certonly --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$ADMIN_EMAIL"

# 7. Recarrega Nginx
nginx -t && systemctl reload nginx

echo "✅ Câmara ${TENANT_NAME} provisionada com sucesso!"
echo "🌐 URL: https://${DOMAIN}"
```

---

## Segurança e Isolamento

### Row Level Security (RLS) no PostgreSQL

```sql
-- Habilita RLS nas tabelas
ALTER TABLE parlamentar ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessao ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposicao ENABLE ROW LEVEL SECURITY;

-- Cria política de isolamento por tenant
CREATE POLICY tenant_isolation_parlamentar ON parlamentar
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY tenant_isolation_sessao ON sessao
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Função para definir tenant na conexão
CREATE OR REPLACE FUNCTION set_tenant(tenant_uuid UUID)
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.current_tenant', tenant_uuid::text, false);
END;
$$ LANGUAGE plpgsql;
```

### Checklist de Segurança Multi-Tenant

- [ ] Isolamento de dados entre tenants
- [ ] Autenticação separada por tenant
- [ ] Logs de auditoria com identificação do tenant
- [ ] Backups separados ou identificáveis por tenant
- [ ] Rate limiting por tenant
- [ ] Monitoramento de tentativas de acesso cross-tenant
- [ ] Criptografia de dados sensíveis
- [ ] LGPD compliance por tenant

---

## Custos e Escalabilidade

### Estimativa de Custos (VPS + Supabase)

| Cenário | Câmaras | VPS | Supabase | Total/mês |
|---------|---------|-----|----------|-----------|
| Pequeno | 1-3 | $20 (4GB) | $25/projeto | $45-95 |
| Médio | 4-10 | $40 (8GB) | $25 (compartilhado) | $65 |
| Grande | 11-30 | $80 (16GB) | $75 (Pro) | $155 |
| Enterprise | 30+ | $160+ | $599+ (Team) | $759+ |

### Requisitos de Hardware por Tenant

| Recurso | Por Tenant | 10 Tenants | 30 Tenants |
|---------|-----------|------------|------------|
| RAM | 256-512MB | 4-5GB | 10-15GB |
| CPU | 0.2 vCPU | 2 vCPU | 4-6 vCPU |
| Disco | 1-2GB | 15-20GB | 40-60GB |
| Conexões DB | 5-10 | 50-100 | 150-300 |

---

## Monitoramento

### Stack de Monitoramento Recomendada

```
┌─────────────────────────────────────────────────────────────┐
│                    Monitoramento Multi-Tenant                │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Grafana   │  │  Prometheus │  │   Loki      │         │
│  │ Dashboards  │◄─┤   Métricas  │  │    Logs     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│         │                │                │                 │
│  ┌──────▼────────────────▼────────────────▼──────┐         │
│  │              Alertmanager                      │         │
│  │  - Alerta por tenant                          │         │
│  │  - Notificações (email, Slack, Telegram)      │         │
│  └────────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Métricas Essenciais por Tenant

- Tempo de resposta (p50, p95, p99)
- Taxa de erros (4xx, 5xx)
- Uso de recursos (CPU, memória)
- Conexões de banco ativas
- Requisições por segundo
- Uptime

---

## Backup e Disaster Recovery

### Estratégia de Backup

```bash
#!/bin/bash
# backup-all-tenants.sh

BACKUP_DIR="/var/backups/camaras"
DATE=$(date +%Y%m%d_%H%M%S)
S3_BUCKET="s3://backups-camaras"

# Lista todos os tenants
TENANTS=$(ls -d /var/www/camara-* | xargs -n1 basename)

for tenant in $TENANTS; do
    echo "Backup: $tenant"

    # Backup do banco (Supabase CLI ou pg_dump)
    pg_dump "$DATABASE_URL" --schema="$tenant" | gzip > "${BACKUP_DIR}/${tenant}_${DATE}.sql.gz"

    # Backup de uploads
    tar -czf "${BACKUP_DIR}/${tenant}_uploads_${DATE}.tar.gz" "/var/www/${tenant}/public/uploads"

    # Backup de configurações
    cp "/var/www/${tenant}/.env" "${BACKUP_DIR}/${tenant}_env_${DATE}.bak"
done

# Upload para S3
aws s3 sync "$BACKUP_DIR" "$S3_BUCKET" --delete

# Limpa backups antigos (mantém 30 dias)
find "$BACKUP_DIR" -type f -mtime +30 -delete

echo "Backup concluído: $(date)"
```

### Plano de Disaster Recovery

| RPO (Perda de Dados) | RTO (Tempo de Recuperação) | Estratégia |
|----------------------|---------------------------|------------|
| 24h | 4h | Backup diário, restore manual |
| 1h | 1h | Backup horário, scripts automatizados |
| 15min | 15min | Replicação, failover automático |
| 0 | 0 | Multi-região ativa/ativa |

---

## Checklist de Implantação

### Antes de Implantar Nova Câmara

- [ ] Domínio registrado e DNS configurado
- [ ] Certificado SSL válido
- [ ] Banco de dados/schema criado
- [ ] Variáveis de ambiente configuradas
- [ ] Usuário administrador definido
- [ ] Dados iniciais (legislaturas, partidos)
- [ ] Identidade visual (logo, cores)
- [ ] Regimento interno digitalizado

### Após Implantação

- [ ] Teste de login admin
- [ ] Teste de cadastro de parlamentar
- [ ] Teste de criação de sessão
- [ ] Teste de publicação de notícia
- [ ] Verificação de SSL
- [ ] Monitoramento configurado
- [ ] Backup testado
- [ ] Documentação entregue ao cliente

### Manutenção Contínua

- [ ] Atualização semanal de dependências
- [ ] Revisão mensal de logs de erro
- [ ] Teste trimestral de restore de backup
- [ ] Auditoria semestral de segurança
- [ ] Treinamento anual de usuários

---

## Próximos Passos

1. **Definir estratégia** de multi-tenancy baseada no número de câmaras
2. **Provisionar infraestrutura** (VPS, Supabase, domínios)
3. **Configurar monitoramento** centralizado
4. **Criar scripts de automação** para provisionamento
5. **Documentar procedimentos** de operação
6. **Treinar equipe** de suporte

---

> **Nota**: Este documento deve ser revisado periodicamente conforme o sistema evolui e novas câmaras são adicionadas.
