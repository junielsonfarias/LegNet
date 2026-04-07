#!/bin/bash
# ============================================================
# Setup novo domínio: cmchaves.pa.gov.br
# Executa na VPS como root após git pull
# ============================================================

set -e

NOVO_DOMINIO="cmchaves.pa.gov.br"
ANTIGO_DOMINIO="cmchaves.transparencialeg.com"
APP_DIR="/opt/camara"
APP_PORT="3000"
EMAIL="junielson.farias@gmail.com"
PM2_APP="camara-legislativo"

echo "========================================="
echo "  Setup: $NOVO_DOMINIO"
echo "========================================="

# 1. Instalar certbot se não tiver
echo ""
echo "[1/7] Verificando certbot..."
if ! command -v certbot &> /dev/null; then
    apt update && apt install -y certbot python3-certbot-nginx
    echo "  ✓ Certbot instalado"
else
    echo "  ✓ Certbot já instalado"
fi

# 2. Criar config Nginx para novo domínio
echo ""
echo "[2/7] Configurando Nginx para $NOVO_DOMINIO..."
cat > /etc/nginx/sites-available/$NOVO_DOMINIO << NGINX
server {
    listen 80;
    server_name $NOVO_DOMINIO www.$NOVO_DOMINIO;

    location / {
        proxy_pass http://127.0.0.1:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
        client_max_body_size 10M;
    }
}
NGINX
echo "  ✓ Config criada em /etc/nginx/sites-available/$NOVO_DOMINIO"

# 3. Ativar novo site e desativar antigo
echo ""
echo "[3/7] Ativando site e desativando $ANTIGO_DOMINIO..."
ln -sf /etc/nginx/sites-available/$NOVO_DOMINIO /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/$ANTIGO_DOMINIO

# Criar redirect do domínio antigo (se SSL antigo existir)
if [ -d "/etc/letsencrypt/live/$ANTIGO_DOMINIO" ]; then
    cat > /etc/nginx/sites-available/$ANTIGO_DOMINIO << NGINX_REDIR
server {
    listen 80;
    listen 443 ssl;
    server_name $ANTIGO_DOMINIO;

    ssl_certificate /etc/letsencrypt/live/$ANTIGO_DOMINIO/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$ANTIGO_DOMINIO/privkey.pem;

    return 301 https://$NOVO_DOMINIO\$request_uri;
}
NGINX_REDIR
    ln -sf /etc/nginx/sites-available/$ANTIGO_DOMINIO /etc/nginx/sites-enabled/
    echo "  ✓ Redirect $ANTIGO_DOMINIO → $NOVO_DOMINIO configurado"
fi

nginx -t && systemctl reload nginx
echo "  ✓ Nginx recarregado"

# 4. Gerar SSL com Let's Encrypt
echo ""
echo "[4/7] Gerando certificado SSL para $NOVO_DOMINIO..."
certbot --nginx -d $NOVO_DOMINIO --non-interactive --agree-tos --email $EMAIL --redirect
echo "  ✓ SSL ativado"

# 5. Atualizar .env
echo ""
echo "[5/7] Atualizando variáveis de ambiente..."
cd $APP_DIR

# Backup do .env
cp .env .env.bak.$(date +%Y%m%d%H%M%S)

# Substituir domínio antigo pelo novo em todo o .env
sed -i "s|$ANTIGO_DOMINIO|$NOVO_DOMINIO|g" .env

# Garantir NEXTAUTH_URL e SITE_URL corretos
sed -i "s|NEXTAUTH_URL=.*|NEXTAUTH_URL=https://$NOVO_DOMINIO|" .env
sed -i "s|NEXT_PUBLIC_SITE_URL=.*|NEXT_PUBLIC_SITE_URL=https://$NOVO_DOMINIO|" .env

echo "  ✓ .env atualizado (backup salvo)"
echo ""
echo "  Variáveis atualizadas:"
grep -E "NEXTAUTH_URL|NEXT_PUBLIC_SITE_URL" .env

# 6. Rebuild da aplicação
echo ""
echo "[6/7] Rebuild da aplicação..."
pm2 stop $PM2_APP
npm run build
pm2 restart $PM2_APP
echo "  ✓ Aplicação reiniciada"

# 7. Verificar
echo ""
echo "[7/7] Verificando..."
sleep 3
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://$NOVO_DOMINIO)
echo "  Status HTTPS: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
    echo ""
    echo "========================================="
    echo "  ✅ SUCESSO! Site ativo em:"
    echo "  https://$NOVO_DOMINIO"
    echo "========================================="
else
    echo ""
    echo "========================================="
    echo "  ⚠️  Status $HTTP_CODE - verifique os logs:"
    echo "  pm2 logs $PM2_APP --lines 20"
    echo "  nginx -t"
    echo "========================================="
fi
