# Guia: Como Configurar uma Nova Câmara Municipal

Este guia explica como implantar o sistema para uma nova Câmara Municipal usando a estratégia de **Database por Tenant** (banco de dados separado por câmara).

---

## Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Repository                        │
│                    (código compartilhado)                    │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  Vercel App   │     │  Vercel App   │     │  Vercel App   │
│  Câmara A     │     │  Câmara B     │     │  Câmara C     │
│  .env → DB_A  │     │  .env → DB_B  │     │  .env → DB_C  │
└───────┬───────┘     └───────┬───────┘     └───────┬───────┘
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  Supabase A   │     │  Supabase B   │     │  Supabase C   │
│  (Câmara A)   │     │  (Câmara B)   │     │  (Câmara C)   │
└───────────────┘     └───────────────┘     └───────────────┘
```

**Vantagens desta abordagem:**
- Isolamento total de dados entre câmaras
- Cada câmara pode usar o free tier do Supabase
- Deploy independente para cada câmara
- Atualizações de código centralizadas via GitHub

---

## Passo a Passo

### 1. Criar Projeto no Supabase

1. Acesse [dashboard.supabase.com](https://dashboard.supabase.com)
2. Clique em **"New Project"**
3. Preencha:
   - **Organization**: Selecione ou crie uma
   - **Project name**: `camara-[nome-da-cidade]` (ex: `camara-santarem`)
   - **Database password**: Gere uma senha forte e guarde-a!
   - **Region**: `South America (São Paulo)`
4. Aguarde a criação do projeto

### 2. Obter URLs de Conexão

1. No projeto Supabase, vá em **Project Settings** > **Database**
2. Role até **Connection string**
3. Copie as URLs:

```env
# URL com pooling (para a aplicação)
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[SENHA]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# URL direta (para migrations)
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[SENHA]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres"
```

**Importante:**
- Substitua `[PROJECT-REF]` pelo identificador do projeto (ex: `abc123xyz`)
- Substitua `[SENHA]` pela senha do banco
- A DATABASE_URL deve usar porta `6543` e ter `?pgbouncer=true`
- A DIRECT_URL deve usar porta `5432`

### 3. Criar Deploy na Vercel

#### Opção A: Fork do Repositório

1. Faça um fork do repositório original no GitHub
2. Acesse [vercel.com](https://vercel.com) e faça login
3. Clique em **"Add New..."** > **"Project"**
4. Selecione o repositório do fork
5. Configure:
   - **Project Name**: `camara-[nome-da-cidade]`
   - **Framework Preset**: Next.js (detectado automaticamente)

#### Opção B: Usar o Mesmo Repositório

1. Acesse [vercel.com](https://vercel.com)
2. Clique em **"Add New..."** > **"Project"**
3. Selecione o repositório original
4. Configure um nome único para o projeto

### 4. Configurar Variáveis de Ambiente na Vercel

No projeto Vercel, vá em **Settings** > **Environment Variables** e adicione:

#### Variáveis Obrigatórias

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `DATABASE_URL` | `postgresql://...` | URL do Supabase com pooling |
| `DIRECT_URL` | `postgresql://...` | URL do Supabase direta |
| `NEXTAUTH_URL` | `https://seu-projeto.vercel.app` | URL do site |
| `NEXTAUTH_SECRET` | `[gerar]` | Chave secreta única |
| `SITE_NAME` | `Câmara Municipal de [Cidade]` | Nome da câmara |
| `SITE_URL` | `https://seu-projeto.vercel.app` | URL do site |

#### Variáveis Públicas (Client-side)

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `NEXT_PUBLIC_SITE_NAME` | `Câmara Municipal de [Cidade]` | Fallback client-side |
| `NEXT_PUBLIC_SITE_URL` | `https://seu-projeto.vercel.app` | Fallback client-side |

#### Variáveis Opcionais

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `SITE_DESCRIPTION` | `Portal Institucional da...` | SEO |
| `GOOGLE_SITE_VERIFICATION` | `[código]` | Google Search Console |
| `EMAIL_SERVER_HOST` | `smtp.gmail.com` | Servidor SMTP |
| `EMAIL_FROM` | `noreply@camara.gov.br` | Email remetente |

**Para gerar NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 5. Fazer o Deploy

1. Na Vercel, clique em **"Deploy"**
2. Aguarde o build completar
3. Acesse a URL gerada para verificar

### 6. Criar Tabelas no Banco

