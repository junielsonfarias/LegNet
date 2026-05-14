# Pendencias VPS — Producao Chaves (Maio 2026)

> **Contexto**: o PLANO-CORRECOES-MAIO-2026 (4 fases / 24 itens) foi entregue
> em 2026-05-14 e ja esta aplicado em dev/Vercel (Supabase compartilhado).
> Este documento lista o que precisa ser feito **na VPS (cmchaves.pa.gov.br)**
> para concluir o rollout.

> **Servidor**: VPS Debian 13, dir `/opt/camara`, PM2 `camara-legislativo`,
> Postgres local `camara_legislativo` (usuario `camara_app`).

---

## 1. Pre-checagem (antes de qualquer mudanca)

```bash
# 1a) Snapshot do banco (DESTRUTIVO se nao for feito)
sudo -u postgres pg_dump camara_legislativo \
  | gzip > /opt/backups/camara_legislativo_$(date +%Y%m%d_%H%M%S)_pre_maio26.sql.gz

# 1b) Confirmar versao atual
cd /opt/camara && git log --oneline -3
# Deve mostrar e6d1cea (antes da Fase 1) ou commits anteriores

# 1c) Confirmar PM2 rodando
pm2 status camara-legislativo
```

---

## 2. Update (via install.sh)

```bash
cd /opt/camara
sudo bash install.sh
# Escolher: "Atualizar instalacao existente" no menu

# OU em modo nao-interativo:
sudo bash install.sh --update
```

**O `install.sh` ja inclui** (atualizado neste commit):

- `5d` — aplica `scripts/sql/add-cpf-hash-ouvidoria-esic.sql` (F1.1)
- `5e` — aplica `scripts/sql/add-fk-indexes-2026-05.sql` (F3.5)
- `5f` — reexecuta `fix-table-ownership.sql`
- `5g` — roda `backfill-cpf-encryption.ts` automaticamente (idempotente)

Logs do update: `/var/log/camara-install-YYYYMMDD-HHMMSS.log`.

---

## 3. Variaveis de ambiente novas

Editar `/opt/camara/.env` e adicionar (ou deixar default):

```env
# F1.2 — Captcha obrigatorio em forms publicos (Ouvidoria/e-SIC/sugestoes).
# Default em producao = true (auto via NODE_ENV). Pode forcar false para
# migracao gradual enquanto os formularios sao atualizados na UI.
PUBLIC_FORMS_CAPTCHA_REQUIRED=true

# F2.7 — CSP estrita (sem 'unsafe-inline' em scripts).
# DEIXAR false ate validar Content-Security-Policy-Report-Only no console
# do navegador. Quando ativar, scripts inline do Next.js precisam de nonce.
CSP_STRICT_ENFORCE=false
```

> **NAO ALTERAR**: `ENCRYPTION_KEY` deve continuar a mesma — caso contrario
> os CPFs criptografados em servidores ficam ilegiveis. Se ela mudou em
> algum momento, abrir incidente antes de fazer qualquer rollout.

---

## 4. Validacao pos-deploy

### 4.1. Smoke test API
```bash
# Banner sessao ao vivo (cacheado)
curl -sI https://cmchaves.pa.gov.br/api/publico/sessao-ao-vivo \
  | grep -iE "cache-control|cdn-cache-control"
# Esperado: public, s-maxage=15, stale-while-revalidate=30

# Tema (cacheado em memoria)
curl -sI https://cmchaves.pa.gov.br/admin/configuracoes \
  -H "Cookie: <sessao-admin>" \
  | grep -iE "cache-control"
# Esperado: cached ou normal — verifique se a pagina carrega rapido

# Rate-limit publico
for i in {1..10}; do
  curl -sX POST https://cmchaves.pa.gov.br/api/ouvidoria \
    -H "Content-Type: application/json" \
    -d '{"tipo":"RECLAMACAO","assunto":"teste","descricao":"teste de rate limit"}' \
    -o /dev/null -w "%{http_code} "
done
# Esperado: ate 5x 201, depois 429
```

### 4.2. Confirmar migrations aplicadas
```bash
# cpfHash em Ouvidoria/e-SIC
sudo -u postgres psql camara_legislativo -c \
  "SELECT column_name FROM information_schema.columns
    WHERE table_name IN ('manifestacoes_ouvidoria','solicitacoes_esic')
    AND column_name='cpfHash';"
# Esperado: 2 linhas (uma por tabela)

# Indices FK
sudo -u postgres psql camara_legislativo -c \
  "SELECT tablename, indexname FROM pg_indexes
    WHERE schemaname='public'
    AND indexname LIKE '%_idx'
    AND tablename IN ('tramitacoes','despesas','membros_mesa_diretora',
      'filiacoes','sessoes','membros_mesa_sessao','expedientes_sessao',
      'votacoes_agrupadas')
    ORDER BY tablename, indexname;"
# Esperado: ~13 indices novos listados
```

### 4.3. Confirmar 570 testes verdes
```bash
cd /opt/camara
sudo -u camara_app npm test 2>&1 | tail -5
# Esperado: Test Files 40 passed (40), Tests 570 passed (570)
```

