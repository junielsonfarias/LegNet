# Skill: Transparencia

## Visao Geral

O modulo de Transparencia implementa os requisitos do Programa Nacional de Transparencia Publica (PNTP) nivel Diamante. Gerencia a publicacao de dados obrigatorios, APIs de dados abertos, acessibilidade WCAG 2.1 AA e conformidade com a Lei de Acesso a Informacao (LAI).

A partir de 12/04/2026 o modulo foi expandido para cobrir 100% dos itens estruturados do portal CR2 (Bubble.io) e ficar pronto para receber backup do sistema antigo. Foram adicionados 10 novos models, sistema de periodos por categoria, 21 novas rotas API, 11 paginas admin com CRUD completo (create + edit + delete) e 12 paginas publicas.

---

## Atualizacoes 13/04/2026

### Despesas unificada no sistema de periodos
Removidos `subItens` hardcoded de `src/app/transparencia/page.tsx` (linhas ~105-115) que misturavam links CR2 ("Informacoes ate 2021/2023") com rota interna ("a partir de 2024"). Agora Despesas tem apenas `slug: 'despesas'`, identico a Receitas — quando o admin configurar periodos, eles aparecem; sem config, vai direto a `/transparencia/despesas`.

### Dados Abertos documentados em `/api-docs`
Adicionada secao "Dados Abertos (APIs Publicas)" em `src/app/api-docs/page.tsx` com os 10 endpoints publicos, formatos JSON/CSV, licenca CC-BY 4.0, conformidade LAI/PNTP. O indice em `src/app/api/dados-abertos/route.ts` tambem foi atualizado (estava listando apenas 7 dos 10 endpoints).

Endpoints:
1. `GET /api/dados-abertos` (indice)
2. `GET /api/dados-abertos/parlamentares`
3. `GET /api/dados-abertos/parlamentares/estatisticas`
4. `GET /api/dados-abertos/sessoes`
5. `GET /api/dados-abertos/proposicoes`
6. `GET /api/dados-abertos/votacoes`
7. `GET /api/dados-abertos/presencas`
8. `GET /api/dados-abertos/comissoes`
9. `GET /api/dados-abertos/publicacoes`
10. `GET /api/dados-abertos/estatisticas`

Todos suportam `?formato=csv|json`, sem autenticacao, licenca CC-BY 4.0.

### AudienciaPublica — modelo criado
Substitui o sistema mock anterior em `/admin/audiencias-publicas`. Migration: `prisma/migrations/20260413_add_audiencias_publicas/migration.sql`.

**Model AudienciaPublica:**
- Campos centrais: numero (unique, formato `AP-YYYY-NNNN`), titulo, descricao, tipo, status, dataHora, local, endereco, responsavel, FKs opcionais (parlamentarId, comissaoId, materiaLegislativaId), objetivo, publicoAlvo, observacoes
- Campos JSONB para estruturas ricas (evita explosao de tabelas): participantes, documentos, atas, transcricoes, links, transmissaoAoVivo, inscricoesPublicas, publicacaoPublica, cronograma
- Enums: `TipoAudienciaPublica` (ORDINARIA/EXTRAORDINARIA/ESPECIAL), `StatusAudienciaPublica` (AGENDADA/EM_ANDAMENTO/CONCLUIDA/CANCELADA/ADIADA)
- Indices: status, dataHora, tipo

**Rotas API:**
- `GET /api/admin/audiencias-publicas` — lista (admin, sessao.view)
- `POST /api/admin/audiencias-publicas` — cria (admin, sessao.manage), gera numero auto
- `GET /api/admin/audiencias-publicas/[id]` — detalhe (admin)
- `PUT /api/admin/audiencias-publicas/[id]` — edita (admin)
- `DELETE /api/admin/audiencias-publicas/[id]` — remove (admin)
- `GET /api/publico/audiencias-publicas` — publico, retorna lista + stats agregadas

Hook `src/app/admin/audiencias-publicas/hooks/useAudienciasAdmin.ts` agora chama o backend real (handleSubmit/handleDelete substituidos, antes eram TODO).

