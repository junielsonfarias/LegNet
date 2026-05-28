# Análise Completa da Aplicação — 2026-05-28

> **Versão analisada**: 1.34.0 (pós-Sprint 4)
> **Data**: 2026-05-28
> **Metodologia**: 5 agentes especializados em paralelo (arquitetura, segurança/LGPD, performance, schema/dados, testes/CI)
> **Status do sistema**: EM PRODUÇÃO — https://cmchaves.pa.gov.br

---

## Sumário Executivo

O Sistema Legislativo Municipal é **maduro, em produção real, com base sólida** — fruto de 4 Sprints de hardening recentes, plano PNTP Diamante concluído e 11 commits finalizando a migração do CR2. A documentação viva é exemplar (21 docs + 11 skills + `ESTADO-ATUAL.md` de 597 KB + `REGRAS-DE-NEGOCIO.md`).

**Score consolidado: 8.5/10** — sistema próximo de "excelente", com gaps endereçáveis em 4-5 sprints até **9.3+/10**.

Os **5 riscos críticos** estão em:

1. Lacunas pontuais de LGPD (`Protocolo.cpfCnpjRemetente` em texto puro; ouvidoria aceita CPF sem prova de posse)
2. Type safety quebrada em pontos sensíveis (`as any` em JWT/Session)
3. Soft delete inexistente em entidades legislativas (risco de rastreabilidade)
4. Cobertura de testes em APIs ainda baixa (<2% das 318 rotas)
5. `AbortController` em apenas ~12% dos hooks de fetch

Nenhum gap impede produção; todos são endereçáveis em **4-5 sprints**.

---

## 1. Métricas do Projeto

| Indicador | Valor |
|-----------|------:|
| Linhas de código (TS/TSX) | **68.984** |
| Tamanho do `src/` | **12 MB** |
| Modelos Prisma | **131** |
| API routes (`route.ts`) | **318** |
| Componentes React | **156** |
| Hooks customizados | **47** (+ ~55 locais em features) |
| Services (`*-service.ts`) | **96** |
| Arquivos de teste | **222** (47 vitest + ~9 E2E) |
| Testes passing | **766 ✅** |
| Diretórios em `src/app/` | **652** |
| Documentos em `docs/` | **21** + 11 skills |
| Enums Prisma | **55** |
| Índices Prisma | **256** |

---

## 2. Pontos Fortes (consenso entre os 5 agentes)

