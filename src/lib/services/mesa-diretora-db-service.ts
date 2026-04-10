import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import { parseDateOnlyToUTC } from '@/lib/utils/date'

export interface MesaDiretoraFilters {
  periodoId?: string
  legislaturaId?: string
  ativa?: boolean
  search?: string
}

export interface MembroMesaPayload {
  parlamentarId: string
  cargoId: string
  dataInicio: string
  dataFim?: string
  ativo?: boolean
  observacoes?: string
}

export interface MesaDiretoraPayload {
  periodoId: string
  ativa?: boolean
  descricao?: string | null
  membros: MembroMesaPayload[]
}

const buildWhereClause = (filters: MesaDiretoraFilters = {}) => {
  const where: Prisma.MesaDiretoraWhereInput = {}

  if (filters.periodoId) where.periodoId = filters.periodoId
  if (filters.legislaturaId) where.periodo = { legislaturaId: filters.legislaturaId }
  if (filters.ativa !== undefined) where.ativa = filters.ativa
  if (filters.search) {
    where.OR = [
      { descricao: { contains: filters.search, mode: 'insensitive' } },
      { periodo: { OR: [{ descricao: { contains: filters.search, mode: 'insensitive' } }] } }
    ]
  }

  return where
}

const defaultInclude = {
  periodo: {
    include: { legislatura: true }
  },
  membros: {
    include: {
      parlamentar: {
        select: { id: true, nome: true, apelido: true }
      },
      cargo: true
    },
    orderBy: { cargo: { ordem: 'asc' } }
  }
}

export const mesaDiretoraDbService = {
  async list(filters: MesaDiretoraFilters = {}) {
    return prisma.mesaDiretora.findMany({
      where: buildWhereClause(filters),
      orderBy: [{ ativa: 'desc' }, { periodo: { dataInicio: 'desc' } }],
      include: defaultInclude as any
    })
  },

  async paginate(filters: MesaDiretoraFilters = {}, options: { page?: number; limit?: number } = {}) {
    const page = Math.max(1, options.page ?? 1)
    const limit = Math.min(100, Math.max(1, options.limit ?? 50))
    const skip = (page - 1) * limit
    const where = buildWhereClause(filters)

    const [total, mesas] = await Promise.all([
      prisma.mesaDiretora.count({ where }),
      prisma.mesaDiretora.findMany({
        where,
        orderBy: [{ ativa: 'desc' }, { periodo: { dataInicio: 'desc' } }],
        skip,
        take: limit,
        include: defaultInclude as any
      })
    ])

    const totalPages = Math.max(1, Math.ceil(total / limit))

    return {
      data: mesas,
      pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 }
    }
  },

  async getById(id: string) {
    return prisma.mesaDiretora.findUnique({
      where: { id },
      include: defaultInclude as any
    })
  },

  async checkAtivaExiste(periodoId: string, excludeId?: string) {
    const where: Record<string, unknown> = { periodoId, ativa: true }
    if (excludeId) where.id = { not: excludeId }
    return prisma.mesaDiretora.findFirst({ where })
  },

  async create(payload: MesaDiretoraPayload) {
    return prisma.mesaDiretora.create({
      data: {
        periodoId: payload.periodoId,
        ativa: payload.ativa ?? false,
        descricao: payload.descricao || null,
        membros: {
          create: payload.membros.map(m => ({
            parlamentarId: m.parlamentarId,
            cargoId: m.cargoId,
            dataInicio: parseDateOnlyToUTC(m.dataInicio),
            dataFim: m.dataFim ? parseDateOnlyToUTC(m.dataFim) : null,
            ativo: m.ativo ?? true,
            observacoes: m.observacoes || null
          }))
        }
      },
      include: defaultInclude as any
    })
  },

  async update(id: string, payload: Partial<MesaDiretoraPayload>) {
    const data: any = {}

    if (payload.periodoId !== undefined) data.periodoId = payload.periodoId
    if (payload.ativa !== undefined) data.ativa = payload.ativa
    if (payload.descricao !== undefined) data.descricao = payload.descricao || null

    if (payload.membros) {
      await prisma.membroMesaDiretora.deleteMany({ where: { mesaDiretoraId: id } })
      data.membros = {
        create: payload.membros.map(m => ({
          parlamentarId: m.parlamentarId,
          cargoId: m.cargoId,
          dataInicio: parseDateOnlyToUTC(m.dataInicio),
          dataFim: m.dataFim ? parseDateOnlyToUTC(m.dataFim) : null,
          ativo: m.ativo ?? true,
          observacoes: m.observacoes || null
        }))
      }
    }

    return prisma.mesaDiretora.update({
      where: { id },
      data,
      include: defaultInclude as any
    })
  },

  async remove(id: string) {
    await prisma.mesaDiretora.update({
      where: { id },
      data: { ativa: false }
    })
    return { success: true }
  },

  async getByIdDetailed(id: string) {
    return prisma.mesaDiretora.findUnique({
      where: { id },
      include: {
        periodo: {
          include: {
            legislatura: true,
            cargos: true
          }
        },
        membros: {
          include: {
            parlamentar: {
              select: {
                id: true,
                nome: true,
                apelido: true,
                email: true,
                telefone: true
              }
            },
            cargo: true
          },
          orderBy: { cargo: { ordem: 'asc' } }
        }
      } as any
    })
  },

  async getByIdWithPeriodoCargos(id: string) {
    return prisma.mesaDiretora.findUnique({
      where: { id },
      include: {
        periodo: {
          include: { cargos: true }
        }
      }
    })
  },

  async periodoExistsWithCargos(id: string) {
    return prisma.periodoLegislatura.findUnique({
      where: { id },
      include: { cargos: true }
    })
  },

  async deleteMembros(mesaDiretoraId: string) {
    await prisma.membroMesaDiretora.deleteMany({
      where: { mesaDiretoraId }
    })
  }
}
