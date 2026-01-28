# Skill: Painel do Operador

## Visao Geral

O Painel do Operador e a interface central para controle de sessoes legislativas em tempo real. Permite gerenciar presenca, votacoes, cronometros de oradores e transmissao ao vivo. O operador controla todo o fluxo da sessao desde a abertura ate o encerramento.

---

## Arquivos Principais

| Arquivo | Funcao |
|---------|--------|
| `src/app/painel-operador/[sessaoId]/page.tsx` | Painel principal do operador |
| `src/lib/services/sessao-controle.ts` | Controle de estado da sessao |
| `src/lib/services/votacao-service.ts` | Gerenciamento de votacoes |
| `src/lib/services/painel-tempo-real-service.ts` | Estado em tempo real |
| `src/lib/services/quorum-service.ts` | Calculo de quorum configuravel |
| `src/components/painel/` | 16 componentes do painel |
| `src/app/api/painel/` | APIs do painel |
| `src/app/api/sessoes/[id]/votacao/` | APIs de votacao |

---

## Modelos de Dados (Prisma)

### Model: Sessao

```prisma
model Sessao {
  id                  String              @id @default(cuid())
  numero              Int
  tipo                TipoSessao          // ORDINARIA, EXTRAORDINARIA, SOLENE, ESPECIAL
  dataHora            DateTime
  local               String?
  status              StatusSessao        @default(AGENDADA)
  quorumInstalacao    Int?
  dataAbertura        DateTime?
  dataEncerramento    DateTime?
  ata                 String?             @db.Text

  legislaturaId       String
  legislatura         Legislatura         @relation(fields: [legislaturaId])

  presencas           PresencaSessao[]
  votacoes            Votacao[]
  pautas              PautaSessao[]
}
```

### Model: Votacao

```prisma
model Votacao {
  id                  String              @id @default(cuid())
  tipo                TipoVotacao         // NOMINAL, SIMBOLICA, SECRETA
  status              StatusVotacao       @default(PENDENTE)
  resultado           ResultadoVotacao?   // APROVADA, REJEITADA, EMPATADA
  dataInicio          DateTime?
  dataFim             DateTime?
  turno               Int                 @default(1)

  sessaoId            String
  sessao              Sessao              @relation(fields: [sessaoId])
  proposicaoId        String?
  proposicao          Proposicao?         @relation(fields: [proposicaoId])
  emendaId            String?
  emenda              Emenda?             @relation(fields: [emendaId])

  votos               Voto[]
  quorumExigido       String?             // Tipo de quorum necessario
  votosNecessarios    Int?
  votosSim            Int                 @default(0)
  votosNao            Int                 @default(0)
  abstencoes          Int                 @default(0)
}
```

### Model: Voto

```prisma
model Voto {
  id                  String              @id @default(cuid())
  valor               ValorVoto           // SIM, NAO, ABSTENCAO, AUSENTE
  dataHora            DateTime            @default(now())
  turno               Int                 @default(1)
  justificativa       String?

  votacaoId           String
  votacao             Votacao             @relation(fields: [votacaoId])
  parlamentarId       String
  parlamentar         Parlamentar         @relation(fields: [parlamentarId])

  @@unique([votacaoId, parlamentarId, turno])
}
```

### Model: PresencaSessao

```prisma
model PresencaSessao {
  id                  String              @id @default(cuid())
  tipo                TipoPresenca        // PRESENTE, AUSENTE, JUSTIFICADA, LICENCA
  dataRegistro        DateTime            @default(now())
  justificativa       String?

  sessaoId            String
  sessao              Sessao              @relation(fields: [sessaoId])
  parlamentarId       String
  parlamentar         Parlamentar         @relation(fields: [parlamentarId])

  @@unique([sessaoId, parlamentarId])
}
```

### Model: VotacaoAgrupada

```prisma
model VotacaoAgrupada {
  id                  String              @id @default(cuid())
  titulo              String
  descricao           String?
  status              StatusVotacao       @default(PENDENTE)
  resultado           ResultadoVotacao?
  dataInicio          DateTime?
  dataFim             DateTime?

  sessaoId            String
  sessao              Sessao              @relation(fields: [sessaoId])

  itens               VotacaoAgrupadaItem[]
  votos               VotoAgrupado[]
}
```

