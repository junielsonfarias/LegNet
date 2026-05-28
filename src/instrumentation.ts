export async function register() {
  // QW-3: garante Upstash Redis configurado em producao (rate-limit distribuido)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { assertRedisInProduction } = await import('@/lib/env-validation')
    assertRedisInProduction()
  }
}
