import { NextRequest } from 'next/server'
import { z } from 'zod'

import { createSuccessResponse, ValidationError, withErrorHandler } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import {
  iniciarItemPauta,
  pausarItemPauta,
  retomarItemPauta,
  iniciarVotacaoItem,
  finalizarItemPauta,
  pedirVistaItem,
  retomarItemVista,
  reordenarItemPauta
} from '@/lib/services/sessao-controle'

export const dynamic = 'force-dynamic'

const ControleItemSchema = z.object({
  acao: z.enum(['iniciar', 'pausar', 'retomar', 'votacao', 'finalizar', 'vista', 'retomarVista', 'subir', 'descer']),
  resultado: z.enum(['CONCLUIDO', 'APROVADO', 'REJEITADO', 'RETIRADO', 'ADIADO']).optional(),
  parlamentarId: z.string().optional(), // Para pedido de vista
  prazoDias: z.number().optional()      // Prazo para devolução da vista
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
  const { acao, resultado, parlamentarId, prazoDias } = ControleItemSchema.parse(body)

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
    case 'vista':
      if (!parlamentarId) {
        throw new ValidationError('ID do parlamentar é obrigatório para pedido de vista')
      }
      return createSuccessResponse(
        await pedirVistaItem(sessaoId, itemId, parlamentarId, prazoDias),
        'Pedido de vista registrado com sucesso'
      )
    case 'retomarVista':
      return createSuccessResponse(
        await retomarItemVista(sessaoId, itemId),
        'Item retomado após vista'
      )
    case 'subir':
      return createSuccessResponse(
        await reordenarItemPauta(sessaoId, itemId, 'subir'),
        'Item reordenado com sucesso'
      )
    case 'descer':
      return createSuccessResponse(
        await reordenarItemPauta(sessaoId, itemId, 'descer'),
        'Item reordenado com sucesso'
      )
    default:
      throw new ValidationError('Ação inválida')
  }
}), { permissions: 'sessao.manage' })

