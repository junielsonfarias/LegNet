#!/bin/bash
# ============================================================================
# SINCRONIZA public/uploads/ (fotos, PDFs, documentos) PARA O VPS
#
# Os uploads são git-ignored e NÃO vão no seed — este script leva os arquivos
# binários da máquina DEV para /opt/camara/public/uploads no VPS (servido pelo
# nginx em /uploads/). Rode DEPOIS da instalação.
#
# USO (na raiz do projeto, Git Bash / WSL / Linux / macOS):
#   bash scripts/sync-uploads.sh                 # sincroniza TUDO (~3 GB)
#   bash scripts/sync-uploads.sh parlamentares   # só uma subpasta (rápido)
#   bash scripts/sync-uploads.sh logos
#
# Usa rsync (resumível) se disponível; senão, tar sobre ssh (stream único,
# sem arquivo temporário). Reaplica permissões e recarrega o nginx no fim.
# Config de destino: deploy/deploy.config (VPS_HOST/VPS_USER) ou variáveis env.
# ============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
ok()  { echo -e "  ${GREEN}✓${NC} $1"; }
die() { echo -e "  ${RED}✗ $1${NC}"; exit 1; }

cd "$(dirname "$0")/.."

CONFIG="${CONFIG:-deploy/deploy.config}"
if [ -f "$CONFIG" ]; then set -a; . "$CONFIG"; set +a; fi
VPS_HOST="${VPS_HOST:-177.153.50.104}"
VPS_USER="${VPS_USER:-root}"
REMOTE_DIR="${REMOTE_UPLOADS:-/opt/camara/public/uploads}"

SRC="public/uploads"
SUB="${1:-}"
[ -d "$SRC" ] || die "Pasta $SRC não encontrada (rode na raiz do projeto)."
if [ -n "$SUB" ]; then
  [ -d "$SRC/$SUB" ] || die "Subpasta $SRC/$SUB não existe."
fi

echo -e "${CYAN}== Sync de uploads ==${NC}"
echo -e "  Origem:  $SRC/${SUB:+$SUB/}  ($(du -sh "$SRC/${SUB:-}" 2>/dev/null | cut -f1))"
echo -e "  Destino: ${VPS_USER}@${VPS_HOST}:$REMOTE_DIR/${SUB:+$SUB/}"
command -v ssh >/dev/null || die "ssh não encontrado."

# Garante a pasta remota (e a subpasta, se for o caso).
ssh "$VPS_USER@$VPS_HOST" "mkdir -p '$REMOTE_DIR/${SUB:-}'" || die "não consegui criar a pasta remota (host/senha?)."

if command -v rsync >/dev/null 2>&1; then
  echo -e "${CYAN}==> rsync (resumível)${NC}"
  rsync -az --info=progress2 "$SRC/${SUB:+$SUB/}" "$VPS_USER@$VPS_HOST:$REMOTE_DIR/${SUB:+$SUB/}" \
    || die "rsync falhou."
else
  echo -e "${CYAN}==> tar sobre ssh (rsync ausente — não resumível; se cair, rode de novo)${NC}"
  tar -C "$SRC" -cf - "${SUB:-.}" | ssh "$VPS_USER@$VPS_HOST" "tar -C '$REMOTE_DIR' -xf -" \
    || die "transferência (tar/ssh) falhou."
fi
ok "arquivos transferidos"

# Permissões p/ o nginx (www-data) ler + recarrega o nginx.
echo -e "${CYAN}==> ajustando permissões e recarregando nginx${NC}"
ssh "$VPS_USER@$VPS_HOST" "chown -R root:root '$REMOTE_DIR' && \
  find '$REMOTE_DIR' -type d -exec chmod 755 {} + && \
  find '$REMOTE_DIR' -type f -exec chmod 644 {} + && \
  (systemctl reload nginx 2>/dev/null || true)" || die "falha ao ajustar permissões."
ok "permissões ok, nginx recarregado"

echo ""
ok "Uploads sincronizados (${SUB:-tudo}). As imagens/documentos já devem carregar."
