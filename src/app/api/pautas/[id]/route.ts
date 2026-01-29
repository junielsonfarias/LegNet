/**
 * API para gerenciamento de Pauta individual
 * GET: Obtém pauta por ID
 * PATCH: Atualiza pauta (observações, etc)
 * DELETE: Remove pauta (apenas se RASCUNHO)
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, NotFoundError, ValidationError, withErrorHandler } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

const PautaUpdateSchema = z.object({
  observacoes: z.string().optional(),
  status: z.enum(['RASCUNHO', 'APROVADA']).optional() // Não permite EM_ANDAMENTO ou CONCLUIDA manualmente
})

// GET - Obtém pauta por ID
export const GET = withAuth(withErrorHandler(async (request: NextRequest, context) => {
  const { id: pautaId } = context.params as { id: string }

  const pauta = await prisma.pautaSessao.findUnique({
    where: { id: pautaId },
    include: {
      sessao: {
        select: {
          id: true,
          numero: true,
          tipo: true,
          data: true,
          horario: true,
          local: true,
          status: true,
          descricao: true,
          legislatura: {
            select: {
              numero: true,
              anoInicio: true,
              anoFim: true
            }
          }
        }
      },
      itens: {
        include: {
          proposicao: {
            select: {
              id: true,
              numero: true,
              ano: true,
              titulo: true,
              tipo: true,
              status: true,
              ementa: true
            }
          }
        },
        orderBy: [
          { secao: 'asc' },
          { ordem: 'asc' }
        ]
      }
    }
  })

  if (!pauta) {
    throw new NotFoundError('Pauta')
  }

  // Calcular estatísticas
  const stats = {
    totalItens: pauta.itens.length,
    itensPendentes: pauta.itens.filter(i => i.status === 'PENDENTE').length,
    itensAprovados: pauta.itens.filter(i => i.status === 'APROVADO').length,
    itensRejeitados: pauta.itens.filter(i => i.status === 'REJEITADO').length,
    itensEmAndamento: pauta.itens.filter(i => ['EM_DISCUSSAO', 'EM_VOTACAO'].includes(i.status)).length
  }

  return createSuccessResponse({
    ...pauta,
    stats
  })
}), { permissions: 'pauta.view' })

// PATCH - Atualiza pauta
export const PATCH = withAuth(withErrorHandler(async (request: NextRequest, context, session) => {
  const { id: pautaId } = context.params as { id: string }
  const body = await request.json()

  const payload = PautaUpdateSchema.parse(body)

  const pauta = await prisma.pautaSessao.findUnique({
    where: { id: pautaId },
    include: {
      sessao: true
    }
  })

  if (!pauta) {
    throw new NotFoundError('Pauta')
  }

  // Validar transições de status
  if (payload.status) {
    // Não permite alterar status se sessão já iniciou
    if (['EM_ANDAMENTO', 'CONCLUIDA'].includes(pauta.status)) {
      throw new ValidationError(
        `Pauta com status "${pauta.status}" não pode ser alterada manualmente.`
      )
    }

    // Não permite voltar de APROVADA para RASCUNHO se falta menos de 48h
    if (pauta.status === 'APROVADA' && payload.status === 'RASCUNHO') {
      const dataSessao = new Date(pauta.sessao.data)
      const horasAteASessao = (dataSessao.getTime() - Date.now()) / (60 * 60 * 1000)

      if (horasAteASessao < 48) {
        throw new ValidationError(
          `RN-125: Não é possível despublicar a pauta com menos de 48h da sessão. ` +
          `Isso violaria a regra de transparência.`
        )
      }
    }
  }

  const pautaAtualizada = await prisma.pautaSessao.update({
    where: { id: pautaId },
    data: {
      ...(payload.observacoes !== undefined && { observacoes: payload.observacoes }),
      ...(payload.status && { status: payload.status })
    },
    include: {
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

  await logAudit({
    request,
    session,
    action: 'PAUTA_UPDATE',
    entity: 'PautaSessao',
    entityId: pautaId,
    metadata: {
      sessaoId: pauta.sessaoId,
      statusAnterior: pauta.status,
      statusNovo: payload.status || pauta.status,
      alteracoes: payload
    }
  })

  return createSuccessResponse(pautaAtualizada, 'Pauta atualizada com sucesso')
}), { permissions: 'pauta.manage' })

// DELETE - Remove pauta (apenas se RASCUNHO)
export const DELETE = withAuth(withErrorHandler(async (request: NextRequest, context, session) => {
  const { id: pautaId } = context.params as { id: string }

  const pauta = await prisma.pautaSessao.findUnique({
    where: { id: pautaId },
    include: {
      sessao: true,
      itens: true
    }
  })

  if (!pauta) {
    throw new NotFoundError('Pauta')
  }

  // Apenas pautas em RASCUNHO podem ser excluídas
  if (pauta.status !== 'RASCUNHO') {
    throw new ValidationError(
      `Pauta com status "${pauta.status}" não pode ser excluída. ` +
      `Apenas pautas em RASCUNHO podem ser removidas.`
    )
  }

  // Reverter status das proposições que estavam na pauta
  const proposicoesIds = pauta.itens
    .filter(i => i.proposicaoId)
    .map(i => i.proposicaoId!)

  if (proposicoesIds.length > 0) {
    await prisma.proposicao.updateMany({
      where: {
        id: { in: proposicoesIds },
        status: 'EM_PAUTA'
      },
      data: {
        status: 'AGUARDANDO_PAUTA'
      }
    })
  }

  // Excluir pauta (itens são excluídos em cascade)
  await prisma.pautaSessao.delete({
    where: { id: pautaId }
  })

  await logAudit({
    request,
    session,
    action: 'PAUTA_DELETE',
    entity: 'PautaSessao',
    entityId: pautaId,
    metadata: {
      sessaoId: pauta.sessaoId,
      totalItensRemovidos: pauta.itens.length,
      proposicoesRevertidas: proposicoesIds
    }
  })

  return createSuccessResponse(null, 'Pauta excluída com sucesso')
}), { permissions: 'pauta.manage' })
