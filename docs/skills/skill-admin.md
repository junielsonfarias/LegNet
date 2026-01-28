# Skill: Painel Administrativo

## Visao Geral

O Painel Administrativo e o modulo central de configuracao e gestao do sistema. Permite gerenciar usuarios, roles, permissoes, configuracoes de quorum, tipos de proposicao, orgaos, auditoria e todas as configuracoes do processo legislativo.

---

## Arquivos Principais

| Arquivo | Funcao |
|---------|--------|
| `src/app/admin/` | Raiz do painel administrativo (43 modulos) |
| `src/app/admin/configuracoes/` | Configuracoes do sistema (9 submodulos) |
| `src/lib/auth/permissions.ts` | Sistema de permissoes |
| `src/app/api/configuracoes/` | APIs de configuracao |
| `src/app/api/auditoria/` | APIs de auditoria |
| `src/app/api/usuarios/` | APIs de usuarios |
| `src/middleware.ts` | Middleware de autenticacao |

---

## Modelos de Dados (Prisma)

### Model: User

```prisma
model User {
  id                  String              @id @default(cuid())
  name                String?
  email               String              @unique
  emailVerified       DateTime?
  password            String?
  image               String?
  role                UserRole            @default(USER)
  ativo               Boolean             @default(true)
  createdAt           DateTime            @default(now())
  updatedAt           DateTime            @updatedAt
  lastLogin           DateTime?

  parlamentar         Parlamentar?
  sessoes             Session[]
  accounts            Account[]
  logs                LogAuditoria[]
}
```

### Model: ConfiguracaoQuorum

```prisma
model ConfiguracaoQuorum {
  id                  String              @id @default(cuid())
  tipo                TipoQuorum          // MAIORIA_SIMPLES, MAIORIA_ABSOLUTA, etc.
  nome                String
  descricao           String?
  formula             String              // "PRESENTES/2+1", "MEMBROS/2+1", "MEMBROS*2/3"
  baseCalculo         BaseCalculo         // PRESENTES, MEMBROS
  percentual          Float?
  fracao              String?             // "2/3", "3/5"
  ativo               Boolean             @default(true)

  @@unique([tipo])
}
```

### Model: TipoProposicaoConfig

```prisma
model TipoProposicaoConfig {
  id                  String              @id @default(cuid())
  codigo              String              @unique // PL, PLC, PR, PD
  nome                String
  descricao           String?
  prefixo             String              // "PL", "PLC"
  quorumAprovacao     TipoQuorum          @default(MAIORIA_SIMPLES)
  turnos              Int                 @default(1)
  passagemCLJ         Boolean             @default(true)
  passagemCFO         Boolean             @default(false)
  ativo               Boolean             @default(true)

  proposicoes         Proposicao[]
}
```

### Model: OrgaoLegislativo

```prisma
model OrgaoLegislativo {
  id                  String              @id @default(cuid())
  nome                String
  sigla               String              @unique
  tipo                TipoOrgao           // PLENARIO, MESA, COMISSAO, SECRETARIA
  descricao           String?
  ativo               Boolean             @default(true)

  tramitacoesOrigem   Tramitacao[]        @relation("TramitacoesOrigem")
  tramitacoesDestino  Tramitacao[]        @relation("TramitacoesDestino")
}
```

### Model: LogAuditoria

```prisma
model LogAuditoria {
  id                  String              @id @default(cuid())
  acao                String              // CREATE, UPDATE, DELETE, LOGIN, etc.
  entidade            String              // User, Proposicao, Sessao, etc.
  entidadeId          String?
  dadosAnteriores     Json?
  dadosNovos          Json?
  ip                  String?
  userAgent           String?
  dataHora            DateTime            @default(now())

  userId              String?
  user                User?               @relation(fields: [userId])

  @@index([entidade, entidadeId])
  @@index([userId])
  @@index([dataHora])
}
```

---

## Enums e Tipos

### UserRole

```typescript
enum UserRole {
  ADMIN           // Acesso total ao sistema
  EDITOR          // Edita conteudo legislativo
  USER            // Leitura basica
  PARLAMENTAR     // Area do parlamentar
  OPERADOR        // Opera painel eletronico
  SECRETARIA      // Administrativo limitado
}
```

### Permissoes por Role

