# Deploy na Vercel com Supabase

Guia completo para fazer deploy do Sistema da Camara Municipal na Vercel usando Supabase como banco de dados.

---

## Pre-requisitos

- Conta no [GitHub](https://github.com)
- Conta na [Vercel](https://vercel.com) (gratis)
- Conta no [Supabase](https://supabase.com) (gratis)

---

## Passo 1: Configurar o Supabase

### 1.1 Criar Projeto

1. Acesse [supabase.com](https://supabase.com) e faca login
2. Clique em **New Project**
3. Preencha:
   - **Name**: `camara-mojui` (ou nome de sua preferencia)
   - **Database Password**: Crie uma senha forte (guarde-a!)
   - **Region**: `South America (Sao Paulo)` - mais proximo
4. Clique em **Create new project**
5. Aguarde a criacao (1-2 minutos)

### 1.2 Obter Credenciais do Banco

1. No dashboard do Supabase, va em **Project Settings** (icone de engrenagem)
2. Clique em **Database**
3. Role ate **Connection string**
4. Copie a **URI** e substitua `[YOUR-PASSWORD]` pela senha que criou

**Formato das URLs:**

```
# DATABASE_URL (com pooling - para a aplicacao)
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# DIRECT_URL (sem pooling - para migrations)
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
```

> **IMPORTANTE**: Note a diferenca de portas:
> - `6543` = Pooling (use em DATABASE_URL)
> - `5432` = Direto (use em DIRECT_URL)

---

## Passo 2: Preparar o Repositorio

### 2.1 Subir Codigo para GitHub

Se ainda nao fez:

```bash
# Inicializar git (se necessario)
git init

# Adicionar arquivos
git add .

# Commit inicial
git commit -m "feat: preparacao para deploy Vercel"

# Criar repositorio no GitHub e conectar
git remote add origin https://github.com/seu-usuario/camara-mojui.git
git push -u origin main
```

### 2.2 Verificar Arquivos Necessarios

Certifique-se que estes arquivos existem:

- [x] `vercel.json` - Configuracao da Vercel
- [x] `next.config.js` - Com `output: 'standalone'`
- [x] `prisma/schema.prisma` - Com `directUrl`
- [x] `.env.example` - Template de variaveis

---

## Passo 3: Configurar a Vercel

### 3.1 Importar Projeto

1. Acesse [vercel.com](https://vercel.com) e faca login
2. Clique em **Add New** > **Project**
3. Selecione **Import Git Repository**
4. Conecte sua conta do GitHub (se ainda nao conectou)
5. Encontre o repositorio `camara-mojui` e clique em **Import**

### 3.2 Configurar Build

Na tela de configuracao:

- **Framework Preset**: Next.js (detectado automaticamente)
- **Root Directory**: `./` (raiz)
- **Build Command**: `prisma generate && next build`
- **Install Command**: `npm ci`

### 3.3 Configurar Variaveis de Ambiente

Clique em **Environment Variables** e adicione:

| Variavel | Valor | Ambientes |
|----------|-------|-----------|
| `DATABASE_URL` | `postgresql://postgres.xxx:senha@...pooler...6543/postgres?pgbouncer=true` | Todos |
| `DIRECT_URL` | `postgresql://postgres.xxx:senha@...pooler...5432/postgres` | Todos |
| `NEXTAUTH_SECRET` | `sua-chave-secreta-32-chars` | Todos |
| `NEXTAUTH_URL` | `https://seu-projeto.vercel.app` | Production |
| `SITE_NAME` | `Camara Municipal de Mojui dos Campos` | Todos |

> **Dica**: Para gerar NEXTAUTH_SECRET, use:
> ```bash
> openssl rand -base64 32
> ```

### 3.4 Deploy

1. Clique em **Deploy**
2. Aguarde o build (3-5 minutos na primeira vez)
3. Se tudo der certo, voce vera a URL do projeto

---

## Passo 4: Configurar o Banco de Dados

### 4.1 Rodar Migrations

Apos o primeiro deploy, precisamos criar as tabelas no Supabase.

**Opcao A: Via Vercel CLI (Recomendado)**

```bash
# Instalar Vercel CLI
npm i -g vercel

# Logar
vercel login

# Linkar projeto
vercel link

# Puxar variaveis de ambiente
vercel env pull .env.local

# Rodar migrations
npx prisma db push
```

**Opcao B: Localmente**

1. Crie um arquivo `.env.local` com as credenciais do Supabase
2. Execute:
```bash
npx prisma db push
```

### 4.2 Popular Dados Iniciais (Seed)

```bash
npm run db:seed
```

Isso criara:
- Usuario admin padrao
- Legislatura inicial
- Configuracoes basicas

---

## Passo 5: Verificar Deploy

### 5.1 Testar Endpoints

Acesse no navegador:

```
https://seu-projeto.vercel.app/api/health
```

Deve retornar:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-17T...",
  "uptime": 123.456
}
```

### 5.2 Testar Readiness

```
https://seu-projeto.vercel.app/api/readiness
```

Deve mostrar status de todos os checks.

### 5.3 Acessar o Sistema

- **Portal Publico**: `https://seu-projeto.vercel.app`
- **Admin**: `https://seu-projeto.vercel.app/admin`
- **Login Padrao**:
  - Email: `admin@camara.gov.br`
  - Senha: `admin123` (mude imediatamente!)

---

## Passo 6: Configurar Dominio Personalizado

### 6.1 Adicionar Dominio

1. No dashboard da Vercel, va em **Settings** > **Domains**
2. Clique em **Add**
3. Digite seu dominio: `camara.mojuidoscampos.pa.gov.br`
4. Siga as instrucoes para configurar DNS

### 6.2 Configurar DNS

Adicione estes registros no seu provedor de DNS:

```
Tipo: A
Nome: @
Valor: 76.76.21.21

Tipo: CNAME
Nome: www
Valor: cname.vercel-dns.com
```

### 6.3 Atualizar NEXTAUTH_URL

Apos configurar o dominio, atualize na Vercel:

```
NEXTAUTH_URL=https://camara.mojuidoscampos.pa.gov.br
```

---

## Configuracoes Adicionais

### Upload de Arquivos (Supabase Storage)

Se precisar de upload de arquivos:

1. No Supabase, va em **Storage**
2. Crie um bucket chamado `uploads`
3. Configure como **Public**
4. Adicione as variaveis na Vercel:

```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Email (Opcional)

Para recuperacao de senha e notificacoes:

```
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=seu-email@gmail.com
EMAIL_SERVER_PASSWORD=sua-senha-de-app
EMAIL_FROM=Camara Municipal <noreply@camara.gov.br>
```

> **Gmail**: Use uma "Senha de App", nao sua senha normal.

---

## Monitoramento

### Logs da Vercel

1. Va em seu projeto na Vercel
2. Clique em **Deployments**
3. Selecione um deployment
4. Clique em **Functions** para ver logs

### Metricas do Supabase

1. No dashboard do Supabase
2. Va em **Reports** > **Database**
3. Veja uso de conexoes, queries, etc.

---

## Troubleshooting

### Erro: "PrismaClientInitializationError"

**Causa**: Problema de conexao com o banco.

**Solucao**:
1. Verifique se DATABASE_URL esta correto
2. Confirme que usou porta 6543 (pooling)
3. Verifique se adicionou `?pgbouncer=true`

### Erro: "NEXTAUTH_URL mismatch"

**Causa**: URL nao corresponde ao dominio.

**Solucao**:
1. Atualize NEXTAUTH_URL para o dominio correto
2. Faca redeploy

### Build Falha: "prisma generate"

**Causa**: Prisma nao consegue gerar o client.

**Solucao**:
1. Verifique se `prisma` esta nas dependencies (nao devDependencies)
2. Ou adicione ao build command: `prisma generate && next build`

### Funcoes Timeout

**Causa**: Query muito lenta ou conexao lenta.

**Solucao**:
1. Verifique se esta usando pooling (porta 6543)
2. Aumente o timeout em `vercel.json`
3. Otimize as queries

---

## Custos

### Vercel (Hobby - Gratis)

- Bandwidth: 100GB/mes
- Serverless Functions: 100GB-hrs
- Builds: 6000 minutos/mes

### Supabase (Free Tier)

- Database: 500MB
- Storage: 1GB
- Bandwidth: 2GB
- API Requests: 500K/mes

> **Nota**: Para sites governamentais com alto trafego, considere os planos pagos.

---

## Checklist de Deploy

- [ ] Projeto criado no Supabase
- [ ] DATABASE_URL e DIRECT_URL configurados
- [ ] NEXTAUTH_SECRET gerado
- [ ] Repositorio no GitHub
- [ ] Projeto importado na Vercel
- [ ] Variaveis de ambiente configuradas
- [ ] Deploy realizado com sucesso
- [ ] Migrations executadas (`prisma db push`)
- [ ] Seed executado (`npm run db:seed`)
- [ ] Health check funcionando
- [ ] Login admin funcionando
- [ ] Dominio personalizado (opcional)

---

## Suporte

- **Documentacao Vercel**: https://vercel.com/docs
- **Documentacao Supabase**: https://supabase.com/docs
- **Documentacao Next.js**: https://nextjs.org/docs
- **Documentacao Prisma**: https://www.prisma.io/docs

---

*Guia atualizado em: 2026-01-17*
