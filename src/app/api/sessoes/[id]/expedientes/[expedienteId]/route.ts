/**
 * API para gerenciar expediente específico
 * GET: Obtém detalhes
 * PUT: Atualiza
 * DELETE: Remove
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, NotFoundError, withErrorHandler } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

const ExpedienteUpdateSchema = z.object({
  conteudo: z.string().min(1).optional(),
  ordem: z.number().int().min(0).optional()
})

// GET - Obtém expediente
export const GET = withAuth(withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string; expedienteId: string } }
) => {
  const expediente = await prisma.expedienteSessao.findUnique({
    where: { id: params.expedienteId },
    include: {
      tipoExpediente: true,
      sessao: {
        select: {
          id: true,
          numero: true,
          tipo: true,
          data: true
        }
      }
    }
  })

  if (!expediente) {
    throw new NotFoundError('Expediente')
  }

  return createSuccessResponse(expediente)
}), { permissions: 'sessao.view' })

// PUT - Atualiza expediente
export const PUT = withAuth(withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string; expedienteId: string } },
  session
) => {
  const body = await request.json()
  const payload = ExpedienteUpdateSchema.parse(body)

  const expediente = await prisma.expedienteSessao.findUnique({
    where: { id: params.expedienteId },
    include: { tipoExpediente: true }
  })

  if (!expediente) {
    throw new NotFoundError('Expediente')
  }

  const expedienteAtualizado = await prisma.expedienteSessao.update({
    where: { id: params.expedienteId },
    data: {
      ...(payload.conteudo && { conteudo: payload.conteudo }),
      ...(payload.ordem !== undefined && { ordem: payload.ordem })
    },
    include: {
      tipoExpediente: true
    }
  })

  await logAudit({
    request,
    session,
    action: 'EXPEDIENTE_ATUALIZADO',
    entity: 'ExpedienteSessao',
    entityId: params.expedienteId,
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
  { params }: { params: { id: string; expedienteId: string } },
  session
) => {
  const expediente = await prisma.expedienteSessao.findUnique({
    where: { id: params.expedienteId },
    include: { tipoExpediente: true }
  })

  if (!expediente) {
    throw new NotFoundError('Expediente')
  }

  await prisma.expedienteSessao.delete({
    where: { id: params.expedienteId }
  })

  await logAudit({
    request,
    session,
    action: 'EXPEDIENTE_EXCLUIDO',
    entity: 'ExpedienteSessao',
    entityId: params.expedienteId,
    metadata: {
      sessaoId: expediente.sessaoId,
      tipoExpediente: expediente.tipoExpediente.nome
    }
  })

  return createSuccessResponse(null, 'Expediente excluído com sucesso')
}), { permissions: 'sessao.manage' })
