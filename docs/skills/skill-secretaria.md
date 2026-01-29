# Skill: Secretaria

## Visao Geral

O modulo da Secretaria gerencia as operacoes administrativas do processo legislativo, incluindo protocolo de proposicoes, composicao de pautas, controle de tramitacao, notificacoes de prazo, geracao de atas e relatorios de producao legislativa.

---

## Arquivos Principais

| Arquivo | Funcao |
|---------|--------|
| `src/app/admin/proposicoes/` | Protocolo de proposicoes |
| `src/app/admin/pauta-sessoes/` | Composicao de pautas |
| `src/app/admin/tramitacoes/` | Acompanhamento de tramitacao |
| `src/app/admin/sessoes/nova/` | Wizard de criacao de sessao com pauta |
| `src/app/admin/configuracoes/fluxos-tramitacao/` | Configuracao de fluxos por tipo |
| `src/app/admin/configuracoes/prazos-urgencia/` | Configuracao de prazos globais |
| `src/lib/services/automacao-pautas-service.ts` | Sugestao automatica de pauta |
| `src/lib/services/regras-regimentais-service.ts` | Validacao regimental |
| `src/lib/services/tramitacao-service.ts` | Servico de tramitacao |
| `src/lib/services/fluxo-tramitacao-service.ts` | Servico de fluxos configuraveis |
| `src/components/admin/sessao-wizard/` | Componentes do wizard de sessao |
| `src/app/api/pautas/` | APIs de pauta |
| `src/app/api/atas/` | APIs de atas |
| `src/app/api/admin/configuracoes/fluxos-tramitacao/` | APIs de configuracao de fluxos |
| `src/app/api/proposicoes/elegiveis-pauta/` | API de proposicoes elegiveis |

---

## Modelos de Dados (Prisma)

### Model: PautaSessao

```prisma
model PautaSessao {
  id                  String              @id @default(cuid())
  versao              Int                 @default(1)
  publicada           Boolean             @default(false)
  dataPublicacao      DateTime?
  tempoEstimado       Int?                // Minutos
  observacoes         String?             @db.Text

  sessaoId            String              @unique
  sessao              Sessao              @relation(fields: [sessaoId])

  itens               PautaItem[]
}
```

### Model: PautaItem

```prisma
model PautaItem {
  id                  String              @id @default(cuid())
  ordem               Int
  secao               SecaoPauta          // EXPEDIENTE, ORDEM_DO_DIA, EXPLICACOES
  titulo              String?
  descricao           String?             @db.Text
  tempoEstimado       Int?                // Minutos
  status              StatusItemPauta     @default(PENDENTE)
  resultado           String?
  observacoes         String?

  pautaSessaoId       String
  pautaSessao         PautaSessao         @relation(fields: [pautaSessaoId])
  proposicaoId        String?
  proposicao          Proposicao?         @relation(fields: [proposicaoId])
}
```

### Model: Ata

```prisma
model Ata {
  id                  String              @id @default(cuid())
  numero              Int
  ano                 Int
  texto               String              @db.Text
  status              StatusAta           @default(RASCUNHO)
  dataGeracao         DateTime            @default(now())
  dataAprovacao       DateTime?
  dataPublicacao      DateTime?
  arquivoPdf          String?

  sessaoId            String              @unique
  sessao              Sessao              @relation(fields: [sessaoId])
}
```

### Model: Protocolo

```prisma
model Protocolo {
  id                  String              @id @default(cuid())
  numero              Int
  ano                 Int
  dataProtocolo       DateTime            @default(now())
  tipo                String              // PROPOSICAO, DOCUMENTO, REQUERIMENTO
  assunto             String
  interessado         String?
  observacoes         String?

  proposicaoId        String?             @unique
  proposicao          Proposicao?         @relation(fields: [proposicaoId])
}
```

### Model: FluxoTramitacao

```prisma
model FluxoTramitacao {
  id              String              @id @default(cuid())
  tipoProposicao  TipoProposicao      @unique
  nome            String
  descricao       String?             @db.Text
  ativo           Boolean             @default(true)
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt

  etapas          FluxoTramitacaoEtapa[]

  @@map("fluxos_tramitacao")
}
```

### Model: FluxoTramitacaoEtapa

```prisma
model FluxoTramitacaoEtapa {
  id                String                  @id @default(cuid())
  fluxoId           String
  ordem             Int
  nome              String
  descricao         String?                 @db.Text
  unidadeId         String?
  prazoDiasNormal   Int                     @default(15)
  prazoDiasUrgencia Int?
  requerParecer     Boolean                 @default(false)
  habilitaPauta     Boolean                 @default(false)  // Marca etapa que habilita inclusao na pauta
  ehEtapaFinal      Boolean                 @default(false)
  createdAt         DateTime                @default(now())
  updatedAt         DateTime                @updatedAt

  fluxo             FluxoTramitacao         @relation(fields: [fluxoId], references: [id], onDelete: Cascade)
  unidade           TramitacaoUnidade?      @relation(fields: [unidadeId], references: [id])
  tramitacoes       Tramitacao[]

  @@unique([fluxoId, ordem])
  @@map("fluxo_tramitacao_etapas")
}
```

