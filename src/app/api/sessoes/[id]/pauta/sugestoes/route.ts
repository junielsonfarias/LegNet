import { NextRequest } from 'next/server'
import { StatusProposicao } from '@prisma/client'

import { prisma } from '@/lib/prisma'
import { createSuccessResponse, NotFoundError } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'

const STATUS_SUGESTAO: StatusProposicao[] = ['APRESENTADA', 'EM_TRAMITACAO']

const mapTipoToSecao = (tipo: string): 'EXPEDIENTE' | 'ORDEM_DO_DIA' | 'COMUNICACOES' | 'HONRAS' | 'OUTROS' => {
  switch (tipo) {
    case 'PROJETO_LEI':
    case 'PROJETO_RESOLUCAO':
    case 'PROJETO_DECRETO':
    case 'REQUERIMENTO':
      return 'ORDEM_DO_DIA'
    case 'INDICACAO':
    case 'MOCAO':
    case 'VOTO_PESAR':
    case 'VOTO_APLAUSO':
      return 'HONRAS'
    default:
      return 'EXPEDIENTE'
  }
}

const tempoEstimadoPorTipo = (tipo: string): number => {
  switch (tipo) {
    case 'PROJETO_LEI':
      return 30
    case 'PROJETO_RESOLUCAO':
    case 'PROJETO_DECRETO':
      return 20
    case 'REQUERIMENTO':
    case 'INDICACAO':
      return 10
    case 'MOCAO':
    case 'VOTO_APLAUSO':
    case 'VOTO_PESAR':
      return 8
    default:
      return 5
  }
}

const prioridadePorTipo = (tipo: string): 'ALTA' | 'MEDIA' | 'BAIXA' => {
  switch (tipo) {
    case 'PROJETO_LEI':
    case 'PROJETO_RESOLUCAO':
      return 'ALTA'
    case 'REQUERIMENTO':
    case 'INDICACAO':
      return 'MEDIA'
    default:
      return 'BAIXA'
  }
}

export const GET = withAuth(async (
  _request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const sessao = await prisma.sessao.findUnique({
    where: { id: params.id }
  })

  if (!sessao) {
    throw new NotFoundError('Sessão')
  }

  const proposicoes = await prisma.proposicao.findMany({
    where: {
      sessaoId: null,
      status: { in: STATUS_SUGESTAO }
    },
    include: {
      autor: {
        select: {
          id: true,
          nome: true,
          apelido: true,
          partido: true
        }
      }
    },
    orderBy: {
      dataApresentacao: 'asc'
    },
    take: 15
  })

  const sugestoes = proposicoes.map((proposicao) => {
    const secao = mapTipoToSecao(proposicao.tipo)
    return {
      id: proposicao.id,
      titulo: proposicao.titulo,
      descricao: proposicao.ementa,
      secao,
      tempoEstimado: tempoEstimadoPorTipo(proposicao.tipo),
      prioridade: prioridadePorTipo(proposicao.tipo),
      tipoProposicao: proposicao.tipo,
      proposicao: {
        id: proposicao.id,
        numero: proposicao.numero,
        ano: proposicao.ano,
        tipo: proposicao.tipo,
        status: proposicao.status,
        autor: proposicao.autor
      }
    }
  })

  return createSuccessResponse(sugestoes, 'Sugestões geradas com sucesso')
}, { permissions: 'pauta.manage' })

