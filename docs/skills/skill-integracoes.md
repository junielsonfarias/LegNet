# Skill: Integracoes

## Visao Geral

O modulo de Integracoes gerencia todas as APIs publicas, webhooks e conexoes com sistemas externos. Inclui APIs documentadas para dados abertos, integracoes com o Diario Oficial, Portal da Transparencia Federal, SAPL/Interlegis e sistemas da Prefeitura.

---

## Arquivos Principais

| Arquivo | Funcao |
|---------|--------|
| `src/app/api/integracoes/` | APIs de integracao |
| `src/app/api/integracoes/public/` | APIs publicas documentadas |
| `src/app/api/dados-abertos/` | Dados abertos (PNTP) |
| `src/app/api/publico/` | APIs sem autenticacao |
| `src/lib/api/` | Clientes de API externa |
| `src/lib/webhooks/` | Handlers de webhook |

---

## APIs Publicas

### Endpoints de Dados Abertos

| Rota | Metodo | Descricao | Formatos |
|------|--------|-----------|----------|
| `/api/dados-abertos/proposicoes` | GET | Lista de proposicoes | JSON, CSV |
| `/api/dados-abertos/votacoes` | GET | Votacoes nominais | JSON, CSV |
| `/api/dados-abertos/presencas` | GET | Presenca em sessoes | JSON, CSV |
| `/api/dados-abertos/parlamentares` | GET | Lista de vereadores | JSON, CSV |
| `/api/dados-abertos/sessoes` | GET | Sessoes realizadas | JSON, CSV |
| `/api/dados-abertos/comissoes` | GET | Comissoes e membros | JSON, CSV |
| `/api/dados-abertos/leis` | GET | Leis publicadas | JSON, CSV |
| `/api/dados-abertos/despesas` | GET | Despesas publicas | JSON, CSV |
| `/api/dados-abertos/receitas` | GET | Receitas publicas | JSON, CSV |
| `/api/dados-abertos/contratos` | GET | Contratos vigentes | JSON, CSV |
| `/api/dados-abertos/servidores` | GET | Quadro de pessoal | JSON, CSV |

### Endpoints Publicos (Sem Auth)

| Rota | Metodo | Descricao |
|------|--------|-----------|
| `/api/publico/proposicoes` | GET | Consulta proposicoes |
| `/api/publico/proposicoes/[id]` | GET | Detalhes proposicao |
| `/api/publico/parlamentares` | GET | Lista parlamentares |
| `/api/publico/parlamentares/[id]` | GET | Perfil parlamentar |
| `/api/publico/sessoes` | GET | Agenda de sessoes |
| `/api/publico/sessoes/[id]` | GET | Detalhes sessao |
| `/api/publico/busca` | GET | Busca geral |

### Documentacao OpenAPI

| Rota | Metodo | Descricao |
|------|--------|-----------|
| `/api/docs` | GET | Swagger UI |
| `/api/docs/openapi.json` | GET | Especificacao OpenAPI |

---

## Estrutura de Resposta

### Formato Padrao JSON

```typescript
interface APIResponse<T> {
  success: boolean
  data: T
  metadados: {
    fonte: string
    atualizacao: Date
    versao: string
    total?: number
  }
  paginacao?: {
    pagina: number
    limite: number
    total: number
    totalPaginas: number
  }
  links?: {
    self: string
    first?: string
    prev?: string
    next?: string
    last?: string
  }
}
```

### Formato CSV

```csv
id,tipo,numero,ano,ementa,status,data_apresentacao
"abc123","PL",1,2024,"Dispoe sobre...","EM_TRAMITACAO","2024-01-15"
```

### Formato XML

```xml
<?xml version="1.0" encoding="UTF-8"?>
<proposicoes>
  <item>
    <id>abc123</id>
    <tipo>PL</tipo>
    <numero>1</numero>
    <ano>2024</ano>
    <ementa>Dispoe sobre...</ementa>
    <status>EM_TRAMITACAO</status>
    <data_apresentacao>2024-01-15</data_apresentacao>
  </item>
</proposicoes>
```

