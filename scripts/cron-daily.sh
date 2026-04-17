#!/usr/bin/env bash
# Cron diário de prazos legais (VPS).
# Instalar no crontab: `0 3 * * * /opt/camara/scripts/cron-daily.sh >> /var/log/camara-cron.log 2>&1`
#
# Dispara /api/cron/daily que executa:
#   - Sanção tácita (RN-081): 15 dias úteis sem ação do Executivo
#   - Notificações de prazo (RN-084): pareceres e vetos próximos do vencimento

set -euo pipefail

# Carrega variáveis da aplicação (.env). Tenta os dois caminhos mais comuns.
for ENV_FILE in /opt/camara/.env /opt/camara/.env.production; do
  if [[ -f "$ENV_FILE" ]]; then
    # shellcheck disable=SC1090
    set -o allexport
    source "$ENV_FILE"
    set +o allexport
    break
  fi
done

if [[ -z "${CRON_SECRET:-}" ]]; then
  echo "[cron-daily] ERRO: CRON_SECRET não configurado" >&2
  exit 1
fi

BASE_URL="${APP_URL:-${NEXTAUTH_URL:-http://localhost:3000}}"
ENDPOINT="${BASE_URL%/}/api/cron/daily"

echo "[cron-daily] $(date -Is) chamando $ENDPOINT"

HTTP_CODE=$(curl -s -o /tmp/cron-daily.out -w "%{http_code}" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -X POST "$ENDPOINT" \
  --max-time 120)

echo "[cron-daily] HTTP $HTTP_CODE"
cat /tmp/cron-daily.out
echo ""

if [[ "$HTTP_CODE" != "200" ]]; then
  echo "[cron-daily] FALHA — HTTP $HTTP_CODE" >&2
  exit 1
fi
