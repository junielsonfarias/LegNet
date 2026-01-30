# Skill: Processo Legislativo

## Visao Geral

O processo legislativo e o conjunto de atos ordenados para a criacao de normas juridicas municipais. Este modulo gerencia todo o ciclo de vida das proposicoes, desde a iniciativa ate a publicacao da lei, incluindo tramitacao, votacao, sancao e veto.

---

## Arquivos Principais

| Arquivo | Funcao |
|---------|--------|
| `prisma/schema.prisma` | Modelos: Proposicao, Tramitacao, Emenda, Parecer, PautaSessao |
| `src/lib/services/proposicao-validacao-service.ts` | Validacoes de iniciativa, requisitos, emendas |
| `src/lib/services/tramitacao-service.ts` | Gerenciamento de tramitacao entre orgaos |
| `src/lib/services/automacao-pautas-service.ts` | Sugestao automatica de itens de pauta |
| `src/lib/services/votacao-service.ts` | Calculo de quorum e apuracao de votos |
| `src/app/admin/proposicoes/` | CRUD de proposicoes |
| `src/app/admin/emendas/` | Gestao de emendas |
| `src/app/admin/tramitacoes/` | Acompanhamento de tramitacao |
| `src/app/api/proposicoes/` | API REST de proposicoes |

---

## Modelos de Dados (Prisma)

### Model: Proposicao

```prisma
model Proposicao {
  id                  String              @id @default(cuid())
  tipo                TipoProposicao      // PL, PR, PD, IND, REQ, MOC, VP, VA
  numero              Int
  ano                 Int
  ementa              String              @db.Text
  texto               String?             @db.Text
  justificativa       String?             @db.Text
  status              StatusProposicao    @default(APRESENTADA)
  dataApresentacao    DateTime            @default(now())
  dataPublicacao      DateTime?
  dataSancao          DateTime?
  dataPromulgacao     DateTime?
  dataVigencia        DateTime?
  turnoAtual          Int                 @default(1)
  turnoMaximo         Int                 @default(1)

  // Relacionamentos
  autorId             String?
  autor               Parlamentar?        @relation("ProposicoesAutoria")
  comissaoOrigemId    String?
  comissaoOrigem      Comissao?           @relation("ProposicoesComissao")
  legislaturaId       String?
  legislatura         Legislatura?

  tramitacoes         Tramitacao[]
  emendas             Emenda[]
  votacoes            Votacao[]
  pautaItens          PautaItem[]
  pareceres           Parecer[]
}
```

**Campos importantes**:
- `tipo`: Tipo da proposicao (PL, PR, PD, etc.)
- `status`: Estado atual no fluxo legislativo
- `turnoAtual`/`turnoMaximo`: Controle de votacao em turnos

### Model: Emenda

```prisma
model Emenda {
  id                  String              @id @default(cuid())
  tipo                TipoEmenda          // ADITIVA, MODIFICATIVA, SUPRESSIVA, SUBSTITUTIVA, AGLUTINATIVA, SUBEMENDA
  numero              Int
  texto               String              @db.Text
  justificativa       String?             @db.Text
  status              StatusEmenda        @default(APRESENTADA)
  dataApresentacao    DateTime            @default(now())

  proposicaoId        String
  proposicao          Proposicao          @relation(fields: [proposicaoId])
  autorId             String
  autor               Parlamentar         @relation(fields: [autorId])

  votacoes            Votacao[]
}
```

### Model: Tramitacao

```prisma
model Tramitacao {
  id                  String              @id @default(cuid())
  dataEntrada         DateTime            @default(now())
  dataSaida           DateTime?
  despacho            String?             @db.Text
  parecer             String?             @db.Text
  situacao            String              // RECEBIDA, EM_ANALISE, DEVOLVIDA, ARQUIVADA
  prazo               DateTime?

  proposicaoId        String
  proposicao          Proposicao          @relation(fields: [proposicaoId])
  orgaoOrigemId       String?
  orgaoOrigem         OrgaoLegislativo?   @relation("TramitacoesOrigem")
  orgaoDestinoId      String
  orgaoDestino        OrgaoLegislativo    @relation("TramitacoesDestino")
}
```

### Model: Parecer

```prisma
model Parecer {
  id                  String              @id @default(cuid())
  numero              Int
  ano                 Int
  tipo                TipoParecer         // FAVORAVEL, CONTRARIO, COM_RESSALVAS, PELA_PREJUDICIALIDADE
  texto               String              @db.Text
  votoRelator         String?             @db.Text
  dataEmissao         DateTime            @default(now())

  proposicaoId        String
  proposicao          Proposicao          @relation(fields: [proposicaoId])
  comissaoId          String
  comissao            Comissao            @relation(fields: [comissaoId])
  relatorId           String
  relator             Parlamentar         @relation(fields: [relatorId])
  pautaItens          PautaItem[]         // Itens de pauta vinculados
}
```

### Model: PautaItem

