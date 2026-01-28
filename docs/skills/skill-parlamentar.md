# Skill: Area do Parlamentar

## Visao Geral

A Area do Parlamentar e o modulo dedicado aos vereadores, onde podem acessar seu dashboard pessoal, participar de votacoes eletronicas, acompanhar sua producao legislativa e visualizar estatisticas de presenca e participacao. O acesso e controlado conforme o estado da sessao.

---

## Arquivos Principais

| Arquivo | Funcao |
|---------|--------|
| `src/app/parlamentar/page.tsx` | Dashboard do parlamentar |
| `src/app/parlamentar/votacao/[id]/page.tsx` | Tela de votacao |
| `src/app/parlamentar/aguardando/page.tsx` | Aguardando presenca |
| `src/app/parlamentar/layout.tsx` | Layout da area |
| `src/app/parlamentares/page.tsx` | Lista publica |
| `src/app/parlamentares/[id]/page.tsx` | Perfil publico |
| `src/lib/hooks/use-parlamentar-dashboard.ts` | Hook do dashboard |
| `src/app/api/parlamentar/` | APIs do parlamentar |
| `src/app/api/parlamentares/` | APIs publicas |

---

## Modelos de Dados (Prisma)

### Model: Parlamentar

```prisma
model Parlamentar {
  id                  String              @id @default(cuid())
  nome                String
  apelido             String?
  cpf                 String?             @unique
  email               String?
  telefone            String?
  foto                String?
  biografia           String?             @db.Text
  partido             String?
  cargo               String              @default("Vereador")
  ativo               Boolean             @default(true)
  dataNascimento      DateTime?
  naturalidade        String?

  // Relacionamentos
  userId              String?             @unique
  user                User?               @relation(fields: [userId])

  mandatos            Mandato[]
  proposicoes         Proposicao[]        @relation("ProposicoesAutoria")
  emendas             Emenda[]
  pareceres           Parecer[]
  votos               Voto[]
  presencas           PresencaSessao[]
  membrosComissao     MembroComissao[]
  membrosMesa         MembroMesaDiretora[]
}
```

### Model: Mandato

```prisma
model Mandato {
  id                  String              @id @default(cuid())
  dataInicio          DateTime
  dataFim             DateTime?
  ativo               Boolean             @default(true)
  tipo                TipoMandato         @default(TITULAR)
  motivoFim           String?

  parlamentarId       String
  parlamentar         Parlamentar         @relation(fields: [parlamentarId])
  legislaturaId       String
  legislatura         Legislatura         @relation(fields: [legislaturaId])

  @@unique([parlamentarId, legislaturaId])
}
```

### Model: Filiacao (Historico Partidario)

```prisma
model FiliacaoPartidaria {
  id                  String              @id @default(cuid())
  partido             String
  sigla               String
  dataInicio          DateTime
  dataFim             DateTime?
  atual               Boolean             @default(true)

  parlamentarId       String
  parlamentar         Parlamentar         @relation(fields: [parlamentarId])
}
```

---

## Enums e Tipos

### TipoMandato

```typescript
enum TipoMandato {
  TITULAR           // Eleito como titular
  SUPLENTE          // Eleito como suplente
  SUBSTITUICAO      // Substituindo titular temporariamente
}
```

### StatusAcesso

```typescript
interface StatusAcesso {
  sessaoEmAndamento: boolean    // Ha sessao ativa
  presencaConfirmada: boolean   // Presenca registrada
  sessaoId: string | null       // ID da sessao ativa
  podeAcessarVotacao: boolean   // Pode votar
  podeAcessarDashboard: boolean // Pode ver dashboard
  mensagem: string              // Mensagem de status
}
```

### DashboardParlamentar

```typescript
interface DashboardParlamentar {
  parlamentar: {
    id: string
    nome: string
    apelido: string
    partido: string
    cargo: string
    foto: string
    ativo: boolean
    legislatura: string
  }
  resumo: {
    presencaPercentual: number
    totalVotacoes: number
    comissoesAtivas: number
    totalMandatos: number
    mandatoAtual: Mandato | null
  }
  comissoes: {
    ativas: MembroComissao[]
    historico: MembroComissao[]
  }
  mesas: {
    ativas: MembroMesaDiretora[]
    historico: MembroMesaDiretora[]
  }
  votacoes: {
    recentes: Voto[]
    estatisticas: EstatisticaVotacao
  }
  presenca: {
    sessoes: PresencaSessao[]
    estatisticas: EstatisticaPresenca
  }
}
```