---

## Enums e Tipos

### StatusSessao

```typescript
enum StatusSessao {
  AGENDADA          // Sessao marcada mas nao iniciada
  EM_ANDAMENTO      // Sessao em curso
  SUSPENSA          // Temporariamente interrompida
  CONCLUIDA         // Finalizada normalmente
  CANCELADA         // Cancelada antes de iniciar
}
```

### TipoSessao

```typescript
enum TipoSessao {
  ORDINARIA         // Sessoes regulares semanais
  EXTRAORDINARIA    // Convocada para materia urgente
  SOLENE            // Homenagens e comemoracao
  ESPECIAL          // Audiencias publicas
}
```

### StatusVotacao

```typescript
enum StatusVotacao {
  PENDENTE          // Aguardando inicio
  EM_ANDAMENTO      // Votacao aberta
  ENCERRADA         // Votacao finalizada
  ANULADA           // Invalidada
}
```

### ValorVoto

```typescript
enum ValorVoto {
  SIM               // Voto favoravel
  NAO               // Voto contrario
  ABSTENCAO         // Abstencao declarada
  AUSENTE           // Nao votou (saiu do plenario)
}
```

### TipoQuorum

```typescript
enum TipoQuorum {
  MAIORIA_SIMPLES   // > 50% dos presentes
  MAIORIA_ABSOLUTA  // > 50% dos membros (5 de 9)
  DOIS_TERCOS       // 2/3 dos membros (6 de 9)
  TRES_QUINTOS      // 3/5 dos membros (6 de 9)
  UNANIMIDADE       // 100% dos presentes
  MAIORIA_PRESENTES // Mesmo que simples
  MAIORIA_MEMBROS   // Mesmo que absoluta
}
```

---

## APIs e Endpoints

### Controle de Sessao

| Rota | Metodo | Funcionalidade | Roles |
|------|--------|----------------|-------|
| `/api/painel/sessao/[id]/iniciar` | POST | Iniciar sessao | OPERADOR |
| `/api/painel/sessao/[id]/suspender` | POST | Suspender sessao | OPERADOR |
| `/api/painel/sessao/[id]/retomar` | POST | Retomar sessao | OPERADOR |
| `/api/painel/sessao/[id]/encerrar` | POST | Encerrar sessao | OPERADOR |
| `/api/painel/sessao/[id]/estado` | GET | Estado atual | OPERADOR |

### Presenca

| Rota | Metodo | Funcionalidade | Roles |
|------|--------|----------------|-------|
| `/api/painel/sessao/[id]/presenca` | GET | Lista presencas | OPERADOR |
| `/api/painel/sessao/[id]/presenca` | POST | Registrar presenca | OPERADOR |
| `/api/painel/sessao/[id]/presenca/[parlamentarId]` | PUT | Atualizar presenca | OPERADOR |
| `/api/painel/sessao/[id]/quorum` | GET | Verificar quorum | OPERADOR |

### Votacao

| Rota | Metodo | Funcionalidade | Roles |
|------|--------|----------------|-------|
| `/api/sessoes/[id]/votacao` | GET | Lista votacoes | Publico |
| `/api/sessoes/[id]/votacao` | POST | Criar votacao | OPERADOR |
| `/api/sessoes/[id]/votacao/[votacaoId]/iniciar` | POST | Abrir votacao | OPERADOR |
| `/api/sessoes/[id]/votacao/[votacaoId]/encerrar` | POST | Fechar votacao | OPERADOR |
| `/api/sessoes/[id]/votacao/[votacaoId]/voto` | POST | Registrar voto | PARLAMENTAR |
| `/api/sessoes/[id]/votacao/[votacaoId]/resultado` | GET | Resultado final | Publico |

### Pauta

| Rota | Metodo | Funcionalidade | Roles |
|------|--------|----------------|-------|
| `/api/painel/sessao/[id]/pauta` | GET | Obter pauta | OPERADOR |
| `/api/painel/sessao/[id]/pauta/item/[itemId]/iniciar` | POST | Iniciar item | OPERADOR |
| `/api/painel/sessao/[id]/pauta/item/[itemId]/encerrar` | POST | Encerrar item | OPERADOR |
| `/api/painel/sessao/[id]/pauta/item/[itemId]/pular` | POST | Pular item | OPERADOR |

