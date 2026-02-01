import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  withErrorHandler,
  createSuccessResponse,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  validateId
} from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

// POST - Adicionar multiplos itens a pauta de uma vez
export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const session = await getServerSession(authOptions)
  if (!session) {
    throw new UnauthorizedError()
  }

  const reuniaoId = validateId(params.id, 'Reuniao')
  const body = await request.json()
  const { proposicaoIds } = body

  if (!proposicaoIds || !Array.isArray(proposicaoIds) || proposicaoIds.length === 0) {
    throw new ValidationError('proposicaoIds deve ser um array com pelo menos um ID')
  }

  // Verificar se reuniao existe e esta em status valido
  const reuniao = await prisma.reuniaoComissao.findUnique({
    where: { id: reuniaoId }
  })

  if (!reuniao) {
    throw new NotFoundError('Reuniao')
  }

  if (reuniao.status === 'CONCLUIDA' || reuniao.status === 'CANCELADA') {
    throw new ValidationError('Nao e possivel adicionar itens a reunioes concluidas ou canceladas')
  }

  // Obter proxima ordem
  const ultimoItem = await prisma.pautaReuniaoComissao.findFirst({
    where: { reuniaoId },
    orderBy: { ordem: 'desc' }
  })
  let ordem = (ultimoItem?.ordem || 0)

  // Buscar proposicoes
  const proposicoes = await prisma.proposicao.findMany({
    where: { id: { in: proposicaoIds } },
    select: {
      id: true,
      tipo: true,
      numero: true,
      ano: true,
      ementa: true
    }
  })

  if (proposicoes.length === 0) {
    throw new ValidationError('Nenhuma proposicao valida encontrada')
  }

  // Verificar quais proposicoes ja estao na pauta
  const itensExistentes = await prisma.pautaReuniaoComissao.findMany({
    where: {
      reuniaoId,
      proposicaoId: { in: proposicaoIds }
    },
    select: { proposicaoId: true }
  })
  const idsExistentes = new Set(itensExistentes.map(i => i.proposicaoId))

  // Criar itens para proposicoes que ainda nao estao na pauta
  const itensParaCriar = proposicoes
    .filter(p => !idsExistentes.has(p.id))
    .map(p => {
      ordem++
      return {
        reuniaoId,
        ordem,
        titulo: `Analise: ${p.tipo} ${p.numero}/${p.ano}`,
        descricao: p.ementa || '',
        tipo: 'ANALISE_PROPOSICAO' as const,
        proposicaoId: p.id,
        status: 'PENDENTE' as const
      }
    })

  if (itensParaCriar.length === 0) {
    return createSuccessResponse(
      { adicionados: 0, jaExistentes: proposicoes.length },
      'Todas as proposicoes ja estao na pauta'
    )
  }

  // Criar itens em lote
  const resultado = await prisma.pautaReuniaoComissao.createMany({
    data: itensParaCriar
  })

  // Buscar itens criados para retornar
  const itensCriados = await prisma.pautaReuniaoComissao.findMany({
    where: {
      reuniaoId,
      proposicaoId: { in: itensParaCriar.map(i => i.proposicaoId) }
    },
    include: {
      proposicao: true
    },
    orderBy: { ordem: 'asc' }
  })

  return createSuccessResponse(
    {
      itens: itensCriados,
      adicionados: resultado.count,
      jaExistentes: proposicoes.length - itensParaCriar.length
    },
    `${resultado.count} item(ns) adicionado(s) a pauta`
  )
})
