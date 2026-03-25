import { prisma } from '@/lib/prisma'

export interface LegislaturaFilters {
  ativa?: boolean
  search?: string
}

export interface LegislaturaPayload {
  numero: number
  anoInicio: number
  anoFim: number
  dataInicio?: string | null
  dataFim?: string | null
  ativa?: boolean
  descricao?: string | null
}

const buildWhereClause = (filters: LegislaturaFilters = {}) => {
  const where: any = {}

  if (filters.ativa !== undefined) where.ativa = filters.ativa
  if (filters.search) {
    where.OR = [
      { numero: { equals: parseInt(filters.search) || 0 } },
      { descricao: { contains: filters.search, mode: 'insensitive' } }
    ]
  }

  return where
}

export const legislaturaDbService = {
  async list(filters: LegislaturaFilters = {}) {
    return prisma.legislatura.findMany({
      where: buildWhereClause(filters),
      orderBy: [{ anoInicio: 'desc' }, { numero: 'desc' }]
    })
  },

  async paginate(filters: LegislaturaFilters = {}, options: { page?: number; limit?: number } = {}) {
    const page = Math.max(1, options.page ?? 1)
    const limit = Math.min(100, Math.max(1, options.limit ?? 50))
    const skip = (page - 1) * limit
    const where = buildWhereClause(filters)

    const [total, legislaturas] = await Promise.all([
      prisma.legislatura.count({ where }),
      prisma.legislatura.findMany({
        where,
        orderBy: [{ anoInicio: 'desc' }, { numero: 'desc' }],
        skip,
        take: limit
      })
    ])

    const totalPages = Math.max(1, Math.ceil(total / limit))

    return {
      data: legislaturas,
      pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 }
    }
  },

  async getById(id: string) {
    return prisma.legislatura.findUnique({ where: { id } })
  },

  async getAtiva() {
    return prisma.legislatura.findFirst({
      where: { ativa: true },
      orderBy: { anoInicio: 'desc' }
    })
  },

  async checkDuplicateNumero(numero: number, excludeId?: string) {
    const where: any = { numero }
    if (excludeId) where.id = { not: excludeId }
    return prisma.legislatura.findFirst({ where })
  },

  async checkAtivaExiste(excludeId?: string) {
    const where: any = { ativa: true }
    if (excludeId) where.id = { not: excludeId }
    return prisma.legislatura.findFirst({ where })
  },

  async create(payload: LegislaturaPayload) {
    return prisma.legislatura.create({
      data: {
        numero: payload.numero,
        anoInicio: payload.anoInicio,
        anoFim: payload.anoFim,
        dataInicio: payload.dataInicio ? new Date(payload.dataInicio) : null,
        dataFim: payload.dataFim ? new Date(payload.dataFim) : null,
        ativa: payload.ativa ?? false,
        descricao: payload.descricao || null
      }
    })
  },

  async update(id: string, payload: Partial<LegislaturaPayload>) {
    const data: any = {}

    if (payload.numero !== undefined) data.numero = payload.numero
    if (payload.anoInicio !== undefined) data.anoInicio = payload.anoInicio
    if (payload.anoFim !== undefined) data.anoFim = payload.anoFim
    if (payload.dataInicio !== undefined) data.dataInicio = payload.dataInicio ? new Date(payload.dataInicio) : null
    if (payload.dataFim !== undefined) data.dataFim = payload.dataFim ? new Date(payload.dataFim) : null
    if (payload.ativa !== undefined) data.ativa = payload.ativa
    if (payload.descricao !== undefined) data.descricao = payload.descricao || null

    return prisma.legislatura.update({ where: { id }, data })
  },

  async remove(id: string) {
    await prisma.legislatura.delete({ where: { id } })
    return { success: true }
  }
}
