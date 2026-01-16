# Ambiente de Staging & Pipeline CI

## 1. Dependências Externas
- **PostgreSQL 14+**: banco oficial; manter scripts `prisma migrate/seed` alinhados.
- **Redis (opcional)**: suportado para filas/real-time; validar necessidade antes do go-live.
- **Serviços de Streaming**: integração planejada para painel eletrônico (RTMP/HLS). Avaliar Wowza, YouTube, ou solução municipal.
- **Email/Notificações**: provider SMTP institucional; futuro suporte a SMS/push.
- **Docs SAPL**: manter alinhamento com fluxos descritos em `docs/analise-sapl-sugestoes-melhorias.md`.
- **Scripts utilitários**:
  - `npm run monitor:readiness` → readiness/health (usa `MONITORING_WEBHOOK_URL` se definido)
  - `npm run load:tramitacoes` → teste de carga K6 (usar `BASE_URL`)
  - `npm run metrics:sync` → POST manual em `/api/monitoramento`

## 2. Variáveis de Ambiente
| Variável | Descrição | Staging (mock) | Produção |
| --- | --- | --- | --- |
| `DATABASE_URL` | Conexão PostgreSQL | opcional (usa mock) | obrigatório |
| `NEXTAUTH_URL` | URL base do app | `http://staging.camara.local` | domínio oficial |
| `NEXTAUTH_SECRET` | Chave NextAuth | gerar via `openssl rand -base64 32` | idem |
| `MONITORING_WEBHOOK_URL` | Webhook opcional para métricas/logs | — | URL do coletor (Datadog/Elastic/etc.) |
| `EMAIL_SMTP_*` | Config SMTP | provider testes | provider oficial |
| `TZ_DEFAULT` | Fuso horário padrão | `America/Sao_Paulo` | idem |

Manter arquivos:
- `.env.local` → dev local (mock por padrão).
- `.env.staging` → staging controlado (usar Postgres real ou banco Docker).
- `.env.production` → produção.

## 3. Estratégia de Ambientes
- **Desenvolvimento**: Next.js com mock DB persistente (`src/lib/db.ts`).
- **Staging**:
  - Deploy em Vercel/VM interna.
  - Banco PostgreSQL (DigitalOcean/Render ou on-premise).
  - Seed controlado via `npm run db:seed` com dados fictícios.
  - Feature flags para painel eletrônico/streaming.
- **Produção**:
  - PostgreSQL gerenciado + backups.
  - Integrações externas reais (streaming, e-mail, painéis físicos).
  - Monitoramento ativo (APM, logs, alertas).

## 4. Pipeline de CI/CD
### Scripts
- `npm run lint`: regras ESLint Next.js.
- `npm run test -- --runInBand`: suíte Jest atual.
- `npm run ci:verify`: roda lint + testes (usado no CI).

### Fluxo Sugerido
1. PR abre → GitHub Actions (ou similar) executa `npm install`, `npm run ci:verify`.
2. Aprovação exige zero erros e cobertura mínima (definir meta na Fase 3).
3. Merge em `main` dispara deploy automático para staging.
4. Após validação manual, promover staging → produção.

### Base GitHub Actions (exemplo)
```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm install
      - run: npm run ci:verify
```

### Segurança Aplicada na Fase 6
- **2FA opcional para administradores**: habilitado em `Admin → Configurações → Segurança`.
  - Endpoint protegido `/api/auth/2fa` com RBAC e auditoria.
  - Segredos TOTP armazenados no usuário (`twoFactorSecret`) com backup codes.
- **Rate limiting**:
  - Todas as rotas `api/*` limitadas a 120 req/min por IP+UA.
  - Rotas de autenticação (`/api/auth/*`) com limite adicional (10 req/5min).
  - Respostas 429 padronizadas.
- **Cookies NextAuth reforçados**: `sameSite=lax`, `secure` em produção, sessões reduzidas (1h).
- **Auditoria**: logs para geração, habilitação e revogação do 2FA e para uso de webhooks públicos.

### Backups & Disaster Recovery
- **Endpoint /api/infra/backup**:
  - `POST` gera snapshot completo (mock) com metadados e auditoria.
  - `PUT` restaura apenas em ambientes sem `DATABASE_URL`.
  - `GET` lista histórico limitado e recupera snapshot individual.
