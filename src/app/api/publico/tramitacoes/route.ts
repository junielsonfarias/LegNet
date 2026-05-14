import { NextRequest } from 'next/server'

import { createSuccessResponse } from '@/lib/error-handler'
import { publicList } from '@/lib/services/tramitacao-service'
import { withPublicCache } from '@/lib/http-cache'


export const GET = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)

  const status = searchParams.get('status')?.toUpperCase()
  const resultado = searchParams.get('resultado')?.toUpperCase()
  const autorId = searchParams.get('autorId')
  const searchTerm = searchParams.get('search')
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const limit = Math.min(Math.max(1, Number(searchParams.get('limit') ?? '10')), 100)

  const result = await publicList(
    {
      status: status || undefined,
      resultado: resultado || undefined,
      autorId: autorId || undefined,
      search: searchTerm || undefined,
      from: from || undefined,
      to: to || undefined
    },
    { page, limit }
  )

  const items = result.tramitacoes.map(t => ({
    id: t.id,
    proposicaoId: t.proposicaoId,
    proposicaoNumero: t.proposicao.numero,
    proposicaoTitulo: t.proposicao.titulo,
    autor: t.proposicao.autor
      ? {
          id: t.proposicao.autor.id,
          nome: t.proposicao.autor.nome,
          partido: t.proposicao.autor.partido
        }
      : null,
    status: t.status,
    resultado: t.resultado,
    dataEntrada: t.dataEntrada.toISOString(),
    dataSaida: t.dataSaida?.toISOString() ?? null,
    unidade: t.unidade
      ? {
          id: t.unidade.id,
          nome: t.unidade.nome,
          sigla: t.unidade.sigla
        }
      : null,
    tipo: t.tipoTramitacao
      ? {
          id: t.tipoTramitacao.id,
          nome: t.tipoTramitacao.nome
        }
      : null,
    observacoes: t.observacoes,
    parecer: t.parecer,
    prazoVencimento: t.prazoVencimento?.toISOString() ?? null,
    diasVencidos: t.diasVencidos
  }))

  return withPublicCache(createSuccessResponse(
    { items },
    undefined,
    result.total,
    200,
    {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages
    }
  ), { maxAge: 60, swr: 300 })
}
