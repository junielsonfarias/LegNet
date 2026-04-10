/**
 * API: Rate Limit para Autenticação (Server-Only)
 *
 * Esta API é usada internamente pelo sistema de autenticação para verificar
 * e gerenciar rate limits de login usando Redis (quando disponível).
 *
 * SEGURANÇA: API interna, não exposta publicamente
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiLogger } from '@/lib/logging/logger'
import {
  checkRateLimitAsync,
  resetRateLimit,
  RATE_LIMIT_CONFIGS,
  type RateLimitType
} from '@/lib/redis/rate-limiter'

export const dynamic = 'force-dynamic'

// Schema de validação
const CheckSchema = z.object({
  identifier: z.string().min(1).max(255),
  type: z.enum(['LOGIN', 'RESET_PASSWORD', 'AUTH']).default('LOGIN')
})

const ResetSchema = z.object({
  identifier: z.string().min(1).max(255),
  type: z.enum(['LOGIN', 'RESET_PASSWORD', 'AUTH']).default('LOGIN')
})

// Header secreto para validar chamadas internas
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET

function validateInternalRequest(request: NextRequest): boolean {
  if (!INTERNAL_SECRET) {
    apiLogger.error('INTERNAL_API_SECRET não configurado', undefined, { module: 'rate-limit' })
    return false
  }

  const secret = request.headers.get('x-internal-secret')
  if (!secret) return false

  // Timing-safe comparison para prevenir timing attacks
  try {
    const encoder = new TextEncoder()
    const a = encoder.encode(secret)
    const b = encoder.encode(INTERNAL_SECRET)
    if (a.byteLength !== b.byteLength) return false
    return crypto.subtle ? timingSafeEqual(a, b) : secret === INTERNAL_SECRET
  } catch {
    return secret === INTERNAL_SECRET
  }
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.byteLength !== b.byteLength) return false
  let result = 0
  for (let i = 0; i < a.byteLength; i++) {
    result |= a[i] ^ b[i]
  }
  return result === 0
}

/**
 * POST - Verificar rate limit (incrementa contador)
 */
export async function POST(request: NextRequest) {
  // Validar que é uma chamada interna
  if (!validateInternalRequest(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const validation = CheckSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { identifier, type } = validation.data
    const result = await checkRateLimitAsync(identifier.toLowerCase(), type as RateLimitType)

    return NextResponse.json({
      allowed: result.allowed,
      remaining: result.remaining,
      resetAt: result.resetAt,
      retryAfter: result.retryAfter,
      message: result.allowed ? null : RATE_LIMIT_CONFIGS[type].message
    })
  } catch (error) {
    apiLogger.error('Erro ao verificar rate limit', error, { module: 'rate-limit' })
    // Em caso de erro, permite a requisição (fail-open)
    return NextResponse.json({
      allowed: true,
      remaining: 999,
      resetAt: Math.ceil(Date.now() / 1000) + 60,
      message: null
    })
  }
}

/**
 * DELETE - Resetar rate limit (após login bem-sucedido)
 */
export async function DELETE(request: NextRequest) {
  // Validar que é uma chamada interna
  if (!validateInternalRequest(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const validation = ResetSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { identifier, type } = validation.data
    await resetRateLimit(identifier.toLowerCase(), type as RateLimitType)

    return NextResponse.json({ success: true })
  } catch (error) {
    apiLogger.error('Erro ao resetar rate limit', error, { module: 'rate-limit' })
    return NextResponse.json({ success: true }) // Não falha silenciosamente
  }
}
