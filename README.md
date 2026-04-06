# Sistema Legislativo Municipal - Portal Institucional

Sistema completo de portal institucional e painel administrativo para Câmaras Municipais, desenvolvido para transparência pública e gestão legislativa.

## 🏛️ Sobre o Projeto

Sistema multi-tenant de portal legislativo municipal, incluindo:

- **Portal Institucional**: Site público com informações sobre a Câmara, vereadores, sessões, transparência
- **Painel Administrativo**: Sistema completo de gerenciamento de conteúdo
- **Sistema de Autenticação**: Controle de acesso para administradores
- **Banco de Dados**: Estrutura completa com Prisma e PostgreSQL

## 🚀 Tecnologias Utilizadas

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Backend**: Next.js API Routes, Prisma ORM
- **Banco de Dados**: PostgreSQL
- **Autenticação**: NextAuth.js
- **Validação**: Zod
- **Formulários**: React Hook Form

## 📋 Funcionalidades

### Portal Público
- ✅ Página inicial com estatísticas e notícias
- ✅ Sistema de navegação completo
- ✅ Páginas institucionais (Sobre, Código de Ética, etc.)
- ✅ Galeria de parlamentares e mesa diretora
- ✅ Consulta pública de tramitações com filtros avançados
- ✅ Portal de participação cidadã (sugestões, consultas, petições)
- ✅ Sistema legislativo (sessões, proposições, comissões)
- ✅ Portal da transparência
- ✅ Sistema de notícias e publicações
- ✅ Design responsivo e acessível

### Painel Administrativo
- ✅ Dashboard com estatísticas
- ✅ Gerenciamento de parlamentares
- ✅ Controle de sessões legislativas
- ✅ Sistema de proposições e matérias
- ✅ Gerenciamento de comissões
- ✅ Editor de notícias
- ✅ Sistema de publicações (leis, decretos, portarias)
- ✅ Configurações do sistema

## 🛠️ Instalação e Configuração

### Pré-requisitos
- Node.js 18+ 
- PostgreSQL 14+
- npm ou yarn

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

# Configure a variável de ambiente
cp env.example .env.local
```

Edite o arquivo `.env.local` com suas configurações:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/camara_legislativo_db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="sua-chave-secreta-aqui"
```

### 4. Configure o banco de dados
```bash
# Gere o cliente Prisma
npm run db:generate

# Execute as migrações
npm run db:push

# Popule o banco com dados iniciais
npm run db:seed
```

### 5. Execute o projeto
```bash
npm run dev
```

O sistema estará disponível em:
- **Portal Público**: http://localhost:3000
- **Painel Admin**: http://localhost:3000/admin
- **Login Admin**: http://localhost:3000/admin/login

### Credenciais Padrão
- **Email**: admin@camara.gov.br
- **Senha**: admin123

## 📁 Estrutura do Projeto

```
src/
├── app/                    # App Router do Next.js
│   ├── admin/             # Painel administrativo
│   ├── api/               # API Routes
│   ├── globals.css        # Estilos globais
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Página inicial
├── components/            # Componentes React
│   ├── admin/            # Componentes do painel admin
│   ├── home/             # Componentes da página inicial
│   ├── layout/           # Componentes de layout
│   └── ui/               # Componentes UI base
├── lib/                  # Utilitários e configurações
│   ├── auth.ts           # Configuração NextAuth
│   ├── prisma.ts         # Cliente Prisma
│   └── utils.ts          # Funções utilitárias
└── types/                # Definições de tipos TypeScript

prisma/
├── schema.prisma         # Schema do banco de dados
└── seed.ts              # Script de população inicial
```

## 🗄️ Estrutura do Banco de Dados

O sistema utiliza as seguintes entidades principais:

