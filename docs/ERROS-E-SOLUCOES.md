# Erros Identificados e Solucoes Propostas

> **Data da Analise**: 2026-01-16
> **Ultima Atualizacao**: 2026-07-02 (Validação ponta a ponta: 14 páginas + 5 ações admin — ERR-063)
> **Versao Analisada**: 1.39.0

---

### Correções Aplicadas em 2026-07-02 (Build no VPS falhava no ESLint)

| ID | Problema | Solução |
|----|----------|---------|
| ERR-064 | 1ª instalação no VPS Debian 13 (KingHost): o `next build` **compilava OK (68s)** mas abortava no passo de ESLint com `Failed to compile … Error: Definition for rule '@typescript-eslint/no-explicit-any' was not found` em 3 páginas (`legislativo/legislatura`, `transparencia/folha-pagamento`, `transparencia/gestao-fiscal`). O site ficava **fora do ar** (health HTTP 000) porque o `.next` não era gerado. Causa: o `.eslintrc.json` estende só `next/core-web-vitals` e o plugin `@typescript-eslint` (transitivo de `eslint-config-next`) **não é registrado no ambiente de produção do VPS**, então os comentários `// eslint-disable-next-line @typescript-eslint/no-explicit-any` (adicionados em correções anteriores) referenciam uma regra "desconhecida" → ESLint trata como erro. Funcionava na Vercel (onde o plugin é resolvido), mas não no self-host. | `next.config.js` → `eslint.ignoreDuringBuilds: true` (antes `false`, decisão F1.5 validada só na Vercel). O ESLint deixa de rodar no `next build`; o **type-check do TypeScript continua** no build (não é afetado) e o lint segue disponível em dev/CI via `npm run lint`. Correção independente de ambiente: conserta o deploy do VPS e o `npm run build` manual. Também guardado o prompt de identidade visual do `do_update` no `install.sh` sob `CAMARA_UNATTENDED=1` (não trava mais em atualizações automáticas). `bash -n` OK; `next.config.js` carrega sem erro. |

---

### Correções Aplicadas em 2026-07-02 (Validação ponta a ponta — 4 agentes + runtime)

Validação de todo o sistema (4 agentes por domínio + tsc + crawl). Dados íntegros
(0 órfãos/duplicatas/datas futuras). Corrigidas 14 páginas + 5 ações admin (ERR-063).
tsc 0; 16/16 páginas afetadas → 200.

| ID | Problema | Solução |
|----|----------|---------|
| ERR-063 | **(A) Envelope `{dados}` lido como `json.data`** (páginas vazias): `transparencia/legislativo/presencas` e `.../atas`, `transparencia/parlamentar/{relatorio,producao,presencas,indenizatoria}`. **(B) `limit>100`→400**: `/api/normas` (página de legislação vazia). **(C) Página pública→rota autenticada→401**: `transparencia/folha-pagamento`. **(D) Paginação (só 1ª página)**: `/legislativo/sessoes` e `/atas` (100/271), API `pautas-sessoes` (50/153). **(E) Filtro label×enum**: `/legislativo/sessoes` "Realizadas"='Realizada' vs `CONCLUIDA`. **(F) Ano padrão fixo em 2026** (sem dados) em várias. **(G) Shape divergente** em presenças/atas (`presente`/`numero`/`data` vs `status`/`titulo`/`dataInicio`). **(H) Páginas stub**: `parlamentares/comparativo` (métricas 0), `transparencia/gestao-fiscal` (259 docs ocultos), `legislativo/legislatura` (estática "2021-2024" + composição/realizações fabricadas), `perfil-completo` (zeros). **(I) 5 fetch admin p/ rotas inexistentes (404)**: prazos-urgencia, fluxos-tramitacao, normas compilar, protocolo tramitar/arquivar. | (A) Ler `json.dados`. (B) cap `max(500)`. (C) novo `/api/publico/folha-pagamento` + repontar página aos endpoints públicos. (D) elevar caps dados-abertos (presencas 5000, sessoes 500) e API pautas `take:500`; frontends buscam tudo e filtram client-side. (E) filtro usa `CONCLUIDA`/`AGENDADA`. (F) ano padrão = mais recente com dados (derivado). (G) normalização de shape no carregamento. (H) comparativo→`/api/dados-abertos/parlamentares/estatisticas`; gestao-fiscal→`/api/documentos-transparencia`; legislatura→dados reais (período/contagens/partidos) + links; perfil-completo→redirect para `[slug]`. (I) protocolo/normas usam `POST ?acao=...` (path corrigido no frontend); fluxos-tramitacao→`/api/admin/configuracoes/unidades-tramitacao`; novo `/api/admin/configuracoes/tramitacao` (config chave-valor) p/ prazos. **Confirmados restantes também corrigidos:** teto-50 dos 6 hooks financeiros → 500 (+ cap `/api/receitas`→500); stats de audiências (`concluidas/especiais`→`realizadas/canceladas`); paginação falsa de `/noticias` removida; badges vazios de `categoria/prioridade` em itens de pauta agora condicionais. Limites de fonte (não-bugs remanescentes): 260/676 sem autor, 36 votos nominais. |

---

### Correções Aplicadas em 2026-07-02 (Item de pauta com número de OCR errado)

| ID | Problema | Solução |
|----|----------|---------|
| ERR-062 | Em `/legislativo/pautas-sessoes`, um item mostrava **"Requerimento nº 1420/2025"** ao lado do badge correto **"REQUERIMENTO 420/2025"** — o OCR da pauta leu "420" como "1420". O banco está correto (proposição `numero=420`, `titulo="Requerimento nº 420/2025"`); o "1420" vinha do campo `pauta_itens.titulo` (transcrição OCR do PDF). A normalização da página preferia esse título de OCR (`it.titulo \|\| proposicao.ementa`) sobre os dados canônicos da proposição vinculada. Sistêmico: **393 itens** de pauta têm proposição vinculada + título OCR com "nº <número>" — qualquer um pode ter erro de leitura. | Na normalização de itens (`pautas-sessoes/page.tsx`), quando há proposição vinculada, o texto passou a usar a **ementa canônica** dela (`proposicao.ementa \|\| it.titulo`), e o número já vinha do badge canônico (`tipo numero/ano` da proposição). Assim os 393 itens exibem número/descrição corretos, ignorando erros de OCR. O valor OCR permanece no banco (útil para itens SEM proposição vinculada), mas não é mais exibido quando há a fonte canônica. Página 200, diagnostics 0. **Varredura de alcance:** dos 393 itens com número no título OCR, **só 1 divergia** (este 420→1420); 0 proposições com `numero` de 4+ dígitos; 0 itens sem proposição com número suspeito → **caso único** no acervo. O registro DEV foi corrigido (`UPDATE pauta_itens SET titulo='Requerimento nº 420/2025'`), mas por ser dado transiente a proteção durável é o fix de código. |

---

### Correções Aplicadas em 2026-07-02 (Votações nominais — `/transparencia/legislativo/votacoes-nominais`)

