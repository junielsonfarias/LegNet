import { NextRequest } from 'next/server'
import { StatusProposicao } from '@prisma/client'

import { prisma } from '@/lib/prisma'
import { createSuccessResponse, NotFoundError } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { MAPEAMENTO_TIPO_SECAO } from '@/lib/services/proposicao-validacao-service'
import { resolverSessaoId } from '@/lib/services/sessao-controle'

// Apenas proposições prontas para inclusão em pauta (já tramitaram e têm pareceres necessários)
const STATUS_SUGESTAO: StatusProposicao[] = ['AGUARDANDO_PAUTA']

// Status para sessões finalizadas (retroativo) - inclui mais opções
const STATUS_RETROATIVO: StatusProposicao[] = [
  'APRESENTADA', 'EM_TRAMITACAO', 'AGUARDANDO_PAUTA', 'EM_PAUTA',
  'APROVADA', 'REJEITADA', 'ARQUIVADA', 'SANCIONADA', 'PROMULGADA', 'VETADA'
]

const mapTipoToSecao = (tipo: string): 'EXPEDIENTE' | 'ORDEM_DO_DIA' | 'COMUNICACOES' | 'HONRAS' | 'OUTROS' => {
  // Usar mapeamento do serviço de validação
  const mapeamento = MAPEAMENTO_TIPO_SECAO[tipo]
  if (mapeamento) {
    // Se a proposição tem seção de votação, sugerir ORDEM_DO_DIA
    // caso contrário, usar seção primeira
    return (mapeamento.secaoVotacao || mapeamento.secaoPrimeira) as 'EXPEDIENTE' | 'ORDEM_DO_DIA' | 'COMUNICACOES' | 'HONRAS' | 'OUTROS'
  }

  // Fallback para o comportamento anterior
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

const mapTipoToAcao = (tipo: string, secao: string): 'LEITURA' | 'VOTACAO' | 'HOMENAGEM' | 'COMUNICADO' => {
  const mapeamento = MAPEAMENTO_TIPO_SECAO[tipo]
  if (mapeamento) {
    if (secao === 'ORDEM_DO_DIA' && mapeamento.tipoAcaoVotacao) {
      return mapeamento.tipoAcaoVotacao as 'LEITURA' | 'VOTACAO' | 'HOMENAGEM' | 'COMUNICADO'
    }
    return mapeamento.tipoAcaoPrimeira as 'LEITURA' | 'VOTACAO' | 'HOMENAGEM' | 'COMUNICADO'
  }

  // Fallback
  switch (tipo) {
    case 'VOTO_PESAR':
    case 'VOTO_APLAUSO':
      return 'HOMENAGEM'
    case 'INDICACAO':
      return 'LEITURA'
    default:
      return secao === 'ORDEM_DO_DIA' ? 'VOTACAO' : 'LEITURA'
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
  const { searchParams } = new URL(_request.url)
  const retroativo = searchParams.get('retroativo') === 'true'

  // Suporta tanto ID quanto slug (ex: sessao-1-2026)
  const sessaoId = await resolverSessaoId(params.id)

  const sessao = await prisma.sessao.findUnique({
    where: { id: sessaoId },
    include: {
      pautaSessao: {
        include: {
          itens: {
            select: { proposicaoId: true }
          }
        }
      }
    }
  })

  if (!sessao) {
    throw new NotFoundError('Sessão')
  }

  // Para sessões finalizadas ou modo retroativo, usar filtro mais amplo
  const isRetroativo = retroativo || sessao.status === 'CONCLUIDA'
  const statusFiltro = isRetroativo ? STATUS_RETROATIVO : STATUS_SUGESTAO

  // IDs das proposições já na pauta (para não sugerir duplicados)
  const idsNaPauta = sessao.pautaSessao?.itens
    ?.map(item => item.proposicaoId)
    .filter((id): id is string => !!id) || []

  const proposicoes = await prisma.proposicao.findMany({
    where: {
      // Para retroativo, não exigir sessaoId null
      ...(isRetroativo ? {} : { sessaoId: null }),
      status: { in: statusFiltro },
      // Excluir proposições já na pauta
      id: { notIn: idsNaPauta }
    },
    include: {
      autor: {
        select: {
          id: true,
          nome: true,
          apelido: true,
          partido: true
        }
      },
      pareceres: {
        include: {
          comissao: {
            select: { sigla: true, nome: true }
          }
        }
      }
    },
    orderBy: {
      dataApresentacao: 'asc'
    },
    // Mais proposições para modo retroativo
    take: isRetroativo ? 50 : 15
  })

  const sugestoes = proposicoes.map((proposicao) => {
    const secao = mapTipoToSecao(proposicao.tipo)
    const tipoAcao = mapTipoToAcao(proposicao.tipo, secao)
    const mapeamento = MAPEAMENTO_TIPO_SECAO[proposicao.tipo]

    // Verifica se tem parecer da CLJ (necessário para ORDEM_DO_DIA)
    const temParecerCLJ = proposicao.pareceres.some(
      p => p.comissao?.sigla === 'CLJ' || p.comissao?.nome?.includes('Legislação')
    )
    const requerParecerCLJ = mapeamento?.requerParecerCLJ ?? false

    // Determina se pode ir para Ordem do Dia
    const podeOrdemDoDia = !requerParecerCLJ || temParecerCLJ

    return {
      id: proposicao.id,
      titulo: proposicao.titulo,
      descricao: proposicao.ementa,
      secao,
      tipoAcao,                      // NOVO - tipo de ação sugerido
      tempoEstimado: tempoEstimadoPorTipo(proposicao.tipo),
      prioridade: prioridadePorTipo(proposicao.tipo),
      tipoProposicao: proposicao.tipo,
      // NOVO - informações sobre requisitos
      requisitos: {
        requerParecerCLJ,
        temParecerCLJ,
        podeOrdemDoDia,
        totalPareceres: proposicao.pareceres.length
      },
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

  return createSuccessResponse({
    sugestoes,
    isRetroativo,
    sessaoStatus: sessao.status,
    totalProposicoesDisponiveis: proposicoes.length
  }, 'Sugestões geradas com sucesso')
}, { permissions: 'pauta.manage' })

