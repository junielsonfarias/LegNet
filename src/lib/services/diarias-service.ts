import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'

export interface DiariaFilters {
  ano?: number
  mes?: number
  parlamentarId?: string
  servidorId?: string
}

const buildWhereClause = (filters: DiariaFilters = {}) => {
  const where: Record<string, unknown> = {}

  if (filters.ano) where.ano = filters.ano
  if (filters.mes) where.mes = filters.mes
  if (filters.parlamentarId) where.parlamentarId = filters.parlamentarId
  if (filters.servidorId) where.servidorId = filters.servidorId

  return where
}

export const diariasService = {
  async list(filters: DiariaFilters = {}) {
    return prisma.diaria.findMany({
      where: buildWhereClause(filters),
      orderBy: [{ dataInicio: 'desc' }, { createdAt: 'desc' }],
    })
  },

  async paginate(filters: DiariaFilters = {}, options: { page?: number; limit?: number } = {}) {
    const page = Math.max(1, options.page ?? 1)
    const limit = Math.min(100, Math.max(1, options.limit ?? 10))
    const skip = (page - 1) * limit
    const where = buildWhereClause(filters)

    const [total, data] = await Promise.all([
      prisma.diaria.count({ where }),
      prisma.diaria.findMany({
        where,
        orderBy: [{ dataInicio: 'desc' }, { createdAt: 'desc' }],
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
    return prisma.diaria.findUnique({ where: { id } })
  },

  async create(data: {
    servidorId?: string
    parlamentarId?: string
    nome: string
    cargo: string
    destino: string
    motivo: string
    dataInicio: Date | string
    dataFim: Date | string
    quantidade: number
    valorUnitario: number
    comprovante?: string
    ano: number
    mes: number
  }) {
    const valorTotal = data.quantidade * data.valorUnitario

    return prisma.diaria.create({
      data: {
        servidorId: data.servidorId ?? null,
        parlamentarId: data.parlamentarId ?? null,
        nome: data.nome,
        cargo: data.cargo,
        destino: data.destino,
        motivo: data.motivo,
        dataInicio: new Date(data.dataInicio),
        dataFim: new Date(data.dataFim),
        quantidade: data.quantidade,
        valorUnitario: new Decimal(data.valorUnitario),
        valorTotal: new Decimal(valorTotal),
        comprovante: data.comprovante ?? null,
        ano: data.ano,
        mes: data.mes,
      },
    })
  },

  async update(id: string, data: Partial<{
    servidorId: string | null
    parlamentarId: string | null
    nome: string
    cargo: string
    destino: string
    motivo: string
    dataInicio: Date | string
    dataFim: Date | string
    quantidade: number
    valorUnitario: number
    comprovante: string | null
    ano: number
    mes: number
  }>) {
    const updateData: Record<string, unknown> = { ...data }

    if (data.dataInicio) updateData.dataInicio = new Date(data.dataInicio)
    if (data.dataFim) updateData.dataFim = new Date(data.dataFim)
    if (data.valorUnitario !== undefined) updateData.valorUnitario = new Decimal(data.valorUnitario)

    if (data.quantidade !== undefined || data.valorUnitario !== undefined) {
      const current = await prisma.diaria.findUniqueOrThrow({ where: { id } })
      const quantidade = data.quantidade ?? current.quantidade
      const valorUnitario = data.valorUnitario ?? Number(current.valorUnitario)
      updateData.valorTotal = new Decimal(quantidade * valorUnitario)
    }

    return prisma.diaria.update({ where: { id }, data: updateData })
  },

  async delete(id: string) {
    await prisma.diaria.delete({ where: { id } })
    return { success: true }
  },

  async estatisticas(ano: number) {
    const where = { ano }

    const [porMes, porPessoa] = await Promise.all([
      prisma.diaria.groupBy({
        by: ['mes'],
        where,
        _sum: { valorTotal: true },
        _count: { _all: true },
        orderBy: { mes: 'asc' },
      }),
      prisma.diaria.groupBy({
        by: ['nome'],
        where,
        _sum: { valorTotal: true },
        _count: { _all: true },
        orderBy: { _sum: { valorTotal: 'desc' } },
      }),
    ])

    return {
      porMes: porMes.map((m) => ({
        mes: m.mes,
        total: m._sum.valorTotal ?? new Decimal(0),
        quantidade: m._count._all,
      })),
      porPessoa: porPessoa.map((p) => ({
        nome: p.nome,
        total: p._sum.valorTotal ?? new Decimal(0),
        quantidade: p._count._all,
      })),
    }
  },
}