### Orador

| Rota | Metodo | Funcionalidade | Roles |
|------|--------|----------------|-------|
| `/api/painel/sessao/[id]/orador/iniciar` | POST | Iniciar cronometro | OPERADOR |
| `/api/painel/sessao/[id]/orador/pausar` | POST | Pausar cronometro | OPERADOR |
| `/api/painel/sessao/[id]/orador/encerrar` | POST | Encerrar orador | OPERADOR |

---

## Servicos de Negocio

### sessao-controle.ts

```typescript
// Iniciar sessao com verificacao de quorum
async function iniciarSessaoControle(
  sessaoId: string,
  operadorId: string
): Promise<{ sucesso: boolean; mensagem: string; sessao?: Sessao }>

// Finalizar sessao
async function finalizarSessaoControle(
  sessaoId: string,
  operadorId: string
): Promise<{ sucesso: boolean; mensagem: string }>

// Iniciar discussao de item da pauta
async function iniciarItemPauta(
  sessaoId: string,
  itemId: string
): Promise<{ sucesso: boolean; item?: PautaItem }>

// Pausar item para pedido de vista
async function pausarItemPauta(
  sessaoId: string,
  itemId: string,
  motivo: string
): Promise<{ sucesso: boolean }>

// Finalizar item (ir para votacao ou proximo)
async function finalizarItemPauta(
  sessaoId: string,
  itemId: string,
  resultado: 'APROVADO' | 'REJEITADO' | 'ADIADO' | 'RETIRADO'
): Promise<{ sucesso: boolean }>

// Pedido de vista
async function pedirVistaItem(
  sessaoId: string,
  itemId: string,
  parlamentarId: string,
  prazo: Date
): Promise<{ sucesso: boolean }>

// Retomar apos vista
async function retomarItemVista(
  sessaoId: string,
  itemId: string
): Promise<{ sucesso: boolean }>

// Iniciar primeiro turno
async function iniciarTurnoItem(
  sessaoId: string,
  itemId: string,
  turno: number
): Promise<{ sucesso: boolean; votacao?: Votacao }>

// Finalizar turno
async function finalizarTurnoItem(
  sessaoId: string,
  itemId: string,
  turno: number
): Promise<{ sucesso: boolean; resultado: ResultadoVotacao }>

// Iniciar segundo turno (apos intersticio)
async function iniciarSegundoTurnoItem(
  sessaoId: string,
  itemId: string
): Promise<{ sucesso: boolean; votacao?: Votacao }>

// Contabilizar votos com quorum configuravel
async function contabilizarVotos(
  votacaoId: string
): Promise<{
  aprovado: boolean
  votosSim: number
  votosNao: number
  abstencoes: number
  quorumAtingido: boolean
}>
```

### votacao-service.ts

```typescript
// Calcular quorum necessario (RN-060)
async function calcularQuorum(
  tipoProposicao: TipoProposicao,
  turno: number,
  totalMembros: number,
  presentes: number
): Promise<{ tipo: TipoQuorum; votosNecessarios: number }>

// Verificar se deve ser votacao nominal (RN-061)
function deveSerVotacaoNominal(
  tipoProposicao: TipoProposicao,
  turno: number
): boolean

// Verificar impedimento de voto (RN-063)
async function verificarImpedimentoVoto(
  parlamentarId: string,
  proposicaoId: string
): Promise<{ impedido: boolean; motivo?: string }>

// Registrar voto com controle de turno (RN-074)
async function registrarVotoComTurno(
  votacaoId: string,
  parlamentarId: string,
  valor: ValorVoto,
  turno: number
): Promise<Voto>

// Apurar resultado por turno (RN-075)
async function apurarResultadoPorTurno(
  votacaoId: string,
  turno: number
): Promise<{
  aprovado: boolean
  totalVotos: number
  votosSim: number
  votosNao: number
  abstencoes: number
  quorumTipo: TipoQuorum
  quorumAtingido: boolean
}>
```

### painel-tempo-real-service.ts

