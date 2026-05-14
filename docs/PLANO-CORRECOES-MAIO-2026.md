# Plano de Correcoes — Maio 2026

> **Data**: 2026-05-14
> **Origem**: Analise completa de 5 eixos (seguranca, qualidade, performance, testes, docs)
> **Estrategia**: 4 fases priorizadas por impacto (LGPD/PNTP > performance > qualidade > testes)
> **Branch**: trabalhar diretamente em `main` (commits pequenos por item, sem branch dedicada — projeto em producao com correcoes pontuais).

---

## Sumario

| Fase | Tema | Itens | Severidade | Estimativa |
|------|------|-------|------------|------------|
| 1 | Bloqueadores criticos (segurança + build + perf hot) | F1.1 a F1.5 | CRITICO | 2-3 dias |
| 2 | Hardening de seguranca | F2.1 a F2.7 | ALTO | 3-4 dias |
| 3 | Performance e cache | F3.1 a F3.6 | ALTO | 3-4 dias |
| 4 | Qualidade, docs e testes | F4.1 a F4.6 | MEDIO | 3-5 dias |

> **Total estimado**: 11-16 dias de trabalho efetivo.

---

## Pre-requisitos

- [x] Suite de testes verde (523/523 antes de iniciar — baseline 2026-05-14)
- [x] TypeScript com `tsc --noEmit` limpo (0 erros)
- [x] Snapshot Supabase + VPS antes de migrations destrutivas
- [x] `ENCRYPTION_KEY` ja definida no `.env` (reaproveitada da Fase 1 Q2)

---

## FASE 1 — Bloqueadores criticos

> **Objetivo**: fechar exposicao LGPD imediata, destravar lint/build e remover gargalo nº 1 de performance.

### Itens

| ID | Tema | Onde | Esforco |
|----|------|------|---------|
| F1.1 | Criptografar CPF em Ouvidoria + e-SIC | `prisma/schema/models.prisma:2681,2777` + services + migration + backfill | 1d |
| F1.2 | Rate-limit + CAPTCHA em POSTs publicos | `/api/ouvidoria`, `/api/e-sic`, `/api/participacao-cidada/sugestoes` | 0.5d |
| F1.3 | Zod em `/api/auditoria` e `/api/servidores` | `src/lib/validation/`, routes correspondentes | 0.5d |
| F1.4 | Cache em `getThemeColors()` do RootLayout | `src/app/layout.tsx:92-102`, invalidacao no save de configuracao | 0.3d |
| F1.5 | Cleanup build: lint + page-backup.tsx | `next.config.js:eslint`, `admin/proposicoes/page-backup.tsx`, `seguranca/page.tsx:419`, `console-override.ts:55` | 0.3d |

### Checklist F1

- [x] F1.1 schema: `cpfHash` em `SolicitacaoESIC` + `ManifestacaoOuvidoria`
- [x] F1.1 migration `scripts/sql/add-cpf-hash-ouvidoria-esic.sql` (Supabase aplicado)
- [x] F1.1 ouvidoria-service: encryptCpf + getByIdMasked + listByCpfHash
- [x] F1.1 esic-service: encryptCpf + getByIdMasked + listByCpfHash
- [x] F1.1 backfill: `--modelo=servidor,ouvidoria,esic` (rodado dry-run)
- [x] F1.1 testes cpf-utils existentes cobrem encrypt/hash/mask (15 testes verdes)
- [x] F1.2 enforceRateLimit('PUBLIC') nos 3 endpoints
- [x] F1.2 enforcePublicCaptcha() (via captcha-guard) nos 3 endpoints
- [x] F1.3 Zod schemas (auditoria-schema.ts, servidor-schema.ts)
- [x] F1.3 routes validam com `safeParse()` + ValidationError padronizado
- [x] F1.4 unstable_cache aplicado + tag invalidada em 3 services
- [x] F1.5 page-backup.tsx deletado
- [x] F1.5 ESLint volta a rodar no build (eslint.ignoreDuringBuilds: false)
- [x] ESTADO-ATUAL.md atualizado
- [x] REGRAS-DE-NEGOCIO.md: RN-166 (CPF Ouvidoria/e-SIC) + RN-167 (anti-spam publico)
- [ ] docs/skills/skill-transparencia.md + skill-admin.md atualizadas (deferred — Fase 4)

---

## FASE 2 — Hardening de seguranca ✅ (concluida em 2026-05-14)

