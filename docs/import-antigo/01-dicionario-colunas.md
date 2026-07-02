# FASE 0 — Dicionário de Colunas e Mapeamento (Import Dados Antigos)

> **Data**: 2026-06-30 · **Status**: Fase 0 (preparação, sem gravar no banco)
> Complementa `docs/PLANO-IMPORTACAO-DADOS-ANTIGOS.md`.
> Fonte primária: CSVs do Portal CR2 (Bubble). Fonte secundária: dump WordPress.

---

## 0. Decisões de infraestrutura confirmadas na Fase 0

### 0.1 Storage de arquivos (investigado no código)

- O sistema **NÃO usa Supabase Storage** para uploads. A rota canônica
  `src/app/api/upload/route.ts` grava no **filesystem local** em
  `public/uploads/<pasta>/<arquivo>` e devolve a URL `/uploads/<pasta>/<arquivo>`.
- `public/uploads/*` está no `.gitignore` (`!.gitkeep`).
- Allowlist de pastas em `src/lib/security/file-validation.ts`
  (`ALLOWED_UPLOAD_FOLDERS`): `proposicoes`, `normas`, `atas-sessoes`,
  `pautas-sessoes`, `parlamentares`, `licitacoes`, `contratos`, `documentos`,
  `noticias`, `comissoes`, `cotas-parlamentar`, etc.

**→ Estratégia de import**: gravar os PDFs/imagens migrados direto em
`public/uploads/<pasta>/` (mesmas pastas do allowlist) e persistir a URL
`/uploads/<pasta>/<arquivo>` nos campos do modelo. Sem infra extra; idêntico ao
comportamento de produção em VPS.

> ⚠️ A rota `/api/upload` limita 10 MB e só aceita JPEG/PNG/GIF/WebP/PDF. O
> import **não passa pela rota** (grava direto no FS), então o limite de 10 MB
> não se aplica — há PDFs > 10 MB no acervo. Validar magic bytes mesmo assim.

### 0.2 Inventário de arquivos (manifesto gerado)

- `arquivos site.zip` → `wp-content/uploads/`: **7.422 itens**
  (**2.030 PDFs** + ~4.888 imagens, a maioria thumbnails do WP).
- PDFs do CR2: hospedados no **CDN Bubble** (`*.cdn.bubble.io/...`), externos
  e acessíveis (HTTP 200) → baixar e re-hospedar localmente.
- Manifesto salvo em scratchpad: `fase0/uploads-manifest.tsv` (path + tamanho).

---

## 1. Regras de transformação globais

| Regra | Detalhe |
|-------|---------|
| **Encoding** | Dados em UTF-8 válido. Ler MySQL com `utf8mb4`; CSV é UTF-8. |
| **CSV parsing** | Usar parser que respeite aspas, vírgulas e **quebras de linha em células** (ex.: `csv-parse`). `wc -l` ≠ nº de registros. |
| **Datas Bubble** | Formato en-US `"Jan 28, 2025 1:24 pm"` / `"Dec 29, 2021 1:00 pm"`. Parsear com `date-fns` (`parse(v, 'MMM d, yyyy h:mm a', new Date(), { locale: enUS })`). Normalizar p/ UTC. |
| **Arquivos (campo `documento`/`DOCUMENTO`)** | URL `//host/...nome.pdf`. Normalizar `//`→`https://`, baixar, salvar em `public/uploads/<pasta>/`, gravar `/uploads/<pasta>/<arquivo>`. Multi-valor: vários separados por quebra/`,`. |
| **Multi-valor texto** | Separador `" , "` (composição comissão/mesa). Rich-text BBCode `[ml][ul][li]...[/li]` (biografia) → extrair texto/links. |
| **Legislatura** | String `"(2025 - 2028)"` → `anoInicio=2025, anoFim=2028, numero=?`. |
| **Corte temporal** | Importar até **2025-12-31**; descartar registros datados de 2026. |
| **Idempotência** | `upsert` por chave natural (ver cada entidade). Reexecutável. |
| **Vínculo por nome** | Autoria/parlamentar vem por **nome** (sem ID). Normalizar (trim, caixa, acentos) e casar com `Parlamentar.nome`; logar não-casados p/ revisão. |
| **Campos required sem origem** | Vários modelos exigem `texto`/`titulo` que o CSV não traz (só PDF). Preencher com `ementa` como fallback e marcar p/ extração posterior do PDF. |

---

## 2. Mapeamento P0 — Núcleo Legislativo

### 2.1 `Legislatura` (+ `PeriodoLegislatura`)
Derivada de `Mesa diretora.csv`/`Parlamentares.csv` (campo `LEGISLATURA="(2025 - 2028)"`).

