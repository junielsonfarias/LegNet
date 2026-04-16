#!/bin/bash
# =============================================================================
# health-check.sh - Verificacao de saude da aplicacao
# Executar via cron: */5 * * * * /opt/camara/scripts/health-check.sh
# =============================================================================
#
# Verifica se a aplicacao esta respondendo e reinicia se necessario.
# Opcional: envia alerta por webhook.
#
# Instalacao:
#   chmod +x /opt/camara/scripts/health-check.sh
#   sudo crontab -e
#   # Adicionar: */5 * * * * /opt/camara/scripts/health-check.sh >> /var/log/camara-health.log 2>&1
#
# =============================================================================

set -uo pipefail

APP_URL="${APP_URL:-http://localhost:3000}"
HEALTH_ENDPOINT="${APP_URL}/api/health"
PM2_APP="${PM2_APP:-camara-legislativo}"
MAX_RETRIES=3
RETRY_DELAY=5
WEBHOOK_URL="${MONITORING_WEBHOOK_URL:-}"
LOG_FILE="/var/log/camara-health.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

send_alert() {
    local message="$1"
    local level="${2:-warning}"

    if [ -n "$WEBHOOK_URL" ]; then
        curl -sf -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"text\":\"[$level] ${PM2_APP}: ${message}\"}" \
            > /dev/null 2>&1 || true
    fi
}

# =============================================================================
# Health check com retries
# =============================================================================

healthy=false

for attempt in $(seq 1 $MAX_RETRIES); do
    HTTP_CODE=$(curl -sf -o /dev/null -w "%{http_code}" --max-time 10 "$HEALTH_ENDPOINT" 2>/dev/null || echo "000")

    if [ "$HTTP_CODE" = "200" ]; then
        healthy=true
        break
    fi

    if [ "$attempt" -lt "$MAX_RETRIES" ]; then
        sleep $RETRY_DELAY
    fi
done

# =============================================================================
# Acoes
# =============================================================================

if [ "$healthy" = true ]; then
    # Silencioso quando saudavel (evita log excessivo)
    exit 0
fi

log "ALERTA: health check falhou (HTTP ${HTTP_CODE}) apos ${MAX_RETRIES} tentativas"

# Verifica se PM2 esta rodando o processo
PM2_STATUS=$(pm2 jlist 2>/dev/null | grep -o "\"name\":\"${PM2_APP}\"[^}]*\"status\":\"[^\"]*\"" | grep -o '"status":"[^"]*"' | cut -d'"' -f4 || echo "unknown")

if [ "$PM2_STATUS" != "online" ]; then
    log "PM2 status: ${PM2_STATUS}. Reiniciando..."
    pm2 restart "$PM2_APP" 2>/dev/null
    send_alert "App reiniciada automaticamente (status PM2: ${PM2_STATUS})" "critical"

    # Aguarda e verifica novamente
    sleep 10
    HTTP_CODE=$(curl -sf -o /dev/null -w "%{http_code}" --max-time 10 "$HEALTH_ENDPOINT" 2>/dev/null || echo "000")

    if [ "$HTTP_CODE" = "200" ]; then
        log "Recuperada apos reinicio"
        send_alert "App recuperada apos reinicio automatico" "info"
    else
        log "CRITICO: app nao recuperou apos reinicio"
        send_alert "App NAO recuperou apos reinicio. Intervencao manual necessaria." "critical"
    fi
else
    log "PM2 online mas health check falha. Possivel problema de porta ou banco."
    send_alert "Health check falhou mas PM2 online. Verificar banco/rede." "warning"
fi