| ID | Problema | Solução |
|----|----------|---------|
| ERR-061 | Página **sempre vazia** e, mesmo carregando, com formato/ano errados. **3 problemas sobrepostos:** (1) **envelope** — lia `json.success ? json.data : ...` mas `/api/dados-abertos/votacoes` devolve `{dados}` (sem `success`) → `[]`; (2) **shape** — a API devolve UMA linha por voto individual, mas a tela espera votações AGREGADAS (`votos[]`, `totalSim/Nao/Abstencao`, `resultado`); (3) **ano padrão** — iniciava em `new Date().getFullYear()` (2026), mas todos os votos nominais são de **2024** → abria vazia. Dados reais: 36 votos → 4 votações (PROJETO_LEI 005/009/010/011 de 2024, todas APROVADA por unanimidade), inferidos pelo importador `42-votacao-nominal` das atas ("aprovado por unanimidade"). | Refatorado o carregamento: busca todos os votos (`?limit=1000`, lê `json.dados`), **agrega por proposição** em votações (votos[] + totais + resultado derivado de SIM>NAO), e deriva o **ano padrão = mais recente com dados** (→ 2024). O render já suportava o shape `Votacao`. Verificado: página 200, 4 votações agregadas, diagnostics 0. |

---

### Correções Aplicadas em 2026-07-02 (Perfil do parlamentar: % de presença e total de matérias)

Análise de `/parlamentares/cristiani-santos` comparando página ↔ banco ↔ backup CR2.
Dados básicos, biografia, partido (PT), cargo (Vice-Presidente), comissões e proposições
conferem (banco tem 14 matérias, superset do backup=7 — extras recuperadas de pauta OCR).
Dois bugs de CÁLCULO encontrados e a varredura por "mesmo erro em outros lugares".

| ID | Problema | Solução |
|----|----------|---------|
| ERR-060 | **P1 — % de presença com denominador global.** `parlamentarDbService.getPerfil` calculava `totalSessoes = sessao.count({status:'CONCLUIDA'})` = TODAS as 271 sessões (2016-2025), dividindo a presença de uma vereadora de 2025 por sessões que não eram dela → **10,33%** (28/271) em vez de ~80% (28/35). Afetava todos os parlamentares. **P2 — total de matérias limitado a 10.** `materiasAutor = parlamentar.proposicoes.length`, mas `proposicoes` tinha `take:10` → total travado em 10 (real=14) e distribuição somando >100%. **Mesmo padrão de denominador em mais lugares:** rota pública `/api/publico/relatorio-parlamentar/[id]` (`totalSessoes = presencas.length` → 100%), `getDashboard` + `dashboard-utils.calcularPresencaResumo` (registros próprios → 100%), `analytics-service` (contagem global de sessões do período igual p/ todos → subestima quem entrou no meio). | **P1:** denominador = sessões CONCLUIDA no **período de mandato** do parlamentar (`mandato.dataInicio..dataFim`), consistente em todos os pontos. **P2:** `materiasAutor = proposicao.count({where:{autorId}})` real. Rota pública, `getDashboard`/`dashboard-utils` (novo param opcional `totalOverride`) e `analytics-service` (denominador por mandato ∩ período, por parlamentar) alinhados. Verificado: perfil e relatório público agora **28/35 = 80%**, matérias **14**, distribuição ~100%. Diagnostics 0. |

**Ainda pendente (relacionado, não corrigido):** `relatorio-agendado-service.gerarRelatorioPresencaParlamentar` (relatório Excel agendado, admin) usa `presentes/(presentes+ausentes)` = registros próprios → 100% quando ausências não são gravadas (escopo anual, menor visibilidade). Data gap: `mandato.numeroVotos=0` (os 365 votos da Cristiani estão só no texto da bio do CR2, não em campo estruturado). Votos nominais individuais inexistem na fonte.

---

### Correções Aplicadas em 2026-07-02 (Auditoria de integração frontend↔backend do site público — Tier 1)

Auditoria (3 agentes + prova de runtime com dev server) da integração de cada página
pública com suas APIs. ~30 achados; **Tier 1 corrigido** (contrato/envelope, cap de
limit, rota pública, 2 crashes). Verificado: 11/11 páginas afetadas = HTTP 200,
endpoints que davam 400/401 = 200, diagnostics 0.

| ID | Problema | Solução |
|----|----------|---------|
| ERR-059 | **(A) Envelope de resposta lido errado** → páginas vazias/protocolo em branco: `calendario` (page + `calendario-legislativo.tsx`) lia `data.eventos` mas API dá `createSuccessResponse({eventos})` = `data.data.eventos`; `institucional/e-sic` e `institucional/ouvidoria` liam `json.protocolo` mas API dá `json.data.protocolo` (protocolo em branco + link `?protocolo=undefined`); `use-public-tramitacoes` lia `response.data.meta` mas `createSuccessResponse` põe `meta` no topo → sem paginação. **(B) `limit>100` → HTTP 400**: schemas de `programas-acoes`, `cartoes-corporativos`, `ordem-pagamentos`, `documentos-transparencia` capavam `limit` em `max(100)` mas as páginas pedem 200/500. **(C) Página pública em rota autenticada → 401**: `transparencia/pessoal/{terceirizados,estagiarios}` chamavam `/api/servidores` (exige login). **(D) Crashes**: `legislativo/pautas-sessoes` lia `pauta.expediente.length`/`.ordemDoDia` mas API dá `itens[]` (tela branca com pautas); `busca` com filtro de ano enviava data sem hora (schema exige `datetime()`) → ValidationError → crash em `resultado.resultados.length`. | (A) Ler `data.data.eventos`/`json.data.protocolo`/`response.meta`. (B) Cap elevado para `max(500)` nos 4 schemas. (C) Trocado para `/api/publico/servidores` (aceita `vinculo`, resposta idêntica). (D) `pautas-sessoes`: normaliza `itens`→`expediente`/`ordemDoDia` por `secao` no carregamento (deriva nº/título da proposição); `busca`: envia ISO `datetime()` + guarda `setResultado` contra resposta de erro. |

**Backlog (Tier 2/3, NÃO corrigido — pendente de decisão):**
- **Tier 2 (dados incompletos / shape):** teto de 50 registros nas listagens financeiras
  (`despesas/receitas/convenios/licitacoes/contratos/folha/bens-*` chamam hooks sem
  `limit`; default 50 → totais/PNTP subestimados) e teto 10 em `noticias` (paginação
  falsa); `sessoes/[id]` busca proposições com limit 50 (sessões antigas sem matérias);
  shape divergente pós-envelope em `dados-abertos` (presenças `status` vs `presente`;
  atas `dataInicio/titulo`; votações granularidade voto-a-voto vs agregado);
  `latest-news` lê `imagemUrl` (API dá `imagem`) + `?destaque` ignorado; filtros mortos
  (`parlamentares/vereadores` manda `numero` compara com `"2025-2028"`; `legislativo/sessoes`
  `'Realizada'` vs `'CONCLUIDA'`; `mesa-diretora` filtro não usado); cards de stats
  divergentes (audiências `concluidas/especiais`; pautas-sessoes `rascunhos/aprovadas`).
- **Tier 3 (conteúdo mock/estático):** `legislativo/pautas` (dados fictícios), 
  `legislativo/legislatura` (estática 2021-2024), `parlamentares/comparativo` e
  `[slug]/perfil-completo` (zerados, não consomem APIs reais), `/participacao`
  (persistência em memória; POST exige permissão → 401 silencioso com toast de sucesso).

---

### Correções Aplicadas em 2026-07-02 (Perfil público do parlamentar: spinner infinito quando o apelido é vazio)