| Campo Prisma | Origem | Transformação |
|--------------|--------|---------------|
| `numero` | — | Sequencial/derivar (ex.: legislatura de 2025-2028). |
| `anoInicio` / `anoFim` | `LEGISLATURA` | Regex `(\d{4})\s*-\s*(\d{4})`. |
| `ativa` | — | `true` para a vigente (2025-2028). |

### 2.2 `Parlamentar` (+ `Mandato`, `Filiacao`) — `Parlamentares.csv`
Chave natural: `nome` normalizado (dedupe entre legislaturas).

| Campo Prisma | Coluna CSV | Transformação |
|--------------|-----------|---------------|
| `nome` | `nomeParlamentar` / `nomeCompletoParlamentar` | trim. |
| `email` | `emailParlamentar` | nullable. |
| `telefone` | `telefoneParlamentar` | nullable. |
| `partido` | `partidoParlamentar` | ex.: "PODE". |
| `biografia` | `biografiaParlamentar` | extrair texto/links do BBCode `[ml]...`. |
| `foto` | `fotoParlamentar` | baixar (CDN Bubble) → `public/uploads/parlamentares/`. |
| `legislatura` | `LEGISLATURA` | string compat. |
| `ativo` | `ativo` | `"sim"`→true / `"não"`→false. |
| `cargo` | (Mesa diretora) | default `VEREADOR`; sobrescrever via Mesa. |
| **Mandato** | `LEGISLATURA`, `titular` | criar `Mandato` por legislatura; `titular="sim"`→`ativo`; suplente → `suplenteDeId`. |
| **Filiacao** | `partidoParlamentar` | criar filiação atual. |

> ⚠️ `COMPOSICAO_COMISSAO` (multi-valor) cruza com Comissões — usar na 2.4.

### 2.3 `MesaDiretora` (+ `CargoMesaDiretora`, `MembroMesaDiretora`) — `Mesa diretora.csv`
Cadeia: Legislatura → Periodo → CargoMesaDiretora → MesaDiretora → MembroMesaDiretora.

| Cargo (coluna CSV) | `CargoMesaDiretora.nome` | `CargoParlamentar` |
|--------------------|--------------------------|--------------------|
| `presidente` | Presidente | PRESIDENTE |
| `primeiroVicePresidente` | 1º Vice-Presidente | VICE_PRESIDENTE |
| `primeiroSecretario` | 1º Secretário | PRIMEIRO_SECRETARIO |
| `segundoSecretario` | 2º Secretário | SEGUNDO_SECRETARIO |
| `quartoSecretario` | (se houver) | — |

Valor de cada coluna = **nome do parlamentar** → casar com `Parlamentar`.

### 2.4 `Comissao` (+ `MembroComissao`) — `Comissões.csv`

| Campo Prisma | Coluna CSV | Transformação |
|--------------|-----------|---------------|
| `nome` | `nomeComissao` | trim. |
| `sigla` | `sigla` | `***`→null. |
| `descricao`/finalidade | `finalidade` | `***`→null. |
| `tipo` (`TipoComissao`) | — | inferir: padrão `PERMANENTE`; "CPI"→`INQUERITO`. |
| `ativa` | `comissaoAtiva` | `"Sim"`→true. |
| **MembroComissao** | `COMPOSICAO` | split `" , "` → casar nomes; `dataInicio` ← `dataCriacao`; cargo default `MEMBRO`. |

`CargoComissao`: PRESIDENTE / VICE_PRESIDENTE / RELATOR / MEMBRO.

### 2.5 `Proposicao` (+ `Autor`) — `Matérias legislativas.csv` (+ posts WP)
Chave natural: `@@unique([tipo, numero, ano])`.

| Campo Prisma | Coluna CSV | Transformação |
|--------------|-----------|---------------|
| `tipo` | `tipoMateria` | mapear p/ código (REQUERIMENTO, PROJETO_LEI, INDICACAO, MOCAO…). |
| `numero` | `numero` ou extrair do título/PDF | string. |
| `ano` | `mesEano` | extrair ano. |
| `titulo` | derivar (`tipo nº/ano`) | required. |
| `ementa` | `ementa` | required (db.Text). |
| `documentos` (Json) | `DOCUMENTO` | `[{nome, url:/uploads/proposicoes/...}]`. |
| `status` (`StatusProposicao`) | `situacaoMateria` | mapear (ver §4). |
| `dataApresentacao` | `mesEano`/PDF | required → parsear; fallback 1º dia do mês. |
| `tipoAutoria` / autor | `tipoAutoria`, `PARLAMENTAR`, `poderExecutivo` | criar/casar `Autor` (Parlamentar/Executivo/Comissão). |

