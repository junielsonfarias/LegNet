/**
 * Cliente de Rate Limit com Suporte a Redis
 *
 * Este módulo fornece funções client-safe para verificar rate limits.
 * Em ambiente de servidor, chama a API interna que usa Redis.
 * Em ambiente de cliente ou em caso de erro, usa fallback em memória.
 *
 * IMPORTANTE: Este módulo é CLIENT-SAFE (não importa ioredis)
 */

import {
  checkRateLimitSync as checkMemoryRateLimit,
  resetRateLimit as resetMemoryRateLimit,
  type RateLimitResult,
  type RateLimitType
} from './rate-limit-simple'

// Header secreto para validar chamadas internas
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || 'camara-internal-2024'

// Cache de resultados para evitar múltiplas chamadas
const resultCache = new Map<string, { result: RateLimitResult; timestamp: number }>()
const CACHE_TTL = 1000 // 1 segundo

/**
 * Verifica rate limit usando Redis (via API) quando possível
 * Fallback para memória em caso de erro ou no client-side
 */
export async function checkRateLimitWithRedis(
  identifier: string,
  type: RateLimitType = 'LOGIN'
): Promise<{ allowed: boolean; remainingAttempts: number; message?: string }> {
  const cacheKey = `${type}:${identifier}`

  // Verifica cache primeiro
  const cached = resultCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return {
      allowed: cached.result.allowed,
      remainingAttempts: cached.result.remaining,
      message: cached.result.allowed ? undefined : 'Muitas tentativas. Aguarde.'
    }
  }

  // No client-side, usa apenas memória
  if (typeof window !== 'undefined') {
    const result = checkMemoryRateLimit(identifier, type)
    return {
      allowed: result.allowed,
      remainingAttempts: result.remaining,
      message: result.allowed ? undefined : 'Muitas tentativas. Aguarde.'
    }
  }

  // No servidor, tenta usar a API com Redis
  try {
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/auth/rate-limit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': INTERNAL_SECRET
      },
      body: JSON.stringify({ identifier, type }),
      // Timeout curto para não atrasar o login
      signal: AbortSignal.timeout(2000)
    })

    if (response.ok) {
      const data = await response.json()

      // Atualiza cache
      resultCache.set(cacheKey, {
        result: {
          allowed: data.allowed,
          remaining: data.remaining,
          resetAt: data.resetAt,
          retryAfter: data.retryAfter
        },
        timestamp: Date.now()
      })

      return {
        allowed: data.allowed,
        remainingAttempts: data.remaining,
        message: data.message
      }
    }

    // Se a API falhou, usa fallback
    throw new Error(`API returned ${response.status}`)
  } catch (error) {
    // Fallback para rate limit em memória
    const result = checkMemoryRateLimit(identifier, type)
    return {
      allowed: result.allowed,
      remainingAttempts: result.remaining,
      message: result.allowed ? undefined : 'Muitas tentativas. Aguarde.'
    }
  }
}

/**
 * Reseta rate limit usando Redis (via API) quando possível
 */
export async function resetRateLimitWithRedis(
  identifier: string,
  type: RateLimitType = 'LOGIN'
): Promise<void> {
  const cacheKey = `${type}:${identifier}`

  // Limpa cache local
  resultCache.delete(cacheKey)

  // Reset local sempre
  resetMemoryRateLimit(identifier, type)

  // No client-side, apenas reset local
  if (typeof window !== 'undefined') {
    return
  }

  // No servidor, tenta resetar via API (Redis)
  try {
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    await fetch(`${baseUrl}/api/auth/rate-limit`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': INTERNAL_SECRET
      },
      body: JSON.stringify({ identifier, type }),
      signal: AbortSignal.timeout(2000)
    })
  } catch {
    // Ignora erros - o reset local já foi feito
  }
}

/**
 * Versão síncrona para compatibilidade (usa apenas memória)
 * Use checkRateLimitWithRedis para suporte a Redis
 */
export function checkRateLimitSync(
  identifier: string,
  type: RateLimitType = 'LOGIN'
): { allowed: boolean; remainingAttempts: number } {
  const result = checkMemoryRateLimit(identifier, type)
  return {
    allowed: result.allowed,
    remainingAttempts: result.remaining
  }
}

// Re-exporta tipos
export type { RateLimitResult, RateLimitType }