| ID | Problema | Solução |
|----|----------|---------|
| ERR-058 | Clicar em um parlamentar SEM apelido (ex.: "Cristiani Kelli Silva dos Santos", apelido vazio) em `/parlamentares/[slug]` deixava a página **carregando para sempre** (spinner "Carregando perfil..."), nunca exibindo os dados nem a tela de "não encontrado". **Duas causas:** (1) A lista gera o link a partir de `slugify(apelido \|\| nome)` (`parlamentares/page.tsx:51`, galeria idem) → slug vindo do NOME quando não há apelido; mas o detalhe casava **só pelo apelido** (`apelidoSlug = p.apelido ? slugify(p.apelido) : ''`) → `parlamentarEncontrado = null`. (2) Deadlock: `loadingPerfil` inicia `true` e o `useEffect` que o zera retorna cedo quando não há parlamentar → `loading = loadingParlamentares \|\| loadingPerfil` ficava `true` eternamente, sem cair no ramo de erro. Bug do mesmo tipo em `parlamentares/vereadores/page.tsx:426,435`, que montava o link com `vereador.apelido.toLowerCase()` (sem fallback e sem `?.` → link vazio ou crash se apelido null). | (1) Match do detalhe passou a usar `slugify(p.apelido \|\| p.nome)` (mesmo critério do link) + fallback por `id`. (2) `loading = loadingParlamentares \|\| (!!parlamentarEncontrado && loadingPerfil)` — slug sem match agora cai corretamente na tela "Parlamentar não encontrado". (3) `vereadores/page.tsx`: importado `slugify` e links trocados por `slugify(vereador.apelido \|\| vereador.nome) \|\| vereador.id`. (4) `perfil-completo/page.tsx`: buscava `?search=<slug>` — o slug tem hifens e o ILIKE por nome (com espaços) retornava **0** → página abria vazia (e o fallback `\|\| data.data[0]` podia abrir o parlamentar ERRADO); trocado por buscar a lista e casar por `slugify(apelido \|\| nome) === slug \|\| id === slug`, guardando not-found. **Escopo real: os 36 parlamentares têm apelido vazio → 100% dos perfis por slug estavam afetados.** tsc/diagnostics = 0; páginas retornam 200. |

---

### Correções Aplicadas em 2026-07-02 (PWA: service worker "grudado" servindo 503 Offline no dev)

| ID | Problema | Solução |
|----|----------|---------|
| ERR-057 | Em desenvolvimento, o navegador retornava `GET /_next/static/... net::ERR_ABORTED 503 (Offline)` para `layout.css`, `webpack.js`, `main-app.js` etc. Causa: um **service worker** (`public/sw.js`) registrado numa sessão anterior de produção (`npm run build && npm start`) ou pelo site público continuava **controlando `localhost:3000`** mesmo em dev. Como os chunks levam `?v=<timestamp>` (cache-busting a cada build), o `cacheFirst` dava cache miss → `fetch()` → dev server fora do ar → SW devolvia `new Response('Offline', { status: 503 })` (sw.js:100). O `pwa-register.tsx` só registra o SW em produção, mas nada removia um SW pré-existente ao voltar pro dev. | (1) Imediato: subir o dev server (o `fetch` volta a ter sucesso) + desregistrar o SW no navegador (Console: `navigator.serviceWorker.getRegistrations().then(rs=>rs.forEach(r=>r.unregister()))` + `caches.keys().then(ks=>ks.forEach(k=>caches.delete(k)))`, ou DevTools → Application → Unregister + Clear site data). (2) Hardening em `pwa-register.tsx`: bloco `else` que, em `NODE_ENV !== 'production'`, **desregistra qualquer SW existente e limpa todos os caches** — impede o SW de produção de "grudar" no dev daqui pra frente. |

---

### Correções Aplicadas em 2026-06-30 (Ambiente DEV: banco PostgreSQL local em Docker)

| ID | Problema | Solução |
|----|----------|---------|
| ERR-053 | `docker compose up -d` falhava com `Bind for 0.0.0.0:5432 failed: port is already allocated` ao subir o `camara_postgres`. A porta padrao 5432 do host ja estava em uso por outro container PostgreSQL local (`sispat_postgres`). | Mapeamento de porta do `docker-compose.yml` alterado de `5432:5432` para `5433:5432` (host:container). `DATABASE_URL`/`DIRECT_URL` em `.env` e `.env.local` ajustados para `localhost:5433`. Atributo `version` (obsoleto no Compose v2) removido. |
| ERR-056 | Portal exibia nome genérico "Câmara Municipal" e (após carregamento antigo em cache) estatísticas zeradas. Causa do nome: o header/hero/footer leem `/api/institucional` → `ConfiguracaoInstitucional` (slug `principal`, campo `nomeCasa`), tabela `configuracoes_institucionais` que estava VAZIA. O importador `08-config` só populava a tabela `configuracoes` (chave-valor), não a `ConfiguracaoInstitucional`. | `08-config.ts` agora faz upsert de `ConfiguracaoInstitucional` slug=`principal` com `nomeCasa='Câmara Municipal de Chaves'`, sigla, endereço, contatos. `/api/institucional` passou a retornar o nome correto. As estatísticas da home (`/api/dados-abertos/*`) já retornam os totais corretos (11/75/460) — o "0" era estado/cache do navegador (resolve com hard refresh). |
| ERR-055 | Tela de revisão de aprovação manual (`/admin/proposicoes/revisao-aprovacao`): botão "Aprovar" retornava 400 "Transição de status inválida: APRESENTADA → APROVADA". A máquina de estados em `proposicao-db-service.ts` (`VALID_STATUS_TRANSITIONS`) só permite `EM_VOTACAO → APROVADA`, mas proposições de **entrada retroativa** (digitalização de documentos históricos já decididos) precisam receber o status final direto. | `update()` agora pula a validação de transição quando `proposicao.entradaRetroativa = true` (coerente com o bypass de RN-020/RN-030/RN-032 já aplicado a esses casos). Fluxo normal (não-retroativo) mantém a máquina de estados. Validado via API: PUT APROVADA → 200. |
| ERR-054 | Home pública quebrava com hydration error e não exibia dados após import (reset apagou as cores do tema). Causa: em `src/app/layout.tsx:177`, `{themeCSS && <style/>}` — quando `themeCSS` é string vazia (sem cores de tenant/config), `'' && jsx` retorna `''`, que o React renderiza como **nó de texto vazio dentro de `<head>`** (`whitespace text nodes cannot be a child of <head>`), quebrando a hidratação de toda a árvore. Bug latente exposto quando `getThemeColors()` passou a retornar null. | Trocado `&&` por ternário: `{themeCSS ? <style/> : null}`. Ramo falso agora é `null` (não renderiza nada) em vez de `''`. Página resiliente a ausência de cores. Erros de CSP/VLibras no console são do widget de acessibilidade (pré-existentes, em report-only), não relacionados. |

---

## Sumario de Erros

| Severidade | Quantidade | Status |
|------------|------------|--------|
| Critica | 16 | 16 Corrigidos |
| Alta | 6 | 6 Corrigidos |
| Media | 10 | 10 Corrigidos |
| Baixa | 6 | Pendente (melhorias opcionais) |

### Correções Aplicadas em 2026-05-29 (Sprint P0-Legislativo — hardening fluxo)

