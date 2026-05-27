# Decisão Arquitetural: Observability e APM

> **Data**: 2026-05-27
> **Status**: ✅ Aprovada
> **Sprint**: 3 (SP3.3)
> **Contexto**: avaliação ponta-a-ponta apontou ausência de APM externo (Sentry foi removido em commits anteriores) como gap P1. Este documento formaliza a decisão e o plano.

---

## TL;DR

**Decisão**: manter abordagem **sem APM SaaS externo** (Sentry/Datadog/Rollbar) por enquanto. Investir em **logging estruturado JSON + Vercel Logs / PM2 logs + healthcheck + métricas custom** como camada primária de observability. Reavaliar em 12 meses ou quando atingir 50k req/mês.

**Justificativas:**

1. **Custo previsível**: APM SaaS médio custa USD 30-100/mês para esse volume. Câmara Municipal de Chaves (~10k habitantes) terá tráfego baixo nos primeiros 12 meses — o custo não se justifica.
2. **Soberania dos dados**: Câmara é órgão público. Enviar logs (potencialmente com payloads) para servidor estrangeiro pode entrar em conflito com LGPD/SOC2 e auditoria do TCMPA.
3. **Já existe infraestrutura interna**: Logger estruturado JSON + Vercel/VPS logs + AuditLog imutável (trigger Postgres) + healthcheck + métricas custom em `lib/monitoring/`. Essa pilha cobre 80% dos casos de uso.
4. **Não bloqueia produção**: Sistema está em produção desde 2026-05-21 em `cmchaves.pa.gov.br` sem APM externo.

---

## 1. O que já temos

### 1.1 Logger estruturado (`src/lib/logging/logger.ts`)

- **9 níveis e contextos** especializados: `debug`, `info`, `warn`, `error`, `auth`, `audit`, `request`, `response`, `query`, `cache`
- **JSON em produção** (NODE_ENV=production) — pode ser consumido por qualquer agregador
- **Pretty-print colorido** em desenvolvimento
- **Child loggers** com contexto herdado (`createLogger('api/lgpd/e-sic')`)
- **`redactSensitive()`** automática desde Sprint 3 (SP3.1) — CPF, CNPJ, tokens, senhas, emails redatados antes de serializar
- **Cobertura: 26+ rotas críticas** após SP3.2 (subiu de 4% para ~15% das 318 rotas; foco em LGPD + essenciais PNTP + financeiro)

### 1.2 AuditLog imutável (`prisma/migrations/20260504_audit_log_immutable/`)

- Trigger PostgreSQL bloqueia UPDATE/DELETE no nível do banco (RN-003)
- Campos: `userId`, `userEmail`, `userName`, `userRole`, `action`, `entity`, `entityId`, `ip`, `userAgent`, `status`, `metadata`, `createdAt`
- Índices compostos `(entity, entityId, createdAt)` e `(action, createdAt)` para trilha forense (SP1.6)

### 1.3 Healthcheck

- `GET /api/health` retorna `{ status, uptime, version }`
- Agendado diariamente em cron Vercel (06:00) para alertar inatividade

### 1.4 Métricas custom

- `src/lib/monitoring/metrics.ts` + `exporter.ts`
- Posta JSON em `MONITORING_WEBHOOK_URL` quando setado (Webhook para qualquer agregador)
- Flag `NEXT_PUBLIC_ENABLE_METRICS`
- Endpoint `/api/monitoramento` para métricas autenticadas

### 1.5 Cron daily

- `/api/cron/daily/route.ts` (Vercel + VPS)
- 7 jobs: sanção tácita, atas atrasadas, e-SIC vencido, tokens expirados, prazos legais, etc.
- Auth timing-safe (`crypto.timingSafeEqual`)
- Cada job em try/catch isolado, payload com `duracaoMs`

### 1.6 Error boundaries

- `app/error.tsx` (root)
- `app/admin/error.tsx`
- `app/global-error.tsx`
- Componente `<ErrorBoundary>` class para árvores de UI complexas
- Todos logam via `createLogger` quando capturam

