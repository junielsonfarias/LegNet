# Skill: Transparencia

## Visao Geral

O modulo de Transparencia implementa os requisitos do Programa Nacional de Transparencia Publica (PNTP) nivel Diamante. Gerencia a publicacao de dados obrigatorios, APIs de dados abertos, acessibilidade WCAG 2.1 AA e conformidade com a Lei de Acesso a Informacao (LAI).

---

## Arquivos Principais

| Arquivo | Funcao |
|---------|--------|
| `src/app/transparencia/page.tsx` | Portal principal (45.2KB) |
| `src/app/transparencia/[categoria]/` | Paginas por categoria |
| `src/lib/services/transparencia-service.ts` | Verificacao PNTP |
| `src/app/api/dados-abertos/` | APIs de dados abertos |
| `src/app/api/publico/` | APIs publicas |
| `src/components/transparencia/` | Componentes do portal |

---

## Requisitos PNTP - Nivel Diamante

### Categorias Obrigatorias

```
+--------------------------------------------------+
|           PNTP - NIVEL DIAMANTE                   |
+--------------------------------------------------+
| 1. Informacoes Institucionais                    |
|    - Estrutura organizacional                    |
|    - Competencias e atribuicoes                  |
|    - Horario de funcionamento                    |
|    - Endereco e contatos                         |
+--------------------------------------------------+
| 2. Legislativo                                    |
|    - Proposicoes e tramitacao                    |
|    - Votacoes nominais (30 dias)                 |
|    - Presenca em sessoes (30 dias)               |
|    - Pautas de sessao (48h antes)                |
|    - Atas de sessao (15 dias)                    |
+--------------------------------------------------+
| 3. Parlamentares                                  |
|    - Lista completa de vereadores                |
|    - Comissoes e cargos                          |
|    - Producao legislativa                        |
|    - Presenca e votacoes                         |
+--------------------------------------------------+
| 4. Financeiro/Orcamentario                        |
|    - Receitas e despesas                         |
|    - Empenhos, liquidacoes, pagamentos           |
|    - Contratos (24h apos assinatura)             |
|    - Licitacoes em andamento                     |
|    - Convenios                                   |
+--------------------------------------------------+
| 5. Pessoal                                        |
|    - Quadro de servidores                        |
|    - Remuneracao (nome ou cargo)                 |
|    - Concursos publicos                          |
|    - Diarias e viagens                           |
+--------------------------------------------------+
| 6. Dados Abertos                                  |
|    - APIs documentadas                           |
|    - Formatos: JSON, CSV, XML                    |
|    - Atualizacao em tempo real                   |
+--------------------------------------------------+
| 7. Acessibilidade                                 |
|    - WCAG 2.1 nivel AA                           |
|    - Libras (opcional)                           |
|    - Alto contraste                              |
|    - Navegacao por teclado                       |
+--------------------------------------------------+
```

---

## Regras de Negocio

### Prazos de Publicacao

| Regra | Descricao |
|-------|-----------|
| **RN-120** | Votacoes nominais: atualizadas em 30 dias |
| **RN-121** | Presenca em sessoes: atualizada em 30 dias |
| **RN-122** | Pautas de sessao: publicadas 48h antes |
| **RN-123** | Atas de sessao: publicadas em 15 dias apos aprovacao |
| **RN-124** | Contratos: publicados em 24h apos assinatura |

### Prazos Detalhados

```typescript
const PRAZOS_PNTP = {
  VOTACAO_NOMINAL: 30,        // dias apos sessao
  PRESENCA_SESSAO: 30,        // dias apos sessao
  PAUTA_SESSAO: 48,           // horas antes da sessao
  ATA_SESSAO: 15,             // dias apos aprovacao
  CONTRATO: 24,               // horas apos assinatura
  LICITACAO: 24,              // horas apos abertura
  RECEITA: 1,                 // dia util apos registro
  DESPESA: 1,                 // dia util apos registro
  REMUNERACAO: 30,            // dias (mensal)
}
```

### Formatos Obrigatorios

| Regra | Descricao |
|-------|-----------|
| **RN-125** | HTML: visualizacao em navegador |
| **RN-126** | PDF: documentos oficiais |
| **RN-127** | CSV: dados tabulares |
| **RN-128** | JSON: APIs e integracao |
| **RN-129** | XML: interoperabilidade |

### Acessibilidade

