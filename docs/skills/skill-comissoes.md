# Skill: Comissoes

## Visao Geral

O modulo de Comissoes gerencia toda a estrutura de comissoes da Camara Municipal, incluindo comissoes permanentes (CLJ, CFO), temporarias, especiais e Comissoes Parlamentares de Inquerito (CPI). Inclui gestao de membros, reunioes, pareceres e pautas de reuniao.

---

## Arquivos Principais

| Arquivo | Funcao |
|---------|--------|
| `prisma/schema.prisma` | Modelos: Comissao, MembroComissao, ReuniaoComissao, Parecer |
| `src/lib/services/reuniao-comissao-service.ts` | CRUD e controle de reunioes |
| `src/lib/hooks/use-comissoes.ts` | Hook de comissoes |
| `src/lib/hooks/use-pareceres.ts` | Hook de pareceres |
| `src/app/admin/comissoes/` | Gestao de comissoes |
| `src/app/admin/comissoes/reunioes/` | Gestao de reunioes |
| `src/app/api/comissoes/` | API de comissoes |
| `src/app/api/reunioes-comissao/` | API de reunioes |

---

## Modelos de Dados (Prisma)

### Model: Comissao

```prisma
model Comissao {
  id                  String              @id @default(cuid())
  nome                String
  sigla               String
  tipo                TipoComissao        // PERMANENTE, TEMPORARIA, ESPECIAL, INQUERITO
  descricao           String?             @db.Text
  competencias        String?             @db.Text
  dataCriacao         DateTime            @default(now())
  dataExtincao        DateTime?
  ativa               Boolean             @default(true)

  legislaturaId       String?
  legislatura         Legislatura?        @relation(fields: [legislaturaId])

  membros             MembroComissao[]
  reunioes            ReuniaoComissao[]
  pareceres           Parecer[]
  proposicoesOrigem   Proposicao[]        @relation("ProposicoesComissao")
  tramitacoes         Tramitacao[]        @relation("TramitacoesComissao")
}
```

### Model: MembroComissao

```prisma
model MembroComissao {
  id                  String              @id @default(cuid())
  cargo               CargoComissao       // PRESIDENTE, VICE_PRESIDENTE, RELATOR, MEMBRO
  dataInicio          DateTime            @default(now())
  dataFim             DateTime?
  ativo               Boolean             @default(true)

  comissaoId          String
  comissao            Comissao            @relation(fields: [comissaoId])
  parlamentarId       String
  parlamentar         Parlamentar         @relation(fields: [parlamentarId])

  @@unique([comissaoId, parlamentarId])
}
```

### Model: ReuniaoComissao

```prisma
model ReuniaoComissao {
  id                  String              @id @default(cuid())
  numero              Int
  dataHora            DateTime
  local               String?
  status              StatusReuniao       // AGENDADA, EM_ANDAMENTO, CONCLUIDA, CANCELADA
  ata                 String?             @db.Text
  dataConvocacao      DateTime?
  quorumPresente      Int?

  comissaoId          String
  comissao            Comissao            @relation(fields: [comissaoId])

  presencas           PresencaReuniao[]
  pautaItens          PautaReuniaoComissao[]
  votacoesParecer     VotacaoParecerComissao[]
}
```

### Model: PautaReuniaoComissao

```prisma
model PautaReuniaoComissao {
  id                  String              @id @default(cuid())
  ordem               Int
  titulo              String
  descricao           String?             @db.Text
  tipo                TipoItemPautaReuniao // PROPOSICAO, PARECER, ASSUNTO_GERAL
  status              StatusItemPauta     @default(PENDENTE)
  resultado           String?

  reuniaoId           String
  reuniao             ReuniaoComissao     @relation(fields: [reuniaoId])
  proposicaoId        String?
  proposicao          Proposicao?         @relation(fields: [proposicaoId])
  parecerId           String?
  parecer             Parecer?            @relation(fields: [parecerId])
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
  fundamentacao       String?             @db.Text
  dataEmissao         DateTime            @default(now())
  dataAprovacao       DateTime?
  status              StatusParecer       @default(ELABORACAO)

  // Campos de anexo (adicionados em 2026-01-31)
  arquivoUrl          String?             // URL do arquivo PDF no storage
  arquivoNome         String?             // Nome original do arquivo
  arquivoTamanho      Int?                // Tamanho em bytes
  driveUrl            String?             // URL de compartilhamento do Google Drive/OneDrive

  proposicaoId        String
  proposicao          Proposicao          @relation(fields: [proposicaoId])
  comissaoId          String
  comissao            Comissao            @relation(fields: [comissaoId])
  relatorId           String
  relator             Parlamentar         @relation(fields: [relatorId])

  votacoes            VotacaoParecerComissao[]
  pautaItens          PautaReuniaoComissao[]
}
```