```prisma
model PautaItem {
  id             String          @id @default(cuid())
  pautaId        String
  secao          PautaSecao      // EXPEDIENTE, ORDEM_DO_DIA, COMUNICACOES, HONRAS, OUTROS
  ordem          Int
  titulo         String
  descricao      String?         @db.Text
  proposicaoId   String?
  tempoEstimado  Int?
  tempoReal      Int?
  status         PautaItemStatus @default(PENDENTE)
  tipoAcao       TipoAcaoPauta   @default(VOTACAO)  // LEITURA, DISCUSSAO, VOTACAO, COMUNICADO, HOMENAGEM
  autor          String?
  observacoes    String?         @db.Text

  // === CAMPOS DE ETAPA E LEITURA ===
  etapa           Int?              // Sub-etapa: 1 = "1ª Ordem do Dia" (leituras), 2 = "2ª Ordem do Dia" (votações)
  parecerId       String?           // Referência ao parecer da comissão vinculado
  leituraNumero   Int?              // Número da leitura (1ª, 2ª, 3ª leitura)
  relatorId       String?           // Relator designado para o item

  // Relacionamentos
  pauta       PautaSessao  @relation(fields: [pautaId], references: [id], onDelete: Cascade)
  proposicao  Proposicao?  @relation(fields: [proposicaoId], references: [id], onDelete: SetNull)
  parecer     Parecer?     @relation(fields: [parecerId], references: [id], onDelete: SetNull)
  relator     Parlamentar? @relation("PautaItemRelator", fields: [relatorId], references: [id], onDelete: SetNull)
}
```

**Campos importantes**:
- `secao`: Secao da sessao (EXPEDIENTE, ORDEM_DO_DIA, etc.)
- `tipoAcao`: Acao do item (LEITURA, VOTACAO, etc.)
- `etapa`: Subetapa da Ordem do Dia (1 = leituras, 2 = votacoes)
- `leituraNumero`: Indica se e 1ª, 2ª ou 3ª leitura
- `parecerId`: Parecer de comissao vinculado ao item
- `relatorId`: Parlamentar relator designado

---

## Enums e Tipos

### TipoProposicao

```typescript
enum TipoProposicao {
  PROJETO_LEI           = "PL"    // Projeto de Lei Ordinaria
  PROJETO_LEI_COMP      = "PLC"   // Projeto de Lei Complementar
  PROJETO_RESOLUCAO     = "PR"    // Projeto de Resolucao
  PROJETO_DECRETO_LEG   = "PD"    // Projeto de Decreto Legislativo
  INDICACAO             = "IND"   // Indicacao
  REQUERIMENTO          = "REQ"   // Requerimento
  MOCAO                 = "MOC"   // Mocao
  VETO_PARCIAL          = "VP"    // Veto Parcial
  VETO_TOTAL            = "VA"    // Veto Total (Arquivamento)
}
```

### StatusProposicao

```typescript
enum StatusProposicao {
  APRESENTADA           // Proposicao recebida
  EM_TRAMITACAO         // Em analise nas comissoes
  EM_PAUTA              // Incluida em pauta de sessao
  EM_VOTACAO            // Votacao em andamento
  APROVADA_1_TURNO      // Aprovada em primeiro turno
  APROVADA              // Aprovada em votacao final
  REJEITADA             // Rejeitada pela casa
  AGUARDANDO_SANCAO     // Enviada ao Executivo
  SANCIONADA            // Sancionada pelo Prefeito
  VETADA                // Vetada pelo Prefeito
  VETO_REJEITADO        // Veto derrubado pelo Legislativo
  PROMULGADA            // Promulgada pelo Presidente
  VIGENTE               // Em vigor
  ARQUIVADA             // Arquivada
}
```

### TipoEmenda

```typescript
enum TipoEmenda {
  ADITIVA       // Acrescenta dispositivo
  MODIFICATIVA  // Altera dispositivo existente
  SUPRESSIVA    // Remove dispositivo
  SUBSTITUTIVA  // Substitui todo o texto
  AGLUTINATIVA  // Funde emendas anteriores
  SUBEMENDA     // Emenda a outra emenda
}
```

### StatusEmenda

```typescript
enum StatusEmenda {
  APRESENTADA
  EM_ANALISE
  PARECER_FAVORAVEL
  PARECER_CONTRARIO
  APROVADA
  REJEITADA
  PREJUDICADA
  RETIRADA
  ARQUIVADA
}
```

---

## APIs e Endpoints

### Proposicoes

| Rota | Metodo | Funcionalidade | Roles |
|------|--------|----------------|-------|
| `/api/proposicoes` | GET | Listar proposicoes com filtros | Publico |
| `/api/proposicoes` | POST | Criar nova proposicao (auto-inicia tramitacao) | EDITOR, ADMIN |
| `/api/proposicoes/[id]` | GET | Obter proposicao por ID | Publico |
| `/api/proposicoes/[id]` | PUT | Atualizar proposicao | EDITOR, ADMIN |
| `/api/proposicoes/[id]` | DELETE | Excluir proposicao | ADMIN |
| `/api/proposicoes/[id]/tramitar` | GET | Obter etapa atual da tramitacao | proposicao.view |
| `/api/proposicoes/[id]/tramitar` | POST | Avancar para proxima etapa | tramitacao.manage |
| `/api/proposicoes/[id]/tramitacoes` | GET | Historico de tramitacao | Publico |
| `/api/proposicoes/[id]/emendas` | GET | Listar emendas | Publico |
| `/api/proposicoes/[id]/votos` | GET | Resultado de votacoes | Publico |

