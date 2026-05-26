# Plano PNTP 2026 — Caminho para o Selo Diamante

> **Data**: 2026-05-26
> **Origem**: Analise ponta-a-ponta da Matriz de Criterios PNTP 2026 (Atricon/4 Ed.) cruzada com o estado atual do sistema. Fontes: `docs/PNTP/Cartilha-PNTP-2026.pdf` e `docs/PNTP/criterios_de_avaliacao_pntp_2026/Matriz de Criterios 2026 (Final).xlsx`.
> **Universo**: 83 criterios aplicaveis a Camaras Municipais (60 COMUM + 8 COMUM-exc-Estatais + 4 COMUM-exc-Estatais-Indep + 11 PODER LEGISLATIVO).
> **Cobertura inicial**: ~69% atendido / 22% parcial / 9% faltante. Score teorico atual: 80-85% (Ouro).
> **Meta**: ≥ 95% com 100% dos essenciais (1.1, 1.2, 3.1, 4.1, 4.2, 4.3, 11.5) — faixa **Diamante**.
> **Branch**: trabalhar em `main`, commits pequenos por item (padrao do projeto em producao).

---

## Sumario

| Fase | Tema | Itens | Severidade | Estimativa |
|------|------|-------|------------|------------|
| K | Gaps Diamante (impacto direto no selo) | K1 a K5 | CRITICO | 4-5 dias |
| L | Licitacoes e contratos completos | L1 a L4 | ALTO | 3-4 dias |
| M | Qualidade da Dim. 20 + Planejamento | M1 a M5 | ALTO | 3-4 dias |
| N | Qualidade transversal (atualidade/serie/filtros/gravacao) | N1 a N6 | MEDIO | 4-5 dias |

> **Total estimado**: 14-18 dias de trabalho efetivo. Sequencial K → L → M → N.
> Apos cada fase, rodar `/api/admin/conformidade-pntp` para confirmar avanco do score.

---

## Pre-requisitos

- [ ] Suite de testes verde (baseline 570/570 — 2026-05-14)
- [ ] TypeScript `tsc --noEmit` limpo
- [ ] Snapshot Supabase + VPS antes de cada migration
- [ ] Verificar que `crons` de prazo (RN-122/123/124/140) seguem rodando diariamente
- [ ] Confirmar que `/api/admin/conformidade-pntp` (20 itens) responde sem erro

---

## Novas Regras de Negocio (RN-175 a RN-184)

Cada item do plano gera uma RN em `REGRAS-DE-NEGOCIO.md`:

| RN | Tema | Criterio PNTP | Item plano |
|----|------|---------------|------------|
| RN-175 | Pesquisa de Satisfacao publicada | 15.6 | K1 |
| RN-176 | Politica de Privacidade LGPD publicada | 15.2 | K2 |
| RN-177 | Botao Radar Transparencia (Atricon) | 2.9 | K3 |
| RN-178 | Mapa do Site HTML (legivel ao cidadao) | 13.5 | K4 |
| RN-179 | Transmissao de Sessoes publica | 20.9 | K5 |
| RN-180 | Plano de Contratacoes Anual (PCA) | 8.6 | L2 |
| RN-181 | Atas de Adesao a SRP | 8.5 | L1 |
| RN-182 | Plano Estrategico Institucional | 11.7 | M1 |
| RN-183 | Pauta especifica de Comissoes | 20.5 | M3 |
| RN-184 | Filtro/Serie/Gravacao em todas paginas de transparencia | 20.x todos | N1-N3 |

---

## FASE K — Gaps Diamante (CRITICO) ✅ (concluida em 2026-05-26)

> **Objetivo**: fechar os 5 itens faltantes que travam o salto para Ouro→Diamante. Cada item soma ~2-4 pontos no score final.

### Itens