### Model: VotacaoParecerComissao

```prisma
model VotacaoParecerComissao {
  id                  String              @id @default(cuid())
  resultado           ResultadoVotacao?   // APROVADO, REJEITADO
  dataVotacao         DateTime            @default(now())
  votosSim            Int                 @default(0)
  votosNao            Int                 @default(0)
  abstencoes          Int                 @default(0)

  parecerId           String
  parecer             Parecer             @relation(fields: [parecerId])
  reuniaoId           String
  reuniao             ReuniaoComissao     @relation(fields: [reuniaoId])

  votos               VotoMembroComissao[]
}
```

---

## Enums e Tipos

### TipoComissao

```typescript
enum TipoComissao {
  PERMANENTE        // Comissoes fixas (CLJ, CFO)
  TEMPORARIA        // Criada para fim especifico
  ESPECIAL          // Analise de materia especifica
  INQUERITO         // CPI - poderes de investigacao
}
```

### CargoComissao

```typescript
enum CargoComissao {
  PRESIDENTE        // Preside reunioes
  VICE_PRESIDENTE   // Substitui presidente
  RELATOR           // Relata materias
  MEMBRO            // Membro comum
}
```

### StatusReuniao

```typescript
enum StatusReuniao {
  AGENDADA          // Reuniao marcada
  CONVOCADA         // Convocacao enviada
  EM_ANDAMENTO      // Reuniao em curso
  SUSPENSA          // Temporariamente interrompida
  CONCLUIDA         // Finalizada
  CANCELADA         // Cancelada
}
```

### TipoParecer

```typescript
enum TipoParecer {
  FAVORAVEL             // Aprova a materia
  CONTRARIO             // Rejeita a materia
  COM_RESSALVAS         // Aprova com alteracoes
  PELA_PREJUDICIALIDADE // Materia prejudicada
  PELA_INCONSTITUCIONALIDADE // CLJ: inconstitucional
  PELA_ILEGALIDADE      // CLJ: ilegal
}
```

### StatusParecer

```typescript
enum StatusParecer {
  RASCUNHO                 // Relator esta elaborando
  AGUARDANDO_PAUTA         // Concluido, aguardando inclusao em pauta de reuniao
  AGUARDANDO_VOTACAO       // Incluido na pauta, aguardando votacao na comissao
  APROVADO_COMISSAO        // Aprovado pela comissao
  REJEITADO_COMISSAO       // Rejeitado pela comissao (volta ao relator)
  EMITIDO                  // Parecer final emitido
  ARQUIVADO                // Arquivado (materia arquivada)
}
```

---

## APIs e Endpoints

### Comissoes

| Rota | Metodo | Funcionalidade | Roles |
|------|--------|----------------|-------|
| `/api/comissoes` | GET | Listar comissoes | Publico |
| `/api/comissoes` | POST | Criar comissao | ADMIN |
| `/api/comissoes/[id]` | GET | Obter comissao | Publico |
| `/api/comissoes/[id]` | PUT | Atualizar comissao | ADMIN |
| `/api/comissoes/[id]` | DELETE | Excluir comissao | ADMIN |
| `/api/comissoes/[id]/membros` | GET | Listar membros | Publico |
| `/api/comissoes/[id]/membros` | POST | Adicionar membro | ADMIN |
| `/api/comissoes/[id]/membros/[membroId]` | DELETE | Remover membro | ADMIN |

### Reunioes

| Rota | Metodo | Funcionalidade | Roles |
|------|--------|----------------|-------|
| `/api/reunioes-comissao` | GET | Listar reunioes | Publico |
| `/api/reunioes-comissao` | POST | Agendar reuniao | EDITOR |
| `/api/reunioes-comissao/[id]` | GET | Obter reuniao | Publico |
| `/api/reunioes-comissao/[id]` | PUT | Atualizar reuniao | EDITOR |
| `/api/reunioes-comissao/[id]/convocar` | POST | Enviar convocacao | EDITOR |
| `/api/reunioes-comissao/[id]/iniciar` | POST | Iniciar reuniao | OPERADOR |
| `/api/reunioes-comissao/[id]/encerrar` | POST | Encerrar reuniao | OPERADOR |
| `/api/reunioes-comissao/[id]/presenca` | POST | Registrar presenca | OPERADOR |
| `/api/reunioes-comissao/[id]/pauta` | GET | Obter pauta | Publico |
| `/api/reunioes-comissao/[id]/pauta` | POST | Adicionar item | EDITOR |

