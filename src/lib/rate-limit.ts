/**
 * Rate limiter com fallback em memória e backend Upstash Redis (REST).
 *
 * - Se `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` estiverem definidos,
 *   usa Upstash via fetch (compatível com Edge runtime).
 * - Caso contrário, cai no limiter em memória por instância (dev/VPS single-node).
 *
 * Contrato: `allowRequest(key, limit, windowMs)` retorna true se a requisição
 * está dentro do limite, false se deve ser bloqueada.
 */

type RateLimitEntry = { count: number; expires: number }
type MemoryLimiter = Map<string, RateLimitEntry>

const CLEANUP_INTERVAL_MS = 60_000

const getMemoryLimiter = (): MemoryLimiter => {
  const g = globalThis as unknown as { __CAMARA_RATE_LIMITER__?: MemoryLimiter; __CAMARA_RL_LAST_CLEANUP__?: number }
  if (!g.__CAMARA_RATE_LIMITER__) {
    g.__CAMARA_RATE_LIMITER__ = new Map()
    g.__CAMARA_RL_LAST_CLEANUP__ = Date.now()
  }
  return g.__CAMARA_RATE_LIMITER__
}

const cleanupMemory = (limiter: MemoryLimiter) => {
  const g = globalThis as unknown as { __CAMARA_RL_LAST_CLEANUP__?: number }
  const now = Date.now()
  if ((g.__CAMARA_RL_LAST_CLEANUP__ ?? 0) + CLEANUP_INTERVAL_MS > now) return
  g.__CAMARA_RL_LAST_CLEANUP__ = now
  limiter.forEach((entry, key) => {
    if (entry.expires < now) limiter.delete(key)
  })
}

const allowMemory = (key: string, limit: number, windowMs: number): boolean => {
  const limiter = getMemoryLimiter()
  cleanupMemory(limiter)
  const now = Date.now()
  const current = limiter.get(key)
  if (!current || current.expires < now) {
    limiter.set(key, { count: 1, expires: now + windowMs })
    return true
  }
  if (current.count >= limit) return false
  current.count += 1
  return true
}

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN
const hasUpstash = Boolean(UPSTASH_URL && UPSTASH_TOKEN)

const allowUpstash = async (key: string, limit: number, windowMs: number): Promise<boolean> => {
  // Pipeline: INCR + EXPIRE (NX) em uma ida via REST multi-exec
  const redisKey = `rl:${key}`
  const ttlSeconds = Math.ceil(windowMs / 1000)

  try {
    const res = await fetch(`${UPSTASH_URL}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', redisKey],
        ['EXPIRE', redisKey, String(ttlSeconds), 'NX'],
      ]),
      // Falha rápida: rate limit nunca deve travar a request
      signal: AbortSignal.timeout(500),
    })

    if (!res.ok) return allowMemory(key, limit, windowMs)

    const data = (await res.json()) as Array<{ result: number | string }>
    const count = Number(data?.[0]?.result ?? 0)
    return count <= limit
  } catch {
    // Em caso de falha de rede/timeout, fallback para memória (fail-open controlado)
    return allowMemory(key, limit, windowMs)
  }
}

export const allowRequest = async (
  key: string,
  limit: number,
  windowMs: number
): Promise<boolean> => {
  if (hasUpstash) return allowUpstash(key, limit, windowMs)
  return allowMemory(key, limit, windowMs)
}

export const rateLimitBackend = hasUpstash ? ('upstash' as const) : ('memory' as const)