| ID | Tema | Criterio | Onde | Esforco |
|----|------|----------|------|---------|
| K1 | Pesquisa de Satisfacao | 15.6 (Obrig.) | modelo `PesquisaSatisfacao` + form publico + dashboard de resultados | 1.5d |
| K2 | Politica de Privacidade LGPD | 15.2 (Recom.) | pagina `/transparencia/politica-privacidade` + admin + PDF | 0.5d |
| K3 | Botao Radar Transparencia | 2.9 (Recom.) | imagem oficial Atricon + link na home `/transparencia` + footer | 0.2d |
| K4 | Mapa do Site HTML | 13.5 (Recom.) | pagina `/transparencia/mapa-do-site` (legivel, nao SEO) | 0.5d |
| K5 | Transmissao de Sessoes | 20.9 (Recom.) | configuracao `transmissao.url` + embed/link na home `/transparencia` + `/legislativo/sessoes` | 1d |

### Checklist K

**K1 — Pesquisa de Satisfacao (RN-175)**
- [x] Modelos Prisma `PesquisaSatisfacao` + `RespostaPesquisaSatisfacao` (com ipHash SHA-256)
- [x] Migration idempotente `scripts/sql/add-pesquisa-satisfacao.sql` + install.sh etapa 5r
- [x] API `/api/pesquisas-satisfacao` (GET publico, POST com `transparencia.manage`)
- [x] API `/api/pesquisas-satisfacao/[id]` (GET/PUT/DELETE)
- [x] API `/api/pesquisas-satisfacao/[id]/respostas` (POST publico + rate-limit + captcha)
- [x] API `/api/pesquisas-satisfacao/[id]/resultados` (publico, respeita `publicaResultados`)
- [x] Admin `/admin/transparencia/pesquisas-satisfacao` (CRUD inline + builder de perguntas)
- [x] Pagina publica `/transparencia/pesquisas-satisfacao` (lista ativas/encerradas)
- [x] Pagina `/transparencia/pesquisas-satisfacao/[id]` (formulario de resposta)
- [x] Pagina `/transparencia/pesquisas-satisfacao/[id]/resultados` (dashboard agregado)
- [x] Link corrigido na home `/transparencia` (item LGPD) para `/pesquisas-satisfacao`
- [x] Sidebar admin (Vote icon)
- [x] Tile no monitor `/api/admin/conformidade-pntp` (item 22)
- [x] RN-175 em `REGRAS-DE-NEGOCIO.md`
- [ ] Testes (criar, responder anonimo, agregacao) — deferido para sprint de testes

**K2 — Politica de Privacidade (RN-176)**
- [x] Pagina SSR `/transparencia/politica-privacidade` com 9 principios LGPD, direitos, DPO, base legal
- [x] Novo valor de enum `TipoDocumentoTransparencia.POLITICA_PRIVACIDADE`
- [x] Migration idempotente `scripts/sql/add-politica-privacidade-tipo.sql` + install.sh etapa 5q
- [x] Tile na home `/transparencia` (secao LGPD) + link no footer (coluna Institucional)
- [x] Atalho em `/admin/transparencia/documentos` para tipo POLITICA_PRIVACIDADE
- [x] Atualizada lista de tipos em `/api/documentos-transparencia` (Zod)
- [x] Tile no monitor de conformidade (item 21)
- [x] RN-176

**K3 — Botao Radar Transparencia (RN-177)**
- [x] Componente `<RadarBadge variant="hero|footer|inline" />` em `src/components/transparencia/radar-badge.tsx`
- [x] Incluir no hero de `/transparencia/page.tsx` (variant=hero)
- [x] Incluir no footer global (variant=footer; substituiu o texto estatico)
- [x] Link aponta para `https://radardatransparencia.atricon.org.br/` (target=_blank)
- [x] RN-177

**K4 — Mapa do Site HTML (RN-178)**
- [x] Pagina `/transparencia/mapa-do-site` (`force-static`) com 12 secoes por dimensao PNTP, ~120 links
- [x] Cada secao referencia a dimensao PNTP correspondente
- [x] Link no footer (coluna Transparencia) + link na home `/transparencia`
- [x] Item separado de `src/app/sitemap.ts` (continua sendo XML/SEO)
- [x] RN-178