```typescript
const PERMISSOES = {
  ADMIN: ['*'], // Todas as permissoes

  EDITOR: [
    'proposicoes:read', 'proposicoes:create', 'proposicoes:update',
    'sessoes:read', 'sessoes:create', 'sessoes:update',
    'tramitacoes:read', 'tramitacoes:create', 'tramitacoes:update',
    'emendas:read', 'emendas:create', 'emendas:update',
    'pareceres:read', 'pareceres:create', 'pareceres:update',
    'comissoes:read', 'comissoes:update',
    'pautas:read', 'pautas:create', 'pautas:update'
  ],

  SECRETARIA: [
    'proposicoes:read', 'proposicoes:create',
    'sessoes:read',
    'tramitacoes:read', 'tramitacoes:create',
    'pautas:read', 'pautas:create', 'pautas:update',
    'relatorios:read', 'relatorios:create'
  ],

  OPERADOR: [
    'sessoes:read', 'sessoes:operar',
    'votacoes:read', 'votacoes:create', 'votacoes:update',
    'presencas:read', 'presencas:create', 'presencas:update',
    'painel:operar'
  ],

  PARLAMENTAR: [
    'parlamentar:dashboard',
    'parlamentar:votar',
    'proposicoes:read',
    'emendas:create'
  ],

  USER: [
    'publico:read'
  ]
}
```

### TipoQuorum

```typescript
enum TipoQuorum {
  MAIORIA_SIMPLES     // > 50% dos presentes
  MAIORIA_ABSOLUTA    // > 50% dos membros
  DOIS_TERCOS         // 2/3 dos membros
  TRES_QUINTOS        // 3/5 dos membros
  UNANIMIDADE         // 100% dos presentes
  MAIORIA_PRESENTES   // Alias para simples
  MAIORIA_MEMBROS     // Alias para absoluta
}
```

### BaseCalculo

```typescript
enum BaseCalculo {
  PRESENTES           // Base = parlamentares presentes
  MEMBROS             // Base = total de membros da casa
}
```

---

## APIs e Endpoints

### Usuarios

| Rota | Metodo | Funcionalidade | Roles |
|------|--------|----------------|-------|
| `/api/usuarios` | GET | Listar usuarios | ADMIN |
| `/api/usuarios` | POST | Criar usuario | ADMIN |
| `/api/usuarios/[id]` | GET | Obter usuario | ADMIN |
| `/api/usuarios/[id]` | PUT | Atualizar usuario | ADMIN |
| `/api/usuarios/[id]` | DELETE | Desativar usuario | ADMIN |
| `/api/usuarios/[id]/role` | PUT | Alterar role | ADMIN |
| `/api/usuarios/[id]/vincular-parlamentar` | POST | Vincular parlamentar | ADMIN |

### Configuracoes

| Rota | Metodo | Funcionalidade | Roles |
|------|--------|----------------|-------|
| `/api/configuracoes/quorum` | GET | Listar quorums | ADMIN |
| `/api/configuracoes/quorum` | POST | Criar quorum | ADMIN |
| `/api/configuracoes/quorum/[id]` | PUT | Atualizar quorum | ADMIN |
| `/api/configuracoes/tipos-proposicao` | GET | Listar tipos | ADMIN |
| `/api/configuracoes/tipos-proposicao` | POST | Criar tipo | ADMIN |
| `/api/configuracoes/orgaos` | GET | Listar orgaos | ADMIN |
| `/api/configuracoes/orgaos` | POST | Criar orgao | ADMIN |
| `/api/configuracoes/nomenclaturas` | GET | Nomenclaturas sessao | ADMIN |
| `/api/configuracoes/nomenclaturas` | PUT | Atualizar nomenclaturas | ADMIN |

### Auditoria

| Rota | Metodo | Funcionalidade | Roles |
|------|--------|----------------|-------|
| `/api/auditoria` | GET | Listar logs | ADMIN |
| `/api/auditoria/[id]` | GET | Detalhes do log | ADMIN |
| `/api/auditoria/entidade/[tipo]/[id]` | GET | Logs de entidade | ADMIN |
| `/api/auditoria/usuario/[id]` | GET | Logs de usuario | ADMIN |
| `/api/auditoria/exportar` | GET | Exportar logs | ADMIN |

---

## Estrutura de Modulos Admin

