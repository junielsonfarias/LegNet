import { prisma } from '@/lib/prisma'

export const relatoriosDbService = {
  async getParlamentaresData(filters: { ativo?: boolean }) {
    const where: Record<string, unknown> = {}
    if (filters.ativo !== undefined) {
      where.ativo = filters.ativo
    }

    return prisma.parlamentar.findMany({
      where,
      include: {
        _count: {
          select: {
            proposicoes: true,
            presencas: { where: { presente: true } }
          }
        }
      },
      orderBy: { nome: 'asc' }
    })
  },

  async getSessoesData(filters: {
    status?: string
    tipo?: string
    dataInicio?: string
    dataFim?: string
    legislaturaId?: string
  }) {
    const where: Record<string, unknown> = {}
    if (filters.status) where.status = filters.status
    if (filters.tipo) where.tipo = filters.tipo
    const dataFilter: Record<string, Date> = {}
    if (filters.dataInicio) dataFilter.gte = new Date(filters.dataInicio)
    if (filters.dataFim) dataFilter.lte = new Date(filters.dataFim)
    if (Object.keys(dataFilter).length > 0) where.data = dataFilter
    if (filters.legislaturaId) where.legislaturaId = filters.legislaturaId

    return prisma.sessao.findMany({
      where,
      include: {
        _count: {
          select: {
            presencas: { where: { presente: true } }
          }
        },
        presencas: {
          select: { presente: true }
        },
        pautaSessao: {
          include: {
            _count: {
              select: { itens: true }
            }
          }
        }
      },
      orderBy: [{ data: 'desc' }, { numero: 'desc' }]
    })
  },

  async getProposicoesData(filters: { status?: string; ano?: number }) {
    const where: Record<string, unknown> = {}
    if (filters.status) where.status = filters.status
    if (filters.ano) where.ano = filters.ano

    return prisma.proposicao.findMany({
      where,
      include: {
        autor: {
          select: { nome: true, apelido: true }
        }
      },
      orderBy: [{ ano: 'desc' }, { numero: 'desc' }]
    })
  },

  async getPresencaData() {
    return prisma.parlamentar.findMany({
      where: { ativo: true },
      include: {
        presencas: {
          select: {
            presente: true,
            justificativa: true
          }
        }
      },
      orderBy: { nome: 'asc' }
    })
  },

  async getVotacoesData() {
    return prisma.proposicao.findMany({
      where: {
        resultado: { not: null }
      },
      include: {
        votacoes: {
          select: { voto: true }
        },
        sessao: {
          select: { numero: true, data: true }
        }
      },
      orderBy: { dataVotacao: 'desc' }
    })
  }
}