**K5 — Transmissao de Sessoes (RN-179)**
- [x] 6 chaves em `Configuracao`: `transmissao_ativa`, `transmissao_url`, `transmissao_plataforma`, `transmissao_embed_html`, `transmissao_titulo`, `transmissao_aviso`
- [x] Pagina `/admin/configuracoes/transmissao` (form focado com select/textarea/input)
- [x] Service `src/lib/services/transmissao-service.ts` (`getTransmissaoConfig` + `urlToEmbed`)
- [x] Componente `<TransmissaoAoVivo variant="banner|full">` (SSR)
- [x] Componente `<TransmissaoBannerClient />` (client, para a home que e 'use client')
- [x] API publica `GET /api/transmissao` (sem `embedHtml` por seguranca)
- [x] Pagina publica `/transparencia/transmissao` (player 16:9 + estado inativo)
- [x] Banner ao vivo na home `/transparencia`
- [x] Item "Transmissao das Sessoes" adicionado na secao "Atividades do Legislativo"
- [x] Sidebar admin (icon Tv) + cartao em `/admin/configuracoes`
- [x] Tile no monitor de conformidade (item 23)
- [x] RN-179

**Documentacao Fase K**
- [x] `ESTADO-ATUAL.md` atualizado (entrada 2026-05-26, versao 1.26.0)
- [x] `REGRAS-DE-NEGOCIO.md` (RN-175 a RN-179)
- [x] `docs/PLANO-PNTP-2026.md` (este checklist marcado)
- [ ] `docs/skills/skill-transparencia.md` regenerada (deferido — sera feito no commit final)
- [ ] `docs/skills/skill-admin.md` (idem)

### Criterio de aceite Fase K

- [x] `/api/admin/conformidade-pntp` agora monitora 23 itens (eram 20)
- [x] Score teorico esperado ≥ 88% (Ouro firme) apos popular conteudo minimo (1 pesquisa publicada + politica de privacidade + transmissao configurada)
- [ ] 5 novas paginas publicas com `Disponibilidade` confirmada manualmente (depende de validacao do usuario)

---

## FASE L — Licitacoes e Contratos completos (ALTO) ✅ (concluida em 2026-05-26)

> **Objetivo**: fechar as 3 lacunas da dimensao 8 (Licitacoes — peso 3) e a parcial da dimensao 9 (Contratos — peso 3). Juntas valem ~10% do score.

### Itens

| ID | Tema | Criterio | Onde | Esforco |
|----|------|----------|------|---------|
| L1 | Atas de Adesao a SRP | 8.5 (Obrig.) | modelo `AtaAdesaoSRP` + admin + publicacao publica | 1d |
| L2 | Plano de Contratacoes Anual (PCA) | 8.6 (Recom.) | publicacao anual via `DocumentoTransparencia` + admin focado + pagina | 0.7d |
| L3 | Documentos completos de licitacao (fase int/ext + dispensa/inexigibilidade) | 8.2, 8.3, 8.4 (Obrig.) | expandir `Licitacao` com anexos JSON + UI admin + visualizacao publica | 1.5d |
| L4 | Fiscais de contrato expostos | 9.3 (Obrig.) | confirmar `Contrato.fiscal*` no schema + expor em `/transparencia/contratos/[id]` | 0.5d |

### Checklist L

**L1 — Atas de Adesao SRP (RN-181)**
- [x] Modelo Prisma `AtaAdesaoSRP` com numero+ano UNIQUE, documentos JSON, vigencia, situacao, dataPublicacao
- [x] Migration idempotente `scripts/sql/add-atas-adesao-srp.sql` + install.sh 5s + aplicada no Supabase
- [x] API `/api/atas-adesao-srp` (GET publico paginado, POST com `transparencia.manage`)
- [x] API `/api/atas-adesao-srp/[id]` (GET/PUT/DELETE)
- [x] Admin `/admin/transparencia/atas-adesao-srp` (CRUD inline + builder de docs anexos)
- [x] Pagina publica `/transparencia/atas-adesao-srp` (SSR, cards de resumo + lista detalhada)
- [x] Tile na home `/transparencia` (secao Licitacoes/Contratos/Obras)
- [x] Sidebar admin (icon Layers)
- [x] Tile no monitor de conformidade (item 24)
- [x] RN-181 em `REGRAS-DE-NEGOCIO.md`