```
src/app/admin/
├── page.tsx                    # Dashboard admin
├── layout.tsx                  # Layout com sidebar
├── usuarios/                   # Gestao de usuarios
│   ├── page.tsx
│   ├── [id]/page.tsx
│   └── novo/page.tsx
├── configuracoes/              # Configuracoes do sistema
│   ├── quorum/                 # Tipos de quorum
│   ├── tipos-proposicao/       # Tipos de proposicao
│   ├── orgaos/                 # Orgaos legislativos
│   ├── nomenclaturas/          # Nomenclaturas de sessao
│   ├── prazos/                 # Prazos de tramitacao
│   ├── seguranca/              # Configuracoes de seguranca
│   ├── integracoes/            # APIs externas
│   ├── backup/                 # Backup e restauracao
│   └── sistema/                # Configuracoes gerais
├── auditoria/                  # Logs de auditoria
├── proposicoes/                # CRUD proposicoes
├── sessoes/                    # CRUD sessoes
├── comissoes/                  # CRUD comissoes
├── parlamentares/              # CRUD parlamentares
├── legislaturas/               # CRUD legislaturas
├── mandatos/                   # CRUD mandatos
├── tramitacoes/                # Acompanhamento tramitacao
├── emendas/                    # CRUD emendas
├── pareceres/                  # CRUD pareceres
├── pauta-sessoes/              # Composicao de pautas
├── mesa-diretora/              # Mesa diretora
├── leis/                       # Leis publicadas
├── atas/                       # Atas de sessao
├── relatorios/                 # Relatorios gerenciais
├── transparencia/              # Dashboard PNTP
└── analytics/                  # Estatisticas
```

---

## Regras de Negocio

### Principios Fundamentais

| Regra | Descricao |
|-------|-----------|
| **RN-001** | PUBLICIDADE - Todo ato legislativo DEVE ser publico |
| **RN-002** | LEGALIDADE - Respeitar Lei Organica e Regimento Interno |
| **RN-003** | RASTREABILIDADE - Todo ato com data, hora, usuario, IP |
| **RN-004** | INTEGRIDADE - Documentos oficiais NAO alterados apos publicacao |

### Seguranca

| Regra | Descricao |
|-------|-----------|
| **RN-140** | Autenticacao obrigatoria para areas restritas |
| **RN-141** | Senhas com minimo 8 caracteres, maiusculas, numeros |
| **RN-142** | Sessao expira em 8 horas de inatividade |
| **RN-143** | Bloqueio apos 5 tentativas de login falhas |
| **RN-144** | 2FA opcional para roles ADMIN e OPERADOR |

### Auditoria

| Regra | Descricao |
|-------|-----------|
| **RN-145** | Todo CREATE, UPDATE, DELETE registrado em log |
| **RN-146** | Logs NAO podem ser excluidos ou alterados |
| **RN-147** | Logs contem usuario, IP, data/hora, dados antes/depois |
| **RN-148** | Retencao de logs: minimo 5 anos |

### Permissoes

| Regra | Descricao |
|-------|-----------|
| **RN-149** | ADMIN tem acesso total ao sistema |
| **RN-150** | Cada role tem permissoes especificas definidas |
| **RN-151** | Permissoes granulares: entidade:acao (proposicoes:create) |
| **RN-152** | Usuario so acessa funcoes de sua role |

---

## Fluxos Principais

### Fluxo de Autenticacao

```
    USUARIO ACESSA
    AREA RESTRITA
          |
          v
    +-------------------+
    | MIDDLEWARE        |
    | VERIFICA SESSAO   |
    +-------------------+
          |
          +--------+--------+
          |                 |
          v                 v
      LOGADO           NAO LOGADO
          |                 |
          v                 v
    +----------+        +----------+
    | VERIFICAR|        | REDIRECIONAR|
    | ROLE     |        | LOGIN    |
    +----------+        +----------+
          |                 |
          v                 v
    +----------+        LOGIN PAGE
    | VERIFICAR|            |
    | PERMISSAO|            v
    +----------+        +----------+
          |             | VALIDAR  |
          +--------+    | CREDENCIAIS|
          |        |    +----------+
          v        v          |
      PERMITIDO  NEGADO       +--------+--------+
          |        |          |                 |
          v        v          v                 v
      ACESSO    403       SUCESSO            FALHA
      LIBERADO  FORBIDDEN     |                 |
                              v                 v
                          CRIAR            INCREMENTAR
                          SESSAO           TENTATIVAS
                              |                 |
                              v                 v
                          REDIRECIONAR     BLOQUEAR?
                          DESTINO              |
                                               v
                                          5 TENTATIVAS
                                          = BLOQUEIO
```

### Fluxo de Auditoria

