import { NextRequest } from 'next/server'
import type { Session } from 'next-auth'
import { z } from 'zod'

import { withAuth } from '@/lib/auth/permissions'
import { createSuccessResponse, ValidationError } from '@/lib/error-handler'
import { logAudit } from '@/lib/audit'
import {
  is2FAEnabledGlobally,
  setGlobalTwoFactorEnabled
} from '@/lib/security/two-factor-config'

const ToggleSchema = z.object({
  enabled: z.boolean()
})

export const GET = withAuth(async (_request: NextRequest, _ctx: unknown, _session: Session) => {
  const enabled = await is2FAEnabledGlobally()
  return createSuccessResponse({ enabled })
}, { permissions: 'config.manage' })

export const PUT = withAuth(async (request: NextRequest, _ctx: unknown, session: Session) => {
  const body = await request.json().catch(() => {
    throw new ValidationError('JSON invalido')
  })

  const parsed = ToggleSchema.safeParse(body)
  if (!parsed.success) {
    throw new ValidationError('Campo "enabled" deve ser booleano')
  }

  const previous = await is2FAEnabledGlobally()
  await setGlobalTwoFactorEnabled(parsed.data.enabled)

  await logAudit({
    request,
    session,
    action: 'SYSTEM_2FA_TOGGLE_GLOBAL',
    entity: 'Configuracao',
    entityId: 'seguranca.2fa.enabled',
    metadata: {
      previous,
      next: parsed.data.enabled
    }
  })

  return createSuccessResponse(
    { enabled: parsed.data.enabled },
    parsed.data.enabled
      ? 'Verificacao em duas etapas habilitada globalmente'
      : 'Verificacao em duas etapas desabilitada globalmente'
  )
}, { roles: ['ADMIN'], permissions: 'config.manage' })