### Importer CR2 com anti-duplicacao
`scripts/import-cr2-backup.ts` reescrito com:
- Registry de chaves naturais por recurso (12 mapeamentos documentados)
- Helper `dedupeInBatch()` filtra duplicatas dentro do proprio JSON
- Helper `upsertByNaturalKey()` usa findFirst + update/create (funciona com e sem `@@unique`)
- Modo padrao SKIP, flag `--update-existing` para atualizar
- Idempotente: rodar 2x com mesmo arquivo nunca duplica

### Limpeza de paginas legado
Removidos: `/admin/dashboard` (duplicata de `/admin`) e `/admin/modulos` (mock com dados fake). Mantido `/admin/sessoes/**` (nao e legado, e detalhe individual de sessao referenciado por 15 arquivos).

### Pendente — AGUARDANDO BACKUP CR2
Ver memoria `project_pendente_cr2_backup.md`. Trigger para retomar: usuario dira `"ja estou com o backup do sistema antigo"`.

Itens travados ate o backup chegar:
- Lista de tipos de documentos do CR2 (vai expandir `TipoDocumentoTransparencia`)
- Campo `fonte` em `DocumentoTransparencia` (wordpress/google_drive/upload_local/cr2_import)
- Aba "Documentos publicados" nas paginas do portal (modelo hibrido aprovado)
- Validador URL Google Drive

---

## Adaptacao CR2 (12/04/2026)

### Novos Models Prisma

| Model | Proposito | Indices/Unique |
|-------|-----------|----------------|
| `DocumentoTransparencia` | Documentos institucionais (Balancete, Balanco Anual, Parecer TCM, Julgamento Contas, Planejamento Estrategico, Carta Servicos, LGPD, PAC, Relatorio Gestao). Discriminado por enum `TipoDocumentoTransparencia` (9 tipos). | `[tipo, ano]`, `dataPublicacao`, `status` |
| `NotaFiscal` | Notas fiscais emitidas/liquidadas/pagas. FK opcional para Despesa. | `chaveAcesso` unique, `[ano, mes]`, `fornecedor`, `situacao`, `despesaId` |
| `OrdemPagamento` | Ordem cronologica de pagamentos (LRF/Lei 8.666 art. 5). FK opcional para Despesa. | `[ano, mes]`, `credor`, `ordemCronologica` |
| `Veiculo` | Frota oficial. | `placa` unique, `chassi` unique, `situacao` |
| `Obra` | Obras publicas (planejadas, em andamento, paralisadas, concluidas, canceladas). FK opcional para Contrato. | `situacao` |
| `Repasse` | Recursos recebidos de outras esferas (Uniao, Estado). | `[ano, mes]`, `orgaoOrigem` |
| `CartaoCorporativo` | Gastos com cartao de credito corporativo. | `[ano, mes]`, `portador` |
| `ProgramaAcao` | Programas e acoes orcamentarias. Tipo enum (PROGRAMA / ACAO). | `[codigo, ano]` unique, `[tipo, ano]` |
| `ServicoOnline` | Carta de servicos digitais com URL e categoria. | `[categoria, ativo]`, `ordem` |
| `FornecedorSancionado` | Empresas/pessoas com sancoes administrativas (5 tipos). | `cnpjCpf`, `[tipoSancao, ativo]`, `dataInicio` |

### Novos Enums

- `TipoDocumentoTransparencia` (9): BALANCETE_FINANCEIRO, BALANCO_ANUAL, PARECER_TCM, JULGAMENTO_CONTAS_EXECUTIVO, PLANEJAMENTO_ESTRATEGICO, CARTA_SERVICOS, LGPD_GOVERNO_DIGITAL, PLANO_ANUAL_CONTRATACOES, RELATORIO_GESTAO
- `SituacaoVeiculo` (5): ATIVO, INATIVO, ALIENADO, EM_MANUTENCAO, SINISTRADO
- `SituacaoObra` (5): PLANEJADA, EM_ANDAMENTO, PARALISADA, CONCLUIDA, CANCELADA
- `SituacaoNotaFiscal` (4): EMITIDA, LIQUIDADA, PAGA, CANCELADA
- `TipoProgramaAcao` (2): PROGRAMA, ACAO
- `TipoSancao` (5): ADVERTENCIA, MULTA, SUSPENSAO_TEMPORARIA, IMPEDIMENTO, DECLARACAO_INIDONEIDADE