| Regra | Descricao |
|-------|-----------|
| **RN-130** | Nivel AA do WCAG 2.1 obrigatorio |
| **RN-131** | Navegacao completa por teclado |
| **RN-132** | Alto contraste disponivel |
| **RN-133** | Textos alternativos em imagens |
| **RN-134** | Estrutura semantica HTML5 |

---

## APIs e Endpoints

### Dados Abertos

| Rota | Metodo | Funcionalidade | Formato |
|------|--------|----------------|---------|
| `/api/dados-abertos/proposicoes` | GET | Lista proposicoes | JSON/CSV |
| `/api/dados-abertos/votacoes` | GET | Votacoes nominais | JSON/CSV |
| `/api/dados-abertos/presencas` | GET | Presenca em sessoes | JSON/CSV |
| `/api/dados-abertos/parlamentares` | GET | Lista parlamentares | JSON/CSV |
| `/api/dados-abertos/sessoes` | GET | Sessoes realizadas | JSON/CSV |
| `/api/dados-abertos/comissoes` | GET | Comissoes e membros | JSON/CSV |
| `/api/dados-abertos/despesas` | GET | Despesas publicas | JSON/CSV |
| `/api/dados-abertos/receitas` | GET | Receitas publicas | JSON/CSV |
| `/api/dados-abertos/contratos` | GET | Contratos vigentes | JSON/CSV |
| `/api/dados-abertos/servidores` | GET | Quadro de pessoal | JSON/CSV |

### APIs Publicas

| Rota | Metodo | Funcionalidade | Auth |
|------|--------|----------------|------|
| `/api/publico/proposicoes` | GET | Consulta proposicoes | Nao |
| `/api/publico/parlamentares` | GET | Lista parlamentares | Nao |
| `/api/publico/sessoes` | GET | Agenda sessoes | Nao |
| `/api/publico/busca` | GET | Busca geral | Nao |

### Exportacao

| Rota | Metodo | Funcionalidade | Formato |
|------|--------|----------------|---------|
| `/api/exportar/[entidade]` | GET | Exportar dados | CSV/JSON/XML |
| `/api/exportar/relatorio/[tipo]` | GET | Relatorios | PDF |

---

## Servicos de Negocio

### transparencia-service.ts

```typescript
interface ConformidadePNTP {
  nivel: 'OURO' | 'PRATA' | 'BRONZE' | 'DIAMANTE'
  pontuacao: number
  itensConformes: number
  itensTotal: number
  pendencias: PendenciaPNTP[]
  ultimaVerificacao: Date
}

interface PendenciaPNTP {
  categoria: string
  item: string
  prazo: Date
  diasAtraso: number
  prioridade: 'ALTA' | 'MEDIA' | 'BAIXA'
}

// Verificar conformidade geral PNTP
async function verificarConformidadePNTP(): Promise<ConformidadePNTP>

// Verificar votacoes nominais pendentes (RN-120)
async function verificarVotacoesNominais(): Promise<{
  conformes: number
  pendentes: Votacao[]
}>

// Verificar presencas pendentes (RN-121)
async function verificarPresencas(): Promise<{
  conformes: number
  pendentes: Sessao[]
}>

// Verificar pautas publicadas (RN-122)
async function verificarPautas(): Promise<{
  conformes: number
  pendentes: Sessao[]
}>

// Verificar atas publicadas (RN-123)
async function verificarAtas(): Promise<{
  conformes: number
  pendentes: Sessao[]
}>

// Verificar lista de vereadores atualizada
async function verificarListaVereadores(): Promise<{
  atualizada: boolean
  ultimaAtualizacao: Date
}>

// Gerar relatorio de conformidade
async function gerarRelatorioConformidade(): Promise<RelatorioConformidade>
```

---

## Categorias de Dados

### 1. Institucional

```typescript
interface DadosInstitucionais {
  camaraInfo: {
    nome: string
    cnpj: string
    endereco: string
    telefone: string
    email: string
    horarioFuncionamento: string
    dataInstalacao: Date
  }
  estrutura: {
    mesaDiretora: MembroMesa[]
    comissoes: Comissao[]
    secretarias: Secretaria[]
  }
  documentos: {
    leiOrganica: Documento
    regimentoInterno: Documento
    organograma: Documento
  }
}
```

### 2. Legislativo

