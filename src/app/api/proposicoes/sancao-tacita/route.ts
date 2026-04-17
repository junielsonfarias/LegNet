import { NextRequest } from 'next/server'
import { createSuccessResponse } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { processarSancaoTacita } from '@/lib/jobs/prazos-legais'

export const dynamic = 'force-dynamic'

// POST - Disparo manual. O disparo automático diário roda em /api/cron/daily.
export const POST = withAuth(async (_request: NextRequest, _ctx, _session) => {
  const { sancionadas, total } = await processarSancaoTacita()
  return createSuccessResponse(
    { sancionadas, total },
    total > 0
      ? `${total} proposição(ões) sancionada(s) tacitamente`
      : 'Nenhuma proposição com prazo de sanção expirado'
  )
}, { permissions: 'tramitacao.manage' })
