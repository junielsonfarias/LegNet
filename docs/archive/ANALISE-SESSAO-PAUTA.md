# Analise Comparativa: Sessao e Pauta

> **Data**: 2026-01-29
> **Objetivo**: Comparar a estrutura de Sessoes e Pautas entre o sistema atual e o SAPL do Interlegis

---

## 1. Estrutura do SAPL (Interlegis)

### 1.1 Modelo SessaoPlenaria

O SAPL usa um modelo direto sem entidade intermediaria de pauta:

```python
class SessaoPlenaria(models.Model):
    # Identificacao
    numero = PositiveIntegerField
    tipo = FK(TipoSessaoPlenaria)           # Ordinaria, Extraordinaria, Solene

    # Temporalidade
    data_inicio = DateField                  # Data de abertura
    data_fim = DateField (opcional)          # Data de encerramento
    hora_inicio = CharField("HH:MM")         # Horario inicio
    hora_fim = CharField("HH:MM")            # Horario fim

    # Vinculacoes
    sessao_legislativa = FK(SessaoLegislativa)  # Periodo legislativo (1º/2º semestre)
    legislatura = FK(Legislatura)               # Legislatura (4 anos)

    # Status
    painel_aberto = BooleanField             # Painel eletronico ativo
    iniciada = BooleanField                  # Sessao iniciada
    finalizada = BooleanField                # Sessao encerrada
    interativa = BooleanField                # Sessao interativa

    # Documentos (ARQUIVOS, nao texto)
    upload_pauta = FileField                 # PDF da pauta
    upload_ata = FileField                   # PDF da ata
    upload_anexo = FileField                 # Anexos

    # Extras
    url_audio = URLField                     # Link audio
    url_video = URLField                     # Link video
    tema_solene = TextField                  # Tema (sessoes solenes)
```

### 1.2 Itens da Sessao - SEPARACAO POR MODELO

O SAPL separa itens em **3 modelos distintos**:

#### ExpedienteSessao (Conteudo geral do expediente)
```python
class ExpedienteSessao(models.Model):
    sessao_plenaria = FK(SessaoPlenaria)
    tipo = FK(TipoExpediente)    # Ata anterior, Correspondencias, etc.
    conteudo = TextField         # Texto livre
```

#### ExpedienteMateria (Materias lidas no expediente)
```python
class ExpedienteMateria(AbstractOrdemDia):
    # Herda de AbstractOrdemDia
    sessao_plenaria = FK(SessaoPlenaria)
    materia = FK(MateriaLegislativa)
    numero_ordem = PositiveIntegerField
    data_ordem = DateField
    tipo_votacao = IntegerField  # Simbolica, Nominal, Secreta, Leitura
    resultado = TextField
    observacao = TextField
    votacao_aberta = BooleanField
```

#### OrdemDia (Materias para votacao)
```python
class OrdemDia(AbstractOrdemDia):
    # Mesma estrutura do ExpedienteMateria
    # Mas representa itens da Ordem do Dia
```

### 1.3 Presenca Separada

```python
class SessaoPlenariaPresenca(models.Model):
    sessao_plenaria = FK(SessaoPlenaria)
    parlamentar = FK(Parlamentar)
    # Presenca GERAL na sessao

class PresencaOrdemDia(models.Model):
    sessao_plenaria = FK(SessaoPlenaria)
    parlamentar = FK(Parlamentar)
    # Presenca para VOTACAO ESPECIFICA na Ordem do Dia
```

### 1.4 Diagrama SAPL

```
┌─────────────────────────────────────────────────────────────────┐
│                      SessaoPlenaria                             │
│  - numero, tipo, data_inicio, hora_inicio                       │
│  - upload_pauta (PDF), upload_ata (PDF)                         │
│  - painel_aberto, iniciada, finalizada                          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
┌─────────────────┐ ┌─────────────┐ ┌─────────────────┐
│ ExpedienteSessao│ │Expediente   │ │    OrdemDia     │
│                 │ │Materia      │ │                 │
│ - tipo          │ │             │ │ - materia       │
│ - conteudo      │ │ - materia   │ │ - numero_ordem  │
│ (texto livre)   │ │ - numero    │ │ - tipo_votacao  │
│                 │ │ - tipo_vot  │ │ - resultado     │
└─────────────────┘ └─────────────┘ └─────────────────┘
     (conteudo)        (leitura)       (votacao)
```

---

## 2. Estrutura Atual do Sistema

### 2.1 Modelo Sessao

