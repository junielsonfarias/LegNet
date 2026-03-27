import { NextRequest } from 'next/server'
import {
  createSuccessResponse,
  NotFoundError,
  ValidationError,
  validateId
} from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { ReuniaoComissaoService } from '@/lib/services/reuniao-comissao-service'

export const dynamic = 'force-dynamic'

// POST - Adicionar multiplos itens a pauta de uma vez
// SEGURANÇA: Requer autenticação e permissão de gestão de comissões
export const POST = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: rawId } = await context.params
  const reuniaoId = validateId(rawId, 'Reuniao')
  const body = await request.json()
  const { proposicaoIds } = body

  if (!proposicaoIds || !Array.isArray(proposicaoIds) || proposicaoIds.length === 0) {
    throw new ValidationError('proposicaoIds deve ser um array com pelo menos um ID')
  }

  // Verificar se reuniao existe via service
  const reuniao = await ReuniaoComissaoService.buscarReuniaoPorId(reuniaoId)

  if (!reuniao) {
    throw new NotFoundError('Reuniao')
  }

  if (reuniao.status === 'CONCLUIDA' || reuniao.status === 'CANCELADA') {
    throw new ValidationError('Nao e possivel adicionar itens a reunioes concluidas ou canceladas')
  }

  const resultado = await ReuniaoComissaoService.adicionarItensPautaBulk(reuniaoId, proposicaoIds)

  if (!resultado) {
    throw new NotFoundError('Reuniao')
  }

  if (resultado.adicionados === 0) {
    return createSuccessResponse(
      { adicionados: 0, jaExistentes: resultado.jaExistentes },
      'Todas as proposicoes ja estao na pauta'
    )
  }

  return createSuccessResponse(
    {
      itens: resultado.itens,
      adicionados: resultado.adicionados,
      jaExistentes: resultado.jaExistentes
    },
    `${resultado.adicionados} item(ns) adicionado(s) a pauta`
  )
}, { permissions: 'comissao.manage' })
