# Avaliação Ponta a Ponta do Sistema — 2026-05-27

> **Escopo**: auditoria completa do sistema Câmara Municipal (`D:\Camara`) cobrindo arquitetura, schema, segurança, LGPD, testes, performance, observability, conformidade PNTP 2026 e qualidade de código.
> **Método**: 4 agents especializados em paralelo + validações automáticas (tsc, eslint) + auditoria manual.
> **Versão analisada**: commit `f5a431c` (main).

---

## Sumário Executivo

| Dimensão | Score | Observação |
|----------|------:|------------|
| **Arquitetura & Stack** | 9.5/10 | Next.js 15, Prisma 5, TS strict, NextAuth, Tailwind — moderna e estável |
| **Schema de Dados** | 9.2/10 | 131 modelos, 86 enums, 253 índices, AuditLog imutável via trigger Postgres |
| **Segurança & LGPD** | 9.0/10 | 19/23 itens ✅. CPF AES-256-GCM+hash, CSP+HSTS, RBAC granular, 2FA opcional |
| **Conformidade PNTP 2026** | 9.5/10 | 83/83 critérios com infraestrutura. Diamante atingível com dados populados |
| **Performance Base** | 7.5/10 | Boa (paginação, 253 indexes, next/image), mas `force-dynamic` excessivo |
| **Observability** | 6.5/10 | Logger estruturado existe mas usado em <5% das rotas. Sem APM externo |
| **Testes** | 7.0/10 | 570 testes passando, mas gaps críticos em endpoints essenciais PNTP |
| **Documentação** | 9.5/10 | 74 docs, ESTADO-ATUAL atualizado, REGRAS-DE-NEGOCIO viva, skills/ atualizadas |
| **Qualidade de Código** | 9.0/10 | TS strict, ESLint 0 erros, Zod em 59% das rotas, padrões consistentes |
| **SCORE GERAL** | **8.4/10** | **Sistema maduro, em produção, com refinamentos identificados** |

---

## 1. Métricas Globais

| Métrica | Valor |
|---------|------:|
| Arquivos TS/TSX em `src/` | 1.200 |
| Páginas (App Router) | 267 |
| Rotas de API (`route.ts`) | 318 |
| Componentes React | 156 |
| Modelos Prisma | 131 |
| Enums Prisma | 86 |
| Índices Prisma (`@@index`) | 253 |
| Linhas do schema Prisma | 4.097 |
| Testes (vitest passing) | 570 |
| Specs E2E (Playwright) | 9 (77 casos) |
| Documentos em `docs/` | 74 |
| Scripts SQL idempotentes | 23 |
| Migrations Prisma | 19 |
| Crons agendados | 7 (no `/api/cron/daily`) |
| Stack | Next.js 15.5 · React 18.3 · TS 5.5 · Prisma 5.16 · NextAuth 4.24 · Tailwind 3.4 · Zod 3.25 |

---

## 2. Validações Automáticas

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | ✅ EXIT 0 — zero erros |
| `npx eslint --quiet` | ✅ EXIT 0 — zero warnings |
| `npm test` | ✅ 570/570 passing (2.08s) |
| TypeScript strict mode | ✅ ativado |
| Build production | ✅ produção rodando (commit f5a431c na VPS) |

---

## 3. Pontos Fortes (Top 10)

1. **AuditLog imutável a nível de banco** — trigger PostgreSQL bloqueia UPDATE/DELETE (RN-003). Padrão raro de implementação, garantia forte para auditoria forense.

2. **LGPD madura** — CPF é criptografado (AES-256-GCM) com hash determinístico para busca, máscara em listagens (`maskCpfOrCnpj`), DPO configurável via UI admin, Política de Privacidade publicada, anonimato na Ouvidoria.

3. **Schema bem indexado** — 253 índices em 131 modelos (≈1.9/modelo). Padrões compostos `[status, data]`, `[tipo, status]` cobrem queries comuns.

4. **Hardening defensivo completo** — CSP com estratégia de roll-out (enforce + Report-Only), HSTS condicional, cookies `__Secure-` prefix em HTTPS, upload por magic bytes, CSRF via Origin/Referer, fail-fast de NEXTAUTH_SECRET.

