import { NextRequest } from 'next/server'

import { createErrorResponse, createSuccessResponse, NotFoundError } from '@/lib/error-handler'
import {
  tramitacoesService,
  tramitacaoHistoricosService,
  tiposTramitacaoService,
  tiposOrgaosService
} from '@/lib/tramitacao-service'
import { proposicoesService } from '@/lib/proposicoes-service'
import { mockData } from '@/lib/db'

export const GET = async (_request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const tramitacao = tramitacoesService.getById(params.id)
    if (!tramitacao) {
      throw new NotFoundError('Tramitação')
    }

    const proposicao = proposicoesService.getById(tramitacao.proposicaoId)
    const tipo = tiposTramitacaoService.getById(tramitacao.tipoTramitacaoId)
    const unidade = tiposOrgaosService.getById(tramitacao.unidadeId)
    const autor = proposicao?.autorId
      ? mockData.parlamentares?.find(parlamentar => parlamentar.id === proposicao.autorId) ?? null
      : null

    const historicos = tramitacaoHistoricosService.getByTramitacao(tramitacao.id).map(historico => ({
      id: historico.id,
      data: historico.data,
      acao: historico.acao,
      descricao: historico.descricao ?? null,
      usuarioId: historico.usuarioId ?? null,
      dadosAnteriores: historico.dadosAnteriores ?? null,
      dadosNovos: historico.dadosNovos ?? null
    }))

    return createSuccessResponse({
      id: tramitacao.id,
      proposicao: proposicao
        ? {
            id: proposicao.id,
            numero: proposicao.numero,
            titulo: proposicao.titulo,
            tipo: proposicao.tipo,
            status: proposicao.status,
            dataApresentacao: proposicao.dataApresentacao,
            autor: autor
              ? {
                  id: autor.id,
                  nome: autor.nome,
                  partido: autor.partido ?? null
                }
              : null
          }
        : null,
      status: tramitacao.status,
      resultado: tramitacao.resultado ?? null,
      dataEntrada: tramitacao.dataEntrada,
      dataSaida: tramitacao.dataSaida ?? null,
      observacoes: tramitacao.observacoes ?? null,
      parecer: tramitacao.parecer ?? null,
      prazoVencimento: tramitacao.prazoVencimento ?? null,
      diasVencidos: tramitacao.diasVencidos ?? null,
      unidade: unidade
        ? {
            id: unidade.id,
            nome: unidade.nome,
            sigla: unidade.sigla ?? null
          }
        : null,
      tipo: tipo
        ? {
            id: tipo.id,
            nome: tipo.nome,
            descricao: tipo.descricao ?? null
          }
        : null,
      historicos
    })
  } catch (error) {
    return createErrorResponse(error, `/api/publico/tramitacoes/${params.id}`)
  }
}

