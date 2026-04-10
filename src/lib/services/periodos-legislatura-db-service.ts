import { prisma } from '@/lib/prisma'

export interface PeriodoLegislaturaFilters {
  legislaturaId?: string
}

export interface PeriodoLegislaturaPayload {
  legislaturaId: string
  numero: number
  dataInicio: Date
  dataFim?: Date | null
  descricao?: string | null
}

const defaultInclude = {
  legislatura: true,
  cargos: { orderBy: { ordem: 'asc' as const } }
}

export const periodosLegislaturaDbService = {
  async list(filters: PeriodoLegislaturaFilters = {}) {
    const where: Record<string, unknown> = {}
    if (filters.legislaturaId) where.legislaturaId = filters.legislaturaId

    return prisma.periodoLegislatura.findMany({
      where,
      include: defaultInclude,
      orderBy: [{ numero: 'asc' }]
    })
  },

  async getById(id: string) {
    return prisma.periodoLegislatura.findUnique({
      where: { id },
      include: defaultInclude
    })
  },

  async checkDuplicateNumero(legislaturaId: string, numero: number, excludeId?: string) {
    if (excludeId) {
      return prisma.periodoLegislatura.findFirst({
        where: { legislaturaId, numero, id: { not: excludeId } }
      })
    }
    return prisma.periodoLegislatura.findUnique({
      where: { legislaturaId_numero: { legislaturaId, numero } }
    })
  },

  async checkOverlap(legislaturaId: string, dataInicio: Date, dataFim: Date | null, excludeId?: string) {
    const where: Record<string, unknown> = {
      legislaturaId,
      AND: [
        { dataInicio: { lte: dataFim ?? dataInicio } },
        { OR: [{ dataFim: null }, { dataFim: { gte: dataInicio } }] }
      ]
    }
    if (excludeId) where.id = { not: excludeId }
    return prisma.periodoLegislatura.findFirst({ where })
  },

  async create(payload: PeriodoLegislaturaPayload) {
    return prisma.periodoLegislatura.create({
      data: {
        legislaturaId: payload.legislaturaId,
        numero: payload.numero,
        dataInicio: payload.dataInicio,
        dataFim: payload.dataFim ?? null,
        descricao: payload.descricao || null
      },
      include: defaultInclude
    })
  },

  async update(id: string, payload: Partial<PeriodoLegislaturaPayload>) {
    const data: Record<string, unknown> = {}
    if (payload.legislaturaId !== undefined) data.legislaturaId = payload.legislaturaId
    if (payload.numero !== undefined) data.numero = payload.numero
    if (payload.dataInicio !== undefined) data.dataInicio = payload.dataInicio
    if (payload.dataFim !== undefined) data.dataFim = payload.dataFim
    if (payload.descricao !== undefined) data.descricao = payload.descricao || null
    return prisma.periodoLegislatura.update({ where: { id }, data, include: defaultInclude })
  },

  async remove(id: string) {
    await prisma.periodoLegislatura.delete({ where: { id } })
    return { success: true }
  },

  async removeWithCargos(id: string) {
    await prisma.cargoMesaDiretora.deleteMany({ where: { periodoId: id } })
    await prisma.periodoLegislatura.delete({ where: { id } })
    return { success: true }
  },

  async legislaturaExists(id: string) {
    return prisma.legislatura.findUnique({ where: { id } })
  }
}
