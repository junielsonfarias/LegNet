#!/bin/bash
# =============================================================================
# backup-cron.sh - Backup automatizado com retencao
# Executar via cron: 0 3 * * * /opt/camara/scripts/backup-cron.sh
# =============================================================================
#
# Faz backup do banco PostgreSQL e dos uploads.
# Retencao: 7 diarios, 4 semanais, 3 mensais.
#
# Instalacao:
#   chmod +x /opt/camara/scripts/backup-cron.sh
#   sudo crontab -e
#   # Adicionar: 0 3 * * * /opt/camara/scripts/backup-cron.sh >> /var/log/camara-backup.log 2>&1
#
# =============================================================================

set -euo pipefail

# Configuracao
DB_NAME="${DB_NAME:-camara_legislativo}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/camara}"
APP_DIR="${APP_DIR:-/opt/camara}"
RETENTION_DAILY=7
RETENTION_WEEKLY=4
RETENTION_MONTHLY=3

# Le DATABASE_URL do .env (user + senha + host + db do Prisma)
# Permite rodar como root sem depender do peer-auth do user postgres (que
# nao tem permissao de escrita em ${BACKUP_DIR}).
if [ -f "${APP_DIR}/.env" ]; then
    DATABASE_URL=$(grep "^DATABASE_URL=" "${APP_DIR}/.env" | cut -d= -f2- | tr -d '"' | tr -d "'")
fi
DB_USER=$(echo "$DATABASE_URL" | sed -E 's|.*//([^:]+):.*|\1|')
DB_PASS=$(echo "$DATABASE_URL" | sed -E 's|.*//[^:]+:([^@]+)@.*|\1|')
DB_HOST=$(echo "$DATABASE_URL" | sed -E 's|.*@([^:/]+).*|\1|')