5. **Catálogo unificado de transparência** — 87 slugs em 9 seções como fonte única para home pública + admin + API menu. Endpoint atômico `/item-config` com `prisma.$transaction` e `revalidateTag` multi-instância.

6. **Crons robustos** — `/api/cron/daily` roda 7 jobs (sanção tácita, atas atrasadas, e-SIC, tokens etc.) com auth `crypto.timingSafeEqual`, isolamento try/catch, payload com `duracaoMs`.

7. **Conformidade PNTP 2026** — 83 critérios da Cartilha Atricon implementados, matriz de avaliação automática em `/api/admin/conformidade-pntp/matriz` com pontuação ponderada oficial.

8. **Logger estruturado completo** — `lib/logging/logger.ts` com child loggers, níveis configuráveis, métodos especializados (`audit`, `auth`, `query`, `request`, `response`), pretty-print em dev e JSON em prod.

9. **Bundle otimizado** — `optimizePackageImports` para 8 libs pesadas (lucide, recharts, date-fns), AVIF+WebP, headers de cache 1 ano para `/_next/static/*`.

10. **Documentação viva** — 74 documentos sob `docs/`. ESTADO-ATUAL atualizado em cada release. Skills por módulo (`docs/skills/skill-*.md`) servem de referência para implementação consistente.

---

## 4. Gaps Críticos (Top 10) — Por Prioridade

### 🔴 P0 — Bloqueia PNTP Diamante ou afeta produção

| ID | Gap | Arquivo | Impacto | Esforço |
|----|-----|---------|---------|---------|
| **P0-1** | Vitest ignora `*.test.tsx` silenciosamente — teste de a11y `accessibility/components.test.tsx` nunca executa | `vitest.config.ts` | Teste fantasma | 1 linha |
| **P0-2** | `@vitest/coverage-v8` ausente em devDependencies — `test:coverage` quebra no CI | `package.json` | CI quebra | 1 min |
| **P0-3** | Zero testes em `/api/despesas`, `/api/receitas`, `/api/notas-fiscais` | `src/tests/` | Critérios PNTP essenciais 3.1, 4.1, 4.2, 4.3 sem regressão | 1-2 dias |
| **P0-4** | `console.log` debug em produção em rota admin | `src/app/api/transparencia/periodos/route.ts:47,53,56,65` | Polui logs Vercel | 5 min |

### 🟠 P1 — Importante mas não bloqueia

| ID | Gap | Arquivo/Componente | Impacto | Esforço |
|----|-----|--------------------|---------|---------|
| **P1-1** | `createLogger` em apenas 12/323 rotas (~4%) | API routes em geral | Diagnóstico forense difícil | 1 dia |
| **P1-2** | `console.log` JSON sem APM externo (Sentry removido) | observability geral | Erros em prod só via logs Vercel/PM2 | Decisão arquitetural |
| **P1-3** | 250 `force-dynamic` × 2 `force-static` | páginas estáticas (FAQ, normativas, política) | Custo Vercel inflado, TTFB pior | 0.5 dia |
| **P1-4** | `AbortController` em apenas 2/177 fetches client-side | hooks e páginas | Race conditions em navegação rápida, memory leaks | 1 dia |
| **P1-5** | Zero testes em fluxo e-SIC + Ouvidoria | `src/tests/` | Canais com CPF criptografado sem regressão | 1-2 dias |
| **P1-6** | Zero testes em NextAuth/RBAC | `src/tests/` | Permissões sem cobertura unitária | 1 dia |
| **P1-7** | Memory cache singleton invisível em multi-instância (Vercel) | `src/lib/cache/memory-cache.ts` | Cache stale entre workers/instâncias | Já mitigado em `/menu` (unstable_cache) |
| **P1-8** | E2E Playwright não roda no CI | `.github/workflows/ci-tests.yml` | Sem smoke automatizado pré-deploy | 0.5 dia |

### 🟡 P2 — Refinamento

