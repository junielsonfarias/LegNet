import { z } from 'zod'
import { NextRequest } from 'next/server'

import { createSuccessResponse, UnauthorizedError, ValidationError, withErrorHandler } from '@/lib/error-handler'
import { verifyIntegrationToken, recordIntegrationUsage } from '@/lib/integrations/tokens'
import { notificationQueueService } from '@/lib/services/notification-multicanal'
import { registerApiMetric } from '@/lib/monitoring/metrics'
import { logInfo } from '@/lib/logging/structured-logger'

const payloadSchema = z.object({
  canal: z.enum(['email', 'push', 'sms']),
  destinatario: z.string().min(3),
  assunto: z.string().optional(),
  mensagem: z.string().min(3),
  metadata: z.record(z.any()).optional()
})

const normalizeTokenFromHeaders = (request: NextRequest) => {
  const bearer = request.headers.get('authorization')
  if (bearer?.startsWith('Bearer ')) {
    return bearer.slice(7).trim()
  }
  const header = request.headers.get('x-integration-token')
  return header?.trim()
}

export const POST = withErrorHandler(async (request: NextRequest) => {
  const startedAt = Date.now()
  const tokenValue = normalizeTokenFromHeaders(request)
  const token = await verifyIntegrationToken(tokenValue)

  if (!token) {
    throw new UnauthorizedError('Token de integração inválido ou inativo')
  }
  if (!token.permissoes.includes('notificacoes.write')) {
    throw new UnauthorizedError('Token não possui permissão para notificações')
  }

  const body = await request.json().catch(() => {
    throw new ValidationError('JSON inválido')
  })
  const payload = payloadSchema.parse(body)

  const notificacao = notificationQueueService.enqueue({
    canal: payload.canal,
    destinatario: payload.destinatario,
    assunto: payload.assunto,
    mensagem: payload.mensagem,
    metadata: {
      ...payload.metadata,
      origem: 'webhook'
    },
    integration: true
  })

  await recordIntegrationUsage(token.id, request, {
    recurso: 'notificacoes',
    canal: payload.canal
  })

  const response = createSuccessResponse(
    {
      id: notificacao.id,
      status: notificacao.status
    },
    'Notificação registrada com sucesso',
    undefined,
    202
  )

  registerApiMetric('notificacao_webhook', Date.now() - startedAt, response.status, {
    canal: payload.canal
  })

  logInfo({
    message: 'Notificação enfileirada via integração pública',
    context: {
      canal: payload.canal,
      destinatario: payload.destinatario,
      notificacaoId: notificacao.id
    }
  })

  return response
})

