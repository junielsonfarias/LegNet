import { prisma } from '@/lib/prisma'

export interface ConcursoFilters {
  status?: string
}

const buildWhereClause = (filters: ConcursoFilters = {}) => {
  const where: Record<string, unknown> = {}

  if (filters.status) where.status = filters.status

  return where
}

export const concursosService = {
  async list(filters: ConcursoFilters = {}) {
    return prisma.concurso.findMany({
      where: buildWhereClause(filters),
      orderBy: { dataPublicacao: 'desc' },
    })
  },

  async paginate(filters: ConcursoFilters = {}, options: { page?: number; limit?: number } = {}) {
    const page = Math.max(1, options.page ?? 1)
    const limit = Math.min(100, Math.max(1, options.limit ?? 10))
    const skip = (page - 1) * limit
    const where = buildWhereClause(filters)

    const [total, data] = await Promise.all([
      prisma.concurso.count({ where }),
      prisma.concurso.findMany({
        where,
        orderBy: { dataPublicacao: 'desc' },
        skip,
        take: limit,
      }),
    ])

    const totalPages = Math.max(1, Math.ceil(total / limit))

    return {
      data,
      pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
    }
  },

  async getById(id: string) {
    return prisma.concurso.findUnique({ where: { id } })
  },

  async create(data: {
    titulo: string
    edital?: string
    descricao?: string
    dataPublicacao: Date | string
    dataInscricaoInicio?: Date | string
    dataInscricaoFim?: Date | string
    dataProva?: Date | string
    status?: string
    vagas?: number
    observacoes?: string
    arquivo?: string
  }) {
    return prisma.concurso.create({
      data: {
        titulo: data.titulo,
        edital: data.edital ?? null,
        descricao: data.descricao ?? null,
        dataPublicacao: new Date(data.dataPublicacao),
        dataInscricaoInicio: data.dataInscricaoInicio ? new Date(data.dataInscricaoInicio) : null,
        dataInscricaoFim: data.dataInscricaoFim ? new Date(data.dataInscricaoFim) : null,
        dataProva: data.dataProva ? new Date(data.dataProva) : null,
        status: data.status ?? 'ABERTO',
        vagas: data.vagas ?? null,
        observacoes: data.observacoes ?? null,
        arquivo: data.arquivo ?? null,
      },
    })
  },

  async update(id: string, data: Partial<{
    titulo: string
    edital: string | null
    descricao: string | null
    dataPublicacao: Date | string
    dataInscricaoInicio: Date | string | null
    dataInscricaoFim: Date | string | null
    dataProva: Date | string | null
    status: string
    vagas: number | null
    observacoes: string | null
    arquivo: string | null
  }>) {
    const updateData: Record<string, unknown> = { ...data }

    if (data.dataPublicacao) updateData.dataPublicacao = new Date(data.dataPublicacao)
    if (data.dataInscricaoInicio) updateData.dataInscricaoInicio = new Date(data.dataInscricaoInicio)
    if (data.dataInscricaoFim) updateData.dataInscricaoFim = new Date(data.dataInscricaoFim)
    if (data.dataProva) updateData.dataProva = new Date(data.dataProva)

    return prisma.concurso.update({ where: { id }, data: updateData })
  },

  async delete(id: string) {
    await prisma.concurso.delete({ where: { id } })
    return { success: true }
  },

  async getAbertos() {
    return prisma.concurso.findMany({
      where: { status: 'ABERTO' },
      orderBy: { dataPublicacao: 'desc' },
    })
  },
}
