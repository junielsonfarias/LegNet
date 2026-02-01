# Analise Comparativa: SAPL vs Sistema Camara Mojui

## Visao Geral

Este documento analisa as diferencas entre o SAPL (Sistema de Apoio ao Processo Legislativo) do Interlegis e nosso sistema de pauta de sessoes, identificando oportunidades de melhoria.

## Fontes de Referencia

- [GitHub SAPL](https://github.com/interlegis/sapl)
- [Interlegis Portal](https://www12.senado.leg.br/interlegis/produtos/sapl)
- [Exemplo Cascavel](https://sapl.cascavel.pr.leg.br/sessao/pauta-sessao/823/)

---

## Estrutura do SAPL

### Modelos Principais de Sessao

```python
# SAPL - sapl/sessao/models.py

SessaoPlenaria:
  - painel_aberto (BooleanField)          # Controle do painel eletronico
  - url_audio (URLField)                   # Link do audio da sessao
  - url_video (URLField)                   # Link do video da sessao
  - upload_pauta (FileField)               # PDF da pauta
  - upload_ata (FileField)                 # PDF da ata
  - upload_anexo (FileField)               # Anexos
  - iniciada, finalizada (BooleanField)    # Estado da sessao
  - tema_solene (TextField)                # Tema (para sessoes solenes)

TipoExpediente:
  - nome (CharField)                       # Ex: "Pequeno Expediente", "Grande Expediente"
  - ordenacao (PositiveIntegerField)

ExpedienteSessao:
  - sessao_plenaria (FK)
  - tipo (FK -> TipoExpediente)
  - conteudo (TextField)                   # Texto livre do expediente

ExpedienteMateria:                         # Materias VOTAVEIS no expediente
  - sessao_plenaria (FK)
  - materia (FK -> MateriaLegislativa)
  - numero_ordem (PositiveIntegerField)
  - resultado (TextField)
  - tipo_votacao (choices)                 # Simbolica, Nominal, Secreta, Leitura
  - votacao_aberta (BooleanField)

OrdemDia:                                  # Materias da Ordem do Dia
  - (mesma estrutura do ExpedienteMateria)

PresencaOrdemDia:                          # Presenca especifica para votacao
  - sessao_plenaria (FK)
  - parlamentar (FK)

RegistroVotacao:                           # Resultado consolidado
  - tipo_resultado_votacao (FK)
  - materia (FK)
  - ordem (FK -> OrdemDia, opcional)
  - expediente (FK -> ExpedienteMateria, opcional)
  - numero_votos_sim, numero_votos_nao, numero_abstencoes
  - user, ip, data_hora                    # Rastreabilidade

VotoParlamentar:                           # Voto individual
  - votacao (FK -> RegistroVotacao)
  - parlamentar (FK)
  - voto (CharField)
```

### Secoes da Pauta no SAPL

1. **Pequeno Expediente**
   - Leitura biblica/momento civico
   - Registro de presencas
   - Leitura e aprovacao de ata
   - Correspondencias e comunicacoes

2. **Grande Expediente**
   - Pronunciamentos de liderancas
   - Oradores inscritos
   - Tribuna livre

3. **Materias do Expediente**
   - Materias para leitura/votacao rapida
   - Requerimentos simples
   - Indicacoes

4. **Ordem do Dia**
   - Projetos de lei
   - Materias que requerem discussao
   - Votacoes principais

---

## Nosso Sistema Atual

### Modelos de Pauta

```prisma
model Sessao {
  id            String
  numero        Int
  tipo          TipoSessao
  data          DateTime
  horario       String?
  local         String?
  status        StatusSessao
  descricao     String?
  ata           String?         // Apenas texto, sem upload
  finalizada    Boolean
  tempoInicio   DateTime?
}

model PautaSessao {
  id                    String
  sessaoId              String
  status                PautaStatus
  geradaAutomaticamente Boolean
  observacoes           String?
  tempoTotalEstimado    Int
  tempoTotalReal        Int?
  itemAtualId           String?     // Item em discussao/votacao
}

model PautaItem {
  secao          PautaSecao      // EXPEDIENTE, ORDEM_DO_DIA, COMUNICACOES, HONRAS, OUTROS
  ordem          Int
  titulo         String
  descricao      String?
  proposicaoId   String?
  tempoEstimado  Int?
  status         PautaItemStatus
  tipoAcao       TipoAcaoPauta   // LEITURA, DISCUSSAO, VOTACAO, COMUNICADO, HOMENAGEM
  tipoVotacao    TipoVotacao

  // Campos de turno (ja temos!)
  turnoAtual, turnoFinal
  resultadoTurno1, resultadoTurno2
  intersticio, prazoIntersticio

  // Campos de etapa (ja temos!)
  etapa           Int?            // 1 = 1a Ordem do Dia, 2 = 2a Ordem do Dia
  leituraNumero   Int?
  parecerId       String?
  relatorId       String?

  // Sistema de vista (ja temos!)
  vistaRequestedBy, vistaRequestedAt, vistaPrazo
}

model DestaquePautaItem {
  // Destaque para votacao em separado (ja temos!)
}
```

---

## Comparacao: O que temos vs O que falta

### O que JA TEMOS (pontos fortes):

| Funcionalidade | Status |
|----------------|--------|
| Sistema de turnos completo | ✅ Implementado |
| Intersticio entre turnos | ✅ Implementado |
| Etapas (1a e 2a Ordem do Dia) | ✅ Implementado |
| Sistema de vista | ✅ Implementado |
| Destaque para votacao em separado | ✅ Implementado |
| Mesa da sessao especifica | ✅ Implementado |
| Relator por item | ✅ Implementado |
| Parecer vinculado | ✅ Implementado |
| VotacaoAgrupada com resultado | ✅ Implementado |
| Painel eletronico em tempo real | ✅ Implementado |

### O que FALTA (oportunidades de melhoria):

| Funcionalidade | SAPL | Nosso | Prioridade |
|----------------|------|-------|------------|
| Campos de midia (audio/video) | ✅ url_audio, url_video | ❌ | Media |
| Upload de arquivos (pauta PDF, ata PDF) | ✅ upload_pauta, upload_ata | ❌ | Media |
| Tipos de expediente configuraveis | ✅ TipoExpediente | ❌ | Baixa |
| ExpedienteSessao (texto livre) | ✅ | ❌ | Media |
| ExpedienteMateria separado | ✅ | Parcial (usamos PautaItem.secao) | Baixa |
| Presenca especifica para Ordem do Dia | ✅ PresencaOrdemDia | ❌ | Media |
| Correspondencias como modelo separado | ✅ | ❌ | Baixa |
| Oradores inscritos | ✅ OradoresExpediente, OradoresOrdemDia | ❌ | Alta |
| Painel aberto (flag na sessao) | ✅ painel_aberto | ❌ | Baixa |

---

## Melhorias Propostas

### Fase 1: Melhorias Imediatas (Baixo Esforco)

#### 1.1 Adicionar campos de midia na Sessao

```prisma
model Sessao {
  // ... campos existentes ...

  // NOVOS CAMPOS
  urlAudio      String?     // Link do audio (YouTube, etc)
  urlVideo      String?     // Link do video
  urlTransmissao String?    // Link da transmissao ao vivo
  arquivoPauta  String?     // URL do PDF da pauta
  arquivoAta    String?     // URL do PDF da ata
  painelAberto  Boolean     @default(false)
}
```

#### 1.2 Criar modelo de Oradores

```prisma
model OradorSessao {
  id            String   @id @default(cuid())
  sessaoId      String
  parlamentarId String
  tipo          TipoOrador  // EXPEDIENTE, ORDEM_DO_DIA, LIDERANCA, TRIBUNA_LIVRE
  ordem         Int
  tempoLimite   Int?        // Tempo em minutos
  tempoUsado    Int?
  assunto       String?     @db.Text
  status        StatusOrador // INSCRITO, FALANDO, CONCLUIDO, DESISTIU
  iniciadoEm    DateTime?
  finalizadoEm  DateTime?

  sessao      Sessao      @relation(fields: [sessaoId], references: [id])
  parlamentar Parlamentar @relation(fields: [parlamentarId], references: [id])
}

enum TipoOrador {
  PEQUENO_EXPEDIENTE
  GRANDE_EXPEDIENTE
  LIDERANCA
  ORDEM_DO_DIA
  EXPLICACAO_PESSOAL
  TRIBUNA_LIVRE
}

enum StatusOrador {
  INSCRITO
  FALANDO
  CONCLUIDO
  DESISTIU
}
```

### Fase 2: Melhorias Estruturais (Medio Esforco)

#### 2.1 Criar modelo de ExpedienteSessao (conteudo livre)

```prisma
model TipoExpediente {
  id        String   @id @default(cuid())
  nome      String   // "Pequeno Expediente", "Grande Expediente"
  ordem     Int
  ativo     Boolean  @default(true)

  expedientes ExpedienteSessao[]
}

model ExpedienteSessao {
  id              String   @id @default(cuid())
  sessaoId        String
  tipoExpedienteId String
  conteudo        String   @db.Text    // Texto livre
  ordem           Int

  sessao        Sessao         @relation(fields: [sessaoId], references: [id])
  tipoExpediente TipoExpediente @relation(fields: [tipoExpedienteId], references: [id])
}
```

#### 2.2 Criar PresencaOrdemDia

```prisma
model PresencaOrdemDia {
  id            String   @id @default(cuid())
  sessaoId      String
  parlamentarId String
  presente      Boolean  @default(true)
  registradoEm  DateTime @default(now())

  sessao      Sessao      @relation(fields: [sessaoId], references: [id])
  parlamentar Parlamentar @relation(fields: [parlamentarId], references: [id])

  @@unique([sessaoId, parlamentarId])
}
```

### Fase 3: Interface Melhorada

#### 3.1 Reorganizar criacao de pauta no estilo SAPL

A pauta deve ser organizada em abas/secoes claras:

```
[Pequeno Expediente] [Grande Expediente] [Materias do Expediente] [Ordem do Dia]
```

Cada aba mostra:
- Lista de itens ordenados
- Botao para adicionar item
- Opcoes de arrastar/reorganizar

#### 3.2 Visualizacao publica da pauta (estilo SAPL)

```
PAUTA DA 10a SESSAO ORDINARIA
Data: 15/01/2026 | Horario: 14:00 | Local: Plenario

═══════════════════════════════════════════════════════════
EXPEDIENTE
═══════════════════════════════════════════════════════════
1. Leitura e aprovacao da ata da sessao anterior
2. Correspondencias recebidas
3. Comunicacoes da Presidencia

═══════════════════════════════════════════════════════════
MATERIAS DO EXPEDIENTE
═══════════════════════════════════════════════════════════
1. REQ 001/2026 - Voto de Pesar (Autor: Ver. Fulano)
2. MOC 002/2026 - Mocao de Aplauso (Autor: Ver. Ciclano)

═══════════════════════════════════════════════════════════
ORDEM DO DIA
═══════════════════════════════════════════════════════════
1. PL 001/2026 - Dispoe sobre... (1o Turno) (Autor: Executivo)
   Parecer: CLJ favoravel | Relator: Ver. Beltrano

2. PL 003/2025 - Altera a Lei... (2o Turno) (Autor: Ver. Fulano)
   1o Turno: APROVADO em 10/12/2025
```

---

## Cronograma Sugerido

| Fase | Descricao | Esforco | Prioridade |
|------|-----------|---------|------------|
| 1.1 | Campos de midia na Sessao | 2h | Alta |
| 1.2 | Modelo de Oradores | 4h | Alta |
| 2.1 | TipoExpediente e ExpedienteSessao | 4h | Media |
| 2.2 | PresencaOrdemDia | 2h | Media |
| 3.1 | Interface de pauta reorganizada | 8h | Media |
| 3.2 | Visualizacao publica estilo SAPL | 4h | Media |

---

## Conclusao

Nosso sistema ja possui muitas funcionalidades avancadas que o SAPL tambem tem, como:
- Sistema de turnos com intersticio
- Etapas de votacao
- Sistema de vista
- Destaques para votacao em separado
- VotacaoAgrupada

As principais oportunidades de melhoria sao:
1. **Oradores** - Funcionalidade importante que nao temos
2. **Campos de midia** - URLs de audio/video e uploads
3. **Tipos de expediente configuraveis** - Flexibilidade
4. **Presenca especifica para Ordem do Dia** - Maior controle

A interface de criacao e visualizacao de pauta pode ser melhorada seguindo o padrao do SAPL para maior clareza e usabilidade.