### Model: ConfiguracaoTramitacao

```prisma
model ConfiguracaoTramitacao {
  id          String   @id @default(cuid())
  chave       String   @unique
  valor       String
  descricao   String?  @db.Text
  categoria   String?
  tipo        String   @default("string")
  ativo       Boolean  @default(true)
  editavel    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("configuracoes_tramitacao")
}
```

---

## Enums e Tipos

### SecaoPauta

```typescript
enum SecaoPauta {
  EXPEDIENTE          // Leitura de correspondencias e atas
  ORDEM_DO_DIA        // Proposicoes para votacao
  EXPLICACOES         // Explicacoes pessoais
}
```

### StatusItemPauta

```typescript
enum StatusItemPauta {
  PENDENTE            // Aguardando discussao
  EM_DISCUSSAO        // Discussao em andamento
  EM_VOTACAO          // Votacao em andamento
  APROVADO            // Aprovado
  REJEITADO           // Rejeitado
  ADIADO              // Adiado para outra sessao
  RETIRADO            // Retirado pelo autor
  PREJUDICADO         // Prejudicado por outra votacao
}
```

### StatusAta

```typescript
enum StatusAta {
  RASCUNHO            // Em elaboracao
  PRONTA              // Pronta para revisao
  APROVADA            // Aprovada em sessao
  PUBLICADA           // Publicada oficialmente
}
```

---

## APIs e Endpoints

### Protocolo

| Rota | Metodo | Funcionalidade | Roles |
|------|--------|----------------|-------|
| `/api/protocolo` | POST | Protocolar documento | SECRETARIA |
| `/api/protocolo/proposicao` | POST | Protocolar proposicao | SECRETARIA |
| `/api/protocolo/[numero]/[ano]` | GET | Consultar protocolo | SECRETARIA |

### Pautas

| Rota | Metodo | Funcionalidade | Roles |
|------|--------|----------------|-------|
| `/api/pautas` | GET | Listar pautas com dados da sessao, paginacao e filtro por status | pauta.view |
| `/api/pautas` | POST | Criar nova pauta vinculada a sessao existente | pauta.manage |
| `/api/pautas/sessoes-disponiveis` | GET | Listar sessoes sem pauta vinculada (para dropdown de vinculacao) | pauta.manage |
| `/api/pautas/sessao/[sessaoId]` | GET | Pauta de sessao | Publico |
| `/api/pautas/sessao/[sessaoId]` | PUT | Atualizar pauta | SECRETARIA |
| `/api/pautas/sessao/[sessaoId]/publicar` | POST | Publicar pauta | SECRETARIA |
| `/api/pautas/sessao/[sessaoId]/sugerir` | GET | Sugerir itens | SECRETARIA |
| `/api/pautas/sessao/[sessaoId]/validar` | POST | Validar item | SECRETARIA |
| `/api/pautas/sessao/[sessaoId]/tempo` | GET | Calcular tempo | SECRETARIA |

### Atas

| Rota | Metodo | Funcionalidade | Roles |
|------|--------|----------------|-------|
| `/api/atas` | GET | Listar atas | Publico |
| `/api/atas/sessao/[sessaoId]` | GET | Ata de sessao | Publico |
| `/api/atas/sessao/[sessaoId]` | POST | Gerar ata | SECRETARIA |
| `/api/atas/[id]/aprovar` | POST | Marcar aprovada | SECRETARIA |
| `/api/atas/[id]/publicar` | POST | Publicar ata | SECRETARIA |
| `/api/atas/[id]/pdf` | GET | Baixar PDF | Publico |

### Tramitacao

| Rota | Metodo | Funcionalidade | Roles |
|------|--------|----------------|-------|
| `/api/tramitacoes/pendentes` | GET | Com prazo vencendo | SECRETARIA |
| `/api/tramitacoes/vencidas` | GET | Prazos vencidos | SECRETARIA |
| `/api/tramitacoes/notificar` | POST | Enviar notificacoes | SECRETARIA |

### Fluxos de Tramitacao

| Rota | Metodo | Funcionalidade | Roles |
|------|--------|----------------|-------|
| `/api/admin/configuracoes/fluxos-tramitacao` | GET | Listar fluxos | ADMIN |
| `/api/admin/configuracoes/fluxos-tramitacao` | POST | Criar fluxo | ADMIN |
| `/api/admin/configuracoes/fluxos-tramitacao` | PUT | Atualizar fluxo | ADMIN |
| `/api/admin/configuracoes/fluxos-tramitacao` | DELETE | Excluir fluxo | ADMIN |
| `/api/admin/configuracoes/fluxos-tramitacao/[fluxoId]/etapas` | GET | Listar etapas | ADMIN |
| `/api/admin/configuracoes/fluxos-tramitacao/[fluxoId]/etapas` | POST | Adicionar etapa | ADMIN |
| `/api/admin/configuracoes/fluxos-tramitacao/[fluxoId]/etapas` | PUT | Atualizar etapa | ADMIN |
| `/api/admin/configuracoes/fluxos-tramitacao/[fluxoId]/etapas` | DELETE | Remover etapa | ADMIN |
| `/api/proposicoes/elegiveis-pauta` | GET | Proposicoes elegiveis | SECRETARIA |