### Pareceres

| Rota | Metodo | Funcionalidade | Roles |
|------|--------|----------------|-------|
| `/api/pareceres` | GET | Listar pareceres | Publico |
| `/api/pareceres` | POST | Criar parecer (numeracao por comissao) | EDITOR |
| `/api/pareceres/[id]` | GET | Obter parecer | Publico |
| `/api/pareceres/[id]` | PUT | Atualizar parecer | EDITOR |
| `/api/pareceres/[id]/votar` | POST | Votar parecer | PARLAMENTAR |
| `/api/pareceres/proximo-numero` | GET | Obter proximo numero (por comissao) | Autenticado |
| `/api/comissoes/[id]/proposicoes-pendentes` | GET | Proposicoes em tramitacao aguardando parecer | Autenticado |

---

## Servicos de Negocio

### reuniao-comissao-service.ts

```typescript
class ReuniaoComissaoService {
  // CRUD basico
  async listar(filtros: FiltrosReuniao): Promise<ReuniaoComissao[]>
  async obterPorId(id: string): Promise<ReuniaoComissao | null>
  async criar(dados: CriarReuniaoInput): Promise<ReuniaoComissao>
  async atualizar(id: string, dados: AtualizarReuniaoInput): Promise<ReuniaoComissao>
  async excluir(id: string): Promise<void>

  // Controle de reuniao
  async convocar(
    reuniaoId: string,
    membrosIds: string[]
  ): Promise<{ sucesso: boolean; convocacoes: number }>

  async iniciar(
    reuniaoId: string
  ): Promise<{ sucesso: boolean; reuniao: ReuniaoComissao }>

  async suspender(
    reuniaoId: string,
    motivo: string
  ): Promise<{ sucesso: boolean }>

  async encerrar(
    reuniaoId: string
  ): Promise<{ sucesso: boolean; ata?: string }>

  // Presenca
  async registrarPresenca(
    reuniaoId: string,
    membroId: string,
    tipo: TipoPresenca
  ): Promise<PresencaReuniao>

  async verificarQuorum(
    reuniaoId: string
  ): Promise<{ quorumAtingido: boolean; presentes: number; necessario: number }>

  // Pauta
  async adicionarItemPauta(
    reuniaoId: string,
    item: ItemPautaInput
  ): Promise<PautaReuniaoComissao>

  async reordenarPauta(
    reuniaoId: string,
    ordem: string[] // IDs na nova ordem
  ): Promise<PautaReuniaoComissao[]>

  async iniciarItemPauta(
    reuniaoId: string,
    itemId: string
  ): Promise<PautaReuniaoComissao>

  async encerrarItemPauta(
    reuniaoId: string,
    itemId: string,
    resultado: string
  ): Promise<PautaReuniaoComissao>

  // Votacao de parecer
  async iniciarVotacaoParecer(
    reuniaoId: string,
    parecerId: string
  ): Promise<VotacaoParecerComissao>

  async registrarVotoParecer(
    votacaoId: string,
    membroId: string,
    voto: ValorVoto
  ): Promise<VotoMembroComissao>

  async encerrarVotacaoParecer(
    votacaoId: string
  ): Promise<{ resultado: ResultadoVotacao; parecer: Parecer }>
}
```

---

## Regras de Negocio

### Comissoes Obrigatorias

| Regra | Descricao |
|-------|-----------|
| **RN-100** | CLJ e CFO sao comissoes PERMANENTES obrigatorias |
| **RN-101** | Composicao proporcional a representacao partidaria |
| **RN-102** | CLJ: analisa constitucionalidade, legalidade, tecnica legislativa |
| **RN-103** | CFO: analisa impacto orcamentario e financeiro |

### Comissao de Legislacao e Justica (CLJ)

```
+------------------------------------------+
|              CLJ - COMPETENCIAS           |
+------------------------------------------+
| 1. Constitucionalidade das proposicoes   |
| 2. Legalidade e juridicidade             |
| 3. Tecnica legislativa e redacao         |
| 4. Admissibilidade de emendas            |
| 5. Recursos contra decisoes da Mesa      |
+------------------------------------------+
| OBRIGATORIA para TODAS as proposicoes    |
| antes de ir a votacao em plenario        |
+------------------------------------------+
```

### Comissao de Financas e Orcamento (CFO)

