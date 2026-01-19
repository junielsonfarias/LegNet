#!/bin/bash
# =============================================================================
# setup-pm2.sh - Configuração do PM2
# Sistema de Câmara Municipal - Instalador
# =============================================================================

# Carrega dependências
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/colors.sh"
source "${SCRIPT_DIR}/utils.sh"

# =============================================================================
# Constantes
# =============================================================================

PM2_APP_NAME="camara"
PM2_ECOSYSTEM_FILE="ecosystem.config.js"

# =============================================================================
# Instalação do PM2
# =============================================================================

# Instala PM2 globalmente
install_pm2() {
    if command_exists pm2; then
        success "PM2 já está instalado: $(pm2 --version)"
        return 0
    fi

    info "Instalando PM2..."

    npm install -g pm2

    if command_exists pm2; then
        success "PM2 instalado: $(pm2 --version)"
        return 0
    fi

    error "Falha ao instalar PM2"
    return 1
}

# =============================================================================
# Configuração do PM2
# =============================================================================

# Gera arquivo ecosystem.config.js
generate_pm2_ecosystem() {
    local app_dir="$1"
    local app_name="${2:-$PM2_APP_NAME}"
    local port="${3:-3000}"
    local instances="${4:-max}"
    local ecosystem_file="${app_dir}/${PM2_ECOSYSTEM_FILE}"

    info "Gerando configuração PM2..."

    cat > "$ecosystem_file" << EOF
// =============================================================================
// PM2 Ecosystem Configuration - Sistema de Câmara Municipal
// Gerado pelo instalador em $(date '+%Y-%m-%d %H:%M:%S')
// =============================================================================

module.exports = {
  apps: [
    {
      // Identificação
      name: '${app_name}',
      script: 'npm',
      args: 'start',
      cwd: '${app_dir}',

      // Modo de execução
      instances: '${instances}',
      exec_mode: 'cluster',

      // Ambiente
      env: {
        NODE_ENV: 'production',
        PORT: ${port}
      },

      // Logs
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/var/log/pm2/${app_name}-error.log',
      out_file: '/var/log/pm2/${app_name}-out.log',
      merge_logs: true,

      // Restart
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',
      restart_delay: 5000,

      // Watch (desabilitado em produção)
      watch: false,
      ignore_watch: ['node_modules', '.git', 'logs', '*.log'],

      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 10000,
      shutdown_with_message: true,

      // Healthcheck
      exp_backoff_restart_delay: 100,
    }
  ],

  // Deploy configuration (opcional)
  deploy: {
    production: {
      user: 'root',
      host: 'localhost',
      ref: 'origin/main',
      repo: 'git@github.com:seu-usuario/camara.git',
      path: '${app_dir}',
      'pre-deploy': 'git fetch --all',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      env: {
        NODE_ENV: 'production'
      }
    }
  }
};
EOF

    if [[ -f "$ecosystem_file" ]]; then
        success "Configuração PM2 gerada: $ecosystem_file"
        return 0
    fi

    error "Falha ao gerar configuração PM2"
    return 1
}

# =============================================================================
# Gerenciamento de Processos
# =============================================================================

# Inicia aplicação com PM2
pm2_start() {
    local app_dir="$1"
    local ecosystem_file="${app_dir}/${PM2_ECOSYSTEM_FILE}"

    info "Iniciando aplicação com PM2..."

    # Verifica se arquivo ecosystem existe
    if [[ ! -f "$ecosystem_file" ]]; then
        error "Arquivo ecosystem.config.js não encontrado"
        return 1
    fi

    cd "$app_dir" || return 1

    # Para instância anterior se existir
    pm2 delete "$PM2_APP_NAME" 2>/dev/null

    # Inicia nova instância
    pm2 start "$ecosystem_file" --env production

    # Aguarda inicialização
    sleep 5

    # Verifica se está rodando
    if pm2 list | grep -q "$PM2_APP_NAME.*online"; then
        success "Aplicação iniciada com PM2"
        return 0
    fi

    error "Aplicação não iniciou corretamente"
    pm2 logs "$PM2_APP_NAME" --lines 20
    return 1
}

# Para aplicação
pm2_stop() {
    info "Parando aplicação..."

    pm2 stop "$PM2_APP_NAME" 2>/dev/null

    success "Aplicação parada"
    return 0
}

# Reinicia aplicação
pm2_restart() {
    info "Reiniciando aplicação..."

    pm2 restart "$PM2_APP_NAME"

    # Aguarda restart
    sleep 3

    if pm2 list | grep -q "$PM2_APP_NAME.*online"; then
        success "Aplicação reiniciada"
        return 0
    fi

    error "Falha ao reiniciar aplicação"
    return 1
}

# Recarrega aplicação (zero-downtime)
pm2_reload() {
    info "Recarregando aplicação..."

    pm2 reload "$PM2_APP_NAME"

    # Aguarda reload
    sleep 3

    if pm2 list | grep -q "$PM2_APP_NAME.*online"; then
        success "Aplicação recarregada"
        return 0
    fi

    error "Falha ao recarregar aplicação"
    return 1
}