---

## Servicos de Negocio

### automacao-pautas-service.ts

```typescript
interface SugestaoItem {
  proposicaoId: string
  proposicao: Proposicao
  prioridade: number
  motivo: string
  restricoes: string[]
}

// Sugere itens automaticamente por prioridade (RN-055)
async function sugerirItensPauta(
  sessaoId: string,
  tipoSessao: TipoSessao
): Promise<SugestaoItem[]>

// Criterios de prioridade:
// 1. Urgencia urgentissima (aprovada 2/3)
// 2. Urgencia (aprovada maioria absoluta)
// 3. Preferencia requerida
// 4. Vetos (prazo de 30 dias)
// 5. Segundo turno (intersticio cumprido)
// 6. Materias com parecer aprovado
// 7. Ordem cronologica de apresentacao
```

### regras-regimentais-service.ts

```typescript
interface ValidacaoRegimental {
  valido: boolean
  restricoes: string[]
  advertencias: string[]
}

// Valida item contra regras regimentais (RN-056)
async function validarItemRegimental(
  itemId: string,
  tipoSessao: TipoSessao
): Promise<ValidacaoRegimental>

// Validacoes:
// - Proposicao passou pela CLJ
// - Proposicao passou pela CFO (se necessario)
// - Intersticio de 10 dias para 2o turno
// - Nao e materia rejeitada na mesma sessao legislativa
// - Tipo de sessao permite a materia
```

### Calculo de Tempo

```typescript
interface ItemTempo {
  itemId: string
  titulo: string
  tempoEstimado: number // minutos
  motivo: string
}

// Calcula tempo estimado da pauta (RN-057)
async function calcularTempoEstimado(
  itens: PautaItem[]
): Promise<{ totalMinutos: number; detalhamento: ItemTempo[] }>

// Tempos base por tipo:
// - Votacao simples: 5 min
// - Votacao com discussao: 15 min
// - Materia complexa: 30 min
// - Segundo turno: 20 min
// - Veto: 25 min
```

### tramitacao-service.ts

```typescript
// Listar tramitacoes com prazo vencendo
async function listarPrazosVencendo(
  diasAntecedencia: number = 5
): Promise<Tramitacao[]>

// Listar tramitacoes com prazo vencido
async function listarPrazosVencidos(): Promise<Tramitacao[]>

// Enviar notificacoes de prazo
async function notificarPrazos(
  tramitacoes: Tramitacao[]
): Promise<{ enviadas: number; erros: string[] }>

// Prorrogar prazo (1x permitido por RN-032)
async function prorrogarPrazo(
  tramitacaoId: string,
  novoPrazo: Date,
  motivo: string
): Promise<Tramitacao>
```

### fluxo-tramitacao-service.ts

```typescript
// Retorna fluxo configurado para o tipo de proposicao
async function getFluxoByTipoProposicao(
  tipo: TipoProposicao
): Promise<FluxoTramitacao | null>

// Retorna proxima etapa do fluxo
async function getProximaEtapa(
  fluxoId: string,
  ordemAtual: number
): Promise<FluxoTramitacaoEtapa | null>

// Verifica se proposicao pode ser incluida na pauta (RN-058)
async function verificarElegibilidadePauta(
  proposicaoId: string
): Promise<{ elegivel: boolean; motivo?: string; etapaAtual?: string }>

// Lista todas as proposicoes elegiveis para pauta
async function listarProposicoesElegiveisPauta(): Promise<Proposicao[]>

// Cria fluxos padrao para todos os tipos de proposicao
async function criarFluxosPadrao(): Promise<void>

// Obtem configuracao de prazo por regime
async function getConfiguracaoPrazo(
  chave: string
): Promise<number>

// Salva configuracao de prazo
async function salvarConfiguracaoPrazo(
  chave: string,
  valor: string,
  descricao?: string
): Promise<ConfiguracaoTramitacao>
```

---

## Regras de Negocio

### Protocolo e Numeracao

| Regra | Descricao |
|-------|-----------|
| **RN-021** | Numeracao sequencial por tipo e ano (PL 001/2024) |
| **RN-030** | Todo documento recebe numero de protocolo |
| **RN-031** | Protocolo e imutavel apos registro |

### Composicao de Pauta