if [ -z "${DB_USER:-}" ] || [ -z "${DB_PASS:-}" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERRO: DATABASE_URL nao encontrado em ${APP_DIR}/.env"
    exit 1
fi

# Timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DAY_OF_WEEK=$(date +%u)  # 1=segunda, 7=domingo
DAY_OF_MONTH=$(date +%d)

# Diretorios
DAILY_DIR="${BACKUP_DIR}/daily"
WEEKLY_DIR="${BACKUP_DIR}/weekly"
MONTHLY_DIR="${BACKUP_DIR}/monthly"

# Cria diretorios
mkdir -p "$DAILY_DIR" "$WEEKLY_DIR" "$MONTHLY_DIR"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# =============================================================================
# Backup do banco
# =============================================================================

log "Iniciando backup do banco ${DB_NAME} (user=${DB_USER}, host=${DB_HOST})..."

DUMP_FILE="${DAILY_DIR}/db_${TIMESTAMP}.dump"
DUMP_ERR="${DAILY_DIR}/db_${TIMESTAMP}.err"

# Roda como root (escreve no diretorio) + autentica como camara_app via PGPASSWORD.
# Erros nao sao silenciados: vao para .err e para o log se pg_dump falhar.
if PGPASSWORD="$DB_PASS" pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -F c -f "$DUMP_FILE" 2>"$DUMP_ERR"; then
    DUMP_SIZE=$(du -h "$DUMP_FILE" | cut -f1)
    log "Banco: OK (${DUMP_SIZE})"
    # Remove .err vazio em caso de sucesso
    [ -s "$DUMP_ERR" ] || rm -f "$DUMP_ERR"
else
    log "ERRO: falha no pg_dump (exit=$?)"
    if [ -f "$DUMP_ERR" ]; then
        log "stderr do pg_dump:"
        sed 's/^/  /' "$DUMP_ERR" | while read -r line; do log "$line"; done
    fi
    rm -f "$DUMP_FILE"
    exit 1
fi

# =============================================================================
# Backup de uploads (se existir)
# =============================================================================

UPLOADS_DIR="${APP_DIR}/public/uploads"

if [ -d "$UPLOADS_DIR" ] && [ "$(ls -A "$UPLOADS_DIR" 2>/dev/null)" ]; then
    UPLOADS_FILE="${DAILY_DIR}/uploads_${TIMESTAMP}.tar.gz"
    tar -czf "$UPLOADS_FILE" -C "${APP_DIR}/public" uploads 2>/dev/null
    UPLOADS_SIZE=$(du -h "$UPLOADS_FILE" | cut -f1)
    log "Uploads: OK (${UPLOADS_SIZE})"
else
    log "Uploads: sem arquivos, pulando"
fi

# =============================================================================
# Copia semanal (domingos)
# =============================================================================

if [ "$DAY_OF_WEEK" -eq 7 ]; then
    log "Copiando backup semanal..."
    cp "$DUMP_FILE" "${WEEKLY_DIR}/db_weekly_${TIMESTAMP}.dump"
    [ -f "${DAILY_DIR}/uploads_${TIMESTAMP}.tar.gz" ] && \
        cp "${DAILY_DIR}/uploads_${TIMESTAMP}.tar.gz" "${WEEKLY_DIR}/uploads_weekly_${TIMESTAMP}.tar.gz"
fi

# =============================================================================
# Copia mensal (dia 1)
# =============================================================================

if [ "$DAY_OF_MONTH" -eq "01" ]; then
    log "Copiando backup mensal..."
    cp "$DUMP_FILE" "${MONTHLY_DIR}/db_monthly_${TIMESTAMP}.dump"
    [ -f "${DAILY_DIR}/uploads_${TIMESTAMP}.tar.gz" ] && \
        cp "${DAILY_DIR}/uploads_${TIMESTAMP}.tar.gz" "${MONTHLY_DIR}/uploads_monthly_${TIMESTAMP}.tar.gz"
fi

# =============================================================================
# Limpeza por retencao
# =============================================================================

log "Limpando backups antigos..."

# Diarios: manter ultimos N
DAILY_COUNT=$(ls -1 "${DAILY_DIR}"/db_*.dump 2>/dev/null | wc -l)
if [ "$DAILY_COUNT" -gt "$RETENTION_DAILY" ]; then
    ls -1t "${DAILY_DIR}"/db_*.dump | tail -n +$((RETENTION_DAILY + 1)) | xargs rm -f
    ls -1t "${DAILY_DIR}"/uploads_*.tar.gz 2>/dev/null | tail -n +$((RETENTION_DAILY + 1)) | xargs rm -f 2>/dev/null
    log "Diarios: removidos $((DAILY_COUNT - RETENTION_DAILY)) antigos"
fi

# Semanais: manter ultimos N
WEEKLY_COUNT=$(ls -1 "${WEEKLY_DIR}"/db_*.dump 2>/dev/null | wc -l)
if [ "$WEEKLY_COUNT" -gt "$RETENTION_WEEKLY" ]; then
    ls -1t "${WEEKLY_DIR}"/db_*.dump | tail -n +$((RETENTION_WEEKLY + 1)) | xargs rm -f
    ls -1t "${WEEKLY_DIR}"/uploads_*.tar.gz 2>/dev/null | tail -n +$((RETENTION_WEEKLY + 1)) | xargs rm -f 2>/dev/null
    log "Semanais: removidos $((WEEKLY_COUNT - RETENTION_WEEKLY)) antigos"
fi

# Mensais: manter ultimos N
MONTHLY_COUNT=$(ls -1 "${MONTHLY_DIR}"/db_*.dump 2>/dev/null | wc -l)
if [ "$MONTHLY_COUNT" -gt "$RETENTION_MONTHLY" ]; then
    ls -1t "${MONTHLY_DIR}"/db_*.dump | tail -n +$((RETENTION_MONTHLY + 1)) | xargs rm -f
    ls -1t "${MONTHLY_DIR}"/uploads_*.tar.gz 2>/dev/null | tail -n +$((RETENTION_MONTHLY + 1)) | xargs rm -f 2>/dev/null
    log "Mensais: removidos $((MONTHLY_COUNT - RETENTION_MONTHLY)) antigos"
fi

# =============================================================================
# Resumo
# =============================================================================

TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
log "Backup concluido. Espaco total: ${TOTAL_SIZE}"
log "Retencao: ${RETENTION_DAILY}d / ${RETENTION_WEEKLY}s / ${RETENTION_MONTHLY}m"