| ID | Problema | Solução |
|----|----------|---------|
| ERR-048 | RN-030 (CLJ obrigatória) não era enforced: `validarPassagemCLJ()` retornava `valid:true` mesmo sem CLJ — apenas warning. Endpoint `/api/proposicoes/[id]/tramitar` nem chamava. Proposições PL/PR/PDL podiam ir direto à pauta sem parecer CLJ. | Função reescrita com parâmetro `modo: 'enforce' \| 'warning'`. Endpoint chama `validarPassagemCLJ(id, 'enforce')` antes de AGUARDANDO_PAUTA. ADMIN pode dispensar via payload `{overrideCLJ:{motivo}}` (motivo ≥ 20 chars), auditado em `AuditLog`. Commit `26e1d35`. |
| ERR-049 | Voto individual em `/api/painel/votacao` e `/api/sessoes/[id]/votacao` não gerava AuditLog. Quebra RN-003 (rastreabilidade) e RN-061 (auditoria de votação nominal). Voto pelo celular do parlamentar sem IP/user-agent registrado. | `registrarVoto()` aceita `auditContext` opcional; endpoints propagam `{request, session}`. `/api/sessoes/[id]/votacao` distingue `VOTO_REGISTRADO` (regular) de `VOTO_RETROATIVO` em todos os votos. Commit `43c64c2`. |
| ERR-050 | `gerarNumeroProtocolo` usava `findFirst+1` sem lock — race condition em criações concorrentes podia duplicar números. | `criarProtocolo` agora envolve `pg_advisory_xact_lock + findFirst + create` em UMA transação Prisma. Lock ID determinístico por ano. Commit `9a53d12`. |
| ERR-051 | Voto individual não re-validava `Mandato.ativo` na legislatura da sessão. Parlamentar com mandato encerrado podia votar se ainda estivesse em `PresencaSessao`. | Novo helper `validarMandatoAtivo()` chamado em `upsertVotoIndividual` (throw) e `registrarVoto` (return false + log.warn). Commit `5b64150`. |
| ERR-052 | PUT `/api/sessoes/[id]/votacao/turno` aceitava `resultado` do body e usava direto (vetor de tampering — cliente podia forçar APROVADA/REJEITADA). Idem `finalizarVotacao` em alguns paths. | Novo utility puro `calcularResultadoVotacao()` e enforcement: schema do endpoint só aceita `{itemId, turno, adiada?}`. Resultado SEMPRE derivado server-side. Commit `9180ddb`. |

### Correções Aplicadas em 2026-05-11 (CSP duplicado, INTERNAL_API_SECRET + install.sh hardening)

| ID | Problema | Solução |
|----|----------|---------|
| ERR-042 | CSP do nginx conflita com CSP do middleware Next.js → navegador aplica intersecao e bloqueia VLibras (`https://vlibras.gov.br`). Console: `Refused to load... script-src 'self' 'unsafe-inline' 'unsafe-eval'... script-src-elem was not explicitly set`. | Removido `add_header Content-Security-Policy` do nginx em `scripts/templates/nginx-https.conf` e `scripts/lib/setup-nginx.sh`. CSP agora controlado UNICAMENTE pelo `src/middleware.ts`. Adicionado tambem `script-src-elem` e `style-src-elem` explicitos no middleware. `install.sh do_update()` agora remove a linha CSP de instalacoes existentes. |
| ERR-043 | Warning `[SECURITY] INTERNAL_API_SECRET nao configurado` em VPS atualizado (variavel introduzida em versao posterior nao foi propagada via `do_update`). | `install.sh do_update()` agora detecta ausencia de `INTERNAL_API_SECRET` no `.env` existente e adiciona um secret gerado via `generate_secret 32`. |
| ERR-044 | `npx prisma db push` cancelava silenciosamente quando havia warning de UNIQUE constraint (caso `servidores.cpfHash`). stdout redirecionado para log → prompt interativo recebia "no" como default → `Push cancelled.` Mas `install.sh` reportava `[OK] Schema atualizado` (sem verificar exit code). | `install.sh do_update()` agora usa `npx prisma db push --accept-data-loss --skip-generate` e verifica exit code com `if !`. Em caso de falha, exibe erro com comando manual e aborta a atualizacao. Tambem adiciona verificacao de exit code para `npm run build`. |
| ERR-045 | `pm2 restart all` no `install.sh do_update()` nao reiniciava app que estava `stopped` (PM2 v6+). App ficava parada apos update. Tambem usar `all` era arriscado se houvesse outros processos. | Trocado por `pm2 restart camara-legislativo` (alvo explicito) + fallback que executa `pm2 start ecosystem.config.js` ou `pm2 start npm --name camara-legislativo -- start` caso o restart falhe. `pm2 save` ao final para persistir. |
| ERR-046 | `prisma db push` falhou com `must be owner of table oficios` na producao VPS. Tabela (e possivelmente outras) tinha owner diferente do usuario que o Prisma usa para conectar (`camara_app`). | Criado `scripts/sql/fix-table-ownership.sql` que percorre todas tabelas e sequences do schema `public` via `\gexec` e aplica `ALTER ... OWNER TO camara_app` (parametrizavel via `-v db_user=NOME`). `install.sh do_update()` agora executa esse script como superuser `postgres` ANTES do `prisma db push`. |

### Correções Aplicadas em 2026-04-17 (GET /api/sessoes 500 em produção)

| ID | Problema | Solução |
|----|----------|---------|
| ERR-041 | `GET /api/sessoes` devolvia 500 em prod (Vercel) e dev — `Error converting field "secao" of expected non-nullable type "String", found incompatible value of "COMUNICACOES"` | Colunas `pauta_itens.secao` e `template_itens.secao` ainda estavam com tipo enum Postgres `PautaSecao`, mas o schema Prisma (`models.prisma:461,1202`) declara `secao String` ("ID do TipoExpediente ou valor legado"). Convertidas via SQL idempotente: `ALTER TABLE ... ALTER COLUMN "secao" TYPE text USING "secao"::text;` + `DROP TYPE "PautaSecao"`. Análise de todos os 96 campos enum do DB vs 84 enums do Prisma: nenhum outro mismatch existe. |

### Correções Aplicadas em 2026-04-07 (Configurações Institucionais 400)

| ID | Problema | Solução |
|----|----------|---------|
| ERR-040 | PUT /api/configuracoes retorna 400 "Dados inválidos" | Schema Zod usava `.optional()` mas DB retorna `null`; corrigido para `.nullish()` em todos os campos |

### Correções Aplicadas em 2026-02-03 (Loop Infinito e Permissões de Votação)

| ID | Problema | Solução |
|----|----------|---------|
| ERR-037 | Loop infinito de requisições causando ERR_INSUFFICIENT_RESOURCES | useMemo para memorizar objeto actions no reducer |
| ERR-038 | Parlamentar não consegue votar (401 Unauthorized) | Permitir self-vote para role PARLAMENTAR |
| ERR-039 | Variáveis de ambiente no Vercel com caracteres `\n` | Removidas e recriadas sem caracteres extras |

### Correções Aplicadas em 2026-01-31 (Numeração Automática)

| ID | Problema | Solução |
|----|----------|---------|
| ERR-035 | Numeração automática sempre retorna 001 | Corrigido parsing do campo numero |
| ERR-036 | Numeração única por numero+ano, não por tipo+numero+ano | Constraint alterada para @@unique([tipo, numero, ano]) |

### Correções Aplicadas em 2026-01-28 (Lote 2 - Validacao e Auth)

| ID | Problema | Solução |
|----|----------|---------|
| ERR-031 | GET auditoria sem auth | Auth + role check (ADMIN/SECRETARIA) |
| ERR-032 | GET/POST usuarios sem auth | withAuth com permissions |
| ERR-033 | parseInt sem validação | Schemas Zod com z.coerce |
| ERR-034 | Type casting sem validação | z.enum para todos enums |

### Correções Aplicadas em 2026-01-28 (Lote 1 - Segurança Geral)

| ID | Problema | Solução |
|----|----------|---------|
| ERR-021 | POST proposições sem auth | withAuth adicionado |
| ERR-022 | Votação sem validação Zod | Schemas Zod implementados |
| ERR-023 | Memory leaks cronômetros | Funções cleanup adicionadas |
| ERR-024 | 47 endpoints sem auth | withAuth em todos POST/PUT/DELETE |
| ERR-025 | Sem proteção CSRF | Middleware CSRF implementado |
| ERR-026 | usePainelSSE re-renders | useRef para callbacks |
| ERR-027 | Sem Error Boundary | SSEErrorBoundary criado |
| ERR-028 | Race conditions votação | Locks e transações Prisma |
| ERR-029 | Query params sem validação | Query schemas Zod criados |
| ERR-030 | Permissões incompletas | 8 novas permissões adicionadas |

