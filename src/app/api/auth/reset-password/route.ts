/**
 * API: Redefinir senha
 * POST /api/auth/reset-password
 *
 * Valida token e define nova senha.
 * Implementa rate limiting para prevenir brute force de tokens.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createHash } from 'crypto'
import bcrypt from 'bcryptjs'
import { createLogger } from '@/lib/logging/logger'
import { allowRequest } from '@/lib/rate-limit'
import { z } from 'zod'

const logger = createLogger('reset-password')

// F2.6 — rate limit central (Upstash-aware) — antes usava Map por lambda.
const RATE_LIMIT_MAX = 5 // 5 tentativas
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000 // 15 minutos

async function checkRateLimit(ip: string): Promise<boolean> {
  return allowRequest(`reset-password:${ip}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)
}

// Schema de validação
const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token obrigatório'),
  password: z
    .string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número')
})

// Hash do token para comparação
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    // Obter IP do cliente
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               request.headers.get('x-real-ip') ||
               'unknown'

    // Verificar rate limit
    if (!(await checkRateLimit(ip))) {
      logger.warn('Rate limit excedido para reset-password', {
        action: 'reset_password_rate_limited',
        ip
      })

      return NextResponse.json(
        { error: 'Muitas tentativas. Aguarde 15 minutos antes de tentar novamente.' },
        { status: 429 }
      )
    }

    const body = await request.json()

    // Validar input
    const validation = resetPasswordSchema.safeParse(body)
    if (!validation.success) {
      const errors = validation.error.errors.map(e => e.message)
      return NextResponse.json(
        { error: errors[0] },
        { status: 400 }
      )
    }

    const { token, password } = validation.data
    const hashedToken = hashToken(token)

    // Buscar token no banco
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token: hashedToken }
    })

    if (!verificationToken) {
      logger.warn('Token de recuperação inválido', {
        action: 'reset_password_invalid_token'
      })

      return NextResponse.json(
        { error: 'Link de recuperação inválido ou expirado. Solicite um novo.' },
        { status: 400 }
      )
    }

    // Verificar expiração
    if (verificationToken.expires < new Date()) {
      // Remover token expirado
      await prisma.verificationToken.delete({
        where: { token: hashedToken }
      })

      logger.warn('Token de recuperação expirado', {
        action: 'reset_password_expired_token',
        email: verificationToken.identifier
      })

      return NextResponse.json(
        { error: 'Link de recuperação expirado. Solicite um novo.' },
        { status: 400 }
      )
    }

    // Buscar usuário pelo email (identifier)
    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier }
    })

    if (!user) {
      // Remover token órfão
      await prisma.verificationToken.delete({
        where: { token: hashedToken }
      })

      return NextResponse.json(
        { error: 'Usuário não encontrado.' },
        { status: 400 }
      )
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(password, 12)

    // Atualizar senha, remover token e registrar auditoria em transação
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      }),
      prisma.verificationToken.delete({
        where: { token: hashedToken }
      }),
      prisma.auditLog.create({
        data: {
          action: 'PASSWORD_RESET_COMPLETED',
          entity: 'User',
          entityId: user.id,
          userId: user.id,
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          metadata: {
            email: user.email
          }
        }
      })
    ])

    logger.info('Senha redefinida com sucesso', {
      action: 'reset_password_success',
      userId: user.id
    })

    return NextResponse.json(
      { message: 'Senha alterada com sucesso! Você já pode fazer login.' },
      { status: 200 }
    )
  } catch (error) {
    logger.error('Erro no reset-password', {
      action: 'reset_password_error',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    })

    return NextResponse.json(
      { error: 'Erro ao redefinir senha. Tente novamente.' },
      { status: 500 }
    )
  }
}
