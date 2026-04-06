# 🏛️ Instalação - Sistema Legislativo Municipal

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js 18+** - [Download aqui](https://nodejs.org/)
- **PostgreSQL 14+** - [Download aqui](https://www.postgresql.org/download/)
- **Git** - [Download aqui](https://git-scm.com/)

## 🚀 Instalação Rápida

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd sistema-legislativo-municipal
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure o banco de dados
```bash
# Crie um banco PostgreSQL
createdb camara_legislativo_db

# Configure as variáveis de ambiente
cp env.example .env.local
```

### 4. Edite o arquivo .env.local
```env
DATABASE_URL="postgresql://seu_usuario:sua_senha@localhost:5432/camara_legislativo_db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="sua-chave-secreta-aqui"
```

### 5. Configure o banco de dados
```bash
# Gere o cliente Prisma
npm run db:generate

# Execute as migrações
npm run db:push

# Popule o banco com dados iniciais
npm run db:seed
```

### 6. Execute o projeto
```bash
npm run dev
```

## 🌐 Acessos

Após a instalação, o sistema estará disponível em:

- **Portal Público**: http://localhost:3000
- **Painel Admin**: http://localhost:3000/admin
- **Login Admin**: http://localhost:3000/admin/login

### Credenciais Padrão
- **Email**: admin@camara.gov.br
- **Senha**: admin123

## 📱 Funcionalidades Implementadas

### ✅ Portal Público
- Página inicial com estatísticas e notícias
- Sistema de navegação completo
- Páginas institucionais (Sobre, Código de Ética, etc.)
- Galeria de parlamentares e mesa diretora
- Sistema legislativo (sessões, proposições, comissões)
- Portal da transparência
- Sistema de notícias e publicações
- Design responsivo e acessível

### ✅ Painel Administrativo
- Dashboard com estatísticas
- Gerenciamento de parlamentares
- Controle de sessões legislativas
- Sistema de proposições e matérias
- Gerenciamento de comissões
- Editor de notícias
- Sistema de publicações (leis, decretos, portarias)
- Configurações do sistema

### ✅ Sistema de Autenticação
- Login seguro com NextAuth.js
- Controle de acesso por roles
- Proteção de rotas administrativas

### ✅ Banco de Dados
- Schema completo com Prisma
- Dados iniciais populados
- Relacionamentos entre entidades

## 🛠️ Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia o servidor de desenvolvimento
npm run build        # Gera build de produção
npm run start        # Inicia servidor de produção
npm run lint         # Executa linter

# Banco de dados
npm run db:generate  # Gera cliente Prisma
npm run db:push      # Executa migrações
npm run db:studio    # Abre Prisma Studio
npm run db:seed      # Popula banco com dados iniciais
```

## 📁 Estrutura do Projeto

```
src/
├── app/                    # App Router do Next.js
│   ├── admin/             # Painel administrativo
│   ├── api/               # API Routes
│   ├── institucional/     # Páginas institucionais
│   ├── legislativo/       # Sistema legislativo
│   ├── parlamentares/     # Páginas dos vereadores
│   ├── transparencia/     # Portal da transparência
│   └── noticias/          # Sistema de notícias
├── components/            # Componentes React
│   ├── admin/            # Componentes do painel admin
│   ├── home/             # Componentes da página inicial
│   ├── layout/           # Componentes de layout
│   └── ui/               # Componentes UI base
├── lib/                  # Utilitários e configurações
└── types/                # Definições de tipos TypeScript

prisma/
├── schema.prisma         # Schema do banco de dados
└── seed.ts              # Script de população inicial
```

## 🎨 Design System

O projeto utiliza:
- **Tailwind CSS** para estilização
- **Radix UI** para componentes acessíveis
- **Lucide React** para ícones
- **Cores institucionais** da Câmara

## 🔒 Segurança

- Autenticação com NextAuth.js
- Senhas criptografadas com bcrypt
- Validação de dados com Zod
- Proteção de rotas administrativas
- Sanitização de inputs

## 📊 Dados Iniciais

O sistema vem com dados iniciais incluindo:
- 1 usuário administrador
- 11 parlamentares (vereadores)
- 4 comissões permanentes
- 3 sessões de exemplo
- 3 notícias de exemplo
- Configurações básicas do sistema

## 🚀 Deploy

### Vercel (Recomendado)
```bash
# Instale a CLI da Vercel
npm i -g vercel

# Faça o deploy
vercel

# Configure as variáveis de ambiente na Vercel
```

### Docker
```bash
# Build da imagem
docker build -t sistema-legislativo .

# Execute o container
docker run -p 3000:3000 sistema-legislativo
```

## 🆘 Solução de Problemas

### Erro de conexão com banco
- Verifique se o PostgreSQL está rodando
- Confirme as credenciais no .env.local
- Teste a conexão: `psql -h localhost -U seu_usuario -d camara_legislativo_db`

### Erro de dependências
```bash
# Limpe o cache e reinstale
rm -rf node_modules package-lock.json
npm install
```

### Erro de build
```bash
# Gere o cliente Prisma
npm run db:generate

# Execute o build
npm run build
```

## 📞 Suporte

Para dúvidas ou problemas:
- 📧 Email: suporte@suacamara.gov.br

## 📄 Licença

Este projeto é de código aberto e está disponível sob a licença MIT.

---

**Desenvolvido com ❤️ para a transparência e democracia municipal**
