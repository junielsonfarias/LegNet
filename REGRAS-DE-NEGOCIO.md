# REGRAS DE NEGOCIO - SISTEMA LEGISLATIVO

> **DOCUMENTO MANDATORIO**: Este documento define as regras de negocio que DEVEM ser seguidas em todas as implementacoes do sistema. O Claude DEVE consultar e validar estas regras antes de qualquer desenvolvimento relacionado ao processo legislativo.

> **Versao**: 1.0.0
> **Data**: 2026-01-16
> **Base Legal**: Constituicao Federal, Lei Organica Municipal, Regimento Interno, LAI (Lei 12.527/2011), PNTP

---

## INDICE

1. [Visao Geral do Sistema](#1-visao-geral-do-sistema)
2. [Processo Legislativo - Fluxo Completo](#2-processo-legislativo---fluxo-completo)
3. [Proposicoes Legislativas](#3-proposicoes-legislativas)
4. [Tramitacao](#4-tramitacao)
5. [Sessoes Legislativas](#5-sessoes-legislativas)
6. [Pauta de Sessao](#6-pauta-de-sessao)
7. [Votacao](#7-votacao)
8. [Sanção, Veto e Promulgacao](#8-sancao-veto-e-promulgacao)
9. [Mesa Diretora e Composicao](#9-mesa-diretora-e-composicao)
10. [Comissoes](#10-comissoes)
11. [Parlamentares](#11-parlamentares)
12. [Transparencia e PNTP](#12-transparencia-e-pntp)
13. [Portal Institucional](#13-portal-institucional)
14. [Validacoes Obrigatorias](#14-validacoes-obrigatorias)
15. [Regras de Autorizacao](#15-regras-de-autorizacao)

---

## 1. VISAO GERAL DO SISTEMA

### 1.1 Proposito
O sistema tem como finalidade apoiar TODOS os processos de uma Camara Municipal de Vereadores, desde a apresentacao de proposicoes ate sua transformacao em lei, incluindo:

- Elaboracao e protocolo de proposicoes
- Tramitacao completa das materias legislativas
- Organizacao e controle de sessoes plenarias
- Sistema de votacao nominal e secreta
- Gerenciamento de comissoes e mesa diretora
- Portal de transparencia integrado (PNTP)
- Participacao cidada

### 1.2 Atores do Sistema

| Ator | Descricao | Permissoes |
|------|-----------|------------|
| **Cidadao** | Acesso publico ao portal | Consulta, acompanhamento, sugestoes |
| **Parlamentar** | Vereador eleito | Apresentar proposicoes, votar, participar |
| **Secretaria** | Servidor da camara | Tramitar, protocolar, organizar sessoes |
| **Operador** | Operador de sessao | Controlar painel eletronico, registrar presenca |
| **Presidente** | Presidente da Mesa | Conduzir sessoes, despachar, sancionar |
| **Admin** | Administrador do sistema | Acesso total, configuracoes |

### 1.3 Principios Fundamentais

```
REGRA RN-001: PUBLICIDADE
Todo ato legislativo DEVE ser publico, salvo nos casos previstos em lei.
A transparencia e a regra; o sigilo e a excecao.

REGRA RN-002: LEGALIDADE
Toda acao do sistema DEVE respeitar a Lei Organica Municipal,
o Regimento Interno e a legislacao vigente.

REGRA RN-003: RASTREABILIDADE
Todo ato DEVE ser registrado com data, hora, usuario e IP.
Nenhuma informacao pode ser excluida, apenas inativada.

REGRA RN-004: INTEGRIDADE
Documentos oficiais NAO PODEM ser alterados apos publicacao.
Alteracoes geram nova versao com historico preservado.
```

---

## 2. PROCESSO LEGISLATIVO - FLUXO COMPLETO

### 2.1 Fases do Processo Legislativo

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PROCESSO LEGISLATIVO MUNICIPAL                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. INICIATIVA                                                           │
│     │                                                                    │
│     ▼                                                                    │
│  2. PROTOCOLO E NUMERACAO                                               │
│     │                                                                    │
│     ▼                                                                    │
│  3. LEITURA E DISTRIBUICAO                                              │
│     │                                                                    │
│     ▼                                                                    │
│  4. ANALISE NAS COMISSOES                                               │
│     │  ├── Comissao de Legislacao e Justica (CLJ)                       │
│     │  ├── Comissoes Tematicas (CFO, CES, COU, etc)                     │
│     │  └── Emissao de Pareceres                                         │
│     ▼                                                                    │
│  5. INCLUSAO NA PAUTA                                                   │
│     │                                                                    │
│     ▼                                                                    │
│  6. DISCUSSAO EM PLENARIO                                               │
│     │  ├── Discussao Unica                                              │
│     │  ├── 1a Discussao                                                 │
│     │  └── 2a Discussao                                                 │
│     ▼                                                                    │
│  7. VOTACAO                                                              │
│     │  ├── Maioria Simples                                              │
│     │  ├── Maioria Absoluta                                             │
│     │  └── Maioria Qualificada (2/3)                                    │
│     ▼                                                                    │
│  8. REDACAO FINAL (se aprovado)                                         │
│     │                                                                    │
│     ▼                                                                    │
│  9. ENVIO AO EXECUTIVO                                                  │
│     │                                                                    │
│     ▼                                                                    │
│ 10. SANCAO OU VETO                                                      │
│     │  ├── Sancao → Lei                                                 │
│     │  └── Veto → Apreciacao do Veto                                   │
│     ▼                                                                    │
│ 11. PROMULGACAO                                                          │
│     │                                                                    │
│     ▼                                                                    │
│ 12. PUBLICACAO                                                           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Regras do Fluxo

```
REGRA RN-010: ORDEM DAS FASES
As fases do processo legislativo DEVEM seguir a ordem estabelecida.
NAO e permitido pular fases, exceto nos casos previstos em regimento.

REGRA RN-011: PRAZOS REGIMENTAIS
Cada fase possui prazos definidos no Regimento Interno.
O sistema DEVE alertar sobre prazos proximos do vencimento.

REGRA RN-012: URGENCIA
Projetos em regime de urgencia PODEM ter tramitacao simplificada,
mas DEVEM passar por CLJ e votacao em plenario.

REGRA RN-013: ARQUIVAMENTO
Proposicoes nao votadas ate o fim da legislatura SAO arquivadas,
exceto as de iniciativa popular ou do Executivo.
```

---

## 3. PROPOSICOES LEGISLATIVAS

### 3.1 Tipos de Proposicoes

| Tipo | Sigla | Descricao | Iniciativa |
|------|-------|-----------|------------|
| **Projeto de Lei Ordinaria** | PL | Cria, modifica ou extingue direitos | Vereador, Prefeito, Cidadao |
| **Projeto de Lei Complementar** | PLC | Materia complementar a Lei Organica | Vereador, Prefeito |
| **Projeto de Resolucao** | PR | Materia interna da Camara | Vereador, Mesa, Comissao |
| **Projeto de Decreto Legislativo** | PDL | Materia de competencia exclusiva | Vereador, Mesa, Comissao |
| **Projeto de Emenda a Lei Organica** | PELO | Altera Lei Organica Municipal | 1/3 Vereadores, Prefeito |
| **Indicacao** | IND | Sugere ao Executivo medidas | Vereador |
| **Requerimento** | REQ | Solicita providencias a Mesa | Vereador |
| **Mocao** | MOC | Manifesta posicao da Camara | Vereador |
| **Voto de Pesar** | VP | Manifesta pesar por falecimento | Vereador |
| **Voto de Aplauso** | VA | Manifesta congratulacoes | Vereador |
| **Emenda** | EM | Altera proposicao em tramitacao | Vereador, Comissao |
| **Substitutivo** | SUB | Substitui integralmente proposicao | Comissao |

### 3.2 Regras de Proposicoes

```
REGRA RN-020: INICIATIVA PRIVATIVA DO EXECUTIVO
Projetos sobre as seguintes materias SAO de iniciativa EXCLUSIVA do Prefeito:
- Criacao de cargos e funcoes publicas
- Aumento de remuneracao de servidores
- Regime juridico dos servidores
- Organizacao administrativa
- Orcamento (LOA, LDO, PPA)
- Concessao de subsidios ou isencoes fiscais

O sistema DEVE impedir parlamentares de criar proposicoes sobre estas materias.

REGRA RN-021: NUMERACAO AUTOMATICA
Toda proposicao DEVE receber numero sequencial unico por tipo e ano.
Formato: [SIGLA] [NUMERO]/[ANO] (ex: PL 001/2024)
A numeracao NAO PODE ser alterada apos protocolo.

REGRA RN-022: REQUISITOS MINIMOS
Toda proposicao DEVE conter:
- Ementa (resumo do conteudo)
- Justificativa (motivos e fundamentacao)
- Texto articulado (exceto indicacoes e requerimentos)
- Identificacao do autor

REGRA RN-023: MATERIA ANALOGA
Proposicao sobre materia identica a outra rejeitada ou vetada
NAO PODE ser reapresentada na mesma sessao legislativa,
salvo mediante proposta da maioria absoluta.

REGRA RN-024: EMENDAS
Emendas DEVEM:
- Ser pertinentes a materia da proposicao principal
- Ser apresentadas antes do inicio da votacao
- Nao aumentar despesa em projetos de iniciativa do Executivo
(exceto se indicar fonte de recursos)

REGRA RN-025: PROJETO DE INICIATIVA POPULAR
Projetos de iniciativa popular DEVEM conter:
- Assinaturas de no minimo 5% do eleitorado
- Identificacao completa dos signatarios
- Nao podem ser arquivados sem votacao
```

### 3.3 Status de Proposicao

| Status | Descricao | Proximo Status Possivel |
|--------|-----------|------------------------|
| `RASCUNHO` | Em elaboracao pelo autor | APRESENTADA |
| `APRESENTADA` | Protocolada na secretaria | EM_TRAMITACAO, DEVOLVIDA |
| `EM_TRAMITACAO` | Em analise nas comissoes | EM_PAUTA, ARQUIVADA |
| `EM_PAUTA` | Incluida na pauta de sessao | EM_DISCUSSAO |
| `EM_DISCUSSAO` | Sendo discutida em plenario | EM_VOTACAO, ADIADA |
| `EM_VOTACAO` | Em processo de votacao | APROVADA, REJEITADA |
| `APROVADA` | Aprovada pelo plenario | ENVIADA_EXECUTIVO, PROMULGADA |
| `REJEITADA` | Rejeitada pelo plenario | ARQUIVADA |
| `ENVIADA_EXECUTIVO` | Enviada para sancao | SANCIONADA, VETADA |
| `SANCIONADA` | Sancionada pelo Prefeito | PUBLICADA |
| `VETADA` | Vetada pelo Prefeito | VETO_MANTIDO, VETO_REJEITADO |
| `PROMULGADA` | Promulgada pelo Legislativo | PUBLICADA |
| `PUBLICADA` | Publicada oficialmente | (Estado Final) |
| `ARQUIVADA` | Arquivada definitivamente | (Estado Final) |
| `RETIRADA` | Retirada pelo autor | (Estado Final) |

---

## 4. TRAMITACAO

### 4.1 Fluxo de Tramitacao

```
REGRA RN-030: TRAMITACAO OBRIGATORIA
Toda proposicao (exceto requerimentos de urgencia) DEVE passar pela
Comissao de Legislacao e Justica (CLJ) para analise de:
- Constitucionalidade
- Legalidade
- Tecnica legislativa
- Regimentalidade

REGRA RN-031: DISTRIBUICAO POR MATERIA
Apos a CLJ, proposicoes DEVEM ser distribuidas as comissoes tematicas
conforme a materia:
- CFO (Financas e Orcamento): materias financeiras e orcamentarias
- CES (Educacao e Saude): materias de educacao, saude e assistencia
- COU (Obras e Urbanismo): materias de infraestrutura e urbanismo
- Outras conforme estrutura da Camara

REGRA RN-032: PRAZOS DE PARECER
Comissoes DEVEM emitir parecer nos seguintes prazos:
- Tramitacao normal: 15 dias uteis
- Regime de prioridade: 10 dias uteis
- Regime de urgencia: 5 dias uteis
- Urgencia urgentissima: Sessao imediata

REGRA RN-033: PARECER OBRIGATORIO
Proposicoes NAO PODEM ser votadas sem parecer da CLJ, exceto:
- Requerimentos de informacao
- Mocoes de pesar/aplauso
- Materias em regime de urgencia urgentissima

REGRA RN-034: TIPOS DE PARECER
Os pareceres das comissoes podem ser:
- FAVORAVEL: Pela aprovacao da materia
- CONTRARIO: Pela rejeicao da materia
- FAVORAVEL_COM_EMENDAS: Pela aprovacao com alteracoes
- PELA_INCONSTITUCIONALIDADE: CLJ detectou vicio constitucional
- INCOMPETENCIA: Materia fora da competencia municipal
```

### 4.2 Unidades de Tramitacao

| Unidade | Tipo | Funcao |
|---------|------|--------|
| Protocolo | SECRETARIA | Recebimento e numeracao |
| Presidencia | MESA_DIRETORA | Despacho e distribuicao |
| CLJ | COMISSAO | Analise juridica |
| Comissoes Tematicas | COMISSAO | Analise de merito |
| Plenario | PLENARIO | Discussao e votacao |
| Prefeitura | EXECUTIVO | Sancao ou veto |
| Diario Oficial | PUBLICACAO | Publicacao oficial |

### 4.3 Registros de Tramitacao

```
REGRA RN-035: HISTORICO COMPLETO
Cada movimentacao DEVE registrar:
- Data e hora da movimentacao
- Unidade de origem e destino
- Responsavel pela acao
- Despacho ou observacao
- Documentos anexados

REGRA RN-036: NOTIFICACAO AUTOMATICA
O sistema DEVE notificar automaticamente:
- Autor quando proposicao mudar de status
- Comissao quando receber materia
- Interessados cadastrados para acompanhamento
- Prazos proximos do vencimento (3 dias antes)

REGRA RN-037: CONTROLE DE PRAZOS
O sistema DEVE:
- Calcular prazo de vencimento automaticamente
- Alertar sobre prazos vencidos
- Destacar visualmente materias atrasadas
- Gerar relatorio de produtividade por comissao
```

---

## 5. SESSOES LEGISLATIVAS

### 5.1 Tipos de Sessao

| Tipo | Descricao | Convocacao | Pauta |
|------|-----------|------------|-------|
| **ORDINARIA** | Sessoes regulares do calendario | Automatica | Variada |
| **EXTRAORDINARIA** | Convocada para materia especifica | Presidente, 1/3 Vereadores, Prefeito | Restrita |
| **SOLENE** | Homenagens e datas comemorativas | Presidente | Especial |
| **ESPECIAL** | Audiencias publicas, eventos | Presidente, Comissao | Especifica |

### 5.2 Regras de Sessao

```
REGRA RN-040: QUORUM DE INSTALACAO
Para instalacao da sessao e necessario quorum MINIMO de:
- Maioria absoluta dos membros da Camara
- Exemplo: 11 vereadores = minimo 6 presentes

O sistema NAO DEVE permitir iniciar sessao sem quorum.

REGRA RN-041: HORARIO E LOCAL
Sessoes ordinarias DEVEM ser realizadas:
- No horario definido no Regimento (ex: 14h ou 19h)
- Na sede da Camara Municipal
- Alteracoes DEVEM ser comunicadas com 24h de antecedencia

REGRA RN-042: PUBLICIDADE DA SESSAO
Todas as sessoes SAO publicas, exceto:
- Sessao secreta para apreciacao de veto
- Outras hipoteses previstas na Lei Organica

REGRA RN-043: ORDEM DOS TRABALHOS
A sessao ordinaria DEVE seguir a ordem:
1. Abertura e verificacao de quorum
2. Leitura, discussao e votacao da ata anterior
3. Expediente (correspondencias, comunicacoes)
4. Explicacoes pessoais
5. Ordem do Dia (discussao e votacao de materias)
6. Encerramento

REGRA RN-044: CONTROLE DE PRESENCA
A presenca DEVE ser registrada:
- No inicio da sessao (chamada nominal)
- Em cada votacao nominal
- Justificativas de ausencia DEVEM ser registradas
```

### 5.3 Status de Sessao

| Status | Descricao | Acoes Permitidas |
|--------|-----------|------------------|
| `AGENDADA` | Sessao criada e agendada | Editar, cancelar, definir pauta |
| `CONVOCADA` | Convocacao publicada | Editar pauta |
| `EM_ANDAMENTO` | Sessao em curso | Controlar pauta, registrar presenca, votar |
| `SUSPENSA` | Sessao suspensa temporariamente | Retomar |
| `CONCLUIDA` | Sessao encerrada normalmente | Gerar ata |
| `CANCELADA` | Sessao cancelada | Nenhuma |
| `SEM_QUORUM` | Encerrada por falta de quorum | Reagendar |

---

## 6. PAUTA DE SESSAO

### 6.1 Estrutura da Pauta

```
ESTRUTURA PADRAO DA PAUTA:

1. EXPEDIENTE
   1.1. Correspondencias recebidas
   1.2. Comunicacoes da Mesa
   1.3. Comunicacoes dos Vereadores
   1.4. Leitura de proposicoes apresentadas

2. EXPLICACOES PESSOAIS
   (Tempo regimental para manifestacao dos vereadores)

3. ORDEM DO DIA
   3.1. Materias em regime de urgencia
   3.2. Materias em segunda discussao/votacao
   3.3. Materias em primeira discussao/votacao
   3.4. Materias em discussao unica
   3.5. Requerimentos e mocoes
```

### 6.2 Regras de Composicao da Pauta

```
REGRA RN-050: PRECEDENCIA NA ORDEM DO DIA
A ordem de votacao DEVE seguir a precedencia:
1. Vetos do Executivo (prazo constitucional)
2. Projetos em regime de urgencia urgentissima
3. Projetos em regime de urgencia
4. Projetos em regime de prioridade
5. Redacoes finais pendentes
6. Materias em segunda votacao
7. Materias em primeira votacao
8. Ordem cronologica de apresentacao

REGRA RN-051: MATERIAS OBRIGATORIAS
DEVEM ser incluidas na pauta prioritariamente:
- Vetos com prazo vencendo (30 dias para apreciacao)
- Projetos do Executivo em regime de urgencia
- Materias adiadas da sessao anterior
- Projetos orcamentarios nos prazos legais

REGRA RN-052: LIMITE DE MATERIAS
A pauta DEVE considerar:
- Tempo medio por materia (calculado automaticamente)
- Duracao maxima da sessao (definida em Regimento)
- Complexidade das materias (discussoes previstas)

REGRA RN-053: RETIRADA DE PAUTA
Materia pode ser retirada da pauta:
- Pelo autor, antes do inicio da discussao
- Por requerimento aprovado pelo plenario
- Pelo Presidente, por questao de ordem

REGRA RN-054: INVERSAO DE PAUTA
A ordem da pauta pode ser alterada:
- Por requerimento aprovado pelo plenario
- Em caso de urgencia justificada
- Ausencia do autor de projeto em discussao
```

### 6.3 Automacao da Pauta

```
REGRA RN-055: SUGESTAO AUTOMATICA
O sistema DEVE sugerir automaticamente:
- Materias com parecer favoravel de todas as comissoes
- Materias com prazo regimental proximo
- Materias em segunda discussao pendentes
- Materias solicitadas pelos autores

REGRA RN-056: VALIDACAO REGIMENTAL
Antes de incluir na pauta, o sistema DEVE validar:
- Existencia de parecer da CLJ (quando obrigatorio)
- Cumprimento de intersticio minimo (entre discussoes)
- Quorum necessario para votacao
- Disponibilidade de documentos

REGRA RN-057: CALCULO DE TEMPO
O sistema DEVE calcular tempo estimado baseado em:
- Tipo de materia (projeto de lei = 15min, requerimento = 5min)
- Numero de discussoes previstas
- Historico de materias similares
- Emendas apresentadas

REGRA RN-058: VALIDACAO DE TRAMITACAO PARA PAUTA
Proposicoes so podem ser incluidas na ORDEM_DO_DIA quando:
1. Tramitacao atual estiver na etapa marcada com "habilitaPauta = true"
   (tipicamente "Encaminhado para Plenario")
2. Para PL/PR/PD: Possuir parecer favoravel da CLJ (RN-030)

Fluxos de tramitacao por tipo de proposicao:
- PL: Mesa Diretora → CLJ → CFO (se despesa) → Plenario
- PR/PD: Mesa Diretora → CLJ → Plenario
- REQ/MOC: Mesa Diretora → Plenario
- IND: Mesa Diretora → Leitura em Expediente (sem votacao)
- VP/VA: Protocolo e Leitura (etapa unica, aprovacao simbolica)

Excecoes:
- Indicacoes, Votos de Pesar/Aplauso vao para EXPEDIENTE/HONRAS sem votacao
- Requerimentos de urgencia urgentissima podem ter fluxo acelerado

O sistema DEVE:
- Verificar etapa atual da tramitacao antes de permitir inclusao na pauta
- Exibir lista de proposicoes elegiveis no wizard de criacao de sessao
- Bloquear inclusao manual de proposicoes inelegiveis na ORDEM_DO_DIA

REGRA RN-059: CONFIGURACAO DE PRAZOS POR REGIME
Os prazos de tramitacao variam conforme o regime:
- NORMAL: 15 dias uteis (padrao)
- PRIORIDADE: 10 dias uteis
- URGENCIA: 5 dias uteis
- URGENCIA_URGENTISSIMA: 0 dias (votacao imediata)

Prazos sao configuraveis pelo administrador em:
/admin/configuracoes/prazos-urgencia
```

---

## 7. VOTACAO

### 7.1 Tipos de Quorum

| Quorum | Descricao | Calculo | Exemplos |
|--------|-----------|---------|----------|
| **Maioria Simples** | Metade + 1 dos PRESENTES | Se 8 presentes = 5 votos | Projetos ordinarios |
| **Maioria Absoluta** | Metade + 1 dos MEMBROS | 11 membros = 6 votos | Lei Complementar, veto |
| **Maioria Qualificada** | 2/3 dos MEMBROS | 11 membros = 8 votos | Emenda a Lei Organica |

### 7.2 Tipos de Votacao

| Tipo | Descricao | Registro | Quando Usar |
|------|-----------|----------|-------------|
| **Simbolica** | Bracos levantados | Apenas resultado | Materias simples |
| **Nominal** | Voto individual declarado | Voto de cada parlamentar | Projetos de lei, a pedido |
| **Secreta** | Voto em cedula | Apenas totais | Cassacao, vetos especificos |

### 7.3 Regras de Votacao

```
REGRA RN-060: QUORUM DE VOTACAO
O quorum DEVE ser verificado ANTES de cada votacao.
Se nao houver quorum, a votacao NAO PODE ser realizada.
O sistema DEVE bloquear votacao sem quorum.

REGRA RN-061: VOTACAO NOMINAL OBRIGATORIA
A votacao DEVE ser nominal nos seguintes casos:
- Projetos de Lei Complementar
- Projetos de Emenda a Lei Organica
- Apreciacao de veto
- Cassacao de mandato
- Quando requerida por qualquer vereador
- Quando houver empate em votacao simbolica

REGRA RN-062: DECLARACAO DE VOTO
Apos a votacao, parlamentares PODEM declarar voto:
- Explicar os motivos de seu voto
- Tempo maximo conforme Regimento
- Nao altera o resultado

REGRA RN-063: IMPEDIMENTO DE VOTAR
Parlamentar NAO PODE votar quando:
- Tiver interesse pessoal na materia
- For autor do projeto (exceto se unico autor)
- For parente ate 3o grau de beneficiado
O sistema DEVE permitir registro de impedimento.

REGRA RN-064: VOTO DO PRESIDENTE
O Presidente da sessao:
- NAO vota em votacao simbolica (salvo empate)
- VOTA em votacao nominal
- Seu voto desempata em caso de empate

REGRA RN-065: ENCAMINHAMENTO DE VOTACAO
Antes da votacao, e permitido:
- Encaminhamento de lider de bancada (3 min)
- Encaminhamento de autor do projeto (3 min)
- Encaminhamento contrario (3 min)

REGRA RN-066: RESULTADO IMEDIATO
O resultado da votacao DEVE ser:
- Anunciado imediatamente apos apuracao
- Registrado na ata da sessao
- Publicado no portal de transparencia
- Disponibilizado via API publica
```

### 7.4 Estados da Votacao

```
┌─────────────────────────────────────────────────────────┐
│                  FLUXO DE VOTACAO                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  AGUARDANDO_QUORUM                                       │
│       │                                                  │
│       ▼ (quorum atingido)                               │
│  ABERTA                                                  │
│       │                                                  │
│       ├──▶ (votando) ──▶ EM_ANDAMENTO                   │
│       │                       │                          │
│       │                       ▼ (todos votaram)          │
│       │                  ENCERRADA                       │
│       │                       │                          │
│       │                       ▼                          │
│       │                  RESULTADO_APURADO              │
│       │                       │                          │
│       │         ┌─────────────┼─────────────┐           │
│       │         ▼             ▼             ▼           │
│       │    APROVADA      REJEITADA      EMPATE         │
│       │                                    │            │
│       │                                    ▼            │
│       │                            DESEMPATE_PRESIDENTE │
│       │                                    │            │
│       │                    ┌───────────────┴──────┐    │
│       │                    ▼                      ▼    │
│       │               APROVADA              REJEITADA  │
│       │                                                 │
│       └──▶ (falta quorum) ──▶ SUSPENSA                │
│                                   │                     │
│                                   ▼                     │
│                              REAGENDADA                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 7.5 Itens Informativos (Sem Votacao)

```
REGRA RN-067: TIPOS DE ACAO NA PAUTA
Os itens da pauta podem ter os seguintes tipos de acao:
- VOTACAO: Requer discussao e votacao nominal
- DISCUSSAO: Requer discussao, pode levar a votacao
- LEITURA: Apenas leitura no expediente, sem votacao
- COMUNICADO: Informes e comunicacoes, sem votacao
- HOMENAGEM: Votos de pesar, aplauso, mocoes, sem votacao

REGRA RN-068: ITENS INFORMATIVOS
Itens com tipoAcao LEITURA, COMUNICADO ou HOMENAGEM:
- NAO requerem votacao
- Devem ser marcados como CONCLUIDO apos apresentacao
- Exibem status diferenciado no painel (EM LEITURA, COMUNICACAO, HOMENAGEM)
- Nao mostram botao "Iniciar Votacao" no painel do operador

REGRA RN-069: FLUXO DE ITENS INFORMATIVOS
1. Operador inicia o item (status: EM_DISCUSSAO)
2. Painel exibe label apropriado (EM LEITURA, COMUNICACAO, HOMENAGEM)
3. Apos conclusao da leitura/apresentacao
4. Operador clica em "Concluir" (status: CONCLUIDO)
5. Nao ha apuracao de votos
```

### 7.6 Painel Eletronico de Votacao

```
REGRA RN-070: PAINEL DE VOTACAO
O painel eletronico DEVE exibir:
- Numero e tipo da materia em votacao
- Ementa resumida
- Quorum necessario
- Votos ja registrados (SIM, NAO, ABSTENCAO)
- Parlamentares que ainda nao votaram
- Tempo de votacao (cronometro)

REGRA RN-071: IDENTIFICACAO DO VOTO
Cada voto DEVE ser vinculado a:
- Parlamentar autenticado no sistema
- Sessao e votacao especifica
- Timestamp do momento do voto
- Dispositivo utilizado (IP, terminal)

REGRA RN-072: ALTERACAO DE VOTO
O parlamentar PODE alterar seu voto:
- Apenas enquanto a votacao estiver aberta
- Antes do anuncio do resultado
- Todas as alteracoes sao registradas no historico

REGRA RN-073: PAINEL PUBLICO
Um painel publico DEVE exibir em tempo real:
- Status da sessao
- Materia em discussao/votacao
- Resultado parcial (votos totais)
- Votos nominais (apos encerramento)

REGRA RN-074: SINCRONIZACAO STATUS PROPOSICAO-PAUTA
O status da Proposicao DEVE ser sincronizado com o status do PautaItem:
- PENDENTE -> EM_PAUTA
- EM_DISCUSSAO -> EM_DISCUSSAO
- EM_VOTACAO -> EM_VOTACAO
- APROVADO -> APROVADA
- REJEITADO -> REJEITADA
- ADIADO -> EM_PAUTA
- RETIRADO -> ARQUIVADA

REGRA RN-075: REGISTRO DE SESSAO NO VOTO
Todo voto individual DEVE registrar o sessaoId:
- Identificacao da sessao onde o voto foi registrado
- Permitir rastreabilidade completa do voto
- Garantir integridade historica

REGRA RN-076: LANCAMENTO RETROATIVO
Lancamento retroativo de votacoes SO e permitido para sessoes CONCLUIDAS:
- NAO pode alterar sessoes AGENDADAS ou EM_ANDAMENTO via retroativo
- Sessao CANCELADA nao permite lancamento retroativo
- Acesso restrito a usuarios com permissao sessao.manage

REGRA RN-077: PARLAMENTAR PRESENTE PARA VOTO RETROATIVO
Apenas parlamentares que estavam PRESENTES na sessao podem receber voto retroativo:
- Sistema DEVE validar registro de presenca antes de aceitar voto
- Parlamentares ausentes nao podem ter voto registrado
- Presenca deve ter sido registrada na sessao original

REGRA RN-078: AUDITORIA DE ALTERACOES RETROATIVAS
Toda alteracao retroativa DEVE ser auditada com:
- Data e hora da alteracao
- Usuario que realizou a alteracao
- Motivo obrigatorio informado pelo usuario
- Dados anteriores vs novos valores
- IP e user-agent do requisitante

REGRA RN-079: ATUALIZACAO STATUS APOS VOTACAO RETROATIVA
Ao finalizar votacao retroativa:
- Atualizar status da Proposicao (APROVADA/REJEITADA)
- Atualizar status do PautaItem
- Registrar VotacaoAgrupada com resultado consolidado
- Vincular sessaoVotacaoId na Proposicao
```

---

## 8. SANCAO, VETO E PROMULGACAO

### 8.1 Fluxo Pos-Aprovacao

```
REGRA RN-080: ENVIO AO EXECUTIVO
Projeto de lei aprovado DEVE ser enviado ao Prefeito:
- Em ate 48 horas apos aprovacao
- Acompanhado de autografo (texto definitivo)
- Com registro de protocolo de envio

REGRA RN-081: PRAZO PARA SANCAO OU VETO
O Prefeito tem 15 DIAS UTEIS para:
- Sancionar o projeto (aprovacao expressa)
- Vetar total ou parcialmente
- Silencio implica SANCAO TACITA

O sistema DEVE:
- Calcular prazo automaticamente
- Alertar sobre vencimento proximo
- Registrar sancao tacita apos prazo

REGRA RN-082: TIPOS DE VETO
O veto pode ser:
- TOTAL: Rejeita todo o projeto
- PARCIAL: Rejeita artigos, paragrafos, incisos ou alineas
  (NAO pode vetar palavras ou expressoes isoladas)

REGRA RN-083: RAZOES DO VETO
O veto DEVE ser justificado por:
- Inconstitucionalidade, OU
- Contrario ao interesse publico
O Prefeito DEVE comunicar as razoes em 48 horas.

REGRA RN-084: APRECIACAO DO VETO
O veto DEVE ser apreciado em sessao:
- Prazo: 30 dias apos recebimento
- Quorum: Maioria ABSOLUTA para rejeitar o veto
- Votacao: NOMINAL (obrigatoria)

REGRA RN-085: RESULTADO DO VETO
Se veto MANTIDO:
- Projeto e arquivado (materia rejeitada)

Se veto REJEITADO:
- Projeto e promulgado pelo Presidente da Camara
- Em 48 horas apos a sessao

REGRA RN-086: PROMULGACAO
A promulgacao DEVE ser feita:
- Pelo Prefeito (projetos sancionados)
- Pelo Presidente da Camara (veto rejeitado ou sancao tacita)

REGRA RN-087: PUBLICACAO OBRIGATORIA
Toda lei DEVE ser publicada:
- No Diario Oficial do Municipio
- No portal de transparencia da Camara
- A lei so entra em vigor apos publicacao
```

---

## 9. MESA DIRETORA E COMPOSICAO

### 9.1 Composicao da Mesa

```
REGRA RN-090: CARGOS DA MESA DIRETORA
A Mesa Diretora e composta por:
1. Presidente
2. Vice-Presidente
3. 1o Secretario
4. 2o Secretario

A estrutura pode variar conforme Lei Organica.

REGRA RN-091: ELEICAO DA MESA
A Mesa e eleita:
- Na primeira sessao legislativa do periodo
- Mandato: Conforme Lei Organica (geralmente 2 anos)
- Votacao: Secreta ou aberta (conforme Regimento)
- Quorum: Maioria absoluta

REGRA RN-092: ATRIBUICOES DO PRESIDENTE
Compete ao Presidente:
- Representar a Camara
- Dirigir os trabalhos legislativos
- Manter a ordem das sessoes
- Dar posse aos vereadores
- Convocar sessoes extraordinarias
- Promulgar resolucoes e decretos legislativos
- Promulgar leis (quando veto rejeitado)

REGRA RN-093: SUBSTITUICAO
Em caso de ausencia ou impedimento:
1o: Vice-Presidente assume
2o: 1o Secretario assume
3o: 2o Secretario assume
4o: Vereador mais idoso assume

REGRA RN-094: PERDA DE CARGO
Membro da Mesa perde o cargo por:
- Renuncia
- Cassacao por infração
- Ausencias injustificadas (conforme Regimento)
```

### 9.2 Historico de Composicao

```
REGRA RN-095: REGISTRO HISTORICO
O sistema DEVE manter historico completo de:
- Todas as composicoes da Mesa por periodo
- Data de posse e termino de cada membro
- Substituicoes temporarias
- Motivos de vacancia

Dados historicos NAO PODEM ser excluidos.
```

---

## 10. COMISSOES

### 10.1 Tipos de Comissoes

| Tipo | Duracao | Finalidade |
|------|---------|------------|
| **Permanente** | Toda a legislatura | Analise tematica continua |
| **Temporaria** | Prazo definido | Assunto especifico |
| **Especial** | Ate conclusao | Materia complexa |
| **Parlamentar de Inquerito (CPI)** | Ate 120 dias | Investigacao |

### 10.2 Comissoes Permanentes Obrigatorias

```
REGRA RN-100: COMISSOES MINIMAS
A Camara DEVE ter no minimo:
- Comissao de Legislacao e Justica (CLJ)
- Comissao de Financas e Orcamento (CFO)

Outras comissoes conforme Regimento Interno.

REGRA RN-101: COMPOSICAO
Cada comissao DEVE ter:
- Minimo de 3 membros (numero impar)
- Presidente, Vice-Presidente e membros
- Representacao proporcional das bancadas

REGRA RN-102: COMPETENCIA DA CLJ
A CLJ analisa obrigatoriamente:
- Constitucionalidade de todas as proposicoes
- Legalidade e tecnica legislativa
- Regimentalidade
- Admissibilidade de emendas

REGRA RN-103: COMPETENCIA DA CFO
A CFO analisa obrigatoriamente:
- Projetos com impacto financeiro
- LOA, LDO e PPA
- Creditos adicionais
- Prestacao de contas

REGRA RN-104: REUNIOES
As comissoes DEVEM:
- Reunir periodicamente (minimo semanal)
- Lavrar ata de todas as reunioes
- Publicar pauta com antecedencia
- Permitir participacao de cidadaos
```

### 10.3 CPI - Comissao Parlamentar de Inquerito

```
REGRA RN-105: REQUISITOS PARA CPI
CPI pode ser criada mediante:
- Requerimento de 1/3 dos vereadores
- Fato determinado a ser investigado
- Prazo certo de funcionamento (max 120 dias)

REGRA RN-106: PODERES DA CPI
A CPI tem poderes de:
- Convocar autoridades municipais
- Requisitar documentos
- Tomar depoimentos
- Realizar diligencias

NAO pode:
- Decretar prisao
- Realizar busca e apreensao
- Determinar quebra de sigilo sem ordem judicial

REGRA RN-107: RELATORIO FINAL
Ao final, a CPI DEVE:
- Aprovar relatorio com conclusoes
- Encaminhar ao Ministerio Publico (se houver indicio de crime)
- Publicar integralmente no portal de transparencia
```

---

## 11. PARLAMENTARES

### 11.1 Dados do Parlamentar

```
REGRA RN-110: CADASTRO COMPLETO
O cadastro de parlamentar DEVE conter:
- Nome completo e nome parlamentar
- Partido politico (historico de filiacoes)
- Dados de contato (gabinete, email, telefone)
- Foto oficial
- Biografia resumida
- Numero de votos recebidos
- Legislaturas de que participou
- Comissoes que integra/integrou
- Cargos que ocupa/ocupou

REGRA RN-111: DADOS PUBLICOS OBRIGATORIOS (PNTP)
O portal DEVE exibir publicamente:
- Lista completa de vereadores
- Partido e coligacao
- Presenca em sessoes
- Votacoes nominais
- Proposicoes de autoria
- Remuneracao e verbas

REGRA RN-112: ESTATISTICAS DE ATUACAO
O sistema DEVE calcular automaticamente:
- Total de proposicoes apresentadas
- Proposicoes aprovadas/rejeitadas
- Percentual de presenca em sessoes
- Participacao em votacoes
- Participacao em comissoes
```

### 11.2 Direitos e Deveres

```
REGRA RN-113: INVIOLABILIDADE
Vereadores sao inviolaveis por suas opinioes, palavras e votos
no exercicio do mandato e na circunscricao do Municipio.
O sistema DEVE registrar todas as manifestacoes.

REGRA RN-114: DECORO PARLAMENTAR
Configura falta de decoro:
- Uso de expressoes ofensivas
- Agressao fisica ou verbal
- Revelacao de assunto sigiloso

O sistema DEVE ter mecanismo para registro de ocorrencias.

REGRA RN-115: PERDA DE MANDATO
O mandato pode ser perdido por:
- Infracao a Lei Organica
- Falta de decoro
- Ausencias sem justificativa
- Condenacao criminal
Processo de cassacao requer votacao secreta e quorum de 2/3.
```

---

## 12. TRANSPARENCIA E PNTP

### 12.1 Requisitos PNTP para Legislativo

```
REGRA RN-120: DADOS OBRIGATORIOS - NIVEL DIAMANTE
O portal DEVE disponibilizar em tempo real (30 dias):

1. ESTRUTURA ORGANIZACIONAL
   - Organograma da Camara
   - Competencias de cada setor
   - Horarios de funcionamento
   - Enderecos e telefones

2. PARLAMENTARES
   - Lista completa com fotos
   - Partidos e coligacoes
   - Historico de mandatos
   - Presenca em sessoes (atualizada em 30 dias)
   - Votacoes nominais (atualizada em 30 dias)
   - Proposicoes de autoria
   - Remuneracao mensal

3. SESSOES E VOTACOES
   - Calendario de sessoes
   - Pautas das sessoes (com antecedencia minima de 48h)
   - Atas das sessoes (publicadas em ate 15 dias)
   - Resultados de votacoes (imediato)
   - Transmissao ao vivo (quando disponivel)

4. PROPOSICOES E LEIS
   - Todas as proposicoes em tramitacao
   - Status atualizado de cada proposicao
   - Pareceres das comissoes
   - Leis, decretos, resolucoes (texto integral)
   - Pesquisa por numero, ano, assunto

5. FINANCEIRO
   - Receitas detalhadas
   - Despesas detalhadas por categoria
   - Duodecimo recebido do Executivo
   - Diarias e verbas indenizatorias
   - Contratos e licitacoes
   - Folha de pagamento

6. PARTICIPACAO
   - Ouvidoria (formulario e acompanhamento)
   - e-SIC (pedidos de informacao)
   - Sugestoes de projetos
   - Consultas publicas
```

### 12.2 Prazos de Atualizacao PNTP

| Informacao | Prazo Maximo | Frequencia |
|------------|--------------|------------|
| Presenca em sessoes | 30 dias | Apos cada sessao |
| Votacoes nominais | 30 dias | Apos cada sessao |
| Atas de sessoes | 15 dias | Apos aprovacao |
| Proposicoes novas | 48 horas | Apos protocolo |
| Pautas de sessao | 48 horas antes | Da sessao |
| Despesas | 30 dias | Mensal |
| Contratos | 24 horas | Apos assinatura |
| Diarias | 30 dias | Apos pagamento |

### 12.3 Formatos e Acessibilidade

```
REGRA RN-121: FORMATOS ABERTOS
Dados DEVEM estar disponiveis em:
- HTML (visualizacao web)
- PDF (documentos oficiais)
- CSV/JSON (dados abertos)
- XML (integracao com sistemas)

REGRA RN-122: ACESSIBILIDADE
O portal DEVE atender:
- WCAG 2.1 nivel AA (minimo)
- Navegacao por teclado
- Compatibilidade com leitores de tela
- Contraste adequado
- Textos alternativos em imagens

REGRA RN-123: BUSCA AVANCADA
O sistema DEVE permitir busca por:
- Numero e ano da proposicao
- Palavras-chave no conteudo
- Autor da proposicao
- Periodo (data inicial e final)
- Status da tramitacao
- Tipo de documento

REGRA RN-124: API PUBLICA
O sistema DEVE disponibilizar API REST com:
- Endpoints para consulta de proposicoes
- Endpoints para consulta de sessoes
- Endpoints para consulta de parlamentares
- Endpoints para consulta de votacoes
- Documentacao completa (OpenAPI/Swagger)
- Limitacao de requisicoes (rate limiting)

REGRA RN-125: PUBLICACAO DE PAUTA COM ANTECEDENCIA
A pauta de sessao DEVE ser publicada com antecedencia minima de 48 horas:

1. PUBLICACAO DA PAUTA
   - Pauta criada com status RASCUNHO
   - Publicacao muda status para APROVADA
   - Publicar so permitido se sessao >= 48h no futuro
   - Considera horario especifico da sessao se definido

2. DESPUBLICACAO
   - Voltar de APROVADA para RASCUNHO so permitido se sessao >= 48h
   - Garante que pauta publicada nao seja retirada de ultima hora
   - Protege direito do cidadao de se preparar para sessao

3. VALIDACAO NA SESSAO
   - Sessao so pode iniciar se pauta esta publicada (status APROVADA)
   - Operador recebe mensagem clara para publicar pauta primeiro
   - Sistema bloqueia inicio de sessao com pauta em RASCUNHO

4. AUDITORIA
   - Todas acoes de publicar/despublicar sao registradas
   - Inclui usuario, data/hora, e estado anterior/novo
   - Permite rastrear manipulacoes de pauta

Objetivo: Garantir transparencia e permitir que cidadaos acompanhem
a ordem do dia com tempo habil para preparacao.
```

---

## 13. PORTAL INSTITUCIONAL

### 13.1 Estrutura do Portal

```
ESTRUTURA OBRIGATORIA DO PORTAL:

PAGINA INICIAL
├── Noticias em destaque
├── Proximas sessoes
├── Acesso rapido a transparencia
└── Estatisticas resumidas

INSTITUCIONAL
├── Sobre a Camara
├── Historia
├── Papel da Camara
├── Papel do Vereador
├── Lei Organica Municipal
├── Regimento Interno
├── Codigo de Etica
└── Estrutura Organizacional

PARLAMENTARES
├── Vereadores da Legislatura Atual
├── Mesa Diretora
├── Composicao das Comissoes
├── Galeria de Ex-Vereadores
└── Perfil Individual (com estatisticas)

LEGISLATIVO
├── Sessoes
│   ├── Calendario
│   ├── Pautas
│   ├── Atas
│   └── Transmissao ao Vivo
├── Proposicoes
│   ├── Consulta
│   ├── Tramitacao
│   └── Acompanhar Proposicao
├── Leis Municipais
├── Decretos
├── Resolucoes
└── Comissoes
    ├── Permanentes
    ├── Temporarias
    └── CPIs

TRANSPARENCIA
├── Portal da Transparencia
├── Receitas
├── Despesas
├── Contratos
├── Licitacoes
├── Folha de Pagamento
├── Diarias
├── Verbas Indenizatorias
├── LOA/LDO/PPA
└── Prestacao de Contas

PARTICIPACAO
├── Ouvidoria
├── e-SIC
├── Fale com o Vereador
├── Sugestoes de Projetos
├── Enquetes
└── Audiencias Publicas

SERVICOS
├── Certidoes
├── Requerimentos
├── Visita Guiada
└── Biblioteca
```

### 13.2 Integracao Portal x Sistema Interno

```
REGRA RN-130: SINCRONIZACAO AUTOMATICA
Todas as alteracoes no sistema administrativo DEVEM
refletir automaticamente no portal publico.
NAO e permitida duplicidade de cadastro.

REGRA RN-131: PUBLICACAO CONTROLADA
Alguns conteudos requerem aprovacao antes de publicacao:
- Noticias (aprovacao do editor)
- Proposicoes (apos protocolo oficial)
- Atas (apos aprovacao em plenario)

REGRA RN-132: HISTORICO COMPLETO
O portal DEVE manter historico completo de:
- Legislaturas anteriores
- Parlamentares de mandatos passados
- Leis e documentos historicos
- Busca em todo o acervo
```

---

## 14. VALIDACOES OBRIGATORIAS

### 14.1 Validacoes de Proposicao

```typescript
// VALIDACOES QUE O SISTEMA DEVE EXECUTAR

interface ValidacaoProposicao {
  // ANTES DO PROTOCOLO
  validarCamposObrigatorios(): boolean  // Ementa, justificativa, texto
  validarInicativaPrivativa(): boolean   // Se nao invade competencia do Executivo
  validarMateriaAnaloga(): boolean       // Se nao ha materia identica rejeitada
  validarAutor(): boolean                // Se autor pode apresentar este tipo

  // ANTES DA TRAMITACAO
  validarRequisitosFormais(): boolean    // Formatacao, tecnica legislativa
  validarCompetenciaMunicipal(): boolean // Se materia e de competencia local

  // ANTES DA PAUTA
  validarParecerCLJ(): boolean           // Se tem parecer da CLJ
  validarPrazoMinimo(): boolean          // Se cumpriu intersticio
  validarQuorumNecessario(): boolean     // Se ha quorum para votacao

  // ANTES DA VOTACAO
  validarDiscussoesRealizadas(): boolean // Se passou por discussoes necessarias
  validarEmendasAnalisadas(): boolean    // Se emendas foram apreciadas
  validarImpedimentos(): boolean         // Se ha parlamentares impedidos
}
```

### 14.2 Validacoes de Sessao

```typescript
interface ValidacaoSessao {
  // ANTES DE INICIAR
  validarQuorumInstalacao(): boolean     // Maioria absoluta presente
  validarConvocacaoRegular(): boolean    // Convocacao no prazo
  validarPautaPublicada(): boolean       // Pauta publicada 48h antes

  // DURANTE A SESSAO
  validarQuorumVotacao(): boolean        // Quorum para cada votacao
  validarOrdemPauta(): boolean           // Se ordem esta sendo seguida
  validarTempoRegimental(): boolean      // Tempo de fala respeitado

  // APOS A SESSAO
  validarAtaCompleta(): boolean          // Todos os registros feitos
  validarPresencaRegistrada(): boolean   // Presenca de todos registrada
  validarVotacoesRegistradas(): boolean  // Todas votacoes com resultado
}
```

### 14.3 Validacoes de Votacao

```typescript
interface ValidacaoVotacao {
  // ANTES DE ABRIR VOTACAO
  validarQuorumPresente(): boolean       // Quorum minimo presente
  validarMateriaDiscutida(): boolean     // Discussao foi realizada
  validarParlamentaresHabilitados(): boolean // Sem impedimentos

  // DURANTE A VOTACAO
  validarVotoUnico(): boolean            // Cada parlamentar vota uma vez
  validarAutenticacao(): boolean         // Voto de parlamentar autenticado

  // APOS A VOTACAO
  validarQuorumAprovacao(): boolean      // Quorum atingido para resultado
  validarRegistroCompleto(): boolean     // Todos os votos registrados
}
```

---

## 15. REGRAS DE AUTORIZACAO

### 15.1 Matriz de Permissoes

| Acao | Cidadao | Parlamentar | Secretaria | Operador | Presidente | Admin |
|------|---------|-------------|------------|----------|------------|-------|
| Consultar proposicoes | Sim | Sim | Sim | Sim | Sim | Sim |
| Criar proposicao | Nao | Sim | Sim* | Nao | Sim | Sim |
| Tramitar proposicao | Nao | Nao | Sim | Nao | Sim | Sim |
| Criar sessao | Nao | Nao | Sim | Nao | Sim | Sim |
| Controlar sessao | Nao | Nao | Nao | Sim | Sim | Sim |
| Registrar presenca | Nao | Nao | Nao | Sim | Sim | Sim |
| Votar | Nao | Sim | Nao | Nao | Sim | Nao |
| Publicar noticia | Nao | Nao | Sim | Nao | Sim | Sim |
| Gerenciar usuarios | Nao | Nao | Nao | Nao | Nao | Sim |
| Configurar sistema | Nao | Nao | Nao | Nao | Nao | Sim |

*Secretaria pode criar em nome de parlamentar

### 15.2 Restricoes Especiais

```
REGRA RN-150: VOTACAO SO POR PARLAMENTAR
Apenas usuarios com role PARLAMENTAR e com mandato ativo
podem registrar votos no sistema de votacao.

REGRA RN-151: CONTROLE DE SESSAO
Apenas OPERADOR, PRESIDENTE e ADMIN podem:
- Iniciar/encerrar sessao
- Abrir/fechar votacao
- Registrar presenca

REGRA RN-152: TRAMITACAO OFICIAL
Apenas SECRETARIA, PRESIDENTE e ADMIN podem:
- Movimentar proposicoes entre unidades
- Registrar despachos oficiais
- Gerar numeracao de protocolo

REGRA RN-153: PUBLICACAO
Conteudo so pode ser publicado no portal por:
- EDITOR (noticias)
- SECRETARIA (documentos oficiais)
- ADMIN (qualquer conteudo)

REGRA RN-154: AUDITORIA
Logs de auditoria NAO PODEM ser alterados ou excluidos
por nenhum usuario, incluindo ADMIN.

REGRA RN-155: ACESSO DO PARLAMENTAR DURANTE SESSAO
Quando existe sessao EM_ANDAMENTO:
- Parlamentar COM presenca confirmada: acessa APENAS modulo de votacao
- Parlamentar SEM presenca confirmada: acesso BLOQUEADO (aguarda operador)
- Parlamentar NAO pode acessar dashboard durante sessao em andamento

REGRA RN-156: ACESSO DO PARLAMENTAR SEM SESSAO
Quando NAO existe sessao em andamento:
- Parlamentar acessa APENAS dashboard com seus dados pessoais
- Dashboard exibe: presenca, votacoes, comissoes, mandatos
- Parlamentar NAO pode acessar modulo de votacao

REGRA RN-157: SEPARACAO DE AREAS POR ROLE
- Usuarios PARLAMENTAR: acessam /parlamentar (NAO acessam /admin)
- Usuarios ADMIN, EDITOR, OPERADOR, SECRETARIA: acessam /admin (NAO acessam /parlamentar)
- Middleware redireciona automaticamente para area correta

REGRA RN-158: MENU RESTRITO DO OPERADOR
- OPERADOR ve APENAS: Sessoes e Painel Eletronico no menu
- OPERADOR NAO tem acesso ao Dashboard administrativo
- Acesso a /admin redireciona para /admin/painel-eletronico
- Permissoes limitadas a operacao de sessao/votacao
```

### 15.3 Mesa da Sessao

```
REGRA RN-160: MESA DA SESSAO
A Mesa da Sessao e composta pelos membros da Mesa Diretora vigente
que presidem uma sessao especifica. Permite registrar substituicoes
temporarias quando um membro titular esta ausente.

REGRA RN-161: COMPOSICAO PADRAO
Por padrao, a Mesa da Sessao herda a composicao da Mesa Diretora
ativa do periodo legislativo. Pode ser personalizada para cada sessao.

REGRA RN-162: SUBSTITUICAO POR AUSENCIA
Se o Presidente nao puder presidir a sessao, a ordem de substituicao e:
1. Vice-Presidente assume a Presidencia
2. 1o Secretario assume (se Vice ausente)
3. 2o Secretario assume (se demais ausentes)
4. Vereador mais idoso presente (ultimo recurso)
Toda substituicao DEVE ser registrada com motivo.

REGRA RN-163: RASTREABILIDADE DA PRESIDENCIA
O sistema DEVE registrar para cada sessao:
- Quem presidiu efetivamente
- Se foi titular ou substituto
- Motivo da substituicao (se aplicavel)
- Data/hora do registro

REGRA RN-164: PERMISSOES PARA ALTERAR MESA
Podem alterar a Mesa da Sessao:
- ADMIN, SECRETARIA, OPERADOR
A sessao NAO precisa estar em andamento para alterar a mesa.

REGRA RN-165: RESTAURACAO DA MESA DIRETORA
E possivel restaurar a composicao padrao (Mesa Diretora)
a qualquer momento antes do encerramento da sessao.
```

---

## ANEXO A: GLOSSARIO

| Termo | Definicao |
|-------|-----------|
| **Autografo** | Texto definitivo de proposicao aprovada, enviado a sancao |
| **Ementa** | Resumo do conteudo da proposicao |
| **Intersticio** | Prazo minimo entre discussoes de uma mesma materia |
| **Maioria Absoluta** | Metade mais um do total de membros da Casa |
| **Maioria Simples** | Metade mais um dos presentes a sessao |
| **Ordem do Dia** | Parte da sessao destinada a votacao de materias |
| **Parecer** | Opiniao fundamentada de comissao sobre proposicao |
| **Promulgacao** | Ato que atesta a existencia da lei |
| **Quorum** | Numero minimo de parlamentares para deliberacao |
| **Redacao Final** | Versao consolidada apos emendas aprovadas |
| **Sancao** | Aprovacao de projeto de lei pelo chefe do Executivo |
| **Tramitacao** | Percurso da proposicao pela Casa Legislativa |
| **Veto** | Rejeicao total ou parcial de projeto pelo Executivo |

---

## ANEXO B: REFERENCIAS LEGAIS

1. **Constituicao Federal de 1988**
   - Art. 29: Organizacao dos Municipios
   - Art. 30: Competencias Municipais
   - Art. 37: Principios da Administracao Publica

2. **Lei Organica Municipal**
   - Processo Legislativo local
   - Competencias da Camara
   - Direitos dos Vereadores

3. **Regimento Interno da Camara**
   - Tramitacao detalhada
   - Prazos especificos
   - Procedimentos de sessao

4. **Lei 12.527/2011 (LAI)**
   - Acesso a informacao
   - Prazos de resposta
   - Transparencia ativa

5. **PNTP - Programa Nacional de Transparencia Publica**
   - Criterios de avaliacao
   - Requisitos para selo Diamante
   - Periodicidade de atualizacao

---

## ANEXO C: CHECKLIST DE CONFORMIDADE

### C.1 Checklist PNTP Legislativo

- [ ] Votacoes nominais atualizadas (30 dias)
- [ ] Presenca em sessoes atualizada (30 dias)
- [ ] Pautas publicadas com 48h antecedencia
- [ ] Atas publicadas em ate 15 dias
- [ ] Lista de vereadores com partido e contatos
- [ ] Remuneracao de parlamentares disponivel
- [ ] Diarias e verbas indenizatorias publicadas
- [ ] Ouvidoria funcionando com protocolo
- [ ] e-SIC disponivel e respondendo prazos
- [ ] API de dados abertos funcionando
- [ ] Contratos publicados em 24h
- [ ] Licitacoes com editais completos
- [ ] Folha de pagamento mensal
- [ ] Leis e decretos com texto integral

### C.2 Checklist Processo Legislativo

- [ ] Todas proposicoes passam pela CLJ
- [ ] Pareceres registrados antes de pauta
- [ ] Quorum verificado antes de votacao
- [ ] Votacao nominal quando obrigatoria
- [ ] Vetos apreciados no prazo de 30 dias
- [ ] Leis publicadas apos promulgacao
- [ ] Historico de tramitacao completo
- [ ] Notificacoes enviadas automaticamente

---

> **FIM DO DOCUMENTO DE REGRAS DE NEGOCIO**
>
> Este documento DEVE ser consultado pelo Claude antes de qualquer implementacao
> relacionada ao processo legislativo. Atualizacoes devem ser versionadas.
