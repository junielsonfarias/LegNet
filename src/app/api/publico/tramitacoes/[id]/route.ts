import { NextRequest } from 'next/server'

import { createSuccessResponse, NotFoundError, createErrorResponse } from '@/lib/error-handler'
import { publicGetById } from '@/lib/services/tramitacao-service'
import { withPublicCache } from '@/lib/http-cache'

export const dynamic = 'force-dynamic'

export const GET = async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params

    const tramitacao = await publicGetById(id)

    if (!tramitacao) {
      throw new NotFoundError('Tramitação')
    }

    return withPublicCache(createSuccessResponse({
      id: tramitacao.id,
      proposicao: {
        id: tramitacao.proposicao.id,
        numero: tramitacao.proposicao.numero,
        titulo: tramitacao.proposicao.titulo,
        tipo: tramitacao.proposicao.tipo,
        status: tramitacao.proposicao.status,
        dataApresentacao: tramitacao.proposicao.dataApresentacao?.toISOString() ?? null,
        autor: tramitacao.proposicao.autor
          ? {
              id: tramitacao.proposicao.autor.id,
              nome: tramitacao.proposicao.autor.nome,
              partido: tramitacao.proposicao.autor.partido
            }
          : null
      },
      status: tramitacao.status,
      resultado: tramitacao.resultado,
      dataEntrada: tramitacao.dataEntrada.toISOString(),
      dataSaida: tramitacao.dataSaida?.toISOString() ?? null,
      observacoes: tramitacao.observacoes,
      parecer: tramitacao.parecer,
      prazoVencimento: tramitacao.prazoVencimento?.toISOString() ?? null,
      diasVencidos: tramitacao.diasVencidos,
      unidade: tramitacao.unidade
        ? {
            id: tramitacao.unidade.id,
            nome: tramitacao.unidade.nome,
            sigla: tramitacao.unidade.sigla
          }
        : null,
      tipo: tramitacao.tipoTramitacao
        ? {
            id: tramitacao.tipoTramitacao.id,
            nome: tramitacao.tipoTramitacao.nome,
            descricao: tramitacao.tipoTramitacao.descricao
          }
        : null,
      historicos: tramitacao.historicos.map(h => ({
        id: h.id,
        data: h.data.toISOString(),
        acao: h.acao,
        descricao: h.descricao,
        usuarioId: h.usuarioId,
        dadosAnteriores: h.dadosAnteriores,
        dadosNovos: h.dadosNovos
      }))
    }), { maxAge: 60, swr: 300 })
  } catch (error) {
    const { id } = await params
    return createErrorResponse(error, `/api/publico/tramitacoes/${id}`)
  }
}