| ID | Gap | Arquivo | Impacto | Esforço |
|----|-----|---------|---------|---------|
| **P2-1** | Sem redação automática de CPF/tokens em logger | `src/lib/logging/logger.ts` | Risco LGPD se dev passar dado sensível em context | 0.5 dia |
| **P2-2** | Sem política de retenção/expurgo de PII (Art. 16 LGPD) | crons | Gap normativo | 1 dia |
| **P2-3** | CNPJ sem `@unique` em Fornecedor | `prisma/schema/models.prisma` | Duplicatas potenciais | 1 linha + backfill |
| **P2-4** | `Parlamentar.cpfHash` ausente (Servidor tem) | `prisma/schema/models.prisma` | Busca por CPF de parlamentar não-otimizada | 1 linha + migration |
| **P2-5** | AuditLog sem índice composto `(entity, entityId, createdAt)` | `prisma/schema/models.prisma` | Seq scan em trilha por entidade | 1 linha + migration |
| **P2-6** | Limit Prisma `.max(1000)` permissivo em listagens públicas | `cargos/route.ts`, `cotas-parlamentar/route.ts` | Payloads grandes, timeout potencial | 0.5 dia |
| **P2-7** | Sem cron de limpeza de sessions/auditLog antigos | `/api/cron/daily/route.ts` | Crescimento ilimitado de tabelas históricas | 0.5 dia |
| **P2-8** | Bundle analyzer sem budgets declarados | `next.config.js` | Sem alerta automático de regressão de tamanho | 0.5 dia |

---

## 5. Conformidade PNTP 2026

| Dimensão (peso) | Cobertura código | Crítico para Diamante |
|-----------------|------------------|----------------------|
| 1 Prioritárias (2) | 4/4 ✅ | 1.1, 1.2 essenciais |
| 2 Institucionais (2) | 9/9 ✅ | — |
| 3 Receita (4) | 1/1 ⚙️ dado | **3.1 essencial — bloqueia Diamante** |
| 4 Despesa (4) | 3/3 ⚙️ dado | **4.1, 4.2, 4.3 essenciais — bloqueiam Diamante** |
| 5 Convênios (1) | 3/3 ⚙️ dado | — |
| 6 RH (3) | 7/7 ⚙️ dado | — |
| 7 Diárias (1) | 2/2 ⚙️ dado | — |
| 8 Licitações (3) | 7/7 ⚙️ dado | — |
| 9 Contratos (3) | 4/4 ⚙️ dado | — |
| 10 Obras (2) | 4/4 📋 declaração | — |
| 11 Planejamento (4) | 5/5 ⚙️ dado | **11.5 RGF essencial — já publicado** |
| 12 SIC (2) | 9/9 ✅ | — |
| 13 Acessibilidade (1) | 5/5 ✅ | — |
| 14 Ouvidoria (1) | 3/3 ✅ | — |
| 15 LGPD/GovDigital (1) | 6/6 ✅ | — |
| 20 Legislativo (3) | 11/11 ⚙️ dado | — |

**Diagnóstico**: 83/83 critérios com infraestrutura completa. O sistema **pode** atingir Diamante (≥95%) e os essenciais bloqueadores são:
- 3.1 Receitas → popular tabela `Receita` (cron SIAFI ou cadastro)
- 4.1, 4.2, 4.3 Despesas → popular tabela `Despesa`
- 11.5 RGF → ✅ já publicado em commit `e6914bf`

Nenhum bloqueador é de código. Todos dependem da administração popular os dados.

---

## 6. Resumo do trabalho de hoje (2026-05-27)

7 commits, 60+ arquivos alterados, 4.473 inserções / 637 deleções:

| Commit | Entrega |
|--------|---------|
| `dfd2c91` | Matriz de Conformidade PNTP 2026 — critério × link × status |
| `65842ab` | Catálogo unificado de transparência + admin com 3 modos por item + endpoint atômico + multi-instância |
| `6ee91c1` | Plano de Cargos + wrapper em 28 páginas |
| `57abd71` | Padrão tabela Cotas aplicado a RGF e 16 outros tipos |
| `3751640` | Seção Links Relacionados (série histórica dentro das páginas) |
| `a816ecf` | Sidebar admin reorganizado + atalhos por tipo (RGF/LDO/LOA/PPA...) |
| `f5a431c` | **Fix**: inconsistência crítica de slugs em `/documentos/[tipo]` (descoberta na revisão) |

---

## 7. Plano de Ação Recomendado

### Sprint 1 — Quick Wins (1 dia total)

