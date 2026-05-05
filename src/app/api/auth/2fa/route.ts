import crypto from 'crypto'
import { NextRequest } from 'next/server'
import type { Session } from 'next-auth'

import { withAuth } from '@/lib/auth/permissions'
import { createSuccessResponse, ValidationError } from '@/lib/error-handler'
import { prisma } from '@/lib/prisma'
import { generateTotpSecret, createOtpAuthUri, verifyTotpToken } from '@/lib/security/totp'
import { encrypt, safeDecrypt } from '@/lib/security/encryption'
import { is2FAEnabledGlobally } from '@/lib/security/two-factor-config'
import { logAudit } from '@/lib/audit'

// ISSUER dinâmico via variável de ambiente (Multi-Tenant)
const ISSUER = process.env.SITE_NAME || 'Câmara Municipal'

const generateBackupCodes = (quantity = 8) =>
  Array.from({ length: quantity }).map(() => crypto.randomBytes(4).toString('hex'))

export const GET = withAuth(async (_request: NextRequest, _ctx: unknown, session: Session) => {
  const [user, globalEnabled] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        twoFactorEnabled: true,
        lastTwoFactorAt: true
      }
    }),
    is2FAEnabledGlobally()
  ])

  return createSuccessResponse({
    enabled: Boolean(user?.twoFactorEnabled),
    lastVerifiedAt: user?.lastTwoFactorAt ?? null,
    globallyEnabled: globalEnabled
  })
}, { permissions: 'config.manage' })

export const POST = withAuth(async (request: NextRequest, _ctx: unknown, session: Session) => {
  const body = await request.json().catch(() => {
    throw new ValidationError('JSON inválido')
  })

  const action = body?.action
  if (action === 'setup') {
    const globalEnabled = await is2FAEnabledGlobally()
    if (!globalEnabled) {
      throw new ValidationError('Verificacao em duas etapas esta desabilitada globalmente. Habilite a politica em Configuracoes > Seguranca antes de configurar.')
    }
    const secret = generateTotpSecret()
    const uri = createOtpAuthUri(session.user.email ?? session.user.id, ISSUER, secret)

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorSecret: encrypt(secret),
        twoFactorEnabled: false,
        lastTwoFactorAt: null
      }
    })

    await logAudit({
      request,
      session,
      action: 'USER_2FA_SETUP',
      entity: 'User',
      entityId: session.user.id
    })

    // A8/RN-154: secret nao retornado no JSON. Cliente le apenas o otpauth URI
    // (que ja contem o secret embutido para o QR code) e nao deve persistir
    // em estado React. Se o usuario precisar do secret manual, exibe na hora
    // a partir do otpauth URI no proprio frontend e descarta apos copia.
    return createSuccessResponse({
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

    // safeDecrypt: aceita secrets antigos em texto plano (legado) e novos cifrados
    const decryptedSecret = safeDecrypt(user.twoFactorSecret)
    const isValid = verifyTotpToken(decryptedSecret, code)
    if (!isValid) {
      throw new ValidationError('Código 2FA inválido')
    }

    const backupCodes = generateBackupCodes()

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorBackupCodes: encrypt(JSON.stringify(backupCodes)),
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

