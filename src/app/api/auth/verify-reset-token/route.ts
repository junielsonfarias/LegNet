/**
 * API: Verificar token de recuperação
 * GET /api/auth/verify-reset-token?token=xxx
 *
 * Valida se um token de recuperação é válido.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createHash } from 'crypto'
import { createLogger } from '@/lib/logging/logger'

const logger = createLogger('verify-reset-token')

// Hash do token para comparação
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Token não fornecido' },
        { status: 400 }
      )
    }

    const hashedToken = hashToken(token)

    // Buscar token no banco
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token: hashedToken }
    })

    if (!verificationToken) {
      logger.info('Token de verificação não encontrado', {
        action: 'verify_token_not_found'
      })

      return NextResponse.json(
        { valid: false, error: 'Link inválido ou já utilizado' },
        { status: 200 }
      )
    }

    // Verificar expiração
    if (verificationToken.expires < new Date()) {
      logger.info('Token de verificação expirado', {
        action: 'verify_token_expired',
        email: verificationToken.identifier
      })

      return NextResponse.json(
        { valid: false, error: 'Link expirado. Solicite um novo.' },
        { status: 200 }
      )
    }

    // Token válido - retornar email mascarado para UX
    const email = verificationToken.identifier
    const maskedEmail = maskEmail(email)

    return NextResponse.json(
      {
        valid: true,
        email: maskedEmail,
        expiresAt: verificationToken.expires.toISOString()
      },
      { status: 200 }
    )
  } catch (error) {
    logger.error('Erro ao verificar token', {
      action: 'verify_token_error',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    })

    return NextResponse.json(
      { valid: false, error: 'Erro ao verificar link' },
      { status: 500 }
    )
  }
}

/**
 * Mascara email para exibição
 * ex: joao@email.com -> j***@e***.com
 */
function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@')
  if (!domain) return '***'

  const maskedLocal = localPart.length > 2
    ? localPart[0] + '***'
    : '***'

  const domainParts = domain.split('.')
  const maskedDomain = domainParts[0].length > 2
    ? domainParts[0][0] + '***'
    : '***'

  const tld = domainParts.slice(1).join('.')

  return `${maskedLocal}@${maskedDomain}.${tld}`
}