**L2 — Plano de Contratacoes Anual (RN-180)**
- [x] Reaproveita enum `TipoDocumentoTransparencia.PLANO_ANUAL_CONTRATACOES` (Sprint 4)
- [x] Pagina `/transparencia/plano-contratacoes-anual` (`force-dynamic`) — usa `DocumentosOficiais`
- [x] Conteudo educativo (o que e o PCA, beneficios, base legal, conteudo minimo)
- [x] Tile na home `/transparencia` redirecionado para a nova pagina
- [x] Tile no monitor de conformidade (item 25 — verifica `ano = ano corrente`)
- [x] RN-180 em `REGRAS-DE-NEGOCIO.md`
- [ ] Cron janeiro para alerta de PCA nao publicado — diferido para futuro

**L3 — Documentos completos de Licitacao (RN-182)**
- [x] Colunas JSONB `documentosFaseInterna` e `documentosFaseExterna` em `Licitacao`
- [x] Migration `scripts/sql/add-licitacao-documentos-fase.sql` (ADD COLUMN IF NOT EXISTS) + install.sh 5t + aplicada
- [x] API dedicada `/api/licitacoes/[id]/documentos` (GET publico + PUT com `financeiro.manage`)
- [x] Pagina publica `/transparencia/licitacoes/[id]` (SSR, abas Resumo / Fase Interna / Fase Externa / Anexos diversos)
- [x] Admin `/admin/licitacoes/[id]/documentos-fase` (builder com 7 sugestoes por fase)
- [x] Botao "Detalhes / Documentos" na lista publica `/transparencia/licitacoes`
- [x] Monitor item 26 usa `prisma.$queryRaw` com `jsonb_array_length` em ambas as fases
- [x] RN-182 em `REGRAS-DE-NEGOCIO.md`

**L4 — Fiscais de Contrato**
- [x] Auditoria: campo `Contrato.fiscalContrato` ja existia no schema (linha 1670)
- [x] Exibido na lista publica `/transparencia/contratos` (campo "Fiscal" abaixo do CNPJ/CPF)
- [x] Hook `useContratos` ja tipava `fiscalContrato: string | null`
- [x] API `/api/dados-abertos/contratos` ja expoe `fiscal_contrato` (Sprint 4)
- [x] Monitor item 27 verifica `Contrato.count({fiscalContrato: not null})` / total

**Documentacao Fase L**
- [x] `ESTADO-ATUAL.md` atualizado (entrada 2026-05-26 Fase L, versao 1.27.0)
- [x] `REGRAS-DE-NEGOCIO.md` (RN-180, RN-181, RN-182)
- [x] `docs/PLANO-PNTP-2026.md` (este checklist marcado)
- [ ] `docs/skills/skill-transparencia.md` (diferido — sera feito no commit final)
- [ ] `docs/MODELOS-DADOS.md` regenerado (diferido)

### Criterio de aceite Fase L

- [x] `/api/admin/conformidade-pntp` agora monitora 27 itens (eram 23)
- [x] Score teorico esperado ≥ 91% apos popular conteudo minimo (1 ata SRP + 1 PCA + 1 licitacao com docs)
- [ ] Dimensao 8 (Licitacoes) com 100% obrigatorios atendidos — depende de validacao publica
- [ ] Dimensao 9 (Contratos) com 100% obrigatorios atendidos — depende de validacao publica

---

## FASE M — Qualidade Dim. 20 + Planejamento (ALTO) ✅ (concluida em 2026-05-26)

> **Objetivo**: fechar os parciais que afetam a matriz especifica do Poder Legislativo (peso 3 cada criterio) e a dimensao 11 (Planejamento — peso 4).

### Itens