Migrations SQL: `prisma/migrations/20260412_add_transparencia_models_cr2/` e `prisma/migrations/20260412_add_cr2_complementar_models/`. NUNCA aplicar via `prisma db push` em producao - usar `prisma migrate deploy` ou psql direto.

### Sistema de Periodos por Categoria

Novo recurso para categorias com dados em multiplos sistemas (ex: Despesas ate 2021 / ate 2023 / 2024+). Quando configurado, ao clicar na categoria o usuario ve uma tela de selecao com cards por periodo (cada um interno OU externo).

**Armazenamento**: tabela `Configuracao` com chave `transparencia.periodos.<slug>` (JSON serializado). Coexiste com o sistema legacy `transparencia.redirect.<slug>`.

**Estrutura**:
```typescript
interface ConfiguracaoPeriodos {
  enabled: boolean
  titulo?: string
  descricao?: string
  periodos: PeriodoTransparencia[]
}

interface PeriodoTransparencia {
  id: string             // ex: "ate-2021", "2024"
  label: string          // "Informacoes ate 2021"
  url?: string           // link externo
  hrefInterno?: string   // rota interna
  ano?: number | null
  ordem: number
  ativo: boolean
}
```

**Arquivos**:
- `src/lib/services/transparencia-redirect-service.ts` - funcoes `getPeriodos`, `setPeriodos`, `getAllPeriodos`, `removePeriodos`
- `src/app/api/transparencia/periodos/route.ts` - GET/POST/DELETE
- `src/lib/hooks/use-transparencia-periodos.ts` - hook client
- `src/components/transparencia/period-selector-screen.tsx` - tela de selecao
- `src/components/transparencia/transparencia-page-wrapper.tsx` - integracao (3 modos: redirect legacy, period selector, conteudo interno)
- `src/app/admin/configuracoes/transparencia-periodos/page.tsx` - admin

### Novas Paginas Publicas

| Rota | Recurso | Wrapper slug |
|------|---------|--------------|
| `/transparencia/notas-fiscais` | NotaFiscal | `notas-fiscais` |
| `/transparencia/ordem-pagamentos` | OrdemPagamento | `ordem-pagamentos` |
| `/transparencia/veiculos` | Veiculo | `veiculos` |
| `/transparencia/obras` | Obra (filtro `?situacao=PARALISADA`) | `obras` |
| `/transparencia/documentos/[tipo]` | DocumentoTransparencia (rota dinamica para 9 tipos) | `documentos-<tipo>` |
| `/transparencia/repasses` | Repasse | `repasses` |
| `/transparencia/cartoes-corporativos` | CartaoCorporativo | `cartao-credito` |
| `/transparencia/programas-acoes` | ProgramaAcao | `programas-acoes` |
| `/transparencia/servicos-online` | ServicoOnline | `servicos-online` |
| `/transparencia/fornecedores-sancionados` | FornecedorSancionado | `fornecedores-sancionados` |
| `/transparencia/pessoal/estagiarios` | Servidor (filtra `vinculo=ESTAGIARIO`) | `estagiarios` |
| `/transparencia/pessoal/terceirizados` | Servidor (filtra `vinculo=TERCEIRIZADO`) | `terceirizados` |

Todas envolvidas em `<TransparenciaPageWrapper>` para suportar tela de periodos.

### Novas Paginas Admin (CRUD completo)

11 paginas em `/admin/transparencia/<recurso>/page.tsx` com **create + edit + delete inline**:
- notas-fiscais, ordem-pagamentos, veiculos, obras, documentos
- repasses, cartoes-corporativos, programas-acoes, servicos-online, fornecedores-sancionados

Padrao: lista + form inline com `editingId` state. Helper `closeForm()` reseta. `handleEdit(item)` carrega dados e seta editingId. `handleSave()` faz POST ou PUT conforme `editingId`.

Permissions: `transparencia.manage`.

### Novas APIs CRUD (21 rotas)

| Recurso | Endpoint base |
|---------|---------------|
| Periodos | `/api/transparencia/periodos` (GET/POST/DELETE) |
| Documentos Transparencia | `/api/documentos-transparencia` + `/[id]` |
| Notas Fiscais | `/api/notas-fiscais` + `/[id]` |
| Ordem Pagamentos | `/api/ordem-pagamentos` + `/[id]` |
| Veiculos | `/api/veiculos` + `/[id]` |
| Obras | `/api/obras` + `/[id]` |
| Repasses | `/api/repasses` + `/[id]` |
| Cartoes Corporativos | `/api/cartoes-corporativos` + `/[id]` |
| Programas e Acoes | `/api/programas-acoes` + `/[id]` |
| Servicos Online | `/api/servicos-online` + `/[id]` |
| Fornecedores Sancionados | `/api/fornecedores-sancionados` + `/[id]` |

