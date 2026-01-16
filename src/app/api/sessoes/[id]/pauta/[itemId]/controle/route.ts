import { NextRequest } from 'next/server'
import { z } from 'zod'

import { createSuccessResponse, ValidationError, withErrorHandler } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import {
  iniciarItemPauta,
  pausarItemPauta,
  retomarItemPauta,
  iniciarVotacaoItem,
  finalizarItemPauta
} from '@/lib/services/sessao-controle'

export const dynamic = 'force-dynamic'

const ControleItemSchema = z.object({
  acao: z.enum(['iniciar', 'pausar', 'retomar', 'votacao', 'finalizar']),
  resultado: z.enum(['CONCLUIDO', 'APROVADO', 'REJEITADO', 'RETIRADO', 'ADIADO']).optional()
})

export const POST = withAuth(withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) => {
  const sessaoId = params.id
  const itemId = params.itemId

  if (!sessaoId || !itemId) {
    throw new ValidationError('Parâmetros inválidos')
  }

  const body = await request.json()
  const { acao, resultado } = ControleItemSchema.parse(body)

  switch (acao) {
    case 'iniciar':
      return createSuccessResponse(
        await iniciarItemPauta(sessaoId, itemId),
        'Item iniciado com sucesso'
      )
    case 'pausar':
      return createSuccessResponse(
        await pausarItemPauta(sessaoId, itemId),
        'Item pausado com sucesso'
      )
    case 'retomar':
      return createSuccessResponse(
        await retomarItemPauta(sessaoId, itemId),
        'Item retomado com sucesso'
      )
    case 'votacao':
      return createSuccessResponse(
        await iniciarVotacaoItem(sessaoId, itemId),
        'Item em votação'
      )
    case 'finalizar':
      return createSuccessResponse(
        await finalizarItemPauta(sessaoId, itemId, resultado),
        'Item finalizado com sucesso'
      )
    default:
      throw new ValidationError('Ação inválida')
  }
}), { permissions: 'sessao.manage' })