```prisma
model Sessao {
  id            String
  numero        Int
  tipo          TipoSessao         // ORDINARIA, EXTRAORDINARIA, SOLENE, ESPECIAL
  data          DateTime
  horario       String?            // "14:00"
  local         String?
  status        StatusSessao       // AGENDADA, EM_ANDAMENTO, CONCLUIDA, CANCELADA
  descricao     String?
  ata           String? @db.Text   // ⚠️ Texto da ata (nao PDF)
  finalizada    Boolean            // Flag legado
  legislaturaId String?
  periodoId     String?
  pauta         String? @db.Text   // ⚠️ REDUNDANTE - JSON da pauta
  tempoInicio   DateTime?          // Cronometro

  // Relacionamentos
  pautaSessao   PautaSessao?       // Relacao 1:1 com PautaSessao
  presencas     PresencaSessao[]
}
```

### 2.2 Modelo PautaSessao (Entidade intermediaria)

```prisma
model PautaSessao {
  id                    String
  sessaoId              String @unique      // 1:1 com Sessao
  status                PautaStatus         // RASCUNHO, APROVADA, EM_ANDAMENTO, CONCLUIDA
  geradaAutomaticamente Boolean
  observacoes           String?
  tempoTotalEstimado    Int
  tempoTotalReal        Int?
  itemAtualId           String? @unique     // Ponteiro para item atual

  itens     PautaItem[]
  itemAtual PautaItem?                      // Self-reference
}
```

### 2.3 Modelo PautaItem (Modelo unico para tudo)

```prisma
model PautaItem {
  id             String
  pautaId        String
  secao          PautaSecao          // EXPEDIENTE, ORDEM_DO_DIA, COMUNICACOES, HONRAS, OUTROS
  ordem          Int
  titulo         String
  descricao      String?
  proposicaoId   String?             // Link com proposicao
  tempoEstimado  Int?
  tempoReal      Int?
  status         PautaItemStatus     // 9 estados possiveis
  tipoAcao       TipoAcaoPauta       // LEITURA, DISCUSSAO, VOTACAO, COMUNICADO, HOMENAGEM
  autor          String?
  observacoes    String?
  tempoAcumulado Int
  iniciadoEm     DateTime?
  finalizadoEm   DateTime?
  tipoVotacao    TipoVotacao         // NOMINAL, SECRETA

  // Campos de Vista
  vistaRequestedBy String?
  vistaRequestedAt DateTime?
  vistaPrazo       DateTime?

  // Campos de Turno
  turnoAtual        Int
  turnoFinal        Int?
  resultadoTurno1   ResultadoVotacaoAgrupada?
  resultadoTurno2   ResultadoVotacaoAgrupada?
  dataVotacaoTurno1 DateTime?
  dataVotacaoTurno2 DateTime?
  intersticio       Boolean
  dataIntersticio   DateTime?
  prazoIntersticio  DateTime?
}
```

### 2.4 Diagrama Sistema Atual