### Emendas

| Rota | Metodo | Funcionalidade | Roles |
|------|--------|----------------|-------|
| `/api/emendas` | GET | Listar emendas | Publico |
| `/api/emendas` | POST | Criar emenda | PARLAMENTAR, EDITOR |
| `/api/emendas/[id]` | GET | Obter emenda por ID | Publico |
| `/api/emendas/[id]` | PUT | Atualizar emenda | EDITOR, ADMIN |
| `/api/emendas/[id]/parecer` | POST | Emitir parecer | EDITOR |

### Tramitacoes

| Rota | Metodo | Funcionalidade | Roles |
|------|--------|----------------|-------|
| `/api/tramitacoes` | GET | Listar tramitacoes | Publico |
| `/api/tramitacoes` | POST | Registrar tramitacao | SECRETARIA, EDITOR |
| `/api/tramitacoes/[id]` | PUT | Atualizar tramitacao | SECRETARIA, EDITOR |
| `/api/tramitacoes/pendentes` | GET | Tramitacoes com prazo vencendo | SECRETARIA |

### Votacoes e Lancamento Retroativo

| Rota | Metodo | Funcionalidade | Roles |
|------|--------|----------------|-------|
| `/api/sessoes/[id]/votacao` | GET | Listar votos da sessao | Publico |
| `/api/sessoes/[id]/votacao` | POST | Registrar voto individual | PARLAMENTAR, OPERADOR |
| `/api/sessoes/[id]/votacao/lote` | POST | Registrar votos em lote (retroativo) | sessao.manage |

**Notas sobre Lancamento Retroativo:**
- Disponivel apenas para sessoes com status CONCLUIDA
- Requer motivo obrigatorio (campo `motivo`)
- Valida que parlamentares estavam presentes na sessao
- Registra auditoria completa (RN-078)
- Atualiza Proposicao.status automaticamente (RN-074)

---

## Servicos de Negocio

### proposicao-validacao-service.ts

```typescript
// Valida iniciativa privativa do Executivo (RN-020)
async function validarIniciativaPrivativa(
  tipoProposicao: TipoProposicao,
  materias: string[],
  autorId: string
): Promise<{ valido: boolean; motivo?: string }>

// Gera numero sequencial por tipo e ano (RN-021)
async function gerarNumeroProposicao(
  tipo: TipoProposicao,
  ano: number
): Promise<number>

// Valida requisitos minimos da proposicao (RN-022)
async function validarRequisitosMinimos(
  proposicao: ProposicaoInput
): Promise<{ valido: boolean; erros: string[] }>

// Verifica se existe materia analoga em tramitacao (RN-023)
async function verificarMateriaAnaloga(
  ementa: string,
  tipo: TipoProposicao
): Promise<{ existe: boolean; similares: Proposicao[] }>

// Valida emenda quanto a pertinencia tematica (RN-024)
async function validarEmenda(
  emenda: EmendaInput,
  proposicao: Proposicao
): Promise<{ valido: boolean; motivo?: string }>

// Valida inclusao na ordem do dia (RN-030)
async function validarInclusaoOrdemDoDia(
  proposicaoId: string
): Promise<{ valido: boolean; pendencias: string[] }>
```

### tramitacao-service.ts

```typescript
// Avanca proposicao para proxima etapa do fluxo de tramitacao
// RN-035: Toda movimentacao registrada com usuario, IP, dados anteriores/novos
async function avancarEtapaFluxo(
  proposicaoId: string,
  observacoes?: string,
  parecer?: TipoParecer,
  resultado?: TramitacaoResultado,
  usuarioId?: string,
  ip?: string
): Promise<AvancarEtapaResult>

// Inicia tramitacao vinculada a fluxo configurado
async function iniciarTramitacaoComFluxo(
  proposicaoId: string,
  fluxoId: string,
  etapaInicialId: string,
  regime?: RegimeTramitacao,
  usuarioId?: string,
  ip?: string
): Promise<ValidationResult & { tramitacaoId?: string }>

// Registra nova tramitacao com auditoria completa
async function registrarMovimentacaoComAuditoria(
  data: TramitacaoData & {
    usuarioId?: string
    ip?: string
    dadosAnteriores?: Record<string, unknown>
  }
): Promise<ValidationResult & { tramitacaoId?: string }>

// Obtem etapa atual da tramitacao
async function obterEtapaAtual(
  proposicaoId: string
): Promise<{ tramitacao?, etapa?, fluxo? } | null>

// Registra nova tramitacao (legado)
async function registrarTramitacao(
  proposicaoId: string,
  orgaoDestinoId: string,
  despacho?: string
): Promise<Tramitacao>

// Finaliza tramitacao com parecer (legado)
async function finalizarTramitacao(
  tramitacaoId: string,
  parecer: string,
  situacao: string
): Promise<Tramitacao>

// Verifica prazos de tramitacao
async function verificarPrazos(): Promise<TramitacaoVencida[]>

// Distribui para relator
async function distribuirRelator(
  tramitacaoId: string,
  relatorId: string
): Promise<Tramitacao>

// Verifica passagem obrigatoria pela CLJ (RN-030)
async function verificarPassagemCLJ(
  proposicaoId: string
): Promise<boolean>
```