```
+------------------------------------------+
|              CFO - COMPETENCIAS           |
+------------------------------------------+
| 1. Analise de impacto orcamentario       |
| 2. Compatibilidade com LDO e PPA         |
| 3. Criacao de despesa/reducao receita    |
| 4. Leis orcamentarias (LOA, LDO, PPA)    |
| 5. Contas do Executivo e Legislativo     |
+------------------------------------------+
| OBRIGATORIA para proposicoes com         |
| impacto financeiro/orcamentario          |
+------------------------------------------+
```

### Comissao Parlamentar de Inquerito (CPI)

| Regra | Descricao |
|-------|-----------|
| **RN-105** | CPI: requer 1/3 dos vereadores para criacao |
| **RN-106** | Poderes: oitiva, requisicao de documentos, quebra de sigilo |
| **RN-107** | Prazo determinado, prorrogavel 1x, conclusao com relatorio |

### Funcionamento

| Regra | Descricao |
|-------|-----------|
| **RN-108** | Reunioes com quorum de maioria simples dos membros |
| **RN-109** | Parecer DEVE conter fundamentacao e voto do relator |
| **RN-110** | Voto em separado permitido para membros discordantes |
| **RN-111** | Prazo de comissao: 15 dias uteis (prorrogavel 1x) |
| **RN-112** | Presidente so vota em caso de empate |
| **RN-113** | Ausencia de parecer no prazo: materia vai direto ao plenario |

---

## Fluxos Principais

### Fluxo de Tramitacao em Comissao

```
    PROPOSICAO RECEBIDA
            |
            v
    +-------------------+
    | DISTRIBUICAO AO   |
    | PRESIDENTE        |
    +-------------------+
            |
            v
    +-------------------+
    | DESIGNACAO DE     |
    | RELATOR           |
    +-------------------+
            |
            v
    +-------------------+
    | ANALISE PELO      |
    | RELATOR           |
    | (15 dias uteis)   |
    +-------------------+
            |
            v
    +-------------------+
    | ELABORACAO DO     |
    | PARECER           |
    +-------------------+
            |
            v
    +-------------------+
    | INCLUSAO NA       |
    | PAUTA DE REUNIAO  |
    +-------------------+
            |
            v
    +-------------------+
    | DISCUSSAO NA      |
    | COMISSAO          |
    +-------------------+
            |
            v
    +-------------------+
    | VOTACAO DO        |
    | PARECER           |
    +-------------------+
            |
       +----+----+
       |         |
       v         v
   APROVADO   REJEITADO
       |         |
       v         v
    PARECER    PARECER
    FAVORAVEL  CONTRARIO
       |         |
       +----+----+
            |
            v
    +-------------------+
    | ENCAMINHAMENTO    |
    | AO PLENARIO       |
    +-------------------+
```

### Fluxo de Reuniao de Comissao

```
    AGENDADA
        |
        v
    +-------------------+
    | CONVOCACAO        |
    | (48h antecedencia)|
    +-------------------+
        |
        v
    CONVOCADA
        |
        v
    +-------------------+
    | VERIFICAR QUORUM  |
    | (maioria membros) |
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
    | REUNIAO|        | 30 MIN  |
    +--------+        +--------+
        |                 |
        v                 v
    EM_ANDAMENTO      CANCELAR
        |
        v
    +-------------------+
    | APROVAR ATA       |
    | ANTERIOR          |
    +-------------------+
        |
        v
    +-------------------+
    | ORDEM DO DIA      |
    | - Pareceres       |
    | - Proposicoes     |
    | - Assuntos gerais |
    +-------------------+
        |
    Para cada item:
        |
    +-------------------+
    | DISCUSSAO         |
    +-------------------+
        |
        v
    +-------------------+
    | VOTACAO           |
    | (se necessario)   |
    +-------------------+
        |
        v
    +-------------------+
    | REGISTRAR         |
    | RESULTADO         |
    +-------------------+
        |
        v (proximo item)
        |
    +-------------------+
    | ENCERRAMENTO      |
    +-------------------+
        |
        v
    CONCLUIDA
```

### Fluxo de CPI