---

## Rate Limiting

### Configuracao

```typescript
const RATE_LIMITS = {
  public: {
    requests: 100,      // Requisicoes
    window: 60 * 1000,  // 1 minuto
    message: 'Limite de requisicoes excedido. Tente novamente em 1 minuto.'
  },
  authenticated: {
    requests: 1000,
    window: 60 * 1000,
    message: 'Limite de requisicoes excedido para usuarios autenticados.'
  },
  dados_abertos: {
    requests: 50,
    window: 60 * 1000,
    message: 'Limite de requisicoes para dados abertos excedido.'
  }
}
```

### Headers de Resposta

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699999999
```

---

## Webhooks

### Eventos Disponiveis

| Evento | Descricao | Payload |
|--------|-----------|---------|
| `proposicao.criada` | Nova proposicao protocola | Proposicao |
| `proposicao.atualizada` | Status alterado | Proposicao + mudancas |
| `votacao.iniciada` | Votacao aberta | Votacao |
| `votacao.encerrada` | Votacao finalizada | Votacao + resultado |
| `sessao.iniciada` | Sessao aberta | Sessao |
| `sessao.encerrada` | Sessao concluida | Sessao + resumo |
| `lei.publicada` | Lei no Diario | Lei + link |

### Registro de Webhook

```typescript
// POST /api/integracoes/webhooks

interface WebhookRegistro {
  url: string           // URL de callback
  eventos: string[]     // Eventos a receber
  secreto: string       // Para validacao HMAC
  ativo: boolean
}
```

### Payload de Webhook

```typescript
interface WebhookPayload {
  evento: string
  timestamp: Date
  dados: any
  assinatura: string    // HMAC-SHA256
}

// Validacao da assinatura
const esperado = crypto
  .createHmac('sha256', secreto)
  .update(JSON.stringify(dados))
  .digest('hex')
```

---

## Integracoes Externas

### 1. Diario Oficial

```typescript
// Cliente para Diario Oficial Municipal

interface DiarioOficialClient {
  // Publicar ato no Diario
  publicar(ato: {
    tipo: 'LEI' | 'DECRETO' | 'RESOLUCAO' | 'ATA'
    numero: number
    ano: number
    texto: string
    dataVigencia?: Date
  }): Promise<{ sucesso: boolean; edicao: number; link: string }>

  // Consultar publicacao
  consultar(filtros: {
    tipo?: string
    numero?: number
    ano?: number
    dataInicio?: Date
    dataFim?: Date
  }): Promise<Publicacao[]>

  // Obter link de publicacao
  obterLink(edicao: number): string
}
```

### 2. Portal da Transparencia Federal

```typescript
// Sincronizacao com Portal Federal

interface TransparenciaFederalClient {
  // Enviar dados de receitas
  sincronizarReceitas(dados: Receita[]): Promise<{ enviados: number }>

  // Enviar dados de despesas
  sincronizarDespesas(dados: Despesa[]): Promise<{ enviados: number }>

  // Enviar dados de contratos
  sincronizarContratos(dados: Contrato[]): Promise<{ enviados: number }>

  // Verificar status de sincronizacao
  verificarStatus(): Promise<StatusSincronizacao>
}
```

### 3. SAPL/Interlegis

```typescript
// Integracao com SAPL (Sistema de Apoio ao Processo Legislativo)

interface SAPLClient {
  // Importar proposicoes do SAPL
  importarProposicoes(filtros: FiltrosSAPL): Promise<Proposicao[]>

  // Exportar para SAPL
  exportarProposicao(proposicao: Proposicao): Promise<{ id: string }>

  // Sincronizar parlamentares
  sincronizarParlamentares(): Promise<{ atualizados: number }>

  // Obter normas juridicas
  obterNormas(filtros: FiltrosNorma): Promise<NormaJuridica[]>
}
```

### 4. Sistemas da Prefeitura

```typescript
// Integracao com sistemas da Prefeitura