---

## APIs e Endpoints

### Area Restrita (Parlamentar Logado)

| Rota | Metodo | Funcionalidade | Roles |
|------|--------|----------------|-------|
| `/api/parlamentar/status` | GET | Status de acesso | PARLAMENTAR |
| `/api/parlamentar/dashboard` | GET | Dados do dashboard | PARLAMENTAR |
| `/api/parlamentar/votacao-ativa` | GET | Votacao em andamento | PARLAMENTAR |
| `/api/parlamentar/votar` | POST | Registrar voto | PARLAMENTAR |
| `/api/parlamentar/presenca` | GET | Historico presenca | PARLAMENTAR |
| `/api/parlamentar/proposicoes` | GET | Proposicoes de autoria | PARLAMENTAR |
| `/api/parlamentar/comissoes` | GET | Comissoes que participa | PARLAMENTAR |

### APIs Publicas

| Rota | Metodo | Funcionalidade | Auth |
|------|--------|----------------|------|
| `/api/parlamentares` | GET | Lista todos parlamentares | Nao |
| `/api/parlamentares/[id]` | GET | Perfil do parlamentar | Nao |
| `/api/parlamentares/[id]/proposicoes` | GET | Proposicoes de autoria | Nao |
| `/api/parlamentares/[id]/votacoes` | GET | Historico de votacoes | Nao |
| `/api/parlamentares/[id]/presenca` | GET | Estatisticas presenca | Nao |

---

## Servicos de Negocio

### use-parlamentar-dashboard.ts

```typescript
function useParlamentarDashboard(parlamentarId: string): {
  dashboard: DashboardParlamentar | null
  loading: boolean
  error: string | null
}

// Carrega dados do dashboard via SWR
// Inclui: resumo, comissoes, mesas, votacoes, presenca
```

### Verificacao de Acesso

```typescript
// Verificar status de acesso do parlamentar
async function verificarStatusAcesso(
  parlamentarId: string
): Promise<StatusAcesso> {
  // 1. Verificar se ha sessao em andamento
  const sessaoAtiva = await prisma.sessao.findFirst({
    where: { status: 'EM_ANDAMENTO' }
  })

  if (!sessaoAtiva) {
    return {
      sessaoEmAndamento: false,
      presencaConfirmada: false,
      sessaoId: null,
      podeAcessarVotacao: false,
      podeAcessarDashboard: true,
      mensagem: 'Nenhuma sessao em andamento'
    }
  }

  // 2. Verificar se tem presenca confirmada
  const presenca = await prisma.presencaSessao.findUnique({
    where: {
      sessaoId_parlamentarId: {
        sessaoId: sessaoAtiva.id,
        parlamentarId
      }
    }
  })

  const presencaConfirmada = presenca?.tipo === 'PRESENTE'

  return {
    sessaoEmAndamento: true,
    presencaConfirmada,
    sessaoId: sessaoAtiva.id,
    podeAcessarVotacao: presencaConfirmada,
    podeAcessarDashboard: !sessaoAtiva, // Dashboard bloqueado durante sessao
    mensagem: presencaConfirmada
      ? 'Presenca confirmada. Acesso a votacao liberado.'
      : 'Aguardando confirmacao de presenca pelo operador.'
  }
}
```

---

## Regras de Negocio

### Acesso e Autenticacao

| Regra | Descricao |
|-------|-----------|
| **RN-150** | Parlamentar DEVE ter usuario vinculado para acessar sistema |
| **RN-151** | Mandato DEVE estar ativo para participar de votacoes |
| **RN-152** | Presenca DEVE ser confirmada pelo operador antes de votar |
| **RN-153** | Voto so pode ser registrado durante votacao aberta |

### Restricoes Durante Sessao

| Regra | Descricao |
|-------|-----------|
| **RN-155** | Durante sessao, parlamentar e redirecionado para votacao |
| **RN-156** | Sem presenca confirmada, exibe tela de aguardo |
| **RN-157** | Dashboard bloqueado durante sessao em andamento |
| **RN-158** | Apenas votacao disponivel quando presenca confirmada |

### Producao Legislativa

| Regra | Descricao |
|-------|-----------|
| **RN-110** | Parlamentar pode ser autor de proposicoes |
| **RN-111** | Parlamentar pode apresentar emendas |
| **RN-112** | Parlamentar pode ser relator em comissao |
| **RN-113** | Estatisticas de producao sao publicas (PNTP) |