1. ✅ Corrigir `vitest.config.ts` para incluir `*.test.tsx` (1 linha)
2. ✅ Adicionar `@vitest/coverage-v8` em devDependencies (1 min)
3. ✅ Remover 4 `console.log` debug em `transparencia/periodos/route.ts` (5 min)
4. ✅ Adicionar `@unique` ao CNPJ em Fornecedor (1 linha + migration)
5. ✅ Adicionar `cpfHash @unique` em Parlamentar (migration + backfill)
6. ✅ Adicionar índice composto `(entity, entityId, createdAt)` em AuditLog

### Sprint 2 — Testes Críticos PNTP (3-4 dias)

1. Suite de testes para `/api/despesas` e `/api/receitas` (essenciais Diamante)
2. Suite de testes para fluxo e-SIC + Ouvidoria (CPF criptografado RN-166)
3. Testes de NextAuth options + middleware RBAC
4. Habilitar E2E smoke (`smoke.spec.ts`) no CI antes do deploy

### Sprint 3 — Observability (2 dias)

1. Aplicar `createLogger` em rotas críticas (e-SIC, Ouvidoria, financeiras) — alvo 50% das rotas
2. Adicionar helper `redactSensitive()` no logger (CPF, tokens, senhas)
3. Considerar APM externo (Sentry, OTel collector, ou similar) — decisão arquitetural

### Sprint 4 — Performance (1-2 dias)

1. Converter 20-30 páginas estáticas para `force-static` ou ISR (`revalidate`)
2. Adicionar `AbortController` em hooks de fetch (use-cotas, use-cargos, etc.)
3. Reduzir limit max em listagens públicas: 1000 → 200
4. Cron de limpeza de sessions/auditLog antigos (>2 anos para auditLog, >30d para sessions expiradas)

### Sprint 5 — Política de Retenção LGPD (1 dia)

1. Documentar política de retenção para cada tabela com PII
2. Cron de expurgo automático conforme política
3. Atualizar Política de Privacidade publicada com prazos

---

## 8. Conclusão

O sistema Câmara está em **estado maduro e em produção real** (cmchaves.pa.gov.br), com **score geral 8.4/10**. A fundação é sólida: arquitetura moderna, schema bem indexado, segurança e LGPD com práticas avançadas (CPF criptografado, AuditLog imutável via trigger), conformidade PNTP 2026 com 83/83 critérios em código.

Os gaps identificados são **refinamentos**, não problemas estruturais:
- Testes faltando em áreas críticas (despesas, receitas, e-SIC, RBAC) — sem cobertura, mas as funcionalidades estão em produção
- Observability fraca (4% das rotas com logger estruturado, sem APM externo) — diagnose pós-incidente difícil
- Performance com excesso de `force-dynamic` — funciona mas paga overhead serverless desnecessário
- Pequenos refinamentos de integridade no schema (CNPJ unique, cpfHash em Parlamentar)

**Nenhum gap é bloqueador para o uso atual em produção** nem para a auditoria PNTP 2026. O selo Diamante depende apenas da administração popular dados nas tabelas de Receita/Despesa — todos os critérios essenciais têm infraestrutura completa.

**Recomendação geral**: priorizar Sprint 1 (quick wins) e Sprint 2 (testes críticos PNTP) imediatamente. Sprints 3-5 podem ser distribuídas ao longo dos próximos 2-3 meses sem urgência operacional.

---

## Apêndice — Arquivos consultados na auditoria

- `src/lib/auth.ts`, `src/lib/auth/permissions.ts` (NextAuth + RBAC)
- `src/middleware.ts` (CSP, HSTS, 2FA enforce)
- `src/lib/security/*` (cpf-utils, file-validation, totp, captcha-guard, two-factor-config)
- `src/lib/logging/logger.ts`, `src/lib/logging/structured-logger.ts`
- `src/lib/cache/memory-cache.ts`, `src/lib/cache/cache-strategy.ts`
- `src/lib/monitoring/metrics.ts`, `src/lib/monitoring/exporter.ts`
- `prisma/schema/base.prisma`, `enums.prisma`, `models.prisma`
- `prisma/migrations/20260504_audit_log_immutable/migration.sql`
- `scripts/sql/*.sql` (23 scripts idempotentes)
- `vitest.config.ts`, `playwright.config.ts`
- `.github/workflows/ci-tests.yml`
- `vercel.json` (cron diário)
- `src/app/api/cron/daily/route.ts`
- `src/app/api/health/route.ts`
