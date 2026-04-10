import { prisma } from '@/lib/prisma'
import { StatusProposicao } from '@prisma/client'
import { NotFoundError, ValidationError } from '@/lib/error-handler'
import { gerarPautaAutomatica } from '@/lib/utils/sessoes-utils'
import {
  validarInclusaoOrdemDoDia,
  determinarTipoAcaoPauta,
  MAPEAMENTO_TIPO_SECAO
} from '@/lib/services/proposicao-validacao-service'
import { tramitarParaPlenario } from '@/lib/services/tramitacao-service'

// ---- Types ----

export interface PautaFilters {
  status?: string
  sessaoId?: string
}

export interface PautaPayload {
  sessaoId: string
  observacoes?: string | null
  geradaAutomaticamente?: boolean
}

export interface PautaItemPayload {
  secao: string
  titulo: string
  descricao?: string | null
  proposicaoId?: string | null
  tempoEstimado?: number | null
  autor?: string | null
  observacoes?: string | null
  tipoAcao?: 'LEITURA' | 'DISCUSSAO' | 'VOTACAO' | 'LEITURA_VOTACAO' | 'DISCUSSAO_VOTACAO' | 'COMUNICADO' | 'HOMENAGEM' | 'LEITURA_ATA' | 'LEITURA_OFICIO' | null
  tipoVotacao?: 'NOMINAL' | 'SECRETA' | 'SIMBOLICA' | 'LEITURA'
  sessaoAtaOrigemId?: string | null
  oficioId?: string | null
  etapa?: number | null
  parecerId?: string | null
  leituraNumero?: number | null
  relatorId?: string | null
}

export interface DestaquePayload {
  titulo: string
  descricao?: string | null
  tipoVotacao?: 'NOMINAL' | 'SECRETA' | 'SIMBOLICA' | 'LEITURA'
  parlamentarId?: string | null
}

export interface VotoDestaquePayload {
  votosSim: number
  votosNao: number
  votosAbstencao: number
  resultado: 'APROVADO' | 'REJEITADO'
}

// ---- Includes ----

const PAUTA_SECAO_ORDER = ['EXPEDIENTE', 'ORDEM_DO_DIA', 'COMUNICACOES', 'HONRAS', 'OUTROS'] as const

const defaultInclude = {
  sessao: {
    select: {
      id: true,
      numero: true,
      tipo: true,
      data: true,
      horario: true,
      local: true,
      status: true,
      descricao: true,
      legislatura: {
        select: { numero: true, anoInicio: true, anoFim: true }
      }
    }
  },
  _count: { select: { itens: true } }
}

const pautaCompletaInclude = {
  itens: {
    include: {
      proposicao: {
        select: {
          id: true,
          numero: true,
          ano: true,
          titulo: true,
          tipo: true,
          status: true
        }
      },
      parecer: {
        select: {
          id: true,
          numero: true,
          ano: true,
          tipo: true,
          status: true,
          comissao: {
            select: { id: true, nome: true, sigla: true }
          }
        }
      },
      relator: {
        select: {
          id: true,
          nome: true,
          apelido: true,
          partido: true
        }
      }
    }
  }
}

// ---- Helpers ----

const sortItens = <T extends { secao: string; ordem: number }>(itens: T[]) => {
  return [...itens].sort((a, b) => {
    const secaoDiff = PAUTA_SECAO_ORDER.indexOf(a.secao as typeof PAUTA_SECAO_ORDER[number]) -
      PAUTA_SECAO_ORDER.indexOf(b.secao as typeof PAUTA_SECAO_ORDER[number])
    if (secaoDiff !== 0) return secaoDiff
    return a.ordem - b.ordem
  })
}

const loadPautaCompleta = async (sessaoId: string) => {
  const pauta = await prisma.pautaSessao.findUnique({
    where: { sessaoId },
    include: pautaCompletaInclude
  })

  if (!pauta) return null

  return {
    ...pauta,
    itens: sortItens(pauta.itens)
  }
}

