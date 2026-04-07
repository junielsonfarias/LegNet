/**
 * API para gerenciar tipo de expediente específico
 * GET: Obtém detalhes
 * PUT: Atualiza
 * DELETE: Remove (soft delete)
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createSuccessResponse, NotFoundError, ValidationError, withErrorHandler } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'
import { tiposExpedienteDbService } from '@/lib/services/tipos-expediente-db-service'

export const dynamic = 'force-dynamic'

const TipoExpedienteUpdateSchema = z.object({
  nome: z.string().min(1).max(100).optional(),
  descricao: z.string().nullish().transform(v => v ?? undefined),
  ordem: z.number().int().min(0).optional(),
  tempoMaximo: z.number().int().min(1).nullable().optional(),
  ativo: z.boolean().nullish().transform(v => v ?? undefined)
})

// GET - Obtém tipo
export const GET = withAuth(withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const tipo = await tiposExpedienteDbService.getByIdWithCount(id)

  if (!tipo) {
    throw new NotFoundError('Tipo de expediente')
  }

  return createSuccessResponse(tipo)
}), { permissions: 'sessao.view' })

// PUT - Atualiza tipo
export const PUT = withAuth(withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
  session
) => {
  const { id } = await params
  const body = await request.json()
  const payload = TipoExpedienteUpdateSchema.parse(body)

  const tipo = await tiposExpedienteDbService.getById(id)

  if (!tipo) {
    throw new NotFoundError('Tipo de expediente')
  }

  // Verificar nome duplicado se estiver alterando
  if (payload.nome && payload.nome !== tipo.nome) {
    const existente = await tiposExpedienteDbService.checkDuplicateName(payload.nome, id)

    if (existente) {
      throw new ValidationError('Já existe um tipo de expediente com este nome')
    }
  }

  const tipoAtualizado = await tiposExpedienteDbService.update(id, payload)

  await logAudit({
    request,
    session,
    action: 'TIPO_EXPEDIENTE_ATUALIZADO',
    entity: 'TipoExpediente',
    entityId: id,
    metadata: { alteracoes: payload }
  })

  return createSuccessResponse(tipoAtualizado, 'Tipo de expediente atualizado com sucesso')
}), { permissions: 'config.manage' })

// DELETE - Remove (soft delete)
export const DELETE = withAuth(withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
  session
) => {
  const { id } = await params
  const tipo = await tiposExpedienteDbService.getByIdWithCount(id)

  if (!tipo) {
    throw new NotFoundError('Tipo de expediente')
  }

  // Se tem expedientes vinculados, apenas desativa
  if (tipo._count.expedientes > 0) {
    await tiposExpedienteDbService.deactivate(id)

    await logAudit({
      request,
      session,
      action: 'TIPO_EXPEDIENTE_DESATIVADO',
      entity: 'TipoExpediente',
      entityId: id,
      metadata: { nome: tipo.nome, motivoSoftDelete: 'possui expedientes vinculados' }
    })

    return createSuccessResponse(null, 'Tipo de expediente desativado (possui expedientes vinculados)')
  }

  // Sem expedientes, pode excluir
  await tiposExpedienteDbService.remove(id)

  await logAudit({
    request,
    session,
    action: 'TIPO_EXPEDIENTE_EXCLUIDO',
    entity: 'TipoExpediente',
    entityId: id,
    metadata: { nome: tipo.nome }
  })

  return createSuccessResponse(null, 'Tipo de expediente excluído com sucesso')
}), { permissions: 'config.manage' })
