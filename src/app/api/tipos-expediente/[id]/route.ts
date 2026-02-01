/**
 * API para gerenciar tipo de expediente específico
 * GET: Obtém detalhes
 * PUT: Atualiza
 * DELETE: Remove (soft delete)
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, NotFoundError, ValidationError, withErrorHandler } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

const TipoExpedienteUpdateSchema = z.object({
  nome: z.string().min(1).max(100).optional(),
  descricao: z.string().optional(),
  ordem: z.number().int().min(0).optional(),
  tempoMaximo: z.number().int().min(1).nullable().optional(),
  ativo: z.boolean().optional()
})

// GET - Obtém tipo
export const GET = withAuth(withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const tipo = await prisma.tipoExpediente.findUnique({
    where: { id: params.id },
    include: {
      _count: {
        select: { expedientes: true }
      }
    }
  })

  if (!tipo) {
    throw new NotFoundError('Tipo de expediente')
  }

  return createSuccessResponse(tipo)
}), { permissions: 'sessao.view' })

// PUT - Atualiza tipo
export const PUT = withAuth(withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } },
  session
) => {
  const body = await request.json()
  const payload = TipoExpedienteUpdateSchema.parse(body)

  const tipo = await prisma.tipoExpediente.findUnique({
    where: { id: params.id }
  })

  if (!tipo) {
    throw new NotFoundError('Tipo de expediente')
  }

  // Verificar nome duplicado se estiver alterando
  if (payload.nome && payload.nome !== tipo.nome) {
    const existente = await prisma.tipoExpediente.findFirst({
      where: {
        nome: { equals: payload.nome, mode: 'insensitive' },
        id: { not: params.id }
      }
    })

    if (existente) {
      throw new ValidationError('Já existe um tipo de expediente com este nome')
    }
  }

  const tipoAtualizado = await prisma.tipoExpediente.update({
    where: { id: params.id },
    data: {
      ...(payload.nome && { nome: payload.nome }),
      ...(payload.descricao !== undefined && { descricao: payload.descricao }),
      ...(payload.ordem !== undefined && { ordem: payload.ordem }),
      ...(payload.tempoMaximo !== undefined && { tempoMaximo: payload.tempoMaximo }),
      ...(payload.ativo !== undefined && { ativo: payload.ativo })
    }
  })

  await logAudit({
    request,
    session,
    action: 'TIPO_EXPEDIENTE_ATUALIZADO',
    entity: 'TipoExpediente',
    entityId: params.id,
    metadata: { alteracoes: payload }
  })

  return createSuccessResponse(tipoAtualizado, 'Tipo de expediente atualizado com sucesso')
}), { permissions: 'config.manage' })

// DELETE - Remove (soft delete)
export const DELETE = withAuth(withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } },
  session
) => {
  const tipo = await prisma.tipoExpediente.findUnique({
    where: { id: params.id },
    include: {
      _count: {
        select: { expedientes: true }
      }
    }
  })

  if (!tipo) {
    throw new NotFoundError('Tipo de expediente')
  }

  // Se tem expedientes vinculados, apenas desativa
  if (tipo._count.expedientes > 0) {
    await prisma.tipoExpediente.update({
      where: { id: params.id },
      data: { ativo: false }
    })

    await logAudit({
      request,
      session,
      action: 'TIPO_EXPEDIENTE_DESATIVADO',
      entity: 'TipoExpediente',
      entityId: params.id,
      metadata: { nome: tipo.nome, motivoSoftDelete: 'possui expedientes vinculados' }
    })

    return createSuccessResponse(null, 'Tipo de expediente desativado (possui expedientes vinculados)')
  }

  // Sem expedientes, pode excluir
  await prisma.tipoExpediente.delete({
    where: { id: params.id }
  })

  await logAudit({
    request,
    session,
    action: 'TIPO_EXPEDIENTE_EXCLUIDO',
    entity: 'TipoExpediente',
    entityId: params.id,
    metadata: { nome: tipo.nome }
  })

  return createSuccessResponse(null, 'Tipo de expediente excluído com sucesso')
}), { permissions: 'config.manage' })