### Impedimentos

| Regra | Descricao |
|-------|-----------|
| **RN-063** | Parlamentar NAO pode votar em causa propria |
| **RN-114** | Parlamentar NAO pode votar em materia de parente |
| **RN-115** | Impedimento deve ser declarado antes da votacao |

---

## Fluxos Principais

### Fluxo de Acesso do Parlamentar

```
    PARLAMENTAR ACESSA
    /parlamentar
          |
          v
    +-------------------+
    | VERIFICAR         |
    | AUTENTICACAO      |
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
    | VINCULO  |        | LOGIN    |
    +----------+        +----------+
          |
          +--------+--------+
          |                 |
          v                 v
      VINCULADO         SEM VINCULO
          |                 |
          v                 v
    +----------+        +----------+
    | VERIFICAR|        | EXIBIR   |
    | STATUS   |        | ERRO     |
    +----------+        +----------+
          |
          v
    +-------------------+
    | SESSAO EM         |
    | ANDAMENTO?        |
    +-------------------+
          |
          +--------+--------+
          |                 |
          v                 v
        SIM               NAO
          |                 |
          v                 v
    +----------+        +----------+
    | PRESENCA |        | EXIBIR   |
    | CONFIRMADA?|      | DASHBOARD|
    +----------+        +----------+
          |
          +--------+--------+
          |                 |
          v                 v
        SIM               NAO
          |                 |
          v                 v
    +----------+        +----------+
    | REDIRECIONAR|     | REDIRECIONAR|
    | VOTACAO  |        | AGUARDANDO|
    +----------+        +----------+
```

### Fluxo de Votacao do Parlamentar

```
    PARLAMENTAR EM
    /parlamentar/votacao/[id]
          |
          v
    +-------------------+
    | VERIFICAR         |
    | VOTACAO ATIVA     |
    +-------------------+
          |
          +--------+--------+
          |                 |
          v                 v
      ATIVA             INATIVA
          |                 |
          v                 v
    +----------+        +----------+
    | VERIFICAR|        | AGUARDAR |
    | IMPEDIMENTO|      | PROXIMA  |
    +----------+        +----------+
          |
          +--------+--------+
          |                 |
          v                 v
      IMPEDIDO          LIBERADO
          |                 |
          v                 v
    +----------+        +----------+
    | EXIBIR   |        | EXIBIR   |
    | BLOQUEIO |        | OPCOES   |
    +----------+        +----------+
          |                 |
          v                 v
    NAO VOTA           SELECIONAR VOTO
                            |
                      +-----+-----+-----+
                      |     |     |     |
                      v     v     v     v
                     SIM   NAO  ABST  AUSENTE
                      |     |     |     |
                      +-----+-----+-----+
                            |
                            v
    +-------------------+
    | CONFIRMAR         |
    | VOTO              |
    +-------------------+
          |
          v
    +-------------------+
    | REGISTRAR         |
    | NO SISTEMA        |
    +-------------------+
          |
          v
    +-------------------+
    | EXIBIR            |
    | CONFIRMACAO       |
    +-------------------+
          |
          v
    +-------------------+
    | AGUARDAR          |
    | PROXIMA VOTACAO   |
    +-------------------+
```

### Fluxo de Verificacao de Presenca

```
    SESSAO INICIADA
          |
          v
    +-------------------+
    | PARLAMENTAR       |
    | CHEGA AO PLENARIO |
    +-------------------+
          |
          v
    +-------------------+
    | OPERADOR          |
    | REGISTRA PRESENCA |
    +-------------------+
          |
          v
    +-------------------+
    | SISTEMA ATUALIZA  |
    | STATUS PARLAMENTAR|
    +-------------------+
          |
          v
    +-------------------+
    | PARLAMENTAR       |
    | ACESSA /parlamentar|
    +-------------------+
          |
          v
    +-------------------+
    | VERIFICACAO       |
    | AUTOMATICA        |
    +-------------------+
          |
          +--------+--------+
          |                 |
          v                 v
      PRESENTE          AUSENTE
          |                 |
          v                 v
    +----------+        +----------+
    | REDIRECIONAR|     | TELA     |
    | VOTACAO  |        | AGUARDANDO|
    +----------+        +----------+
```

---

## Validacoes Obrigatorias