### automacao-pautas-service.ts

```typescript
// Sugere itens para pauta automaticamente (RN-055)
async function sugerirItensPauta(
  sessaoId: string,
  tipoSessao: TipoSessao
): Promise<SugestaoItem[]>

// Valida item contra regras regimentais (RN-056)
async function validarItemRegimental(
  itemId: string,
  tipoSessao: TipoSessao
): Promise<{ valido: boolean; restricoes: string[] }>

// Calcula tempo estimado da pauta (RN-057)
async function calcularTempoEstimado(
  itens: PautaItem[]
): Promise<{ totalMinutos: number; detalhamento: ItemTempo[] }>

// Ordena itens conforme regimento (RN-043)
async function ordenarItensRegimentalmente(
  itens: PautaItem[]
): Promise<PautaItem[]>
```

### sessao-controle.ts (Votacao e Retroativo)

```typescript
// Sincroniza status da proposicao com o item da pauta (RN-074)
async function sincronizarStatusProposicao(
  proposicaoId: string,
  pautaItemStatus: string,
  sessaoId?: string
): Promise<void>

// Contabiliza votos de uma proposicao
async function contabilizarVotos(
  proposicaoId: string,
  options?: {
    tipoProposicao?: string
    regimeUrgencia?: boolean
    isDerrubadaVeto?: boolean
    sessaoId?: string
  }
): Promise<{
  sim: number
  nao: number
  abstencao: number
  total: number
  resultado: 'APROVADA' | 'REJEITADA' | 'EMPATE'
  detalhesQuorum?: string
}>

// Inicia votacao de item (validando quorum)
async function iniciarVotacaoItem(
  sessaoId: string,
  itemId: string
): Promise<PautaItem>

// Finaliza item da pauta com resultado
async function finalizarItemPauta(
  sessaoId: string,
  itemId: string,
  resultado: 'CONCLUIDO' | 'APROVADO' | 'REJEITADO' | 'RETIRADO' | 'ADIADO',
  observacoes?: string
): Promise<PautaItem>
```

---

## Regras de Negocio

### Principios Fundamentais

| Regra | Descricao |
|-------|-----------|
| **RN-001** | PUBLICIDADE - Todo ato legislativo DEVE ser publico |
| **RN-002** | LEGALIDADE - Respeitar Lei Organica e Regimento Interno |
| **RN-003** | RASTREABILIDADE - Todo ato com data, hora, usuario |
| **RN-004** | INTEGRIDADE - Documentos oficiais NAO alterados apos publicacao |

### Fases do Processo Legislativo

| Regra | Descricao |
|-------|-----------|
| **RN-010** | Fases: INICIATIVA -> DISCUSSAO -> VOTACAO -> SANCAO/VETO -> PROMULGACAO -> PUBLICACAO |
| **RN-011** | Nem toda proposicao passa por todas as fases (ex: requerimentos) |
| **RN-012** | Cada tipo de proposicao tem fluxo especifico definido |
| **RN-013** | Arquivamento pode ocorrer em qualquer fase por motivo justificado |

### Iniciativa e Proposicoes

| Regra | Descricao |
|-------|-----------|
| **RN-020** | Iniciativa PRIVATIVA do Executivo: servidores, orgaos, orcamento |
| **RN-021** | Numeracao sequencial por tipo e ano (PL 001/2024) |
| **RN-022** | Requisitos minimos: ementa, texto, justificativa (exceto requerimentos) |
| **RN-023** | Sistema DEVE alertar sobre materia analoga em tramitacao |
| **RN-024** | Emendas DEVEM ter pertinencia tematica com a proposicao |
| **RN-025** | Substitutivo SUBSTITUI integralmente o texto original |

### Tramitacao

| Regra | Descricao |
|-------|-----------|
| **RN-030** | Toda proposicao DEVE passar pela CLJ antes da votacao. **Validacao BLOQUEANTE** ao mover para ORDEM_DO_DIA |
| **RN-031** | Proposicoes com impacto orcamentario DEVEM passar pela CFO |
| **RN-032** | Prazo de comissao: 15 dias uteis (prorrogavel 1x) |
| **RN-033** | Parecer DEVE conter voto do relator e fundamentacao |
| **RN-034** | Voto em separado PODE ser apresentado por membro discordante |
| **RN-035** | Toda movimentacao DEVE ser registrada com data, usuario, IP, dados anteriores/novos |
| **RN-036** | Urgencia urgentissima: votacao na mesma sessao (2/3 para aprovar) |
| **RN-037** | Preferencia altera ordem de votacao na pauta |
| **RN-057** | Proposicao so pode ser incluida na pauta se estiver em etapa que habilita (habilitaPauta=true) |

### Pauta de Sessao e Ordem do Dia

