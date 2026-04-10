import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'

export interface VerbaFilters {
  ano?: number
  mes?: number
  parlamentarId?: string
  tipo?: string
}

const buildWhereClause = (filters: VerbaFilters = {}) => {
  const where: Record<string, unknown> = {}

  if (filters.ano) where.ano = filters.ano
  if (filters.mes) where.mes = filters.mes
  if (filters.parlamentarId) where.parlamentarId = filters.parlamentarId
  if (filters.tipo) where.tipo = filters.tipo

  return where
}

export const verbasIndenizatoriasService = {
  async list(filters: VerbaFilters = {}) {
    return prisma.verbaIndenizatoria.findMany({
      where: buildWhereClause(filters),
      orderBy: [{ ano: 'desc' }, { mes: 'desc' }, { createdAt: 'desc' }],
    })
  },

  async paginate(filters: VerbaFilters = {}, options: { page?: number; limit?: number } = {}) {
    const page = Math.max(1, options.page ?? 1)
    const limit = Math.min(100, Math.max(1, options.limit ?? 10))
    const skip = (page - 1) * limit
    const where = buildWhereClause(filters)

    const [total, data] = await Promise.all([
      prisma.verbaIndenizatoria.count({ where }),
      prisma.verbaIndenizatoria.findMany({
        where,
        orderBy: [{ ano: 'desc' }, { mes: 'desc' }, { createdAt: 'desc' }],
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
    return prisma.verbaIndenizatoria.findUnique({ where: { id } })
  },

  async create(data: {
    parlamentarId: string
    nomeParlamentar?: string
    descricao: string
    tipo: string
    valor: number
    mes: number
    ano: number
    comprovante?: string
  }) {
    return prisma.verbaIndenizatoria.create({
      data: {
        parlamentarId: data.parlamentarId,
        nomeParlamentar: data.nomeParlamentar ?? null,
        descricao: data.descricao,
        tipo: data.tipo,
        valor: new Decimal(data.valor),
        mes: data.mes,
        ano: data.ano,
        comprovante: data.comprovante ?? null,
      },
    })
  },

  async update(id: string, data: Partial<{
    parlamentarId: string
    nomeParlamentar: string | null
    descricao: string
    tipo: string
    valor: number
    mes: number
    ano: number
    comprovante: string | null
  }>) {
    const updateData: Record<string, unknown> = { ...data }
    if (data.valor !== undefined) updateData.valor = new Decimal(data.valor)

    return prisma.verbaIndenizatoria.update({ where: { id }, data: updateData })
  },

  async delete(id: string) {
    await prisma.verbaIndenizatoria.delete({ where: { id } })
    return { success: true }
  },

  async estatisticas(ano: number) {
    const where = { ano }

    const [porMes, porParlamentar, porTipo] = await Promise.all([
      prisma.verbaIndenizatoria.groupBy({
        by: ['mes'],
        where,
        _sum: { valor: true },
        _count: { _all: true },
        orderBy: { mes: 'asc' },
      }),
      prisma.verbaIndenizatoria.groupBy({
        by: ['parlamentarId', 'nomeParlamentar'],
        where,
        _sum: { valor: true },
        _count: { _all: true },
        orderBy: { _sum: { valor: 'desc' } },
      }),
      prisma.verbaIndenizatoria.groupBy({
        by: ['tipo'],
        where,
        _sum: { valor: true },
        _count: { _all: true },
        orderBy: { _sum: { valor: 'desc' } },
      }),
    ])

    return {
      porMes: porMes.map((m) => ({
        mes: m.mes,
        total: m._sum.valor ?? new Decimal(0),
        quantidade: m._count._all,
      })),
      porParlamentar: porParlamentar.map((p) => ({
        parlamentarId: p.parlamentarId,
        nome: p.nomeParlamentar,
        total: p._sum.valor ?? new Decimal(0),
        quantidade: p._count._all,
      })),
      porTipo: porTipo.map((t) => ({
        tipo: t.tipo,
        total: t._sum.valor ?? new Decimal(0),
        quantidade: t._count._all,
      })),
    }
  },

  async getByParlamentar(parlamentarId: string, ano: number) {
    return prisma.verbaIndenizatoria.findMany({
      where: { parlamentarId, ano },
      orderBy: [{ mes: 'asc' }, { createdAt: 'asc' }],
    })
  },
}