### Ao Acessar Area

- [ ] Usuario autenticado
- [ ] Usuario vinculado a parlamentar
- [ ] Mandato ativo

### Ao Votar

- [ ] Sessao em andamento
- [ ] Presenca confirmada
- [ ] Votacao aberta
- [ ] Nao votou ainda neste turno
- [ ] Nao impedido (RN-063)
- [ ] Mandato ativo

### Ao Exibir Dashboard

- [ ] Nenhuma sessao em andamento OU
- [ ] Usuario nao tem presenca confirmada (mostra aguardando)

---

## Componentes React

### Area Restrita

| Componente | Arquivo | Funcao |
|------------|---------|--------|
| DashboardParlamentar | `src/app/parlamentar/page.tsx` | Dashboard principal |
| VotacaoPage | `src/app/parlamentar/votacao/[id]/page.tsx` | Tela de votacao |
| AguardandoPage | `src/app/parlamentar/aguardando/page.tsx` | Aguardando presenca |
| ParlamentarLayout | `src/app/parlamentar/layout.tsx` | Layout com verificacoes |
| CardResumo | `src/components/parlamentar/card-resumo.tsx` | Cards de estatisticas |
| ListaComissoes | `src/components/parlamentar/lista-comissoes.tsx` | Comissoes ativas |
| HistoricoVotacoes | `src/components/parlamentar/historico-votacoes.tsx` | Votos recentes |
| BotaoVoto | `src/components/parlamentar/botao-voto.tsx` | Botao de votacao |

### Perfil Publico

| Componente | Arquivo | Funcao |
|------------|---------|--------|
| ListaParlamentares | `src/app/parlamentares/page.tsx` | Grid de parlamentares |
| PerfilParlamentar | `src/app/parlamentares/[id]/page.tsx` | Perfil completo |
| CardParlamentar | `src/components/parlamentares/card-parlamentar.tsx` | Card na lista |
| EstatisticasPresenca | `src/components/parlamentares/estatisticas-presenca.tsx` | Grafico presenca |
| ProducaoLegislativa | `src/components/parlamentares/producao-legislativa.tsx` | Lista proposicoes |

---

## Exemplos de Uso

### Exemplo 1: Verificar Status de Acesso

```typescript
// GET /api/parlamentar/status

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
  }

  const parlamentarId = (session.user as any).parlamentarId

  if (!parlamentarId) {
    return NextResponse.json({
      success: false,
      error: 'Usuario nao vinculado a parlamentar'
    }, { status: 403 })
  }

  // Verificar sessao ativa
  const sessaoAtiva = await prisma.sessao.findFirst({
    where: { status: 'EM_ANDAMENTO' }
  })

  if (!sessaoAtiva) {
    return NextResponse.json({
      success: true,
      data: {
        sessaoEmAndamento: false,
        presencaConfirmada: false,
        sessaoId: null,
        podeAcessarVotacao: false,
        podeAcessarDashboard: true,
        mensagem: 'Nenhuma sessao em andamento. Acesse seu dashboard.'
      }
    })
  }

  // Verificar presenca
  const presenca = await prisma.presencaSessao.findUnique({
    where: {
      sessaoId_parlamentarId: {
        sessaoId: sessaoAtiva.id,
        parlamentarId
      }
    }
  })

  const presencaConfirmada = presenca?.tipo === 'PRESENTE'

  return NextResponse.json({
    success: true,
    data: {
      sessaoEmAndamento: true,
      presencaConfirmada,
      sessaoId: sessaoAtiva.id,
      podeAcessarVotacao: presencaConfirmada,
      podeAcessarDashboard: false,
      mensagem: presencaConfirmada
        ? 'Sua presenca foi confirmada. Voce pode participar das votacoes.'
        : 'Aguarde a confirmacao de presenca pelo operador.'
    }
  })
}
```

### Exemplo 2: Carregar Dashboard