```
    ACAO NO SISTEMA
    (CREATE/UPDATE/DELETE)
          |
          v
    +-------------------+
    | INTERCEPTAR       |
    | OPERACAO          |
    +-------------------+
          |
          v
    +-------------------+
    | CAPTURAR          |
    | CONTEXTO          |
    | - Usuario         |
    | - IP              |
    | - User-Agent      |
    | - Timestamp       |
    +-------------------+
          |
          v
    +-------------------+
    | CAPTURAR          |
    | DADOS             |
    | - Dados anteriores|
    | - Dados novos     |
    +-------------------+
          |
          v
    +-------------------+
    | REGISTRAR         |
    | LOG AUDITORIA     |
    +-------------------+
          |
          v
    +-------------------+
    | EXECUTAR          |
    | OPERACAO ORIGINAL |
    +-------------------+
          |
          v
    +-------------------+
    | RETORNAR          |
    | RESULTADO         |
    +-------------------+
```

### Fluxo de Gestao de Usuario

```
    ADMIN CRIA USUARIO
          |
          v
    +-------------------+
    | VALIDAR           |
    | DADOS             |
    | - Email unico     |
    | - Senha forte     |
    +-------------------+
          |
          v
    +-------------------+
    | DEFINIR           |
    | ROLE              |
    +-------------------+
          |
          v
    +-------------------+
    | VINCULAR          |
    | PARLAMENTAR?      |
    | (se PARLAMENTAR)  |
    +-------------------+
          |
          v
    +-------------------+
    | CRIAR             |
    | USUARIO           |
    +-------------------+
          |
          v
    +-------------------+
    | ENVIAR            |
    | EMAIL BOAS-VINDAS |
    +-------------------+
          |
          v
    +-------------------+
    | REGISTRAR         |
    | AUDITORIA         |
    +-------------------+
```

### Fluxo de Configuracao de Quorum

```
    ADMIN CONFIGURA QUORUM
          |
          v
    +-------------------+
    | DEFINIR TIPO      |
    | - MAIORIA_SIMPLES |
    | - MAIORIA_ABSOLUTA|
    | - DOIS_TERCOS     |
    | - TRES_QUINTOS    |
    +-------------------+
          |
          v
    +-------------------+
    | DEFINIR BASE      |
    | - PRESENTES       |
    | - MEMBROS         |
    +-------------------+
          |
          v
    +-------------------+
    | DEFINIR FORMULA   |
    | Ex: MEMBROS*2/3   |
    +-------------------+
          |
          v
    +-------------------+
    | VINCULAR A        |
    | TIPO PROPOSICAO   |
    +-------------------+
          |
          v
    +-------------------+
    | SALVAR            |
    | CONFIGURACAO      |
    +-------------------+
          |
          v
    +-------------------+
    | SISTEMA USA       |
    | EM VOTACOES       |
    +-------------------+
```

---

## Componentes React

### Dashboard Admin

| Componente | Arquivo | Funcao |
|------------|---------|--------|
| AdminDashboard | `src/app/admin/page.tsx` | Dashboard principal |
| StatsCards | `src/components/admin/stats-cards.tsx` | Cards de estatisticas |
| RecentActivity | `src/components/admin/recent-activity.tsx` | Atividades recentes |
| QuickActions | `src/components/admin/quick-actions.tsx` | Acoes rapidas |

### Usuarios

| Componente | Arquivo | Funcao |
|------------|---------|--------|
| UsuariosList | `src/app/admin/usuarios/page.tsx` | Lista usuarios |
| UsuarioForm | `src/app/admin/usuarios/novo/page.tsx` | Criar/editar |
| RoleSelect | `src/components/admin/role-select.tsx` | Seletor de role |
| VincularParlamentar | `src/components/admin/vincular-parlamentar.tsx` | Vinculo |

### Configuracoes

| Componente | Arquivo | Funcao |
|------------|---------|--------|
| QuorumConfig | `src/app/admin/configuracoes/quorum/page.tsx` | Config quorum |
| TiposProposicao | `src/app/admin/configuracoes/tipos-proposicao/page.tsx` | Tipos |
| OrgaosConfig | `src/app/admin/configuracoes/orgaos/page.tsx` | Orgaos |
| NomenclaturasConfig | `src/app/admin/configuracoes/nomenclaturas/page.tsx` | Nomenclaturas |

### Auditoria

| Componente | Arquivo | Funcao |
|------------|---------|--------|
| AuditoriaList | `src/app/admin/auditoria/page.tsx` | Lista logs |
| AuditoriaDetail | `src/app/admin/auditoria/[id]/page.tsx` | Detalhes log |
| AuditoriaFilters | `src/components/admin/auditoria-filters.tsx` | Filtros |
| DiffViewer | `src/components/admin/diff-viewer.tsx` | Comparar dados |

