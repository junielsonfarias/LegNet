/**
 * API Publica de Pautas de Sessoes
 * GET: Lista pautas publicadas do banco de dados real (Prisma)
 */

import { NextRequest } from 'next/server'
import { withErrorHandler, createSuccessResponse } from '@/lib/error-handler'
import { prisma } from '@/lib/prisma'
import { withPublicCache } from '@/lib/http-cache'


export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')
  const id = searchParams.get('id')

  // Buscar por ID especifico
  if (id) {
    const pauta = await prisma.pautaSessao.findUnique({
      where: { id },
      include: {
        sessao: true,
        itens: {
          include: { proposicao: { select: { id: true, tipo: true, numero: true, ano: true, ementa: true, status: true } } },
          orderBy: [{ secao: 'asc' }, { ordem: 'asc' }]
        }
      }
    })
    if (!pauta) {
      return withPublicCache(createSuccessResponse(null, 'Pauta nao encontrada'), { maxAge: 60, swr: 300 })
    }
    return withPublicCache(createSuccessResponse(mapPauta(pauta)), { maxAge: 60, swr: 300 })
  }

  // Buscar pautas publicadas
  const pautas = await prisma.pautaSessao.findMany({
    where: {
      status: { in: ['APROVADA', 'EM_ANDAMENTO', 'CONCLUIDA'] }
    },
    include: {
      sessao: true,
      itens: {
        include: { proposicao: { select: { id: true, tipo: true, numero: true, ano: true, ementa: true, status: true } } },
        orderBy: [{ secao: 'asc' }, { ordem: 'asc' }]
      }
    },
    orderBy: { sessao: { data: 'desc' } },
    take: 50
  })

  let resultado = pautas.map(mapPauta)

  // Filtro de busca
  if (search) {
    const termo = search.toLowerCase()
    resultado = resultado.filter(p =>
      p.titulo.toLowerCase().includes(termo) ||
      (p.descricao && p.descricao.toLowerCase().includes(termo))
    )
  }

  // Estatisticas
  const totalPautas = await prisma.pautaSessao.count()
  const publicadas = await prisma.pautaSessao.count({ where: { status: { in: ['APROVADA', 'EM_ANDAMENTO', 'CONCLUIDA'] } } })

  return withPublicCache(createSuccessResponse({
    pautas: resultado,
    total: resultado.length,
    stats: {
      total: totalPautas,
      publicadas,
      pendentes: totalPautas - publicadas
    }
  }), { maxAge: 60, swr: 300 })
})

function mapPauta(pauta: any) {
  const sessao = pauta.sessao
  return {
    id: pauta.id,
    sessaoId: pauta.sessaoId,
    titulo: sessao ? `Sessao ${sessao.tipo === 'ORDINARIA' ? 'Ordinaria' : sessao.tipo === 'EXTRAORDINARIA' ? 'Extraordinaria' : sessao.tipo} No ${sessao.numero}` : 'Pauta',
    descricao: pauta.observacoes,
    data: sessao?.data?.toISOString() || null,
    tipo: sessao?.tipo || 'ORDINARIA',
    status: pauta.status,
    local: sessao?.local || null,
    itens: (pauta.itens || []).map((item: any) => ({
      id: item.id,
      ordem: item.ordem,
      secao: item.secao,
      titulo: item.titulo,
      status: item.status,
      tipoAcao: item.tipoAcao,
      proposicao: item.proposicao ? {
        id: item.proposicao.id,
        tipo: item.proposicao.tipo,
        numero: item.proposicao.numero,
        ano: item.proposicao.ano,
        ementa: item.proposicao.ementa
      } : null
    })),
    totalItens: pauta.itens?.length || 0
  }
}