interface PrefeituraClient {
  // Enviar lei sancionada
  enviarLeiSancionada(lei: Lei): Promise<{ protocolo: string }>

  // Consultar veto
  consultarVeto(leiId: string): Promise<Veto | null>

  // Obter dados orcamentarios
  obterDadosOrcamento(ano: number): Promise<DadosOrcamento>

  // Sincronizar servidores
  sincronizarServidores(): Promise<{ total: number }>
}
```

---

## Autenticacao de APIs

### API Key

```typescript
// Header: X-API-Key

const apiKey = request.headers.get('X-API-Key')

const cliente = await prisma.apiCliente.findUnique({
  where: { chave: apiKey }
})

if (!cliente || !cliente.ativo) {
  return NextResponse.json({ error: 'API Key invalida' }, { status: 401 })
}
```

### OAuth 2.0 (Para integradores)

```typescript
// Fluxo Authorization Code

// 1. Redirecionar para autorizacao
// GET /api/oauth/authorize?client_id=X&redirect_uri=Y&scope=Z

// 2. Usuario autoriza

// 3. Callback com code
// GET callback_uri?code=ABC

// 4. Trocar code por token
// POST /api/oauth/token
// { grant_type: 'authorization_code', code: 'ABC', client_id, client_secret }

// 5. Usar token
// Header: Authorization: Bearer TOKEN
```

---

## Regras de Negocio

### APIs Publicas

| Regra | Descricao |
|-------|-----------|
| **RN-124** | APIs DEVEM ser documentadas (OpenAPI) |
| **RN-125** | Formatos obrigatorios: JSON, CSV |
| **RN-126** | XML disponivel para interoperabilidade |
| **RN-127** | Rate limiting obrigatorio |
| **RN-128** | Dados sensiveis NAO expostos |

### Webhooks

| Regra | Descricao |
|-------|-----------|
| **RN-129** | Webhooks com assinatura HMAC |
| **RN-130** | Retry em caso de falha (3x) |
| **RN-131** | Timeout de 30 segundos |
| **RN-132** | Log de todas as chamadas |

### Integracoes

| Regra | Descricao |
|-------|-----------|
| **RN-133** | Sincronizacao periodica (diaria/semanal) |
| **RN-134** | Tratamento de erros e fallback |
| **RN-135** | Logs de integracao |
| **RN-136** | Credenciais em variaveis de ambiente |

---

## Fluxos Principais

### Fluxo de API Request

```
    REQUEST API PUBLICA
          |
          v
    +-------------------+
    | VALIDAR           |
    | RATE LIMIT        |
    +-------------------+
          |
          +--------+--------+
          |                 |
          v                 v
      PERMITIDO         BLOQUEADO
          |                 |
          v                 v
    +----------+        429 TOO MANY
    | VALIDAR  |        REQUESTS
    | PARAMS   |
    +----------+
          |
          +--------+--------+
          |                 |
          v                 v
      VALIDOS           INVALIDOS
          |                 |
          v                 v
    +----------+        400 BAD
    | BUSCAR   |        REQUEST
    | DADOS    |
    +----------+
          |
          v
    +-------------------+
    | FORMATAR          |
    | RESPOSTA          |
    | (JSON/CSV/XML)    |
    +-------------------+
          |
          v
    +-------------------+
    | ADICIONAR         |
    | HEADERS           |
    | - Rate Limit      |
    | - Cache           |
    | - CORS            |
    +-------------------+
          |
          v
    200 OK + DADOS
