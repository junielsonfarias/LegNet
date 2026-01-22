/**
 * API: Solicitar recuperação de senha
 * POST /api/auth/forgot-password
 *
 * Envia email com link de recuperação de senha.
 * Implementa rate limiting e não revela se o email existe.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createHash, randomBytes } from 'crypto'
import { sendPasswordResetEmail } from '@/lib/services/email-service'
import { createLogger } from '@/lib/logging/logger'
import { z } from 'zod'

const logger = createLogger('forgot-password')

// Schema de validação
const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido')
})

// Rate limiting simples (em produção, usar Redis)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_MAX = 3
const RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hora

function checkRateLimit(email: string): boolean {
  const now = Date.now()
  const key = email.toLowerCase()
  const record = rateLimitMap.get(key)

  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false
  }

  record.count++
  return true
}

// Gerar token seguro
function generateToken(): string {
  return randomBytes(32).toString('hex')
}

// Hash do token para armazenamento
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validar input
    const validation = forgotPasswordSchema.safeParse(body)
    if (!validation.success) {
      // Retorna mensagem genérica para não revelar validação
      return NextResponse.json(
        { message: 'Se o email existir em nossa base, você receberá instruções de recuperação.' },
        { status: 200 }
      )
    }

    const { email } = validation.data
    const normalizedEmail = email.toLowerCase().trim()

    // Verificar rate limit
    if (!checkRateLimit(normalizedEmail)) {
      logger.warn('Rate limit excedido para forgot-password', {
        action: 'rate_limit_exceeded',
        email: normalizedEmail
      })

      // Ainda retorna sucesso para não revelar informação
      return NextResponse.json(
        { message: 'Se o email existir em nossa base, você receberá instruções de recuperação.' },
        { status: 200 }
      )
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    })

    // Se usuário não existe, retorna sucesso sem enviar email
    // Isso evita enumeration attacks
    if (!user) {
      logger.info('Tentativa de recuperação para email não cadastrado', {
        action: 'forgot_password_unknown_email'
      })

      return NextResponse.json(
        { message: 'Se o email existir em nossa base, você receberá instruções de recuperação.' },
        { status: 200 }
      )
    }

    // Gerar token
    const token = generateToken()
    const hashedToken = hashToken(token)

    // Definir expiração (24 horas)
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)

    // Remover tokens anteriores do mesmo usuário
    await prisma.verificationToken.deleteMany({
      where: { identifier: normalizedEmail }
    })

    // Criar novo token
    await prisma.verificationToken.create({
      data: {
        identifier: normalizedEmail,
        token: hashedToken,
        expires
      }
    })

    // Enviar email
    const emailResult = await sendPasswordResetEmail(
      normalizedEmail,
      token, // Enviar token não-hasheado no email
      user.name || undefined
    )

    if (!emailResult.success) {
      logger.error('Falha ao enviar email de recuperação', {
        action: 'forgot_password_email_failed',
        error: emailResult.error
      })
    } else {
      logger.info('Email de recuperação enviado', {
        action: 'forgot_password_email_sent',
        userId: user.id
      })
    }

    // Registrar no audit log
    await prisma.auditLog.create({
      data: {
        action: 'PASSWORD_RESET_REQUESTED',
        entity: 'User',
        entityId: user.id,
        userId: user.id,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        metadata: {
          email: normalizedEmail,
          emailSent: emailResult.success
        }
      }
    })

    return NextResponse.json(
      { message: 'Se o email existir em nossa base, você receberá instruções de recuperação.' },
      { status: 200 }
    )
  } catch (error) {
    logger.error('Erro no forgot-password', {
      action: 'forgot_password_error',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    })

    // Mesmo em caso de erro, retorna sucesso para não revelar informação
    return NextResponse.json(
      { message: 'Se o email existir em nossa base, você receberá instruções de recuperação.' },
      { status: 200 }
    )
  }
}