```
    REQUERIMENTO CPI
    (1/3 vereadores)
          |
          v
    +-------------------+
    | VERIFICAR         |
    | REQUISITOS        |
    | - Fato determinado|
    | - Prazo certo     |
    | - Assinaturas     |
    +-------------------+
          |
          +--------+--------+
          |                 |
          v                 v
      VALIDO            INVALIDO
          |                 |
          v                 v
    +----------+        ARQUIVAR
    | CRIACAO  |
    | CPI      |
    +----------+
          |
          v
    +-------------------+
    | COMPOSICAO        |
    | MEMBROS           |
    | (proporcional)    |
    +-------------------+
          |
          v
    +-------------------+
    | ELEICAO           |
    | PRESIDENTE E      |
    | RELATOR           |
    +-------------------+
          |
          v
    +-------------------+
    | TRABALHOS         |
    | - Reunioes        |
    | - Oitivas         |
    | - Requisicoes     |
    | - Diligencias     |
    +-------------------+
          |
          v
    +-------------------+
    | RELATORIO FINAL   |
    | (RN-107)          |
    +-------------------+
          |
          v
    +-------------------+
    | VOTACAO           |
    | RELATORIO         |
    +-------------------+
          |
          +--------+--------+
          |                 |
          v                 v
      APROVADO          REJEITADO
          |                 |
          v                 v
    +----------+        +----------+
    | ENVIAR   |        | RELATORIO|
    | MP/OUTROS|        | VENCIDO  |
    +----------+        +----------+
          |                 |
          +--------+--------+
                   |
                   v
    +-------------------+
    | EXTINCAO CPI      |
    +-------------------+
```

### Fluxo de Parecer

```
    PROPOSICAO EM COMISSAO
            |
            v
    +-------------------+
    | DESIGNACAO        |
    | RELATOR           |
    +-------------------+
            |
            v
    +-------------------+
    | ESTUDO DA         |
    | MATERIA           |
    +-------------------+
            |
            v
    +-------------------+
    | REDACAO           |
    | PARECER           |
    | - Relatorio       |
    | - Fundamentacao   |
    | - Voto            |
    +-------------------+
            |
            v
    +-------------------+
    | APRESENTACAO      |
    | STATUS: APRESENTADO|
    +-------------------+
            |
            v
    +-------------------+
    | INCLUSAO EM       |
    | PAUTA REUNIAO     |
    +-------------------+
            |
            v
    +-------------------+
    | LEITURA           |
    | COMISSAO          |
    +-------------------+
            |
            v
    +-------------------+
    | DISCUSSAO         |
    +-------------------+
            |
            v
    +-------------------+
    | PEDIDOS DE        |
    | VOTO SEPARADO?    |
    +-------------------+
            |
            +--------+--------+
            |                 |
            v                 v
          SIM               NAO
            |                 |
            v                 |
    +----------+              |
    | ANEXAR   |              |
    | VOTOS    |              |
    | SEPARADOS|              |
    +----------+              |
            |                 |
            +--------+--------+
                     |
                     v
    +-------------------+
    | VOTACAO           |
    | PARECER           |
    +-------------------+
            |
       +----+----+
       |         |
       v         v
   APROVADO   REJEITADO
       |         |
       v         v
    PARECER    PARECER
    COMISSAO   VENCIDO
       |         |
       +----+----+
            |
            v
    +-------------------+
    | ENCAMINHAMENTO    |
    | PLENARIO          |
    +-------------------+
```

---

## Validacoes Obrigatorias

### Ao Criar Comissao

- [ ] Verificar se sigla e unica
- [ ] CLJ e CFO devem ser PERMANENTE
- [ ] CPI requer 1/3 dos vereadores
- [ ] Definir legislatura vinculada

### Ao Adicionar Membro

- [ ] Verificar mandato ativo do parlamentar
- [ ] Verificar proporcionalidade partidaria
- [ ] Verificar se ja e membro
- [ ] Definir cargo na comissao

### Ao Agendar Reuniao

- [ ] Verificar disponibilidade de sala
- [ ] Verificar conflito de horario
- [ ] Minimo 48h para convocacao
- [ ] Gerar numero sequencial

### Ao Iniciar Reuniao

- [ ] Verificar quorum de presenca
- [ ] Verificar convocacao enviada
- [ ] Registrar presencas

### Ao Criar Parecer

- [ ] Designar relator membro da comissao
- [ ] Vincular a proposicao existente
- [ ] Gerar numero sequencial
- [ ] Verificar prazo de tramitacao

### Ao Votar Parecer

- [ ] Verificar se reuniao esta em andamento
- [ ] Verificar quorum para votacao
- [ ] Verificar se membro presente
- [ ] Registrar votos individuais

---

## Componentes React

### Admin

