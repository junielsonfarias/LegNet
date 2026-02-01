/**
 * API para gerenciar um orador específico
 * GET: Obtém detalhes do orador
 * PUT: Atualiza orador (status, tempo, etc)
 * DELETE: Remove inscrição
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, NotFoundError, ValidationError, withErrorHandler } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

const OradorUpdateSchema = z.object({
  status: z.enum(['INSCRITO', 'FALANDO', 'CONCLUIDO', 'DESISTIU', 'TEMPO_ESGOTADO']).optional(),
  tempoLimite: z.number().int().min(1).optional(),
  tempoUsado: z.number().int().min(0).optional(),
  assunto: z.string().optional(),
  observacoes: z.string().optional(),
  ordem: z.number().int().min(1).optional()
})

// GET - Obtém detalhes do orador
export const GET = withAuth(withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string; oradorId: string } }
) => {
  const orador = await prisma.oradorSessao.findUnique({
    where: { id: params.oradorId },
    include: {
      parlamentar: {
        select: {
          id: true,
          nome: true,
          apelido: true,
          partido: true,
          foto: true
        }
      },
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

  if (!orador) {
    throw new NotFoundError('Orador')
  }

  return createSuccessResponse(orador)
}), { permissions: 'sessao.view' })

// PUT - Atualiza orador
export const PUT = withAuth(withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string; oradorId: string } },
  session
) => {
  const body = await request.json()
  const payload = OradorUpdateSchema.parse(body)

  const orador = await prisma.oradorSessao.findUnique({
    where: { id: params.oradorId }
  })

  if (!orador) {
    throw new NotFoundError('Orador')
  }

  const updateData: any = {}

  // Atualizar status com regras de negócio
  if (payload.status) {
    // Se está mudando para FALANDO, registrar horário de início
    if (payload.status === 'FALANDO' && orador.status !== 'FALANDO') {
      updateData.iniciadoEm = new Date()
    }

    // Se está mudando de FALANDO para outro status, registrar horário de fim
    if (orador.status === 'FALANDO' && payload.status !== 'FALANDO') {
      updateData.finalizadoEm = new Date()

      // Calcular tempo usado se não informado
      if (!payload.tempoUsado && orador.iniciadoEm) {
        const tempoMs = Date.now() - orador.iniciadoEm.getTime()
        updateData.tempoUsado = Math.round(tempoMs / 60000) // Converter para minutos
      }
    }

    updateData.status = payload.status
  }

  if (payload.tempoLimite !== undefined) updateData.tempoLimite = payload.tempoLimite
  if (payload.tempoUsado !== undefined) updateData.tempoUsado = payload.tempoUsado
  if (payload.assunto !== undefined) updateData.assunto = payload.assunto
  if (payload.observacoes !== undefined) updateData.observacoes = payload.observacoes
  if (payload.ordem !== undefined) updateData.ordem = payload.ordem

  const oradorAtualizado = await prisma.oradorSessao.update({
    where: { id: params.oradorId },
    data: updateData,
    include: {
      parlamentar: {
        select: {
          id: true,
          nome: true,
          apelido: true,
          partido: true
        }
      }
    }
  })

  await logAudit({
    request,
    session,
    action: 'ORADOR_ATUALIZADO',
    entity: 'OradorSessao',
    entityId: params.oradorId,
    metadata: {
      statusAnterior: orador.status,
      statusNovo: payload.status,
      alteracoes: payload
    }
  })

  return createSuccessResponse(oradorAtualizado, 'Orador atualizado com sucesso')
}), { permissions: 'sessao.manage' })

// DELETE - Remove inscrição
export const DELETE = withAuth(withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string; oradorId: string } },
  session
) => {
  const orador = await prisma.oradorSessao.findUnique({
    where: { id: params.oradorId },
    include: {
      parlamentar: {
        select: { nome: true }
      }
    }
  })

  if (!orador) {
    throw new NotFoundError('Orador')
  }

  // Não permitir remover se já está falando
  if (orador.status === 'FALANDO') {
    throw new ValidationError('Não é possível remover orador que está em uso da palavra')
  }

  await prisma.oradorSessao.delete({
    where: { id: params.oradorId }
  })

  await logAudit({
    request,
    session,
    action: 'ORADOR_REMOVIDO',
    entity: 'OradorSessao',
    entityId: params.oradorId,
    metadata: {
      sessaoId: orador.sessaoId,
      parlamentar: orador.parlamentar.nome,
      tipo: orador.tipo
    }
  })

  return createSuccessResponse(null, 'Inscrição removida com sucesso')
}), { permissions: 'sessao.manage' })