```typescript
interface DadosLegislativos {
  proposicoes: {
    emTramitacao: Proposicao[]
    aprovadas: Proposicao[]
    rejeitadas: Proposicao[]
    arquivadas: Proposicao[]
  }
  sessoes: {
    realizadas: Sessao[]
    agendadas: Sessao[]
    pautas: PautaSessao[]
    atas: Ata[]
  }
  votacoes: {
    nominais: VotacaoNominal[]
    resultados: ResultadoVotacao[]
  }
  presencas: {
    porSessao: PresencaSessao[]
    porParlamentar: PresencaParlamentar[]
  }
}
```

### 3. Parlamentares

```typescript
interface DadosParlamentares {
  vereadores: {
    id: string
    nome: string
    apelido: string
    partido: string
    foto: string
    email: string
    telefone: string
    biografia: string
    mandatos: Mandato[]
    comissoes: MembroComissao[]
    proposicoes: Proposicao[]
    presenca: EstatisticaPresenca
    votacoes: EstatisticaVotacao[]
  }[]
}
```

### 4. Financeiro

```typescript
interface DadosFinanceiros {
  receitas: {
    orcada: number
    arrecadada: number
    porFonte: ReceitaFonte[]
    mensal: ReceitaMensal[]
  }
  despesas: {
    orcada: number
    empenhada: number
    liquidada: number
    paga: number
    porCategoria: DespesaCategoria[]
    mensal: DespesaMensal[]
  }
  contratos: Contrato[]
  licitacoes: Licitacao[]
  convenios: Convenio[]
}
```

### 5. Pessoal

```typescript
interface DadosPessoal {
  servidores: {
    efetivos: Servidor[]
    comissionados: Servidor[]
    temporarios: Servidor[]
  }
  remuneracao: {
    porCargo: RemuneracaoCargo[]
    porServidor: RemuneracaoServidor[]
    folhaMensal: FolhaPagamento[]
  }
  concursos: Concurso[]
  diarias: Diaria[]
}
```

---

## Fluxos Principais

### Fluxo de Verificacao PNTP

```
    SCHEDULER DIARIO
          |
          v
    +-------------------+
    | VERIFICAR         |
    | CONFORMIDADE      |
    +-------------------+
          |
          v
    +-------------------+
    | CHECAR CATEGORIAS |
    | - Votacoes        |
    | - Presencas       |
    | - Pautas          |
    | - Atas            |
    | - Contratos       |
    +-------------------+
          |
          v
    +-------------------+
    | IDENTIFICAR       |
    | PENDENCIAS        |
    +-------------------+
          |
          +--------+--------+
          |                 |
          v                 v
      CONFORMES         PENDENTES
          |                 |
          v                 v
    +----------+        +----------+
    | REGISTRAR|        | GERAR    |
    | SUCESSO  |        | ALERTAS  |
    +----------+        +----------+
          |                 |
          +--------+--------+
                   |
                   v
    +-------------------+
    | ATUALIZAR         |
    | DASHBOARD         |
    +-------------------+
          |
          v
    +-------------------+
    | NOTIFICAR         |
    | RESPONSAVEIS      |
    +-------------------+
```

### Fluxo de Publicacao de Pauta (48h)

```
    PAUTA CRIADA
          |
          v
    +-------------------+
    | VERIFICAR         |
    | DATA SESSAO       |
    +-------------------+
          |
          v
    +-------------------+
    | CALCULAR          |
    | PRAZO (48h antes) |
    +-------------------+
          |
          +--------+--------+
          |                 |
          v                 v
      >= 48H            < 48H
          |                 |
          v                 v
    +----------+        +----------+
    | PUBLICAR |        | ALERTAR  |
    | PAUTA    |        | ATRASO   |
    +----------+        +----------+
          |                 |
          v                 v
    +----------+        +----------+
    | PORTAL   |        | PUBLICAR |
    | TRANS.   |        | URGENTE  |
    +----------+        +----------+
          |                 |
          +--------+--------+
                   |
                   v
    +-------------------+
    | REGISTRAR LOG     |
    | PUBLICACAO        |
    +-------------------+
```

### Fluxo de Dados Abertos