```typescript
interface EstadoPainel {
  sessao: {
    id: string
    status: StatusSessao
    dataAbertura: Date | null
  }
  presenca: {
    total: number
    presentes: number
    ausentes: number
    quorumInstalacao: boolean
  }
  pautaAtual: {
    itemId: string | null
    titulo: string | null
    status: string | null
  }
  votacaoAtiva: VotacaoAtiva | null
  oradorAtual: OradorAtivo | null
}

interface VotacaoAtiva {
  id: string
  proposicaoId: string
  titulo: string
  tipo: TipoVotacao
  turno: number
  tempoRestante: number | null
  votos: {
    sim: number
    nao: number
    abstencao: number
    pendentes: number
  }
  quorum: {
    tipo: TipoQuorum
    necessario: number
    atual: number
  }
}

// Obter estado completo do painel
async function getEstadoPainel(
  sessaoId: string
): Promise<EstadoPainel>

// Iniciar sessao
async function iniciarSessao(
  sessaoId: string,
  operadorId: string
): Promise<{ sucesso: boolean; estado: EstadoPainel }>

// Finalizar sessao
async function finalizarSessao(
  sessaoId: string,
  operadorId: string
): Promise<{ sucesso: boolean }>

// Iniciar votacao
async function iniciarVotacao(
  sessaoId: string,
  votacaoId: string
): Promise<{ sucesso: boolean; votacao: VotacaoAtiva }>

// Registrar voto (do parlamentar)
async function registrarVoto(
  votacaoId: string,
  parlamentarId: string,
  valor: ValorVoto
): Promise<{ sucesso: boolean; voto: Voto }>

// Finalizar votacao
async function finalizarVotacao(
  votacaoId: string
): Promise<{ sucesso: boolean; resultado: ResultadoVotacao }>
```

### quorum-service.ts

```typescript
// Calcular votos necessarios baseado em configuracao
function calcularVotosNecessarios(
  config: ConfiguracaoQuorum,
  totalMembros: number,
  presentes: number
): number

// Verificar quorum de instalacao
function verificarQuorumInstalacao(
  presentes: number,
  totalMembros: number
): boolean

// Calcular resultado da votacao
function calcularResultadoVotacao(
  config: ConfiguracaoQuorum,
  totalMembros: number,
  presentes: number,
  votosSim: number,
  votosNao: number,
  abstencoes: number
): { aprovado: boolean; votosNecessarios: number; quorumAtingido: boolean }

// Determinar tipo de quorum para aplicacao
function determinarAplicacaoQuorum(
  tipoProposicao: TipoProposicao,
  turno: number
): AplicacaoQuorum
```

---

## Regras de Negocio

### Sessao

| Regra | Descricao |
|-------|-----------|
| **RN-040** | Quorum de instalacao: maioria absoluta (5 de 9 vereadores) |
| **RN-041** | Sessao ordinaria: dias e horarios fixos no Regimento |
| **RN-042** | Sessao extraordinaria: convocada pelo Presidente ou 1/3 dos vereadores |
| **RN-043** | Ordem dos trabalhos: Expediente, Ordem do Dia, Explicacoes Pessoais |
| **RN-044** | Sessao so pode ser aberta com quorum de instalacao atingido |

### Pauta

| Regra | Descricao |
|-------|-----------|
| **RN-050** | Pauta DEVE ser publicada 48h antes da sessao (PNTP) |
| **RN-051** | Pauta fixa ordem: urgentes, preferenciais, ordem cronologica |
| **RN-052** | Item pode ser retirado pelo autor ate inicio da votacao |
| **RN-053** | Inversao de pauta: requer aprovacao do plenario |
| **RN-054** | Item adiado vai para proxima sessao (mesma posicao) |
| **RN-055** | Sistema sugere itens automaticamente por prioridade |
| **RN-056** | Validacao regimental obrigatoria antes de incluir |
| **RN-057** | Tempo estimado calculado por tipo de materia |

### Votacao

| Regra | Descricao |
|-------|-----------|
| **RN-060** | Quorum de votacao varia por tipo de materia |
| **RN-061** | Votacao nominal obrigatoria: LOM, LC, vetos, 2o turno |
| **RN-062** | Votacao simbolica permitida para materias ordinarias |
| **RN-063** | Impedimento: parlamentar nao vota em causa propria |
| **RN-064** | Voto so pode ser alterado antes do encerramento |
| **RN-065** | Presidente so vota em caso de empate (voto de minerva) |
| **RN-066** | Ausencia de voto = abstencao automatica |
| **RN-067** | Votacao secreta: casos especificos do Regimento |