| Componente | Arquivo | Funcao |
|------------|---------|--------|
| ComissaoForm | `src/app/admin/comissoes/nova/page.tsx` | Criar comissao |
| ComissaoList | `src/app/admin/comissoes/page.tsx` | Lista comissoes |
| ComissaoDetail | `src/app/admin/comissoes/[id]/page.tsx` | Detalhes e membros |
| MembrosComissao | `src/components/admin/membros-comissao.tsx` | Gestao membros |
| ReuniaoForm | `src/app/admin/comissoes/reunioes/nova/page.tsx` | Agendar reuniao |
| ReuniaoList | `src/app/admin/comissoes/reunioes/page.tsx` | Lista reunioes |
| PautaReuniao | `src/components/admin/pauta-reuniao.tsx` | Gestao pauta |
| ParecerForm | `src/app/admin/pareceres/novo/page.tsx` | Criar parecer |

### Publico

| Componente | Arquivo | Funcao |
|------------|---------|--------|
| ComissoesPublico | `src/app/comissoes/page.tsx` | Lista publica |
| ComissaoPublica | `src/app/comissoes/[id]/page.tsx` | Detalhes publicos |
| ReunioesPublico | `src/app/comissoes/reunioes/page.tsx` | Calendario reunioes |

---

## Exemplos de Uso

### Exemplo 1: Criar Comissao Permanente

```typescript
// Criar CLJ
const clj = await prisma.comissao.create({
  data: {
    nome: 'Comissao de Legislacao e Justica',
    sigla: 'CLJ',
    tipo: 'PERMANENTE',
    descricao: 'Comissao permanente responsavel pela analise de constitucionalidade e legalidade',
    competencias: `
      1. Constitucionalidade das proposicoes
      2. Legalidade e juridicidade
      3. Tecnica legislativa e redacao
      4. Admissibilidade de emendas
      5. Recursos contra decisoes da Mesa
    `,
    legislaturaId,
    ativa: true
  }
})

// Criar CFO
const cfo = await prisma.comissao.create({
  data: {
    nome: 'Comissao de Financas e Orcamento',
    sigla: 'CFO',
    tipo: 'PERMANENTE',
    descricao: 'Comissao permanente responsavel pela analise de impacto orcamentario',
    competencias: `
      1. Analise de impacto orcamentario
      2. Compatibilidade com LDO e PPA
      3. Criacao de despesa ou reducao de receita
      4. Leis orcamentarias (LOA, LDO, PPA)
      5. Contas do Executivo e Legislativo
    `,
    legislaturaId,
    ativa: true
  }
})
```

### Exemplo 2: Criar CPI

```typescript
import { ReuniaoComissaoService } from '@/lib/services/reuniao-comissao-service'

// 1. Verificar requisitos (1/3 dos vereadores = 3 de 9)
const assinaturas = await prisma.parlamentar.count({
  where: {
    id: { in: parlamentaresRequerentes },
    ativo: true,
    mandatos: {
      some: {
        ativo: true
      }
    }
  }
})

const totalVereadores = 9
const minimoAssinaturas = Math.ceil(totalVereadores / 3)

if (assinaturas < minimoAssinaturas) {
  throw new Error(`CPI requer ${minimoAssinaturas} assinaturas, fornecidas: ${assinaturas}`)
}

// 2. Criar CPI
const cpi = await prisma.comissao.create({
  data: {
    nome: 'CPI das Obras Paralisadas',
    sigla: 'CPI-OBRAS',
    tipo: 'INQUERITO',
    descricao: 'Investigar irregularidades em obras publicas paralisadas no municipio',
    competencias: `
      Fato determinado: Obras publicas paralisadas entre 2022-2024
      Poderes: Oitiva de testemunhas, requisicao de documentos
    `,
    dataCriacao: new Date(),
    dataExtincao: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 dias
    legislaturaId,
    ativa: true
  }
})

// 3. Compor membros (proporcional)
const membros = [
  { parlamentarId: 'id1', cargo: 'PRESIDENTE' },
  { parlamentarId: 'id2', cargo: 'RELATOR' },
  { parlamentarId: 'id3', cargo: 'MEMBRO' },
  { parlamentarId: 'id4', cargo: 'MEMBRO' },
  { parlamentarId: 'id5', cargo: 'MEMBRO' }
]

for (const membro of membros) {
  await prisma.membroComissao.create({
    data: {
      comissaoId: cpi.id,
      parlamentarId: membro.parlamentarId,
      cargo: membro.cargo,
      ativo: true
    }
  })
}
```

### Exemplo 3: Agendar e Convocar Reuniao

