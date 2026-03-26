#!/bin/bash
# ============================================================================
# CONFIGURADOR DE SSL - Sistema Legislativo
# Configura HTTPS com Let's Encrypt para o portal da Câmara
# ============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

INSTALL_DIR="/opt/camara"

log() { echo -e "  ${GREEN}✓${NC} $1"; }
warn() { echo -e "  ${YELLOW}!${NC} $1"; }
error() { echo -e "  ${RED}✗${NC} $1"; }
info() { echo -e "  ${BLUE}→${NC} $1"; }

# Verificar root
if [ "$EUID" -ne 0 ]; then
  error "Execute como root: ${BOLD}sudo bash ssl-setup.sh${NC}"
  exit 1
fi

echo ""
echo -e "${CYAN}${BOLD}"
echo "  ╔══════════════════════════════════════════════╗"
echo "  ║   CONFIGURACAO DE SSL/HTTPS                  ║"
echo "  ║   Let's Encrypt - Certificado Gratuito       ║"
echo "  ╚══════════════════════════════════════════════╝"
echo -e "${NC}"

# Verificar se sistema esta instalado
if [ ! -d "$INSTALL_DIR" ] || [ ! -f "$INSTALL_DIR/.env" ]; then
  error "Sistema nao encontrado em $INSTALL_DIR"
  error "Instale o sistema primeiro com: sudo bash install.sh"
  exit 1
fi

# Coletar dominio
echo -e "  ${BOLD}Pre-requisitos:${NC}"
echo -e "  1. Ter um dominio apontando para o IP deste servidor"
echo -e "  2. Porta 80 e 443 abertas no firewall"
echo -e "  3. DNS ja propagado (verifique em https://dnschecker.org)"
echo ""

read -rp "$(echo -e ${CYAN}Dominio${NC} [ex: camara.suacidade.gov.br]: )" DOMAIN
if [ -z "$DOMAIN" ]; then
  error "Dominio e obrigatorio!"
  exit 1
fi

# Sanitizar
DOMAIN=$(echo "$DOMAIN" | sed -E 's|^https?://||; s|/+$||; s|[[:space:]]||g')

# Verificar se e IP
if echo "$DOMAIN" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+'; then
  error "SSL nao funciona com IP. Informe um dominio."
  exit 1
fi

read -rp "$(echo -e ${CYAN}Email para o certificado${NC}: )" EMAIL
if [ -z "$EMAIL" ]; then
  error "Email e obrigatorio!"
  exit 1
fi

echo ""
echo -e "  ${BOLD}Dominio:${NC} $DOMAIN"
echo -e "  ${BOLD}Email:${NC}   $EMAIL"
echo ""
read -rp "$(echo -e ${YELLOW}Confirmar e instalar SSL?${NC} [S/n]: )" CONFIRM
if [ "${CONFIRM,,}" = "n" ]; then
  exit 0
fi

echo ""

# 1. Instalar Certbot
info "Instalando Certbot..."
if ! command -v certbot &> /dev/null; then
  apt-get update -qq
  apt-get install -y -qq certbot python3-certbot-nginx
fi
log "Certbot instalado"

# 2. Atualizar Nginx com o dominio
info "Atualizando configuracao do Nginx..."
if [ -f /etc/nginx/sites-available/camara ]; then
  # Substituir server_name
  sed -i "s/server_name .*/server_name ${DOMAIN} _;/" /etc/nginx/sites-available/camara
  nginx -t && systemctl reload nginx
  log "Nginx atualizado para ${DOMAIN}"
else
  error "Configuracao Nginx nao encontrada em /etc/nginx/sites-available/camara"
  exit 1
fi

# 3. Obter certificado SSL
info "Obtendo certificado SSL para ${DOMAIN}..."
certbot --nginx -d "${DOMAIN}" --email "${EMAIL}" --agree-tos --non-interactive

if [ $? -ne 0 ]; then
  error "Falha ao obter certificado SSL!"
  echo ""
  echo -e "  Possiveis causas:"
  echo -e "  - DNS nao aponta para este servidor"
  echo -e "  - Portas 80/443 bloqueadas"
  echo -e "  - Dominio invalido"
  echo ""
  echo -e "  Tente manualmente:"
  echo -e "  ${BOLD}sudo certbot --nginx -d ${DOMAIN} --email ${EMAIL}${NC}"
  exit 1
fi

log "Certificado SSL obtido com sucesso!"

# 4. Renovacao automatica
systemctl enable certbot.timer 2>/dev/null
log "Renovacao automatica configurada"

# 5. Atualizar .env com HTTPS
info "Atualizando configuracoes do sistema..."
cd "$INSTALL_DIR"

# Atualizar URLs para HTTPS
sed -i "s|NEXTAUTH_URL=.*|NEXTAUTH_URL=\"https://${DOMAIN}\"|" .env
sed -i "s|SITE_URL=.*|SITE_URL=\"https://${DOMAIN}\"|" .env
sed -i "s|NEXT_PUBLIC_SITE_URL=.*|NEXT_PUBLIC_SITE_URL=\"https://${DOMAIN}\"|" .env
sed -i "s|NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=\"https://${DOMAIN}\"|" .env

log "URLs atualizadas para HTTPS"

# 6. Rebuild e restart
info "Recompilando aplicacao com HTTPS..."
npm run build >> /var/log/camara-install.log 2>&1
pm2 restart all >> /var/log/camara-install.log 2>&1
log "Aplicacao reiniciada"

echo ""
echo -e "${GREEN}${BOLD}"
echo "  ╔══════════════════════════════════════════════╗"
echo "  ║   SSL CONFIGURADO COM SUCESSO!               ║"
echo "  ╚══════════════════════════════════════════════╝"
echo -e "${NC}"
echo -e "  ${CYAN}URL:${NC} https://${DOMAIN}"
echo ""
echo -e "  O certificado sera renovado automaticamente."
echo -e "  Para renovar manualmente: ${BOLD}sudo certbot renew${NC}"
echo -e "  Para verificar: ${BOLD}sudo certbot certificates${NC}"
echo ""