### Turnos

| Regra | Descricao |
|-------|-----------|
| **RN-074** | Dois turnos para LOM e LC com intersticio de 10 dias |
| **RN-075** | Aprovacao em 1o turno encaminha para 2o turno |
| **RN-070** | Materia rejeitada: so na proxima sessao legislativa |
| **RN-071** | Empate em votacao: materia rejeitada |
| **RN-072** | Destaque: votacao em separado de dispositivo |
| **RN-073** | Prejudicialidade: aprovacao de um prejudica outro |

### Quorum por Tipo de Materia

```
+------------------------+---------------------+-------------+
| TIPO DE MATERIA        | QUORUM VOTACAO      | TURNOS      |
+------------------------+---------------------+-------------+
| Lei Ordinaria          | Maioria Simples     | 1           |
| Lei Complementar       | Maioria Absoluta    | 2 (10 dias) |
| Emenda a LOM           | 2/3 dos membros     | 2 (10 dias) |
| Veto                   | Maioria Absoluta    | 1           |
| Projeto de Resolucao   | Maioria Simples     | 1           |
| Decreto Legislativo    | Maioria Simples     | 1           |
| Requerimento           | Maioria Simples     | 1           |
| Urgencia               | Maioria Absoluta    | 1           |
| Urgencia Urgentissima  | 2/3 dos membros     | 1           |
+------------------------+---------------------+-------------+
```

---

## Fluxos Principais

### Fluxo de Sessao

```
    AGENDADA
        |
        v
    +-------------------+
    | VERIFICAR QUORUM  |
    | (RN-040: maioria  |
    |  absoluta)        |
    +-------------------+
        |
        +--------+--------+
        |                 |
        v                 v
    QUORUM OK         SEM QUORUM
        |                 |
        v                 v
    +--------+        +--------+
    | INICIAR|        | AGUARDAR|
    | SESSAO |        | 30 MIN  |
    +--------+        +--------+
        |                 |
        v                 v
    EM_ANDAMENTO      CANCELAR
        |
        v
    +-------------------+
    | EXPEDIENTE        |
    | - Ata anterior    |
    | - Correspondencias|
    | - Comunicacoes    |
    +-------------------+
        |
        v
    +-------------------+
    | ORDEM DO DIA      |
    | - Votacoes        |
    | - Discussoes      |
    +-------------------+
        |
        v
    +-------------------+
    | EXPLICACOES       |
    | PESSOAIS          |
    +-------------------+
        |
        v
    +--------+
    |ENCERRAR|
    +--------+
        |
        v
    CONCLUIDA
```

### Fluxo de Votacao

```
    ITEM EM PAUTA
          |
          v
    +-------------------+
    | VERIFICAR         |
    | QUORUM VOTACAO    |
    +-------------------+
          |
          +--------+--------+
          |                 |
          v                 v
      QUORUM OK         SEM QUORUM
          |                 |
          v                 v
    +----------+        +----------+
    | DETERMINAR|       | SUSPENDER |
    | TIPO      |       | SESSAO    |
    +----------+        +----------+
          |
          v
    +-------------------+
    | NOMINAL OU        |
    | SIMBOLICA?        |
    | (RN-061)          |
    +-------------------+
          |
          +--------+--------+
          |                 |
          v                 v
      NOMINAL           SIMBOLICA
          |                 |
          v                 v
    +----------+        +----------+
    | ABRIR    |        | SOLICITAR|
    | VOTACAO  |        | CONTRARIOS|
    +----------+        +----------+
          |                 |
          v                 v
    +----------+        +----------+
    | AGUARDAR |        | REGISTRAR |
    | VOTOS    |        | CONTRARIOS|
    +----------+        +----------+
          |                 |
          v                 v
    +----------+        +----------+
    | ENCERRAR |        | CALCULAR  |
    | VOTACAO  |        | RESULTADO |
    +----------+        +----------+
          |                 |
          +--------+--------+
                   |
                   v
    +----------------------------+
    | APURAR RESULTADO           |
    | - Contar votos             |
    | - Verificar quorum         |
    | - Determinar aprovacao     |
    +----------------------------+
                   |
          +--------+--------+--------+
          |                 |        |
          v                 v        v
      APROVADA         REJEITADA  EMPATE
          |                 |        |
          v                 v        v
    (Se 2 turnos?)     ARQUIVAR  REJEITADA
          |                       (RN-071)
          +--------+
          |        |
          v        v
      1o TURNO  FINAL
          |        |
          v        v
    AGUARDAR   ENCAMINHAR
    10 DIAS    EXECUTIVO
```