```typescript
// Hook: use-parlamentar-dashboard.ts

import useSWR from 'swr'

interface UseParlamentarDashboardReturn {
  dashboard: DashboardParlamentar | null
  loading: boolean
  error: string | null
}

export function useParlamentarDashboard(
  parlamentarId: string | undefined
): UseParlamentarDashboardReturn {
  const { data, error, isLoading } = useSWR(
    parlamentarId ? `/api/parlamentar/dashboard?id=${parlamentarId}` : null,
    fetcher,
    {
      refreshInterval: 30000, // Atualiza a cada 30s
      revalidateOnFocus: true
    }
  )

  return {
    dashboard: data?.data || null,
    loading: isLoading,
    error: error?.message || data?.error || null
  }
}

// API: /api/parlamentar/dashboard
export async function GET(request: NextRequest) {
  const parlamentarId = request.nextUrl.searchParams.get('id')

  const parlamentar = await prisma.parlamentar.findUnique({
    where: { id: parlamentarId! },
    include: {
      mandatos: {
        where: { ativo: true },
        include: { legislatura: true }
      },
      membrosComissao: {
        where: { ativo: true },
        include: { comissao: true }
      },
      membrosMesa: {
        where: { ativo: true },
        include: { mesaDiretora: { include: { legislatura: true } } }
      }
    }
  })

  // Calcular estatisticas
  const [presencas, votacoes, proposicoes] = await Promise.all([
    prisma.presencaSessao.findMany({
      where: { parlamentarId: parlamentarId! },
      include: { sessao: true }
    }),
    prisma.voto.findMany({
      where: { parlamentarId: parlamentarId! },
      include: { votacao: { include: { proposicao: true } } },
      orderBy: { dataHora: 'desc' },
      take: 10
    }),
    prisma.proposicao.count({
      where: { autorId: parlamentarId }
    })
  ])

  const totalSessoes = await prisma.sessao.count({
    where: { status: 'CONCLUIDA' }
  })

  const sessoesPresente = presencas.filter(p => p.tipo === 'PRESENTE').length
  const presencaPercentual = totalSessoes > 0
    ? (sessoesPresente / totalSessoes) * 100
    : 0

  return NextResponse.json({
    success: true,
    data: {
      parlamentar: {
        id: parlamentar!.id,
        nome: parlamentar!.nome,
        apelido: parlamentar!.apelido,
        partido: parlamentar!.partido,
        cargo: parlamentar!.cargo,
        foto: parlamentar!.foto,
        ativo: parlamentar!.ativo,
        legislatura: parlamentar!.mandatos[0]?.legislatura?.numero
      },
      resumo: {
        presencaPercentual,
        totalVotacoes: votacoes.length,
        comissoesAtivas: parlamentar!.membrosComissao.length,
        totalMandatos: parlamentar!.mandatos.length,
        mandatoAtual: parlamentar!.mandatos[0] || null
      },
      comissoes: {
        ativas: parlamentar!.membrosComissao
      },
      mesas: {
        ativas: parlamentar!.membrosMesa
      },
      votacoes: {
        recentes: votacoes
      },
      presenca: {
        sessoes: presencas.slice(0, 10)
      }
    }
  })
}
```

### Exemplo 3: Registrar Voto

```typescript
// POST /api/parlamentar/votar

import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { VotacaoService } from '@/lib/services/votacao-service'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  const parlamentarId = (session?.user as any)?.parlamentarId

  if (!parlamentarId) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  const { votacaoId, valor } = await request.json()

  // 1. Verificar votacao ativa
  const votacao = await prisma.votacao.findUnique({
    where: { id: votacaoId },
    include: { proposicao: true }
  })

  if (!votacao || votacao.status !== 'EM_ANDAMENTO') {
    return NextResponse.json({
      success: false,
      error: 'Votacao nao esta aberta'
    }, { status: 400 })
  }

  // 2. Verificar impedimento (RN-063)
  if (votacao.proposicaoId) {
    const impedimento = await VotacaoService.verificarImpedimentoVoto(
      parlamentarId,
      votacao.proposicaoId
    )

    if (impedimento.impedido) {
      return NextResponse.json({
        success: false,
        error: `Voto impedido: ${impedimento.motivo}`
      }, { status: 403 })
    }
  }

  // 3. Verificar se ja votou
  const votoExistente = await prisma.voto.findUnique({
    where: {
      votacaoId_parlamentarId_turno: {
        votacaoId,
        parlamentarId,
        turno: votacao.turno
      }
    }
  })

  if (votoExistente) {
    return NextResponse.json({
      success: false,
      error: 'Voce ja votou nesta votacao'
    }, { status: 400 })
  }

  // 4. Registrar voto
  const voto = await prisma.voto.create({
    data: {
      votacaoId,
      parlamentarId,
      valor, // 'SIM', 'NAO', 'ABSTENCAO'
      turno: votacao.turno,
      dataHora: new Date()
    }
  })

  // 5. Atualizar contagem na votacao
  const updateField = valor === 'SIM' ? 'votosSim'
    : valor === 'NAO' ? 'votosNao'
    : 'abstencoes'

  await prisma.votacao.update({
    where: { id: votacaoId },
    data: {
      [updateField]: { increment: 1 }
    }
  })

  return NextResponse.json({
    success: true,
    data: {
      votoId: voto.id,
      valor: voto.valor,
      mensagem: 'Voto registrado com sucesso'
    }
  })
}
```