> **Objetivo**: fechar items ALTO da auditoria sem mexer em dados.

| ID | Tema | Onde | Status |
|----|------|------|--------|
| F2.1 | NEXTAUTH_SECRET: fail-fast fora de dev | `src/lib/env-validation.ts` | ✅ |
| F2.2 | Open redirect: validar callbackUrl | `lib/security/safe-redirect.ts` + login | ✅ |
| F2.3 | CRON_SECRET: timingSafeEqual | `api/cron/daily/route.ts` | ✅ |
| F2.4 | Upload: magic bytes + folder allowlist | `lib/security/file-validation.ts` + upload | ✅ |
| F2.5 | sanitizeRichHtml isomorphic (DOMPurify) | `lib/utils/sanitize-html.ts` (isomorphic-dompurify) | ✅ |
| F2.6 | Rate limit central em forgot/reset-password | usa `allowRequest()` (Upstash-aware) | ✅ |
| F2.7 | CSP: roll-out para remover script-src 'unsafe-inline' | `middleware.ts` (Report-Only + flag `CSP_STRICT_ENFORCE`) | ✅ |

---

## FASE 3 — Performance e cache ✅ (concluida em 2026-05-14)

> **Objetivo**: ativar a infra de cache ja construida e quebrar N+1.

| ID | Tema | Onde | Status |
|----|------|------|--------|
| F3.1 | Remover `force-dynamic` indevido | 27 rotas em `/api/publico/*` e `/api/dados-abertos/*` | ✅ |
| F3.2 | Aplicar `cacheHelpers` nas 5 rotas quentes | tipos-proposicao, transparencia/redirecionamentos, configuracoes, parlamentares, comissoes | ✅ |
| F3.3 | Paginacao + cache em rotas publicas | publico/servidores, publico/audiencias-publicas, publico/sessao-ao-vivo | ✅ |
| F3.4 | AbortController em `useCrudResource` | `lib/hooks/use-crud-resource.ts` (requestIdRef + isMountedRef) | ✅ |
| F3.5 | Indices FK ausentes | schema + `scripts/sql/add-fk-indexes-2026-05.sql` (8 modelos) | ✅ |
| F3.6 | analytics-service: trocar findMany por groupBy | `lib/services/analytics-service.ts` | ✅ |

---

## FASE 4 — Qualidade, docs e testes ✅ (concluida em 2026-05-14)

> **Objetivo**: divida tecnica nao bloqueante.

| ID | Tema | Onde | Status |
|----|------|------|--------|
| F4.1 | Atualizar README + CLAUDE.md → Next 15 | stack atualizada + links corretos | ✅ |
| F4.2 | Regenerar MODELOS-DADOS.md a partir do schema | 120 modelos agrupados por dominio | ✅ |
| F4.3 | Atualizar skills | skill-admin (paginas), skill-legislativo (Cotas crossref) | ✅ |
| F4.4 | Quebrar `admin/proposicoes/page.tsx` | 474 -> 385 linhas (-19%); 2 hooks extraidos + 3 helpers mortos removidos | ✅ |
| F4.5 | Consolidar `formatCpf`/`formatDate` duplicados | `formatCPF` delega para canonico; 2 reimplementacoes inline removidas | ✅ |
| F4.6 | Cobertura de testes | 4 novos arquivos: safe-redirect, file-validation, captcha-guard, auditoria-schema (47 testes) | ✅ |

---

## Riscos e mitigacoes

| Risco | Mitigacao |
|-------|-----------|
| Backfill de CPF rompe dados legados | Script idempotente + `--dry-run` obrigatorio antes do real |
| Remover `force-dynamic` quebra rotas que usavam cookies | Auditar uma por uma; manter onde houver `getServerSession` |
| Cache do tema fica stale apos save de Configuracao | Invalidacao por `revalidateTag('theme-colors')` no PUT |
| Migration de indices trava tabela grande | Usar `CREATE INDEX CONCURRENTLY` em producao |
| CSP nonce quebra Recharts/inline scripts | Roll-out gradual: primeiro Report-Only, depois enforcement |

---

## Tracking

Cada item virar 1 commit (`git commit -m "feat/fix(area): F1.X — descricao"`). Apos cada fase:
1. Atualizar este documento marcando `[x]` no checklist
2. Atualizar `ESTADO-ATUAL.md` (DOC-001)
3. Atualizar skill correspondente (DOC-007)
4. Rodar `npm test` + `npx tsc --noEmit` antes do commit