- **Histórico local**: até 8 snapshots recentes persistidos em memória (`globalThis`), cada um com contagem de registros.
- **UI administrativa**: `/admin/configuracoes/backups` permite gerar, baixar (JSON) e restaurar snapshots, além de importar arquivos.
- **Recomendações**:
  - Antes de alterações críticas, gerar backup e armazenar cópia externa.
  - Validar restauração periodicamente (manual/CI) para assegurar integridade.
  - Em produção, usar snapshots do PostgreSQL + políticas institucionais (não usar mock fallback).
- Checklist completo de rollout em `docs/rollout-checklist.md`.

### Monitoramento & Observabilidade
- **Métricas (flag `NEXT_PUBLIC_ENABLE_METRICS=true`)**
  - `registerApiMetric()` registra métricas JSON no stdout (`[metric] {...}`) e, se `MONITORING_WEBHOOK_URL` estiver presente, exporta via webhook.
  - Rotas instrumentadas: `/api/tramitacoes/dashboard`, `/api/integracoes/public/notificacoes`, `/api/infra/backup`, `/api/monitoramento`.
  - Configure o coletor dos logs estruturados (Elastic, Datadog, etc.) utilizando o webhook.
- **Logs estruturados**:
  - Utilize `logInfo/logWarn/logError` (`src/lib/logging/structured-logger.ts`) para eventos relevantes.
  - `scripts/readiness-check.ts` publica resumo estruturado ao término.
- **Testes de carga**:
  - Script K6 disponível em `load-tests/scripts/k6-tramitacoes.js` (e `k6-login.js` para autenticação).
  - Executar com `npm run load:tramitacoes` (definir `BASE_URL` via env quando necessário).
- **Pipeline Go/No-Go**:
  - Workflow `.github/workflows/go-no-go.yml` executa readiness + load test (k6).
  - Configurar secrets: `DATABASE_URL`, `NEXTAUTH_SECRET`, `MONITORING_WEBHOOK_URL`, `STAGING_URL`.

## Catálogo de Publicações (SAPL)

- **API REST**:
  - `/api/publicacoes` com filtros por categoria, tipo, ano e intervalo de datas; resposta paginada.
  - `/api/publicacoes/categorias` para CRUD de categorias dinâmicas, respeitando RBAC e auditoria.
  - Rotas públicas consumidas no portal `/transparencia/publicacoes`, retornando apenas publicações `publicada=true`.
- **Serviços & Hooks**:
  - `src/lib/publicacoes-service.ts` centraliza as regras (categorias, autor tipado, visualizações, mock fallback).
  - Clientes HTTP em `src/lib/api/publicacoes-api.ts` com retry automático e fallback quando API retorna 401 (desenvolvimento sem login).
  - Hooks React (`usePublicacoes`, `useCategoriasPublicacao`, `usePublicacao`) em `src/lib/hooks/use-publicacoes.ts`.
- **Admin UI**:
  - `/admin/publicacoes` reformulado com métricas, filtros avançados, controle de publicação/rascunho e seleção de autores (parlamentar/comissão/órgão/outros).
  - `/admin/publicacoes/categorias` para criação, ordenação, ativação e remoção de categorias, com indicação visual por cor.
- **Portal Público**:
  - `/transparencia/publicacoes` consome a API real, suporta filtros combinados, mostra estatísticas e permite download direto dos arquivos anexados.

## 5. Dados de Teste & Governança
- Dados sensíveis devem ser mascarados antes de subir para staging.
- `docs/PLANO_EXECUCAO_COMPLETO.md` mapeia features; vincular backlog.
- Registrar responsáveis por módulo (parlamentares, sessões, painel) e agenda de reviews quinzenais.
- Checklist antes de cada merge:
  1. Lint/Testes ok.
  2. Atualização de documentação (quando necessário).
  3. Logs de auditoria revisados.

## 6. Próximos Passos
- Configurar pipeline real no repositório (ação GitHub ou GitLab CI).
- Provisionar instância PostgreSQL staging + credenciais seguras.
- Criar dados seeds específicos para demonstração.
- Definir processo de rollback (snapshots DB + deploy anterior).