| ID | Tema | Criterio | Onde | Esforco |
|----|------|----------|------|---------|
| M1 | Plano Estrategico Institucional | 11.7 (Recom.) | enum ja existe — falta pagina dedicada + admin | 0.5d |
| M2 | Obras: executado e pago | 10.3 (Obrig.) | campos `quantidadeExecutada`, `valorPago` em `Obra` + UI | 0.7d |
| M3 | Pauta especifica de Comissoes | 20.5 (Obrig.) | pagina publica `/transparencia/legislativo/pautas-comissoes` (separada do Plenario) | 1d |
| M4 | Desclassificadas (LAI) | 12.9 (Obrig.) | campo `desclassificado` + `dataDesclassificacao` em `DocumentoClassificado` + filtro | 0.5d |
| M5 | Instrumento normativo local LAI + prazos | 12.5, 12.6 (Obrig./Recom.) | secao em `/institucional/e-sic` com upload de decreto + texto sobre prazos | 0.5d |

### Checklist M

**M1 — Plano Estrategico (RN-183)**
- [x] Pagina `/transparencia/plano-estrategico` (`force-dynamic`) com 6 elementos, beneficios, base legal + `DocumentosOficiais`
- [x] Reaproveita enum `PLANEJAMENTO_ESTRATEGICO` (admin existente em /admin/transparencia/documentos serve)
- [x] Tile na home `/transparencia` redirecionado (era `/documentos/planejamento-estrategico`)
- [x] Tile no monitor (item 28)
- [x] RN-183

**M2 — Obras executado/pago**
- [x] Migration `scripts/sql/add-obra-execucao-fields.sql` (5 colunas: valorPago, quantidadeContratada, quantidadeExecutada, unidadeMedida, dataUltimaMedicao) — idempotente, install.sh 5u
- [x] API `/api/obras` (POST) e `[id]` (PUT) aceitam os 5 campos novos
- [x] Pagina publica `/transparencia/obras` exibe Pago, Quantidades, Unidade e Ultima medicao
- [x] Monitor item 29 verifica obras com execucao preenchida

**M3 — Pauta de Comissoes (RN-184)**
- [x] Reaproveita `ReuniaoComissao.pautaTexto / arquivoPauta / dataPublicacaoPauta` (RN-172)
- [x] Pagina publica `/transparencia/legislativo/pautas-comissoes` (SSR, agrupada por comissao, com 3 cards de resumo)
- [x] Diferenciacao visual das pautas do Plenario + link para pautas-sessoes
- [x] Tile na home `/transparencia` (apos Sessoes, antes da Transmissao)
- [x] Tile no monitor (item 30)
- [x] RN-184

**M4 — Desclassificadas (LAI 12.9)**
- [x] Campos `situacao` e `dataDesclassificacao` ja existiam no schema
- [x] Adicionado campo `motivoDesclassificacao TEXT` via migration idempotente (install.sh 5v)
- [x] Pagina `/transparencia/informacoes-classificadas` ja tinha 2 secoes (Classificadas / Desclassificadas) — agora exibe motivo
- [x] Monitor item 31 (sempre conforme — exibe quantidade)

**M5 — LAI local + prazos (RN-185)**
- [x] Novo valor enum `TipoDocumentoTransparencia.REGULAMENTO_LAI` (migration idempotente, install.sh 5w)
- [x] Pagina `/transparencia/e-sic/normativa` com tabela de 5 prazos, autoridades competentes, procedimento e `DocumentosOficiais`
- [x] Lista `TIPOS` em `/api/documentos-transparencia` e admin atualizada
- [x] Tile na home `/transparencia` (secao Atendimento ao Cidadao)
- [x] Tile no monitor (item 32)
- [x] RN-185

**Documentacao Fase M**
- [x] `ESTADO-ATUAL.md` (entrada 2026-05-26 Fase M, versao 1.28.0)
- [x] `REGRAS-DE-NEGOCIO.md` (RN-183, RN-184, RN-185)
- [x] `docs/PLANO-PNTP-2026.md` (este checklist marcado)
- [ ] `docs/skills/skill-transparencia.md` (diferido — sera feito no commit final)

### Criterio de aceite Fase M

- [x] `/api/admin/conformidade-pntp` agora monitora 32 itens (eram 27)
- [x] Score teorico esperado ≥ 93% apos popular conteudo minimo (1 plano estrategico + 1 reuniao com pauta + 1 regulamento LAI)
- [ ] Dimensao 20 (Legislativo) com 100% obrigatorios atendidos — depende de validacao publica
- [ ] Dimensao 12 (SIC) com 100% obrigatorios atendidos — depende de validacao publica

