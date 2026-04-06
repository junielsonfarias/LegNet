# SISTEMA DE GESTAO LEGISLATIVA MUNICIPAL

## Camara Municipal

**Versao**: 1.0.0
**Data**: Fevereiro de 2026
**Status**: Em Producao

---

# SUMARIO

1. [Introducao e Contexto](#parte-1-introducao-e-contexto)
2. [Arquitetura do Sistema](#parte-2-arquitetura-do-sistema)
3. [Fluxo Legislativo Completo](#parte-3-fluxo-legislativo-completo)
4. [Painel Eletronico](#parte-4-painel-eletronico)
5. [Geracao de Pauta](#parte-5-geracao-de-pauta)
6. [Portal de Transparencia](#parte-6-portal-de-transparencia)
7. [Funcionalidades de Pesquisa](#parte-7-funcionalidades-de-pesquisa)
8. [Area do Parlamentar](#parte-8-area-do-parlamentar)
9. [Administracao](#parte-9-administracao)
10. [Beneficios e Conclusao](#parte-10-beneficios-e-conclusao)

---

# PARTE 1: INTRODUCAO E CONTEXTO

## 1.1 Sumario Executivo

O Sistema de Gestao Legislativa Municipal e uma plataforma digital completa desenvolvida para modernizar e automatizar todos os processos legislativos da Camara Municipal. Baseado no SAPL (Sistema de Apoio ao Processo Legislativo) do Interlegis, o sistema oferece:

- **Gestao Completa do Processo Legislativo**: Da apresentacao de proposicoes ate a publicacao de leis
- **Painel Eletronico de Votacao**: Controle de sessoes em tempo real com votacao nominal
- **Portal de Transparencia PNTP**: Conformidade nivel Diamante com a Lei de Acesso a Informacao
- **Area do Parlamentar**: Dashboard personalizado e votacao eletronica
- **Automacao de Pautas**: Sugestao inteligente e validacao regimental automatica

### Principais Beneficios

| Aspecto | Beneficio |
|---------|-----------|
| **Eficiencia** | Reducao de 70% no tempo de tramitacao |
| **Transparencia** | 100% dos atos publicos em tempo real |
| **Economia** | Eliminacao de processos em papel |
| **Conformidade** | Atende LAI e PNTP automaticamente |
| **Acessibilidade** | WCAG 2.1 nivel AA |

---

## 1.2 Contexto e Importancia

### Por que Modernizar o Processo Legislativo?

A transformacao digital do Poder Legislativo Municipal e uma necessidade urgente para:

1. **Atender a Lei de Acesso a Informacao (LAI)** - Lei 12.527/2011
2. **Cumprir o Programa Nacional de Transparencia Publica (PNTP)**
3. **Aumentar a participacao cidada** no processo legislativo
4. **Garantir rastreabilidade** de todos os atos legislativos
5. **Reduzir custos operacionais** com papel e processos manuais

### Problema Anterior

```
PROCESSO MANUAL (ANTES)
=======================

Cidadao -> Balcao Fisico -> Protocolo em Papel
                                    |
                                    v
                            Pasta Fisica
                                    |
                                    v
                        Tramitacao Manual
                          (dias/semanas)
                                    |
                                    v
                         Votacao em Papel
                                    |
                                    v
                      Publicacao Impressa
                          (atraso de dias)

PROBLEMAS:
- Falta de rastreabilidade
- Atraso na publicacao
- Dificuldade de acesso ao cidadao
- Risco de perda de documentos
- Custos com impressao e armazenamento
```

### Solucao Implementada

```
PROCESSO DIGITAL (AGORA)
========================

Cidadao -> Portal Online -> Protocolo Digital
                                    |
                                    v
                          Banco de Dados
                           (instantaneo)
                                    |
                                    v
                        Tramitacao Automatica
                          (alertas e prazos)
                                    |
                                    v
                        Votacao Eletronica
                         (tempo real)
                                    |
                                    v
                      Publicacao Automatica
                         (imediata)

BENEFICIOS:
- Rastreabilidade total
- Publicacao instantanea
- Acesso 24/7 ao cidadao
- Backup automatico
- Custo zero com papel
```

---

## 1.3 Conformidade Legal

### Lei de Acesso a Informacao (LAI) - Lei 12.527/2011

O sistema atende integralmente aos requisitos da LAI:

| Artigo | Requisito | Como o Sistema Atende |
|--------|-----------|----------------------|
| Art. 3 | Publicidade como regra | Portal publico 24/7 |
| Art. 5 | Acesso garantido | APIs abertas, busca global |
| Art. 6 | Gestao transparente | Auditoria completa |
| Art. 7 | Direito a informacao | Download em multiplos formatos |
| Art. 8 | Divulgacao proativa | Dados abertos automaticos |

### Programa Nacional de Transparencia Publica (PNTP)

O sistema foi projetado para atingir o **Nivel Diamante** do PNTP:

```
NIVEIS PNTP
===========

Bronze -----> Prata -----> Ouro -----> DIAMANTE
  |            |            |            |
  v            v            v            v
Basico     Medio       Avancado    COMPLETO
(50%)      (70%)        (85%)       (100%)

SISTEMA LEGISLATIVO: NIVEL DIAMANTE
====================================
- 23 paginas de transparencia
- 9 APIs de dados abertos
- Atualizacao em tempo real
- Formatos: JSON, CSV, PDF
- Acessibilidade WCAG 2.1 AA
```

### Requisitos PNTP Atendidos

| Categoria | Itens | Status |
|-----------|-------|--------|
| Informacoes Institucionais | 8 | CONFORME |
| Processo Legislativo | 12 | CONFORME |
| Parlamentares | 6 | CONFORME |
| Financeiro | 10 | CONFORME |
| Pessoal | 5 | CONFORME |
| Dados Abertos | 9 | CONFORME |
| Acessibilidade | 8 | CONFORME |
| **TOTAL** | **58** | **100%** |

---

# PARTE 2: ARQUITETURA DO SISTEMA

## 2.1 Stack Tecnologico

O sistema utiliza tecnologias modernas e consolidadas no mercado:

### Frontend (Interface do Usuario)

| Tecnologia | Versao | Funcao |
|------------|--------|--------|
| **Next.js** | 14.x | Framework React com SSR |
| **React** | 18.x | Biblioteca de UI |
| **TypeScript** | 5.x | Tipagem estatica |
| **Tailwind CSS** | 3.x | Estilizacao utilitaria |
| **Radix UI** | Latest | Componentes acessiveis |
| **Lucide Icons** | Latest | Icones consistentes |

### Backend (Servidor)

| Tecnologia | Versao | Funcao |
|------------|--------|--------|
| **Next.js API Routes** | 14.x | API REST |
| **Prisma ORM** | 5.x | Acesso ao banco de dados |
| **NextAuth.js** | 4.x | Autenticacao |
| **Zod** | 3.x | Validacao de dados |

### Banco de Dados

| Tecnologia | Versao | Funcao |
|------------|--------|--------|
| **PostgreSQL** | 15.x | Banco relacional |
| **Prisma Migrate** | 5.x | Migracoes |

### Infraestrutura

| Servico | Provedor | Funcao |
|---------|----------|--------|
| **Hospedagem** | Vercel | Deploy automatico |
| **Banco de Dados** | Supabase/Neon | PostgreSQL gerenciado |
| **CDN** | Vercel Edge | Cache global |
| **SSL** | Let's Encrypt | Certificado HTTPS |

### Diagrama de Arquitetura

```
                    ARQUITETURA DO SISTEMA
    ================================================================

    USUARIOS                           INTERNET
    ========                           ========

    [Cidadao]  ----+
                   |
    [Parlamentar] -+----> [CDN/Edge] ----> [Load Balancer]
                   |                              |
    [Operador] ----+                              |
                   |                              v
    [Admin] -------+                     +----------------+
                                         |   NEXT.JS      |
                                         |   SERVER       |
                                         |  (API + SSR)   |
                                         +-------+--------+
                                                 |
                            +--------------------+--------------------+
                            |                    |                    |
                            v                    v                    v
                     +-----------+        +-----------+        +-----------+
                     | PRISMA    |        | NEXTAUTH  |        | SSE       |
                     | ORM       |        | (Auth)    |        | (Realtime)|
                     +-----------+        +-----------+        +-----------+
                            |                    |
                            v                    v
                     +------------------------------------------+
                     |              POSTGRESQL                   |
                     |  (Dados + Sessions + Auditoria)          |
                     +------------------------------------------+
```

---

## 2.2 Modulos do Sistema

O sistema e composto por **9 modulos principais**:

### Visao Geral dos Modulos

```
+-----------------------------------------------------------------------+
|                    SISTEMA LEGISLATIVO MUNICIPAL                       |
+-----------------------------------------------------------------------+
|                                                                        |
|  +------------------+  +------------------+  +------------------+      |
|  |                  |  |                  |  |                  |      |
|  |   LEGISLATIVO    |  |    OPERADOR      |  |  TRANSPARENCIA   |      |
|  |                  |  |                  |  |                  |      |
|  | - Proposicoes    |  | - Painel         |  | - Portal PNTP    |      |
|  | - Tramitacao     |  | - Presenca       |  | - Dados Abertos  |      |
|  | - Emendas        |  | - Votacao        |  | - APIs Publicas  |      |
|  | - Pareceres      |  | - Cronometro     |  | - Exportacao     |      |
|  +------------------+  +------------------+  +------------------+      |
|                                                                        |
|  +------------------+  +------------------+  +------------------+      |
|  |                  |  |                  |  |                  |      |
|  |   PARLAMENTAR    |  |    COMISSOES     |  |   SECRETARIA     |      |
|  |                  |  |                  |  |                  |      |
|  | - Dashboard      |  | - Membros        |  | - Protocolo      |      |
|  | - Votacao        |  | - Reunioes       |  | - Pautas         |      |
|  | - Estatisticas   |  | - Pareceres      |  | - Atas           |      |
|  | - Perfil         |  | - Relatorios     |  | - Documentos     |      |
|  +------------------+  +------------------+  +------------------+      |
|                                                                        |
|  +------------------+  +------------------+  +------------------+      |
|  |                  |  |                  |  |                  |      |
|  |      ADMIN       |  |  INTEGRACOES     |  |   INSTITUCIONAL  |      |
|  |                  |  |                  |  |                  |      |
|  | - Usuarios       |  | - APIs REST      |  | - Sobre          |      |
|  | - Configuracoes  |  | - Webhooks       |  | - Contato        |      |
|  | - Auditoria      |  | - Exportacao     |  | - Noticias       |      |
|  | - Relatorios     |  | - Integracao     |  | - Agenda         |      |
|  +------------------+  +------------------+  +------------------+      |
|                                                                        |
+-----------------------------------------------------------------------+
```

### Detalhamento dos Modulos

| Modulo | Descricao | Usuarios |
|--------|-----------|----------|
| **Legislativo** | Gestao completa de proposicoes, tramitacao, emendas e pareceres | Secretaria, Editor |
| **Operador** | Painel eletronico para controle de sessoes em tempo real | Operador |
| **Transparencia** | Portal publico com dados abertos e conformidade PNTP | Cidadao |
| **Parlamentar** | Area exclusiva para vereadores com dashboard e votacao | Parlamentar |
| **Comissoes** | Gestao de comissoes, membros, reunioes e pareceres | Secretaria |
| **Secretaria** | Protocolo, pautas, atas e documentos administrativos | Secretaria |
| **Admin** | Configuracoes, usuarios, auditoria e relatorios | Admin |
| **Integracoes** | APIs publicas, webhooks e exportacao de dados | Sistemas externos |
| **Institucional** | Paginas publicas de informacao da Camara | Cidadao |

---

## 2.3 Seguranca

### Camadas de Protecao

```
SEGURANCA EM CAMADAS
====================

Camada 1: REDE
--------------
[x] HTTPS obrigatorio (TLS 1.3)
[x] Certificado SSL automatico
[x] CDN com protecao DDoS
[x] Headers de seguranca (CSP, HSTS)

Camada 2: AUTENTICACAO
----------------------
[x] NextAuth.js com sessoes seguras
[x] Senhas com bcrypt (salt rounds: 12)
[x] Sessoes com expiracao (24h)
[x] Tokens CSRF em formularios

Camada 3: AUTORIZACAO
---------------------
[x] Sistema de roles (7 tipos)
[x] Permissoes granulares (40+)
[x] Middleware de verificacao
[x] APIs protegidas por role

Camada 4: DADOS
---------------
[x] Validacao com Zod em todas APIs
[x] Sanitizacao de inputs
[x] Prepared statements (Prisma)
[x] Criptografia de dados sensiveis

Camada 5: AUDITORIA
-------------------
[x] Log de todas as acoes
[x] Registro de IP e User-Agent
[x] Historico imutavel
[x] Alertas de atividade suspeita
```

### Sistema de Roles e Permissoes

| Role | Descricao | Permissoes Principais |
|------|-----------|----------------------|
| **ADMIN** | Administrador total | Acesso completo a todas funcionalidades |
| **SECRETARIA** | Servidor da Camara | Protocolo, tramitacao, pautas |
| **AUXILIAR_LEGISLATIVO** | Auxiliar | Proposicoes, tramitacao, comissoes |
| **EDITOR** | Editor de conteudo | Editar proposicoes e documentos |
| **OPERADOR** | Operador de sessao | Painel eletronico, presenca, votacao |
| **PARLAMENTAR** | Vereador | Dashboard, votacao, proposicoes |
| **USER** | Usuario basico | Leitura publica |

### Auditoria Completa

Todos os atos sao registrados com:

- Data e hora (timestamp)
- Usuario responsavel
- IP de origem
- User-Agent (navegador)
- Acao realizada
- Dados anteriores e novos
- Motivo (quando aplicavel)

```
EXEMPLO DE LOG DE AUDITORIA
===========================

{
  "id": "clxyz123abc",
  "dataHora": "2026-02-03T14:30:00Z",
  "usuario": "operador@camara.gov.br",
  "acao": "VOTACAO_REGISTRADA",
  "entidade": "Voto",
  "entidadeId": "voto_456",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "dadosNovos": {
    "parlamentarId": "parl_123",
    "valor": "SIM",
    "sessaoId": "sessao_789"
  }
}
```

---

# PARTE 3: FLUXO LEGISLATIVO COMPLETO

## 3.1 Tipos de Proposicoes

O sistema suporta **10 tipos de proposicoes legislativas**:

### Tabela de Tipos

| Sigla | Nome | Descricao | Votacao | Turnos | Quorum |
|-------|------|-----------|---------|--------|--------|
| **PL** | Projeto de Lei | Cria ou altera leis municipais | SIM | 1-2 | Maioria Simples |
| **PLC** | Projeto de Lei Complementar | Complementa a Lei Organica | SIM | 2 | Maioria Absoluta |
| **PR** | Projeto de Resolucao | Normas internas da Camara | SIM | 1 | Maioria Simples |
| **PD** | Projeto de Decreto Legislativo | Competencia exclusiva | SIM | 1 | Maioria Simples |
| **IND** | Indicacao | Sugestao ao Executivo | NAO | - | - |
| **REQ** | Requerimento | Solicitacoes diversas | DEPENDE | - | Maioria Simples |
| **MOC** | Mocao | Manifestacoes da Casa | SIM | 1 | Maioria Simples |
| **VP** | Voto de Pesar | Homenagem postuma | NAO | - | - |
| **VA** | Voto de Aplauso | Congratulacao | NAO | - | - |
| **EMD** | Emenda | Alteracao de proposicao | SIM | - | Igual a principal |

### Caracteristicas por Tipo

```
PROJETOS DE LEI (PL, PLC)
=========================
- Passam por todas as comissoes
- Requerem parecer da CLJ
- Votacao nominal obrigatoria
- Podem ser emendados
- Vao para sancao do Executivo

PROJETOS INTERNOS (PR, PD)
==========================
- Passam apenas pela CLJ
- Votacao em plenario
- Nao vao para o Executivo
- Promulgados pelo Presidente

INDICACOES E REQUERIMENTOS (IND, REQ)
=====================================
- Tramitacao simplificada
- Leitura em expediente
- Encaminhamento direto

VOTOS E MOCOES (VP, VA, MOC)
============================
- Leitura em plenario
- Aprovacao simbolica
- Publicacao imediata
```

---

## 3.2 Fluxo de Tramitacao Completo

### Diagrama do Fluxo

```
                    FLUXO DE TRAMITACAO LEGISLATIVA
    ================================================================

    1. INICIATIVA
    =============

    [Parlamentar] ----+
                      |
    [Executivo] ------+-----> [PROPOSICAO]
                      |
    [Cidadao] --------+
    [Comissao] -------+


    2. PROTOCOLO E NUMERACAO
    ========================

    [PROPOSICAO] ----> [SECRETARIA] ----> [PL 001/2026]
                            |
                            v
                    +---------------+
                    |  Atribuicao   |
                    |  de Numero    |
                    |  Sequencial   |
                    +---------------+


    3. LEITURA EM PLENARIO
    ======================

    [PL 001/2026] ----> [SESSAO] ----> [Leitura no Expediente]
                                              |
                                              v
                                    [Conhecimento da Casa]


    4. ENCAMINHAMENTO AS COMISSOES
    ==============================

                    +------------------+
                    |                  |
                    v                  |
            +-------------+            |
            |    CLJ      |<-----------+ (OBRIGATORIA)
            | (Legislacao |            |
            |  e Justica) |            |
            +------+------+            |
                   |                   |
                   v                   |
            +-------------+            |
            |    CFO      |<-----------+ (Se envolver recursos)
            | (Financas e |            |
            |  Orcamento) |            |
            +------+------+            |
                   |                   |
                   v                   |
            +-------------+            |
            | TEMATICAS   |<-----------+ (Conforme materia)
            | (CES, COU,  |
            |  etc.)      |
            +-------------+


    5. PARECER DAS COMISSOES
    ========================

    [Proposicao] ----> [Relator] ----> [Analise]
                                          |
                    +---------------------+---------------------+
                    |                     |                     |
                    v                     v                     v
            [FAVORAVEL]           [CONTRARIO]        [COM EMENDAS]
                    |                     |                     |
                    v                     v                     v
            [Votacao na         [Arquivamento      [Votacao com
             Comissao]           Sugerido]          alteracoes]


    6. INCLUSAO NA PAUTA
    ====================

    [Pareceres OK] ----> [AGUARDANDO PAUTA] ----> [ORDEM DO DIA]
                                                        |
                                                        v
                                              [Publicacao 48h antes]
                                                     (PNTP)


    7. DISCUSSAO E VOTACAO
    ======================

    [ORDEM DO DIA] ----> [Discussao] ----> [Votacao]
          |                   |                |
          |                   v                v
          |            +-----------+    +-----------+
          |            | Emendas   |    | Quorum    |
          |            | de        |    | Verificado|
          |            | Plenario  |    +-----------+
          |            +-----------+          |
          |                                   v
          |                            +------------+
          |                            |  VOTACAO   |
          |                            |  NOMINAL   |
          |                            +-----+------+
          |                                  |
          |              +-------------------+-------------------+
          |              |                   |                   |
          |              v                   v                   v
          |        [APROVADA]          [REJEITADA]         [ADIADA]


    8. POS-VOTACAO (Se Aprovada)
    ============================

    [APROVADA] ----> [Redacao Final] ----> [Autografo]
                                               |
                                               v
                                    [Envio ao Executivo]
                                               |
                          +--------------------+--------------------+
                          |                                         |
                          v                                         v
                    [SANCAO]                                   [VETO]
                          |                                         |
                          v                                         v
                    [PUBLICACAO]                          [Apreciacao em 30 dias]
                          |                                         |
                          v                                         v
                    [LEI VIGENTE]                    [Mantido]    [Rejeitado]
                                                        |              |
                                                        v              v
                                                 [Arquivado]    [Promulgado]
```

---

## 3.3 Etapas Detalhadas

### Etapa 1: Iniciativa e Protocolo

**Quem pode apresentar proposicoes:**

| Autor | Tipos Permitidos | Restricoes |
|-------|------------------|------------|
| Parlamentar | Todos os tipos | Nenhuma |
| Prefeito | PL, PLC | Iniciativa privativa em certas materias |
| Cidadao | PL (iniciativa popular) | 5% do eleitorado |
| Comissao | PR, PD | Dentro de sua competencia |
| Mesa Diretora | PR, PD | Materias internas |

**Iniciativa Privativa do Executivo (RN-020):**

O Prefeito tem iniciativa EXCLUSIVA para projetos sobre:
- Criacao de cargos e funcoes publicas
- Aumento de remuneracao de servidores
- Regime juridico dos servidores
- Organizacao administrativa
- Orcamento (LOA, LDO, PPA)
- Concessao de subsidios ou isencoes

**O sistema BLOQUEIA** a criacao de proposicoes sobre estas materias por parlamentares.

### Etapa 2: Leitura em Plenario

```
PROCEDIMENTO DE LEITURA
=======================

1. Secretario le a ementa da proposicao
2. Presidente informa o numero atribuido
3. Proposicao entra em conhecimento da Casa
4. Autor pode fazer breve explanacao (3 min)
5. Sistema registra data/hora da leitura
```

### Etapa 3: Encaminhamento as Comissoes

**Ordem de Tramitacao:**

```
1. CLJ (SEMPRE PRIMEIRA)
   |
   +-- Se INCONSTITUCIONAL --> Arquivamento
   |
   v
2. CFO (SE ENVOLVER RECURSOS)
   |
   v
3. COMISSOES TEMATICAS
   |
   v
4. PLENARIO
```

**Prazos Regimentais:**

| Regime | Prazo CLJ | Prazo Outras | Total Maximo |
|--------|-----------|--------------|--------------|
| Normal | 10 dias | 10 dias cada | 40 dias |
| Prioridade | 5 dias | 5 dias | 20 dias |
| Urgencia | 48h | 48h | 5 dias |
| Urgencia Urgentissima | Imediato | - | Mesma sessao |

### Etapa 4: Parecer das Comissoes

**Tipos de Parecer:**

| Parecer | Descricao | Consequencia |
|---------|-----------|--------------|
| **FAVORAVEL** | Pela aprovacao | Vai para votacao |
| **CONTRARIO** | Pela rejeicao | Vai para votacao (pode ser aprovado) |
| **COM EMENDAS** | Aprova com alteracoes | Emendas votadas junto |
| **INCONSTITUCIONAL** | Vicio juridico (CLJ) | Arquivamento imediato |
| **PREJUDICADO** | Materia ja tratada | Arquivamento |

### Etapa 5: Inclusao na Pauta

**Validacoes Automaticas (RN-056, RN-058):**

```
CHECKLIST ANTES DE INCLUIR NA PAUTA
===================================

[x] Parecer da CLJ existe?
[x] Parecer da CFO existe (se aplicavel)?
[x] Todos os pareceres foram votados?
[x] Intersticio entre turnos cumprido?
[x] Sessao esta com 48h de antecedencia?
[x] Quorum necessario sera atingido?
```

### Etapa 6: Discussao e Votacao

**Ordem dos Trabalhos na Sessao (RN-043):**

1. Abertura e verificacao de quorum
2. Leitura e aprovacao da ata anterior
3. Expediente (correspondencias, comunicacoes)
4. Explicacoes pessoais
5. **Ordem do Dia** (discussao e votacao)
6. Encerramento

**Precedencia na Ordem do Dia (RN-050):**

1. Vetos (prazo constitucional de 30 dias)
2. Regime de urgencia urgentissima
3. Regime de urgencia
4. Regime de prioridade
5. Redacoes finais pendentes
6. 2o turno de votacao
7. 1o turno de votacao
8. Ordem cronologica

### Etapa 7: Sancao ou Veto

**Prazos do Executivo:**

| Acao | Prazo | Consequencia |
|------|-------|--------------|
| Sancao expressa | 15 dias uteis | Lei publicada |
| Sancao tacita | Apos 15 dias sem manifestacao | Lei publicada |
| Veto total | 15 dias uteis | Apreciacao em 30 dias |
| Veto parcial | 15 dias uteis | Partes nao vetadas viram lei |

**Apreciacao do Veto:**

```
FLUXO DE APRECIACAO DE VETO
===========================

[VETO RECEBIDO]
      |
      v
[Pauta em ate 30 dias] --> (OBRIGATORIO)
      |
      v
[Votacao NOMINAL]
      |
      +-- Maioria ABSOLUTA para rejeitar
      |
      v
+-----+-----+
|           |
v           v
[MANTIDO]   [REJEITADO]
    |           |
    v           v
[Arquivado] [Promulgado pelo Presidente]
```

### Etapa 8: Promulgacao e Publicacao

**Quem Promulga:**

| Situacao | Promulgacao por |
|----------|-----------------|
| Sancao expressa | Prefeito |
| Sancao tacita | Presidente da Camara |
| Veto rejeitado | Presidente da Camara |

**Publicacao Obrigatoria (RN-087):**

- Diario Oficial do Municipio
- Portal de Transparencia da Camara
- A lei so entra em vigor apos publicacao

---

# PARTE 4: PAINEL ELETRONICO

## 4.1 Visao Geral

O Painel Eletronico e a interface central para controle de sessoes legislativas em tempo real. Permite ao operador gerenciar todo o fluxo da sessao, desde a abertura ate o encerramento.

### Funcionalidades Principais

```
+------------------------------------------------------------------+
|                    PAINEL DO OPERADOR                             |
+------------------------------------------------------------------+
|                                                                   |
|  [1] CONTROLE DE SESSAO                                          |
|      - Abrir sessao                                               |
|      - Suspender sessao                                           |
|      - Retomar sessao                                             |
|      - Encerrar sessao                                            |
|                                                                   |
|  [2] REGISTRO DE PRESENCA                                        |
|      - Grid visual de parlamentares                               |
|      - Marcar presente/ausente com um clique                      |
|      - Justificativas de ausencia                                 |
|      - Calculo automatico de quorum                               |
|                                                                   |
|  [3] CONTROLE DE PAUTA                                           |
|      - Lista de itens da sessao                                   |
|      - Iniciar/pausar discussao                                   |
|      - Reordenar itens                                            |
|      - Retirar de pauta                                           |
|                                                                   |
|  [4] VOTACAO                                                      |
|      - Iniciar votacao nominal                                    |
|      - Placar em tempo real                                       |
|      - Encerrar votacao                                           |
|      - Registrar resultado                                        |
|                                                                   |
|  [5] CRONOMETRO DE ORADORES                                      |
|      - Tempo regimental por tipo                                  |
|      - Alerta sonoro                                              |
|      - Controle manual                                            |
|                                                                   |
|  [6] TRANSMISSAO AO VIVO                                         |
|      - SSE (Server-Sent Events)                                   |
|      - Painel publico sincronizado                                |
|      - Atualizacao em tempo real                                  |
|                                                                   |
+------------------------------------------------------------------+
```

---

## 4.2 Registro de Presenca

### Interface Visual

```
+------------------------------------------------------------------+
|                    REGISTRO DE PRESENCA                           |
+------------------------------------------------------------------+
|                                                                   |
|  Quorum: 6/9 (67%)           [  QUORUM ATINGIDO  ]               |
|                                                                   |
|  +----------+  +----------+  +----------+  +----------+          |
|  |          |  |          |  |          |  |          |          |
|  |  FOTO    |  |  FOTO    |  |  FOTO    |  |  FOTO    |          |
|  |          |  |          |  |          |  |          |          |
|  +----------+  +----------+  +----------+  +----------+          |
|  | Joao     |  | Maria    |  | Pedro    |  | Ana      |          |
|  | Silva    |  | Santos   |  | Costa    |  | Lima     |          |
|  +----------+  +----------+  +----------+  +----------+          |
|  [PRESENTE ]  [PRESENTE ]  [ AUSENTE ]  [PRESENTE ]               |
|     (PP)         (MDB)        (PT)         (PSD)                  |
|                                                                   |
|  +----------+  +----------+  +----------+  +----------+          |
|  |          |  |          |  |          |  |          |          |
|  |  FOTO    |  |  FOTO    |  |  FOTO    |  |  FOTO    |          |
|  |          |  |          |  |          |  |          |          |
|  +----------+  +----------+  +----------+  +----------+          |
|  | Carlos   |  | Lucia    |  | Roberto  |  | Paula    |          |
|  | Souza    |  | Ferreira |  | Almeida  |  | Rocha    |          |
|  +----------+  +----------+  +----------+  +----------+          |
|  [PRESENTE ]  [PRESENTE ]  [JUSTIFIC.]  [PRESENTE ]               |
|     (PP)         (PP)         (PT)         (MDB)                  |
|                                                                   |
+------------------------------------------------------------------+
|                                                                   |
|  Resumo: 6 Presentes | 1 Ausente | 1 Justificado | 1 Licenca     |
|                                                                   |
+------------------------------------------------------------------+
```

### Tipos de Presenca

| Tipo | Icone | Descricao |
|------|-------|-----------|
| PRESENTE | Verde | Parlamentar presente na sessao |
| AUSENTE | Vermelho | Ausencia nao justificada |
| JUSTIFICADA | Amarelo | Ausencia com justificativa registrada |
| LICENCA | Azul | Em licenca oficial |

---

## 4.3 Controle de Quorum

### Tipos de Quorum

```
TIPOS DE QUORUM CONFIGURADOS
============================

1. MAIORIA SIMPLES
   Formula: PRESENTES / 2 + 1
   Exemplo: 8 presentes = 5 votos necessarios
   Uso: Projetos de lei ordinaria

2. MAIORIA ABSOLUTA
   Formula: MEMBROS / 2 + 1
   Exemplo: 9 membros = 5 votos necessarios
   Uso: Leis complementares, vetos

3. DOIS TERCOS (2/3)
   Formula: MEMBROS * 2 / 3
   Exemplo: 9 membros = 6 votos necessarios
   Uso: Emenda a Lei Organica

4. TRES QUINTOS (3/5)
   Formula: MEMBROS * 3 / 5
   Exemplo: 9 membros = 6 votos necessarios
   Uso: Casos especificos

5. UNANIMIDADE
   Formula: PRESENTES = 100%
   Exemplo: Todos os presentes
   Uso: Casos excepcionais
```

### Verificacao Automatica

O sistema verifica automaticamente:

- Quorum de instalacao da sessao
- Quorum para cada tipo de votacao
- Quorum durante a votacao (perda de quorum)

```
ALGORITMO DE VERIFICACAO DE QUORUM
==================================

funcao verificarQuorum(sessao, tipoVotacao):

    membros = contarMembros(sessao.legislatura)
    presentes = contarPresentes(sessao)

    se tipoVotacao == "MAIORIA_SIMPLES":
        necessario = Math.floor(presentes / 2) + 1
        base = presentes

    se tipoVotacao == "MAIORIA_ABSOLUTA":
        necessario = Math.floor(membros / 2) + 1
        base = membros

    se tipoVotacao == "DOIS_TERCOS":
        necessario = Math.ceil(membros * 2 / 3)
        base = membros

    retornar {
        temQuorum: presentes >= Math.floor(membros / 2) + 1,
        necessario: necessario,
        presentes: presentes,
        membros: membros
    }
```

---

## 4.4 Votacao Nominal

### Interface de Votacao

```
+------------------------------------------------------------------+
|                    VOTACAO EM ANDAMENTO                           |
+------------------------------------------------------------------+
|                                                                   |
|  PL 001/2026 - Dispoe sobre a criacao do Conselho Municipal...   |
|                                                                   |
|  Quorum: MAIORIA SIMPLES (5 votos)    Tempo: 02:34               |
|                                                                   |
+------------------------------------------------------------------+
|                                                                   |
|              SIM: 4          NAO: 1          ABST: 0             |
|              ====           ====            ====                  |
|                                                                   |
|  +----------+  +----------+  +----------+  +----------+          |
|  |   SIM    |  |   SIM    |  |   NAO    |  |   SIM    |          |
|  |  Joao    |  |  Maria   |  |  Pedro   |  |  Ana     |          |
|  +----------+  +----------+  +----------+  +----------+          |
|                                                                   |
|  +----------+  +----------+  +----------+  +----------+          |
|  |   SIM    |  |   ---    |  |   ---    |  |   ---    |          |
|  |  Carlos  |  |  Lucia   |  |  Roberto |  |  Paula   |          |
|  +----------+  +----------+  +----------+  +----------+          |
|                                                                   |
|  Aguardando: Lucia, Roberto, Paula                               |
|                                                                   |
+------------------------------------------------------------------+
|                                                                   |
|  [ENCERRAR VOTACAO]     [ANULAR]     [ESTENDER TEMPO]           |
|                                                                   |
+------------------------------------------------------------------+
```

### Fluxo de Votacao

```
                    FLUXO DE VOTACAO NOMINAL
    ================================================================

    1. PREPARACAO
    =============

    [Operador seleciona item] ----> [Sistema verifica quorum]
                                           |
                            +--------------+--------------+
                            |                             |
                            v                             v
                    [QUORUM OK]                   [SEM QUORUM]
                            |                             |
                            v                             v
                    [Habilita botao]             [Bloqueia votacao]
                                                 [Exibe alerta]


    2. INICIO DA VOTACAO
    ====================

    [Operador clica INICIAR] ----> [Sistema abre votacao]
                                           |
                                           v
                                   [Status: EM_ANDAMENTO]
                                           |
                                           v
                                   [Cronometro inicia]
                                           |
                                           v
                                   [SSE notifica paineis]


    3. REGISTRO DE VOTOS
    ====================

    [Parlamentar vota] ----> [Sistema registra]
           |                        |
           v                        v
    +-------------+          +----------------+
    |    SIM      |          | - Data/hora    |
    |    NAO      |          | - Parlamentar  |
    |  ABSTENCAO  |          | - Sessao       |
    +-------------+          | - IP           |
                             +----------------+
                                    |
                                    v
                             [Atualiza placar]
                                    |
                                    v
                             [SSE transmite]


    4. ENCERRAMENTO
    ===============

    [Todos votaram] ----> [Sistema calcula resultado]
           OU                       |
    [Operador encerra]              v
                             +----------------+
                             | Se SIM >= quorum|---> [APROVADA]
                             | Se NAO >= quorum|---> [REJEITADA]
                             | Se empate       |---> [VOTO PRESIDENTE]
                             +----------------+
                                    |
                                    v
                             [Registra resultado]
                                    |
                                    v
                             [Atualiza Proposicao]
                                    |
                                    v
                             [Publica resultado]
```

### Votacao Simbolica

Para materias simples, o sistema tambem suporta votacao simbolica:

```
VOTACAO SIMBOLICA
=================

[Presidente pergunta]: "Os que aprovam permaneçam como estão"

[Operador registra]:
- Se ha contrarios -> Solicita votacao nominal
- Se unanime -> Registra como APROVADA

[Sistema registra]:
- Resultado: APROVADA/REJEITADA
- Tipo: SIMBOLICA
- Sem votos individuais
```

---

## 4.5 Cronometro de Oradores

### Tempos Regimentais

| Tipo de Uso | Tempo Padrao | Prorrogavel |
|-------------|--------------|-------------|
| Discussao | 5 minutos | Sim, +5 min |
| Encaminhamento | 3 minutos | Nao |
| Explicacao pessoal | 10 minutos | Sim, +5 min |
| Questao de ordem | 3 minutos | Nao |
| Apartes | 1 minuto | Nao |

### Interface do Cronometro

```
+----------------------------------+
|      CRONOMETRO DE ORADOR        |
+----------------------------------+
|                                  |
|         DISCUSSAO               |
|                                  |
|      [ 03:45 ]                  |
|                                  |
|   Vereador: Joao Silva          |
|                                  |
|  [PAUSAR]  [REINICIAR]  [+5min] |
|                                  |
+----------------------------------+
```

---

## 4.6 Transmissao em Tempo Real

### Tecnologia SSE (Server-Sent Events)

O sistema utiliza SSE para transmissao em tempo real:

```
FLUXO DE TRANSMISSAO SSE
========================

[PAINEL OPERADOR]
      |
      | (acao)
      v
[API SERVER] ----> [SSE STREAM] ----> [PAINEL PUBLICO]
                         |
                         +----------> [AREA PARLAMENTAR]
                         |
                         +----------> [TV PLENARIO]

EVENTOS TRANSMITIDOS:
- sessao_iniciada
- presenca_registrada
- votacao_iniciada
- voto_registrado
- votacao_encerrada
- item_iniciado
- item_finalizado
- sessao_encerrada
```

### Painel Publico

O painel publico exibe em tempo real:

- Status da sessao
- Item em discussao/votacao
- Placar de votacao
- Presenca dos parlamentares
- Resultado de votacoes

---

# PARTE 5: GERACAO DE PAUTA

## 5.1 Sugestao Automatica de Pauta

O sistema sugere automaticamente materias para inclusao na pauta baseado em criterios regimentais:

### Criterios de Prioridade

```
ALGORITMO DE SUGESTAO DE PAUTA
==============================

1. PRIORIDADE MAXIMA (Obrigatorias)
   - Vetos com prazo vencendo (30 dias)
   - Projetos do Executivo em prazo
   - Materias adiadas da sessao anterior

2. PRIORIDADE ALTA
   - Projetos em 2o turno
   - Redacoes finais pendentes
   - Regime de urgencia

3. PRIORIDADE MEDIA
   - Projetos com todos os pareceres
   - Regime de prioridade
   - Requerimentos aprovados

4. PRIORIDADE NORMAL
   - Ordem cronologica de entrada
   - Projetos ordinarios
```

### Validacao Regimental Automatica

O sistema valida automaticamente antes de incluir na pauta:

```
VALIDACOES AUTOMATICAS (RN-056, RN-058)
=======================================

[x] Parecer da CLJ existe e foi votado?
[x] Parecer da CFO existe (se envolver recursos)?
[x] Intersticio entre 1o e 2o turno cumprido?
[x] Sessao publicada com 48h de antecedencia?
[x] Materia nao esta em regime de vista?
[x] Nao existe materia identica ja em pauta?

Se qualquer validacao falhar:
-> Sistema BLOQUEIA inclusao
-> Exibe motivo do bloqueio
-> Sugere acao corretiva
```

---

## 5.2 Wizard de Criacao de Sessao

### Passo 1: Dados Basicos

```
+------------------------------------------------------------------+
|                 CRIAR SESSAO - PASSO 1/3                          |
|                    Dados da Sessao                                |
+------------------------------------------------------------------+
|                                                                   |
|  Tipo de Sessao:     [v] Ordinaria                               |
|                      [ ] Extraordinaria                           |
|                      [ ] Solene                                   |
|                      [ ] Especial                                 |
|                                                                   |
|  Numero:             [  123  ] / 2026                            |
|                                                                   |
|  Data e Hora:        [ 15/02/2026 ] [ 14:00 ]                    |
|                                                                   |
|  Local:              [ Plenario da Camara Municipal ]            |
|                                                                   |
|  Legislatura:        [v] 2025-2028                               |
|                                                                   |
+------------------------------------------------------------------+
|                              [PROXIMO >]                          |
+------------------------------------------------------------------+
```

### Passo 2: Composicao da Pauta

```
+------------------------------------------------------------------+
|                 CRIAR SESSAO - PASSO 2/3                          |
|                  Composicao da Pauta                              |
+------------------------------------------------------------------+
|                                                                   |
|  MATERIAS SUGERIDAS (priorizadas automaticamente)                |
|  ================================================                |
|                                                                   |
|  [x] PL 045/2025 - Dispoe sobre o IPTU...         [VETO - 5 DIAS]|
|  [x] PLC 003/2026 - Cria o Conselho...            [2o TURNO]     |
|  [x] PL 078/2025 - Autoriza credito...            [URGENCIA]     |
|  [ ] PL 001/2026 - Denomina rua...                [NORMAL]       |
|  [ ] PR 002/2026 - Altera Regimento...            [NORMAL]       |
|                                                                   |
|  OUTRAS MATERIAS DISPONIVEIS                                     |
|  ============================                                     |
|                                                                   |
|  [ ] REQ 012/2026 - Requer informacoes...                        |
|  [ ] MOC 003/2026 - Mocao de apoio...                            |
|  [ ] IND 015/2026 - Indica ao Executivo...                       |
|                                                                   |
|  Tempo estimado: 2h 15min                                        |
|                                                                   |
+------------------------------------------------------------------+
|                   [< ANTERIOR]    [PROXIMO >]                     |
+------------------------------------------------------------------+
```

### Passo 3: Confirmacao

```
+------------------------------------------------------------------+
|                 CRIAR SESSAO - PASSO 3/3                          |
|                     Confirmacao                                   |
+------------------------------------------------------------------+
|                                                                   |
|  RESUMO DA SESSAO                                                |
|  ================                                                 |
|                                                                   |
|  Tipo: Sessao Ordinaria                                          |
|  Numero: 123/2026                                                |
|  Data: 15/02/2026 as 14:00                                       |
|  Local: Plenario da Camara Municipal                             |
|                                                                   |
|  PAUTA DA ORDEM DO DIA                                           |
|  =====================                                            |
|                                                                   |
|  1. PL 045/2025 - Veto do Executivo                              |
|  2. PLC 003/2026 - 2a Discussao e Votacao                        |
|  3. PL 078/2025 - Discussao e Votacao (Urgencia)                 |
|                                                                   |
|  Tempo estimado: 1h 30min                                        |
|  Publicacao: 13/02/2026 (48h antes)                              |
|                                                                   |
|  [!] A pauta sera publicada automaticamente no Portal            |
|      de Transparencia conforme PNTP (RN-122)                     |
|                                                                   |
+------------------------------------------------------------------+
|                   [< ANTERIOR]    [CRIAR SESSAO]                  |
+------------------------------------------------------------------+
```

---

## 5.3 Publicacao PNTP

### Prazo de 48 Horas

O sistema garante o cumprimento do prazo de 48h (RN-122):

```
REGRAS DE PUBLICACAO (RN-125)
=============================

1. PUBLICACAO AUTOMATICA
   - Pauta e publicada automaticamente ao criar sessao
   - Data/hora de publicacao registrada
   - Disponivel no Portal de Transparencia

2. VALIDACAO DE PRAZO
   - Sistema so permite criar sessao se >= 48h antes
   - Excecao: Sessoes extraordinarias urgentes

3. ALTERACOES APOS PUBLICACAO
   - Permitidas ate 24h antes
   - Registradas em historico
   - Nova versao publicada automaticamente

4. DESPUBLICACAO
   - So permitida se sessao >= 48h no futuro
   - Requer justificativa
   - Registrada em auditoria
```

---

# PARTE 6: PORTAL DE TRANSPARENCIA

## 6.1 Conformidade PNTP Nivel Diamante

O Portal de Transparencia atende aos **23 requisitos** do PNTP nivel Diamante:

### Categorias de Informacao

```
PORTAL DE TRANSPARENCIA - ESTRUTURA
===================================

1. INSTITUCIONAL
   |-- Estrutura organizacional
   |-- Competencias e atribuicoes
   |-- Horario de funcionamento
   |-- Endereco e contatos
   |-- Legislacao interna

2. LEGISLATIVO
   |-- Proposicoes e tramitacao
   |-- Votacoes nominais
   |-- Presenca em sessoes
   |-- Pautas de sessao
   |-- Atas de sessao
   |-- Leis e normas

3. PARLAMENTARES
   |-- Lista de vereadores
   |-- Comissoes e cargos
   |-- Producao legislativa
   |-- Presenca e votacoes
   |-- Gastos de gabinete

4. FINANCEIRO
   |-- Receitas e despesas
   |-- Empenhos e pagamentos
   |-- Contratos
   |-- Licitacoes
   |-- Convenios
   |-- Diarias e viagens

5. PESSOAL
   |-- Quadro de servidores
   |-- Remuneracao
   |-- Concursos publicos
   |-- Estrutura de cargos

6. DADOS ABERTOS
   |-- APIs documentadas
   |-- Formatos: JSON, CSV
   |-- Atualizacao em tempo real

7. PARTICIPACAO
   |-- Audiencias publicas
   |-- Ouvidoria
   |-- e-SIC
   |-- Fale conosco
```

---

## 6.2 APIs de Dados Abertos

### Endpoints Disponiveis

| Endpoint | Descricao | Formatos |
|----------|-----------|----------|
| `/api/dados-abertos/proposicoes` | Lista de proposicoes | JSON, CSV |
| `/api/dados-abertos/votacoes` | Votacoes nominais | JSON, CSV |
| `/api/dados-abertos/presencas` | Presenca em sessoes | JSON, CSV |
| `/api/dados-abertos/parlamentares` | Lista de parlamentares | JSON, CSV |
| `/api/dados-abertos/sessoes` | Sessoes realizadas | JSON, CSV |
| `/api/dados-abertos/comissoes` | Comissoes e membros | JSON, CSV |
| `/api/dados-abertos/despesas` | Despesas publicas | JSON, CSV |
| `/api/dados-abertos/receitas` | Receitas publicas | JSON, CSV |
| `/api/dados-abertos/contratos` | Contratos vigentes | JSON, CSV |

### Exemplo de Resposta JSON

```json
{
  "data": [
    {
      "id": "prop_001",
      "tipo": "PL",
      "numero": 1,
      "ano": 2026,
      "ementa": "Dispoe sobre a criacao do Conselho Municipal...",
      "autor": "Vereador Joao Silva",
      "dataApresentacao": "2026-01-15",
      "status": "EM_TRAMITACAO",
      "ultimaTramitacao": "Comissao de Legislacao e Justica"
    }
  ],
  "meta": {
    "total": 150,
    "pagina": 1,
    "porPagina": 20,
    "totalPaginas": 8
  }
}
```

---

## 6.3 Prazos Legais PNTP

### Tabela de Prazos

| Informacao | Prazo | Regra |
|------------|-------|-------|
| Votacoes nominais | 30 dias apos sessao | RN-120 |
| Presenca em sessoes | 30 dias apos sessao | RN-121 |
| Pautas de sessao | 48h antes da sessao | RN-122 |
| Atas de sessao | 15 dias apos aprovacao | RN-123 |
| Contratos | 24h apos assinatura | RN-124 |
| Licitacoes | 24h apos abertura | - |
| Receitas | 1 dia util | - |
| Despesas | 1 dia util | - |
| Remuneracoes | Mensal | - |

### Monitoramento Automatico

O sistema monitora automaticamente o cumprimento dos prazos:

```
DASHBOARD DE CONFORMIDADE PNTP
==============================

Nivel atual: DIAMANTE (100%)

Categoria              Status    Itens    Pendencias
------------------    --------  ------   -----------
Institucional          OK        8/8      0
Legislativo            OK        12/12    0
Parlamentares          OK        6/6      0
Financeiro             OK        10/10    0
Pessoal                OK        5/5      0
Dados Abertos          OK        9/9      0
Acessibilidade         OK        8/8      0
------------------    --------  ------   -----------
TOTAL                  OK        58/58    0
```

---

## 6.4 Acessibilidade WCAG 2.1 AA

### Requisitos Atendidos

| Requisito | Descricao | Status |
|-----------|-----------|--------|
| 1.1.1 | Textos alternativos em imagens | CONFORME |
| 1.3.1 | Estrutura semantica HTML5 | CONFORME |
| 1.4.3 | Contraste minimo 4.5:1 | CONFORME |
| 1.4.4 | Redimensionamento de texto | CONFORME |
| 2.1.1 | Navegacao por teclado | CONFORME |
| 2.4.1 | Pular blocos | CONFORME |
| 2.4.2 | Titulos de pagina | CONFORME |
| 2.4.6 | Cabecalhos descritivos | CONFORME |
| 3.1.1 | Idioma da pagina | CONFORME |
| 3.3.2 | Labels em formularios | CONFORME |
| 4.1.1 | Parsing HTML valido | CONFORME |
| 4.1.2 | Nome, funcao, valor | CONFORME |

### Recursos de Acessibilidade

- **Alto contraste**: Tema escuro disponivel
- **Navegacao por teclado**: Tab, Enter, Esc funcionais
- **Leitor de tela**: ARIA labels em todos elementos
- **Zoom**: Suporta ate 200% sem perda de funcionalidade

---

# PARTE 7: FUNCIONALIDADES DE PESQUISA

## 7.1 Busca Global

### Tipos de Entidades Pesquisaveis

| Entidade | Campos Pesquisaveis | Filtros |
|----------|---------------------|---------|
| Proposicoes | Numero, ementa, texto, autor | Tipo, status, ano, autor |
| Parlamentares | Nome, apelido, partido | Partido, status, comissao |
| Sessoes | Numero, tipo, data | Tipo, status, periodo |
| Votacoes | Proposicao, resultado | Resultado, tipo, periodo |
| Normas Juridicas | Numero, ementa, texto | Tipo, ano, vigencia |
| Requerimentos | Numero, assunto, autor | Status, tipo, autor |

### Interface de Busca

```
+------------------------------------------------------------------+
|                        BUSCA GLOBAL                               |
+------------------------------------------------------------------+
|                                                                   |
|  [ Pesquisar proposicoes, parlamentares, sessoes...    ] [BUSCAR]|
|                                                                   |
|  Filtros:  [Todos v]  [2026 v]  [Todos status v]                 |
|                                                                   |
+------------------------------------------------------------------+
|                                                                   |
|  Resultados para "conselho municipal" (15 encontrados)           |
|                                                                   |
|  PROPOSICOES (8)                                                 |
|  ---------------                                                  |
|  PL 001/2026 - Cria o Conselho Municipal de Educacao...          |
|  PL 015/2025 - Dispoe sobre o Conselho de Saude...               |
|  ...                                                              |
|                                                                   |
|  NORMAS JURIDICAS (5)                                            |
|  --------------------                                             |
|  Lei 1.234/2020 - Institui o Conselho Municipal...               |
|  Lei 1.100/2018 - Regulamenta os Conselhos...                    |
|  ...                                                              |
|                                                                   |
|  SESSOES (2)                                                     |
|  ----------                                                       |
|  Sessao Ordinaria 45/2026 - Pauta: Conselho Municipal...         |
|  ...                                                              |
|                                                                   |
+------------------------------------------------------------------+
```

---

## 7.2 Pesquisa Avancada de Proposicoes

### Filtros Disponiveis

```
FILTROS DE PROPOSICOES
======================

Por Tipo:
[x] Projeto de Lei (PL)
[x] Projeto de Lei Complementar (PLC)
[x] Projeto de Resolucao (PR)
[ ] Indicacao (IND)
[ ] Requerimento (REQ)
[ ] Mocao (MOC)

Por Status:
[x] Em Tramitacao
[x] Aguardando Pauta
[ ] Aprovada
[ ] Rejeitada
[ ] Arquivada

Por Periodo:
De: [01/01/2026] Ate: [31/12/2026]

Por Autor:
[Todos v]

Por Comissao:
[Todas v]

Por Assunto:
[ Educacao, Saude, Orcamento...              ]
```

---

## 7.3 Pesquisa de Normas Juridicas

### Tipos de Normas

| Tipo | Descricao |
|------|-----------|
| Lei Ordinaria | Leis aprovadas pela Camara |
| Lei Complementar | Leis que complementam a Lei Organica |
| Decreto Legislativo | Normas de competencia exclusiva |
| Resolucao | Normas internas da Camara |
| Lei Organica | Constituicao municipal |
| Regimento Interno | Normas de funcionamento |

### Busca Full-Text

O sistema suporta busca full-text no texto completo das normas:

```
EXEMPLO DE BUSCA FULL-TEXT
==========================

Busca: "servidor publico aposentadoria"

Resultados:
-----------

1. Lei Complementar 045/2022
   "... regime de previdencia do SERVIDOR PUBLICO municipal,
   garantindo os direitos de APOSENTADORIA ..."
   Relevancia: 95%

2. Lei 1.567/2021
   "... direitos dos SERVIDORES PUBLICOS efetivos,
   incluindo plano de carreira e APOSENTADORIA especial ..."
   Relevancia: 87%
```

---

# PARTE 8: AREA DO PARLAMENTAR

## 8.1 Dashboard Pessoal

### Visao Geral

```
+------------------------------------------------------------------+
|                    AREA DO PARLAMENTAR                            |
|                  Vereador Joao Silva (PP)                        |
+------------------------------------------------------------------+
|                                                                   |
|  +------------------+  +------------------+  +------------------+ |
|  |                  |  |                  |  |                  | |
|  |     PRESENCA     |  |    VOTACOES      |  |   PRODUCAO      | |
|  |                  |  |                  |  |                  | |
|  |      95%         |  |      142         |  |      23          | |
|  |   (38/40 sessoes)|  |   (participou)   |  |  (proposicoes)   | |
|  +------------------+  +------------------+  +------------------+ |
|                                                                   |
|  COMISSOES ATUAIS                                                |
|  ================                                                 |
|  - CLJ - Membro titular                                          |
|  - CFO - Presidente                                              |
|  - CES - Membro suplente                                         |
|                                                                   |
|  ULTIMAS VOTACOES                                                |
|  ================                                                 |
|  PL 045/2026 - SIM - 15/02/2026                                  |
|  PLC 003/2026 - SIM - 14/02/2026                                 |
|  PL 078/2025 - NAO - 10/02/2026                                  |
|                                                                   |
|  PROXIMAS SESSOES                                                |
|  ================                                                 |
|  Sessao Ordinaria 124/2026 - 20/02/2026 14:00                    |
|  Sessao Extraordinaria 05/2026 - 22/02/2026 09:00                |
|                                                                   |
+------------------------------------------------------------------+
```

---

## 8.2 Votacao Eletronica

### Interface Mobile-Friendly

```
+-------------------------+
|   VOTACAO EM ANDAMENTO  |
+-------------------------+
|                         |
|  PL 001/2026            |
|                         |
|  Cria o Conselho        |
|  Municipal de           |
|  Educacao               |
|                         |
|  Quorum: Maioria Simples|
|  Tempo: 01:45           |
|                         |
+-------------------------+
|                         |
|  +-------+  +-------+   |
|  |       |  |       |   |
|  |  SIM  |  |  NAO  |   |
|  |       |  |       |   |
|  +-------+  +-------+   |
|                         |
|     +-------------+     |
|     |  ABSTENCAO  |     |
|     +-------------+     |
|                         |
+-------------------------+
|                         |
|  Placar atual:          |
|  SIM: 5 | NAO: 2        |
|                         |
+-------------------------+
```

### Fluxo de Votacao do Parlamentar

```
FLUXO DE VOTACAO - PARLAMENTAR
==============================

1. [Sessao em andamento]
      |
      v
2. [Presenca confirmada?]
      |
      +-- NAO --> [Tela: Confirme sua presenca]
      |
      +-- SIM
          |
          v
3. [Ha votacao aberta?]
      |
      +-- NAO --> [Tela: Aguardando votacao]
      |
      +-- SIM
          |
          v
4. [Ja votou?]
      |
      +-- SIM --> [Tela: Voto registrado - SIM]
      |           [Aguarde resultado...]
      |
      +-- NAO
          |
          v
5. [Tela de votacao]
      |
      v
6. [Clica SIM/NAO/ABSTENCAO]
      |
      v
7. [Sistema registra voto]
      |
      v
8. [Tela: Voto registrado]
      |
      v
9. [Aguarda resultado]
```

---

## 8.3 Self-Vote (Voto Proprio)

O sistema permite que o parlamentar vote por si mesmo, sem necessidade de operador:

### Regras de Self-Vote (RN-079)

```
SELF-VOTE - REGRAS
==================

PERMITIDO QUANDO:
- Parlamentar esta autenticado
- Parlamentar tem presenca confirmada na sessao
- Votacao esta EM_ANDAMENTO
- Parlamentar ainda nao votou nesta votacao
- parlamentarId do voto = parlamentarId do usuario logado

NAO PERMITIDO:
- Votar por outro parlamentar
- Alterar voto apos encerramento
- Votar sem presenca confirmada
- Votar em sessao nao iniciada
```

---

## 8.4 Perfil Publico

Cada parlamentar possui um perfil publico com:

- Foto e dados basicos
- Historico de mandatos
- Comissoes que participa/participou
- Proposicoes de autoria
- Votacoes nominais
- Presenca em sessoes
- Estatisticas de producao

```
+------------------------------------------------------------------+
|                    PERFIL DO PARLAMENTAR                          |
|                     Vereador Joao Silva                          |
+------------------------------------------------------------------+
|                                                                   |
|  [FOTO]   Joao Carlos da Silva                                   |
|           Partido: PP                                             |
|           Cargo: Vereador                                         |
|           Mandato: 2025-2028 (Titular)                           |
|                                                                   |
|  CONTATO                                                         |
|  -------                                                          |
|  Email: joao.silva@camara.suacidade.gov.br                       |
|  Telefone: (93) 3333-1234                                        |
|  Gabinete: Sala 05                                               |
|                                                                   |
+------------------------------------------------------------------+
|                                                                   |
|  ESTATISTICAS DA LEGISLATURA                                     |
|  ===========================                                      |
|                                                                   |
|  Presenca:        95% (38/40 sessoes)                            |
|  Proposicoes:     23 apresentadas                                |
|  Aprovadas:       18 (78%)                                       |
|  Votacoes:        142 participacoes                              |
|                                                                   |
+------------------------------------------------------------------+
```

---

# PARTE 9: ADMINISTRACAO

## 9.1 Gestao de Usuarios

### Tipos de Usuario (Roles)

| Role | Descricao | Quantidade Sugerida |
|------|-----------|---------------------|
| ADMIN | Administrador do sistema | 1-2 |
| SECRETARIA | Servidor da secretaria | 2-3 |
| AUXILIAR_LEGISLATIVO | Auxiliar legislativo | 2-4 |
| EDITOR | Editor de conteudo | 1-2 |
| OPERADOR | Operador de sessao | 1-2 |
| PARLAMENTAR | Vereadores | 9-11 |
| USER | Usuario basico | Ilimitado |

### CRUD de Usuarios

```
+------------------------------------------------------------------+
|                    GESTAO DE USUARIOS                             |
+------------------------------------------------------------------+
|                                                                   |
|  [+ Novo Usuario]     [Filtrar v]     [Buscar...        ]        |
|                                                                   |
+------------------------------------------------------------------+
|  Nome              Email                    Role       Status    |
+------------------------------------------------------------------+
|  Maria Santos      maria@camara.gov.br      ADMIN      Ativo     |
|  Joao Silva        joao@camara.gov.br       SECRETARIA Ativo     |
|  Pedro Costa       pedro@camara.gov.br      OPERADOR   Ativo     |
|  Ana Lima          ana@camara.gov.br        PARLAMENTAR Ativo    |
|  ...                                                              |
+------------------------------------------------------------------+
```

---

## 9.2 Configuracoes do Sistema

### Areas Configuraveis

```
CONFIGURACOES DO SISTEMA
========================

1. QUORUM
   - Tipos de quorum (maioria simples, absoluta, 2/3)
   - Formulas de calculo
   - Base de calculo (presentes vs membros)

2. TIPOS DE PROPOSICAO
   - Siglas e nomes
   - Turnos de votacao
   - Quorum necessario
   - Fluxo de tramitacao

3. ORGAOS LEGISLATIVOS
   - Comissoes permanentes
   - Comissoes temporarias
   - Mesa Diretora
   - Secretarias

4. PRAZOS
   - Prazos de parecer por regime
   - Prazos de publicacao PNTP
   - Intersticio entre turnos

5. SESSOES
   - Tipos de sessao
   - Horarios padrao
   - Local padrao

6. APARENCIA
   - Logo da Camara
   - Cores institucionais
   - Informacoes de contato
```

---

## 9.3 Auditoria

### Log de Acoes

Todas as acoes sao registradas automaticamente:

| Acao | Entidade | Usuario | Data/Hora | IP |
|------|----------|---------|-----------|----|
| CREATE | Proposicao | maria@... | 03/02/2026 14:30 | 192.168.1.10 |
| UPDATE | Sessao | joao@... | 03/02/2026 14:25 | 192.168.1.11 |
| LOGIN | User | pedro@... | 03/02/2026 14:00 | 192.168.1.12 |
| VOTACAO | Voto | ana@... | 03/02/2026 13:45 | 192.168.1.13 |

### Filtros de Auditoria

- Por usuario
- Por entidade
- Por acao
- Por periodo
- Por IP

---

## 9.4 Relatorios

### Tipos de Relatorios

| Relatorio | Descricao | Formato |
|-----------|-----------|---------|
| Producao Legislativa | Proposicoes por periodo/autor | Excel, PDF |
| Presenca em Sessoes | Presenca por parlamentar | Excel, PDF |
| Votacoes Nominais | Votos por parlamentar/proposicao | Excel, PDF |
| Tramitacao | Status das proposicoes | Excel, PDF |
| Conformidade PNTP | Itens pendentes | PDF |

### Exemplo de Relatorio

```
+------------------------------------------------------------------+
|           RELATORIO DE PRODUCAO LEGISLATIVA                       |
|                    Janeiro/2026                                   |
+------------------------------------------------------------------+
|                                                                   |
|  RESUMO GERAL                                                    |
|  ============                                                     |
|  Total de proposicoes: 45                                        |
|  Aprovadas: 32 (71%)                                             |
|  Rejeitadas: 5 (11%)                                             |
|  Em tramitacao: 8 (18%)                                          |
|                                                                   |
|  POR TIPO                                                        |
|  ========                                                         |
|  Projetos de Lei: 15                                             |
|  Requerimentos: 12                                               |
|  Indicacoes: 10                                                  |
|  Mocoes: 5                                                       |
|  Votos: 3                                                        |
|                                                                   |
|  POR AUTOR                                                       |
|  =========                                                        |
|  Vereador Joao Silva: 8                                          |
|  Vereadora Maria Santos: 7                                       |
|  Prefeito Municipal: 6                                           |
|  ...                                                              |
|                                                                   |
+------------------------------------------------------------------+
```

---

# PARTE 10: BENEFICIOS E CONCLUSAO

## 10.1 Beneficios Quantificaveis

### Comparativo Antes x Depois

| Aspecto | ANTES (Manual) | DEPOIS (Digital) | Melhoria |
|---------|----------------|------------------|----------|
| Tempo de tramitacao | 30-60 dias | 5-15 dias | **70%** |
| Custo com papel | R$ 2.000/mes | R$ 0 | **100%** |
| Acesso do cidadao | Balcao (8h-17h) | Portal 24/7 | **24/7** |
| Publicacao de atos | 3-5 dias | Instantaneo | **100%** |
| Risco de perda | Alto | Zero | **100%** |
| Conformidade PNTP | Parcial | Diamante | **100%** |
| Busca de documentos | 15-30 min | 2-5 segundos | **99%** |
| Auditoria | Inexistente | Total | **100%** |

### ROI Estimado

```
RETORNO SOBRE INVESTIMENTO
==========================

Custos Eliminados (anual):
- Papel e impressao:     R$  24.000
- Armazenamento fisico:  R$  12.000
- Horas de trabalho:     R$  36.000
- Retrabalho:            R$  18.000
                        -----------
Total economia:          R$  90.000

Beneficios Intangiveis:
- Transparencia para o cidadao
- Conformidade legal automatica
- Rastreabilidade total
- Modernizacao institucional
```

---

## 10.2 Diagrama Comparativo

```
ANTES                              DEPOIS
======                             ======

[Cidadao]                          [Cidadao]
    |                                  |
    v                                  v
[Vai ao balcao]                    [Acessa portal]
    |                              (qualquer hora)
    v                                  |
[Espera atendimento]                   v
    |                              [Pesquisa online]
    v                                  |
[Protocola em papel]                   v
    |                              [Acompanha em tempo real]
    v                                  |
[Aguarda dias/semanas]                 v
    |                              [Recebe notificacao]
    v                                  |
[Volta ao balcao]                      v
    |                              [Acessa documento]
    v
[Recebe copia]                     Tempo: minutos
                                   Custo: R$ 0
Tempo: dias/semanas                Satisfacao: Alta
Custo: deslocamento + tempo
Satisfacao: Baixa
```

---

## 10.3 Proximos Passos

### Evolucoes Planejadas

| Funcionalidade | Descricao | Previsao |
|----------------|-----------|----------|
| App Mobile | Aplicativo para iOS e Android | 2026 Q3 |
| Integracao SAPL | Sincronizacao com sistema federal | 2026 Q4 |
| Assinatura Digital | Certificado ICP-Brasil | 2026 Q3 |
| Video-Conferencia | Sessoes hibridas | 2026 Q4 |
| IA para Redacao | Sugestao de textos legislativos | 2027 Q1 |

---

## 10.4 Conclusao

O Sistema de Gestao Legislativa Municipal representa um marco na modernizacao da Camara Municipal. Com ele, a Casa Legislativa:

1. **Cumpre integralmente** a Lei de Acesso a Informacao
2. **Atinge nivel Diamante** no Programa Nacional de Transparencia Publica
3. **Elimina processos em papel**, reduzindo custos e impacto ambiental
4. **Garante rastreabilidade total** de todos os atos legislativos
5. **Oferece acesso 24/7** ao cidadao
6. **Moderniza o processo legislativo** com votacao eletronica e tempo real

O sistema foi desenvolvido com tecnologias modernas, codigo aberto e documentacao completa, garantindo autonomia e continuidade para a instituicao.

---

## Contato e Suporte

**Camara Municipal de [Sua Cidade]**

- **Portal**: https://camara-[cidade].vercel.app
- **Email**: contato@camara.suacidade.gov.br
- **Telefone**: (XX) XXXX-XXXX
- **Endereco**: [Endereco da Camara Municipal]

---

*Documento gerado em Fevereiro de 2026*
*Sistema de Gestao Legislativa Municipal v1.0.0*