### Fluxo de Votacao Nominal

```
    VOTACAO ABERTA
          |
          v
    +-------------------+
    | PAINEL EXIBE      |
    | MATERIA           |
    +-------------------+
          |
          v
    +-------------------+
    | PARLAMENTARES     |
    | VOTAM INDIVIDUALMENTE |
    +-------------------+
          |
    Para cada parlamentar:
          |
    +-------------------+
    | VERIFICAR         |
    | IMPEDIMENTO       |
    | (RN-063)          |
    +-------------------+
          |
          +--------+--------+
          |                 |
          v                 v
      IMPEDIDO          LIBERADO
          |                 |
          v                 v
    NAO VOTA           REGISTRA VOTO
                            |
                      +-----+-----+-----+
                      |     |     |     |
                      v     v     v     v
                     SIM   NAO  ABST  AUSENTE
          |
          v
    +-------------------+
    | OPERADOR ENCERRA  |
    | VOTACAO           |
    +-------------------+
          |
          v
    +-------------------+
    | SISTEMA APURA     |
    | RESULTADO         |
    +-------------------+
          |
          v
    +-------------------+
    | EXIBIR PLACAR     |
    | NOMINAL           |
    +-------------------+
```

### Fluxo de Dois Turnos

```
    MATERIA LC/LOM
          |
          v
    +-------------------+
    | 1o TURNO          |
    | VOTACAO           |
    +-------------------+
          |
          +--------+--------+
          |                 |
          v                 v
      APROVADA          REJEITADA
          |                 |
          v                 v
    +----------+        ARQUIVADA
    | AGUARDAR |
    | 10 DIAS  |
    | (RN-074) |
    +----------+
          |
          v
    +-------------------+
    | 2o TURNO          |
    | (Nominal          |
    |  obrigatoria)     |
    +-------------------+
          |
          +--------+--------+
          |                 |
          v                 v
      APROVADA          REJEITADA
          |                 |
          v                 v
    ENCAMINHAR          ARQUIVADA
    EXECUTIVO
```

---

## Validacoes Obrigatorias

### Ao Iniciar Sessao

- [ ] Verificar quorum de instalacao (RN-040)
- [ ] Verificar se pauta foi publicada 48h antes (RN-050)
- [ ] Registrar data/hora de abertura
- [ ] Registrar operador responsavel

### Ao Iniciar Votacao

- [ ] Verificar quorum de votacao
- [ ] Determinar tipo de votacao (nominal/simbolica)
- [ ] Verificar impedimentos de parlamentares
- [ ] Calcular votos necessarios para aprovacao

### Ao Registrar Voto

- [ ] Verificar se parlamentar esta presente
- [ ] Verificar impedimento (RN-063)
- [ ] Verificar se votacao esta aberta
- [ ] Verificar se ja votou no turno atual

### Ao Encerrar Votacao

- [ ] Calcular resultado final
- [ ] Verificar se quorum foi atingido
- [ ] Atualizar status da proposicao
- [ ] Se 1o turno aprovado: verificar intersticio para 2o

### Ao Encerrar Sessao

- [ ] Verificar se todos itens foram processados
- [ ] Registrar data/hora de encerramento
- [ ] Gerar resumo da sessao

---

## Componentes React

### Painel Operador

