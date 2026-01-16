import { NextRequest } from 'next/server'

import { createSuccessResponse } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { registerApiMetric } from '@/lib/monitoring/metrics'
import { logInfo } from '@/lib/logging/structured-logger'

export const GET = withAuth(async (_request: NextRequest) => {
  const startedAt = Date.now()
  const data = {
    status: 'ok',
    timestamp: new Date().toISOString()
  }
  const response = createSuccessResponse(data, 'Status de monitoramento')
  registerApiMetric('monitoramento_status', Date.now() - startedAt, response.status)
  return response
}, { permissions: 'monitor.view' })

export const POST = withAuth(async (request: NextRequest) => {
  const startedAt = Date.now()

  logInfo({
    message: 'Sincronização de métricas solicitada',
    context: { ip: request.ip ?? 'unknown' }
  })

  const response = createSuccessResponse({ synced: true }, 'Sincronização executada')
  registerApiMetric('monitoramento_sync', Date.now() - startedAt, response.status)
  return response
}, { permissions: 'monitor.manage' })