```

### Fluxo de Webhook

```
    EVENTO NO SISTEMA
    (proposicao.criada)
          |
          v
    +-------------------+
    | BUSCAR            |
    | WEBHOOKS          |
    | REGISTRADOS       |
    +-------------------+
          |
          v
    Para cada webhook:
          |
    +-------------------+
    | MONTAR            |
    | PAYLOAD           |
    +-------------------+
          |
          v
    +-------------------+
    | CALCULAR          |
    | ASSINATURA        |
    | HMAC-SHA256       |
    +-------------------+
          |
          v
    +-------------------+
    | ENVIAR            |
    | POST REQUEST      |
    | (timeout 30s)     |
    +-------------------+
          |
          +--------+--------+
          |                 |
          v                 v
      SUCESSO            FALHA
      (2xx)              (4xx/5xx/timeout)
          |                 |
          v                 v
    +----------+        +----------+
    | REGISTRAR|        | AGENDAR  |
    | LOG      |        | RETRY    |
    +----------+        | (3x)     |
                        +----------+
                             |
                             v
                        FALHA FINAL?
                             |
                        +----+----+
                        |         |
                        v         v
                      SIM       NAO
                        |         |
                        v         v
                    DESATIVAR  AGUARDAR
                    WEBHOOK   PROXIMO
```

### Fluxo de Sincronizacao Externa

```
    SCHEDULER
    (diario/semanal)
          |
          v
    +-------------------+
    | VERIFICAR         |
    | ULTIMA SYNC       |
    +-------------------+
          |
          v
    +-------------------+
    | COLETAR           |
    | DADOS LOCAIS      |
    +-------------------+
          |
          v
    +-------------------+
    | TRANSFORMAR       |
    | PARA FORMATO      |
    | EXTERNO           |
    +-------------------+
          |
          v
    +-------------------+
    | ENVIAR PARA       |
    | SISTEMA EXTERNO   |
    +-------------------+
          |
          +--------+--------+
          |                 |
          v                 v
      SUCESSO            ERRO
          |                 |
          v                 v
    +----------+        +----------+
    | ATUALIZAR|        | REGISTRAR|
    | DATA SYNC|        | ERRO     |
    +----------+        +----------+
          |                 |
          v                 v
    +----------+        +----------+
    | REGISTRAR|        | NOTIFICAR|
    | LOG      |        | ADMIN    |
    +----------+        +----------+
```

---

## Exemplos de Uso

### Exemplo 1: API de Proposicoes com Paginacao

```typescript
// GET /api/dados-abertos/proposicoes