Padrao: Zod validation, `withErrorHandler`/`withAuth`, prisma direto (sem service layer separado), params async (`Promise<{id:string}>`), permissions `transparencia.manage` em mutacoes.

### Sidebar Admin

`src/components/admin/admin-sidebar.tsx`: categoria **Transparencia** com 18 itens (era 8 → +10), categoria **Configuracoes** com +3 entradas (Transparencia - Links, Periodos, Conteudo).

### Hub `/transparencia/page.tsx`

Estrutura completa do portal CR2 espelhada em 9 secoes (52 itens). 14 itens migrados de `externalUrl: CR2_BASE` para rotas internas. Apenas itens institucionais (Legislaturas, Comissoes, Agenda Externa, Documentos Administrativos, Legislacao Tributaria) ainda apontam para CR2 ate serem migrados.

### Importer CR2

`scripts/import-cr2-backup.ts` - esqueleto CLI com `--dry-run` e `--only=despesas,obras`. Mapeamentos `mapXxx()` ficam como TODO ate o formato real do backup ser confirmado.

---

## Arquivos Principais

| Arquivo | Funcao |
|---------|--------|
| `src/app/transparencia/page.tsx` | Portal principal |
| `src/app/transparencia/conformidade/page.tsx` | Dashboard PNTP publico |
| `src/app/transparencia/pessoal/` | Secao pessoal (quadro, remuneracao, diarias, concursos) |
| `src/app/transparencia/parlamentar/` | Secao parlamentar (relatorios, presencas, producao, verbas) |
| `src/app/transparencia/institucional/organograma/` | Organograma interativo |
| `src/app/transparencia/legislativo/` | Votacoes nominais, presencas, atas |
| `src/app/transparencia/[categoria]/` | Paginas por categoria |
| `src/lib/services/transparencia-service.ts` | Verificacao PNTP |
| `src/lib/transparencia-dados-service.ts` | Service de dados (Prisma - reescrito 27/03) |
| `src/lib/services/esic-service.ts` | Service e-SIC (LAI) |
| `src/lib/services/ouvidoria-service.ts` | Service Ouvidoria |
| `src/lib/services/diarias-service.ts` | Service diarias |
| `src/lib/services/verbas-indenizatorias-service.ts` | Service verbas indenizatorias |
| `src/lib/services/concursos-service.ts` | Service concursos publicos |
| `src/lib/services/organograma-service.ts` | Service organograma |
| `src/lib/services/conteudo-educativo-service.ts` | Service conteudo educativo |
| `src/lib/services/relatorio-parlamentar-service.ts` | Service relatorio parlamentar |
| `src/app/api/e-sic/` | APIs e-SIC (5 rotas) |
| `src/app/api/ouvidoria/` | APIs Ouvidoria (4 rotas) |
| `src/app/api/diarias/` | APIs diarias (2 rotas) |
| `src/app/api/verbas-indenizatorias/` | APIs verbas (2 rotas) |
| `src/app/api/concursos/` | APIs concursos (2 rotas) |
| `src/app/api/organograma/` | APIs organograma (2 rotas) |
| `src/app/api/conteudos-educativos/` | APIs conteudo educativo (2 rotas) |
| `src/app/api/admin/conformidade-pntp/route.ts` | API admin verificacao conformidade PNTP (8 itens, score, nivel) |
| `src/app/api/publico/conformidade/` | API conformidade PNTP publica |
| `src/app/api/publico/relatorio-parlamentar/` | API relatorio parlamentar |
| `src/app/api/dados-abertos/` | APIs de dados abertos |
| `src/app/api/publico/` | APIs publicas |
| `src/components/transparencia/` | Componentes do portal |
| `src/components/transparencia/data-export-button.tsx` | Exportacao CSV/JSON |

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
      fonte: 'Camara Municipal',
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
          fonte: 'Camara Municipal',
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