| Regra | Descricao |
|-------|-----------|
| **RN-058** | Campo `etapa` so e valido para secao ORDEM_DO_DIA |
| **RN-059** | Etapa 1 = 1ª Ordem do Dia (leitura de materias e pareceres) |
| **RN-060-PAUTA** | Etapa 2 = 2ª Ordem do Dia (discussao e votacao) |
| **RN-061-PAUTA** | Default: etapa=1 para tipoAcao LEITURA, etapa=2 para VOTACAO/DISCUSSAO |
| **RN-062-PAUTA** | `leituraNumero` indica qual leitura (1ª, 2ª, 3ª) da materia |
| **RN-063-PAUTA** | `relatorId` deve ser parlamentar com mandato ativo |
| **RN-064** | Etapa 1 NAO permite tipoAcao VOTACAO |
| **RN-065** | Etapa 2 NAO permite tipoAcao LEITURA |

### Itens Informativos (Sem Votacao)

| Regra | Descricao |
|-------|-----------|
| **RN-067-INFO** | Tipos de acao: VOTACAO, DISCUSSAO, LEITURA, COMUNICADO, HOMENAGEM |
| **RN-068-INFO** | Itens LEITURA, COMUNICADO, HOMENAGEM sao informativos (nao precisam votacao) |
| **RN-069-INFO** | Itens informativos devem ser marcados como CONCLUIDO apos apresentacao |

**Fluxo de Itens Informativos**:

```
PENDENTE -> (iniciar) -> EM_DISCUSSAO -> (concluir) -> CONCLUIDO
                              |
                    Label no painel:
                    - LEITURA -> "EM LEITURA"
                    - COMUNICADO -> "COMUNICACAO"
                    - HOMENAGEM -> "HOMENAGEM"
```

### Votacao

| Regra | Descricao |
|-------|-----------|
| **RN-066** | Quorum de VOTACAO por tipo: maioria simples, absoluta, 2/3, 3/5 |
| **RN-067** | Votacao NOMINAL obrigatoria para: LOM, LC, vetos, 2o turno |
| **RN-068** | Votacao SIMBOLICA permitida para materias ordinarias |
| **RN-069** | Parlamentar NAO pode votar em causa propria ou de parente |
| **RN-070** | Materia rejeitada so pode ser reapresentada na proxima sessao legislativa |
| **RN-074** | Dois turnos OBRIGATORIOS para LOM, LC com intersticio minimo de 10 dias |
| **RN-075** | Primeiro turno aprova: encaminha para segundo turno |

### Lancamento Retroativo de Votacoes

| Regra | Descricao |
|-------|-----------|
| **RN-074-RETRO** | Sincroniza Proposicao.status com PautaItem.status automaticamente |
| **RN-075-RETRO** | Todo voto DEVE registrar sessaoId (sessao onde foi registrado) |
| **RN-076** | Lancamento retroativo so permitido para sessoes CONCLUIDAS |
| **RN-077** | Apenas parlamentares PRESENTES na sessao podem receber voto retroativo |
| **RN-078** | Toda alteracao retroativa DEVE ser auditada (usuario, data, motivo) |
| **RN-079** | Ao finalizar votacao retroativa, atualizar Proposicao.status |

**Mapeamento Status Pauta -> Proposicao (RN-074-RETRO)**:

```
PautaItem.status   -> Proposicao.status
-------------------------------------------
PENDENTE           -> EM_PAUTA
EM_DISCUSSAO       -> EM_DISCUSSAO
EM_VOTACAO         -> EM_VOTACAO
APROVADO           -> APROVADA
REJEITADO          -> REJEITADA
ADIADO             -> EM_PAUTA
RETIRADO           -> ARQUIVADA
VISTA              -> (mantém status atual)
CONCLUIDO          -> (mantém status atual)
```

### Tipos de Quorum

```
MAIORIA_SIMPLES    = Mais da metade dos PRESENTES
MAIORIA_ABSOLUTA   = Mais da metade dos MEMBROS (5 de 9)
DOIS_TERCOS        = 2/3 dos MEMBROS (6 de 9)
TRES_QUINTOS       = 3/5 dos MEMBROS (6 de 9)
UNANIMIDADE        = Todos os PRESENTES
```

### Sancao, Veto e Promulgacao

| Regra | Descricao |
|-------|-----------|
| **RN-080** | Prefeito tem 15 dias uteis para sancionar ou vetar |
| **RN-081** | Silencio do Prefeito = sancao tacita |
| **RN-082** | Veto DEVE ser motivado por inconstitucionalidade ou interesse publico |
| **RN-083** | Veto parcial so pode incidir sobre artigo, paragrafo, inciso ou alinea inteiros |
| **RN-084** | Camara tem 30 dias para apreciar veto |
| **RN-085** | Rejeicao de veto: maioria absoluta, votacao nominal |
| **RN-086** | Veto rejeitado: lei promulgada pelo Presidente da Camara |
| **RN-087** | Lei so entra em vigor apos publicacao no Diario Oficial |

---

## Fluxos Principais

### Fluxo Completo de Projeto de Lei