---

## Exemplos de Uso

### Exemplo 1: Verificar Permissao

```typescript
// src/lib/auth/permissions.ts

import { UserRole } from '@prisma/client'

const PERMISSOES: Record<UserRole, string[]> = {
  ADMIN: ['*'],
  EDITOR: [
    'proposicoes:read', 'proposicoes:create', 'proposicoes:update',
    'sessoes:read', 'sessoes:create', 'sessoes:update',
    // ...
  ],
  // ...
}

export function temPermissao(
  role: UserRole,
  permissao: string
): boolean {
  const permissoes = PERMISSOES[role] || []

  // Admin tem todas as permissoes
  if (permissoes.includes('*')) return true

  // Verificar permissao especifica
  if (permissoes.includes(permissao)) return true

  // Verificar permissao com wildcard (ex: proposicoes:*)
  const [entidade] = permissao.split(':')
  if (permissoes.includes(`${entidade}:*`)) return true

  return false
}

// Uso em API
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
  }

  const role = (session.user as any).role as UserRole

  if (!temPermissao(role, 'proposicoes:read')) {
    return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })
  }

  // Continuar com a operacao...
}
```

### Exemplo 2: Registrar Log de Auditoria

```typescript
// src/lib/services/auditoria-service.ts

import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

interface LogInput {
  acao: string
  entidade: string
  entidadeId?: string
  dadosAnteriores?: any
  dadosNovos?: any
  userId?: string
}

export async function registrarLog(input: LogInput) {
  const headersList = headers()
  const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip')
  const userAgent = headersList.get('user-agent')

  await prisma.logAuditoria.create({
    data: {
      acao: input.acao,
      entidade: input.entidade,
      entidadeId: input.entidadeId,
      dadosAnteriores: input.dadosAnteriores,
      dadosNovos: input.dadosNovos,
      userId: input.userId,
      ip,
      userAgent,
      dataHora: new Date()
    }
  })
}

// Uso em operacao CRUD
export async function atualizarProposicao(
  id: string,
  dados: any,
  userId: string
) {
  // Buscar dados anteriores
  const anterior = await prisma.proposicao.findUnique({ where: { id } })

  // Atualizar
  const atualizado = await prisma.proposicao.update({
    where: { id },
    data: dados
  })

  // Registrar log
  await registrarLog({
    acao: 'UPDATE',
    entidade: 'Proposicao',
    entidadeId: id,
    dadosAnteriores: anterior,
    dadosNovos: atualizado,
    userId
  })

  return atualizado
}
```

### Exemplo 3: Configurar Tipo de Quorum

```typescript
// POST /api/configuracoes/quorum

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if ((session?.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const body = await request.json()

  const quorum = await prisma.configuracaoQuorum.create({
    data: {
      tipo: body.tipo,
      nome: body.nome,
      descricao: body.descricao,
      formula: body.formula,
      baseCalculo: body.baseCalculo,
      percentual: body.percentual,
      fracao: body.fracao,
      ativo: true
    }
  })

  // Registrar auditoria
  await registrarLog({
    acao: 'CREATE',
    entidade: 'ConfiguracaoQuorum',
    entidadeId: quorum.id,
    dadosNovos: quorum,
    userId: session?.user?.id
  })

  return NextResponse.json({ success: true, data: quorum })
}

// Exemplo de configuracoes de quorum
const exemplosQuorum = [
  {
    tipo: 'MAIORIA_SIMPLES',
    nome: 'Maioria Simples',
    descricao: 'Mais da metade dos parlamentares presentes',
    formula: 'PRESENTES/2+1',
    baseCalculo: 'PRESENTES'
  },
  {
    tipo: 'MAIORIA_ABSOLUTA',
    nome: 'Maioria Absoluta',
    descricao: 'Mais da metade dos membros da Casa',
    formula: 'MEMBROS/2+1',
    baseCalculo: 'MEMBROS'
  },
  {
    tipo: 'DOIS_TERCOS',
    nome: 'Dois Tercos',
    descricao: 'Dois tercos dos membros da Casa',
    formula: 'MEMBROS*2/3',
    baseCalculo: 'MEMBROS',
    fracao: '2/3'
  },
  {
    tipo: 'TRES_QUINTOS',
    nome: 'Tres Quintos',
    descricao: 'Tres quintos dos membros da Casa',
    formula: 'MEMBROS*3/5',
    baseCalculo: 'MEMBROS',
    fracao: '3/5'
  }
]
```