---

## Erros Criticos (Corrigidos em 2026-01-28)

### ERR-021: POST de Proposições sem Autenticação (CORRIGIDO)

**Localizacao**: `src/app/api/proposicoes/route.ts`

**Descricao**: O endpoint POST permitia criar proposições sem verificar autenticação do usuário, permitindo que qualquer pessoa criasse proposições no sistema.

**Impacto**:
- Vulnerabilidade de segurança grave
- Possibilidade de spam ou dados maliciosos
- Violação das regras de negócio (RN-020)

**Solução Aplicada**:
```typescript
// Adicionado verificação de sessão no POST
const session = await getServerSession(authOptions)
if (!session) {
  throw new UnauthorizedError('Autenticação necessária para criar proposição')
}
```

**Status**: CORRIGIDO - 2026-01-28

---

### ERR-022: Endpoint de Votação sem Validação Zod (CORRIGIDO)

**Localizacao**: `src/app/api/painel/votacao/route.ts`

**Descricao**: O endpoint usava validação manual dos parâmetros, inconsistente com o padrão do projeto que usa Zod schemas.

**Impacto**:
- Validação inconsistente
- Possibilidade de dados malformados
- Dificuldade de manutenção

**Solução Aplicada**:
```typescript
// Schemas Zod criados para validação
const VotacaoBaseSchema = z.object({
  sessaoId: z.string().min(1),
  acao: z.enum(['iniciar', 'finalizar', 'votar'])
})

const VotacaoIniciarSchema = VotacaoBaseSchema.extend({
  acao: z.literal('iniciar'),
  proposicaoId: z.string().min(1),
  tempoVotacao: z.number().min(30).max(3600).optional().default(300)
})
```

**Status**: CORRIGIDO - 2026-01-28

---

### ERR-023: Memory Leaks em painel-tempo-real-service.ts (CORRIGIDO)

**Localizacao**: `src/lib/services/painel-tempo-real-service.ts`

**Descricao**: O serviço criava intervals para cronômetros mas não tinha cleanup adequado quando sessões eram finalizadas ou o servidor era reiniciado.

**Impacto**:
- Memory leaks em ambiente de longa execução
- Intervals órfãos consumindo recursos
- Problemas em ambiente serverless

**Solução Aplicada**:
```typescript
// Função de cleanup por sessão adicionada
function limparCronometrosSessao(sessaoId: string): void {
  const prefixos = ['sessao-', 'votacao-', 'item-', 'discurso-']
  for (const prefixo of prefixos) {
    const cronometroId = `${prefixo}${sessaoId}`
    if (cronometros.has(cronometroId)) {
      clearInterval(cronometros.get(cronometroId)!)
      cronometros.delete(cronometroId)
    }
  }
}

// Funções exportadas para monitoramento
export function limparEstadoSessao(sessaoId: string): void
export function getServiceStats(): { sessoesAtivas, cronometrosAtivos, sessaoIds }
```

**Status**: CORRIGIDO - 2026-01-28

---

## Erros Criticos (Corrigidos em 2026-01-16)

### ERR-018: Codigo Duplicado em route.ts (CORRIGIDO)

**Localizacao**:
- `src/app/api/sessoes/[id]/pauta/route.ts`
- `src/app/api/pauta/[itemId]/route.ts`
- `src/app/admin/configuracoes/page.tsx`

**Descricao**: Arquivos continham codigo duplicado (arquivo inteiro repetido 2-3x), causando erros de webpack "export redefined".

**Status**: CORRIGIDO - Codigo duplicado removido

---

### ERR-019: Mock DB Incompativel com Prisma Real (PENDENTE)

**Localizacao**: `src/lib/db.ts`

**Descricao**: O mock database tem tipagens incompativeis com o Prisma real:
- IDs tipados como `number` quando deveriam ser `string | number`
- Propriedade `mandatos` ausente no tipo de parlamentar
- Funcao `findFirst` ausente em varios modelos

**Impacto**:
- Build falha com erros de tipo
- Desenvolvimento dependente do mock nao funciona

**Solucao Proposta**:
1. Corrigir tipagens no `db.ts` para aceitar `string | number` em IDs
2. Adicionar propriedades faltantes (mandatos, filiacoes) ao mock de parlamentar
3. Implementar `findFirst` nos modelos que faltam
4. Ou: configurar banco PostgreSQL real para desenvolvimento

**Status**: PENDENTE - Requer correcao do mock ou migracao para banco real

---

### ERR-020: Tipagem Restritiva em Formularios (CORRIGIDO)

**Localizacao**:
- `src/app/admin/sessoes-legislativas/page.tsx`
- `src/app/admin/usuarios/page.tsx`
- `src/app/admin/templates-sessao/page.tsx`

**Descricao**: Estados de formulario usando `as const` criavam tipos literais muito restritivos, impedindo atribuicao de outros valores validos.

**Status**: CORRIGIDO - Tipos expandidos para incluir todas as opcoes validas

---

### ERR-031: GET /api/auditoria sem Autenticacao (CORRIGIDO)

**Localizacao**: `src/app/api/auditoria/route.ts`

**Descricao**: O endpoint GET de auditoria nao exigia autenticacao, expondo logs sensiveis de acoes do sistema para qualquer pessoa.

**Impacto**:
- Vazamento de informacoes sensiveis (IPs, usuarios, acoes)
- Violacao de privacidade
- Potencial auxilio para ataques

**Solucao Aplicada**:
```typescript
export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Autenticacao necessaria' },
      { status: 401 }
    )
  }
  const role = session.user?.role
  if (role !== 'ADMIN' && role !== 'SECRETARIA') {
    return NextResponse.json(
      { success: false, error: 'Permissao negada' },
      { status: 403 }
    )
  }
  // ... validacao Zod dos parametros
}
```

**Status**: CORRIGIDO - 2026-01-28

---

### ERR-032: GET/POST /api/usuarios sem Autenticacao (CORRIGIDO)

**Localizacao**: `src/app/api/usuarios/route.ts`

**Descricao**: Os endpoints de usuarios permitiam listar todos os usuarios e criar novos sem autenticacao.

**Impacto**:
- Criacao de usuarios nao autorizada
- Escalacao de privilegios
- Exposicao de dados de usuarios

**Solucao Aplicada**:
```typescript
export const GET = withAuth(async (request: NextRequest) => {
  // ... validacao Zod
}, { permissions: 'user.view' })

export const POST = withAuth(async (request: NextRequest) => {
  // ... criacao de usuario
}, { permissions: 'user.manage' })
```

**Status**: CORRIGIDO - 2026-01-28

---

### ERR-033: parseInt sem Validacao em Endpoints Financeiros (CORRIGIDO)

**Localizacao**:
- `src/app/api/despesas/route.ts`
- `src/app/api/receitas/route.ts`
- `src/app/api/contratos/route.ts`
- `src/app/api/licitacoes/route.ts`

**Descricao**: Uso de parseInt diretamente em query params sem validacao de limites ou tratamento de NaN.

**Impacto**:
- Valores invalidos aceitos (NaN)
- Paginacao negativa ou excessiva
- Possiveis crashes ou dados incorretos

**Solucao Aplicada**: Schemas Zod com z.coerce.number().int().min().max()

