/**
 * Rate Limiter com Suporte a Redis
 *
 * Implementa sliding window rate limiting usando Redis ou fallback em memória.
 * Compatível com ambientes multi-instância (horizontal scaling).
 */

import { getCacheClientSync, rateLimitKeys, CacheClient } from './client'
import { logWarn } from '@/lib/logging/structured-logger'

export interface RateLimitConfig {
  /** Número máximo de requisições */
  requests: number
  /** Janela de tempo em milissegundos */
  windowMs: number
  /** Mensagem de erro quando limite excedido */
  message: string
}

export interface RateLimitResult {
  /** Se a requisição é permitida */
  allowed: boolean
  /** Requisições restantes */
  remaining: number
  /** Timestamp Unix (segundos) quando o limite reseta */
  resetAt: number
  /** Segundos até poder tentar novamente (se bloqueado) */
  retryAfter?: number
}

// Configurações predefinidas
export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  // Login - mais restritivo
  LOGIN: {
    requests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutos
    message: 'Muitas tentativas de login. Aguarde 15 minutos.'
  },
  // Reset de senha
  RESET_PASSWORD: {
    requests: 3,
    windowMs: 60 * 60 * 1000, // 1 hora
    message: 'Muitas solicitações de reset. Aguarde 1 hora.'
  },
  // Rotas de autenticação gerais
  AUTH: {
    requests: 10,
    windowMs: 5 * 60 * 1000, // 5 minutos
    message: 'Muitas tentativas. Aguarde 5 minutos.'
  },
  // APIs públicas
  PUBLIC: {
    requests: 60,
    windowMs: 60 * 1000, // 1 minuto
    message: 'Muitas requisições. Aguarde um momento.'
  },
  // APIs autenticadas
  AUTHENTICATED: {
    requests: 120,
    windowMs: 60 * 1000, // 1 minuto
    message: 'Limite de requisições excedido.'
  },
  // APIs de integração
  INTEGRATION: {
    requests: 100,
    windowMs: 60 * 1000, // 1 minuto
    message: 'Limite da API de integração excedido.'
  },
  // Operações pesadas
  HEAVY: {
    requests: 10,
    windowMs: 60 * 1000, // 1 minuto
    message: 'Aguarde antes de realizar outra operação pesada.'
  },
  // Criação de recursos
  CREATE: {
    requests: 30,
    windowMs: 60 * 1000, // 1 minuto
    message: 'Muitas criações. Aguarde um momento.'
  }
}

export type RateLimitType = keyof typeof RATE_LIMIT_CONFIGS

/**
 * Verifica rate limit usando Redis ou memória
 */
export async function checkRateLimitAsync(
  identifier: string,
  type: RateLimitType = 'PUBLIC'
): Promise<RateLimitResult> {
  const config = RATE_LIMIT_CONFIGS[type]
  const client = getCacheClientSync()
  const key = rateLimitKeys.api(type, identifier)
  const now = Date.now()
  const resetAt = Math.ceil((now + config.windowMs) / 1000)

  try {
    // Incrementa contador
    const count = await client.incr(key)

    // Se é a primeira requisição, define TTL
    if (count === 1) {
      await client.expire(key, config.windowMs)
    }

    // Verifica se excedeu limite
    if (count > config.requests) {
      const ttl = await client.ttl(key)
      const retryAfter = ttl > 0 ? ttl : Math.ceil(config.windowMs / 1000)

      logWarn({
        message: 'Rate limit excedido',
        context: {
          identifier: identifier.substring(0, 20) + '...',
          type,
          count,
          limit: config.requests
        }
      })

      return {
        allowed: false,
        remaining: 0,
        resetAt: Math.ceil(now / 1000) + retryAfter,
        retryAfter
      }
    }

    return {
      allowed: true,
      remaining: config.requests - count,
      resetAt
    }
  } catch (error) {
    // Em caso de erro, permite a requisição (fail-open)
    logWarn({
      message: 'Erro no rate limiter, permitindo requisição',
      context: { error: String(error) }
    })

    return {
      allowed: true,
      remaining: config.requests - 1,
      resetAt
    }
  }
}

/**
 * Versão síncrona simplificada (usa cache em memória interno)
 * Compatível com código existente que não pode ser async
 */
const syncRateLimitStore = new Map<string, { count: number; resetAt: number }>()

// Limpa entradas expiradas periodicamente
setInterval(() => {
  const now = Date.now()
  const entries = Array.from(syncRateLimitStore.entries())
  for (const [key, entry] of entries) {
    if (entry.resetAt < now) {
      syncRateLimitStore.delete(key)
    }
  }
}, 60000)

export function checkRateLimitSync(
  identifier: string,
  type: RateLimitType = 'PUBLIC'
): RateLimitResult {
  const config = RATE_LIMIT_CONFIGS[type]
  const key = `${type}:${identifier}`
  const now = Date.now()

  let entry = syncRateLimitStore.get(key)

  // Se não existe ou expirou, criar nova entrada
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 1,
      resetAt: now + config.windowMs
    }
    syncRateLimitStore.set(key, entry)

    // Tenta sincronizar com Redis em background
    syncWithRedis(key, type, identifier)

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

// Sincroniza contagem local com Redis em background
async function syncWithRedis(key: string, type: RateLimitType, identifier: string): Promise<void> {
  const client = getCacheClientSync()
  if (!client.isRedis()) return

  try {
    const redisKey = rateLimitKeys.api(type, identifier)
    await client.incr(redisKey)
    await client.expire(redisKey, RATE_LIMIT_CONFIGS[type].windowMs)
  } catch {
    // Ignora erros de sincronização
  }
}

/**
 * Reset manual do rate limit (para testes ou desbloqueio administrativo)
 */
export async function resetRateLimit(identifier: string, type: RateLimitType): Promise<void> {
  const client = getCacheClientSync()
  const key = rateLimitKeys.api(type, identifier)

  await client.del(key)

  // Remove também do cache local
  syncRateLimitStore.delete(`${type}:${identifier}`)
}

/**
 * Obtém estatísticas de rate limit
 */
export async function getRateLimitStats(): Promise<{
  totalEntries: number
  entriesByType: Record<string, number>
  usingRedis: boolean
}> {
  const client = getCacheClientSync()
  const entriesByType: Record<string, number> = {}

  // Contagem do cache local
  const localKeys = Array.from(syncRateLimitStore.keys())
  for (const key of localKeys) {
    const type = key.split(':')[0]
    entriesByType[type] = (entriesByType[type] || 0) + 1
  }

  // Se usando Redis, busca contagem lá também
  if (client.isRedis()) {
    try {
      const keys = await client.keys('ratelimit:api:*')
      for (const key of keys) {
        const parts = key.split(':')
        const type = parts[2]
        if (type) {
          entriesByType[`redis:${type}`] = (entriesByType[`redis:${type}`] || 0) + 1
        }
      }
    } catch {
      // Ignora erros
    }
  }

  return {
    totalEntries: syncRateLimitStore.size,
    entriesByType,
    usingRedis: client.isRedis()
  }
}