```typescript
const service = new ReuniaoComissaoService()

// 1. Agendar reuniao
const reuniao = await service.criar({
  comissaoId: cljId,
  dataHora: new Date('2024-03-15T14:00:00'),
  local: 'Sala de Comissoes',
  pauta: [
    {
      tipo: 'PROPOSICAO',
      proposicaoId: 'prop-1',
      titulo: 'PL 001/2024 - Analise de constitucionalidade'
    },
    {
      tipo: 'PARECER',
      parecerId: 'parecer-1',
      titulo: 'Parecer 005/2024 - Votacao'
    }
  ]
})

// 2. Convocar membros (envia notificacao)
const membrosComissao = await prisma.membroComissao.findMany({
  where: { comissaoId: cljId, ativo: true }
})

const convocacao = await service.convocar(
  reuniao.id,
  membrosComissao.map(m => m.id)
)

console.log(`Convocacao enviada para ${convocacao.convocacoes} membros`)
```

### Exemplo 4: Conduzir Reuniao

```typescript
const service = new ReuniaoComissaoService()

// 1. Registrar presencas
const membrosPresentes = ['membro-1', 'membro-2', 'membro-3']

for (const membroId of membrosPresentes) {
  await service.registrarPresenca(reuniaoId, membroId, 'PRESENTE')
}

// 2. Verificar quorum
const quorum = await service.verificarQuorum(reuniaoId)

if (!quorum.quorumAtingido) {
  throw new Error(`Quorum insuficiente: ${quorum.presentes}/${quorum.necessario}`)
}

// 3. Iniciar reuniao
await service.iniciar(reuniaoId)

// 4. Processar itens da pauta
const itens = await prisma.pautaReuniaoComissao.findMany({
  where: { reuniaoId },
  orderBy: { ordem: 'asc' }
})

for (const item of itens) {
  // Iniciar discussao do item
  await service.iniciarItemPauta(reuniaoId, item.id)

  // Se for parecer, votar
  if (item.tipo === 'PARECER' && item.parecerId) {
    // Iniciar votacao
    const votacao = await service.iniciarVotacaoParecer(reuniaoId, item.parecerId)

    // Registrar votos dos presentes
    await service.registrarVotoParecer(votacao.id, 'membro-1', 'SIM')
    await service.registrarVotoParecer(votacao.id, 'membro-2', 'SIM')
    await service.registrarVotoParecer(votacao.id, 'membro-3', 'NAO')

    // Encerrar votacao e obter resultado
    const resultado = await service.encerrarVotacaoParecer(votacao.id)
    console.log(`Parecer ${resultado.resultado}: ${resultado.parecer.tipo}`)
  }

  // Encerrar item
  await service.encerrarItemPauta(reuniaoId, item.id, 'Concluido')
}

// 5. Encerrar reuniao
const encerramento = await service.encerrar(reuniaoId)
console.log('Reuniao encerrada, ata:', encerramento.ata)
```

### Exemplo 5: Criar e Aprovar Parecer

```typescript
// 1. Criar parecer
const parecer = await prisma.parecer.create({
  data: {
    numero: await gerarNumeroParecer(comissaoId, ano),
    ano: 2024,
    tipo: 'FAVORAVEL',
    texto: `
      PARECER N. 001/2024 - CLJ

      PROJETO DE LEI N. 001/2024

      RELATOR: Ver. Fulano de Tal

      I - RELATORIO
      Trata-se de projeto de lei que dispoe sobre...

      II - FUNDAMENTACAO
      O projeto atende aos requisitos de constitucionalidade...

      III - VOTO DO RELATOR
      Pelo exposto, voto pela APROVACAO do PL 001/2024.

      Sala das Comissoes, em 10 de marco de 2024.

      Ver. Fulano de Tal
      Relator
    `,
    votoRelator: 'APROVACAO',
    fundamentacao: 'Atende requisitos constitucionais e legais',
    proposicaoId,
    comissaoId: cljId,
    relatorId: parlamentarRelatorId,
    status: 'APRESENTADO'
  }
})

// 2. Incluir na pauta da proxima reuniao
await prisma.pautaReuniaoComissao.create({
  data: {
    reuniaoId: proximaReuniaoId,
    tipo: 'PARECER',
    parecerId: parecer.id,
    titulo: `Votacao do Parecer ${parecer.numero}/${parecer.ano}`,
    ordem: proximaOrdem
  }
})

// 3. Na reuniao, apos votacao aprovada
await prisma.parecer.update({
  where: { id: parecer.id },
  data: {
    status: 'APROVADO',
    dataAprovacao: new Date()
  }
})

// 4. Proposicao pode ir ao plenario
await prisma.proposicao.update({
  where: { id: proposicaoId },
  data: {
    status: 'EM_PAUTA' // Pronta para ordem do dia
  }
})
```