const recalcTempoTotal = async (pautaId: string) => {
  const itens = await prisma.pautaItem.findMany({ where: { pautaId } })
  const tempoTotal = itens.reduce((total, item) => total + (item.tempoEstimado || 0), 0)
  await prisma.pautaSessao.update({
    where: { id: pautaId },
    data: {
      tempoTotalEstimado: tempoTotal,
      geradaAutomaticamente: false
    }
  })
}

// ---- Status para sugestoes ----

const STATUS_SUGESTAO: StatusProposicao[] = ['AGUARDANDO_PAUTA']

const STATUS_RETROATIVO: StatusProposicao[] = [
  'APRESENTADA', 'EM_TRAMITACAO', 'AGUARDANDO_PAUTA', 'EM_PAUTA',
  'APROVADA', 'REJEITADA', 'ARQUIVADA', 'SANCIONADA', 'PROMULGADA', 'VETADA'
]

const mapTipoToSecao = (tipo: string): typeof PAUTA_SECAO_ORDER[number] => {
  const mapeamento = MAPEAMENTO_TIPO_SECAO[tipo]
  if (mapeamento) {
    return (mapeamento.secaoVotacao || mapeamento.secaoPrimeira) as typeof PAUTA_SECAO_ORDER[number]
  }
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
    case 'PROJETO_LEI': return 30
    case 'PROJETO_RESOLUCAO':
    case 'PROJETO_DECRETO': return 20
    case 'REQUERIMENTO':
    case 'INDICACAO': return 10
    case 'MOCAO':
    case 'VOTO_APLAUSO':
    case 'VOTO_PESAR': return 8
    default: return 5
  }
}

const prioridadePorTipo = (tipo: string): 'ALTA' | 'MEDIA' | 'BAIXA' => {
  switch (tipo) {
    case 'PROJETO_LEI':
    case 'PROJETO_RESOLUCAO': return 'ALTA'
    case 'REQUERIMENTO':
    case 'INDICACAO': return 'MEDIA'
    default: return 'BAIXA'
  }
}

// ---- Service ----