### Exemplo 4: Tela de Votacao

```typescript
// src/app/parlamentar/votacao/[id]/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function VotacaoPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { data: session } = useSession()
  const [votacao, setVotacao] = useState<VotacaoAtiva | null>(null)
  const [votoRegistrado, setVotoRegistrado] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Polling para atualizar estado da votacao
    const interval = setInterval(async () => {
      const res = await fetch(`/api/parlamentar/votacao-ativa?sessaoId=${params.id}`)
      const data = await res.json()

      if (data.success && data.data.votacao) {
        setVotacao(data.data.votacao)
        setVotoRegistrado(data.data.jaVotou)
      } else {
        setVotacao(null)
      }
      setLoading(false)
    }, 2000)

    return () => clearInterval(interval)
  }, [params.id])

  const handleVotar = async (valor: 'SIM' | 'NAO' | 'ABSTENCAO') => {
    if (!votacao) return

    const res = await fetch('/api/parlamentar/votar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        votacaoId: votacao.id,
        valor
      })
    })

    const data = await res.json()

    if (data.success) {
      setVotoRegistrado(true)
    } else {
      alert(data.error)
    }
  }

  if (loading) {
    return <div>Carregando...</div>
  }

  if (!votacao) {
    return (
      <div className="text-center py-12">
        <h2>Aguardando proxima votacao...</h2>
        <p>Voce sera notificado quando uma votacao iniciar.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4">
          {votacao.proposicao?.tipo} {votacao.proposicao?.numero}/{votacao.proposicao?.ano}
        </h1>

        <p className="text-gray-600 mb-6">
          {votacao.proposicao?.ementa}
        </p>

        <div className="mb-6 p-4 bg-blue-50 rounded">
          <p><strong>Turno:</strong> {votacao.turno}o Turno</p>
          <p><strong>Tipo:</strong> {votacao.tipo}</p>
          <p><strong>Quorum:</strong> {votacao.quorum.tipo}</p>
        </div>

        {votoRegistrado ? (
          <div className="text-center p-6 bg-green-50 rounded">
            <p className="text-green-700 font-semibold">
              Seu voto foi registrado com sucesso!
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Aguarde o encerramento da votacao.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => handleVotar('SIM')}
              className="p-6 bg-green-500 text-white rounded-lg text-xl font-bold hover:bg-green-600"
            >
              SIM
            </button>
            <button
              onClick={() => handleVotar('NAO')}
              className="p-6 bg-red-500 text-white rounded-lg text-xl font-bold hover:bg-red-600"
            >
              NAO
            </button>
            <button
              onClick={() => handleVotar('ABSTENCAO')}
              className="p-6 bg-gray-500 text-white rounded-lg text-xl font-bold hover:bg-gray-600"
            >
              ABSTENCAO
            </button>
          </div>
        )}

        {/* Placar atual */}
        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-green-100 rounded">
            <p className="text-3xl font-bold text-green-700">{votacao.votos.sim}</p>
            <p className="text-sm">SIM</p>
          </div>
          <div className="p-4 bg-red-100 rounded">
            <p className="text-3xl font-bold text-red-700">{votacao.votos.nao}</p>
            <p className="text-sm">NAO</p>
          </div>
          <div className="p-4 bg-gray-100 rounded">
            <p className="text-3xl font-bold text-gray-700">{votacao.votos.abstencao}</p>
            <p className="text-sm">ABSTENCAO</p>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### Exemplo 5: Perfil Publico

```typescript
// src/app/parlamentares/[id]/page.tsx

import { prisma } from '@/lib/prisma'