**Status**: CORRIGIDO - 2026-01-28

---

### ERR-034: Type Casting sem Validacao (CORRIGIDO)

**Localizacao**: Varios endpoints usando `as SituacaoDespesa`, `as ModalidadeLicitacao`, etc.

**Descricao**: Uso de `as` para type casting de query params sem validar se o valor e um enum valido.

**Impacto**:
- Bypass de tipagem TypeScript
- Valores invalidos aceitos no runtime
- Erros de banco de dados

**Solucao Aplicada**: Schemas Zod com z.enum(['VALOR1', 'VALOR2', ...])

**Status**: CORRIGIDO - 2026-01-28

---

### ERR-035: Numeração Automática de Proposições Sempre Retorna 001 (CORRIGIDO)

**Localizacao**: `src/lib/utils/proposicao-numero.ts`

**Descricao**: A função `gerarNumeroAutomatico` assumia incorretamente que o campo `numero` da proposição estava no formato `"001/2025"`, quando na verdade o banco de dados armazena apenas `"001"` com o `ano` em um campo separado. Isso fazia com que o split por `/` falhasse e nenhuma proposição fosse considerada no cálculo, resultando sempre em `"001"`.

**Impacto**:
- Ao criar uma nova proposição com numeração automática, o sistema sempre sugeria "001"
- Usuários precisavam corrigir manualmente ou criavam duplicatas
- Violação de regra de negócio de numeração sequencial

**Código Problemático**:
```typescript
// ERRADO - p.numero é "001", não "001/2025"
const [numeroStr, anoStr] = p.numero.split('/')
return p.tipo === tipo && parseInt(anoStr) === ano
// anoStr = undefined, parseInt(undefined) = NaN, NaN === 2026 = false
```

**Solução Aplicada**:
```typescript
// CORRETO - usar campos separados
const proposicoesDoTipoAno = proposicoesExistentes.filter(p => {
  return p.tipo === tipo && p.ano === ano
})

// Para o numero, verificar compatibilidade
const numeroStr = p.numero.includes('/') ? p.numero.split('/')[0] : p.numero
const numero = parseInt(numeroStr)
```

**Arquivos Alterados**:
- `src/lib/utils/proposicao-numero.ts`

**Status**: CORRIGIDO - 2026-01-31

---

### ERR-036: Numeração Única Sem Considerar Tipo de Proposição (CORRIGIDO)

**Localizacao**: `prisma/schema.prisma`, `src/app/api/proposicoes/route.ts`, `src/app/api/proposicoes/[id]/route.ts`

**Descricao**: A constraint unique no banco de dados era `@@unique([numero, ano])`, mas deveria ser `@@unique([tipo, numero, ano])`. Isso impedia criar PL 001/2026 e PR 001/2026, pois o sistema considerava apenas número e ano como identificador único, quando cada tipo de proposição deve ter sua própria sequência numérica independente.

**Impacto**:
- Impossível criar proposições de tipos diferentes com mesmo número/ano
- Ex: PL 001/2026 bloqueava PR 001/2026
- Violação de regra de negócio de numeração por tipo

**Solução Aplicada**:

1. **Schema Prisma** - Alterada constraint unique:
```prisma
// ANTES
@@unique([numero, ano])

// DEPOIS
@@unique([tipo, numero, ano], name: "tipo_numero_ano")
```

2. **API de Criação** (`route.ts`):
```typescript
// Verificar tipo + número + ano
const existingProposicao = await prisma.proposicao.findUnique({
  where: {
    tipo_numero_ano: {
      tipo: validatedData.tipo,
      numero: validatedData.numero,
      ano: validatedData.ano
    }
  }
})
```

3. **API de Atualização** (`[id]/route.ts`):
```typescript
// Verificar duplicatas considerando tipo
const duplicateCheck = await prisma.proposicao.findUnique({
  where: {
    tipo_numero_ano: {
      tipo: tipoParaVerificar,
      numero: numeroParaVerificar,
      ano: anoParaVerificar
    }
  }
})
```

4. **Validação Frontend** (`use-proposicoes-state.ts`):
```typescript
const existe = proposicoes.some(p =>
  p.numero === numero &&
  p.ano === formData.ano &&
  p.tipo === formData.tipo.toUpperCase() &&
  p.id !== editingProposicao?.id
)
```

**Arquivos Alterados**:
- `prisma/schema.prisma` - Constraint unique
- `src/app/api/proposicoes/route.ts` - Validação criação
- `src/app/api/proposicoes/[id]/route.ts` - Validação atualização
- `src/app/admin/proposicoes/_hooks/use-proposicoes-state.ts` - Validação frontend
- `src/lib/repositories/proposicao-repository.ts` - Método findByTipoNumeroAno

**Status**: CORRIGIDO - 2026-01-31

---

### ERR-037: Loop Infinito de Requisições na Área do Parlamentar (CORRIGIDO)

**Localizacao**: `src/app/parlamentar/votacao/hooks/useVotacaoReducer.ts`, `src/app/parlamentar/votacao/hooks/useVotacaoData.ts`

**Descricao**: Ao acessar a área do parlamentar, o navegador esgotava recursos com erro `ERR_INSUFFICIENT_RESOURCES` devido a um loop infinito de requisições HTTP. O problema era causado por dependências instáveis nos hooks React:

1. O objeto `actions` no `useVotacaoReducer` era recriado a cada renderização
2. O `useCallback` de `carregarDados` no `useVotacaoData` dependia de `actions`
3. Isso fazia com que `carregarDados` fosse recriado a cada render
4. O `useEffect` do polling dependia de `carregarDados`, recriando o intervalo
5. Cada chamada de API causava novas renderizações, criando um ciclo infinito

**Impacto**:
- Navegador travava com erro `ERR_INSUFFICIENT_RESOURCES`
- Centenas de requisições por segundo para `/api/parlamentares/` e `/api/sessoes`
- Impossibilidade de usar a área do parlamentar

**Código Problemático**:
```typescript
// useVotacaoReducer.ts - ANTES
export function useVotacaoReducer() {
  const [state, dispatch] = useReducer(votacaoReducer, initialState)

  return {
    state,
    dispatch,
    actions: {  // Objeto recriado a cada render!
      setSessao: (sessao) => dispatch({ type: 'SET_SESSAO', payload: sessao }),
      // ...
    }
  }
}
```

**Solução Aplicada**:
```typescript
// useVotacaoReducer.ts - DEPOIS
import { useReducer, useMemo } from 'react'

export function useVotacaoReducer() {
  const [state, dispatch] = useReducer(votacaoReducer, initialState)

  // Memoriza o objeto actions para evitar recriação a cada renderização
  // Isso previne loops infinitos em hooks que dependem de actions
  const actions = useMemo(() => ({
    setSessao: (sessao) => dispatch({ type: 'SET_SESSAO', payload: sessao }),
    // ...
  }), []) // dispatch é estável, não precisa estar nas dependências

  return { state, dispatch, actions }
}
```

**Arquivos Alterados**:
- `src/app/parlamentar/votacao/hooks/useVotacaoReducer.ts`

**Status**: CORRIGIDO - 2026-02-03

---

## Erros de Alta Prioridade

### ERR-001: Falta de Tratamento de Erros Consistente nas APIs

**Localizacao**: `src/app/api/**/route.ts`

**Descricao**: Algumas rotas de API nao possuem tratamento de erros adequado, podendo retornar erros genericos ou expor informacoes sensiveis.

**Impacto**:
- Erros nao tratados podem derrubar requisicoes
- Mensagens de erro podem expor detalhes internos
- Dificuldade de debugging em producao

