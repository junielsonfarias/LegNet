#!/bin/bash
# ============================================================================
# DEPLOY VPS — UM COMANDO, DA SUA MÁQUINA (DEV)
#
# Faz TUDO de uma vez, sem os 3 passos manuais:
#   1) lê a ENCRYPTION_KEY do .env local (automático)
#   2) envia o seed (deploy/camara-seed.sql.gz) para o VPS via scp
#   3) dispara a instalação automática no VPS via ssh (instalar-producao.sh)
#
# USO (na pasta do projeto, no Git Bash / WSL / Linux / macOS):
#   1. Copie o template e preencha uma vez:
#        cp deploy/deploy.config.example deploy/deploy.config
#        (edite ADMIN_EMAIL, ADMIN_PASSWORD, VPS_HOST, VPS_USER)
#   2. Rode:
#        bash scripts/deploy-vps.sh
#
# Reinstalar do ZERO (apaga tudo e recarrega o seed):
#        AUTO_INSTALL_MODE=reinstall bash scripts/deploy-vps.sh
#
# Requisitos na sua máquina: ssh, scp e curl (já vêm no Git Bash e no Windows 11).
# O ssh/scp pedirão a senha do VPS (a menos que você use chave SSH).
# ============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
ok()  { echo -e "  ${GREEN}✓${NC} $1"; }
warn(){ echo -e "  ${YELLOW}!${NC} $1"; }
die() { echo -e "  ${RED}✗ $1${NC}"; exit 1; }

# Vai para a raiz do projeto (o script está em scripts/).
cd "$(dirname "$0")/.."

# ---- Config: deploy/deploy.config (git-ignored) ou variáveis de ambiente ----
CONFIG="${CONFIG:-deploy/deploy.config}"
if [ -f "$CONFIG" ]; then
  # shellcheck disable=SC1090
  set -a; . "$CONFIG"; set +a
  ok "config carregada de $CONFIG"
fi

VPS_HOST="${VPS_HOST:-177.153.50.104}"
VPS_USER="${VPS_USER:-root}"
SEED_LOCAL="${SEED_LOCAL:-deploy/camara-seed.sql.gz}"
AUTO_INSTALL_MODE="${AUTO_INSTALL_MODE:-update}"
INSTALLER_URL="${INSTALLER_URL:-https://raw.githubusercontent.com/junielsonfarias/LegNet/main/scripts/instalar-producao.sh}"

: "${ADMIN_EMAIL:?defina ADMIN_EMAIL (em deploy/deploy.config ou via env)}"
: "${ADMIN_PASSWORD:?defina ADMIN_PASSWORD (>=8 caracteres)}"
[ "${#ADMIN_PASSWORD}" -ge 8 ] || die "ADMIN_PASSWORD deve ter >= 8 caracteres"

# ---- 1. ENCRYPTION_KEY: do ambiente/config ou lida do .env local (automático) ----
if [ -z "${ENCRYPTION_KEY:-}" ]; then
  [ -f .env ] || die ".env não encontrado — rode na raiz do projeto ou defina ENCRYPTION_KEY."
  ENCRYPTION_KEY="$(grep -E '^ENCRYPTION_KEY=' .env | head -1 | cut -d= -f2- | sed -e 's/^["'\'']//' -e 's/["'\'']$//' -e 's/[[:space:]]*$//')"
fi
[ -n "${ENCRYPTION_KEY:-}" ] || die "ENCRYPTION_KEY vazia/ausente (não achei em .env). É a MESMA do DEV."
ok "ENCRYPTION_KEY obtida (${#ENCRYPTION_KEY} chars) — não será exibida"

# ---- Checagens ----
[ -f "$SEED_LOCAL" ] || die "Seed não encontrado: $SEED_LOCAL
    Regere na máquina DEV (veja docs/DEPLOY-VPS-COM-DADOS.md → 'Regerar o seed')."
command -v scp >/dev/null || die "scp não encontrado (instale o OpenSSH Client)."
command -v ssh >/dev/null || die "ssh não encontrado (instale o OpenSSH Client)."

echo -e "${CYAN}== Deploy VPS ==${NC}"
echo -e "  Destino:  ${VPS_USER}@${VPS_HOST}"
echo -e "  Seed:     ${SEED_LOCAL} ($(du -h "$SEED_LOCAL" | cut -f1))"
echo -e "  Admin:    ${ADMIN_EMAIL}"
echo -e "  Modo:     ${AUTO_INSTALL_MODE} (se já existir instalação)"
echo ""

# ---- 2. Envia o seed ----
echo -e "${CYAN}==> 1/2 Enviando o seed (scp)${NC}"
scp "$SEED_LOCAL" "${VPS_USER}@${VPS_HOST}:/root/camara-seed.sql.gz" || die "scp falhou (host/senha?)."
ok "seed enviado para /root/camara-seed.sql.gz"

# ---- 3. Dispara a instalação remota ----
# As variáveis são exportadas na sessão remota e o instalador é baixado e rodado lá.
echo -e "${CYAN}==> 2/2 Instalando no VPS (ssh) — leva ~10 min${NC}"
ssh -t "${VPS_USER}@${VPS_HOST}" \
  "export ADMIN_EMAIL='$ADMIN_EMAIL' ADMIN_PASSWORD='$ADMIN_PASSWORD' ENCRYPTION_KEY='$ENCRYPTION_KEY' AUTO_INSTALL_MODE='$AUTO_INSTALL_MODE' ${SITE_DOMAIN:+SITE_DOMAIN='$SITE_DOMAIN'} ${CAMARA_NOME:+CAMARA_NOME='$CAMARA_NOME'} ${RESTORE_SEED:+RESTORE_SEED='$RESTORE_SEED'}; curl -fsSL '$INSTALLER_URL' | bash" \
  || die "instalação remota falhou (veja a saída acima e /var/log/camara-install.log no VPS)."

echo ""
ok "Deploy concluído. Acesse o site e faça login com ${ADMIN_EMAIL}."
