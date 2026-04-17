/**
 * Configuracao PM2 para Producao
 * Sistema Legislativo Municipal
 */

module.exports = {
  apps: [
    {
      name: 'camara-legislativo',
      script: 'npm',
      args: 'start',
      cwd: process.cwd(),
      // IMPORTANTE: next start faz bind em uma unica porta (PORT).
      // Cluster mode com `instances: 'max'` leva ao conflito EADDRINUSE,
      // onde apenas 1 instancia permanece online e as outras entram em
      // loop de restart silencioso. Para rodar N instancias de verdade,
      // e necessario:
      //   instances: N,
      //   increment_var: 'PORT'
      // + configurar Nginx upstream com as portas 3000..300N-1.
      // Por ora: 1 instancia em cluster_mode (mantem zero-downtime reload).
      instances: 1,
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
