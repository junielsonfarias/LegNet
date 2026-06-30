# PLANO DE IMPORTAÇÃO — DADOS DO SITE ANTIGO (até 2025)

> **Data**: 2026-06-30
> **Autor**: Análise técnica (Claude)
> **Status**: PROPOSTA — aguarda aprovação. NADA foi importado ainda.
> **Origem**: `docs/backup antigo/`
> **Destino**: Banco PostgreSQL (Prisma) do novo sistema — Câmara Municipal de Chaves (cmchaves.pa.gov.br)

---

## 1. Resumo Executivo

O backup contém **três fontes de dados** de duas gerações de sites distintos da
mesma Câmara (Chaves/PA). A análise mostrou que a melhor estratégia é usar o
**export estruturado do Portal CR2 (CSV)** como fonte primária de dados
legislativos/transparência, e o **dump WordPress** como fonte secundária para o
acervo histórico de notícias e documentos (1977–2025), reaproveitando os
**2.029 PDFs locais** já presentes no backup.

Encoding já verificado: **UTF-8 válido** (o "mojibake" visto era só artefato de
exibição do cliente). Isso elimina um risco grande de migração.

---

## 2. Fontes de Dados Identificadas

| # | Fonte | Arquivo | Natureza | Volume |
|---|-------|---------|----------|--------|
| A | **WordPress** (site antigo cmchaves.pa.gov.br) | `banco de dados.sql` (26 MB) | Dump MySQL 5.7 / phpMyAdmin, 137 tabelas | 954 posts + 84 páginas + 2.191 anexos |
| B | **Portal CR2 / Bubble.io** (cr2transparencia) | `Portal CR2-...zip` (66 KB) | 34 arquivos CSV estruturados | ver tabela §4 |
| C | **Arquivos do site** | `arquivos site.zip` (2,5 GB) | Site WP completo + uploads | **2.029 PDFs** + imagens, em `wp-content/uploads/AAAA/` |

> Observação: o Portal CR2 é mais **recente e estruturado** (foco em PNTP/2025);
> o WordPress tem o **acervo histórico** mais longo e os arquivos PDF físicos.

---

## 3. Inventário do Dump WordPress (Fonte A)

### 3.1 Tabelas COM conteúdo útil

| Tabela | Conteúdo | Relevância |
|--------|----------|------------|
| `wp_posts` (post=publish, 954) | Documentos legislativos como **título + link p/ PDF**, categorizados | ALTA |
| `wp_posts` (page=publish, 84) | Páginas institucionais (história, estrutura, contatos) | MÉDIA |
| `wp_posts` (attachment, 2.191) | Metadados dos arquivos de mídia (apontam p/ PDFs do zip C) | ALTA |
| `wp_term_taxonomy` / `wp_terms` / `wp_term_relationships` | Categorias = **tipo de documento** (ver §3.2) | ALTA |
| `wp_postmeta` | Metadados (Magic Fields = "Notícias") | BAIXA |

### 3.2 Categorias dos 954 posts (= tipo de documento)

| Categoria | Qtd | Mapeia para |
|-----------|-----|-------------|
| Atividades Legislativas | 810 | (categoria guarda-chuva) |
| Pautas e Atas das Sessões | 453 | `Sessao` / `PautaSessao` / ata |
| Requerimentos | 284 | `Proposicao` (REQ) |
| Projetos de Lei | 54 | `Proposicao` (PL) |
| Leis | 52 | `NormaJuridica` |
| Publicações Oficiais | 50 | `DocumentoTransparencia` |
| Atos da Presidência | 26 | `NormaJuridica`/ato |
| Demais Publicações Oficiais | 24 | `DocumentoTransparencia` |
| Licitações | 18 | `Licitacao` |
| Notícias | 13 | `Noticia` |
| Portarias | 11 | `NormaJuridica`/ato |
| Resoluções | 10 | `NormaJuridica` |
| Decretos | 7 | `NormaJuridica` |
| Vereadores | 2 | `Parlamentar` |
| Indicações | 1 | `Proposicao` (IND) |

### 3.3 Tabelas a IGNORAR (lixo de plugins — ~110 tabelas)

Wordfence (`wp_wf*`), All-in-One Security (`wp_aiowps_*`), Yoast (`wp_yoast_*`),
RevSlider, MaxButtons, Newsletter, Polls (`wp_yop2_*`, `wp_pollsa`), HESK
helpdesk (`hesk_*`, `solicitacoes/` no zip), carousel/banner, cookie law, etc.
Nenhum dado institucional relevante.

### 3.4 Usuários (`wp_users`, 16 registros)

Todos são contas administrativas da empresa mantenedora (`CR2-adminN @
cr2transparencia.com.br`) + 1 admin genérico. **NÃO são parlamentares** e **NÃO
devem ser importados** como usuários do novo sistema.

---

## 4. Inventário do Portal CR2 (Fonte B) e Mapeamento Prisma