export default async function PerfilParlamentarPage({
  params
}: {
  params: { id: string }
}) {
  const parlamentar = await prisma.parlamentar.findUnique({
    where: { id: params.id },
    include: {
      mandatos: {
        include: { legislatura: true },
        orderBy: { dataInicio: 'desc' }
      },
      proposicoes: {
        orderBy: { dataApresentacao: 'desc' },
        take: 10,
        select: {
          id: true,
          tipo: true,
          numero: true,
          ano: true,
          ementa: true,
          status: true
        }
      },
      membrosComissao: {
        where: { ativo: true },
        include: { comissao: true }
      },
      presencas: {
        include: { sessao: true },
        orderBy: { sessao: { dataHora: 'desc' } },
        take: 20
      }
    }
  })

  if (!parlamentar) {
    return <div>Parlamentar nao encontrado</div>
  }

  // Calcular estatisticas
  const totalSessoes = await prisma.sessao.count({
    where: { status: 'CONCLUIDA' }
  })
  const sessoesPresente = parlamentar.presencas.filter(p => p.tipo === 'PRESENTE').length
  const presencaPercentual = totalSessoes > 0
    ? ((sessoesPresente / totalSessoes) * 100).toFixed(1)
    : '0'

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Cabecalho */}
      <div className="flex items-center gap-6 mb-8">
        <img
          src={parlamentar.foto || '/default-avatar.png'}
          alt={parlamentar.nome}
          className="w-32 h-32 rounded-full"
        />
        <div>
          <h1 className="text-3xl font-bold">
            {parlamentar.apelido || parlamentar.nome}
          </h1>
          <p className="text-xl text-gray-600">{parlamentar.cargo}</p>
          <p className="text-lg">{parlamentar.partido}</p>
        </div>
      </div>

      {/* Estatisticas */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-4 bg-blue-50 rounded-lg text-center">
          <p className="text-3xl font-bold text-blue-600">{presencaPercentual}%</p>
          <p className="text-sm">Presenca em Sessoes</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg text-center">
          <p className="text-3xl font-bold text-green-600">{parlamentar.proposicoes.length}</p>
          <p className="text-sm">Proposicoes</p>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg text-center">
          <p className="text-3xl font-bold text-purple-600">{parlamentar.membrosComissao.length}</p>
          <p className="text-sm">Comissoes</p>
        </div>
      </div>

      {/* Comissoes */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">Comissoes</h2>
        <div className="space-y-2">
          {parlamentar.membrosComissao.map(mc => (
            <div key={mc.id} className="p-3 bg-gray-50 rounded flex justify-between">
              <span>{mc.comissao.nome}</span>
              <span className="text-gray-600">{mc.cargo}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Proposicoes */}
      <section>
        <h2 className="text-xl font-bold mb-4">Proposicoes Recentes</h2>
        <div className="space-y-2">
          {parlamentar.proposicoes.map(p => (
            <a
              key={p.id}
              href={`/legislativo/proposicoes/${p.id}`}
              className="block p-3 bg-gray-50 rounded hover:bg-gray-100"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-semibold">
                    {p.tipo} {p.numero}/{p.ano}
                  </span>
                  <p className="text-sm text-gray-600">{p.ementa}</p>
                </div>
                <span className="text-xs px-2 py-1 bg-blue-100 rounded">
                  {p.status}
                </span>
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  )
}
```

---

## Checklist de Implementacao

### Dashboard

- [x] Exibir dados do parlamentar
- [x] Estatisticas de presenca
- [x] Comissoes ativas
- [x] Cargos na mesa
- [x] Votacoes recentes
- [x] Mandato atual

### Votacao

- [x] Verificar sessao ativa
- [x] Verificar presenca confirmada
- [x] Verificar impedimento
- [x] Registrar voto
- [x] Exibir placar em tempo real
- [x] Bloquear voto duplicado

### Controle de Acesso

- [x] Redirecionar para votacao durante sessao
- [x] Exibir tela de aguardo sem presenca
- [x] Bloquear dashboard durante sessao
- [x] Verificacao periodica de status

### Perfil Publico

- [x] Lista de parlamentares
- [x] Perfil individual
- [x] Producao legislativa
- [x] Estatisticas de presenca
- [x] Historico de votacoes

---

## Integracao com Outros Modulos

### skill-operador.md
- Confirmacao de presenca
- Abertura de votacao
- Controle de sessao

### skill-legislativo.md
- Proposicoes de autoria
- Emendas apresentadas
- Relatorias

### skill-comissoes.md
- Participacao em comissoes
- Pareceres como relator

### skill-transparencia.md
- Perfil publico (PNTP)
- Estatisticas de presenca
- Votacoes nominais
