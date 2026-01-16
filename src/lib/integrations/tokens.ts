import crypto from 'crypto'

import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import type { NextRequest } from 'next/server'

export const INTEGRATION_PERMISSIONS = ['sessoes.read', 'proposicoes.read', 'notificacoes.write'] as const
export type IntegrationPermission = typeof INTEGRATION_PERMISSIONS[number]

export const hashIntegrationToken = (token: string) =>
  crypto.createHash('sha256').update(token).digest('hex')

export const generateIntegrationToken = () => {
  const plain = crypto.randomBytes(32).toString('hex')
  const hashed = hashIntegrationToken(plain)
  return { plain, hashed }
}

export const sanitizeToken = <T extends { hashedToken?: string }>(token: T) => {
  const { hashedToken, ...rest } = token
  return rest
}

export const verifyIntegrationToken = async (tokenHeader?: string) => {
  if (!tokenHeader) {
    return null
  }

  const hashed = hashIntegrationToken(tokenHeader)
  const token = await prisma.apiToken.findUnique({ where: { hashedToken: hashed } })
  if (!token || !token.ativo) {
    return null
  }

  return token
}

export const recordIntegrationUsage = async (
  tokenId: string,
  request: NextRequest,
  metadata: Record<string, unknown> = {}
) => {
  const ip = request.ip || request.headers.get('x-forwarded-for') || null
  const agent = request.headers.get('user-agent') || null

  await prisma.apiToken.update({
    where: { id: tokenId },
    data: {
      lastUsedAt: new Date(),
      lastUsedIp: ip,
      lastUsedAgent: agent
    }
  })

  await logAudit({
    request,
    session: null,
    action: 'INTEGRATION_TOKEN_ACCESS',
    entity: 'ApiToken',
    entityId: tokenId,
    metadata
  })
}