| Componente | Arquivo | Funcao |
|------------|---------|--------|
| PainelOperador | `src/app/painel-operador/[sessaoId]/page.tsx` | Layout principal |
| ControlesSessao | `src/components/painel/controles-sessao.tsx` | Botoes de controle |
| QuadroPresenca | `src/components/painel/quadro-presenca.tsx` | Grid de presencas |
| PainelVotacao | `src/components/painel/painel-votacao.tsx` | Controle de votacao |
| PainelVotacaoAtiva | `src/components/painel/painel-votacao-ativa.tsx` | Votacao em andamento |
| PlacarVotacao | `src/components/painel/placar-votacao.tsx` | Exibe contagem |
| ListaPauta | `src/components/painel/lista-pauta.tsx` | Itens da pauta |
| ItemPautaCard | `src/components/painel/item-pauta-card.tsx` | Card de item |
| CronometroOrador | `src/components/painel/cronometro-orador.tsx` | Timer de fala |
| TransmissaoCard | `src/components/painel/transmissao-card.tsx` | Status ao vivo |
| ResumoSessao | `src/components/painel/resumo-sessao.tsx` | Resumo final |
| DadosPreteritos | `src/components/painel/dados-preteritos.tsx` | Sessoes anteriores |

### Painel Publico

| Componente | Arquivo | Funcao |
|------------|---------|--------|
| PainelPublico | `src/app/painel/[sessaoId]/page.tsx` | Visualizacao publica |
| PlacarPublico | `src/components/painel/placar-publico.tsx` | Placar ao vivo |

---

## Exemplos de Uso

### Exemplo 1: Iniciar Sessao

```typescript
import { PainelTempoRealService } from '@/lib/services/painel-tempo-real-service'
import { SessaoControle } from '@/lib/services/sessao-controle'

// 1. Verificar estado atual
const estado = await PainelTempoRealService.getEstadoPainel(sessaoId)

if (estado.sessao.status !== 'AGENDADA') {
  throw new Error('Sessao ja foi iniciada ou encerrada')
}

// 2. Verificar quorum de instalacao
if (!estado.presenca.quorumInstalacao) {
  throw new Error(`Quorum insuficiente: ${estado.presenca.presentes} de ${estado.presenca.total}`)
}

// 3. Iniciar sessao
const resultado = await SessaoControle.iniciarSessaoControle(
  sessaoId,
  operadorId
)

if (!resultado.sucesso) {
  throw new Error(resultado.mensagem)
}

// Sessao iniciada com sucesso
console.log('Sessao EM_ANDAMENTO:', resultado.sessao)
```

### Exemplo 2: Registrar Presenca

```typescript
// POST /api/painel/sessao/[id]/presenca

// Registrar presenca de parlamentar
await prisma.presencaSessao.upsert({
  where: {
    sessaoId_parlamentarId: {
      sessaoId,
      parlamentarId
    }
  },
  update: {
    tipo: 'PRESENTE',
    dataRegistro: new Date()
  },
  create: {
    sessaoId,
    parlamentarId,
    tipo: 'PRESENTE'
  }
})

// Verificar quorum apos registro
const presentes = await prisma.presencaSessao.count({
  where: {
    sessaoId,
    tipo: 'PRESENTE'
  }
})

const totalMembros = 9
const quorumAtingido = presentes >= Math.ceil(totalMembros / 2) + 1 // Maioria absoluta
```

### Exemplo 3: Iniciar Votacao

```typescript
import { VotacaoService } from '@/lib/services/votacao-service'
import { QuorumService } from '@/lib/services/quorum-service'

// 1. Determinar tipo de votacao
const deveSerNominal = VotacaoService.deveSerVotacaoNominal(
  proposicao.tipo,
  turno
)

// 2. Calcular quorum necessario
const { tipo: tipoQuorum, votosNecessarios } = await VotacaoService.calcularQuorum(
  proposicao.tipo,
  turno,
  totalMembros,
  presentes
)

// 3. Criar votacao
const votacao = await prisma.votacao.create({
  data: {
    sessaoId,
    proposicaoId: proposicao.id,
    tipo: deveSerNominal ? 'NOMINAL' : 'SIMBOLICA',
    status: 'PENDENTE',
    turno,
    quorumExigido: tipoQuorum,
    votosNecessarios
  }
})

// 4. Iniciar votacao
await prisma.votacao.update({
  where: { id: votacao.id },
  data: {
    status: 'EM_ANDAMENTO',
    dataInicio: new Date()
  }
})
```

### Exemplo 4: Registrar Voto do Parlamentar