| Regra | Descricao |
|-------|-----------|
| **RN-050** | Pauta DEVE ser publicada 48h antes da sessao |
| **RN-051** | Ordem: urgencias, preferenciais, cronologica |
| **RN-052** | Item pode ser retirado ate inicio da votacao |
| **RN-053** | Inversao de pauta requer aprovacao do plenario |
| **RN-054** | Item adiado vai para proxima sessao |
| **RN-055** | Sistema sugere itens automaticamente |
| **RN-056** | Validacao regimental obrigatoria |
| **RN-057** | Tempo estimado calculado automaticamente |
| **RN-058** | Proposicao so vai para pauta se etapa tem `habilitaPauta = true` |
| **RN-059** | Prazos configuraveis por regime (normal, prioridade, urgencia) |

### Tramitacao

| Regra | Descricao |
|-------|-----------|
| **RN-030** | Toda proposicao DEVE passar pela CLJ |
| **RN-031** | Proposicoes com impacto orcamentario passam pela CFO |
| **RN-032** | Prazo de comissao: 15 dias uteis (prorrogavel 1x) |
| **RN-033** | Sistema notifica sobre prazos vencendo |
| **RN-034** | Prazo vencido: relatorio ao Presidente |

### Atas

| Regra | Descricao |
|-------|-----------|
| **RN-035** | Ata gerada automaticamente apos sessao |
| **RN-036** | Ata contem: presenca, pauta, votacoes, votos nominais |
| **RN-037** | Ata aprovada na sessao seguinte |
| **RN-123** | Ata publicada em 15 dias apos aprovacao (PNTP) |

---

## Fluxos Principais

### Fluxo de Protocolo de Proposicao

```
    SECRETARIA RECEBE
    PROPOSICAO
          |
          v
    +-------------------+
    | VERIFICAR         |
    | REQUISITOS        |
    | (RN-022)          |
    +-------------------+
          |
          +--------+--------+
          |                 |
          v                 v
      COMPLETO          INCOMPLETO
          |                 |
          v                 v
    +----------+        +----------+
    | GERAR    |        | DEVOLVER |
    | NUMERO   |        | AO AUTOR |
    +----------+        +----------+
          |
          v
    +-------------------+
    | GERAR PROTOCOLO   |
    | (numero/ano)      |
    +-------------------+
          |
          v
    +-------------------+
    | REGISTRAR         |
    | PROPOSICAO        |
    +-------------------+
          |
          v
    +-------------------+
    | DESPACHAR         |
    | PARA CLJ          |
    +-------------------+
          |
          v
    +-------------------+
    | NOTIFICAR         |
    | COMISSAO          |
    +-------------------+
```

### Fluxo de Composicao de Pauta

```
    SECRETARIA INICIA
    MONTAGEM DE PAUTA
          |
          v
    +-------------------+
    | SISTEMA SUGERE    |
    | ITENS (RN-055)    |
    | Por prioridade:   |
    | 1. Urgencias      |
    | 2. Preferenciais  |
    | 3. Vetos          |
    | 4. 2o turnos      |
    | 5. Com parecer    |
    | 6. Cronologico    |
    +-------------------+
          |
          v
    +-------------------+
    | SECRETARIA        |
    | SELECIONA ITENS   |
    +-------------------+
          |
          v
    +-------------------+
    | SISTEMA VALIDA    |
    | CADA ITEM         |
    | (RN-056)          |
    +-------------------+
          |
          +--------+--------+
          |                 |
          v                 v
      VALIDOS           INVALIDOS
          |                 |
          v                 v
    +----------+        +----------+
    | ADICIONAR|        | EXIBIR   |
    | A PAUTA  |        | RESTRICOES|
    +----------+        +----------+
          |
          v
    +-------------------+
    | ORDENAR           |
    | CONFORME REGIMENTO|
    | (RN-043)          |
    +-------------------+
          |
          v
    +-------------------+
    | CALCULAR          |
    | TEMPO ESTIMADO    |
    | (RN-057)          |
    +-------------------+
          |
          v
    +-------------------+
    | VERIFICAR         |
    | PRAZO 48H         |
    | (RN-050)          |
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
```

### Fluxo de Controle de Prazos

```
    SCHEDULER DIARIO
          |
          v
    +-------------------+
    | BUSCAR            |
    | TRAMITACOES       |
    | ATIVAS            |
    +-------------------+
          |
          v
    +-------------------+
    | CALCULAR          |
    | DIAS RESTANTES    |
    +-------------------+
          |
          +--------+--------+--------+
          |        |        |        |
          v        v        v        v
      > 5 DIAS  5 DIAS   VENCENDO  VENCIDO
          |        |        |        |
          v        v        v        v
      (NADA)   ALERTA   NOTIFICAR RELATORIO
                AMARELO  URGENTE   PRESIDENTE
          |        |        |        |
          +--------+--------+--------+
                   |
                   v
    +-------------------+
    | ENVIAR            |
    | NOTIFICACOES      |
    +-------------------+
          |
          v
    +-------------------+
    | REGISTRAR         |
    | LOG               |
    +-------------------+
```