# Deleta aplicação do PM2
pm2_delete() {
    info "Removendo aplicação do PM2..."

    pm2 delete "$PM2_APP_NAME" 2>/dev/null
    pm2 save

    success "Aplicação removida do PM2"
    return 0
}

# =============================================================================
# Startup e Persistência
# =============================================================================

# Configura PM2 para iniciar no boot
pm2_setup_startup() {
    info "Configurando PM2 para iniciar no boot..."

    # Detecta sistema de init
    local startup_cmd
    startup_cmd=$(pm2 startup systemd -u root --hp /root 2>&1 | grep "sudo" | head -1)

    if [[ -n "$startup_cmd" ]]; then
        eval "$startup_cmd"
    else
        pm2 startup systemd -u root --hp /root
    fi

    # Salva lista de processos
    pm2 save

    success "PM2 configurado para iniciar no boot"
    return 0
}

# Remove configuração de startup
pm2_remove_startup() {
    info "Removendo configuração de startup..."

    pm2 unstartup systemd

    success "Configuração de startup removida"
    return 0
}

# Salva estado atual dos processos
pm2_save() {
    pm2 save
    success "Estado do PM2 salvo"
}

# =============================================================================
# Logs
# =============================================================================

# Cria diretório de logs
setup_pm2_logs() {
    local log_dir="/var/log/pm2"

    mkdir -p "$log_dir"
    chmod 755 "$log_dir"

    # Configura logrotate
    cat > /etc/logrotate.d/pm2 << EOF
/var/log/pm2/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 root root
    sharedscripts
    postrotate
        pm2 reloadLogs > /dev/null 2>&1 || true
    endscript
}
EOF

    success "Logs PM2 configurados em $log_dir"
    return 0
}

# Exibe logs da aplicação
pm2_logs() {
    local lines="${1:-50}"

    pm2 logs "$PM2_APP_NAME" --lines "$lines"
}

# =============================================================================
# Monitoramento
# =============================================================================

# Exibe status da aplicação
pm2_status() {
    pm2 list
}

# Exibe informações detalhadas
pm2_show() {
    pm2 show "$PM2_APP_NAME"
}

# Abre monitor interativo
pm2_monitor() {
    pm2 monit
}

# =============================================================================
# Função Principal
# =============================================================================

# Setup completo do PM2
setup_pm2_complete() {
    local app_dir="${1:-/var/www/camara}"
    local port="${2:-3000}"

    # Instala PM2
    install_pm2 || return 1

    # Configura logs
    setup_pm2_logs || return 1

    # Gera ecosystem.config.js
    generate_pm2_ecosystem "$app_dir" "$PM2_APP_NAME" "$port" || return 1

    # Inicia aplicação
    pm2_start "$app_dir" || return 1

    # Configura startup
    pm2_setup_startup || return 1

    success "PM2 configurado com sucesso"
    return 0
}

# =============================================================================
# Diagnóstico
# =============================================================================

# Diagnostica problemas do PM2
diagnose_pm2() {
    title "Diagnóstico do PM2"

    # Verifica instalação
    if command_exists pm2; then
        progress_item "done" "PM2 instalado: $(pm2 --version)"
    else
        progress_item "error" "PM2 não instalado"
        return 1
    fi

    # Verifica processos
    echo ""
    info "Processos PM2:"
    pm2 list

    # Verifica se aplicação está rodando
    echo ""
    if pm2 list | grep -q "$PM2_APP_NAME.*online"; then
        progress_item "done" "Aplicação ${PM2_APP_NAME} online"
    else
        progress_item "error" "Aplicação ${PM2_APP_NAME} não está online"
    fi

    # Verifica startup
    if systemctl is-enabled pm2-root >/dev/null 2>&1; then
        progress_item "done" "Startup configurado"
    else
        progress_item "pending" "Startup não configurado"
    fi

    # Últimas linhas de log
    echo ""
    info "Últimas linhas de log:"
    pm2 logs "$PM2_APP_NAME" --lines 10 --nostream 2>/dev/null || echo "  Sem logs disponíveis"

    echo ""
    return 0
}

# =============================================================================
# Helpers
# =============================================================================

# Verifica se aplicação está rodando
is_app_running() {
    pm2 list 2>/dev/null | grep -q "$PM2_APP_NAME.*online"
}

# Obtém PID da aplicação
get_app_pid() {
    pm2 pid "$PM2_APP_NAME" 2>/dev/null
}

# Obtém uso de memória
get_app_memory() {
    pm2 show "$PM2_APP_NAME" 2>/dev/null | grep "memory" | awk '{print $4}'
}

# Obtém uptime
get_app_uptime() {
    pm2 show "$PM2_APP_NAME" 2>/dev/null | grep "uptime" | awk '{print $4}'
}
