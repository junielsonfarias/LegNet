/**
 * API para gerenciar expediente específico
 * GET: Obtém detalhes
 * PUT: Atualiza
 * DELETE: Remove
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createSuccessResponse, NotFoundError, withErrorHandler } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'
import { expedienteSessaoDbService } from '@/lib/services/expediente-sessao-db-service'

export const dynamic = 'force-dynamic'

const ExpedienteUpdateSchema = z.object({
  conteudo: z.string().min(1).nullish().transform(v => v ?? undefined),
  ordem: z.number().int().min(0).optional()
})

// GET - Obtém expediente
export const GET = withAuth(withErrorHandler(async (
  request: NextRequest,
  context: { params: Promise<{ id: string; expedienteId: string }> }
) => {
  const { expedienteId } = await context.params
  const expediente = await expedienteSessaoDbService.getById(expedienteId)

  if (!expediente) {
    throw new NotFoundError('Expediente')
  }

  return createSuccessResponse(expediente)
}), { permissions: 'sessao.view' })

// PUT - Atualiza expediente
export const PUT = withAuth(withErrorHandler(async (
  request: NextRequest,
  context: { params: Promise<{ id: string; expedienteId: string }> },
  session
) => {
  const { expedienteId } = await context.params
  const body = await request.json()
  const payload = ExpedienteUpdateSchema.parse(body)

  const expediente = await expedienteSessaoDbService.getById(expedienteId)

  if (!expediente) {
    throw new NotFoundError('Expediente')
  }

  const updateData: Record<string, unknown> = {}
  if (payload.conteudo) updateData.conteudo = payload.conteudo
  if (payload.ordem !== undefined) updateData.ordem = payload.ordem

  const expedienteAtualizado = await expedienteSessaoDbService.update(expedienteId, updateData as { conteudo?: string; ordem?: number })

  await logAudit({
    request,
    session,
    action: 'EXPEDIENTE_ATUALIZADO',
    entity: 'ExpedienteSessao',
    entityId: expedienteId,
    metadata: {
      sessaoId: expediente.sessaoId,
      tipoExpediente: expediente.tipoExpediente.nome
    }
  })

  return createSuccessResponse(expedienteAtualizado, 'Expediente atualizado com sucesso')
}), { permissions: 'sessao.manage' })

// DELETE - Remove expediente
export const DELETE = withAuth(withErrorHandler(async (
  request: NextRequest,
  context: { params: Promise<{ id: string; expedienteId: string }> },
  session
) => {
  const { expedienteId } = await context.params
  const expediente = await expedienteSessaoDbService.getById(expedienteId)

  if (!expediente) {
    throw new NotFoundError('Expediente')
  }

  await expedienteSessaoDbService.remove(expedienteId)

  await logAudit({
    request,
    session,
    action: 'EXPEDIENTE_EXCLUIDO',
    entity: 'ExpedienteSessao',
    entityId: expedienteId,
    metadata: {
      sessaoId: expediente.sessaoId,
      tipoExpediente: expediente.tipoExpediente.nome
    }
  })

  return createSuccessResponse(null, 'Expediente excluído com sucesso')
}), { permissions: 'sessao.manage' })