export async function GET(request: NextRequest) {
  // Rate limiting
  const rateLimitResult = await checkRateLimit(request, 'dados_abertos')
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: rateLimitResult.message },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitResult.reset.toString()
        }
      }
    )
  }

  const { searchParams } = new URL(request.url)

  // Parametros de filtro
  const tipo = searchParams.get('tipo')
  const ano = searchParams.get('ano')
  const status = searchParams.get('status')
  const autorId = searchParams.get('autor_id')

  // Paginacao
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000)

  // Formato
  const format = searchParams.get('format') || 'json'

  // Construir filtros
  const where: any = {}
  if (tipo) where.tipo = tipo
  if (ano) where.ano = parseInt(ano)
  if (status) where.status = status
  if (autorId) where.autorId = autorId

  // Buscar dados
  const [proposicoes, total] = await Promise.all([
    prisma.proposicao.findMany({
      where,
      select: {
        id: true,
        tipo: true,
        numero: true,
        ano: true,
        ementa: true,
        status: true,
        dataApresentacao: true,
        autor: {
          select: { nome: true, apelido: true }
        }
      },
      orderBy: { dataApresentacao: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.proposicao.count({ where })
  ])

  // Formatar dados
  const dados = proposicoes.map(p => ({
    id: p.id,
    tipo: p.tipo,
    numero: p.numero,
    ano: p.ano,
    codigo: `${p.tipo} ${p.numero}/${p.ano}`,
    ementa: p.ementa,
    status: p.status,
    data_apresentacao: p.dataApresentacao,
    autor: p.autor?.apelido || p.autor?.nome || null
  }))

  // Retornar no formato solicitado
  if (format === 'csv') {
    const csv = convertToCSV(dados)
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=proposicoes-${ano || 'todos'}.csv`,
        ...rateLimitHeaders(rateLimitResult)
      }
    })
  }

  if (format === 'xml') {
    const xml = convertToXML(dados, 'proposicoes')
    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        ...rateLimitHeaders(rateLimitResult)
      }
    })
  }

  // JSON (padrao)
  const baseUrl = `${request.nextUrl.origin}/api/dados-abertos/proposicoes`
  const totalPaginas = Math.ceil(total / limit)

  return NextResponse.json({
    success: true,
    data: dados,
    metadados: {
      fonte: 'Camara Municipal de Mojui dos Campos',
      atualizacao: new Date(),
      versao: '1.0',
      total
    },
    paginacao: {
      pagina: page,
      limite: limit,
      total,
      totalPaginas
    },
    links: {
      self: `${baseUrl}?page=${page}&limit=${limit}`,
      first: `${baseUrl}?page=1&limit=${limit}`,
      prev: page > 1 ? `${baseUrl}?page=${page - 1}&limit=${limit}` : null,
      next: page < totalPaginas ? `${baseUrl}?page=${page + 1}&limit=${limit}` : null,
      last: `${baseUrl}?page=${totalPaginas}&limit=${limit}`
    }
  }, {
    headers: rateLimitHeaders(rateLimitResult)
  })
}
```

### Exemplo 2: Registro de Webhook

```typescript
// POST /api/integracoes/webhooks

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!['ADMIN'].includes((session?.user as any)?.role)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const body = await request.json()

  // Validar URL
  try {
    new URL(body.url)
  } catch {
    return NextResponse.json({ error: 'URL invalida' }, { status: 400 })
  }

  // Validar eventos
  const eventosValidos = [
    'proposicao.criada',
    'proposicao.atualizada',
    'votacao.iniciada',
    'votacao.encerrada',
    'sessao.iniciada',
    'sessao.encerrada',
    'lei.publicada'
  ]

  const eventosInvalidos = body.eventos.filter(
    (e: string) => !eventosValidos.includes(e)
  )

  if (eventosInvalidos.length > 0) {
    return NextResponse.json({
      error: `Eventos invalidos: ${eventosInvalidos.join(', ')}`
    }, { status: 400 })
  }

  // Gerar secreto
  const secreto = crypto.randomBytes(32).toString('hex')

  // Criar webhook
  const webhook = await prisma.webhook.create({
    data: {
      url: body.url,
      eventos: body.eventos,
      secreto,
      ativo: true,
      criadoPorId: session?.user?.id
    }
  })

  return NextResponse.json({
    success: true,
    data: {
      id: webhook.id,
      url: webhook.url,
      eventos: webhook.eventos,
      secreto, // Mostrar apenas na criacao
      ativo: webhook.ativo
    },
    aviso: 'Guarde o secreto em local seguro. Ele nao sera exibido novamente.'
  })
}
```

### Exemplo 3: Disparar Webhook

```typescript
// src/lib/webhooks/dispatcher.ts

import crypto from 'crypto'

interface WebhookPayload {
  evento: string
  timestamp: Date
  dados: any
}

export async function dispararWebhook(
  evento: string,
  dados: any
): Promise<{ sucesso: number; falhas: number }> {
  // Buscar webhooks registrados para o evento
  const webhooks = await prisma.webhook.findMany({
    where: {
      ativo: true,
      eventos: { has: evento }
    }
  })

  let sucesso = 0
  let falhas = 0

  for (const webhook of webhooks) {
    const payload: WebhookPayload = {
      evento,
      timestamp: new Date(),
      dados
    }

    // Calcular assinatura HMAC
    const assinatura = crypto
      .createHmac('sha256', webhook.secreto)
      .update(JSON.stringify(payload))
      .digest('hex')

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': assinatura,
          'X-Webhook-Event': evento
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000) // 30s timeout
      })

      if (response.ok) {
        sucesso++
        await registrarLogWebhook(webhook.id, evento, 'SUCESSO', response.status)
      } else {
        falhas++
        await agendarRetry(webhook.id, payload, 1)
        await registrarLogWebhook(webhook.id, evento, 'FALHA', response.status)
      }
    } catch (error) {
      falhas++
      await agendarRetry(webhook.id, payload, 1)
      await registrarLogWebhook(webhook.id, evento, 'ERRO', null, error)
    }
  }

  return { sucesso, falhas }
}

async function agendarRetry(
  webhookId: string,
  payload: WebhookPayload,
  tentativa: number
) {
  if (tentativa > 3) {
    // Desativar webhook apos 3 falhas
    await prisma.webhook.update({
      where: { id: webhookId },
      data: { ativo: false }
    })
    return
  }

  // Agendar retry com backoff exponencial
  const delay = Math.pow(2, tentativa) * 60 * 1000 // 2min, 4min, 8min

  await prisma.webhookRetry.create({
    data: {
      webhookId,
      payload: payload as any,
      tentativa,
      agendadoPara: new Date(Date.now() + delay)
    }
  })
}

// Uso ao criar proposicao
export async function onProposicaoCriada(proposicao: Proposicao) {
  await dispararWebhook('proposicao.criada', {
    id: proposicao.id,
    tipo: proposicao.tipo,
    numero: proposicao.numero,
    ano: proposicao.ano,
    ementa: proposicao.ementa,
    status: proposicao.status,
    dataApresentacao: proposicao.dataApresentacao
  })
}
```

### Exemplo 4: Integracao com Diario Oficial

```typescript
// src/lib/api/diario-oficial.ts

export class DiarioOficialClient {
  private baseUrl: string
  private apiKey: string

  constructor() {
    this.baseUrl = process.env.DIARIO_OFICIAL_URL!
    this.apiKey = process.env.DIARIO_OFICIAL_API_KEY!
  }

  async publicar(ato: {
    tipo: 'LEI' | 'DECRETO' | 'RESOLUCAO' | 'ATA'
    numero: number
    ano: number
    texto: string
    dataVigencia?: Date
  }): Promise<{ sucesso: boolean; edicao: number; link: string }> {
    const response = await fetch(`${this.baseUrl}/publicacoes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        orgao: 'CAMARA_MUNICIPAL',
        tipo_ato: ato.tipo,
        numero: ato.numero,
        ano: ato.ano,
        conteudo: ato.texto,
        data_vigencia: ato.dataVigencia?.toISOString()
      })
    })

    if (!response.ok) {
      throw new Error(`Erro ao publicar: ${response.statusText}`)
    }

    const data = await response.json()

    return {
      sucesso: true,
      edicao: data.edicao,
      link: `${this.baseUrl}/edicoes/${data.edicao}`
    }
  }

  async consultar(filtros: {
    tipo?: string
    numero?: number
    ano?: number
    dataInicio?: Date
    dataFim?: Date
  }): Promise<any[]> {
    const params = new URLSearchParams()
    if (filtros.tipo) params.set('tipo', filtros.tipo)
    if (filtros.numero) params.set('numero', filtros.numero.toString())
    if (filtros.ano) params.set('ano', filtros.ano.toString())
    if (filtros.dataInicio) params.set('data_inicio', filtros.dataInicio.toISOString())
    if (filtros.dataFim) params.set('data_fim', filtros.dataFim.toISOString())

    const response = await fetch(
      `${this.baseUrl}/publicacoes?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Erro ao consultar: ${response.statusText}`)
    }

    return response.json()
  }
}

