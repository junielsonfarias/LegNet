/**
 * Rate Limiting Middleware
 * Protege APIs contra abuso com limites configuráveis por tipo de rota
 */

import { NextRequest, NextResponse } from 'next/server'
import { RateLimitError } from '@/lib/error-handler'

// Configurações de rate limit por tipo de rota
export const RATE_LIMITS = {
  // Rotas de autenticação - mais restrito
  AUTH: {
    requests: 10,
    windowMs: 300000,  // 5 minutos
    message: 'Muitas tentativas de login. Aguarde 5 minutos.'
  },
  // Rotas públicas
  PUBLIC: {
    requests: 60,
    windowMs: 60000,   // 1 minuto
    message: 'Muitas requisições. Aguarde um momento.'
  },
  // Rotas autenticadas
  AUTHENTICATED: {
    requests: 120,
    windowMs: 60000,   // 1 minuto
    message: 'Limite de requisições excedido.'
  },
  // APIs de integração
  INTEGRATION: {
    requests: 100,
    windowMs: 60000,   // 1 minuto
    message: 'Limite de requisições da API excedido.'
  },
  // Operações pesadas (relatórios, exports)
  HEAVY: {
    requests: 10,
    windowMs: 60000,   // 1 minuto
    message: 'Aguarde antes de gerar outro relatório.'
  }
} as const

export type RateLimitType = keyof typeof RATE_LIMITS

// Store em memória para rate limiting (em produção, usar Redis)
interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Limpa entradas expiradas periodicamente
setInterval(() => {
  const now = Date.now()
  const entries = Array.from(rateLimitStore.entries())
  for (const [key, entry] of entries) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Limpa a cada minuto

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
 */
export function checkRateLimit(
  request: NextRequest,
  type: RateLimitType = 'PUBLIC'
): { allowed: boolean; remaining: number; resetAt: number } {
  const config = RATE_LIMITS[type]
  const clientId = getClientIdentifier(request)
  const key = `${type}:${clientId}`
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
      resetAt: entry.resetAt
    }
  }

  // Incrementar contador
  entry.count++

  // Verificar se excedeu limite
  if (entry.count > config.requests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt
    }
  }

  return {
    allowed: true,
    remaining: config.requests - entry.count,
    resetAt: entry.resetAt
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
      const retryAfter = Math.ceil((resetAt - Date.now()) / 1000)
      return NextResponse.json(
        {
          success: false,
          error: RATE_LIMITS[type].message,
          retryAfter
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(RATE_LIMITS[type].requests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(resetAt / 1000)),
            'Retry-After': String(retryAfter)
          }
        }
      )
    }

    // Executar handler original
    const response = await handler(request, ...args)

    // Adicionar headers de rate limit à resposta
    response.headers.set('X-RateLimit-Limit', String(RATE_LIMITS[type].requests))
    response.headers.set('X-RateLimit-Remaining', String(remaining))
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)))

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
  const key = `${type}:${clientId}`
  rateLimitStore.delete(key)
}

/**
 * Obtém estatísticas de rate limit (para monitoramento)
 */
export function getRateLimitStats(): {
  totalEntries: number
  entriesByType: Record<string, number>
} {
  const entriesByType: Record<string, number> = {}
  const keys = Array.from(rateLimitStore.keys())

  for (const key of keys) {
    const type = key.split(':')[0]
    entriesByType[type] = (entriesByType[type] || 0) + 1
  }

  return {
    totalEntries: rateLimitStore.size,
    entriesByType
  }
}