> Linhas brutas (`wc -l`); a contagem real de registros é menor porque há
> **células multi-linha** (exigem parser CSV que respeite aspas/quebras).

| CSV | Linhas | Modelo Prisma destino | Prioridade |
|-----|-------:|------------------------|:----------:|
| Parlamentares.csv | ~142 | `Parlamentar` (+ `Mandato`, `Filiacao`) | **P0** |
| Mesa diretora.csv | 2 | `MesaDiretora` / `MembroMesaDiretora` | **P0** |
| Comissões.csv | 6 | `Comissao` / `MembroComissao` | **P0** |
| Matérias legislativas.csv | 137 | `Proposicao` (+ `Autor`, `Tramitacao`) | **P0** |
| Normas jurídicas.csv | 26 | `NormaJuridica` | **P0** |
| Sessões.csv | 82 | `Sessao` (+ `PautaSessao`, ata, presença) | **P0** |
| Licitações.csv | 27 | `Licitacao` | P1 |
| Contratos.csv | 19 | `Contrato` | P1 |
| Convênios e transferências.csv | 12 | `Convenio` | P1 |
| Despesas.csv | 3 | `Despesa` | P1 |
| Diárias.csv | 39 | `Diaria` | P1 |
| Valores diárias.csv | 7 | `ValorDiariaTabela` | P1 |
| Cotas parlamentares.csv | 5 | `CotaParlamentar` | P1 |
| Obras.csv / Obras paralisadas.csv | 20 / 13 | `Obra` | P1 |
| Concursos e processos seletivos.csv | 25 | `Concurso` | P1 |
| Estrutura organizacional.csv | 93 | `UnidadeOrganizacional` | P1 |
| Manifestações.csv | 46 | `ManifestacaoOuvidoria` | P2 |
| SIC.csv | 2 | `SolicitacaoESIC` | P2 |
| Agenda externa.csv | 29 | `AgendaParlamentar` | P2 |
| Relação nominal de remuneração.csv | 5 | `FolhaPagamento` | P2 |
| RGF.csv / balanço e relatórios.csv | 6 / 4 | `DocumentoTransparencia` | P2 |
| Documentos administrativos.csv | 30 | `DocumentoTransparencia` | P2 |
| Estagiários / Prestadores de serviços.csv | 13 / 13 | `Servidor` / `Fornecedor` | P2 |
| Pesquisa de satisfação.csv | 7 | `PesquisaSatisfacao` | P3 |
| Demais (LGPD, Ouvidoria, Serviços online, Planejamento, Regulamentação, Plano de contratação, Licitantes contratados) | 2–6 | conteúdo institucional / `TransparenciaConteudo` | P3 |

**Formato dos campos (observado nos cabeçalhos):**
- Datas: formato inglês Bubble — `"Jan 28, 2025 1:24 pm"`, `"Dec 29, 2021 1:00 pm"` → precisa parser (`date-fns` `parse` com locale en).
- Arquivos: URLs do **CDN Bubble** (`//4fdf...cdn.bubble.io/f.../arquivo.pdf`) — **externos**, testados como acessíveis (HTTP 200).
- Multi-valor: separador `" , "` (ex.: composição de comissão) e rich-text BBCode `[ml][ul][li]...[/li]` (biografia parlamentar).
- Legislatura: string `"(2025 - 2028)"`.

---

## 5. Desafios Técnicos e Decisões

| # | Desafio | Encaminhamento proposto |
|---|---------|--------------------------|
| D1 | **Encoding** | RESOLVIDO — dados em UTF-8 válido. Ler com driver mysql2 `charset utf8mb4`. |
| D2 | **Arquivos PDF: duas origens** — WP (locais, 2.029 no zip) vs CR2 (CDN Bubble externo) | Estratégia híbrida: subir os PDFs locais p/ o storage do novo sistema; baixar os do CDN Bubble (acessível) durante o import e re-hospedar. **Não** depender de link externo a longo prazo. |
| D3 | **Sobreposição WP × CR2** (ambos têm matérias, sessões, normas) | CR2 é fonte primária (estruturada/recente). WP entra só para o que **não existe** no CR2 (dedupe por número+ano+tipo). Evita duplicidade. |
| D4 | **Parser CSV** | Usar parser robusto (campos com aspas, vírgulas e quebras de linha). `wc -l` ≠ nº de registros. |
| D5 | **Datas Bubble en-US** | Parser dedicado; normalizar p/ ISO/UTC. |
| D6 | **Parlamentares: múltiplas legislaturas / titular×suplente** | Deduplicar por nome; criar `Parlamentar` único + `Mandato` por legislatura; `titular` → flag. |
| D7 | **Vínculos relacionais** | Importar em ordem topológica (ver §6): Legislatura → Parlamentar → Mesa/Comissão → Proposição/Sessão → votações/anexos. |
| D8 | **Idempotência** | Cada importador deve ser re-executável (upsert por chave natural) sem duplicar. |
| D9 | **Tenant** | Definir o `Tenant`/Câmara de destino (Chaves) antes de importar; o seed atual contém dados de Rurópolis (decidir limpar/co-existir). |