// Uso ao publicar lei
export async function publicarLeiNoDiario(lei: Lei) {
  const client = new DiarioOficialClient()

  const resultado = await client.publicar({
    tipo: 'LEI',
    numero: lei.numero,
    ano: lei.ano,
    texto: lei.textoIntegral,
    dataVigencia: lei.dataVigencia
  })

  // Atualizar lei com link do Diario
  await prisma.lei.update({
    where: { id: lei.id },
    data: {
      linkDiarioOficial: resultado.link,
      edicaoDiarioOficial: resultado.edicao,
      dataPublicacao: new Date()
    }
  })

  // Disparar webhook
  await dispararWebhook('lei.publicada', {
    id: lei.id,
    numero: lei.numero,
    ano: lei.ano,
    link: resultado.link
  })

  return resultado
}
```

### Exemplo 5: Documentacao OpenAPI

```typescript
// src/app/api/docs/openapi.json/route.ts

export async function GET() {
  const openapi = {
    openapi: '3.0.0',
    info: {
      title: 'API Camara Municipal de Mojui dos Campos',
      version: '1.0.0',
      description: 'API publica para acesso a dados legislativos',
      contact: {
        name: 'Suporte',
        email: 'suporte@camara.mojui.pa.gov.br'
      }
    },
    servers: [
      {
        url: 'https://camara.mojui.pa.gov.br/api',
        description: 'Producao'
      }
    ],
    paths: {
      '/dados-abertos/proposicoes': {
        get: {
          summary: 'Lista proposicoes',
          tags: ['Proposicoes'],
          parameters: [
            {
              name: 'tipo',
              in: 'query',
              schema: { type: 'string', enum: ['PL', 'PLC', 'PR', 'PD'] }
            },
            {
              name: 'ano',
              in: 'query',
              schema: { type: 'integer' }
            },
            {
              name: 'status',
              in: 'query',
              schema: { type: 'string' }
            },
            {
              name: 'page',
              in: 'query',
              schema: { type: 'integer', default: 1 }
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 100, maximum: 1000 }
            },
            {
              name: 'format',
              in: 'query',
              schema: { type: 'string', enum: ['json', 'csv', 'xml'], default: 'json' }
            }
          ],
          responses: {
            '200': {
              description: 'Lista de proposicoes',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ProposicoesResponse'
                  }
                }
              }
            },
            '429': {
              description: 'Rate limit excedido'
            }
          }
        }
      },
      // ... outros endpoints
    },
    components: {
      schemas: {
        Proposicao: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            tipo: { type: 'string' },
            numero: { type: 'integer' },
            ano: { type: 'integer' },
            codigo: { type: 'string' },
            ementa: { type: 'string' },
            status: { type: 'string' },
            data_apresentacao: { type: 'string', format: 'date-time' },
            autor: { type: 'string' }
          }
        },
        ProposicoesResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: { $ref: '#/components/schemas/Proposicao' }
            },
            metadados: {
              type: 'object',
              properties: {
                fonte: { type: 'string' },
                atualizacao: { type: 'string', format: 'date-time' },
                versao: { type: 'string' },
                total: { type: 'integer' }
              }
            },
            paginacao: {
              type: 'object',
              properties: {
                pagina: { type: 'integer' },
                limite: { type: 'integer' },
                total: { type: 'integer' },
                totalPaginas: { type: 'integer' }
              }
            }
          }
        }
      }
    }
  }

  return NextResponse.json(openapi)
}
```

---

## Checklist de Implementacao

### APIs Publicas

- [x] Endpoints de dados abertos
- [x] Paginacao padronizada
- [x] Formatos JSON, CSV, XML
- [x] Rate limiting
- [x] Headers CORS
- [x] Documentacao OpenAPI

### Webhooks

- [x] Registro de webhooks
- [x] Assinatura HMAC
- [x] Disparo de eventos
- [x] Sistema de retry
- [x] Logs de chamadas

### Integracoes Externas

- [x] Cliente Diario Oficial
- [ ] Cliente Transparencia Federal
- [ ] Cliente SAPL
- [ ] Cliente Prefeitura
- [x] Tratamento de erros
- [x] Logs de integracao

### Seguranca

- [x] API Keys
- [ ] OAuth 2.0
- [x] Validacao de entrada
- [x] Sanitizacao de saida
- [x] Credenciais em env

---

## Integracao com Outros Modulos

### skill-legislativo.md
- Dados de proposicoes para API
- Webhook de nova proposicao

### skill-operador.md
- Webhook de votacao
- Webhook de sessao

### skill-transparencia.md
- APIs de dados abertos
- Sincronizacao com Portal Federal

### skill-secretaria.md
- Publicacao no Diario
- Envio para Prefeitura
