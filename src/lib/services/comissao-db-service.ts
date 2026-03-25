import { prisma } from '@/lib/prisma'
import type { TipoComissao } from '@prisma/client'

export interface ComissaoFilters {
  tipo?: string
  ativa?: boolean
  search?: string
}

export interface ComissaoPayload {
  nome: string
  descricao?: string | null
  tipo: string
  ativa?: boolean
}

const buildWhereClause = (filters: ComissaoFilters = {}) => {
  const where: any = {}

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
    const where: any = {
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
        descricao: payload.descricao || null,
        tipo: payload.tipo as TipoComissao,
        ativa: payload.ativa ?? true
      },
      include: defaultInclude
    })
  },

  async update(id: string, payload: Partial<ComissaoPayload>) {
    const data: any = {}

    if (payload.nome !== undefined) data.nome = payload.nome
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
  }
}