- **Users**: Usuários do sistema (admin, editores)
- **Parlamentares**: Vereadores e membros da mesa diretora
- **Sessoes**: Sessões legislativas
- **Proposicoes**: Projetos de lei, decretos, etc.
- **Comissoes**: Comissões permanentes e temporárias
- **Noticias**: Notícias e informes
- **Publicacoes**: Leis, decretos, portarias
- **Configuracoes**: Configurações do sistema

## 📚 Documentação Complementar

- [`docs/arquitetura-atual.md`](docs/arquitetura-atual.md): visão atualizada de frontend, APIs, fluxos legislativos e uso do mock DB.
- [`docs/ambiente-e-pipeline.md`](docs/ambiente-e-pipeline.md): diretrizes de ambientes (dev/staging/prod), variáveis de ambiente, integrações externas e pipeline CI.
- [`docs/cronograma-producao.md`](docs/cronograma-producao.md): plano de execução em fases para alinhar o sistema às práticas do SAPL.

## 🧭 Fluxo de Tramitação

- **Builder de Regras**: cadastre etapas, notificações e prazos no admin em `Admin → Tramitações → Regras`.
- **Ações na Proposição**: abra uma proposição e use os botões `Avançar`, `Finalizar` ou `Reabrir` para controlar o processo; os campos de comentário e resultado alimentam os históricos automaticamente.
- **Fallback Offline**: caso a API retorne `401`, o client usa os mocks centralizados (`src/lib/tramitacao-service.ts`) preservando histórico, prazos e notificações.
- **Métricas e Dashboard**: acompanhe KPIs em `Admin → Tramitações → Dashboard`, com resumos por unidade, tipo e prazos críticos.
- **Testes Automatizados**: execute `npm run test -- --runInBand` para validar motor de regras, histórico e notificações; os cenários vivem em `src/tests/tramitacao/tramitacao-service.test.ts`.

## 🗳️ Participação Cidadã

- **Portal Público**: acesse `/participacao` para visualizar sugestões em destaque, consultas públicas e petições ativas.
- **Interação em Tempo Real**: votos e assinaturas utilizam `/api/participacao-cidada` com fallback mock via `publicParticipacaoApi`.
- **Engajamento**: botões de ação (`Apoiar`, `Votar`, `Assinar`) atualizam os dados e exibem feedback com `sonner`.
- **Relatórios**: métricas consolidadas e links rápidos para transparência (`/transparencia/pesquisas`).
- **Testes**: `npm run test -- --runInBand` inclui verificações para os fallbacks em `src/tests/participacao/public-participacao-api.test.ts`.

## 🎨 Design System

O projeto utiliza um design system consistente baseado em:

- **Cores**: Paleta institucional da Câmara (azul, vermelho, verde, dourado)
- **Tipografia**: Inter (Google Fonts)
- **Componentes**: Radix UI + Tailwind CSS
- **Responsividade**: Mobile-first approach
- **Acessibilidade**: WCAG 2.1 AA compliance

## 📱 Responsividade

O sistema é totalmente responsivo e otimizado para:
- 📱 Mobile (320px+)
- 📱 Tablet (768px+)
- 💻 Desktop (1024px+)
- 🖥️ Large screens (1440px+)

## 🔒 Segurança

- Autenticação com NextAuth.js
- Senhas criptografadas com bcrypt
- Validação de dados com Zod
- Proteção de rotas administrativas
- Sanitização de inputs

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

## 📊 Monitoramento

O sistema inclui:
- Logs estruturados
- Métricas de performance
- Monitoramento de erros
- Analytics de uso

## 🤝 Contribuição

Este projeto foi desenvolvido para fins educacionais. Para contribuir:

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto é de código aberto e está disponível sob a licença MIT.

## 📞 Suporte

Para dúvidas ou suporte:
- 📧 Email: suporte@suacamara.gov.br

## 🙏 Agradecimentos

- Comunidade Next.js
- Equipe do Prisma
- Desenvolvedores do Radix UI

---

**Desenvolvido com ❤️ para a transparência e democracia municipal**