### 4.4. CSP Report-Only
```
Abrir https://cmchaves.pa.gov.br/ em Chrome/Firefox
Abrir DevTools -> Console
Navegar pelas paginas principais (home, parlamentares, transparencia,
proposicoes, sessao-ao-vivo)

Procurar mensagens "Content-Security-Policy-Report-Only:"
Anotar cada bloqueio reportado — sao os pontos a ajustar antes de habilitar
CSP_STRICT_ENFORCE=true.
```

---

## 5. Rollback (em caso de regressao)

### 5.1. Reverter codigo
```bash
cd /opt/camara
git fetch origin
git reset --hard e6d1cea  # commit imediatamente antes da Fase 1
sudo bash install.sh --update
```

### 5.2. As migrations sao **forward-only e idempotentes** (so adicionam
colunas/indices, nada eh dropado). Em caso de rollback:
- `cpfHash` permanece (nao quebra schema antigo).
- Indices FK permanecem (sem impacto negativo).

Para remover manualmente apenas se for absolutamente necessario:
```sql
-- Apenas em emergencia (remove a coluna e qualquer CPF criptografado nela)
-- ALTER TABLE manifestacoes_ouvidoria DROP COLUMN IF EXISTS "cpfHash";
-- ALTER TABLE solicitacoes_esic       DROP COLUMN IF EXISTS "cpfHash";
```

### 5.3. Restaurar backup completo
```bash
sudo systemctl stop pm2-camara_app  # ou: pm2 stop camara-legislativo
gunzip -c /opt/backups/camara_legislativo_<TIMESTAMP>_pre_maio26.sql.gz \
  | sudo -u postgres psql camara_legislativo
pm2 start camara-legislativo
```

---

## 6. Pos-deploy — backlog imediato (proximos 7 dias)

### 6.1. Frontend dos formularios publicos (F1.2 — completar)
3 paginas precisam exibir o desafio captcha e enviar `captchaId`+`captchaAnswer`
quando `PUBLIC_FORMS_CAPTCHA_REQUIRED=true`:

- [ ] `src/app/institucional/ouvidoria/page.tsx`
- [ ] `src/app/institucional/e-sic/page.tsx`
- [ ] `src/app/participacao-cidada/sugestoes/nova/page.tsx`

Padrao: `GET /api/auth/captcha` para obter o desafio, exibir a pergunta, e
enviar `captchaId`+`captchaAnswer` no body do POST.

### 6.2. Validar Report-Only e habilitar CSP estrita (F2.7 — completar)
1. Coletar violacoes do Report-Only durante 3-7 dias em producao.
2. Para cada violacao de script inline: aplicar nonce via middleware.
   - Next 15 docs: https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy
3. Quando lista estiver zerada, setar `CSP_STRICT_ENFORCE=true` no `.env`.

### 6.3. Habilitar Upstash (F2.6 — opcional)
O rate-limit central ja funciona com memoria em fallback. Para escalar
horizontalmente OU para que limits persistam entre restarts:

```env
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

Sem essas envs, continua usando memoria por instancia (OK em PM2 fork mode).

---

## 7. Pos-deploy — backlog medio prazo (proximas semanas)

- [ ] Cobertura E2E dos fluxos legislativos criticos (votacao, tramitacao,
      painel operador, 2FA enrollment).
- [ ] Migracao `next lint` -> ESLint CLI (Next 16 vai remover next lint).
- [ ] Conversao de paginas `/transparencia` para Server Components (relatorio
      apontou ganho de bundle).
- [ ] Coverage threshold no vitest (atualmente sem minimo enforcado).
- [ ] CI: rodar e2e em PR contra build de producao (atualmente roda `npm dev`).

---

## 8. Verificacao final

Ao terminar, atualizar `ESTADO-ATUAL.md` e este documento marcando:

- [ ] Update VPS rodado com sucesso (timestamp + commit)
- [ ] 4 smoke tests (4.1) passaram
- [ ] 2 migrations confirmadas no DB (4.2)
- [ ] 570 testes verdes em produção (4.3)
- [ ] Report-Only do CSP coletado (4.4) — quantos avisos?
- [ ] `PUBLIC_FORMS_CAPTCHA_REQUIRED` setado em `.env`
- [ ] `CSP_STRICT_ENFORCE` setado como `false` (proximo passo: validar antes de ligar)

---

## Referencias rapidas

| Item | Localizacao |
|------|-------------|
| Plano completo | `docs/PLANO-CORRECOES-MAIO-2026.md` |
| Estado atual | `ESTADO-ATUAL.md` |
| Regras novas | `REGRAS-DE-NEGOCIO.md` (RN-166, RN-167) |
| Migrations | `scripts/sql/add-cpf-hash-ouvidoria-esic.sql`, `scripts/sql/add-fk-indexes-2026-05.sql` |
| Backfill | `scripts/backfill-cpf-encryption.ts` |
| Helpers segurança | `src/lib/security/{captcha-guard,safe-redirect,file-validation,cpf-utils,encryption}.ts` |
| Helpers cache | `src/lib/cache/{memory-cache,theme-colors-cache}.ts`, `src/lib/http-cache.ts` |
| Validation schemas | `src/lib/validation/{auditoria-schema,servidor-schema}.ts` |