Após o deploy, você precisa criar as tabelas no banco:

#### Opção A: Via Terminal Local

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/seu-repo.git
cd seu-repo

# Instale as dependências
npm install

# Configure o .env.local com as URLs do Supabase
cp .env.example .env.local
# Edite o .env.local com as URLs corretas

# Aplique o schema
npm run db:push

# (Opcional) Execute o seed inicial
npm run db:seed
```

#### Opção B: Via Vercel CLI

```bash
# Instale a Vercel CLI
npm i -g vercel

# Faça login
vercel login

# Vincule ao projeto
vercel link

# Execute o comando remotamente
vercel env pull .env.local
npm run db:push
```

### 7. Configurar Dados Institucionais

1. Acesse `https://seu-projeto.vercel.app/admin`
2. Faça login (primeiro acesso, crie um usuário admin)
3. Vá em **Configurações** > **Dados Institucionais**
4. Preencha:
   - Nome da Casa Legislativa
   - CNPJ
   - Endereço completo
   - Telefone
   - Email
   - Logo (upload)
5. Salve as configurações

### 8. Cadastrar Dados Iniciais

Acesse o painel admin e cadastre:

1. **Legislatura**: Período atual (ex: 2025-2028)
2. **Parlamentares**: Todos os vereadores
3. **Mesa Diretora**: Defina os cargos (Presidente, Vice, Secretários)
4. **Comissões**: Crie as comissões existentes

---

## Checklist de Implantação

```
[ ] 1. Projeto criado no Supabase
[ ] 2. URLs de conexão copiadas
[ ] 3. Projeto criado na Vercel
[ ] 4. Variáveis de ambiente configuradas:
    [ ] DATABASE_URL
    [ ] DIRECT_URL
    [ ] NEXTAUTH_URL
    [ ] NEXTAUTH_SECRET
    [ ] SITE_NAME
    [ ] SITE_URL
    [ ] NEXT_PUBLIC_SITE_NAME
    [ ] NEXT_PUBLIC_SITE_URL
[ ] 5. Deploy realizado com sucesso
[ ] 6. Tabelas criadas (npm run db:push)
[ ] 7. Dados institucionais configurados
[ ] 8. Parlamentares cadastrados
[ ] 9. Mesa Diretora definida
[ ] 10. Legislatura criada
```

---

## Atualizações de Código

Quando houver atualizações no código fonte:

### Se estiver usando Fork

```bash
# No seu fork
git remote add upstream https://github.com/usuario-original/repo-original.git
git fetch upstream
git merge upstream/main
git push origin main
```

A Vercel detectará automaticamente e fará o deploy.

### Se estiver usando o mesmo repositório

Todos os projetos Vercel vinculados ao repositório receberão a atualização automaticamente.

---

## Personalização Avançada

### Cores do Tema

As cores do tema estão em `tailwind.config.js`. Para personalizar por câmara, você pode:

1. Criar variáveis CSS customizadas
2. Usar variáveis de ambiente para cores
3. Criar um tema por câmara

### Logo

O logo pode ser configurado de duas formas:

1. **Via Admin**: Upload na seção de configurações institucionais
2. **Via Supabase Storage**: Upload direto e configuração da URL

### Domínio Personalizado

1. Na Vercel, vá em **Settings** > **Domains**
2. Adicione seu domínio (ex: `camara.cidade.gov.br`)
3. Configure os DNS conforme instruções da Vercel
4. Atualize `NEXTAUTH_URL` e `SITE_URL` com o novo domínio

---

## Custos Estimados

| Item | Plano Gratuito | Plano Pago |
|------|----------------|------------|
| **Supabase** | 500MB DB, 1GB storage | $25/mês (Pro) |
| **Vercel** | 100GB bandwidth | $20/mês (Pro) |
| **Domínio** | - | ~$40/ano |
| **Total** | $0/mês | ~$48/mês |

**Recomendação:** Comece com o plano gratuito. O Supabase Pro é recomendado para produção (backups automáticos, mais recursos).

---

## Suporte e Contato

Para dúvidas ou problemas:

1. Consulte a documentação em `/docs`
2. Abra uma issue no GitHub
3. Entre em contato com a equipe de desenvolvimento

---

## Referências

- [Documentação do Supabase](https://supabase.com/docs)
- [Documentação da Vercel](https://vercel.com/docs)
- [Documentação do Next.js](https://nextjs.org/docs)
- [Documentação do Prisma](https://www.prisma.io/docs)