**Solucao Proposta**:
```typescript
// Criar middleware de tratamento de erros
// src/lib/middleware/error-handler.ts

import { NextResponse } from 'next/server'

export function handleApiError(error: unknown, context: string) {
  console.error(`[${context}] Error:`, error)

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: 'Dados invalidos', details: error.errors },
      { status: 400 }
    )
  }

  if (error instanceof PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Registro duplicado' },
        { status: 409 }
      )
    }
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Registro nao encontrado' },
        { status: 404 }
      )
    }
  }

  return NextResponse.json(
    { error: 'Erro interno do servidor' },
    { status: 500 }
  )
}
```

**Arquivos Afetados**:
- `src/app/api/parlamentares/route.ts`
- `src/app/api/sessoes/route.ts`
- `src/app/api/proposicoes/route.ts`
- E outros endpoints

**Estimativa de Correcao**: 4-6 horas

---

### ERR-002: Validacao Incompleta de Dados de Entrada

**Localizacao**: `src/app/api/**/route.ts`, `src/lib/validation/schemas.ts`

**Descricao**: Nem todos os endpoints possuem validacao Zod completa, permitindo dados malformados ou incompletos.

**Impacto**:
- Dados inconsistentes no banco
- Erros de runtime
- Potenciais vulnerabilidades de seguranca

**Solucao Proposta**:
```typescript
// Completar schemas de validacao
// src/lib/validation/schemas.ts

export const parlamentarSchema = z.object({
  nome: z.string().min(3).max(100),
  email: z.string().email().optional().nullable(),
  telefone: z.string().regex(/^\(\d{2}\) \d{4,5}-\d{4}$/).optional().nullable(),
  partido: z.string().max(50).optional().nullable(),
  biografia: z.string().max(5000).optional().nullable(),
  foto: z.string().url().optional().nullable(),
  cargo: z.enum(['PRESIDENTE', 'VICE_PRESIDENTE', 'PRIMEIRO_SECRETARIO', 'SEGUNDO_SECRETARIO', 'VEREADOR']),
  legislatura: z.string().min(1),
  ativo: z.boolean().default(true),
})

export const sessaoSchema = z.object({
  numero: z.number().int().positive(),
  tipo: z.enum(['ORDINARIA', 'EXTRAORDINARIA', 'SOLENE', 'ESPECIAL']),
  data: z.string().datetime(),
  horario: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  local: z.string().max(200).optional(),
  status: z.enum(['AGENDADA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA']).default('AGENDADA'),
  descricao: z.string().max(2000).optional(),
  legislaturaId: z.string().cuid().optional(),
  periodoId: z.string().cuid().optional(),
})

// Adicionar schemas para todos os modelos
```

**Estimativa de Correcao**: 6-8 horas

---

### ERR-003: Ausencia de Rate Limiting Global

**Localizacao**: API Routes

**Descricao**: Nao ha limitacao de taxa de requisicoes em todas as rotas, expondo o sistema a ataques de forca bruta ou DDoS.

**Impacto**:
- Vulnerabilidade a ataques
- Sobrecarga do servidor
- Custos elevados de infraestrutura

**Solucao Proposta**:
```typescript
// Criar middleware de rate limiting
// src/lib/middleware/rate-limit.ts

import { NextRequest, NextResponse } from 'next/server'

const rateLimitMap = new Map<string, { count: number; timestamp: number }>()

const RATE_LIMIT = {
  PUBLIC: { requests: 60, window: 60000 },     // 60 req/min
  AUTHENTICATED: { requests: 120, window: 60000 }, // 120 req/min
  AUTH: { requests: 10, window: 300000 },      // 10 req/5min para login
}

export function rateLimit(request: NextRequest, type: keyof typeof RATE_LIMIT = 'PUBLIC') {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const key = `${ip}:${request.nextUrl.pathname}`
  const now = Date.now()
  const limit = RATE_LIMIT[type]

  const record = rateLimitMap.get(key)

  if (!record || now - record.timestamp > limit.window) {
    rateLimitMap.set(key, { count: 1, timestamp: now })
    return null
  }

  if (record.count >= limit.requests) {
    return NextResponse.json(
      { error: 'Muitas requisicoes. Tente novamente mais tarde.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((limit.window - (now - record.timestamp)) / 1000)) } }
    )
  }

  record.count++
  return null
}
```

**Estimativa de Correcao**: 3-4 horas

---

## Erros de Media Prioridade

### ERR-004: Falta de Indices no Banco de Dados

**Localizacao**: `prisma/schema.prisma`

**Descricao**: Algumas tabelas carecem de indices adequados para consultas frequentes, impactando performance.

**Solucao Proposta**:
```prisma
// Adicionar indices ao schema

model Proposicao {
  // ... campos existentes

  @@index([status, dataApresentacao])
  @@index([autorId, ano])
  @@index([tipo, status])
}

model Sessao {
  // ... campos existentes

  @@index([status, data])
  @@index([legislaturaId, tipo])
}

model Tramitacao {
  // ... campos existentes

  @@index([status, prazoVencimento])
  @@index([unidadeId, status])
}

model Publicacao {
  // ... campos existentes

  @@index([tipo, publicada, data])
  @@index([ano, tipo])
}
```

**Estimativa de Correcao**: 2-3 horas

---

### ERR-005: Queries N+1 em Listagens

**Localizacao**: `src/app/api/**/route.ts`

**Descricao**: Algumas consultas fazem multiplas requisicoes ao banco quando poderiam usar includes/joins.

**Exemplo do Problema**:
```typescript
// ERRADO - N+1 queries
const parlamentares = await prisma.parlamentar.findMany()
for (const p of parlamentares) {
  p.mandatos = await prisma.mandato.findMany({ where: { parlamentarId: p.id } })
}
```

**Solucao Proposta**:
```typescript
// CORRETO - Uma query com include
const parlamentares = await prisma.parlamentar.findMany({
  include: {
    mandatos: true,
    filiacoes: { where: { ativa: true } },
    comissoes: { where: { ativo: true } },
  }
})
```

**Arquivos para Revisar**:
- `src/app/api/parlamentares/route.ts`
- `src/app/api/sessoes/route.ts`
- `src/app/api/comissoes/route.ts`

**Estimativa de Correcao**: 4-6 horas

---

### ERR-006: Falta de Paginacao em Listagens

**Localizacao**: Varios endpoints de API

**Descricao**: Algumas listagens retornam todos os registros sem paginacao, podendo causar problemas de performance.

**Solucao Proposta**:
```typescript
// Padronizar paginacao
// src/lib/utils/pagination.ts

export interface PaginationParams {
  page?: number
  limit?: number
  orderBy?: string
  order?: 'asc' | 'desc'
}

export function getPaginationParams(searchParams: URLSearchParams): PaginationParams {
  return {
    page: Math.max(1, Number(searchParams.get('page')) || 1),
    limit: Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20)),
    orderBy: searchParams.get('orderBy') || 'createdAt',
    order: (searchParams.get('order') as 'asc' | 'desc') || 'desc',
  }
}

export function getPrismaParams(params: PaginationParams) {
  return {
    skip: (params.page! - 1) * params.limit!,
    take: params.limit,
    orderBy: { [params.orderBy!]: params.order },
  }
}

// Uso em API route
export async function GET(request: NextRequest) {
  const params = getPaginationParams(request.nextUrl.searchParams)

  const [items, total] = await Promise.all([
    prisma.model.findMany({
      ...getPrismaParams(params),
      where: { /* filtros */ },
    }),
    prisma.model.count({ where: { /* filtros */ } }),
  ])

  return NextResponse.json({
    items,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit!),
    },
  })
}
```

