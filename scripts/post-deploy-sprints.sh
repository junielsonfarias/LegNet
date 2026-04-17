#!/usr/bin/env bash
# =============================================================================
# post-deploy-sprints.sh — Pós-deploy idempotente dos Sprints 1-3 (17/04/2026)
#
# Roda DEPOIS do scripts/update.sh (que faz backup + pull + build + restart).
#
# Ações:
#   1. Garante CRON_SECRET no .env (gera se não existir)
#   2. Torna scripts/cron-daily.sh executável
#   3. Instala entrada no crontab (03:00 diário) — idempotente
#   4. Restart PM2 para carregar novo .env
#   5. Valida /api/health e /api/cron/daily
#
# Pode ser executado múltiplas vezes — todas as etapas são idempotentes.
#
# Uso:
#   sudo bash /opt/camara/scripts/post-deploy-sprints.sh
# =============================================================================

set -euo pipefail

APP_DIR="${APP_DIR:-/opt/camara}"
APP_URL="${APP_URL:-http://localhost:3000}"
CRON_LINE="0 3 * * * ${APP_DIR}/scripts/cron-daily.sh >> /var/log/camara-cron.log 2>&1"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

info()    { echo -e "${BLUE}[INFO]${NC} $*"; }
success() { echo -e "${GREEN}[✓]${NC} $*"; }
warn()    { echo -e "${YELLOW}[!]${NC} $*"; }
error()   { echo -e "${RED}[✗]${NC} $*" >&2; }

if [[ $EUID -ne 0 ]]; then
  error "Execute como root (use sudo)"
  exit 1
fi

cd "$APP_DIR"

# ---------------------------------------------------------------------------
# 1. CRON_SECRET
# ---------------------------------------------------------------------------
info "Verificando CRON_SECRET..."
if grep -q '^CRON_SECRET=' .env 2>/dev/null; then
  success "CRON_SECRET já configurado em .env"
else
  NEW_SECRET=$(openssl rand -base64 32)
  {
    echo ''
    echo '# Cron diário de prazos legais (Sprint 1 - 17/04/2026)'
    echo "CRON_SECRET=\"${NEW_SECRET}\""
  } >> .env
  success "CRON_SECRET gerado e adicionado a .env"
  echo ""
  echo -e "${YELLOW}==============================================${NC}"
  echo -e "${YELLOW}  COPIE ESTE VALOR PARA O VERCEL (env vars):${NC}"
  echo -e "${YELLOW}  CRON_SECRET=${NC}${NEW_SECRET}"
  echo -e "${YELLOW}==============================================${NC}"
  echo ""
fi

# ---------------------------------------------------------------------------
# 2. Permissões do script de cron
# ---------------------------------------------------------------------------
info "Ajustando permissões de cron-daily.sh..."
chmod +x "${APP_DIR}/scripts/cron-daily.sh"
success "cron-daily.sh executável"

# ---------------------------------------------------------------------------
# 3. Crontab idempotente
# ---------------------------------------------------------------------------
info "Instalando entrada no crontab (root)..."
CURRENT_CRON=$(crontab -l 2>/dev/null || true)
if echo "$CURRENT_CRON" | grep -Fq "cron-daily.sh"; then
  success "Entrada de cron-daily já existe no crontab"
else
  ( echo "$CURRENT_CRON"; echo "$CRON_LINE" ) | crontab -
  success "Entrada adicionada: $CRON_LINE"
fi

# ---------------------------------------------------------------------------
# 4. Restart PM2
# ---------------------------------------------------------------------------
PM2_APP="${PM2_APP:-camara-legislativo}"
if command -v pm2 >/dev/null 2>&1; then
  if pm2 list 2>/dev/null | grep -q "$PM2_APP"; then
    info "Reiniciando PM2 ($PM2_APP) para carregar novo .env..."
    pm2 restart "$PM2_APP" --update-env
    success "PM2 reiniciado"
  else
    info "Processo $PM2_APP não encontrado — iniciando pela primeira vez..."
    (cd "$APP_DIR" && pm2 start ecosystem.config.js --env production)
    pm2 save
    success "PM2 iniciado"
  fi
else
  warn "PM2 não instalado — reinicie a aplicação manualmente"
fi

# ---------------------------------------------------------------------------
# 5. Validação
# ---------------------------------------------------------------------------
info "Aguardando aplicação subir..."
sleep 5

info "Testando /api/health..."
if curl -sf "${APP_URL}/api/health" >/dev/null; then
  success "/api/health OK"
else
  warn "/api/health não respondeu — verifique pm2 logs $PM2_APP"
fi

info "Testando /api/cron/daily sem auth (deve retornar 401)..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${APP_URL}/api/cron/daily" || echo "000")
if [[ "$HTTP_CODE" == "401" ]]; then
  success "Endpoint protegido (401 sem Bearer) — OK"
else
  warn "Esperado 401, recebido $HTTP_CODE"
fi

info "Testando /api/cron/daily com Bearer..."
SECRET=$(grep '^CRON_SECRET=' .env | cut -d= -f2- | tr -d '"')
RESPONSE=$(curl -s -X POST "${APP_URL}/api/cron/daily" -H "Authorization: Bearer ${SECRET}" --max-time 60 || echo '{"error":"timeout"}')
if echo "$RESPONSE" | grep -q '"jobs"'; then
  success "Cron executou — jobs: $(echo "$RESPONSE" | grep -oE '"(sancaoTacita|notificacoesPrazo)":[^,}]*' | head -2 | tr '\n' ' ')"
else
  warn "Resposta inesperada: ${RESPONSE:0:200}"
fi

echo ""
success "Post-deploy concluído."
echo ""
echo "Próximos passos manuais:"
echo "  1. Adicionar CRON_SECRET em Vercel env vars (Production + Preview)"
echo "  2. Verificar logs em: /var/log/camara-cron.log (após primeira execução às 03:00)"
echo "  3. Monitorar pm2 logs $PM2_APP por 24h"