### Exemplo 4: Gestao de Usuario

```typescript
// POST /api/usuarios

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if ((session?.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const body = await request.json()

  // Validar email unico
  const existente = await prisma.user.findUnique({
    where: { email: body.email }
  })

  if (existente) {
    return NextResponse.json({
      error: 'Email ja cadastrado'
    }, { status: 400 })
  }

  // Validar senha forte
  if (!validarSenhaForte(body.password)) {
    return NextResponse.json({
      error: 'Senha deve ter minimo 8 caracteres, maiusculas e numeros'
    }, { status: 400 })
  }

  // Hash da senha
  const hashedPassword = await bcrypt.hash(body.password, 12)

  // Criar usuario
  const usuario = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      password: hashedPassword,
      role: body.role,
      ativo: true
    }
  })

  // Se for PARLAMENTAR, vincular
  if (body.role === 'PARLAMENTAR' && body.parlamentarId) {
    await prisma.parlamentar.update({
      where: { id: body.parlamentarId },
      data: { userId: usuario.id }
    })
  }

  // Registrar auditoria
  await registrarLog({
    acao: 'CREATE',
    entidade: 'User',
    entidadeId: usuario.id,
    dadosNovos: { ...usuario, password: '[REDACTED]' },
    userId: session?.user?.id
  })

  return NextResponse.json({
    success: true,
    data: { ...usuario, password: undefined }
  })
}

function validarSenhaForte(senha: string): boolean {
  if (senha.length < 8) return false
  if (!/[A-Z]/.test(senha)) return false
  if (!/[0-9]/.test(senha)) return false
  return true
}
```

### Exemplo 5: Dashboard de Auditoria

```typescript
// GET /api/auditoria

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if ((session?.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const entidade = searchParams.get('entidade')
  const acao = searchParams.get('acao')
  const userId = searchParams.get('userId')
  const dataInicio = searchParams.get('dataInicio')
  const dataFim = searchParams.get('dataFim')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')

  const where: any = {}

  if (entidade) where.entidade = entidade
  if (acao) where.acao = acao
  if (userId) where.userId = userId
  if (dataInicio || dataFim) {
    where.dataHora = {}
    if (dataInicio) where.dataHora.gte = new Date(dataInicio)
    if (dataFim) where.dataHora.lte = new Date(dataFim)
  }

  const [logs, total] = await Promise.all([
    prisma.logAuditoria.findMany({
      where,
      include: {
        user: {
          select: { name: true, email: true }
        }
      },
      orderBy: { dataHora: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.logAuditoria.count({ where })
  ])

  return NextResponse.json({
    success: true,
    data: {
      logs,
      paginacao: {
        pagina: page,
        limite: limit,
        total,
        totalPaginas: Math.ceil(total / limit)
      }
    }
  })
}
```

---

## Checklist de Implementacao

### Usuarios

- [x] CRUD de usuarios
- [x] Sistema de roles
- [x] Vinculo com parlamentar
- [x] Bloqueio por tentativas
- [x] Recuperacao de senha

### Permissoes

- [x] Definicao por role
- [x] Verificacao granular
- [x] Middleware de protecao
- [x] Documentacao de permissoes

### Configuracoes

- [x] Tipos de quorum
- [x] Tipos de proposicao
- [x] Orgaos legislativos
- [x] Nomenclaturas de sessao
- [x] Prazos de tramitacao

### Auditoria

- [x] Log automatico de operacoes
- [x] Captura de contexto (IP, User-Agent)
- [x] Visualizacao de historico
- [x] Comparacao de versoes
- [x] Exportacao de logs

### Seguranca

- [x] Hash de senhas (bcrypt)
- [x] Sessoes com expiracao
- [x] Bloqueio por tentativas
- [x] Headers de seguranca
- [ ] 2FA (opcional)

---

## Integracao com Outros Modulos

### skill-legislativo.md
- Tipos de proposicao configurados
- Quorums por tipo de materia

### skill-operador.md
- Permissoes de operador
- Configuracoes de sessao

### skill-parlamentar.md
- Vinculo usuario-parlamentar
- Permissoes de parlamentar

### skill-transparencia.md
- Dashboard de conformidade
- Logs de acesso publico

### skill-secretaria.md
- Permissoes de secretaria
- Configuracoes de tramitacao
