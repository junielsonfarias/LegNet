import { NextRequest } from 'next/server'
import { createSuccessResponse } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { gerarNotificacoesPrazo } from '@/lib/jobs/prazos-legais'

export const dynamic = 'force-dynamic'

// POST - Disparo manual. O disparo automático diário roda em /api/cron/daily.
export const POST = withAuth(async (_request: NextRequest, _ctx, _session) => {
  const { notificacoesCriadas } = await gerarNotificacoesPrazo()
  return createSuccessResponse({
    notificacoesCriadas,
    dataExecucao: new Date().toISOString()
  }, `${notificacoesCriadas} notificação(ões) de prazo gerada(s)`)
}, { permissions: 'config.manage' })
