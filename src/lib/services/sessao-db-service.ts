import { prisma } from '@/lib/prisma'
import {
  getLegislaturaAtual,
  getLegislaturaParaData,
  getPeriodoAtual,
  getPeriodoParaData,
  getProximoNumeroSessaoOrdinaria,
  gerarPautaAutomatica,
  gerarAtaSessao
} from '@/lib/utils/sessoes-utils'
import { combineDateAndTimeUTC } from '@/lib/utils/date'
import { ValidationError, ConflictError } from '@/lib/error-handler'

// ---- Types ----

export interface SessaoFilters {
  status?: string
  tipo?: string
  legislaturaId?: string
  periodoId?: string
  ano?: number
}

export interface SessaoCreatePayload {
  numero?: number
  tipo: 'ORDINARIA' | 'EXTRAORDINARIA' | 'SOLENE' | 'ESPECIAL'
  data: string
  horario?: string | null
  local?: string | null
  status?: string
  descricao?: string | null
  ata?: string | null
  finalizada?: boolean
  legislaturaId?: string | null
  periodoId?: string | null
  tempoInicio?: string | null
  urlAudio?: string | null
  urlVideo?: string | null
  urlTransmissao?: string | null
  arquivoPauta?: string | null
  arquivoAta?: string | null
  temaSolene?: string | null
}

// ---- Include helpers ----

const listInclude = {
  legislatura: {
    select: {
      id: true,
      numero: true,
      anoInicio: true,
      anoFim: true,
      mandatos: {
        where: { ativo: true, parlamentar: { ativo: true } },
        include: { parlamentar: { select: { id: true, nome: true, apelido: true } } }
      }
    }
  },
  periodo: {
    select: {
      id: true,
      numero: true,
      dataInicio: true,
      dataFim: true
    }
  },
  presencas: {
    select: { id: true, presente: true, parlamentarId: true }
  },
  mesaSessao: {
    include: {
      membros: {
        include: {
          parlamentar: { select: { id: true, nome: true, apelido: true } }
        }
      }
    }
  },
  pautaSessao: {
    include: {
      itemAtual: {
        select: {
          id: true,
          titulo: true,
          secao: true,
          ordem: true,
          tempoEstimado: true,
          tempoReal: true,
          tempoAcumulado: true,
          iniciadoEm: true,
          finalizadoEm: true,
          status: true
        }
      },
      itens: {
        orderBy: { ordem: 'asc' as const },
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
          }
        }
      }
    }
  }
}

const detailInclude = {
  legislatura: {
    select: {
      id: true,
      numero: true,
      anoInicio: true,
      anoFim: true
    }
  },
  periodo: {
    select: {
      id: true,
      numero: true,
      dataInicio: true,
      dataFim: true
    }
  },
  pautaSessao: {
    include: {
      itens: {
        orderBy: { ordem: 'asc' as const },
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
          }
        }
      }
    }
  }
}

// ---- Service ----