> Posts WP categorizados (Projetos de Lei=54, Requerimentos=284, Indicações=1)
> complementam o histórico; dedupe por `tipo+numero+ano`.

### 2.6 `NormaJuridica` — `Normas jurídicas.csv` (+ posts WP Leis/Resoluções/Decretos)
Chave natural: `@@unique([tipo, numero, ano])`.

| Campo Prisma | Coluna CSV | Transformação |
|--------------|-----------|---------------|
| `tipo` (`TipoNormaJuridica`) | `tipoNormaJuridica` | mapear (ver §4). |
| `numero` (Int) | `numero` ou extrair | parseInt. |
| `ano` (Int) | `dataPublicacao`/PDF | extrair ano. |
| `data` | `dataPublicacao` | required. |
| `dataPublicacao` | `dataPublicacao` | parsear Bubble. |
| `ementa` | `ementa` | required. |
| `texto` | — (PDF) | **lacuna**: required; fallback = `ementa`, extrair do PDF depois. |
| `situacao` (`SituacaoNorma`) | — | default `VIGENTE`. |

> ⚠️ **Lacuna de tipo**: enum `TipoNormaJuridica` = LEI_ORDINARIA,
> LEI_COMPLEMENTAR, DECRETO_LEGISLATIVO, RESOLUCAO, EMENDA_LEI_ORGANICA,
> LEI_ORGANICA, REGIMENTO_INTERNO, CODIGO_ETICA. As categorias WP
> **Portarias / Atos da Presidência / Decretos (executivo)** NÃO têm enum
> correspondente → mapear para `Publicacao`/`DocumentoTransparencia` (atos
> administrativos), não para NormaJuridica. Valores CR2 como "PPA",
> "LDO", "LOA" → `LEI_ORDINARIA` + `assunto`. **Decisão de mapeamento pendente.**

### 2.7 `Sessao` (+ ata/pauta/presença) — `Sessões.csv` (+ posts WP Pautas e Atas)

| Campo Prisma | Coluna CSV | Transformação |
|--------------|-----------|---------------|
| `numero` (Int) | `numeroSessao` | extrair nº de "1ª Sessão Extraordinária". |
| `tipo` (`TipoSessao`) | `tipoSessao` | "Extraordinária"→EXTRAORDINARIA, "Ordinária"→ORDINARIA, "Solene"→SOLENE, "Especial"→ESPECIAL. |
| `data` | `dataSessao` | parsear Bubble; required. |
| `status` | — | `CONCLUIDA` (histórico) + `finalizada=true`. |
| `arquivoAta` | `ataSessao` | baixar→`/uploads/atas-sessoes/`. |
| `arquivoPauta` | `pautaSessao` | baixar→`/uploads/pautas-sessoes/`. |
| `urlVideo`/`urlTransmissao` | `TRANSMISSOES`, `linkVotacao` | nullable. |
| **PresencaSessao** | `listPresencaSessao` | PDF de presença (ou parse, se estruturado). |
| **votação nominal** | `votacaoNominal` | normalmente vazio no histórico. |

---

## 3. Mapeamento P1/P2/P3 (resumo — detalhar na implementação)

| CSV | Modelo | Chave natural | Observações |
|-----|--------|---------------|-------------|
| Licitações | `Licitacao` | numero+ano | modalidade, valores, DOCUMENTOS. |
| Contratos | `Contrato` | numero+ano | cpfCnpj, vigência, valor. |
| Convênios… | `Convenio` | numeroCtv | repasses (multi). |
| Despesas | `Despesa` | data+descrição | poucos registros. |
| Diárias | `Diaria` | numeroPortaria | nome, destino, valor. |
| Valores diárias | `ValorDiariaTabela` | cargo+ano | tabela de valores. |
| Cotas parlamentares | `CotaParlamentar` | parlamentar+mesAno | DOCUMENTOS (multi). |
| Obras / Obras paralisadas | `Obra` | numeroContrato | situação, medições, imagens. |
| Concursos… | `Concurso` | numero+ano | vagas, situação. |
| Estrutura organizacional | `UnidadeOrganizacional` | — | competências, contatos. |
| Manifestações | `ManifestacaoOuvidoria` | protocoloManifestacao | dados cidadão (LGPD!). |
| SIC | `SolicitacaoESIC` | — | unidade/contato. |
| Agenda externa | `AgendaParlamentar` | data+descrição | — |
| Relação remuneração | `FolhaPagamento` | ano | linkRNR. |
| RGF / balanço / planejamento | `DocumentoTransparencia` | tipo+mesAno | LDO/LOA/PPA/RGF. |
| Documentos administrativos | `DocumentoTransparencia`/`Publicacao` | numero | portarias, atos. |
| Estagiários / Prestadores | `Servidor` / `Fornecedor` | nome/cpfCnpj | vínculos temporários. |
| Pesquisa de satisfação | `PesquisaSatisfacao` | pergunta | respostas agregadas. |
| Posts WP "Notícias" (13) | `Noticia` | título+data | conteúdo HTML + imagem. |