```
    REQUISICAO API
          |
          v
    +-------------------+
    | VALIDAR           |
    | PARAMETROS        |
    +-------------------+
          |
          v
    +-------------------+
    | APLICAR FILTROS   |
    | - Periodo         |
    | - Tipo            |
    | - Status          |
    +-------------------+
          |
          v
    +-------------------+
    | BUSCAR DADOS      |
    | BANCO             |
    +-------------------+
          |
          v
    +-------------------+
    | FORMATAR          |
    | RESPOSTA          |
    +-------------------+
          |
          +--------+--------+--------+
          |        |        |        |
          v        v        v        v
        JSON     CSV      XML      PDF
          |        |        |        |
          +--------+--------+--------+
                   |
                   v
    +-------------------+
    | APLICAR           |
    | RATE LIMITING     |
    +-------------------+
          |
          v
    +-------------------+
    | RETORNAR          |
    | DADOS             |
    +-------------------+
```

---

## Componentes React

### Portal Transparencia

| Componente | Arquivo | Funcao |
|------------|---------|--------|
| TransparenciaPage | `src/app/transparencia/page.tsx` | Portal principal |
| CategoriaCard | `src/components/transparencia/categoria-card.tsx` | Card de categoria |
| BuscaAvancada | `src/components/transparencia/busca-avancada.tsx` | Busca com filtros |
| FiltrosTransparencia | `src/components/transparencia/filtros.tsx` | Filtros de dados |
| TabelaDados | `src/components/transparencia/tabela-dados.tsx` | Exibicao tabular |
| ExportarDados | `src/components/transparencia/exportar.tsx` | Botoes exportacao |
| GraficoReceitas | `src/components/transparencia/grafico-receitas.tsx` | Visualizacao |
| GraficoDespesas | `src/components/transparencia/grafico-despesas.tsx` | Visualizacao |
| TimelineVotacoes | `src/components/transparencia/timeline-votacoes.tsx` | Historico |

### Acessibilidade

| Componente | Arquivo | Funcao |
|------------|---------|--------|
| SkipLink | `src/components/accessibility/skip-link.tsx` | Pular navegacao |
| AltoContraste | `src/components/accessibility/alto-contraste.tsx` | Toggle contraste |
| FonteAjustavel | `src/components/accessibility/fonte-ajustavel.tsx` | Tamanho fonte |
| NavegacaoTeclado | `src/components/accessibility/nav-teclado.tsx` | Focus visible |

---

## Exemplos de Uso

### Exemplo 1: Verificar Conformidade PNTP

```typescript
import { TransparenciaService } from '@/lib/services/transparencia-service'

// Verificar conformidade geral
const conformidade = await TransparenciaService.verificarConformidadePNTP()

console.log(`Nivel: ${conformidade.nivel}`)
console.log(`Pontuacao: ${conformidade.pontuacao}%`)
console.log(`Itens conformes: ${conformidade.itensConformes}/${conformidade.itensTotal}`)

if (conformidade.pendencias.length > 0) {
  console.log('Pendencias:')
  for (const pendencia of conformidade.pendencias) {
    console.log(`- ${pendencia.categoria}: ${pendencia.item}`)
    console.log(`  Prazo: ${pendencia.prazo}, Atraso: ${pendencia.diasAtraso} dias`)
  }
}
```

### Exemplo 2: API de Dados Abertos

```typescript
// GET /api/dados-abertos/votacoes?format=json&ano=2024

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') || 'json'
  const ano = parseInt(searchParams.get('ano') || new Date().getFullYear().toString())
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000)

  // Buscar votacoes nominais
  const votacoes = await prisma.votacao.findMany({
    where: {
      tipo: 'NOMINAL',
      status: 'ENCERRADA',
      sessao: {
        dataHora: {
          gte: new Date(`${ano}-01-01`),
          lte: new Date(`${ano}-12-31`)
        }
      }
    },
    include: {
      sessao: {
        select: {
          numero: true,
          dataHora: true,
          tipo: true
        }
      },
      proposicao: {
        select: {
          tipo: true,
          numero: true,
          ano: true,
          ementa: true
        }
      },
      votos: {
        include: {
          parlamentar: {
            select: {
              nome: true,
              apelido: true,
              partido: true
            }
          }
        }
      }
    },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: {
      dataFim: 'desc'
    }
  })

  // Formatar dados
  const dados = votacoes.map(v => ({
    id: v.id,
    sessao: {
      numero: v.sessao.numero,
      data: v.sessao.dataHora,
      tipo: v.sessao.tipo
    },
    proposicao: v.proposicao ? {
      codigo: `${v.proposicao.tipo} ${v.proposicao.numero}/${v.proposicao.ano}`,
      ementa: v.proposicao.ementa
    } : null,
    resultado: v.resultado,
    totais: {
      sim: v.votosSim,
      nao: v.votosNao,
      abstencao: v.abstencoes
    },
    votos: v.votos.map(voto => ({
      parlamentar: voto.parlamentar.apelido || voto.parlamentar.nome,
      partido: voto.parlamentar.partido,
      voto: voto.valor
    }))
  }))

  // Retornar no formato solicitado
  if (format === 'csv') {
    const csv = convertToCSV(dados)
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=votacoes-${ano}.csv`
      }
    })
  }

  return NextResponse.json({
    dados,
    paginacao: {
      pagina: page,
      limite: limit,
      total: await prisma.votacao.count({ where: { tipo: 'NOMINAL', status: 'ENCERRADA' } })
    },
    metadados: {
      fonte: 'Camara Municipal de Mojui dos Campos',
      atualizacao: new Date(),
      formato: 'JSON'
    }
  })
}
```

### Exemplo 3: Publicar Pauta com Verificacao de Prazo

```typescript
import { TransparenciaService } from '@/lib/services/transparencia-service'