### Fluxo de Geracao de Ata

```
    SESSAO ENCERRADA
          |
          v
    +-------------------+
    | COLETAR           |
    | DADOS DA SESSAO   |
    | - Data/hora       |
    | - Presencas       |
    | - Pauta executada |
    | - Votacoes        |
    | - Votos nominais  |
    +-------------------+
          |
          v
    +-------------------+
    | GERAR             |
    | TEXTO DA ATA      |
    +-------------------+
          |
          v
    +-------------------+
    | SALVAR COMO       |
    | RASCUNHO          |
    +-------------------+
          |
          v
    +-------------------+
    | SECRETARIA        |
    | REVISA E AJUSTA   |
    +-------------------+
          |
          v
    +-------------------+
    | MARCAR COMO       |
    | PRONTA            |
    +-------------------+
          |
          v
    +-------------------+
    | INCLUIR NA        |
    | PAUTA DA PROXIMA  |
    | SESSAO            |
    +-------------------+
          |
          v
    +-------------------+
    | APROVACAO         |
    | EM PLENARIO       |
    +-------------------+
          |
          +--------+--------+
          |                 |
          v                 v
      APROVADA          RETIFICADA
          |                 |
          v                 v
    +----------+        +----------+
    | GERAR    |        | CORRIGIR |
    | PDF      |        | E VOTAR  |
    +----------+        | NOVAMENTE|
          |             +----------+
          v
    +-------------------+
    | PUBLICAR          |
    | (15 dias - PNTP)  |
    +-------------------+
```

---

## Componentes React

### Protocolo

| Componente | Arquivo | Funcao |
|------------|---------|--------|
| ProtocoloForm | `src/app/admin/protocolo/page.tsx` | Formulario protocolo |
| ConsultaProtocolo | `src/app/admin/protocolo/consulta/page.tsx` | Buscar protocolo |
| ProtocoloRecibo | `src/components/admin/protocolo-recibo.tsx` | Comprovante |

### Pauta

| Componente | Arquivo | Funcao |
|------------|---------|--------|
| ComposicaoPauta | `src/app/admin/pauta-sessoes/[sessaoId]/page.tsx` | Montar pauta |
| SugestaoItens | `src/components/admin/sugestao-itens.tsx` | Itens sugeridos |
| ValidacaoItem | `src/components/admin/validacao-item.tsx` | Status validacao |
| OrdenacaoPauta | `src/components/admin/ordenacao-pauta.tsx` | Drag-and-drop |
| TempoEstimado | `src/components/admin/tempo-estimado.tsx` | Calculo tempo |
| PublicarPauta | `src/components/admin/publicar-pauta.tsx` | Botao publicar |

### Tramitacao

| Componente | Arquivo | Funcao |
|------------|---------|--------|
| PainelTramitacao | `src/app/admin/tramitacoes/page.tsx` | Visao geral |
| PrazosVencendo | `src/components/admin/prazos-vencendo.tsx` | Lista urgente |
| NotificacaoPrazo | `src/components/admin/notificacao-prazo.tsx` | Enviar alerta |
| HistoricoTramitacao | `src/components/admin/historico-tramitacao.tsx` | Timeline |

### Atas

| Componente | Arquivo | Funcao |
|------------|---------|--------|
| ListaAtas | `src/app/admin/atas/page.tsx` | Lista de atas |
| EditorAta | `src/app/admin/atas/[id]/page.tsx` | Editar ata |
| GerarAta | `src/components/admin/gerar-ata.tsx` | Geracao automatica |
| PreviewAta | `src/components/admin/preview-ata.tsx` | Visualizacao |

### Wizard de Sessao

| Componente | Arquivo | Funcao |
|------------|---------|--------|
| SessaoWizard | `src/components/admin/sessao-wizard/SessaoWizard.tsx` | Container do wizard |
| StepSessaoInfo | `src/components/admin/sessao-wizard/StepSessaoInfo.tsx` | Passo 1: Info da sessao |
| StepMontarPauta | `src/components/admin/sessao-wizard/StepMontarPauta.tsx` | Passo 2: Montar pauta |
| StepConfirmar | `src/components/admin/sessao-wizard/StepConfirmar.tsx` | Passo 3: Confirmar |
| ProposicaoSelector | `src/components/admin/sessao-wizard/ProposicaoSelector.tsx` | Seletor de proposicoes |

### Configuracao de Fluxos

| Componente | Arquivo | Funcao |
|------------|---------|--------|
| FluxosTramitacaoPage | `src/app/admin/configuracoes/fluxos-tramitacao/page.tsx` | Configurar fluxos |
| PrazosUrgenciaPage | `src/app/admin/configuracoes/prazos-urgencia/page.tsx` | Configurar prazos |

---

## Exemplos de Uso

### Exemplo 1: Protocolar Proposicao

