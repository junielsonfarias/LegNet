import { prisma } from '@/lib/prisma'
import type { CargoParlamentar } from '@prisma/client'

export interface ParlamentarFilters {
  ativo?: boolean
  cargo?: string
  partido?: string
  search?: string
}

export interface MandatoPayload {
  legislaturaId: string
  numeroVotos: number
  cargo: string
  dataInicio: string
  dataFim?: string
}

export interface FiliacaoPayload {
  partido: string
  dataInicio: string
  dataFim?: string
}

export interface ParlamentarPayload {
  nome: string
  apelido: string
  cargo: string
  partido?: string | null
  legislatura: string
  email?: string | null
  telefone?: string | null
  biografia?: string | null
  ativo?: boolean
  mandatos?: MandatoPayload[]
  filiacoes?: FiliacaoPayload[]
}

const buildWhereClause = (filters: ParlamentarFilters = {}) => {
  const where: any = {}

  if (filters.ativo !== undefined) where.ativo = filters.ativo
  if (filters.cargo) where.cargo = filters.cargo
  if (filters.partido) where.partido = { contains: filters.partido, mode: 'insensitive' }

  if (filters.search) {
    where.OR = [
      { nome: { contains: filters.search, mode: 'insensitive' } },
      { apelido: { contains: filters.search, mode: 'insensitive' } },
      { partido: { contains: filters.search, mode: 'insensitive' } }
    ]
  }

  return where
}

const defaultInclude = {
  mandatos: {
    include: { legislatura: true },
    orderBy: { dataInicio: 'desc' as const }
  },
  filiacoes: {
    orderBy: { dataInicio: 'desc' as const }
  }
}