```
                    INICIATIVA
                        |
                        v
    +-------------------------------------------+
    |           PROTOCOLO/NUMERACAO              |
    |     (PL 001/2024, validacao RN-021/022)   |
    +-------------------------------------------+
                        |
                        v
    +-------------------------------------------+
    |              DISTRIBUICAO                  |
    |         (Despacho a comissoes)            |
    +-------------------------------------------+
                        |
         +--------------+--------------+
         |                             |
         v                             v
    +---------+                  +---------+
    |   CLJ   |----------------->|   CFO   |
    | (RN-030)|   Se impacto     | (RN-031)|
    +---------+   orcamentario   +---------+
         |                             |
         v                             v
    +---------+                  +---------+
    | PARECER |                  | PARECER |
    +---------+                  +---------+
         |                             |
         +-------------+---------------+
                       |
                       v
    +-------------------------------------------+
    |           INCLUSAO EM PAUTA                |
    |        (RN-030: CLJ obrigatoria)          |
    +-------------------------------------------+
                       |
                       v
    +-------------------------------------------+
    |              DISCUSSAO                     |
    |     (Pronunciamentos, emendas de plenario)|
    +-------------------------------------------+
                       |
                       v
    +-------------------------------------------+
    |           VOTACAO 1o TURNO                 |
    |    (Quorum RN-060, nominal se LC/LOM)     |
    +-------------------------------------------+
                       |
          +------------+------------+
          |                         |
          v                         v
    +----------+              +----------+
    | APROVADA |              | REJEITADA|
    +----------+              +----------+
          |                         |
          v                         v
    (Se 2 turnos)              ARQUIVADA
          |
          v
    +-------------------------------------------+
    |           INTERSTICIO (10 dias)           |
    |               (RN-074)                    |
    +-------------------------------------------+
          |
          v
    +-------------------------------------------+
    |           VOTACAO 2o TURNO                 |
    |         (Nominal obrigatoria)             |
    +-------------------------------------------+
          |
          +------------+------------+
          |                         |
          v                         v
    +----------+              +----------+
    | APROVADA |              | REJEITADA|
    +----------+              +----------+
          |                         |
          v                         v
    +-------------------------------------------+
    |        ENVIO AO EXECUTIVO                  |
    |         (15 dias uteis)                   |
    +-------------------------------------------+
          |
          +------+------+------+
          |             |      |
          v             v      v
    +--------+    +--------+  +--------+
    | SANCAO |    |  VETO  |  |SILENCIO|
    +--------+    +--------+  +--------+
          |             |           |
          |             v           |
          |    +----------------+   |
          |    | APRECIACAO     |   |
          |    | VETO (30 dias) |   |
          |    +----------------+   |
          |             |           |
          |    +--------+--------+  |
          |    |                 |  |
          |    v                 v  |
          | MANTIDO         REJEITADO
          |    |                 |  |
          |    v                 |  |
          | ARQUIVA             |  |
          |    (parte vetada)   |  |
          |                     |  |
          +----------+----------+--+
                     |
                     v
    +-------------------------------------------+
    |             PROMULGACAO                    |
    |    (Prefeito ou Presidente Camara)        |
    +-------------------------------------------+
                     |
                     v
    +-------------------------------------------+
    |             PUBLICACAO                     |
    |          (Diario Oficial)                 |
    +-------------------------------------------+
                     |
                     v
    +-------------------------------------------+
    |              VIGENCIA                      |
    |    (Data especificada ou 45 dias)         |
    +-------------------------------------------+
```

### Fluxo de Emenda

```
    PROPOSICAO ORIGINAL
            |
            v
    +-------------------+
    | APRESENTACAO      |
    | EMENDA            |
    | (Pertinencia      |
    |  RN-024)          |
    +-------------------+
            |
            v
    +-------------------+
    | DISTRIBUICAO      |
    | COMISSAO          |
    +-------------------+
            |
            v
    +-------------------+
    | PARECER           |
    | RELATOR           |
    +-------------------+
            |
       +----+----+
       |         |
       v         v
  FAVORAVEL  CONTRARIO
       |         |
       v         v
    +-------------------+
    | VOTACAO           |
    | PLENARIO          |
    +-------------------+
            |
       +----+----+
       |         |
       v         v
   APROVADA  REJEITADA
       |         |
       v         v
  INCORPORA   ARQUIVA
  AO TEXTO
```

### Fluxo de Veto

```
    LEI APROVADA
         |
         v
    +-----------------+
    | ENVIO EXECUTIVO |
    | (15 dias uteis) |
    +-----------------+
         |
    +----+----+----+
    |         |    |
    v         v    v
 SANCAO    VETO  SILENCIO
    |      |    |    |
    |      |    |    v
    |      |    | SANCAO
    |      |    | TACITA
    |      |    |    |
    |      |    +----+
    |      |         |
    |      v         |
    | +----------+   |
    | |  TOTAL   |   |
    | +----------+   |
    |      |         |
    |      v         |
    | +----------+   |
    | | PARCIAL  |   |
    | +----------+   |
    |      |         |
    |      v         |
    | APRECIACAO     |
    | 30 DIAS        |
    | (RN-084)       |
    |      |         |
    | +----+----+    |
    | |         |    |
    | v         v    |
    |MANTIDO REJEITADO
    | |         |    |
    | v         v    |
    |ARQ.    PROMULGA|
    |(vetado) PRESID.|
    |         |      |
    +---------+------+
              |
              v
         PUBLICACAO
```

---

## Validacoes Obrigatorias

### Ao Criar Proposicao

