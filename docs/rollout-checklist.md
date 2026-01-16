# Checklist de Rollout (Go/No-Go)

## 1. Preparação
- [ ] Gerar backup mock antes de qualquer alteração: `npm run db:migrate-mock` (apenas após exportar snapshot via `/admin/configuracoes/backups`).
- [ ] Exportar snapshot mock atualizado: `/admin/configuracoes/backups` → “Gerar backup” → baixar JSON e armazenar em cofre seguro.
- [ ] Validar variáveis de ambiente sensíveis:
  - `DATABASE_URL`
  - `NEXTAUTH_SECRET`
  - SMTP (`EMAIL_SMTP_HOST`, `EMAIL_SMTP_USER`, `EMAIL_SMTP_PASS`)
- [ ] Definir credenciais de acesso administrativo para produção.

## 2. Migração de Dados
- [ ] Garantir acesso ao banco PostgreSQL (rede / firewall liberado).
- [ ] Executar `npm run db:migrate-mock` para migrar dados do mock para o banco real.
- [ ] Rodar `npx prisma migrate deploy` (ou `prisma migrate deploy`) para aplicar migrations pendentes.
- [ ] Validar dados críticos via Prisma Studio ou queries rápidas (parlamentares, usuários ADMIN, proposições, tramitações).

## 3. Readiness & Saúde
- [ ] Executar `npm run ci:readiness` e garantir `failures = 0`.
- [ ] Registrar métricas ativando `NEXT_PUBLIC_ENABLE_METRICS=true` (verificar logs `[metric]`).
- [ ] Rodar suíte CI completa: `npm run ci:verify`.
- [ ] Validar logs e auditoria ativos (`/admin/auditoria`).
- [ ] Configurar monitoramento de uptime/APM (New Relic, Datadog, etc.) e alertas.

## 4. Testes de Carga (quando aplicável)
- [ ] Preparar script de carga (ex.: k6) com cenários básicos (login, consulta tramitações, geração de relatórios).
- [ ] Executar `npm run load:tramitacoes` (definir `BASE_URL` para ambiente alvo).
- [ ] Validar login com `npm run load:tramitacoes` + `LOGIN_EMAIL/LOGIN_PASSWORD` ou script dedicado `load-tests/scripts/k6-login.js`.
- [ ] Executar teste com volume esperado + 50%.
- [ ] Avaliar consumo de recursos (CPU/Memória/Conexões DB).

## 5. Go/No-Go
- [ ] Plano de rollback documentado (restauração do backup JSON ou snapshot PostgreSQL).
- [ ] Time de suporte disponível (TI + Secretaria Legislativa).
- [ ] Comunicação para usuários finais aprovada (cronograma, canais de suporte).
- [ ] Aprovação final registrada (Diretoria / Mesa Diretora).
- [ ] Executar workflow GitHub Actions **Go-No-Go Readiness** e anexar relatório.

> **Observação:** Em produção, use snapshots oficiais do PostgreSQL (pg_dump, base backups, managed snapshots). O mecanismo mock serve apenas para desenvolvimento/controlar seeds.