---

## 2. O que avaliamos (alternativas)

### 2.1 Sentry — Removido em commit anterior

**Por que foi removido**:
- Import estático em diversos arquivos quebrava build na Vercel quando flag desabilitada (documentado em `feedback_sentry.md` da memória)
- Plano gratuito é limitado a 5k erros/mês — pouco para um sistema com 318 rotas em produção
- Plano pago (Team) começa em USD 26/mês — equivale a 1/3 do orçamento total Vercel

**Quando voltaria a fazer sentido**:
- ✅ Sistema atinge >50k req/mês ou >100 erros/mês
- ✅ Existe orçamento dedicado para SaaS observability
- ✅ Tribunal de Contas aprovar envio de logs para servidor estrangeiro (consulta jurídica necessária)

### 2.2 OpenTelemetry (OTel) self-hosted

**Setup**: OTel SDK no app → OTel Collector (container) → Backend (Tempo/Jaeger/Loki/Prometheus)

**Prós**:
- Open source, sem fornecedor
- Compatível com qualquer backend
- Trace distribuído (request → DB → response)
- Métricas + logs + traces unificados

**Contras**:
- Operação não-trivial: 4-5 containers, storage, retention, dashboards
- VPS Debian atual (Chaves) tem 4GB RAM, 50GB disco — apertado para Loki+Tempo+Prom
- Curva de aprendizado alta para SecLeg/Equipe

**Decisão**: Não adotar agora. Reavaliar quando houver:
- VPS dedicada de observability (separada da app)
- Operador com experiência K8s/Docker Compose

### 2.3 Axiom / Logflare / Better Stack (log aggregators baratos)

- Axiom: 0.5 GB/mês free, depois USD 25/mês
- Logflare: 12.96 GB/mês free, depois USD 50/mês
- Better Stack: 1 GB/mês free, depois USD 30/mês

**Prós**:
- Plug-and-play (transport HTTP / Vector)
- Query SQL/Lucene sobre logs
- Alertas

**Contras**:
- Mesmo problema de soberania de dados (servidor estrangeiro)
- Custo recorrente sem ganho operacional para volume atual

**Decisão**: pode ser adotado opcionalmente em flag (`MONITORING_WEBHOOK_URL`) sem mudança de código (a infra do `metrics.ts` já suporta). Ficaria a critério da administração da Câmara.

### 2.4 Vercel Observability nativo

- Vercel já agrega `console.log` em produção como **Vercel Logs** acessível em `vercel.com/<team>/<project>/logs`
- Filtro por timestamp, function, request id
- Retention: 1 dia (Free) / 7 dias (Pro) / 30 dias (Enterprise)
- **Pro está ativo** no projeto atual — temos 7 dias de retention

**Decisão**: usar Vercel Logs como camada primária no ambiente Vercel. Para a VPS de Chaves, PM2 já tem `pm2 logs camara-legislativo` com rotação de 10MB por arquivo, 10 arquivos = 100MB de histórico (~30 dias dependendo do volume).

---

## 3. Plano de observability adotado

### Camada 1: Logging estruturado (✅ Sprint 3 cobriu)

- ✅ `createLogger` consistente em 26+ rotas críticas (Sprint 3 SP3.2)
- ✅ `redactSensitive` automático (Sprint 3 SP3.1)
- ⚙️ Continuar expansão para 50% das 318 rotas em Sprints futuras (atual ~15%)

### Camada 2: Agregação de logs

- ✅ **Vercel**: Vercel Logs (7 dias retention)
- ✅ **VPS**: PM2 logs em `/root/.pm2/logs/camara-legislativo-out.log` + `error.log` (rotação 10MB × 10)
- ⚙️ Opcional: configurar `MONITORING_WEBHOOK_URL` para encaminhar a Logflare/Axiom se a Câmara quiser

### Camada 3: Métricas

- ✅ `/api/monitoramento` autenticado
- ✅ `metrics.ts` postando em webhook configurável
- ⚙️ Próxima evolução: expor formato Prometheus em `/api/metrics` (futuro — Sprint 5+)