```typescript
// POST /api/protocolo/proposicao

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!['SECRETARIA', 'EDITOR', 'ADMIN'].includes((session?.user as any)?.role)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const body = await request.json()

  // 1. Validar requisitos minimos (RN-022)
  const validacao = await ProposicaoValidacaoService.validarRequisitosMinimos(body)

  if (!validacao.valido) {
    return NextResponse.json({
      success: false,
      error: 'Requisitos incompletos',
      detalhes: validacao.erros
    }, { status: 400 })
  }

  // 2. Gerar numero da proposicao (RN-021)
  const numero = await ProposicaoValidacaoService.gerarNumeroProposicao(
    body.tipo,
    new Date().getFullYear()
  )

  // 3. Gerar numero de protocolo
  const numeroProtocolo = await gerarNumeroProtocolo(new Date().getFullYear())

  // 4. Criar proposicao
  const proposicao = await prisma.proposicao.create({
    data: {
      tipo: body.tipo,
      numero,
      ano: new Date().getFullYear(),
      ementa: body.ementa,
      texto: body.texto,
      justificativa: body.justificativa,
      autorId: body.autorId,
      status: 'APRESENTADA'
    }
  })

  // 5. Criar protocolo
  const protocolo = await prisma.protocolo.create({
    data: {
      numero: numeroProtocolo,
      ano: new Date().getFullYear(),
      tipo: 'PROPOSICAO',
      assunto: `${body.tipo} - ${body.ementa.substring(0, 100)}`,
      interessado: body.autorNome,
      proposicaoId: proposicao.id
    }
  })

  // 6. Criar tramitacao inicial para CLJ (RN-030)
  const clj = await prisma.comissao.findFirst({
    where: { sigla: 'CLJ', ativa: true }
  })

  if (clj) {
    await prisma.tramitacao.create({
      data: {
        proposicaoId: proposicao.id,
        orgaoDestinoId: clj.id,
        despacho: 'Para analise de constitucionalidade e legalidade',
        situacao: 'RECEBIDA',
        prazo: calcularPrazo(15) // 15 dias uteis
      }
    })
  }

  return NextResponse.json({
    success: true,
    data: {
      proposicao,
      protocolo,
      numeroCompleto: `${body.tipo} ${numero}/${proposicao.ano}`,
      protocoloNumero: `${numeroProtocolo}/${protocolo.ano}`
    }
  })
}

async function gerarNumeroProtocolo(ano: number): Promise<number> {
  const ultimo = await prisma.protocolo.findFirst({
    where: { ano },
    orderBy: { numero: 'desc' }
  })
  return (ultimo?.numero || 0) + 1
}

function calcularPrazo(diasUteis: number): Date {
  let data = new Date()
  let diasAdicionados = 0

  while (diasAdicionados < diasUteis) {
    data.setDate(data.getDate() + 1)
    if (data.getDay() !== 0 && data.getDay() !== 6) {
      diasAdicionados++
    }
  }

  return data
}
```

### Exemplo 2: Sugerir Itens de Pauta

```typescript
// GET /api/pautas/sessao/[sessaoId]/sugerir

import { AutomacaoPautasService } from '@/lib/services/automacao-pautas-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { sessaoId: string } }
) {
  const sessao = await prisma.sessao.findUnique({
    where: { id: params.sessaoId }
  })

  if (!sessao) {
    return NextResponse.json({ error: 'Sessao nao encontrada' }, { status: 404 })
  }

  const sugestoes = await AutomacaoPautasService.sugerirItensPauta(
    params.sessaoId,
    sessao.tipo
  )

  // Ordenar por prioridade
  const ordenadas = sugestoes.sort((a, b) => b.prioridade - a.prioridade)

  return NextResponse.json({
    success: true,
    data: {
      sugestoes: ordenadas,
      criterios: [
        { prioridade: 100, descricao: 'Urgencia urgentissima aprovada' },
        { prioridade: 90, descricao: 'Urgencia aprovada' },
        { prioridade: 80, descricao: 'Preferencia requerida' },
        { prioridade: 70, descricao: 'Veto (prazo 30 dias)' },
        { prioridade: 60, descricao: 'Segundo turno (intersticio ok)' },
        { prioridade: 50, descricao: 'Com parecer aprovado' },
        { prioridade: 40, descricao: 'Ordem cronologica' }
      ]
    }
  })
}
```

### Exemplo 3: Validar Item de Pauta

