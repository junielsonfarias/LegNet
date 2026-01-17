/**
 * Configuracao PM2 para Producao
 * Camara Municipal de Mojui dos Campos
 */

module.exports = {
  apps: [
    {
      name: 'camara-mojui',
      script: 'npm',
      args: 'start',
      cwd: process.cwd(),
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      max_memory_restart: '1G',
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
}
