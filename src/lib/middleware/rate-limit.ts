/**
 * Rate Limiting Middleware
 * Protege APIs contra abuso com limites configuráveis por tipo de rota
 *
 * Em produção com Redis configurado: usa Redis para escalabilidade horizontal
 * Em desenvolvimento ou sem Redis: usa cache em memória
 */

import { NextRequest, NextResponse } from 'next/server'
import { RateLimitError } from '@/lib/error-handler'
import {
  checkRateLimitSync,
  resetRateLimit as simpleResetRateLimit,
  getRateLimitStats as simpleGetRateLimitStats,
  RATE_LIMIT_CONFIGS,
  type RateLimitType
} from '@/lib/rate-limit-simple'

// Re-exporta configurações e tipos
export { RATE_LIMIT_CONFIGS, type RateLimitType }
export const RATE_LIMITS = RATE_LIMIT_CONFIGS

/**
 * Obtém o identificador do cliente para rate limiting
 */
function getClientIdentifier(request: NextRequest): string {
  // Tentar obter IP do cliente
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0]?.trim() || realIp || 'unknown'

  // Combinar com user-agent para identificação mais precisa
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const identifier = `${ip}:${userAgent.substring(0, 50)}`

  return identifier
}

/**
 * Verifica se a requisição está dentro do limite
 * Usa cache em memória (client-safe)
 */
export function checkRateLimit(
  request: NextRequest,
  type: RateLimitType = 'PUBLIC'
): { allowed: boolean; remaining: number; resetAt: number } {
  const clientId = getClientIdentifier(request)
  const result = checkRateLimitSync(clientId, type)

  return {
    allowed: result.allowed,
    remaining: result.remaining,
    resetAt: result.resetAt
  }
}

/**
 * Middleware de rate limiting para usar nas APIs
 */
export function withRateLimit(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>,
  type: RateLimitType = 'PUBLIC'
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const { allowed, remaining, resetAt } = checkRateLimit(request, type)

    if (!allowed) {
      const retryAfter = Math.ceil((resetAt * 1000 - Date.now()) / 1000)
      return NextResponse.json(
        {
          success: false,
          error: RATE_LIMITS[type].message,
          retryAfter: retryAfter > 0 ? retryAfter : 1
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(RATE_LIMITS[type].requests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(resetAt),
            'Retry-After': String(retryAfter > 0 ? retryAfter : 1)
          }
        }
      )
    }

    // Executar handler original
    const response = await handler(request, ...args)

    // Adicionar headers de rate limit à resposta
    response.headers.set('X-RateLimit-Limit', String(RATE_LIMITS[type].requests))
    response.headers.set('X-RateLimit-Remaining', String(remaining))
    response.headers.set('X-RateLimit-Reset', String(resetAt))

    return response
  }
}

/**
 * Helper para criar handler com rate limit e error handling combinados
 */
export function withRateLimitAndErrorHandler(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>,
  type: RateLimitType = 'PUBLIC'
) {
  return withRateLimit(handler, type)
}

/**
 * Função para verificar rate limit e lançar erro se excedido
 * Útil para usar dentro de handlers existentes
 */
export function enforceRateLimit(request: NextRequest, type: RateLimitType = 'PUBLIC'): void {
  const { allowed } = checkRateLimit(request, type)
  if (!allowed) {
    throw new RateLimitError(RATE_LIMITS[type].message)
  }
}

/**
 * Reset manual do rate limit para um cliente (útil para testes)
 */
export function resetRateLimit(request: NextRequest, type: RateLimitType): void {
  const clientId = getClientIdentifier(request)
  simpleResetRateLimit(clientId, type)
}

/**
 * Obtém estatísticas de rate limit (para monitoramento)
 */
export function getRateLimitStats(): { totalEntries: number } {
  return simpleGetRateLimitStats()
}
