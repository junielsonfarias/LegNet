import { NextRequest } from 'next/server'

import { withAuth } from '@/lib/auth/permissions'
import { createSuccessResponse } from '@/lib/error-handler'
import { registerApiMetric } from '@/lib/monitoring/metrics'
import { getDashboard } from '@/lib/services/tramitacao-service'

export const dynamic = 'force-dynamic'

export const GET = withAuth(async (_request: NextRequest) => {
  const startedAt = Date.now()

  const payload = await getDashboard()

  const response = createSuccessResponse(payload, 'Dashboard de tramitação gerado com sucesso')

  registerApiMetric('tramitacoes_dashboard', Date.now() - startedAt, response.status, {
    totalTramitacoes: payload.resumo.total
  })

  return response
}, { permissions: 'relatorio.view' })