```typescript
// POST /api/pautas/sessao/[sessaoId]/validar

import { RegrasRegimentaisService } from '@/lib/services/regras-regimentais-service'

export async function POST(
  request: NextRequest,
  { params }: { params: { sessaoId: string } }
) {
  const { proposicaoId } = await request.json()

  const sessao = await prisma.sessao.findUnique({
    where: { id: params.sessaoId }
  })

  const proposicao = await prisma.proposicao.findUnique({
    where: { id: proposicaoId },
    include: {
      tramitacoes: {
        include: { orgaoDestino: true }
      },
      votacoes: true
    }
  })

  if (!sessao || !proposicao) {
    return NextResponse.json({ error: 'Dados nao encontrados' }, { status: 404 })
  }

  const validacao = await RegrasRegimentaisService.validarItemRegimental(
    proposicaoId,
    sessao.tipo
  )

  // Verificacoes especificas
  const restricoes: string[] = []
  const advertencias: string[] = []

  // 1. Verificar CLJ (RN-030)
  const passouCLJ = proposicao.tramitacoes.some(
    t => t.orgaoDestino.sigla === 'CLJ' && t.parecer
  )

  if (!passouCLJ) {
    restricoes.push('Proposicao nao possui parecer da CLJ')
  }

  // 2. Verificar CFO se impacto orcamentario (RN-031)
  const temImpactoOrcamentario = verificarImpactoOrcamentario(proposicao)
  if (temImpactoOrcamentario) {
    const passouCFO = proposicao.tramitacoes.some(
      t => t.orgaoDestino.sigla === 'CFO' && t.parecer
    )
    if (!passouCFO) {
      restricoes.push('Proposicao com impacto orcamentario sem parecer da CFO')
    }
  }

  // 3. Verificar intersticio para 2o turno (RN-074)
  if (proposicao.turnoAtual === 2) {
    const votacao1Turno = proposicao.votacoes.find(v => v.turno === 1)
    if (votacao1Turno) {
      const diasDesde = Math.floor(
        (Date.now() - votacao1Turno.dataFim!.getTime()) / (1000 * 60 * 60 * 24)
      )
      if (diasDesde < 10) {
        restricoes.push(`Intersticio de 10 dias nao cumprido (${diasDesde} dias)`)
      }
    }
  }

  // 4. Verificar se nao foi rejeitada na mesma sessao legislativa (RN-070)
  if (proposicao.status === 'REJEITADA') {
    restricoes.push('Materia rejeitada so pode ser reapresentada na proxima sessao legislativa')
  }

  return NextResponse.json({
    success: true,
    data: {
      valido: restricoes.length === 0,
      restricoes,
      advertencias,
      proposicao: {
        id: proposicao.id,
        tipo: proposicao.tipo,
        numero: proposicao.numero,
        ano: proposicao.ano,
        ementa: proposicao.ementa,
        turno: proposicao.turnoAtual
      }
    }
  })
}
```

### Exemplo 4: Gerar Ata Automaticamente

```typescript
// POST /api/atas/sessao/[sessaoId]

export async function POST(
  request: NextRequest,
  { params }: { params: { sessaoId: string } }
) {
  const sessao = await prisma.sessao.findUnique({
    where: { id: params.sessaoId },
    include: {
      presencas: {
        include: { parlamentar: true }
      },
      votacoes: {
        include: {
          proposicao: true,
          votos: {
            include: { parlamentar: true }
          }
        }
      },
      pautas: {
        include: {
          itens: {
            include: { proposicao: true },
            orderBy: { ordem: 'asc' }
          }
        }
      },
      legislatura: true
    }
  })

  if (!sessao) {
    return NextResponse.json({ error: 'Sessao nao encontrada' }, { status: 404 })
  }

  if (sessao.status !== 'CONCLUIDA') {
    return NextResponse.json({ error: 'Sessao ainda nao foi concluida' }, { status: 400 })
  }

  // Gerar texto da ata
  const textoAta = gerarTextoAta(sessao)

  // Gerar numero da ata
  const numeroAta = await gerarNumeroAta(new Date().getFullYear())

  // Criar ata
  const ata = await prisma.ata.create({
    data: {
      numero: numeroAta,
      ano: new Date().getFullYear(),
      texto: textoAta,
      status: 'RASCUNHO',
      sessaoId: sessao.id
    }
  })

  return NextResponse.json({
    success: true,
    data: {
      ata,
      numeroCompleto: `Ata ${numeroAta}/${ata.ano}`
    }
  })
}

function gerarTextoAta(sessao: any): string {
  const presentes = sessao.presencas
    .filter((p: any) => p.tipo === 'PRESENTE')
    .map((p: any) => p.parlamentar.apelido || p.parlamentar.nome)

  const ausentes = sessao.presencas
    .filter((p: any) => p.tipo === 'AUSENTE')
    .map((p: any) => p.parlamentar.apelido || p.parlamentar.nome)

  let texto = `
ATA DA ${sessao.numero}a SESSAO ${sessao.tipo.toUpperCase()}
DA ${sessao.legislatura?.numero}a LEGISLATURA

Aos ${formatarData(sessao.dataHora)}, as ${formatarHora(sessao.dataHora)},
no Plenario da Camara Municipal de Mojui dos Campos, reuniram-se os
Vereadores abaixo relacionados para a realizacao da ${sessao.numero}a
Sessao ${sessao.tipo} da ${sessao.legislatura?.numero}a Legislatura.

PRESENTES: ${presentes.join(', ')}.