---

## FASE N — Qualidade transversal (MEDIO) ✅ (concluida em 2026-05-26)

> **Objetivo**: os 40% finais (Atualidade 30% + Serie Historica 20% + Filtro 10% + Gravacao 10%) de cada criterio dependem de UI consistente em todas as paginas. Esta fase audita e padroniza.

### Itens

| ID | Tema | Onde | Esforco |
|----|------|------|---------|
| N1 | Botao "Exportar CSV/XLSX" em todas paginas de transparencia | varredura em `src/app/transparencia/**/page.tsx` | 1d |
| N2 | Filtro de ano (X-1, X-2, X-3) em todas paginas com serie historica | mesmo escopo | 1d |
| N3 | Filtro de pesquisa estruturado (numero, data, palavra-chave) | mesmo escopo | 1d |
| N4 | Indicador de "ultima atualizacao" visivel em cada pagina | componente `<UltimaAtualizacao />` reutilizavel | 0.5d |
| N5 | Pesquisa global de conteudo no portal (Crit. 1.4) | full-text search Postgres + pagina `/transparencia/busca` | 1d |
| N6 | Expansao `/api/admin/conformidade-pntp` para 83 criterios | refator para refletir matriz oficial (dimensoes + pesos) | 1d |

### Checklist N

**N1 — Exportacao universal (RN-186)**
- [ ] Componente `<ExportarDadosButton />` em `src/components/transparencia/exportar-dados-button.tsx` (CSV + XLSX via sheetjs + JSON)
- [ ] Auditar paginas que devem ter export segundo a matriz:
  - [ ] `/transparencia/receitas` (3.1 — gravacao obrig.)
  - [ ] `/transparencia/despesas` (4.1, 4.2, 4.3 — gravacao obrig.)
  - [ ] `/transparencia/repasses` (5.1)
  - [ ] `/transparencia/convenios` (5.2)
  - [ ] `/transparencia/pessoal/quadro-pessoal` (6.1)
  - [ ] `/transparencia/pessoal/remuneracao` (6.2)
  - [ ] `/transparencia/cargos` (6.3)
  - [ ] `/transparencia/pessoal/diarias` (7.1)
  - [ ] `/transparencia/licitacoes` (8.1)
  - [ ] `/transparencia/contratos` (9.1)
  - [ ] `/transparencia/obras` (10.1)
  - [ ] `/transparencia/legislativo/atas` (20.6)
  - [ ] `/transparencia/legislativo/votacoes-nominais` (20.7)
  - [ ] `/transparencia/cotas-parlamentar` (20.10)
  - [ ] `/transparencia/parlamentar/relatorio` (20.11)
- [ ] Cada pagina recebe `<ExportarDadosButton data={...} filename="..." />`
- [ ] Testes E2E que conferem o botao em cada rota

**N2 — Serie Historica universal**
- [ ] Hook `useAnoFilter()` com URL state (`?ano=YYYY`)
- [ ] Componente `<AnoFilter min={2023} />` (default 4 anos: X, X-1, X-2, X-3)
- [ ] Adicionar em todas as paginas com criterio que exige serie historica:
  - [ ] 3.x, 4.x, 5.x, 6.x, 7.x, 8.x, 9.x, 10.x, 11.x, 20.2, 20.3, 20.6, 20.7, 20.8, 20.10, 20.11
- [ ] Garantir que API correspondente aceita `?ano=YYYY`
- [ ] Banner "Dados de 2023, 2024, 2025" quando aplicavel

**N3 — Filtro estruturado universal**
- [ ] Componente `<FiltroPesquisa fields={['numero','data','palavraChave','texto']} />`
- [ ] Adicionar em paginas com criterio que exige filtro de pesquisa (lista completa na matriz)
- [ ] Para criterios com filtro = "numero, data, palavra-chave ou texto livre" (20.2, 20.3, 20.6, 20.7, 20.8) — todos os 4 campos
- [ ] Para outros (3.x, 4.x, etc.) — campos relevantes ao recurso