> ⚠️ **Manifestações.csv contém dados pessoais de cidadãos** (CPF, e-mail,
> endereço, escolaridade, gênero). Tratar conforme LGPD: criptografar CPF
> (`src/lib/security/cpf-utils.ts`), avaliar se importa dados identificáveis ou
> anonimiza. **Decisão pendente.**

---

## 4. Tabelas de conversão de valores (FECHADAS — valores reais extraídos)

> Contagens **reais** (parser respeitando aspas/multilinha):
> Parlamentares=**11**, Matérias=**121**, Normas=**25**, Sessões=**75**,
> Legislatura única=`(2025 - 2028)`. (As contagens por `wc -l` eram infladas
> por células multi-linha.)

### 4.1 `tipoMateria` → `Proposicao.tipo` (código)

| Valor CSV (qtd) | Código destino |
|-----------------|----------------|
| Requerimento (94) | `REQUERIMENTO` |
| Projeto de Lei (15) | `PROJETO_LEI` |
| Indicação (6) | `INDICACAO` |
| Projeto de Resolução (2) | `PROJETO_RESOLUCAO` |
| Projeto de Indicação (2) | `PROJETO_INDICACAO` (ou `INDICACAO`) |
| Moção de Aplauso (2) | `MOCAO` |

> Validar/garantir os códigos em `TipoProposicaoConfig` (criar os faltantes).

### 4.2 `situacaoMateria` → `StatusProposicao` (enum)

| Valor CSV (qtd) | Enum destino |
|-----------------|--------------|
| Aprovado (96) | `APROVADA` |
| Em Tramitação (9) | `EM_TRAMITACAO` |
| Matéria Lida (7) | `APRESENTADA` |
| Rejeitado (2) | `REJEITADA` |

### 4.3 `tipoAutoria` → `Autor` / `TipoAutor`

| Valor CSV (qtd) | TipoAutor | Vínculo |
|-----------------|-----------|---------|
| Parlamentar (102) | Parlamentar | casar col. `PARLAMENTAR` por nome |
| Poder Executivo (9) | Poder Executivo | autor externo |
| Parlamentar , Sem Autoria (4) | Parlamentar | usar nome de `PARLAMENTAR` |
| Poder Executivo , Parlamentar (1) | (composto) | autor primário = Executivo |

### 4.4 `tipoNormaJuridica` → `TipoNormaJuridica` (enum)

| Valor CSV (qtd) | Enum destino | Obs. |
|-----------------|--------------|------|
| Decreto Legislativo (16) | `DECRETO_LEGISLATIVO` | — |
| Lei (3) | `LEI_ORDINARIA` | — |
| PPA - Plano Plurianual (2) | `LEI_ORDINARIA` | `assunto="PPA"` |
| LDO - Lei de Diretrizes Orçamentárias (1) | `LEI_ORDINARIA` | `assunto="LDO"` |
| LOA - Lei Orçamentária Anual (1) | `LEI_ORDINARIA` | `assunto="LOA"` |
| Lei Orgânica (1) | `LEI_ORGANICA` | — |
| Resolução (1) | `RESOLUCAO` | — |

> ✅ Todos os tipos de norma do CR2 cabem no enum. As categorias
> **Portarias / Atos da Presidência / Decretos do Executivo** aparecem só nos
> **posts WP** → `Publicacao`/`DocumentoTransparencia` (atos administrativos).

### 4.5 `tipoSessao` → `TipoSessao` (enum)

| Valor CSV (qtd) | Enum |
|-----------------|------|
| Ordinária (73) | `ORDINARIA` |
| Extraordinária (2) | `EXTRAORDINARIA` |

---

## 5. Próximos passos da Fase 0 (pendentes)

1. Extrair valores **distintos** das colunas-tipo (`tipoMateria`,
   `tipoNormaJuridica`, `situacaoMateria`) para fechar as tabelas §4.
2. Extrair `wp-content/uploads/` do zip e cruzar URLs dos posts WP com os PDFs
   físicos (resolver nome → caminho).
3. Scaffold dos importadores: `prisma/importers/` (lib compartilhada de
   CSV/datas/download/dedupe + um script por entidade + orquestrador `--dry-run`).
4. Resolver decisões de mapeamento pendentes (Portarias/Atos; PPA/LDO/LOA;
   LGPD em Manifestações).
