export async function register() {
  // QW-3: garante Upstash Redis em prod multi-replica.
  // Em VPS single-instance (PM2 fork), defina ALLOW_MEMORY_RATELIMIT=true no .env.
  // Erro do assert e logado mas NAO derruba o app — startup precisa ser resiliente.
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const { assertRedisInProduction } = await import('@/lib/env-validation')
      assertRedisInProduction()
    } catch (err) {
      // Log via console direto: logger pode nao estar disponivel no boot ainda
      console.error('[instrumentation] ' + (err as Error).message)
      console.error('[instrumentation] App continuando — corrija o .env e reinicie.')
    }
  }
}
