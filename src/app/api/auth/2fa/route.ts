import crypto from 'crypto'
import { NextRequest } from 'next/server'
import type { Session } from 'next-auth'

import { withAuth } from '@/lib/auth/permissions'
import { createSuccessResponse, ValidationError } from '@/lib/error-handler'
import { prisma } from '@/lib/prisma'
import { generateTotpSecret, createOtpAuthUri, verifyTotpToken } from '@/lib/security/totp'
import { logAudit } from '@/lib/audit'

const ISSUER = 'Câmara Municipal de Mojuí dos Campos'

const generateBackupCodes = (quantity = 8) =>
  Array.from({ length: quantity }).map(() => crypto.randomBytes(4).toString('hex'))

export const GET = withAuth(async (_request: NextRequest, _ctx: unknown, session: Session) => {
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      twoFactorEnabled: true,
      lastTwoFactorAt: true
    }
  })

  return createSuccessResponse({
    enabled: Boolean(user?.twoFactorEnabled),
    lastVerifiedAt: user?.lastTwoFactorAt ?? null
  })
}, { permissions: 'config.manage' })

export const POST = withAuth(async (request: NextRequest, _ctx: unknown, session: Session) => {
  const body = await request.json().catch(() => {
    throw new ValidationError('JSON inválido')
  })

  const action = body?.action
  if (action === 'setup') {
    const secret = generateTotpSecret()
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorSecret: secret,
        twoFactorEnabled: false,
        lastTwoFactorAt: null
      }
    })

    const uri = createOtpAuthUri(session.user.email ?? session.user.id, ISSUER, secret)

    await logAudit({
      request,
      session,
      action: 'USER_2FA_SETUP',
      entity: 'User',
      entityId: session.user.id
    })

    return createSuccessResponse({
      secret,
      otpauth: uri
    }, 'Código 2FA gerado', undefined, 201)
  }

  if (action === 'verify') {
    const code = String(body?.code ?? '').trim()
    if (!/^\d{6}$/.test(code)) {
      throw new ValidationError('Código 2FA inválido')
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        twoFactorSecret: true
      }
    })

    if (!user?.twoFactorSecret) {
      throw new ValidationError('Secret 2FA não encontrado. Gere um novo código.')
    }

    const isValid = verifyTotpToken(user.twoFactorSecret, code)
    if (!isValid) {
      throw new ValidationError('Código 2FA inválido')
    }

    const backupCodes = generateBackupCodes()

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorBackupCodes: JSON.stringify(backupCodes),
        lastTwoFactorAt: new Date()
      }
    })

    await logAudit({
      request,
      session,
      action: 'USER_2FA_ENABLED',
      entity: 'User',
      entityId: session.user.id
    })

    return createSuccessResponse({
      backupCodes
    }, 'Autenticação em duas etapas habilitada', undefined, 200)
  }

  throw new ValidationError('Ação inválida')
}, { permissions: 'config.manage' })

export const DELETE = withAuth(async (request: NextRequest, _ctx: unknown, session: Session) => {
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorBackupCodes: null,
      lastTwoFactorAt: null
    }
  })

  await logAudit({
    request,
    session,
    action: 'USER_2FA_DISABLED',
    entity: 'User',
    entityId: session.user.id
  })

  return createSuccessResponse({ disabled: true }, 'Autenticação em duas etapas desabilitada')
}, { permissions: 'config.manage' })

