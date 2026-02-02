/**
 * Rate Limiting Simples (Client-Safe)
 *
 * Implementação básica de rate limiting em memória.
 * Usado em código que pode ser importado tanto no servidor quanto no cliente.
 * Para uso em APIs do servidor com suporte a Redis, use @/lib/redis/rate-limiter
 */

export interface RateLimitConfig {
  requests: number
  windowMs: number
  message: string
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  retryAfter?: number
}

// Configurações predefinidas
export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  LOGIN: {
    requests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutos
    message: 'Muitas tentativas de login. Aguarde 15 minutos.'
  },
  RESET_PASSWORD: {
    requests: 3,
    windowMs: 60 * 60 * 1000, // 1 hora
    message: 'Muitas solicitações de reset. Aguarde 1 hora.'
  },
  AUTH: {
    requests: 10,
    windowMs: 5 * 60 * 1000, // 5 minutos
    message: 'Muitas tentativas. Aguarde 5 minutos.'
  },
  PUBLIC: {
    requests: 60,
    windowMs: 60 * 1000, // 1 minuto
    message: 'Muitas requisições. Aguarde um momento.'
  },
  AUTHENTICATED: {
    requests: 120,
    windowMs: 60 * 1000, // 1 minuto
    message: 'Limite de requisições excedido.'
  }
}

export type RateLimitType = keyof typeof RATE_LIMIT_CONFIGS

// Store em memória (seguro para client e server)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

// Limpa entradas expiradas periodicamente (apenas no servidor)
if (typeof window === 'undefined') {
  setInterval(() => {
    const now = Date.now()
    const entries = Array.from(rateLimitStore.entries())
    for (const [key, entry] of entries) {
      if (entry.resetAt < now) {
        rateLimitStore.delete(key)
      }
    }
  }, 60000)
}

/**
 * Verifica rate limit (versão síncrona, client-safe)
 */
export function checkRateLimitSync(
  identifier: string,
  type: RateLimitType = 'PUBLIC'
): RateLimitResult {
  const config = RATE_LIMIT_CONFIGS[type]
  if (!config) {
    return { allowed: true, remaining: 999, resetAt: Date.now() + 60000 }
  }

  const key = `${type}:${identifier}`
  const now = Date.now()

  let entry = rateLimitStore.get(key)

  // Se não existe ou expirou, criar nova entrada
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 1,
      resetAt: now + config.windowMs
    }
    rateLimitStore.set(key, entry)

    return {
      allowed: true,
      remaining: config.requests - 1,
      resetAt: Math.ceil(entry.resetAt / 1000)
    }
  }

  // Incrementar contador
  entry.count++

  // Verificar se excedeu limite
  if (entry.count > config.requests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return {
      allowed: false,
      remaining: 0,
      resetAt: Math.ceil(entry.resetAt / 1000),
      retryAfter
    }
  }

  return {
    allowed: true,
    remaining: config.requests - entry.count,
    resetAt: Math.ceil(entry.resetAt / 1000)
  }
}

/**
 * Reset rate limit para um identificador
 */
export function resetRateLimit(identifier: string, type: RateLimitType): void {
  const key = `${type}:${identifier}`
  rateLimitStore.delete(key)
}

/**
 * Obtém estatísticas básicas
 */
export function getRateLimitStats(): { totalEntries: number } {
  return { totalEntries: rateLimitStore.size }
}
