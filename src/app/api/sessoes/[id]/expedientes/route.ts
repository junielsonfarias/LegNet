import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createSuccessResponse, NotFoundError, withErrorHandler } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'
import { expedienteSessaoDbService } from '@/lib/services/expediente-sessao-db-service'
import { tiposExpedienteDbService } from '@/lib/services/tipos-expediente-db-service'
import { sessaoDbService } from '@/lib/services/sessao-db-service'

export const dynamic = 'force-dynamic'

const ExpedienteSchema = z.object({
  tipoExpedienteId: z.string().min(1, 'Tipo de expediente é obrigatório'),
  conteudo: z.string().min(1, 'Conteúdo é obrigatório'),
  ordem: z.number().int().min(0).optional()
})

export const GET = withAuth(withErrorHandler(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: sessaoId } = await context.params

  const sessao = await sessaoDbService.getById(sessaoId)
  if (!sessao) throw new NotFoundError('Sessão')

  const expedientes = await expedienteSessaoDbService.listBySessao(sessaoId)
  const tiposExpediente = await tiposExpedienteDbService.list({ ativo: true })

  return createSuccessResponse({
    expedientes,
    tiposExpediente,
    expedientesPorTipo: tiposExpediente.map(tipo => ({
      tipo,
      expediente: expedientes.find(e => e.tipoExpedienteId === tipo.id) || null
    }))
  })
}), { permissions: 'sessao.view' })

export const POST = withAuth(withErrorHandler(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
  session
) => {
  const { id: sessaoId } = await context.params
  const body = await request.json()
  const payload = ExpedienteSchema.parse(body)

  const sessao = await sessaoDbService.getById(sessaoId)
  if (!sessao) throw new NotFoundError('Sessão')

  const tipoExpediente = await tiposExpedienteDbService.getById(payload.tipoExpedienteId)
  if (!tipoExpediente) throw new NotFoundError('Tipo de expediente')

  const { data: expediente, created } = await expedienteSessaoDbService.upsert(sessaoId, payload)

  await logAudit({
    request, session,
    action: created ? 'EXPEDIENTE_CRIADO' : 'EXPEDIENTE_ATUALIZADO',
    entity: 'ExpedienteSessao',
    entityId: expediente.id,
    metadata: { sessaoId, tipoExpediente: tipoExpediente.nome }
  })

  return createSuccessResponse(
    expediente,
    created ? 'Expediente criado com sucesso' : 'Expediente atualizado com sucesso'
  )
}), { permissions: 'sessao.manage' })