export const pautasDbService = {
  async list(filters: PautaFilters = {}) {
    const where: Record<string, unknown> = {}
    if (filters.status) where.status = filters.status
    if (filters.sessaoId) where.sessaoId = filters.sessaoId

    return prisma.pautaSessao.findMany({
      where,
      include: defaultInclude,
      orderBy: { sessao: { data: 'desc' } }
    })
  },

  async paginate(filters: PautaFilters = {}, options: { page?: number; limit?: number } = {}) {
    const page = Math.max(1, options.page ?? 1)
    const limit = Math.min(100, Math.max(1, options.limit ?? 20))
    const skip = (page - 1) * limit
    const where: Record<string, unknown> = {}
    if (filters.status) where.status = filters.status

    const [total, pautas] = await Promise.all([
      prisma.pautaSessao.count({ where }),
      prisma.pautaSessao.findMany({
        where,
        include: defaultInclude,
        orderBy: { sessao: { data: 'desc' } },
        skip,
        take: limit
      })
    ])

    const totalPages = Math.max(1, Math.ceil(total / limit))

    return {
      data: pautas,
      pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 }
    }
  },

  async getById(id: string) {
    return prisma.pautaSessao.findUnique({
      where: { id },
      include: {
        ...defaultInclude,
        itens: {
          include: {
            proposicao: {
              select: { id: true, numero: true, ano: true, tipo: true, titulo: true, ementa: true, status: true }
            }
          },
          orderBy: [{ secao: 'asc' }, { ordem: 'asc' }]
        }
      }
    })
  },

  async getBySessaoId(sessaoId: string) {
    return prisma.pautaSessao.findUnique({
      where: { sessaoId },
      include: defaultInclude
    })
  },

  async create(payload: PautaPayload) {
    return prisma.pautaSessao.create({
      data: {
        sessaoId: payload.sessaoId,
        status: 'RASCUNHO',
        geradaAutomaticamente: payload.geradaAutomaticamente ?? false,
        observacoes: payload.observacoes || null,
        tempoTotalEstimado: 0
      },
      include: {
        sessao: {
          select: { id: true, numero: true, tipo: true, data: true, horario: true }
        }
      }
    })
  },

  async update(id: string, data: any) {
    return prisma.pautaSessao.update({
      where: { id },
      data,
      include: defaultInclude
    })
  },

  async publish(id: string) {
    return prisma.pautaSessao.update({
      where: { id },
      data: { status: 'APROVADA' },
      include: defaultInclude
    })
  },

  async getByIdWithSessaoAndItens(id: string) {
    return prisma.pautaSessao.findUnique({
      where: { id },
      include: {
        sessao: {
          select: {
            id: true,
            numero: true,
            tipo: true,
            data: true,
            horario: true,
            status: true
          }
        },
        itens: {
          select: { id: true }
        }
      }
    })
  },

  async publishWithFullInclude(id: string) {
    return prisma.pautaSessao.update({
      where: { id },
      data: { status: 'APROVADA' },
      include: {
        sessao: {
          select: {
            id: true,
            numero: true,
            tipo: true,
            data: true,
            horario: true
          }
        },
        itens: {
          include: {
            proposicao: {
              select: {
                id: true,
                numero: true,
                ano: true,
                titulo: true,
                tipo: true
              }
            }
          },
          orderBy: [
            { secao: 'asc' },
            { ordem: 'asc' }
          ]
        }
      }
    })
  },

  async remove(id: string) {
    await prisma.pautaSessao.delete({ where: { id } })
    return { success: true }
  },

  // ======================================================================
  // Pauta da sessao - get or auto-create
  // ======================================================================

  /**
   * Obtem a pauta de uma sessao, criando automaticamente se nao existir.
   * Retorna a pauta completa com itens ordenados por secao+ordem.
   */
  async getPautaSessao(sessaoId: string) {
    const existente = await loadPautaCompleta(sessaoId)
    if (existente) return existente

    const sessao = await prisma.sessao.findUnique({ where: { id: sessaoId } })
    if (!sessao) throw new NotFoundError('Sessao')

    const pautaPadrao = await gerarPautaAutomatica(
      sessao.numero,
      new Date(sessao.data),
      sessao.horario ?? undefined
    )
    const tempoTotal = pautaPadrao.itens.reduce((t, i) => t + (i.tempoEstimado || 0), 0)

    await prisma.pautaSessao.create({
      data: {
        sessaoId,
        status: 'RASCUNHO',
        geradaAutomaticamente: true,
        observacoes: pautaPadrao.observacoes,
        tempoTotalEstimado: tempoTotal,
        itens: {
          create: pautaPadrao.itens.map(item => ({
            secao: item.secao,
            ordem: item.ordem,
            titulo: item.titulo,
            descricao: item.descricao ?? null,
            tempoEstimado: item.tempoEstimado ?? null,
            status: 'PENDENTE'
          }))
        }
      }
    })

    return await loadPautaCompleta(sessaoId)
  },

  // ======================================================================
  // Adicionar item a pauta
  // ======================================================================

  /**
   * Adiciona um item a pauta de uma sessao, com validacao de regras de
   * negocio (RN-030, RN-057, RN-060 a RN-065), auto-deteccao de
   * tipoAcao/etapa, e tramitacao automatica quando necessario.
   *
   * @param sessaoId - ID da sessao
   * @param payload  - Dados do item
   * @param options  - userId e requestIp para tramitacao/auditoria
   * @returns Pauta completa atualizada
   */
  async addItem(
    sessaoId: string,
    payload: PautaItemPayload,
    options: { userId?: string; requestIp?: string; skipValidation?: boolean } = {}
  ) {
    const sessao = await prisma.sessao.findUnique({ where: { id: sessaoId } })
    if (!sessao) throw new NotFoundError('Sessao')

    const pautaSessao = await this.getPautaSessao(sessaoId)
    if (!pautaSessao) throw new NotFoundError('Pauta da sessao')

    // ---- Determinar tipoAcao ----
    type TipoAcao = 'LEITURA' | 'DISCUSSAO' | 'VOTACAO' | 'LEITURA_VOTACAO' | 'DISCUSSAO_VOTACAO' | 'COMUNICADO' | 'HOMENAGEM' | 'LEITURA_ATA' | 'LEITURA_OFICIO'
    let tipoAcao: TipoAcao | null = payload.tipoAcao ?? null

    if (payload.proposicaoId) {
      const proposicao = await prisma.proposicao.findUnique({
        where: { id: payload.proposicaoId },
        select: { tipo: true, status: true }
      })

      if (proposicao) {
        if (!tipoAcao) {
          const mapeamento = MAPEAMENTO_TIPO_SECAO[proposicao.tipo]
          if (mapeamento) {
            tipoAcao = (payload.secao === 'ORDEM_DO_DIA' && mapeamento.tipoAcaoVotacao
              ? mapeamento.tipoAcaoVotacao
              : mapeamento.tipoAcaoPrimeira) as TipoAcao
          } else {
            tipoAcao = determinarTipoAcaoPauta(proposicao.tipo, payload.secao) as TipoAcao
          }
        }

        // RN-030 / RN-057: validar parecer ao incluir na ORDEM_DO_DIA
        // Pular validação para lançamento retroativo (sessão CONCLUIDA)
        if (
          !options.skipValidation &&
          payload.secao === 'ORDEM_DO_DIA' &&
          (tipoAcao === 'VOTACAO' || tipoAcao === 'DISCUSSAO')
        ) {
          const validacao = await validarInclusaoOrdemDoDia(payload.proposicaoId)
          if (!validacao.valid) {
            throw new ValidationError(
              'RN-030/RN-057: ' + validacao.errors.join('; ') +
              ' Nao e possivel incluir esta proposicao na Ordem do Dia.'
            )
          }

          // Tramitar para plenario se necessario (não para retroativo)
          if (proposicao.status !== 'EM_PAUTA') {
            await tramitarParaPlenario(
              payload.proposicaoId,
              sessaoId,
              `Incluida na pauta - Secao: ${payload.secao}`,
              options.userId,
              options.requestIp
            )
          }
        }
      }
    }

    // Fallback por secao
    if (!tipoAcao) {
      switch (payload.secao) {
        case 'ORDEM_DO_DIA': tipoAcao = 'VOTACAO'; break
        case 'EXPEDIENTE': tipoAcao = 'LEITURA'; break
        case 'HONRAS': tipoAcao = 'HOMENAGEM'; break
        case 'COMUNICACOES': tipoAcao = 'COMUNICADO'; break
        default: tipoAcao = 'LEITURA'
      }
    }

    // ---- Etapa (RN-060 a RN-063) ----
    let etapa = payload.etapa ?? null
    if (payload.secao !== 'ORDEM_DO_DIA') {
      etapa = null
    } else if (etapa === null) {
      etapa = tipoAcao === 'LEITURA' ? 1 : 2
    }

    // Validar consistencia etapa vs tipoAcao
    if (etapa !== null && payload.secao === 'ORDEM_DO_DIA') {
      if (etapa === 1 && tipoAcao === 'VOTACAO') {
        throw new ValidationError('RN-061: Etapa 1 (1a Ordem do Dia) nao permite tipoAcao VOTACAO')
      }
      if (etapa === 2 && tipoAcao === 'LEITURA') {
        throw new ValidationError('RN-062: Etapa 2 (2a Ordem do Dia) nao permite tipoAcao LEITURA')
      }
    }

    // Validar parecer existe
    if (payload.parecerId) {
      const parecer = await prisma.parecer.findUnique({ where: { id: payload.parecerId } })
      if (!parecer) throw new ValidationError('Parecer nao encontrado')
    }

    // Evitar duplicacao de proposicao na MESMA SECAO da pauta
    // Permite a mesma proposicao em secoes diferentes (ex: Leitura no Expediente + Votacao na Ordem do Dia)
    if (payload.proposicaoId) {
      const itemExistente = await prisma.pautaItem.findFirst({
        where: { pautaId: pautaSessao.id, proposicaoId: payload.proposicaoId, secao: payload.secao }
      })
      if (itemExistente) {
        throw new ValidationError(
          'Esta proposicao ja esta nesta secao da pauta. ' +
          'Para adicionar em outra secao, selecione uma secao diferente.'
        )
      }
    }

    // Validar relator (RN-065)
    if (payload.relatorId) {
      const relator = await prisma.parlamentar.findUnique({
        where: { id: payload.relatorId },
        include: { mandatos: { where: { ativo: true } } }
      })
      if (!relator) throw new ValidationError('Relator nao encontrado')
      if (relator.mandatos.length === 0) {
        throw new ValidationError('RN-065: Relator deve ter mandato ativo')
      }
    }

    // Ordem
    const maiorOrdem = await prisma.pautaItem.findFirst({
      where: { pautaId: pautaSessao.id, secao: payload.secao },
      orderBy: { ordem: 'desc' }
    })

    await prisma.pautaItem.create({
      data: {
        pautaId: pautaSessao.id,
        secao: payload.secao,
        ordem: maiorOrdem ? maiorOrdem.ordem + 1 : 1,
        titulo: payload.titulo,
        descricao: payload.descricao ?? null,
        proposicaoId: payload.proposicaoId ?? null,
        tempoEstimado: payload.tempoEstimado ?? null,
        status: 'PENDENTE',
        tipoAcao: tipoAcao,
        tipoVotacao: payload.tipoVotacao ?? 'NOMINAL',
        autor: payload.autor ?? null,
        observacoes: payload.observacoes ?? null,
        sessaoAtaOrigemId: payload.sessaoAtaOrigemId ?? null,
        oficioId: payload.oficioId ?? null,
        etapa,
        parecerId: payload.parecerId ?? null,
        leituraNumero: payload.leituraNumero ?? null,
        relatorId: payload.relatorId ?? null
      }
    })

    await recalcTempoTotal(pautaSessao.id)

    return await loadPautaCompleta(sessaoId)
  },

  // ======================================================================
  // Item CRUD
  // ======================================================================

  async getItem(itemId: string) {
    return prisma.pautaItem.findUnique({
      where: { id: itemId },
      include: {
        proposicao: {
          select: { id: true, numero: true, ano: true, titulo: true, tipo: true, status: true }
        },
        parecer: {
          select: {
            id: true, numero: true, ano: true, tipo: true, status: true,
            comissao: { select: { id: true, nome: true, sigla: true } }
          }
        },
        relator: {
          select: { id: true, nome: true, apelido: true, partido: true }
        }
      }
    })
  },

  async updateItem(itemId: string, data: Record<string, unknown>) {
    return prisma.pautaItem.update({
      where: { id: itemId },
      data
    })
  },

  async deleteItem(itemId: string) {
    await prisma.pautaItem.delete({ where: { id: itemId } })
    return { success: true }
  },

  async reorderItensInSection(pautaId: string, secao: string) {
    const itens = await prisma.pautaItem.findMany({
      where: { pautaId, secao: secao as any },
      orderBy: { ordem: 'asc' }
    })

    await Promise.all(
      itens.map((item, index) => {
        const novaOrdem = index + 1
        if (item.ordem === novaOrdem) return null
        return prisma.pautaItem.update({
          where: { id: item.id },
          data: { ordem: novaOrdem }
        })
      }).filter(Boolean)
    )
  },

  async recalcTempoTotal(pautaId: string) {
    await recalcTempoTotal(pautaId)
  },

  async loadPautaById(pautaId: string) {
    const pauta = await prisma.pautaSessao.findUnique({
      where: { id: pautaId },
      include: pautaCompletaInclude
    })

    if (!pauta) return null

    return {
      ...pauta,
      itens: sortItens(pauta.itens)
    }
  },

  // ======================================================================
  // Sugestoes de proposicoes para a pauta
  // ======================================================================

  /**
   * Gera sugestoes de proposicoes que podem ser incluidas na pauta da sessao.
   * No modo retroativo (sessoes finalizadas), inclui proposicoes ja tramitadas.
   */
  async getSugestoes(sessaoId: string, retroativo: boolean = false) {
    const sessao = await prisma.sessao.findUnique({
      where: { id: sessaoId },
      include: {
        pautaSessao: {
          include: {
            itens: { select: { proposicaoId: true } }
          }
        }
      }
    })

    if (!sessao) throw new NotFoundError('Sessao')

    const isRetroativo = retroativo || sessao.status === 'CONCLUIDA'
    const statusFiltro = isRetroativo ? STATUS_RETROATIVO : STATUS_SUGESTAO

    // IDs ja na pauta (evitar duplicados)
    const idsNaPauta = sessao.pautaSessao?.itens
      ?.map(item => item.proposicaoId)
      .filter((id): id is string => !!id) || []

    const proposicoes = await prisma.proposicao.findMany({
      where: {
        ...(isRetroativo ? {} : { sessaoId: null }),
        status: { in: statusFiltro },
        id: { notIn: idsNaPauta }
      },
      include: {
        autor: {
          select: { id: true, nome: true, apelido: true, partido: true }
        },
        pareceres: {
          include: {
            comissao: { select: { sigla: true, nome: true } }
          }
        }
      },
      orderBy: { dataApresentacao: 'asc' },
      take: isRetroativo ? 50 : 15
    })

    const sugestoes = proposicoes.map(proposicao => {
      const secao = mapTipoToSecao(proposicao.tipo)
      const tipoAcao = mapTipoToAcao(proposicao.tipo, secao)
      const mapeamento = MAPEAMENTO_TIPO_SECAO[proposicao.tipo]

      const temParecerCLJ = proposicao.pareceres.some(
        p => p.comissao?.sigla === 'CLJ' || p.comissao?.nome?.includes('Legislacao')
      )
      const requerParecerCLJ = mapeamento?.requerParecerCLJ ?? false
      const podeOrdemDoDia = !requerParecerCLJ || temParecerCLJ

      return {
        id: proposicao.id,
        titulo: proposicao.titulo,
        descricao: proposicao.ementa,
        secao,
        tipoAcao,
        tempoEstimado: tempoEstimadoPorTipo(proposicao.tipo),
        prioridade: prioridadePorTipo(proposicao.tipo),
        tipoProposicao: proposicao.tipo,
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

    return {
      sugestoes,
      isRetroativo,
      sessaoStatus: sessao.status,
      totalProposicoesDisponiveis: proposicoes.length
    }
  },

  // ======================================================================
  // Destaques
  // ======================================================================

  /**
   * Lista destaques de um item da pauta.
   */
  async listDestaques(sessaoId: string, itemId: string) {
    const item = await prisma.pautaItem.findFirst({
      where: {
        id: itemId,
        pauta: { sessaoId }
      },
      include: {
        destaques: { orderBy: { solicitadoEm: 'asc' } }
      }
    })

    if (!item) throw new NotFoundError('Item da pauta')

    return item.destaques
  },

  /**
   * Cria um destaque em um item da pauta.
   * A sessao deve estar EM_ANDAMENTO e o item em discussao ou votacao.
   */
  async createDestaque(sessaoId: string, itemId: string, payload: DestaquePayload) {
    // Verificar item pertence a sessao
    const item = await prisma.pautaItem.findFirst({
      where: { id: itemId, pauta: { sessaoId } }
    })

    if (!item) throw new NotFoundError('Item da pauta')

    if (!['EM_DISCUSSAO', 'EM_VOTACAO'].includes(item.status)) {
      throw new ValidationError('So e possivel criar destaque de item em discussao ou votacao')
    }

    return prisma.destaquePautaItem.create({
      data: {
        pautaItemId: itemId,
        titulo: payload.titulo,
        descricao: payload.descricao ?? undefined,
        tipoVotacao: payload.tipoVotacao ?? 'NOMINAL',
        solicitadoPor: payload.parlamentarId ?? undefined
      }
    })
  },

  /**
   * Registra o resultado da votacao de um destaque.
   */
  async voteDestaque(destaqueId: string, payload: VotoDestaquePayload) {
    const destaque = await prisma.destaquePautaItem.findUnique({
      where: { id: destaqueId }
    })

    if (!destaque) throw new NotFoundError('Destaque')

    if (destaque.status !== 'PENDENTE' && destaque.status !== 'EM_VOTACAO') {
      throw new ValidationError('Este destaque ja foi votado')
    }

    return prisma.destaquePautaItem.update({
      where: { id: destaqueId },
      data: {
        votosSim: payload.votosSim,
        votosNao: payload.votosNao,
        votosAbstencao: payload.votosAbstencao,
        resultado: payload.resultado,
        status: payload.resultado === 'APROVADO' ? 'APROVADO' : 'REJEITADO',
        votadoEm: new Date()
      }
    })
  },

  /**
   * Remove um destaque pendente.
   */
  async removeDestaque(sessaoId: string, itemId: string, destaqueId: string) {
    const destaque = await prisma.destaquePautaItem.findFirst({
      where: {
        id: destaqueId,
        pautaItemId: itemId,
        pautaItem: { pauta: { sessaoId } }
      }
    })

    if (!destaque) throw new NotFoundError('Destaque')

    if (destaque.status !== 'PENDENTE') {
      throw new ValidationError('Nao e possivel excluir destaque ja votado')
    }

    await prisma.destaquePautaItem.delete({ where: { id: destaqueId } })
    return { success: true }
  },

  /**
   * Aplica um template a uma pauta de sessao (REPLACE ou APPEND).
   */
  async applyTemplate(sessaoId: string, templateId: string, mode: 'REPLACE' | 'APPEND' = 'REPLACE') {
    // Verificar template
    const template = await prisma.sessaoTemplate.findUnique({
      where: { id: templateId },
      include: { itens: { orderBy: { ordem: 'asc' } } }
    })

    if (!template || template.itens.length === 0) {
      throw new NotFoundError('Template de sessao')
    }

    // Garantir que pauta existe
    let pauta = await prisma.pautaSessao.findUnique({ where: { sessaoId } })
    if (!pauta) {
      pauta = await prisma.pautaSessao.create({
        data: {
          sessaoId,
          status: 'RASCUNHO',
          geradaAutomaticamente: false,
          tempoTotalEstimado: 0
        }
      })
    }

    // REPLACE: apagar itens existentes
    if (mode === 'REPLACE') {
      await prisma.pautaItem.deleteMany({ where: { pautaId: pauta.id } })
    }

    // Calcular ordens existentes para APPEND
    const existentes = mode === 'APPEND'
      ? await prisma.pautaItem.findMany({ where: { pautaId: pauta.id } })
      : []

    const ordemPorSecao = new Map<string, number>()
    existentes.forEach(item => {
      const valorAtual = ordemPorSecao.get(item.secao) ?? 0
      ordemPorSecao.set(item.secao, Math.max(valorAtual, item.ordem))
    })

    // Ordenar itens do template
    const PAUTA_SECOES = ['EXPEDIENTE', 'ORDEM_DO_DIA', 'COMUNICACOES', 'HONRAS', 'OUTROS']
    const itensSorted = [...template.itens].sort((a, b) => {
      const secaoDiff = PAUTA_SECOES.indexOf(a.secao) - PAUTA_SECOES.indexOf(b.secao)
      return secaoDiff !== 0 ? secaoDiff : a.ordem - b.ordem
    })

    // Criar itens
    for (const item of itensSorted) {
      const atual = ordemPorSecao.get(item.secao) ?? 0
      const novaOrdem = mode === 'APPEND' ? atual + 1 : (item.ordem ?? atual + 1)
      ordemPorSecao.set(item.secao, novaOrdem)

      await prisma.pautaItem.create({
        data: {
          pautaId: pauta.id,
          secao: item.secao,
          ordem: novaOrdem,
          titulo: item.titulo,
          descricao: item.descricao ?? null,
          tempoEstimado: item.tempoEstimado ?? null,
          status: 'PENDENTE',
          autor: null,
          proposicaoId: null,
          observacoes: null
        }
      })
    }

    // Recalcular tempo total
    const todosItens = await prisma.pautaItem.findMany({ where: { pautaId: pauta.id } })
    const tempoTotal = todosItens.reduce((total, item) => total + (item.tempoEstimado || 0), 0)
    await prisma.pautaSessao.update({
      where: { id: pauta.id },
      data: { tempoTotalEstimado: tempoTotal, geradaAutomaticamente: false }
    })

    // Retornar pauta atualizada
    const pautaAtualizada = await prisma.pautaSessao.findUnique({
      where: { id: pauta.id },
      include: {
        itens: {
          include: {
            proposicao: {
              select: { id: true, numero: true, ano: true, titulo: true, tipo: true, status: true }
            }
          }
        }
      }
    })

    return {
      pauta: pautaAtualizada,
      templateNome: template.nome,
      itensAdicionados: template.itens.length
    }
  }
}