```typescript
import { VotacaoService } from '@/lib/services/votacao-service'

// 1. Verificar impedimento
const impedimento = await VotacaoService.verificarImpedimentoVoto(
  parlamentarId,
  proposicaoId
)

if (impedimento.impedido) {
  throw new Error(`Voto impedido: ${impedimento.motivo}`)
}

// 2. Verificar se ja votou neste turno
const votoExistente = await prisma.voto.findUnique({
  where: {
    votacaoId_parlamentarId_turno: {
      votacaoId,
      parlamentarId,
      turno
    }
  }
})

if (votoExistente) {
  throw new Error('Parlamentar ja votou nesta votacao')
}

// 3. Registrar voto
const voto = await VotacaoService.registrarVotoComTurno(
  votacaoId,
  parlamentarId,
  'SIM', // ou 'NAO', 'ABSTENCAO'
  turno
)
```

### Exemplo 5: Encerrar Votacao e Apurar

```typescript
import { VotacaoService } from '@/lib/services/votacao-service'
import { SessaoControle } from '@/lib/services/sessao-controle'

// 1. Encerrar votacao
await prisma.votacao.update({
  where: { id: votacaoId },
  data: {
    status: 'ENCERRADA',
    dataFim: new Date()
  }
})

// 2. Apurar resultado
const resultado = await VotacaoService.apurarResultadoPorTurno(
  votacaoId,
  turno
)

// 3. Atualizar votacao com resultado
await prisma.votacao.update({
  where: { id: votacaoId },
  data: {
    resultado: resultado.aprovado ? 'APROVADA' : 'REJEITADA',
    votosSim: resultado.votosSim,
    votosNao: resultado.votosNao,
    abstencoes: resultado.abstencoes
  }
})

// 4. Se aprovado em 1o turno de materia com 2 turnos
if (resultado.aprovado && turno === 1 && proposicao.turnoMaximo === 2) {
  await prisma.proposicao.update({
    where: { id: proposicao.id },
    data: {
      status: 'APROVADA_1_TURNO',
      turnoAtual: 2
    }
  })
}

// 5. Se aprovado final
if (resultado.aprovado && (turno === proposicao.turnoMaximo)) {
  await prisma.proposicao.update({
    where: { id: proposicao.id },
    data: {
      status: 'APROVADA'
    }
  })
}
```

### Exemplo 6: Dados Preteritos (Sessoes Concluidas)

```typescript
// Consultar sessoes concluidas com resultados
const sessoesAnteriores = await prisma.sessao.findMany({
  where: {
    status: 'CONCLUIDA'
  },
  include: {
    votacoes: {
      include: {
        votos: {
          include: {
            parlamentar: {
              select: {
                nome: true,
                apelido: true
              }
            }
          }
        },
        proposicao: {
          select: {
            tipo: true,
            numero: true,
            ano: true,
            ementa: true
          }
        }
      }
    },
    presencas: {
      include: {
        parlamentar: {
          select: {
            nome: true,
            apelido: true
          }
        }
      }
    }
  },
  orderBy: {
    dataHora: 'desc'
  },
  take: 10
})
```

---

## Checklist de Implementacao

### Controle de Sessao

- [x] Iniciar/encerrar sessao
- [x] Suspender/retomar sessao
- [x] Verificacao de quorum instalacao
- [x] Registro de data/hora
- [x] Controle de status

### Presenca

- [x] Registro de presenca
- [x] Atualizacao de status
- [x] Calculo de quorum
- [x] Grid visual de presencas

### Votacao

- [x] Criacao de votacao
- [x] Determinacao nominal/simbolica
- [x] Calculo de quorum por tipo
- [x] Registro de votos
- [x] Apuracao de resultado
- [x] Sistema de turnos
- [x] Verificacao de intersticio

### Pauta

- [x] Listagem de itens
- [x] Iniciar/encerrar item
- [x] Pular item
- [x] Pedido de vista

### Orador

- [x] Cronometro de fala
- [x] Pausar/retomar
- [x] Tempo por tipo de pronunciamento

---

## Integracao com Outros Modulos

### skill-legislativo.md
- Proposicoes a serem votadas
- Status apos votacao

### skill-parlamentar.md
- Interface de votacao do parlamentar
- Confirmacao de presenca

### skill-transparencia.md
- Publicacao de votacoes nominais
- Dados de presenca

### skill-secretaria.md
- Composicao da pauta
- Geracao de ata
