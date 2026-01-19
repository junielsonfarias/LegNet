// =============================================================================
// PM2 Ecosystem Configuration Template
// Sistema de Câmara Municipal
// =============================================================================
//
// Variáveis a serem substituídas:
//   {{APP_NAME}}   - Nome da aplicação (padrão: camara)
//   {{APP_DIR}}    - Diretório da aplicação
//   {{APP_PORT}}   - Porta da aplicação (padrão: 3000)
//   {{INSTANCES}}  - Número de instâncias (padrão: max)
//
// =============================================================================

module.exports = {
  apps: [
    {
      // =======================================================================
      // Identificação
      // =======================================================================
      name: '{{APP_NAME}}',
      script: 'npm',
      args: 'start',
      cwd: '{{APP_DIR}}',

      // =======================================================================
      // Modo de execução
      // =======================================================================
      instances: '{{INSTANCES}}',
      exec_mode: 'cluster',

      // =======================================================================
      // Ambiente
      // =======================================================================
      env: {
        NODE_ENV: 'production',
        PORT: {{APP_PORT}}
      },

      // =======================================================================
      // Logs
      // =======================================================================
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/var/log/pm2/{{APP_NAME}}-error.log',
      out_file: '/var/log/pm2/{{APP_NAME}}-out.log',
      merge_logs: true,

      // =======================================================================
      // Restart
      // =======================================================================
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',
      restart_delay: 5000,

      // =======================================================================
      // Watch (desabilitado em produção)
      // =======================================================================
      watch: false,
      ignore_watch: [
        'node_modules',
        '.git',
        'logs',
        '*.log',
        '.next/cache'
      ],

      // =======================================================================
      // Graceful shutdown
      // =======================================================================
      kill_timeout: 5000,
      listen_timeout: 10000,
      shutdown_with_message: true,

      // =======================================================================
      // Healthcheck
      // =======================================================================
      exp_backoff_restart_delay: 100,

      // =======================================================================
      // Variáveis de ambiente adicionais
      // =======================================================================
      env_production: {
        NODE_ENV: 'production',
        PORT: {{APP_PORT}}
      }
    }
  ],

  // ===========================================================================
  // Deploy configuration (opcional)
  // ===========================================================================
  deploy: {
    production: {
      user: 'root',
      host: 'localhost',
      ref: 'origin/main',
      repo: 'git@github.com:seu-usuario/camara.git',
      path: '{{APP_DIR}}',
      'pre-deploy': 'git fetch --all',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      env: {
        NODE_ENV: 'production'
      }
    }
  }
};