---

## Checklist de Implementacao

### Comissoes

- [x] CRUD completo
- [x] Tipos: permanente, temporaria, especial, CPI
- [x] Composicao proporcional
- [x] Competencias por tipo
- [x] Vinculo com legislatura

### Membros

- [x] Adicionar/remover membros
- [x] Cargos: presidente, vice, relator, membro
- [x] Historico de participacao
- [x] Verificacao de mandato ativo

### Reunioes

- [x] Agendamento
- [x] Convocacao (48h)
- [x] Controle de presenca
- [x] Verificacao de quorum
- [x] Gestao de pauta
- [x] Ata de reuniao

### Pareceres

- [x] Criacao com relator
- [x] Numeracao sequencial por comissao (formato: NNN/YYYY-SIGLA)
- [x] Tipos de parecer (FAVORAVEL, CONTRARIO, etc)
- [x] Status AGUARDANDO_PAUTA para inclusao em reuniao
- [x] Filtro de proposicoes em tramitacao para comissao
- [x] Validacao de tramitacao antes de criar parecer
- [x] Voto em separado
- [x] Votacao em reuniao

### CPI

- [x] Verificacao 1/3 assinaturas
- [x] Prazo determinado
- [x] Poderes especiais
- [x] Relatorio final

---

## Integracao com Outros Modulos

### skill-legislativo.md
- Tramitacao de proposicoes
- Pareceres obrigatorios (CLJ, CFO)
- Inclusao em pauta apos parecer

### skill-operador.md
- Resultado de pareceres na votacao
- Destaque de parecer em plenario

### skill-secretaria.md
- Distribuicao a comissoes
- Controle de prazos
- Montagem de pauta

### skill-transparencia.md
- Publicacao de pareceres
- Atas de reunioes
- Composicao de comissoes

---

## Sistema Simplificado de Gerenciamento (v2.0)

### Novos Componentes

Componentes simplificados para gerenciamento rapido de comissoes:

| Componente | Arquivo | Funcao |
|------------|---------|--------|
| ComissaoDashboard | `src/components/admin/comissoes/ComissaoDashboard.tsx` | Dashboard unificado com estatisticas e acoes rapidas |
| DeadlineIndicator | `src/components/admin/comissoes/DeadlineIndicator.tsx` | Indicador visual de prazo (RN-113) |
| QuickMeetingDialog | `src/components/admin/comissoes/QuickMeetingDialog.tsx` | Wizard de 2 passos para criar reuniao |
| QuickParecerForm | `src/components/admin/comissoes/QuickParecerForm.tsx` | Formulario simplificado com template |
| QuickAddPautaItems | `src/components/admin/comissoes/QuickAddPautaItems.tsx` | Adicao em lote de itens na pauta |
| VotingGrid | `src/components/admin/comissoes/VotingGrid.tsx` | Grid visual de votacao com RN-112 |

### Novos Servicos

| Servico | Arquivo | Funcao |
|---------|---------|--------|
| deadline-service | `src/lib/services/deadline-service.ts` | Calculo de prazos (RN-113: 15 dias) |
| parecer-template-service | `src/lib/services/parecer-template-service.ts` | Templates de parecer por tipo |
| meeting-defaults-service | `src/lib/services/meeting-defaults-service.ts` | Defaults inteligentes para reunioes |

### Novas APIs

| Rota | Metodo | Funcionalidade |
|------|--------|----------------|
| `/api/comissoes/[id]/dashboard` | GET | Dados agregados para dashboard |
| `/api/reunioes-comissao/[id]/pauta/bulk` | POST | Adicao em lote de itens na pauta |

### Nova Pagina

| Rota | Arquivo | Funcao |
|------|---------|--------|
| `/admin/comissoes/[id]` | `src/app/admin/comissoes/[id]/page.tsx` | Dashboard individual da comissao |

### Ganhos de Produtividade

| Tarefa | Antes | Depois | Reducao |
|--------|-------|--------|---------|
| Criar reuniao | 3-5 min | 30 seg | 85% |
| Montar pauta | 10-15 min | 2-3 min | 80% |
| Gerar parecer | 15-20 min | 3-5 min | 75% |
| Votar parecer | 2-3 min | 30 seg | 85% |

### Regras Implementadas

- **RN-112**: Presidente so vota em empate (VotingGrid)
- **RN-113**: Indicador de prazo vencido (DeadlineIndicator)