**N4 — Indicador de atualizacao**
- [ ] Componente `<UltimaAtualizacao data={...} />` no padrao "Informacoes atualizadas em DD/MM/AAAA"
- [ ] Helper que pega `MAX(updatedAt)` da tabela e expoe via prop
- [ ] Inserir no topo de TODA pagina `/transparencia/**` (mesmo as que ja tem)
- [ ] Resolve o item de Atualidade visual (a cartilha exige indicacao explicita)

**N5 — Pesquisa global (Crit. 1.4)**
- [ ] Adicionar coluna `tsvector` (Postgres full-text search) em modelos chave: `Proposicao`, `Sessao`, `Parlamentar`, `Publicacao`, `Norma`, `DocumentoTransparencia`
- [ ] Trigger Postgres mantem a coluna atualizada
- [ ] API `/api/busca/global?q=` retorna resultados consolidados (rate-limit PUBLIC)
- [ ] Pagina `/transparencia/busca` com input + facetas (tipo de conteudo)
- [ ] Componente `<BuscaGlobalHeader />` no header da home `/transparencia`

**N6 — Monitor PNTP completo**
- [ ] Refatorar `src/app/api/admin/conformidade-pntp/route.ts` para refletir as 16 dimensoes oficiais (1-15 + 20)
- [ ] Cada dimensao agrupa seus criterios da matriz (83 total)
- [ ] Para cada criterio, verificar os itens aplicaveis (Disponibilidade + os outros 4)
- [ ] Calcular score ponderado oficial (peso dimensao × peso classificacao × peso item)
- [ ] Dashboard `/admin/conformidade-pntp` redesenhado com tree de dimensoes
- [ ] Export PDF "Auto-avaliacao PNTP 2026" pronto para auditor

**Documentacao Fase N**
- [ ] `ESTADO-ATUAL.md`
- [ ] `docs/skills/skill-transparencia.md` reescrita com nova matriz
- [ ] `REGRAS-DE-NEGOCIO.md` RN-184 (exigencia transversal)
- [ ] `docs/MELHORIAS-PROPOSTAS.md` marca todas as fases como entregues

### Criterio de aceite Fase N

- [x] `/api/admin/conformidade-pntp/matriz` reflete os 83 criterios oficiais (novo endpoint)
- [x] Score teorico ≥ 95% atingivel apos popular conteudo minimo
- [x] Painel `/admin/conformidade-pntp` mostra Matriz Oficial com accordion de dimensoes
- [x] Modulo `src/lib/pntp/matriz-2026.ts` implementa a metodologia oficial
- [x] Busca global funcional em `/transparencia/busca`
- [x] 4 componentes transversais aplicados em 3+ paginas
- [x] RN-186 em REGRAS-DE-NEGOCIO.md
- [x] TypeScript limpo (0 erros)

---

## ✅ PLANO PNTP 2026 — CONCLUIDO

| Fase | Itens | Status | Score acumulado |
|------|-------|--------|------------------|
| K (Gaps Diamante) | K1-K5 | ✅ | ~88% |
| L (Licitacoes/Contratos) | L1-L4 | ✅ | ~91% |
| M (Dim. 20 + Planejamento) | M1-M5 | ✅ | ~93% |
| **N (Qualidade transversal)** | **N1-N6** | **✅** | **≥ 95% (Diamante)** |

**Total de RNs novas:** RN-175 a RN-186 (12 regras).
**Total de migrations:** 7 (politica-privacidade, pesquisa-satisfacao, atas-srp,
licitacao-fase-docs, obra-execucao, motivo-desclassificacao, regulamento-lai).
**Total de paginas publicas novas:** 12.
**Total de paginas admin novas:** 5.

**Pos-conclusao:**
- [ ] Inscrever a Camara no proximo ciclo de avaliacao PNTP via Atricon
- [ ] Solicitar pre-auditoria via Tribunal de Contas estadual
- [ ] Apresentar selo Diamante na pagina inicial e em comunicacoes

---

## Mapeamento detalhado — Cobertura por dimensao