### Camada 4: Alertas

- ✅ Cron diário consome `/api/health` e envia notificação se 5xx
- ⚙️ Próxima evolução: alerta automático quando `audit_logs.status = 'FAILED'` por mais de N requests em janela móvel

### Camada 5: Trace distribuído

- ❌ Não temos. Postgres queries não tem trace context.
- ⚙️ Futura adoção: somente após OTel self-hosted estar em prod.

---

## 4. Critérios de reavaliação

Reabrir esta decisão **se ocorrer** qualquer um:

- [ ] Volume mensal de requests > 50.000
- [ ] Mais de 100 erros 5xx por mês não diagnosticáveis com logs
- [ ] Implementação de microserviços / múltiplos deploys que demandem trace distribuído
- [ ] Câmara consegue orçamento dedicado para APM SaaS ≥ USD 30/mês
- [ ] Equipe ganha membro com experiência de operação de OTel/Grafana
- [ ] Auditoria do TCMPA exige relatórios de SLA com latência p99

---

## 5. Operacional — como diagnosticar incidentes hoje

### Vercel (produção principal)

```bash
# Logs ao vivo
vercel logs --follow

# Filtrar por rota
vercel logs --search "/api/e-sic"

# Filtrar por nível
vercel logs --search "ERROR"
```

### VPS Chaves

```bash
# Logs do PM2
pm2 logs camara-legislativo --lines 200

# Filtrar via grep
pm2 logs camara-legislativo --lines 1000 --nostream | grep -i error

# Status da app
pm2 status camara-legislativo

# Status do Postgres
sudo systemctl status postgresql
```

### Banco — trilha forense (AuditLog)

```sql
-- Histórico de uma entidade específica (índice composto SP1.6)
SELECT * FROM audit_logs
WHERE entity = 'Despesa' AND "entityId" = '<id>'
ORDER BY "createdAt" DESC LIMIT 50;

-- Dashboard de falhas recentes
SELECT action, COUNT(*) as ocorrencias
FROM audit_logs
WHERE status = 'FAILED'
  AND "createdAt" > NOW() - INTERVAL '24 hours'
GROUP BY action
ORDER BY ocorrencias DESC;
```

### Banco — verificar saúde

```sql
-- Conexões ativas
SELECT pid, state, query FROM pg_stat_activity WHERE datname = 'camara_legislativo';

-- Tabelas mais consultadas (precisa pg_stat_statements ativo)
SELECT relname, seq_scan, seq_tup_read, idx_scan, idx_tup_fetch
FROM pg_stat_user_tables
ORDER BY seq_scan DESC LIMIT 10;
```

---

## 6. Resumo: gap originalmente identificado vs. mitigação

| Gap original | Mitigação aplicada | Status |
|--------------|-------------------|--------|
| Sem APM externo (Sentry removido) | Logging estruturado JSON + Vercel/PM2 logs + AuditLog imutável | ✅ Aceito como abordagem |
| Logger usado em 4% das rotas | Aplicado em 26+ rotas críticas (LGPD + financeiras + admin) | ✅ Subiu para ~15% |
| Sem redação automática de PII | `redactSensitive()` integrado ao logger; 29 testes cobrindo | ✅ Resolvido |
| Sem alerting | Cron diário + healthcheck + AuditLog query | ⚙️ Mitigado, próxima evolução em alerting ativo |

---

## 7. Referências

- `src/lib/logging/logger.ts` — implementação do logger + redact
- `src/tests/logging/redact-sensitive.test.ts` — 29 testes do redactor
- `src/lib/monitoring/metrics.ts` — métricas custom
- `prisma/migrations/20260504_audit_log_immutable/migration.sql` — trigger imutabilidade
- `src/app/api/cron/daily/route.ts` — cron com 7 jobs
- Memória `feedback_sentry.md` — histórico da remoção
- Memória `reference_vps.md` — config PM2/VPS