```
┌─────────────────────────────────────────────────────────────────┐
│                         Sessao                                  │
│  - numero, tipo, data, horario, status                          │
│  - ata (TEXT), pauta (JSON) ← REDUNDANTE                        │
│  - tempoInicio (cronometro)                                     │
└──────────────────────────┬──────────────────────────────────────┘
                           │ 1:1
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PautaSessao                                │
│  - status (RASCUNHO → APROVADA → EM_ANDAMENTO → CONCLUIDA)      │
│  - tempoTotalEstimado, tempoTotalReal                           │
│  - itemAtualId (ponteiro para item em discussao)                │
└──────────────────────────┬──────────────────────────────────────┘
                           │ 1:N
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                       PautaItem                                 │
│  - secao (EXPEDIENTE, ORDEM_DO_DIA, etc.) ← DISCRIMINADOR       │
│  - tipoAcao (LEITURA, VOTACAO, etc.)                            │
│  - proposicaoId (opcional)                                      │
│  - 9 status possiveis                                           │
│  - campos de turno e vista                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Comparacao Direta

### 3.1 Tabela Comparativa

| Aspecto | SAPL | Sistema Atual | Avaliacao |
|---------|------|---------------|-----------|
| **Entidade Pauta** | Nao existe (itens direto na sessao) | PautaSessao intermediaria | ✅ Atual e melhor (permite rascunho, publicacao) |
| **Separacao de Itens** | 3 modelos: ExpedienteSessao, ExpedienteMateria, OrdemDia | 1 modelo: PautaItem com enum `secao` | ⚠️ SAPL mais explicito, Atual mais flexivel |
| **Tipo de Votacao** | 4 opcoes: Simbolica, Nominal, Secreta, Leitura | 2 opcoes: NOMINAL, SECRETA | ⚠️ SAPL tem votacao simbolica |
| **Documentos** | Arquivos PDF (upload_pauta, upload_ata) | Texto (ata String) | ⚠️ SAPL melhor para documentos oficiais |
| **Presenca** | 2 modelos: SessaoPlenariaPresenca + PresencaOrdemDia | 1 modelo: PresencaSessao | ⚠️ SAPL rastrea presenca por votacao |
| **Status Sessao** | 3 booleans: iniciada, finalizada, interativa | 1 enum: StatusSessao | ✅ Atual e mais claro |
| **Cronometro** | Nao tem | tempoInicio, tempoAcumulado | ✅ Atual tem cronometro |
| **Turnos** | Nao encontrado | turnoAtual, resultadoTurno1/2, intersticio | ✅ Atual tem suporte completo |
| **Vista** | Nao encontrado nos modelos | vistaRequestedBy, vistaPrazo | ✅ Atual tem suporte |
| **Destaques** | Nao encontrado | DestaquePautaItem | ✅ Atual tem suporte |

### 3.2 Problemas Identificados no Sistema Atual

#### PROBLEMA 1: Campo `pauta` Redundante na Sessao

```prisma
// Em Sessao:
pauta String? @db.Text  // JSON da pauta ← REDUNDANTE!
pautaSessao PautaSessao? // ← JA TEM RELACAO!
```

**Impacto**: Dados podem ficar dessincronizados.
**Solucao**: Remover `Sessao.pauta` e usar apenas `PautaSessao`.

#### PROBLEMA 2: Campo `ata` como Texto

```prisma
ata String? @db.Text  // Texto da ata
```

**No SAPL**: `upload_ata = FileField` (arquivo PDF)
**Impacto**: Atas sao documentos oficiais que devem ser assinados.
**Solucao**: Adicionar campo `ataArquivo` para PDF assinado.

#### PROBLEMA 3: Falta Votacao Simbolica

```prisma
enum TipoVotacao {
  NOMINAL   // Votos individuais registrados
  SECRETA   // Apenas totais
  // FALTA: SIMBOLICA
}
```

**No SAPL**: Tem `tipo_votacao` com 4 opcoes incluindo "Simbolica" (mao levantada).
**Impacto**: Votacoes simbolicas sao comuns em itens nao controversos.
**Solucao**: Adicionar `SIMBOLICA` ao enum.

#### PROBLEMA 4: Presenca Unica (Nao Rastrea por Votacao)

```prisma
model PresencaSessao {
  sessaoId String
  parlamentarId String
  presente Boolean
  // FALTA: Presenca por item/votacao
}
```

**No SAPL**: Tem `PresencaOrdemDia` separada para cada votacao.
**Impacto**: Parlamentar pode sair durante a sessao e ainda constar como presente em votacoes.
**Solucao**: Adicionar `PresencaVotacao` ou campo em `VotoIndividual`.

#### PROBLEMA 5: Falta Separacao Clara entre Expediente Geral e Materias

No SAPL:
- `ExpedienteSessao` = Conteudo textual (ata anterior, correspondencias)
- `ExpedienteMateria` = Proposicoes lidas no expediente

No sistema atual:
- Tudo e `PautaItem` com `secao = EXPEDIENTE`

**Impacto**: Itens de expediente sem proposicao vinculada ficam confusos.
**Solucao**: Usar `tipoAcao` para diferenciar (ja existe parcialmente).

#### PROBLEMA 6: Horario Inconsistente

```prisma
// Em Sessao:
data       DateTime      // Data da sessao
horario    String?       // "14:00" ← TEXTO
tempoInicio DateTime?    // Cronometro ← DATETIME
```

**Impacto**: `horario` e texto enquanto `tempoInicio` e DateTime.
**Solucao**: Unificar formato ou converter `horario` para Time.

---

## 4. Recomendacoes de Melhoria

### 4.1 Alteracoes Prioritarias (CRITICAS)

#### 1. Remover Campo Redundante `Sessao.pauta`

```prisma
model Sessao {
  // REMOVER:
  // pauta String? @db.Text

  // MANTER:
  pautaSessao PautaSessao?
}
```

**Migracao**: Verificar se ha dados em `pauta` antes de remover.

#### 2. Adicionar Tipo de Votacao Simbolica

```prisma
enum TipoVotacao {
  NOMINAL    // Votacao nominal - votos individuais registrados
  SECRETA    // Votacao secreta - apenas totais
  SIMBOLICA  // Votacao simbolica - mao levantada, sem registro individual
  LEITURA    // Apenas leitura, sem votacao
}
```

#### 3. Adicionar Campo para Ata em PDF

```prisma
model Sessao {
  ata         String?  @db.Text    // Texto da ata (rascunho)
  ataArquivo  String?              // Caminho do PDF assinado
  ataStatus   StatusAta @default(RASCUNHO)  // RASCUNHO, PENDENTE_APROVACAO, APROVADA
}

enum StatusAta {
  RASCUNHO
  PENDENTE_APROVACAO
  APROVADA
}
```

### 4.2 Alteracoes Recomendadas (IMPORTANTES)

#### 4. Rastrar Presenca por Votacao

```prisma
model VotoIndividual {
  // Campos existentes...

  // ADICIONAR:
  presenteNaVotacao Boolean @default(true)  // Confirma presenca no momento do voto
}