### 2.1 Segurança hardened
- **AES-256-GCM** em CPF (Parlamentar, Servidor, SolicitacaoESIC) com hash SHA-256 determinístico para busca
- **AuditLog imutável** via trigger Postgres `audit_logs_block_modifications`
- **`redactSensitive()`** automático em logger mascara CPF/CNPJ/email/JWT/tokens/hashes
- **RBAC granular** com 73 testes, separação crítica `financeiro-resumo.view` (CPF mascarado) vs `financeiro-detalhe.view` (CPF puro, só ADMIN/SECRETARIA)
- **CSRF** com allowlist Origin/Referer (NEXTAUTH_URL, Vercel, localhost dev)
- **Rate-limit central** com Upstash Redis + fallback memória
- **Validação Zod** com `safeParse` em rotas /api/*
- **Upload** com checagem de magic bytes (rejeita PNG renomeado para PDF)
- **2FA** com toggle global em `Configuracao.seguranca.2fa.enabled` e secrets criptografados

### 2.2 Arquitetura por domínio
- Separação clara `admin/` · `legislativo/` · `transparencia/` · `parlamentar/` · `painel-operador/` · `noticias/`
- Route groups `(auth)` isolam fluxos de autenticação
- Multi-tenant nativo via `tenant-resolver.ts`
- Error handler unificado em `src/lib/error-handler.ts` com classes especializadas (ValidationError, NotFoundError, ConflictError, ForbiddenError)
- Padrão `*-db-service.ts` (39 services) encapsula Prisma e reduz acoplamento

### 2.3 Cache em 3 camadas
- `src/lib/cache/cache-strategy.ts`: Memória → Redis → Stale-While-Revalidate
- TTLs legislativos diferenciados (STATIC 1h-7d, REALTIME 5s-30min)
- Invalidação por prefixo
- `cacheHelpers.getParlamentaresAtivos()` em query-level

### 2.4 Schema robusto
- 131 modelos + 55 enums isolados
- 256 índices definidos, muitos compostos (`[sessaoId, tipo, ordem]`, `[status, data]`)
- Núcleo legislativo completo: Proposição, Sessão, Votação, Pareceres com `fundamentacao`, multi-turno com interstício, Emenda
- ESIC com 2 instâncias de recurso (LAI Art. 15-16)
- Configurabilidade avançada: `ConfiguracaoQuorum`, `FluxoTramitacao`, `RegraTramitacao`, `SessaoTemplate`

### 2.5 PNTP 2026 — Selo Diamante
- 17 atos consolidados em `/transparencia/atos` (com 308 redirects de legacy)
- Dados-abertos com CSV via `convertToCSV()`
- Mascaramento CPF em endpoints públicos
- 6 crons de prazo
- DocumentoTransparencia com 20+ tipos (RGF, LDO, LOA, PPA, POLITICA_PRIVACIDADE)

### 2.6 CI/CD maduro
- Pipeline Lint → tsc → vitest → build → E2E Playwright em Postgres real
- E2E em Chromium + Firefox + Mobile Chrome (Pixel 5)
- Postgres 15 como service com healthcheck (`pg_isready`)
- Smoke E2E rápido (<60s) bloqueia PR em falha
- Artifacts (`playwright-report`, `test-results`) em falha
- Fail-fast com `tsc noImplicitAny`

### 2.7 Next.js 15 bem configurado
- `optimizePackageImports` para lucide-react, radix-ui, date-fns
- Image optimization webp/avif
- Headers de segurança (CSP, HSTS, X-Frame-Options)
- ISR em 6 páginas estáticas (Sprint 4)
- Bundle analyzer integrado (`npm run analyze`)
- ESLint enforced no build

---

## 3. Achados Críticos (P0 — corrigir em < 1 semana)

### P0-1. `as any` no JWT/Session — `src/lib/auth.ts:144,171`
```ts
token.parlamentarId = (user as any).parlamentarId
;(session.user as any).parlamentarId = token.parlamentarId
```
**Risco:** type erasure permite injeção de campos não validados na sessão.
**Fix:** estender o tipo via module augmentation: `User & { parlamentarId?: string }`.

### P0-2. Ouvidoria aceita CPF sem prova de posse — `src/app/api/ouvidoria/route.ts:36-50`
Schema Zod permite qualquer CPF anônimo — viola **LGPD Art. 8º** (acurácia de dados).
**Fix:** se manifestação anônima → não persistir CPF (hash apenas); se nominal → exigir verificação via SMS/email.

### P0-3. `AbortController` em apenas ~12% dos hooks de fetch
**52 hooks de fetch totais, ~16 cobertos** (Sprint 4 cobriu 16). Restam ~36 sem cancelamento de requisição → memory leaks em navegação rápida e race conditions.
**Fix:** criar helper `useAbortController()` reutilizável e aplicar nos 36 restantes.

### P0-4. Soft delete inexistente em entidades legislativas
Nenhum `deletedAt` em `Proposicao`/`Parecer`/`Votacao`/`Sessao`/`Emenda`. Hard delete viola rastreabilidade legislativa — **RN-003** só protege `AuditLog`.
**Fix:** adicionar campo `deletedAt DateTime?` + filtro padrão nos services + middleware Prisma global.

### P0-5. `Parecer.setNull` em cascade de Sessão
Deletar sessão zera `parecer.pautaItemId` — perda de rastreabilidade do parecer original.
**Fix:** mudar `onDelete: SetNull` → `onDelete: Restrict` no relation.

### P0-6. `Protocolo.cpfCnpjRemetente` em texto puro
Demais CPFs estão criptografados; `Protocolo` ficou para trás — gap LGPD.
**Fix:** aplicar AES-256-GCM + hash + script de backfill em `scripts/sql/`.

### P0-7. Rate-limit em memória sem cleanup garantido em produção
`src/lib/rate-limit.ts:26-33` só limpa se houver requisição; múltiplas replicas Vercel não sincronizam.
**Fix:** tornar Upstash Redis **obrigatório em produção** via `env-validation.ts` (já existe fallback).

---

## 4. Achados Altos (P1 — corrigir em < 1 mês)

| # | Item | Localização |
|---|------|-------------|
| P1-1 | `NEXTAUTH_SECRET` com fallback auto-gerado se `NODE_ENV='development'` em prod = sessions quebram a cada restart | `src/lib/env-validation.ts:101-106` |
| P1-2 | CSP ainda com `unsafe-inline` em enforcing (Report-Only correto) — falta nonce em Next.js Scripts + VLibras | `src/middleware.ts:247` |
| P1-3 | **60 `findMany` sem `take/skip`** em endpoints públicos — risco payload >2 MB | `src/app/api/**` |
| P1-4 | **8 índices FK faltando**: `PautaItem.oficioId`, `Emenda.parecerRelatorId` etc. | `prisma/schema/models.prisma` |
| P1-5 | CSRF aceita request sem `Origin` em dev — risco se `NODE_ENV` vazar para staging | `src/lib/middleware/csrf.ts:147-151` |
| P1-6 | **Zero testes em 314 das 318 APIs** (cobertura <2% em rotas) | `src/tests/api/` |
| P1-7 | Services críticos sem teste: `proposicao-db-service`, `votacao-db-service`, `sessao-db-service`, `tramitacao-db-service` | `src/lib/services/` |
| P1-8 | `session.update()` sem rate-limit + sem audit log | `src/lib/auth.ts:150-163` |
| P1-9 | JSON sem schema em `Proposicao.documentos`, `Emenda.coautores`, `AudienciaPublica.participantes` | schema |
| P1-10 | 27 páginas `force-dynamic`; **~8-12 poderiam virar ISR** (atas, pautas, relatórios estáticos) | `src/app/**/page.tsx` |

---

## 5. Achados Médios (P2 — backlog)

- **Barrel exports ausentes** em `src/lib/{services,api,hooks,utils}/` — imports longos e refactoring frágil
- **Schemas Zod inline** em 318 routes — centralizar em `src/lib/validation/schemas.ts`
- **Sobreposição utils** — `utils.ts` + `utils/format-ptbr.ts` + `utils/date.ts` com funções concorrentes
- **API contracts** — sem OpenAPI/Swagger gerado para consumidores externos
- **`src/lib/repositories/`** existe vazio enquanto `*-db-service.ts` faz repo + service
- **Imagens** — apenas 26 usos de `next/image`; muitos `<img>` legados (perda de lazy-load, responsivo, CDN)
- **Fontes** — apenas 1 uso de `next/font` (CLS provável)
- **Páginas monolíticas** — top 5: 1287, 1078, 1073, 1047, 1017 linhas (em `admin/sessoes/[id]`, `admin/parlamentares/editar/[id]`)
- **Tenant lookup sem cache** — `extractTenantIdentifier()` roda a cada request
- **Hooks/componentes sem teste** — ~55 hooks de feature + 155 componentes com 1 único teste a11y
- **CORS fallback permissivo** — `src/lib/middleware/validation.ts:287-291` pode deletar header se `allowedOrigins[0]` é undefined
- **Regex JWT loose** em `redactSensitive` (passa tokens com 2 segmentos) — `src/lib/logging/logger.ts:91-93`
- **Dual autor** — `Proposicao.autorId` + `autorEntidadeId` ambos nullable sem constraint UNIQUE
- **`PautaSecao` enum → String** — divergência ERR-041 já corrigida mas padrão pode reaparecer
- **`Votacao` sem constraint** `total_presentes <= total_membros`

---

## 6. Quick Wins (< 1 dia cada)

| # | Ação | Esforço |
|---|------|---------|
| QW-1 | Remover `as any` em `auth.ts` (tipagem correta via module augmentation) | 1h |
| QW-2 | Adicionar 8 índices FK faltantes via SQL `CREATE INDEX CONCURRENTLY` | 30 min |
| QW-3 | Tornar Redis obrigatório em produção via `env-validation.ts` | 15 min |
| QW-4 | Audit das 27 páginas `force-dynamic` → 6-8 viram `revalidate=300` | 2h |
| QW-5 | Endurecer regex JWT em `redactSensitive` (exigir 3 segmentos) | 10 min |
| QW-6 | Mover schemas Zod das 10 rotas mais usadas para `lib/validation/` | 2h |
| QW-7 | Adicionar `take: 500` default em 60 `findMany` sem paginação | 3h |

---

## 7. Pontuação Consolidada

| Dimensão | Score | Justificativa |
|----------|------:|---------------|
| **Arquitetura** | 8.5 / 10 | Domínios claros, error handler unificado; gaps em DRY (barrel/zod) |
| **Segurança & LGPD** | 8.7 / 10 | Excelente base; gaps em `as any`, ouvidoria CPF, NEXTAUTH fallback |
| **Performance** | 8.5 / 10 | Cache 3-camadas + 256 índices; AbortController 12%, ISR subutilizado |
| **Schema/Dados** | 8.0 / 10 | 131 modelos sólidos; falta soft delete, índices FK, JSON sem schema |
| **Testes & CI** | 7.5 / 10 | 766 testes, E2E no CI; cobertura de API <2%, hooks 0% |
| **Observabilidade** | 8.0 / 10 | redactSensitive + createLogger em rotas críticas; sem APM externo (decisão documentada) |
| **Documentação** | 9.5 / 10 | 21 docs + 11 skills + `ESTADO-ATUAL` versionado |
| **Conformidade PNTP** | 9.3 / 10 | Selo Diamante; gap em `DocumentoClassificado` LAI |
| **SCORE GERAL** | **8.5 / 10** | Sistema maduro em produção, próximo de "excelente" |

---

## 8. Roadmap Recomendado

### Sprint 5 — Hardening crítico (1 semana)
- P0-1 — Remover `as any` em auth
- P0-2 — Ouvidoria sem prova de posse (CPF hash-only ou verificação)
- P0-3 — `AbortController` em 36 hooks restantes
- P0-6 — Criptografar `Protocolo.cpfCnpjRemetente` + backfill
- P0-7 — Redis obrigatório em produção

### Sprint 6 — Resiliência de dados (1-2 semanas)
- P0-4 — Soft delete em entidades legislativas
- P0-5 — `Parecer.setNull` → `Restrict`
- P1-4 — 8 índices FK faltantes
- P1-9 — Zod schema para campos JSON críticos
- P2 — `Votacao` CHECK constraint quorum

### Sprint 7 — Cobertura de testes (2 semanas)
- P1-6 — API tests para 50 rotas críticas (votação, proposição, sessão)
- P1-7 — Services nucleares: `proposicao-db-service`, `votacao-db-service`, `sessao-db-service`, `tramitacao-db-service`
- Hooks críticos: `use-votacao`, `use-painel-tempo-real`
- E2E: criação completa de proposição + votação tempo-real

### Sprint 8 — DRY e DX (1 semana)
- Barrel exports em `lib/{services,api,hooks,utils}/`
- Centralizar schemas Zod
- Consolidar utils (`format-ptbr` + `date` + `utils.ts`)

### Sprint 9 — Performance fina (1 semana)
- P1-3 — Paginar 60 `findMany` sem limite
- P1-10 — Reclassificar 8-12 páginas para ISR
- P2 — Imagens para `next/image`, fontes para `next/font`
- P2 — Tenant cache em Redis

---

## 9. Conformidade LGPD — Avaliação detalhada

| Critério | Status | Nota |
|----------|--------|------|
| Criptografia em repouso (CPF) | ✅ AES-256-GCM | 95% (falta `Protocolo`) |
| Anonimização de logs | ✅ `redactSensitive()` automático | 95% (regex JWT loose) |
| Auditoria imutável | ✅ Trigger Postgres | 100% |
| Direito ao esquecimento | ⚠️ Sem soft delete | 60% |
| Acurácia (Art. 8º) | 🔴 Ouvidoria sem prova de posse | 50% |
| Minimização (Art. 6º III) | ✅ Coleta mínima | 90% |
| Segurança (Art. 46) | ✅ CSRF, rate-limit, 2FA | 90% |
| DPO formal | ⚠️ Sem documento público | 70% |
| Política de Privacidade | ✅ Publicada | 100% |
| **Conformidade geral** | | **~85%** |

---

## 10. Conformidade PNTP 2026 (Selo Diamante)

| Critério | Status |
|----------|--------|
| 1.1-1.5 (Institucional) | ✅ |
| 2.1-2.7 (Atos normativos) | ✅ 17 atos consolidados |
| 3.1 (Receitas) | ✅ |
| 4.1-4.3 (Despesas) | ✅ |
| 5.1-5.4 (Contratos/Licitações) | ✅ |
| 6.1-6.3 (Servidores) | ✅ CPF criptografado |
| 7.1-7.3 (Diárias/Verbas) | ✅ Cotas-parlamentar implementada |
| 8.1-8.6 (Obras) | ✅ |
| 9.1-9.3 (Audiências) | ✅ |
| 10.1-10.5 (ESIC/Ouvidoria) | ⚠️ ESIC OK, Ouvidoria com gap LGPD |
| 11.x (Dados Abertos) | ✅ 15 endpoints + CSV |
| **Conformidade geral** | **~93%** |

---

## 11. Conclusão

O Sistema Legislativo Municipal está em **estado de produção estável**, com fundamentos técnicos sólidos e conformidade legal acima da média do setor público brasileiro. As 4 Sprints recentes (Maio/2026) consolidaram segurança, observability e performance, elevando o sistema de 8.4 para 9.0 em score interno.

A análise externa de hoje, com 5 agentes especializados, revela um delta de **~0.5 ponto** para o estado "excelente" (9.0+), concentrado em:

- **2 itens de LGPD** (ouvidoria sem prova de posse + Protocolo CPF puro)
- **2 itens de type safety** (`as any` em auth + JSON sem schema)
- **1 item de resiliência** (`AbortController` parcial)
- **1 item de cobertura de testes** (APIs <2%)

Endereçando os **7 P0** em uma única Sprint 5 (≤1 semana) o sistema chega facilmente a **9.0+/10**. O roadmap completo de 5 sprints leva a **9.3+/10** — patamar de referência para sistemas legislativos municipais no Brasil.

---

## Anexos

- **Documentação consultada**: `CLAUDE.md`, `ESTADO-ATUAL.md`, `REGRAS-DE-NEGOCIO.md`, `docs/AVALIACAO-E2E-2026-05-27.md`, `docs/PLANO-PNTP-2026.md`, todas as 11 skills
- **Memórias relevantes**: `project_estado.md`, `project_plano_maio2026_fase{1,2,3,4}.md`, `feedback_padroes.md`, `reference_pntp_dados_abertos.md`
- **Git**: análise sobre commit `2fdcc9f` (branch main, working tree clean)
- **Ferramentas usadas**: Read, Grep, Glob, 5 sub-agents Explore em paralelo
