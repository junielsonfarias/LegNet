import { prisma } from '@/lib/prisma'
import type { TipoComissao } from '@prisma/client'
import { Prisma } from '@prisma/client'
import { calcularPrazoRestante } from '@/lib/services/deadline-service'

export interface ComissaoFilters {
  tipo?: string
  ativa?: boolean
  search?: string
}

export interface ComissaoPayload {
  nome: string
  sigla?: string | null
  descricao?: string | null
  tipo: string
  ativa?: boolean
}

const buildWhereClause = (filters: ComissaoFilters = {}) => {
  const where: Record<string, unknown> = {}

  if (filters.tipo) where.tipo = filters.tipo
  if (filters.ativa !== undefined) where.ativa = filters.ativa
  if (filters.search) {
    where.OR = [
      { nome: { contains: filters.search, mode: 'insensitive' } },
      { sigla: { contains: filters.search, mode: 'insensitive' } }
    ]
  }

  return where
}

const defaultInclude = {
  membros: {
    include: {
      parlamentar: {
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

export const comissaoDbService = {
  async list(filters: ComissaoFilters = {}) {
    return prisma.comissao.findMany({
      where: buildWhereClause(filters),
      orderBy: [{ nome: 'asc' }],
      include: defaultInclude
    })
  },

  async paginate(filters: ComissaoFilters = {}, options: { page?: number; limit?: number } = {}) {
    const page = Math.max(1, options.page ?? 1)
    const limit = Math.min(100, Math.max(1, options.limit ?? 50))
    const skip = (page - 1) * limit
    const where = buildWhereClause(filters)

    const [total, comissoes] = await Promise.all([
      prisma.comissao.count({ where }),
      prisma.comissao.findMany({
        where,
        orderBy: [{ nome: 'asc' }],
        skip,
        take: limit,
        include: defaultInclude
      })
    ])

    const totalPages = Math.max(1, Math.ceil(total / limit))

    return {
      data: comissoes,
      pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 }
    }
  },

  async getById(id: string) {
    return prisma.comissao.findUnique({
      where: { id },
      include: {
        membros: {
          include: {
            parlamentar: {
              select: {
                id: true,
                nome: true,
                apelido: true,
                partido: true,
                foto: true
              }
            }
          }
        }
      }
    })
  },

  async checkDuplicateName(nome: string, excludeId?: string) {
    const where: Record<string, unknown> = {
      nome: { equals: nome, mode: 'insensitive' }
    }
    if (excludeId) {
      where.id = { not: excludeId }
    }
    return prisma.comissao.findFirst({ where })
  },

  async create(payload: ComissaoPayload) {
    return prisma.comissao.create({
      data: {
        nome: payload.nome,
        sigla: payload.sigla || null,
        descricao: payload.descricao || null,
        tipo: payload.tipo as TipoComissao,
        ativa: payload.ativa ?? true
      },
      include: defaultInclude
    })
  },

  async update(id: string, payload: Partial<ComissaoPayload>) {
    const data: Record<string, unknown> = {}

    if (payload.nome !== undefined) data.nome = payload.nome
    if (payload.sigla !== undefined) data.sigla = payload.sigla || null
    if (payload.descricao !== undefined) data.descricao = payload.descricao || null
    if (payload.tipo !== undefined) data.tipo = payload.tipo
    if (payload.ativa !== undefined) data.ativa = payload.ativa

    return prisma.comissao.update({
      where: { id },
      data,
      include: defaultInclude
    })
  },

  async remove(id: string) {
    await prisma.comissao.delete({ where: { id } })
    return { success: true }
  },

  async getDashboard(id: string) {
    // Verificar se comissão existe
    const comissao = await prisma.comissao.findUnique({
      where: { id },
      include: {
        membros: {
          where: { ativo: true },
          include: {
            parlamentar: {
              select: {
                id: true,
                nome: true,
                apelido: true
              }
            }
          },
          orderBy: { cargo: 'asc' as const }
        }
      }
    })

    if (!comissao) return null

    const anoAtual = new Date().getFullYear()

    // Buscar proposições pendentes (tramitadas para esta comissão sem parecer)
    const tramitacoesPendentes = await prisma.tramitacao.findMany({
      where: {
        status: 'EM_ANDAMENTO',
        OR: [
          { unidade: { nome: { contains: comissao.nome } } },
          ...(comissao.sigla ? [{ unidade: { nome: { contains: comissao.sigla } } }] : [])
        ]
      },
      include: {
        proposicao: {
          include: {
            autor: true,
            pareceres: {
              where: { comissaoId: id }
            }
          }
        }
      },
      orderBy: { dataEntrada: 'asc' as const }
    })

    // Filtrar proposições sem parecer
    const proposicoesPendentes = tramitacoesPendentes
      .filter(t => t.proposicao.pareceres.length === 0)
      .map(t => {
        const prazoResult = t.dataEntrada
          ? calcularPrazoRestante(t.dataEntrada)
          : { dias: 15, status: 'ok' as const, mensagem: 'Sem data de distribuicao' }

        return {
          id: t.proposicao.id,
          tipo: t.proposicao.tipo,
          numero: t.proposicao.numero,
          ano: t.proposicao.ano,
          ementa: t.proposicao.ementa,
          autorNome: t.proposicao.autor?.nome || null,
          dataDistribuicao: t.dataEntrada,
          prazo: {
            dias: prazoResult.dias,
            status: prazoResult.status,
            mensagem: prazoResult.mensagem
          }
        }
      })

    // Contagens por status de prazo
    const prazosContagem = {
      expiradas: proposicoesPendentes.filter(p => p.prazo.status === 'expired').length,
      alertas: proposicoesPendentes.filter(p => p.prazo.status === 'warning').length,
      ok: proposicoesPendentes.filter(p => p.prazo.status === 'ok').length
    }

    // Próximas reuniões
    const proximasReunioes = await prisma.reuniaoComissao.findMany({
      where: {
        comissaoId: id,
        status: { in: ['AGENDADA', 'CONVOCADA'] },
        data: { gte: new Date() }
      },
      orderBy: { data: 'asc' as const },
      take: 5,
      include: {
        _count: {
          select: { itens: true }
        }
      }
    })

    // Pareceres em andamento (ainda não votados)
    const pareceresEmAndamento = await prisma.parecer.findMany({
      where: {
        comissaoId: id,
        status: { in: ['RASCUNHO', 'AGUARDANDO_VOTACAO'] }
      },
      include: {
        proposicao: {
          select: {
            id: true,
            tipo: true,
            numero: true,
            ano: true
          }
        },
        relator: {
          select: {
            id: true,
            nome: true,
            apelido: true
          }
        }
      },
      orderBy: { createdAt: 'desc' as const }
    })

    // Estatísticas do ano
    const [reunioesRealizadas, pareceresEmitidos, proposicoesAnalisadas] = await Promise.all([
      prisma.reuniaoComissao.count({
        where: { comissaoId: id, ano: anoAtual, status: 'CONCLUIDA' }
      }),
      prisma.parecer.count({
        where: {
          comissaoId: id,
          status: { in: ['EMITIDO', 'APROVADO_COMISSAO', 'REJEITADO_COMISSAO'] },
          dataEmissao: {
            gte: new Date(anoAtual, 0, 1),
            lte: new Date(anoAtual, 11, 31)
          }
        }
      }),
      prisma.parecer.count({
        where: { comissaoId: id, createdAt: { gte: new Date(anoAtual, 0, 1) } }
      })
    ])

    // Última reunião realizada
    const ultimaReuniao = await prisma.reuniaoComissao.findFirst({
      where: {
        comissaoId: id,
        status: 'CONCLUIDA'
      },
      orderBy: { data: 'desc' as const }
    })

    return {
      comissao: {
        id: comissao.id,
        nome: comissao.nome,
        sigla: comissao.sigla,
        tipo: comissao.tipo,
        ativa: comissao.ativa,
        membros: comissao.membros.map(m => ({
          id: m.id,
          cargo: m.cargo,
          parlamentarId: m.parlamentarId,
          nome: m.parlamentar.apelido || m.parlamentar.nome
        }))
      },
      proposicoesPendentes,
      prazosContagem,
      proximasReunioes: proximasReunioes.map(r => ({
        id: r.id,
        numero: r.numero,
        ano: r.ano,
        tipo: r.tipo,
        status: r.status,
        data: r.data,
        horaInicio: r.horaInicio,
        local: r.local,
        totalItens: r._count.itens
      })),
      pareceresEmAndamento: pareceresEmAndamento.map(p => ({
        id: p.id,
        numero: p.numero,
        tipo: p.tipo,
        status: p.status,
        proposicao: p.proposicao,
        relatorNome: p.relator?.apelido || p.relator?.nome || 'Nao designado'
      })),
      estatisticas: {
        ano: anoAtual,
        reunioesRealizadas,
        pareceresEmitidos,
        proposicoesAnalisadas,
        proposicoesPendentes: proposicoesPendentes.length
      },
      ultimaReuniao: ultimaReuniao ? {
        id: ultimaReuniao.id,
        numero: ultimaReuniao.numero,
        data: ultimaReuniao.data
      } : null
    }
  },

  async getPendingPropositions(id: string) {
    // Buscar comissão com detalhes
    const comissao = await prisma.comissao.findUnique({
      where: { id },
      select: { id: true, nome: true, sigla: true, ativa: true }
    })

    if (!comissao) return null

    // Construir filtro para unidade baseado na comissão
    const unidadeFilter: Prisma.TramitacaoUnidadeWhereInput = {
      OR: [
        { nome: { contains: comissao.nome, mode: 'insensitive' as Prisma.QueryMode } },
        ...(comissao.sigla ? [{ nome: { contains: comissao.sigla, mode: 'insensitive' as Prisma.QueryMode } }] : []),
        ...(comissao.sigla ? [{ sigla: comissao.sigla }] : [])
      ]
    }

    // Buscar tramitações ativas para unidades que correspondem à comissão
    const tramitacoesParaComissao = await prisma.tramitacao.findMany({
      where: {
        status: { in: ['RECEBIDA', 'EM_ANDAMENTO'] },
        unidade: unidadeFilter
      },
      include: {
        proposicao: {
          include: {
            autor: {
              select: {
                id: true,
                nome: true,
                apelido: true
              }
            },
            pareceres: {
              where: { comissaoId: id },
              select: { id: true, numero: true, status: true }
            }
          }
        },
        unidade: {
          select: { id: true, nome: true, sigla: true }
        }
      },
      orderBy: { dataEntrada: 'asc' as const }
    })

    // Filtrar apenas proposições que NÃO têm parecer desta comissão
    const proposicoesPendentes = tramitacoesParaComissao
      .filter(t => t.proposicao.pareceres.length === 0)
      .map(t => ({
        id: t.proposicao.id,
        numero: t.proposicao.numero,
        ano: t.proposicao.ano,
        tipo: t.proposicao.tipo,
        titulo: t.proposicao.titulo,
        ementa: t.proposicao.ementa,
        status: t.proposicao.status,
        autor: t.proposicao.autor,
        tramitacao: {
          id: t.id,
          dataEntrada: t.dataEntrada,
          status: t.status,
          unidade: t.unidade
        }
      }))

    // Remover duplicatas (mesma proposição pode ter múltiplas tramitações)
    const proposicoesUnicas = proposicoesPendentes.reduce((acc, prop) => {
      if (!acc.find(p => p.id === prop.id)) {
        acc.push(prop)
      }
      return acc
    }, [] as typeof proposicoesPendentes)

    return {
      comissao: {
        id: comissao.id,
        nome: comissao.nome,
        sigla: comissao.sigla
      },
      proposicoes: proposicoesUnicas,
      total: proposicoesUnicas.length
    }
  },

  async getStats() {
    const [total, ativas, porTipo] = await Promise.all([
      prisma.comissao.count(),
      prisma.comissao.count({ where: { ativa: true } }),
      prisma.comissao.groupBy({ by: ['tipo'], _count: { _all: true } })
    ])

    return {
      total,
      ativas,
      porTipo: porTipo.reduce((acc, item) => {
        acc[item.tipo] = item._count._all
        return acc
      }, {} as Record<string, number>)
    }
  },

  async exists(id: string) {
    const comissao = await prisma.comissao.findUnique({
      where: { id },
      select: { id: true, nome: true }
    })
    return comissao
  },

  // ======================================================================
  // Member Management
  // ======================================================================

  async listMembros(comissaoId: string) {
    return prisma.membroComissao.findMany({
      where: { comissaoId },
      orderBy: { dataInicio: 'desc' },
      include: {
        parlamentar: {
          select: {
            id: true,
            nome: true,
            apelido: true,
            partido: true
          }
        }
      }
    })
  },

  async findMembroDuplicado(comissaoId: string, parlamentarId: string) {
    return prisma.membroComissao.findMany({
      where: { comissaoId, parlamentarId }
    })
  },

  async createMembro(data: {
    comissaoId: string
    parlamentarId: string
    cargo: string
    dataInicio: Date
    dataFim: Date | null
    ativo: boolean
    observacoes: string | null
  }) {
    return prisma.membroComissao.create({
      data: {
        comissaoId: data.comissaoId,
        parlamentarId: data.parlamentarId,
        cargo: data.cargo as any,
        dataInicio: data.dataInicio,
        dataFim: data.dataFim,
        ativo: data.ativo,
        observacoes: data.observacoes
      },
      include: {
        parlamentar: {
          select: {
            id: true,
            nome: true,
            apelido: true,
            partido: true
          }
        }
      }
    })
  },

  async getMembroById(membroId: string) {
    return prisma.membroComissao.findUnique({
      where: { id: membroId }
    })
  },

  async updateMembro(membroId: string, data: {
    parlamentarId?: string
    cargo?: string
    dataInicio?: Date
    dataFim?: Date | null
    ativo?: boolean
    observacoes?: string | null
  }) {
    const updateData: Record<string, unknown> = {}

    if (data.parlamentarId) updateData.parlamentarId = data.parlamentarId
    if (data.cargo) updateData.cargo = data.cargo
    if (data.dataInicio) updateData.dataInicio = data.dataInicio
    if (data.dataFim !== undefined) updateData.dataFim = data.dataFim
    if (data.ativo !== undefined) updateData.ativo = data.ativo
    if (data.observacoes !== undefined) updateData.observacoes = data.observacoes

    return prisma.membroComissao.update({
      where: { id: membroId },
      data: updateData,
      include: {
        parlamentar: {
          select: {
            id: true,
            nome: true,
            apelido: true,
            partido: true
          }
        }
      }
    })
  },

  async removeMembro(membroId: string) {
    await prisma.membroComissao.delete({ where: { id: membroId } })
    return { success: true }
  },

  async deactivateHistoricoParticipacao(comissaoId: string) {
    return prisma.historicoParticipacao.updateMany({
      where: {
        tipo: 'COMISSAO',
        referenciaId: comissaoId,
        ativo: true
      },
      data: {
        ativo: false,
        dataFim: new Date()
      }
    })
  }
}