async function publicarPauta(sessaoId: string) {
  const sessao = await prisma.sessao.findUnique({
    where: { id: sessaoId },
    include: { pautas: true }
  })

  if (!sessao) throw new Error('Sessao nao encontrada')

  const agora = new Date()
  const dataHoraSessao = new Date(sessao.dataHora)
  const horasAntecedencia = (dataHoraSessao.getTime() - agora.getTime()) / (1000 * 60 * 60)

  // Verificar prazo de 48h (RN-122)
  if (horasAntecedencia < 48) {
    await prisma.alertaTransparencia.create({
      data: {
        tipo: 'PAUTA_ATRASADA',
        entidade: 'SESSAO',
        entidadeId: sessaoId,
        mensagem: `Pauta publicada com menos de 48h de antecedencia (${horasAntecedencia.toFixed(1)}h)`,
        prioridade: 'ALTA'
      }
    })
  }

  // Publicar pauta
  await prisma.pautaSessao.update({
    where: { sessaoId },
    data: {
      publicada: true,
      dataPublicacao: new Date()
    }
  })

  // Registrar log de publicacao
  await prisma.logTransparencia.create({
    data: {
      acao: 'PUBLICACAO_PAUTA',
      entidade: 'PAUTA_SESSAO',
      entidadeId: sessaoId,
      detalhes: {
        horasAntecedencia,
        conforme: horasAntecedencia >= 48
      }
    }
  })

  return {
    sucesso: true,
    conforme: horasAntecedencia >= 48,
    horasAntecedencia
  }
}
```

### Exemplo 4: Exportar Dados em Multiplos Formatos

```typescript
// GET /api/exportar/parlamentares?format=csv

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const format = request.nextUrl.searchParams.get('format') || 'json'

  const parlamentares = await prisma.parlamentar.findMany({
    where: { ativo: true },
    include: {
      mandatos: {
        where: { ativo: true },
        include: { legislatura: true }
      },
      membrosComissao: {
        where: { ativo: true },
        include: { comissao: true }
      }
    }
  })

  const dados = parlamentares.map(p => ({
    nome: p.nome,
    apelido: p.apelido,
    partido: p.partido,
    email: p.email,
    telefone: p.telefone,
    mandato: p.mandatos[0]?.legislatura?.numero || null,
    comissoes: p.membrosComissao.map(m => m.comissao.sigla).join(', ')
  }))

  switch (format) {
    case 'csv':
      const csv = convertToCSV(dados)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename=parlamentares.csv'
        }
      })

    case 'xml':
      const xml = convertToXML(dados, 'parlamentares')
      return new NextResponse(xml, {
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Content-Disposition': 'attachment; filename=parlamentares.xml'
        }
      })

    case 'pdf':
      const pdf = await generatePDF(dados, 'Lista de Parlamentares')
      return new NextResponse(pdf, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename=parlamentares.pdf'
        }
      })

    default: // json
      return NextResponse.json({
        dados,
        metadados: {
          fonte: 'Camara Municipal de Mojui dos Campos',
          atualizacao: new Date(),
          total: dados.length
        }
      })
  }
}