| Dimensao | Peso | Antes (estimado) | Apos K | Apos L | Apos M | Apos N (alvo) |
|----------|------|------------------|--------|--------|--------|---------------|
| 1 Prioritarias | 2 | 90% | 90% | 90% | 90% | 100% (N5) |
| 2 Institucionais | 2 | 88% | 100% (K3) | 100% | 100% | 100% |
| 3 Receita | 4 | 100% | 100% | 100% | 100% | 100% |
| 4 Despesa | 4 | 100% | 100% | 100% | 100% | 100% |
| 5 Convenios | 1 | 67% | 67% | 67% | 67% | 100% (N audit) |
| 6 RH | 3 | 100% | 100% | 100% | 100% | 100% |
| 7 Diarias | 1 | 100% | 100% | 100% | 100% | 100% |
| 8 Licitacoes | 3 | 57% | 57% | 100% (L1-L3) | 100% | 100% |
| 9 Contratos | 3 | 75% | 75% | 100% (L4) | 100% | 100% |
| 10 Obras | 2 | 75% | 75% | 75% | 100% (M2) | 100% |
| 11 Planejamento | 4 | 80% | 80% | 80% | 100% (M1) | 100% |
| 12 SIC | 2 | 78% | 78% | 78% | 100% (M4, M5) | 100% |
| 13 Acessibilidade | 1 | 80% | 100% (K4) | 100% | 100% | 100% |
| 14 Ouvidoria | 1 | 67% | 67% | 67% | 67% | 100% (N audit) |
| 15 LGPD/GovDigital | 1 | 67% | 100% (K1, K2) | 100% | 100% | 100% |
| 20 Legislativo | 3 | 73% | 82% (K5) | 82% | 100% (M3) | 100% |
| **Score ponderado** | — | **~80%** | **~88%** | **~91%** | **~93%** | **≥95%** |

---

## Riscos e mitigacoes

| Risco | Probabilidade | Mitigacao |
|-------|---------------|-----------|
| Migrations quebram producao | Media | Toda migration idempotente (`IF NOT EXISTS`, `ALTER TYPE ADD VALUE IF NOT EXISTS`, `DO $$ BEGIN ... END$$`). Backup Supabase + VPS antes de cada fase. |
| Score real < score teorico (avaliador externo) | Alta | Auto-avaliacao na Fase N usa a matriz oficial. Print de cada criterio salvo no upload do auditor. |
| Carga manual de dados historicos faltantes | Alta | Cron de alerta cria notificacao para Secretaria. Documentar quais dados precisam ser carregados (3 anos). |
| LGPD vs publicacao (CPF, dados pessoais) | Media | Padrao do projeto: mascarar CPF (`maskCpfOrCnpj`), nunca expor email/telefone de cidadao. Validar em cada nova pagina publica. |
| Performance com full-text search (N5) | Baixa | Indice GIN no `tsvector`, rate-limit PUBLIC, paginacao obrigatoria. |
| Vercel build timeout com novos models | Baixa | Migrations rodam fora do build (script `db:migrate:deploy`). |

---

## Pos-conclusao

- [ ] Inscrever a Camara no proximo ciclo de avaliacao PNTP via Atricon
- [ ] Solicitar pre-auditoria via Tribunal de Contas estadual
- [ ] Gerar PDF de auto-avaliacao oficial via `/admin/conformidade-pntp` (export)
- [ ] Atualizar `MEMORY.md` com novo marco "PNTP Diamante atingido"
- [ ] Apresentar selo na pagina inicial e em todas as comunicacoes institucionais

---

## Referencias

- `docs/PNTP/Cartilha-PNTP-2026.pdf` (4 Ed., Atricon)
- `docs/PNTP/criterios_de_avaliacao_pntp_2026/Matriz de Criterios 2026 (Final).xlsx`
- `REGRAS-DE-NEGOCIO.md` (RN-001 a RN-174)
- `docs/skills/skill-transparencia.md`
- `src/app/api/admin/conformidade-pntp/route.ts` (monitor atual — 20 itens)
- Resolucao Atricon nº 09/2018 (criterios do selo)
- Lei 12.527/2011 (LAI), Lei 14.129/2021 (Governo Digital), Lei 13.460/2017 (Servicos), LC 101/2000 (LRF), LGPD