// OU criar modelo separado:
model PresencaVotacao {
  id            String @id @default(cuid())
  pautaItemId   String
  parlamentarId String
  presente      Boolean
  horaRegistro  DateTime @default(now())

  pautaItem   PautaItem   @relation(...)
  parlamentar Parlamentar @relation(...)

  @@unique([pautaItemId, parlamentarId])
}
```

#### 5. Normalizar Horarios

```prisma
model Sessao {
  // SUBSTITUIR:
  // horario String?

  // POR:
  horaAgendada  DateTime?  // Hora planejada (pode ser apenas Time se o banco suportar)
  tempoInicio   DateTime?  // Hora real de inicio (cronometro)
  tempoFim      DateTime?  // Hora real de encerramento
}
```

### 4.3 Alteracoes Opcionais (MELHORIAS)

#### 6. Adicionar URLs de Midia

```prisma
model Sessao {
  // ADICIONAR (como no SAPL):
  urlAudio    String?  // Link para audio da sessao
  urlVideo    String?  // Link para video/transmissao
}
```

#### 7. Separar Tipos de Expediente

```prisma
enum TipoExpediente {
  ATA_ANTERIOR           // Leitura da ata
  CORRESPONDENCIAS       // Correspondencias recebidas
  COMUNICACOES_MESA      // Comunicados da Mesa Diretora
  MATERIA_EXPEDIENTE     // Proposicoes para leitura
  OUTROS_EXPEDIENTE      // Outros itens
}

model PautaItem {
  // ADICIONAR:
  tipoExpediente TipoExpediente?  // Apenas quando secao = EXPEDIENTE
}
```

---

## 5. Plano de Migracao Sugerido

### Fase 1: Remocao de Redundancia (URGENTE)

1. Verificar dados em `Sessao.pauta`
2. Migrar dados para `PautaSessao` se necessario
3. Remover campo `pauta` do schema
4. Executar `prisma migrate`

### Fase 2: Novos Tipos de Votacao

1. Adicionar `SIMBOLICA` e `LEITURA` ao enum `TipoVotacao`
2. Atualizar servicos de votacao para tratar novos tipos
3. Atualizar UI do painel operador

### Fase 3: Ata como Documento

1. Adicionar campos `ataArquivo` e `ataStatus`
2. Criar API de upload de ata
3. Implementar fluxo de aprovacao de ata

### Fase 4: Presenca por Votacao (OPCIONAL)

1. Criar modelo `PresencaVotacao` ou campo em `VotoIndividual`
2. Atualizar servico de votacao
3. Gerar relatorios de presenca por votacao

---

## 6. Status da Implementacao

### Correcoes Implementadas (2026-01-29)

| Correcao | Status | Detalhes |
|----------|--------|----------|
| Remover `Sessao.pauta` | ✅ Implementado | Campo removido do schema e APIs |
| Adicionar SIMBOLICA | ✅ Implementado | Novo tipo de votacao |
| Adicionar LEITURA | ✅ Implementado | Novo tipo de votacao |
| Atualizar APIs | ✅ Implementado | Tratamento para novos tipos |
| Atualizar servicos | ✅ Implementado | Tipos atualizados |

### Pendente (Executar apos reiniciar servidor)

```bash
# Regenerar cliente Prisma
npx prisma generate

# Aplicar alteracoes ao banco
npx prisma db push
```

---

## 7. Conclusao

O sistema atual tem uma arquitetura **mais flexivel e moderna** que o SAPL em varios aspectos:
- Entidade `PautaSessao` permite rascunho e publicacao
- Suporte completo a turnos e intersticio
- Cronometro integrado
- Destaques para votacao em separado

Porem, existem **problemas que devem ser corrigidos**:
1. **CRITICO**: Campo `Sessao.pauta` redundante
2. **IMPORTANTE**: Falta tipo de votacao simbolica
3. **IMPORTANTE**: Ata deve ser documento (PDF), nao texto

A principal diferenca arquitetural e que o SAPL vincula itens diretamente a sessao, enquanto o sistema atual usa `PautaSessao` como intermediario. A abordagem atual e **superior** pois permite:
- Criar pauta antes de vincular a sessao
- Publicar pauta para transparencia (RN-125)
- Rastrear status da pauta independente do status da sessao

---

## Fontes

- [SAPL - Sistema de Apoio ao Processo Legislativo](https://www.interlegis.leg.br/produtos-servicos/sapl)
- [GitHub - interlegis/sapl](https://github.com/interlegis/sapl)
- [Documentacao SAPL - Interlegis Portal](https://www12.senado.leg.br/interlegis/produtos/sapl)