export const sessaoDbService = {
  /**
   * Verifica se uma sessao existe. Retorna a sessao ou null.
   */
  async getById(id: string, include?: Record<string, unknown>) {
    return prisma.sessao.findUnique({
      where: { id },
      ...(include ? { include } : {})
    })
  },

  /**
   * Verifica se existe uma sessao com o ID dado. Lanca erro se nao existir.
   */
  async assertExists(id: string) {
    const sessao = await prisma.sessao.findUnique({ where: { id } })
    if (!sessao) throw new ValidationError('Sessao nao encontrada')
    return sessao
  },

  /**
   * Exclui uma sessao pelo ID.
   */
  async delete(id: string) {
    await prisma.sessao.delete({ where: { id } })
    return { success: true }
  },

  /**
   * Atualiza uma sessao pelo ID.
   */
  async update(id: string, data: Record<string, unknown>, include?: Record<string, unknown>) {
    return prisma.sessao.update({
      where: { id },
      data,
      ...(include ? { include } : {})
    })
  },

  /**
   * Verifica duplicidade de numero de sessao.
   */
  async checkDuplicateNumero(numero: number, excludeId?: string) {
    return prisma.sessao.findFirst({
      where: {
        numero,
        ...(excludeId ? { id: { not: excludeId } } : {})
      }
    })
  },

  /**
   * Lista sessoes disponiveis para vinculacao de pauta.
   */
  async listSessoesDisponiveis(options: { incluirComPauta?: boolean; incluirFinalizadas?: boolean } = {}) {
    const whereClause: Record<string, unknown> = options.incluirComPauta ? {} : { pautaSessao: null }

    if (!options.incluirFinalizadas) {
      whereClause.status = { not: 'CANCELADA' }
    }

    return prisma.sessao.findMany({
      where: whereClause,
      include: {
        legislatura: {
          select: {
            numero: true,
            anoInicio: true,
            anoFim: true
          }
        },
        pautaSessao: {
          select: {
            id: true,
            status: true,
            tempoTotalEstimado: true,
            _count: {
              select: {
                itens: true
              }
            }
          }
        }
      },
      orderBy: [
        { data: 'desc' },
        { numero: 'desc' }
      ],
      take: 100
    })
  },

  /**
   * Lista sessoes com filtros e paginacao.
   * Retorna { data, pagination } com total, page, limit, totalPages.
   */
  async list(
    filters: SessaoFilters = {},
    options: { page?: number; limit?: number } = {}
  ) {
    const page = Math.max(1, options.page ?? 1)
    const limit = Math.min(100, Math.max(1, options.limit ?? 50))
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (filters.status) where.status = filters.status
    if (filters.tipo) where.tipo = filters.tipo
    if (filters.legislaturaId) where.legislaturaId = filters.legislaturaId
    if (filters.periodoId) where.periodoId = filters.periodoId
    if (filters.ano) {
      where.data = {
        gte: new Date(`${filters.ano}-01-01`),
        lt: new Date(`${filters.ano + 1}-01-01`)
      }
    }

    const [sessoes, total] = await Promise.all([
      prisma.sessao.findMany({
        where,
        orderBy: [{ data: 'desc' }, { numero: 'desc' }],
        skip,
        take: limit,
        include: listInclude
      }),
      prisma.sessao.count({ where })
    ])

    const totalPages = Math.max(1, Math.ceil(total / limit))

    return {
      data: sessoes,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }
  },

  /**
   * Lista sessoes para API publica de integracoes
   */
  async listPublic(filters: {
    status?: string
    tipo?: string
    from?: Date
    to?: Date
    limit?: number
  }) {
    const where: Record<string, unknown> = {}
    if (filters.status) where.status = filters.status
    if (filters.tipo) where.tipo = filters.tipo
    if (filters.from || filters.to) {
      const dataFilter: Record<string, Date> = {}
      if (filters.from) dataFilter.gte = filters.from
      if (filters.to) dataFilter.lte = filters.to
      if (Object.keys(dataFilter).length > 0) where.data = dataFilter
    }

    return prisma.sessao.findMany({
      where,
      orderBy: { data: 'desc' },
      take: filters.limit || 50,
      include: {
        legislatura: {
          select: { id: true, numero: true, anoInicio: true, anoFim: true }
        },
        periodo: {
          select: { id: true, numero: true, dataInicio: true, dataFim: true }
        },
        pautaSessao: {
          include: { itens: true }
        }
      }
    })
  },

  /**
   * Cancela uma sessao (muda status para CANCELADA).
   */
  async cancelar(id: string) {
    return prisma.sessao.update({
      where: { id },
      data: {
        status: 'CANCELADA',
        finalizada: true
      }
    })
  },

  /**
   * Cria uma sessao com auto-deteccao de legislatura/periodo, calculo de numero
   * sequencial e geracao automatica de pauta.
   */
  async create(payload: SessaoCreatePayload, userId?: string) {
    const dataSessao = combineDateAndTimeUTC(payload.data, payload.horario ?? undefined)
    const ehDadoPreterito = payload.finalizada === true

    // ---- Legislatura ----
    let legislaturaId = payload.legislaturaId ?? null
    if (!legislaturaId) {
      const legislatura = ehDadoPreterito
        ? await getLegislaturaParaData(dataSessao)
        : await getLegislaturaAtual()

      if (!legislatura) {
        throw new ValidationError(
          ehDadoPreterito
            ? `Nao ha legislatura cadastrada para o ano ${dataSessao.getFullYear()}. Cadastre a legislatura primeiro.`
            : 'Nao ha legislatura ativa cadastrada. Cadastre uma legislatura primeiro.'
        )
      }
      legislaturaId = legislatura.id
    }

    // ---- Periodo ----
    let periodoId = payload.periodoId ?? null
    if (!periodoId && legislaturaId) {
      const periodo = ehDadoPreterito
        ? await getPeriodoParaData(dataSessao, legislaturaId)
        : await getPeriodoAtual(dataSessao, legislaturaId)

      if (!periodo) {
        throw new ValidationError(
          ehDadoPreterito
            ? 'Nao ha periodo cadastrado na legislatura para a data informada. Cadastre os periodos da legislatura primeiro.'
            : 'Nao ha periodo ativo para a data informada. Verifique os periodos da legislatura.'
        )
      }
      periodoId = periodo.id
    }

    // ---- Numero sequencial ----
    let numeroSessao = payload.numero ?? null
    if (!numeroSessao && payload.tipo === 'ORDINARIA' && legislaturaId && periodoId) {
      numeroSessao = await getProximoNumeroSessaoOrdinaria(legislaturaId, periodoId)
    } else if (!numeroSessao) {
      const ultimaSessao = await prisma.sessao.findFirst({
        where: {
          tipo: payload.tipo,
          ...(legislaturaId && periodoId ? { legislaturaId, periodoId } : {})
        },
        orderBy: { numero: 'desc' }
      })
      numeroSessao = ultimaSessao ? ultimaSessao.numero + 1 : 1
    }

    // ---- Duplicidade ----
    const existingSessao = await prisma.sessao.findFirst({
      where: {
        numero: numeroSessao,
        tipo: payload.tipo,
        ...(legislaturaId && periodoId ? { legislaturaId, periodoId } : {})
      }
    })

    if (existingSessao) {
      throw new ConflictError(
        `Ja existe uma sessao ${payload.tipo} numero ${numeroSessao}${legislaturaId && periodoId ? ' nesta legislatura/periodo' : ''}`
      )
    }

    // ---- Criar sessao ----
    const sessao = await prisma.sessao.create({
      data: {
        numero: numeroSessao,
        tipo: payload.tipo,
        data: dataSessao,
        horario: payload.horario || null,
        local: payload.local || null,
        status: (payload.status as any) || 'AGENDADA',
        descricao: payload.descricao || null,
        ata: payload.ata || null,
        finalizada: payload.finalizada || false,
        legislaturaId: legislaturaId || null,
        periodoId: periodoId || null
      }
    })

    // ---- Pauta automatica ----
    const pautaAutomatica = await gerarPautaAutomatica(
      numeroSessao,
      dataSessao,
      payload.horario ?? undefined
    )
    const tempoTotal = pautaAutomatica.itens.reduce(
      (acc, item) => acc + (item.tempoEstimado || 0),
      0
    )

    await prisma.pautaSessao.create({
      data: {
        sessaoId: sessao.id,
        status: 'RASCUNHO',
        geradaAutomaticamente: true,
        observacoes: pautaAutomatica.observacoes,
        tempoTotalEstimado: tempoTotal,
        tempoTotalReal: 0,
        itemAtualId: null,
        itens: {
          create: pautaAutomatica.itens.map(item => ({
            secao: item.secao,
            ordem: item.ordem,
            titulo: item.titulo,
            descricao: item.descricao || null,
            tempoEstimado: item.tempoEstimado || null,
            tempoAcumulado: 0,
            tempoReal: null,
            iniciadoEm: null,
            finalizadoEm: null,
            status: 'PENDENTE'
          }))
        }
      }
    })

    // ---- Ata automatica para sessoes finalizadas ----
    if (payload.finalizada && payload.status === 'CONCLUIDA' && !payload.ata) {
      try {
        const ataGerada = await gerarAtaSessao(sessao.id)
        await prisma.sessao.update({
          where: { id: sessao.id },
          data: { ata: ataGerada }
        })
      } catch {
        // Erro ao gerar ata nao e critico
      }
    }

    // ---- Retornar sessao completa ----
    const sessaoCompleta = await prisma.sessao.findUnique({
      where: { id: sessao.id },
      include: detailInclude
    })

    return { sessao: sessaoCompleta, legislaturaId, periodoId }
  }
}