export const parlamentarDbService = {
  async list(filters: ParlamentarFilters = {}) {
    return prisma.parlamentar.findMany({
      where: buildWhereClause(filters),
      orderBy: [{ cargo: 'asc' }, { nome: 'asc' }],
      include: defaultInclude
    })
  },

  async paginate(filters: ParlamentarFilters = {}, options: { page?: number; limit?: number } = {}) {
    const page = Math.max(1, options.page ?? 1)
    const limit = Math.min(100, Math.max(1, options.limit ?? 50))
    const skip = (page - 1) * limit
    const where = buildWhereClause(filters)

    const [total, parlamentares] = await Promise.all([
      prisma.parlamentar.count({ where }),
      prisma.parlamentar.findMany({
        where,
        orderBy: [{ cargo: 'asc' }, { nome: 'asc' }],
        skip,
        take: limit,
        include: {
          mandatos: {
            include: { legislatura: true },
            orderBy: { dataInicio: 'desc' as const }
          },
          filiacoes: {
            where: { ativa: true },
            orderBy: { dataInicio: 'desc' as const },
            take: 1
          }
        } as any
      })
    ])

    // Ordenar: parlamentares da legislatura atual primeiro
    const legislaturaAtual = await prisma.legislatura.findFirst({
      where: { ativa: true },
      orderBy: { anoInicio: 'desc' }
    })

    if (legislaturaAtual) {
      parlamentares.sort((a: any, b: any) => {
        const aAtual = a.mandatos?.some((m: any) => m.legislaturaId === legislaturaAtual.id && m.ativo) || false
        const bAtual = b.mandatos?.some((m: any) => m.legislaturaId === legislaturaAtual.id && m.ativo) || false
        if (aAtual && !bAtual) return -1
        if (!aAtual && bAtual) return 1
        return 0
      })
    }

    const totalPages = Math.max(1, Math.ceil(total / limit))

    return {
      data: parlamentares,
      pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 }
    }
  },

  async getById(id: string) {
    return prisma.parlamentar.findUnique({
      where: { id },
      include: {
        mandatos: {
          include: { legislatura: true },
          orderBy: { dataInicio: 'desc' as const }
        },
        filiacoes: {
          orderBy: { dataInicio: 'desc' as const }
        }
      }
    })
  },

  async checkDuplicate(nome: string, apelido: string, excludeId?: string) {
    const where: any = {
      OR: [{ nome }, { apelido }]
    }
    if (excludeId) {
      where.AND = [{ id: { not: excludeId } }]
    }
    return prisma.parlamentar.findFirst({ where })
  },

  async create(payload: ParlamentarPayload) {
    return prisma.parlamentar.create({
      data: {
        nome: payload.nome,
        apelido: payload.apelido,
        cargo: payload.cargo as CargoParlamentar,
        partido: payload.partido || null,
        legislatura: payload.legislatura,
        email: payload.email || null,
        telefone: payload.telefone || null,
        biografia: payload.biografia || null,
        ativo: payload.ativo ?? true,
        mandatos: payload.mandatos ? {
          create: payload.mandatos.map(m => ({
            legislaturaId: m.legislaturaId,
            numeroVotos: m.numeroVotos,
            cargo: m.cargo as CargoParlamentar,
            dataInicio: new Date(m.dataInicio),
            dataFim: m.dataFim ? new Date(m.dataFim) : null,
            ativo: true
          }))
        } : undefined,
        filiacoes: payload.filiacoes ? {
          create: payload.filiacoes.map(f => ({
            partido: f.partido,
            dataInicio: new Date(f.dataInicio),
            dataFim: f.dataFim ? new Date(f.dataFim) : null,
            ativa: true
          }))
        } : undefined
      } as any,
      include: {
        mandatos: { include: { legislatura: true } },
        filiacoes: true
      } as any
    })
  },

  async update(id: string, payload: Partial<ParlamentarPayload>) {
    const updateData: any = {}

    if (payload.nome !== undefined) updateData.nome = payload.nome
    if (payload.apelido !== undefined) updateData.apelido = payload.apelido
    if (payload.cargo !== undefined) updateData.cargo = payload.cargo
    if (payload.partido !== undefined) updateData.partido = payload.partido || null
    if (payload.legislatura !== undefined) updateData.legislatura = payload.legislatura
    if (payload.email !== undefined) updateData.email = payload.email || null
    if (payload.telefone !== undefined) updateData.telefone = payload.telefone || null
    if (payload.biografia !== undefined) updateData.biografia = payload.biografia || null
    if (payload.ativo !== undefined) updateData.ativo = payload.ativo

    // Substituir mandatos se fornecidos
    if (payload.mandatos) {
      await prisma.mandato.deleteMany({ where: { parlamentarId: id } })
      updateData.mandatos = {
        create: payload.mandatos.map(m => ({
          legislaturaId: m.legislaturaId,
          numeroVotos: m.numeroVotos,
          cargo: m.cargo,
          dataInicio: new Date(m.dataInicio),
          dataFim: m.dataFim ? new Date(m.dataFim) : null,
          ativo: true
        }))
      }
    }

    // Substituir filiações se fornecidas
    if (payload.filiacoes) {
      await prisma.filiacao.deleteMany({ where: { parlamentarId: id } })
      updateData.filiacoes = {
        create: payload.filiacoes.map(f => ({
          partido: f.partido,
          dataInicio: new Date(f.dataInicio),
          dataFim: f.dataFim ? new Date(f.dataFim) : null,
          ativa: true
        }))
      }
    }

    return prisma.parlamentar.update({
      where: { id },
      data: updateData,
      include: {
        mandatos: { include: { legislatura: true } },
        filiacoes: true
      }
    })
  },

  async remove(id: string) {
    await prisma.parlamentar.update({
      where: { id },
      data: { ativo: false }
    })
    return { success: true }
  },

  async getStats() {
    const [total, ativos, porCargo, porPartido] = await Promise.all([
      prisma.parlamentar.count(),
      prisma.parlamentar.count({ where: { ativo: true } }),
      prisma.parlamentar.groupBy({ by: ['cargo'], _count: { _all: true } }),
      prisma.parlamentar.groupBy({ by: ['partido'], _count: { _all: true }, where: { ativo: true } })
    ])

    return {
      total,
      ativos,
      porCargo: porCargo.reduce((acc, item) => {
        acc[item.cargo] = item._count._all
        return acc
      }, {} as Record<string, number>),
      porPartido: porPartido.reduce((acc, item) => {
        if (item.partido) acc[item.partido] = item._count._all
        return acc
      }, {} as Record<string, number>)
    }
  }
}