---

## 6. Estratégia Recomendada (faseada)

**Princípio**: import idempotente, por prioridade, em ordem de dependência,
com staging e validação antes de tocar dados "de produção".

### Fase 0 — Preparação (sem gravar no banco final)
1. Manter container MySQL temporário (`camara_mysql_tmp`, já criado) com o dump para extrações SQL.
2. Descompactar `arquivos site.zip` → indexar os 2.029 PDFs por caminho (`wp-content/uploads/AAAA/MM/arquivo.pdf`).
3. Escrever **dicionário de colunas** completo de cada CSV P0 (todas as colunas + amostras), validando o mapeamento §4.
4. Definir o `Tenant` de destino (Chaves) e a política de convivência com o seed atual.

### Fase 1 — Núcleo legislativo (P0)
Ordem: `Legislatura`/`PeriodoLegislatura` → `Parlamentar` (+`Mandato`,`Filiacao`)
→ `MesaDiretora` → `Comissao` (+membros) → `NormaJuridica` → `Proposicao`
(+`Autor`,`ProtocoloProposicao`) → `Sessao` (+`PautaSessao`, ata, presença).
Fonte primária: **CR2**; complemento histórico: **WP** (com dedupe D3).

### Fase 2 — Transparência (P1)
`Licitacao`, `Contrato`, `Convenio`, `Despesa`, `Diaria`, `ValorDiariaTabela`,
`CotaParlamentar`, `Obra`, `Concurso`, `UnidadeOrganizacional`.

### Fase 3 — Participação/institucional (P2/P3)
`ManifestacaoOuvidoria`, `SolicitacaoESIC`, `AgendaParlamentar`,
`FolhaPagamento`, `DocumentoTransparencia`, `Noticia` (notícias WP),
`PesquisaSatisfacao`, conteúdos institucionais.

### Fase 4 — Arquivos (PDFs)
Para cada registro com documento: localizar o PDF (local WP ou CDN Bubble),
enviar ao storage do novo sistema e gravar a URL final no campo correspondente.

### Fase 5 — Validação e conciliação
Relatório de import (contagens origem × destino), amostragem manual,
checagem de links de arquivo, verificação de integridade relacional.

### Arquitetura de execução
- Scripts `tsx` em `prisma/importers/` (um por entidade), reutilizando o
  padrão dos `seed-*.ts`. Cada um lê CSV/SQL → normaliza → `upsert` Prisma.
- Um orquestrador `prisma/import-antigos.ts` roda as fases na ordem correta,
  com `--only=<fase>` e `--dry-run`.
- Tudo rodando **primeiro no banco DEV local** (Docker) já configurado.

---

## 7. Decisões Confirmadas (2026-06-30)

1. **Escopo**: ✅ **Todas as fases (P0 → P3)** — núcleo legislativo +
   transparência + participação + notícias.
2. **Seed atual (Rurópolis)**: ✅ **Limpar o banco DEV e importar só Chaves.**
   Reset do banco local antes da Fase 1 (preservar apenas o admin, a definir).
3. **Arquivos PDF**: ✅ **Re-hospedar tudo no storage do novo sistema** —
   baixar os do CDN Bubble + subir os 2.029 locais. Sem dependência de link
   externo. (Definir qual storage usar em DEV — ver §6 Fase 0.)
4. **Posts WordPress (954)**: ✅ **Importar como documentos legislativos
   categorizados** (`Proposicao`/`NormaJuridica`/`Sessao`/`DocumentoTransparencia`
   conforme a categoria). Só os 13 "Notícias" viram `Noticia`.
5. **Corte temporal**: ✅ **Até 2025** — incluir registros até 2025-12-31,
   **excluir 2026**.

---

## 8. Riscos

- **R1** — Qualidade dos dados CR2 (campos com `***`, vazios, rich-text) exige limpeza caso a caso.
- **R2** — Volume de PDFs (2,5 GB local + downloads CDN) → planejar storage e tempo de upload.
- **R3** — Mapeamento de autoria/parlamentar por **nome** (sem ID) pode gerar divergências; precisa normalização e revisão.
- **R4** — Dedupe WP×CR2 imperfeito pode duplicar matérias; mitigado por chave natural (tipo+número+ano).
- **R5** — Dependência do CDN Bubble se não re-hospedarmos (link pode cair no futuro).

---

## 9. Próximos Passos Imediatos (após aprovação)

1. Você responde as **decisões pendentes** (§7).
2. Faço a Fase 0 (dicionário de colunas completo + indexação de PDFs).
3. Implemento e rodo os importadores P0 em **dry-run** no banco DEV local.
4. Revisamos o relatório de conciliação antes de gravar de fato.

---

> **Ambiente de análise**: container MySQL temporário `camara_mysql_tmp`
> (porta 33061) com o dump importado — pode ser reutilizado na execução.
> Para remover: `docker rm -f camara_mysql_tmp`.
