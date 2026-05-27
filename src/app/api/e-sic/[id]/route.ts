import { NextRequest } from 'next/server'
import { z } from 'zod'
import { esicService } from '@/lib/services/esic-service'
import { withAuth } from '@/lib/auth/permissions'
import { createSuccessResponse, ValidationError, NotFoundError } from '@/lib/error-handler'
import { createLogger } from '@/lib/logging/logger'

const log = createLogger('api/lgpd/e-sic-detalhe')

const AcaoESICSchema = z.discriminatedUnion('acao', [
  z.object({
    acao: z.literal('responder'),
    resposta: z.string().min(1).max(10000).trim(),
    respondidoPor: z.string().max(200).optional()
  }),
  z.object({
    acao: z.literal('prorrogar'),
    motivo: z.string().min(1).max(5000).trim()
  }),
  z.object({
    acao: z.literal('negar'),
    motivo: z.string().min(1).max(5000).trim(),
    respondidoPor: z.string().max(200).optional()
  })
])

export const dynamic = 'force-dynamic'

/**
 * GET - Buscar solicitação e-SIC por ID (admin)
 */
export const GET = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const solicitacao = await esicService.getById(id)

  if (!solicitacao) {
    throw new NotFoundError('Solicitação')
  }

  return createSuccessResponse(solicitacao)
})

/**
 * PATCH - Atualizar/responder solicitação e-SIC (admin)
 * Ações: responder, prorrogar, negar
 */
export const PATCH = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
  session: any
) => {
  const { id } = await params
  const body = await request.json()

  const parsed = AcaoESICSchema.safeParse(body)
  if (!parsed.success) {
    log.warn('Ação e-SIC bloqueada por validação', {
      action: 'esic_action_validation_failed',
      esicId: id,
      errors: parsed.error.errors.map(e => e.message)
    })
    throw new ValidationError(parsed.error.errors.map(e => e.message).join(', '))
  }

  const solicitacao = await esicService.getById(id)
  if (!solicitacao) {
    throw new NotFoundError('Solicitação')
  }

  const data = parsed.data
  let resultado

  switch (data.acao) {
    case 'responder':
      resultado = await esicService.responder(id, data.resposta, data.respondidoPor || session?.user?.name || 'Sistema')
      break

    case 'prorrogar':
      resultado = await esicService.prorrogar(id, data.motivo)
      break

    case 'negar':
      resultado = await esicService.negar(id, data.motivo, data.respondidoPor || session?.user?.name || 'Sistema')
      break
  }

  log.info('Solicitação e-SIC atualizada', {
    action: `esic_${data.acao}`,
    id,
    userId: session?.user?.id
  })

  return createSuccessResponse(
    resultado,
    `Solicitação ${data.acao === 'responder' ? 'respondida' : data.acao === 'prorrogar' ? 'prorrogada' : 'negada'} com sucesso`
  )
})