${ausentes.length > 0 ? `AUSENTES: ${ausentes.join(', ')}.` : ''}

ORDEM DOS TRABALHOS:
`

  // Itens da pauta
  const pauta = sessao.pautas[0]
  if (pauta) {
    pauta.itens.forEach((item: any, index: number) => {
      texto += `\n${index + 1}. ${item.titulo || item.proposicao?.ementa}`
      if (item.resultado) {
        texto += ` - ${item.resultado}`
      }
    })
  }

  // Votacoes nominais
  texto += '\n\nVOTACOES NOMINAIS:\n'

  sessao.votacoes
    .filter((v: any) => v.tipo === 'NOMINAL')
    .forEach((votacao: any) => {
      texto += `\n${votacao.proposicao?.tipo} ${votacao.proposicao?.numero}/${votacao.proposicao?.ano}`
      texto += ` - ${votacao.resultado}`
      texto += `\nSIM (${votacao.votosSim}): ${votacao.votos.filter((v: any) => v.valor === 'SIM').map((v: any) => v.parlamentar.apelido).join(', ')}`
      texto += `\nNAO (${votacao.votosNao}): ${votacao.votos.filter((v: any) => v.valor === 'NAO').map((v: any) => v.parlamentar.apelido).join(', ')}`
      if (votacao.abstencoes > 0) {
        texto += `\nABSTENCOES (${votacao.abstencoes}): ${votacao.votos.filter((v: any) => v.valor === 'ABSTENCAO').map((v: any) => v.parlamentar.apelido).join(', ')}`
      }
      texto += '\n'
    })

  texto += `\nNada mais havendo a tratar, o Presidente encerrou a sessao
as ${formatarHora(sessao.dataEncerramento)}.

Mojui dos Campos, ${formatarData(sessao.dataHora)}.

_______________________________
Presidente

_______________________________
1o Secretario
`

  return texto
}
```

### Exemplo 5: Monitorar Prazos

```typescript
// GET /api/tramitacoes/pendentes

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const diasAntecedencia = parseInt(searchParams.get('dias') || '5')

  const dataLimite = new Date()
  dataLimite.setDate(dataLimite.getDate() + diasAntecedencia)

  const tramitacoes = await prisma.tramitacao.findMany({
    where: {
      dataSaida: null, // Ainda em andamento
      prazo: {
        lte: dataLimite,
        gte: new Date() // Ainda nao vencido
      }
    },
    include: {
      proposicao: {
        select: {
          tipo: true,
          numero: true,
          ano: true,
          ementa: true
        }
      },
      orgaoDestino: {
        select: {
          nome: true,
          sigla: true
        }
      }
    },
    orderBy: {
      prazo: 'asc'
    }
  })

  const categorizadas = tramitacoes.map(t => {
    const diasRestantes = Math.ceil(
      (t.prazo!.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )

    return {
      ...t,
      diasRestantes,
      urgencia: diasRestantes <= 2 ? 'CRITICA'
        : diasRestantes <= 5 ? 'ALTA'
        : 'NORMAL'
    }
  })

  return NextResponse.json({
    success: true,
    data: {
      tramitacoes: categorizadas,
      resumo: {
        total: categorizadas.length,
        criticas: categorizadas.filter(t => t.urgencia === 'CRITICA').length,
        altas: categorizadas.filter(t => t.urgencia === 'ALTA').length,
        normais: categorizadas.filter(t => t.urgencia === 'NORMAL').length
      }
    }
  })
}
```

---

## Checklist de Implementacao

### Protocolo

- [x] Numeracao automatica
- [x] Geracao de protocolo
- [x] Comprovante de protocolo
- [x] Consulta por numero

### Pauta

- [x] Sugestao automatica de itens
- [x] Validacao regimental
- [x] Calculo de tempo estimado
- [x] Ordenacao por regimento
- [x] Verificacao prazo 48h
- [x] Publicacao
- [x] Wizard de criacao de sessao com pauta
- [x] Validacao de elegibilidade (RN-058)

### Tramitacao

- [x] Acompanhamento de prazos
- [x] Notificacoes automaticas
- [x] Prorrogacao de prazo
- [x] Relatorio de vencidos
- [x] Fluxos configuraveis por tipo de proposicao
- [x] Configuracao de prazos por regime de urgencia
- [x] Etapas com flag habilitaPauta

### Atas

- [x] Geracao automatica
- [x] Editor de revisao
- [x] Aprovacao em sessao
- [x] Geracao de PDF
- [x] Publicacao (15 dias)

---

## Integracao com Outros Modulos

### skill-legislativo.md
- Proposicoes protocoladas
- Tramitacao entre comissoes
- Status de proposicoes

### skill-operador.md
- Pauta para sessao
- Resultados para ata

### skill-comissoes.md
- Distribuicao a comissoes
- Pareceres para pauta

### skill-transparencia.md
- Publicacao de pautas (48h)
- Publicacao de atas (15 dias)