- [ ] Verificar iniciativa privativa (RN-020)
- [ ] Gerar numero sequencial (RN-021)
- [ ] Validar requisitos minimos (RN-022)
- [ ] Alertar materia analoga (RN-023)
- [ ] Registrar autor e data

### Ao Incluir em Pauta

- [ ] Verificar passagem pela CLJ (RN-030)
- [ ] Verificar passagem pela CFO se impacto orcamentario (RN-031)
- [ ] Verificar pareceres emitidos
- [ ] Respeitar intersticio se 2o turno (RN-074)

### Ao Iniciar Votacao

- [ ] Verificar quorum de instalacao
- [ ] Determinar tipo de votacao (nominal/simbolica)
- [ ] Verificar impedimentos de parlamentares (RN-063)
- [ ] Calcular quorum necessario para aprovacao

### Apos Votacao

- [ ] Registrar resultado com votos nominais
- [ ] Atualizar status da proposicao
- [ ] Se aprovada em 1o turno de 2: agendar 2o turno
- [ ] Se aprovada final: enviar ao Executivo
- [ ] Se rejeitada: arquivar com motivo

---

## Componentes React

### Admin

| Componente | Arquivo | Funcao |
|------------|---------|--------|
| ProposicaoForm | `src/app/admin/proposicoes/nova/page.tsx` | Formulario de criacao |
| ProposicaoList | `src/app/admin/proposicoes/page.tsx` | Lista compacta com filtros, badges coloridos por tipo/status |
| ProposicaoDetail | `src/app/admin/proposicoes/[id]/page.tsx` | Detalhes com linha do tempo, pareceres e acoes rapidas |
| TramitacaoTimeline | `src/components/admin/tramitacao-timeline.tsx` | Historico visual |
| EmendaForm | `src/app/admin/emendas/nova/page.tsx` | Formulario de emenda |
| ParecerForm | `src/app/admin/pareceres/novo/page.tsx` | Formulario de parecer |

### Padrao Visual das Proposicoes

**Badges de Tipo (cores solidas)**:
- PL (Projeto de Lei): `bg-indigo-600 text-white`
- PR (Projeto de Resolucao): `bg-teal-600 text-white`
- PD (Projeto de Decreto): `bg-cyan-600 text-white`
- IND (Indicacao): `bg-emerald-600 text-white`
- REQ (Requerimento): `bg-violet-600 text-white`
- MOC (Mocao): `bg-pink-600 text-white`
- VP (Voto de Pesar): `bg-slate-600 text-white`
- VA (Voto de Aplauso): `bg-amber-600 text-white`

**Badges de Status (com borda)**:
- APRESENTADA: `bg-blue-100 text-blue-800 border-blue-200`
- EM_TRAMITACAO: `bg-yellow-100 text-yellow-800 border-yellow-200`
- AGUARDANDO_PAUTA: `bg-amber-100 text-amber-800 border-amber-200`
- EM_PAUTA: `bg-orange-100 text-orange-800 border-orange-200`
- APROVADA: `bg-green-100 text-green-800 border-green-200`
- REJEITADA: `bg-red-100 text-red-800 border-red-200`
- ARQUIVADA: `bg-gray-100 text-gray-800 border-gray-200`
- VETADA: `bg-purple-100 text-purple-800 border-purple-200`

### Publico

| Componente | Arquivo | Funcao |
|------------|---------|--------|
| ProposicaoPublica | `src/app/legislativo/proposicoes/[id]/page.tsx` | Visualizacao publica |
| BuscaProposicoes | `src/app/legislativo/proposicoes/page.tsx` | Busca avancada |
| VotacaoResultado | `src/components/legislativo/votacao-resultado.tsx` | Exibe resultado |

---

## Exemplos de Uso

### Exemplo 1: Criar Proposicao

```typescript
import { ProposicaoValidacaoService } from '@/lib/services/proposicao-validacao-service'

// 1. Validar iniciativa
const validacaoIniciativa = await ProposicaoValidacaoService.validarIniciativaPrivativa(
  'PROJETO_LEI',
  ['SERVIDORES_PUBLICOS'], // Materia de iniciativa privativa
  autorId
)

if (!validacaoIniciativa.valido) {
  throw new Error(`Iniciativa invalida: ${validacaoIniciativa.motivo}`)
}

// 2. Gerar numero
const numero = await ProposicaoValidacaoService.gerarNumeroProposicao('PROJETO_LEI', 2024)

// 3. Validar requisitos
const validacaoRequisitos = await ProposicaoValidacaoService.validarRequisitosMinimos({
  tipo: 'PROJETO_LEI',
  ementa: 'Dispoe sobre...',
  texto: 'Art. 1o...',
  justificativa: 'Considerando que...'
})

if (!validacaoRequisitos.valido) {
  throw new Error(`Requisitos: ${validacaoRequisitos.erros.join(', ')}`)
}

// 4. Verificar materia analoga
const analoga = await ProposicaoValidacaoService.verificarMateriaAnaloga(
  'Dispoe sobre aumento salarial',
  'PROJETO_LEI'
)

if (analoga.existe) {
  // Alertar usuario sobre proposicoes similares
  console.warn('Materias analogas:', analoga.similares)
}

// 5. Criar proposicao
const proposicao = await prisma.proposicao.create({
  data: {
    tipo: 'PROJETO_LEI',
    numero,
    ano: 2024,
    ementa: 'Dispoe sobre...',
    texto: 'Art. 1o...',
    justificativa: 'Considerando que...',
    status: 'APRESENTADA',
    autorId
  }
})
```