function convertToCSV(dados: any[]): string {
  if (dados.length === 0) return ''
  const headers = Object.keys(dados[0])
  const rows = dados.map(row =>
    headers.map(h => `"${row[h] || ''}"`.replace(/"/g, '""')).join(',')
  )
  return [headers.join(','), ...rows].join('\n')
}

function convertToXML(dados: any[], root: string): string {
  const items = dados.map(item => {
    const fields = Object.entries(item)
      .map(([key, value]) => `<${key}>${value || ''}</${key}>`)
      .join('')
    return `<item>${fields}</item>`
  }).join('')
  return `<?xml version="1.0" encoding="UTF-8"?><${root}>${items}</${root}>`
}
```

### Exemplo 5: Dashboard de Conformidade

```typescript
import { TransparenciaService } from '@/lib/services/transparencia-service'

// GET /api/admin/transparencia/dashboard

export async function GET() {
  const [
    conformidade,
    votacoesPendentes,
    presencasPendentes,
    pautasPendentes,
    atasPendentes
  ] = await Promise.all([
    TransparenciaService.verificarConformidadePNTP(),
    TransparenciaService.verificarVotacoesNominais(),
    TransparenciaService.verificarPresencas(),
    TransparenciaService.verificarPautas(),
    TransparenciaService.verificarAtas()
  ])

  return NextResponse.json({
    geral: {
      nivel: conformidade.nivel,
      pontuacao: conformidade.pontuacao,
      itensConformes: conformidade.itensConformes,
      itensTotal: conformidade.itensTotal
    },
    categorias: [
      {
        nome: 'Votacoes Nominais',
        prazo: '30 dias',
        conformes: votacoesPendentes.conformes,
        pendentes: votacoesPendentes.pendentes.length,
        status: votacoesPendentes.pendentes.length === 0 ? 'CONFORME' : 'PENDENTE'
      },
      {
        nome: 'Presencas em Sessoes',
        prazo: '30 dias',
        conformes: presencasPendentes.conformes,
        pendentes: presencasPendentes.pendentes.length,
        status: presencasPendentes.pendentes.length === 0 ? 'CONFORME' : 'PENDENTE'
      },
      {
        nome: 'Pautas de Sessao',
        prazo: '48 horas',
        conformes: pautasPendentes.conformes,
        pendentes: pautasPendentes.pendentes.length,
        status: pautasPendentes.pendentes.length === 0 ? 'CONFORME' : 'PENDENTE'
      },
      {
        nome: 'Atas de Sessao',
        prazo: '15 dias',
        conformes: atasPendentes.conformes,
        pendentes: atasPendentes.pendentes.length,
        status: atasPendentes.pendentes.length === 0 ? 'CONFORME' : 'PENDENTE'
      }
    ],
    pendencias: conformidade.pendencias,
    ultimaVerificacao: conformidade.ultimaVerificacao
  })
}
```

---

## Checklist de Implementacao

### Dados Obrigatorios

- [x] Votacoes nominais (30 dias)
- [x] Presenca em sessoes (30 dias)
- [x] Pautas de sessao (48h)
- [x] Atas de sessao (15 dias)
- [x] Lista de vereadores
- [x] Comissoes e membros
- [x] Proposicoes em tramitacao
- [x] Contratos (24h)

### APIs de Dados Abertos

- [x] Endpoint de proposicoes
- [x] Endpoint de votacoes
- [x] Endpoint de presencas
- [x] Endpoint de parlamentares
- [x] Endpoint de sessoes
- [x] Endpoint de despesas
- [x] Endpoint de receitas
- [x] Documentacao OpenAPI

### Formatos de Exportacao

- [x] JSON
- [x] CSV
- [x] XML
- [x] PDF

### Acessibilidade WCAG 2.1 AA

- [x] Skip links
- [x] Alto contraste
- [x] Navegacao por teclado
- [x] Textos alternativos
- [x] Estrutura semantica
- [x] Focus visible
- [x] Fontes ajustaveis

### Monitoramento

- [x] Verificacao automatica de conformidade
- [x] Alertas de prazo vencendo
- [x] Dashboard de status
- [x] Relatorios periodicos

---

## Integracao com Outros Modulos

### skill-legislativo.md
- Publicacao de proposicoes
- Status de tramitacao
- Textos de leis

### skill-operador.md
- Votacoes nominais
- Presenca em sessoes
- Resultados em tempo real

### skill-parlamentar.md
- Perfil publico
- Producao legislativa
- Estatisticas

### skill-secretaria.md
- Pautas de sessao
- Atas aprovadas
- Documentos oficiais