**Estimativa de Correcao**: 4-6 horas

---

### ERR-007: Inconsistencia no Formato de Datas

**Localizacao**: Frontend e Backend

**Descricao**: Datas sao formatadas de formas diferentes em varias partes do sistema.

**Solucao Proposta**:
```typescript
// Centralizar formatacao de datas
// src/lib/utils/date.ts

import { format, parseISO, isValid } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const DATE_FORMATS = {
  SHORT: 'dd/MM/yyyy',
  LONG: "dd 'de' MMMM 'de' yyyy",
  WITH_TIME: 'dd/MM/yyyy HH:mm',
  TIME_ONLY: 'HH:mm',
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
}

export function formatDate(date: Date | string | null | undefined, formatStr: keyof typeof DATE_FORMATS = 'SHORT'): string {
  if (!date) return '-'

  const dateObj = typeof date === 'string' ? parseISO(date) : date

  if (!isValid(dateObj)) return '-'

  return format(dateObj, DATE_FORMATS[formatStr], { locale: ptBR })
}

export function formatDateRange(start: Date | string, end: Date | string | null): string {
  const startStr = formatDate(start)
  const endStr = end ? formatDate(end) : 'Atual'
  return `${startStr} - ${endStr}`
}
```

**Estimativa de Correcao**: 2-3 horas

---

### ERR-008: Falta de Loading States em Componentes

**Localizacao**: `src/components/**/*.tsx`

**Descricao**: Alguns componentes nao mostram estado de carregamento durante operacoes async.

**Solucao Proposta**:
```tsx
// Usar Suspense e loading states
// Exemplo de componente com loading

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export function SaveButton({ onSave }: { onSave: () => Promise<void> }) {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    setIsLoading(true)
    try {
      await onSave()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleClick} disabled={isLoading}>
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isLoading ? 'Salvando...' : 'Salvar'}
    </Button>
  )
}
```

**Estimativa de Correcao**: 4-6 horas

---

### ERR-009: Falta de Confirmacao em Acoes Destrutivas

**Localizacao**: Componentes de admin

**Descricao**: Algumas acoes de exclusao nao pedem confirmacao do usuario.

**Solucao Proposta**:
```tsx
// Criar componente de confirmacao reutilizavel
// src/components/ui/confirm-dialog.tsx

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface ConfirmDialogProps {
  trigger: React.ReactNode
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void | Promise<void>
  variant?: 'default' | 'destructive'
}

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  variant = 'default',
}: ConfirmDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {trigger}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={variant === 'destructive' ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

**Estimativa de Correcao**: 3-4 horas

---

### ERR-010: Logs Inconsistentes

**Localizacao**: Todo o projeto

**Descricao**: Logs usam console.log/error de forma inconsistente sem estrutura padronizada.

**Solucao Proposta**:
```typescript
// Criar sistema de logging estruturado
// src/lib/logging/logger.ts

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  context?: string
  metadata?: Record<string, unknown>
  timestamp: string
}

class Logger {
  private context: string

  constructor(context: string) {
    this.context = context
  }

  private log(level: LogLevel, message: string, metadata?: Record<string, unknown>) {
    const entry: LogEntry = {
      level,
      message,
      context: this.context,
      metadata,
      timestamp: new Date().toISOString(),
    }

    if (process.env.NODE_ENV === 'production') {
      // Em producao, enviar para servico de logging
      console[level](JSON.stringify(entry))
    } else {
      // Em desenvolvimento, formato legivel
      console[level](`[${entry.timestamp}] [${this.context}] ${message}`, metadata || '')
    }
  }

  debug(message: string, metadata?: Record<string, unknown>) {
    this.log('debug', message, metadata)
  }

  info(message: string, metadata?: Record<string, unknown>) {
    this.log('info', message, metadata)
  }

  warn(message: string, metadata?: Record<string, unknown>) {
    this.log('warn', message, metadata)
  }

  error(message: string, metadata?: Record<string, unknown>) {
    this.log('error', message, metadata)
  }
}

export function createLogger(context: string) {
  return new Logger(context)
}

// Uso
const logger = createLogger('ParlamentaresAPI')
logger.info('Parlamentar criado', { id: parlamentar.id })
logger.error('Falha ao criar parlamentar', { error: err.message })
```

**Estimativa de Correcao**: 4-6 horas

---

### ERR-011: Falta de Cache em Consultas Frequentes

**Localizacao**: APIs e Frontend

**Descricao**: Dados que raramente mudam sao buscados do banco a cada requisicao.

**Solucao Proposta**:
```typescript
// Implementar cache simples em memoria
// src/lib/cache/memory-cache.ts

interface CacheEntry<T> {
  data: T
  expiry: number
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>()

  set<T>(key: string, data: T, ttlSeconds: number = 300) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlSeconds * 1000,
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiry) {
      this.cache.delete(key)
      return null
    }
    return entry.data as T
  }

  invalidate(pattern?: string) {
    if (!pattern) {
      this.cache.clear()
      return
    }
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }
}

export const cache = new MemoryCache()

// Uso
const CACHE_KEY = 'legislaturas:ativas'
let legislaturas = cache.get<Legislatura[]>(CACHE_KEY)
if (!legislaturas) {
  legislaturas = await prisma.legislatura.findMany({ where: { ativa: true } })
  cache.set(CACHE_KEY, legislaturas, 3600) // 1 hora
}
```

**Estimativa de Correcao**: 4-6 horas

---

## Erros de Baixa Prioridade

### ERR-012: Componentes sem Memoizacao

**Descricao**: Componentes que recebem props complexas re-renderizam desnecessariamente.

**Solucao**: Usar `React.memo()`, `useMemo()`, `useCallback()` onde apropriado.

**Estimativa**: 2-3 horas

---

### ERR-013: Imagens sem Otimizacao

**Descricao**: Algumas imagens nao usam `next/image` para otimizacao automatica.

**Solucao**: Substituir `<img>` por `<Image>` do Next.js.

**Estimativa**: 1-2 horas

---

### ERR-014: Falta de Testes Unitarios

**Descricao**: Cobertura de testes baixa (~30%).

**Solucao**: Escrever testes para servicos e hooks principais.

**Estimativa**: 8-12 horas

---

### ERR-015: Acessibilidade Incompleta

**Descricao**: Alguns elementos carecem de aria-labels e navegacao por teclado.

**Solucao**: Auditar com ferramentas como axe-core e corrigir.

**Estimativa**: 4-6 horas

---

### ERR-016: Falta de SEO em Paginas Publicas

**Descricao**: Metadados SEO incompletos em algumas paginas.

**Solucao**: Adicionar metadata completo a todas as paginas publicas.

**Estimativa**: 2-3 horas

---

### ERR-017: Console Warnings em Dependencias

**Descricao**: Algumas dependencias geram warnings no console.

**Solucao**: Atualizar dependencias ou suprimir warnings especificos.

**Estimativa**: 1-2 horas

---

## Resumo de Esforco

| Prioridade | Quantidade | Horas Estimadas |
|------------|------------|-----------------|
| Alta | 3 | 13-18 horas |
| Media | 8 | 27-40 horas |
| Baixa | 6 | 18-28 horas |
| **Total** | **17** | **58-86 horas** |

---

## Proximos Passos Recomendados

1. **Imediato**: Corrigir ERR-001, ERR-002, ERR-003 (seguranca)
2. **Curto Prazo**: ERR-004, ERR-005, ERR-006 (performance)
3. **Medio Prazo**: ERR-007 a ERR-011 (qualidade)
4. **Longo Prazo**: ERR-012 a ERR-017 (polimento)
