/**
 * API para gerenciar expedientes de uma sessão
 * GET: Lista expedientes da sessão
 * POST: Cria/atualiza expediente
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, NotFoundError, withErrorHandler } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

const ExpedienteSchema = z.object({
  tipoExpedienteId: z.string().min(1, 'Tipo de expediente é obrigatório'),
  conteudo: z.string().min(1, 'Conteúdo é obrigatório'),
  ordem: z.number().int().min(0).optional()
})

// GET - Lista expedientes da sessão
export const GET = withAuth(withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const sessaoId = params.id

  // Verificar se sessão existe
  const sessao = await prisma.sessao.findUnique({
    where: { id: sessaoId }
  })

  if (!sessao) {
    throw new NotFoundError('Sessão')
  }

  const expedientes = await prisma.expedienteSessao.findMany({
    where: { sessaoId },
    include: {
      tipoExpediente: true
    },
    orderBy: [
      { tipoExpediente: { ordem: 'asc' } },
      { ordem: 'asc' }
    ]
  })

  // Buscar todos os tipos de expediente ativos para referência
  const tiposExpediente = await prisma.tipoExpediente.findMany({
    where: { ativo: true },
    orderBy: { ordem: 'asc' }
  })

  return createSuccessResponse({
    expedientes,
    tiposExpediente,
    // Criar mapa de tipos com e sem conteúdo
    expedientesPorTipo: tiposExpediente.map(tipo => ({
      tipo,
      expediente: expedientes.find(e => e.tipoExpedienteId === tipo.id) || null
    }))
  })
}), { permissions: 'sessao.view' })

// POST - Cria ou atualiza expediente
export const POST = withAuth(withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } },
  session
) => {
  const sessaoId = params.id
  const body = await request.json()
  const payload = ExpedienteSchema.parse(body)

  // Verificar se sessão existe
  const sessao = await prisma.sessao.findUnique({
    where: { id: sessaoId }
  })

  if (!sessao) {
    throw new NotFoundError('Sessão')
  }

  // Verificar se tipo de expediente existe
  const tipoExpediente = await prisma.tipoExpediente.findUnique({
    where: { id: payload.tipoExpedienteId }
  })

  if (!tipoExpediente) {
    throw new NotFoundError('Tipo de expediente')
  }

  // Verificar se já existe expediente para este tipo nesta sessão
  const existente = await prisma.expedienteSessao.findUnique({
    where: {
      sessaoId_tipoExpedienteId: {
        sessaoId,
        tipoExpedienteId: payload.tipoExpedienteId
      }
    }
  })

  let expediente
  let action: string

  if (existente) {
    // Atualizar existente
    expediente = await prisma.expedienteSessao.update({
      where: { id: existente.id },
      data: {
        conteudo: payload.conteudo,
        ordem: payload.ordem ?? existente.ordem
      },
      include: {
        tipoExpediente: true
      }
    })
    action = 'EXPEDIENTE_ATUALIZADO'
  } else {
    // Criar novo
    expediente = await prisma.expedienteSessao.create({
      data: {
        sessaoId,
        tipoExpedienteId: payload.tipoExpedienteId,
        conteudo: payload.conteudo,
        ordem: payload.ordem ?? 0
      },
      include: {
        tipoExpediente: true
      }
    })
    action = 'EXPEDIENTE_CRIADO'
  }

  await logAudit({
    request,
    session,
    action,
    entity: 'ExpedienteSessao',
    entityId: expediente.id,
    metadata: {
      sessaoId,
      tipoExpediente: tipoExpediente.nome
    }
  })

  return createSuccessResponse(
    expediente,
    existente ? 'Expediente atualizado com sucesso' : 'Expediente criado com sucesso'
  )
}), { permissions: 'sessao.manage' })
