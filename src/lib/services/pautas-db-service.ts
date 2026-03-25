import { prisma } from '@/lib/prisma'

export interface PautaFilters {
  status?: string
  sessaoId?: string
}

export interface PautaPayload {
  sessaoId: string
  observacoes?: string | null
  geradaAutomaticamente?: boolean
}

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

export const pautasDbService = {
  async list(filters: PautaFilters = {}) {
    const where: any = {}
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
    const where: any = {}
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

  async remove(id: string) {
    await prisma.pautaSessao.delete({ where: { id } })
    return { success: true }
  }
}