### Exemplo 2: Tramitar para Comissao

```typescript
import { TramitacaoService } from '@/lib/services/tramitacao-service'

// Distribuir para CLJ (obrigatoria)
const tramitacaoCLJ = await TramitacaoService.registrarTramitacao(
  proposicaoId,
  cljId, // ID da Comissao de Legislacao e Justica
  'Para analise de constitucionalidade e legalidade'
)

// Verificar se precisa ir para CFO
const temImpactoOrcamentario = true

if (temImpactoOrcamentario) {
  const tramitacaoCFO = await TramitacaoService.registrarTramitacao(
    proposicaoId,
    cfoId, // ID da Comissao de Financas e Orcamento
    'Para analise de impacto orcamentario'
  )
}
```

### Exemplo 3: Validar Inclusao em Pauta

```typescript
import { ProposicaoValidacaoService } from '@/lib/services/proposicao-validacao-service'

// Verificar se pode ir a pauta
const validacao = await ProposicaoValidacaoService.validarInclusaoOrdemDoDia(proposicaoId)

if (!validacao.valido) {
  console.error('Pendencias:', validacao.pendencias)
  // ['Aguardando parecer da CLJ', 'Intersticio de 10 dias nao cumprido']
  return
}

// Incluir em pauta
await prisma.pautaItem.create({
  data: {
    pautaSessaoId,
    proposicaoId,
    ordem: proximaOrdem,
    secao: 'ORDEM_DO_DIA'
  }
})
```

### Exemplo 4: Calcular Quorum de Votacao

```typescript
import { QuorumService } from '@/lib/services/quorum-service'

// Obter configuracao de quorum para o tipo de proposicao
const aplicacao = QuorumService.determinarAplicacaoQuorum(
  'PROJETO_LEI_COMP', // Lei Complementar
  2 // Segundo turno
)

// Calcular votos necessarios
const totalMembros = 9
const presentes = 7

const quorumConfig = await prisma.configuracaoQuorum.findFirst({
  where: { tipo: 'MAIORIA_ABSOLUTA' }
})

const votosNecessarios = QuorumService.calcularVotosNecessarios(
  quorumConfig!,
  totalMembros,
  presentes
)

console.log(`Necessarios: ${votosNecessarios} votos favoraveis`)
// Para maioria absoluta de 9 membros = 5 votos
```

### Exemplo 5: Registrar Voto com Turno

```typescript
import { VotacaoService } from '@/lib/services/votacao-service'

// Verificar se precisa de 2 turnos
const precisaDoisTurnos = ['PROJETO_LEI_COMP', 'EMENDA_LOM'].includes(proposicao.tipo)

// Registrar voto
const voto = await VotacaoService.registrarVotoComTurno(
  votacaoId,
  parlamentarId,
  'SIM',
  1 // Primeiro turno
)

// Apurar resultado
const resultado = await VotacaoService.apurarResultadoPorTurno(
  votacaoId,
  1 // Turno
)

if (resultado.aprovado && precisaDoisTurnos) {
  // Agendar segundo turno (minimo 10 dias de intersticio)
  const dataSegundoTurno = addDays(new Date(), 10)

  await prisma.proposicao.update({
    where: { id: proposicao.id },
    data: {
      status: 'APROVADA_1_TURNO',
      turnoAtual: 2
    }
  })
}
```

---

## Checklist de Implementacao

### Proposicoes

- [x] CRUD completo de proposicoes
- [x] Validacao de iniciativa privativa
- [x] Geracao automatica de numero
- [x] Validacao de requisitos minimos
- [x] Deteccao de materia analoga
- [x] Sistema de status e transicoes
- [x] Relacionamento com autor/comissao

### Emendas

- [x] CRUD de emendas
- [x] Vinculacao a proposicao
- [x] Validacao de pertinencia tematica
- [x] Sistema de status
- [x] Tipos de emenda (6 tipos)

### Tramitacao

- [x] Registro de movimentacao
- [x] Controle de prazos
- [x] Verificacao passagem CLJ
- [x] Distribuicao a relator
- [x] Emissao de parecer

### Votacao

- [x] Calculo de quorum por tipo
- [x] Votacao nominal e simbolica
- [x] Verificacao de impedimentos
- [x] Sistema de turnos
- [x] Intersticio entre turnos

### Sancao/Veto

- [x] Controle de prazo (15 dias)
- [x] Registro de veto total/parcial
- [x] Apreciacao de veto (30 dias)
- [x] Promulgacao pelo Presidente

---

## Integracao com Outros Modulos

### skill-operador.md
- Votacao em tempo real
- Controle de pauta na sessao

### skill-comissoes.md
- Tramitacao em comissoes
- Pareceres de relator

### skill-transparencia.md
- Publicacao de proposicoes
- Dados abertos de votacoes

### skill-secretaria.md
- Protocolo de proposicoes
- Montagem de pautas
