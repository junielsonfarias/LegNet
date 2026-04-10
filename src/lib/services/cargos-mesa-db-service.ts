import { prisma } from '@/lib/prisma'

export interface CargosMesaFilters {
  periodoId?: string
}

export interface CargoMesaPayload {
  periodoId: string
  nome: string
  ordem: number
  obrigatorio?: boolean
}

const defaultInclude = {
  periodo: { include: { legislatura: true } }
}

export const cargosMesaDbService = {
  async list(filters: CargosMesaFilters = {}) {
    const where: Record<string, unknown> = {}
    if (filters.periodoId) where.periodoId = filters.periodoId

    return prisma.cargoMesaDiretora.findMany({
      where,
      include: defaultInclude,
      orderBy: { ordem: 'asc' }
    })
  },

  async getById(id: string) {
    return prisma.cargoMesaDiretora.findUnique({
      where: { id },
      include: defaultInclude
    })
  },

  async checkDuplicate(periodoId: string, nome: string, excludeId?: string) {
    if (excludeId) {
      return prisma.cargoMesaDiretora.findFirst({
        where: { periodoId, nome, id: { not: excludeId } }
      })
    }
    return prisma.cargoMesaDiretora.findUnique({
      where: { periodoId_nome: { periodoId, nome } }
    })
  },

  async create(payload: CargoMesaPayload) {
    return prisma.cargoMesaDiretora.create({
      data: {
        periodoId: payload.periodoId,
        nome: payload.nome,
        ordem: payload.ordem,
        obrigatorio: payload.obrigatorio ?? true
      },
      include: defaultInclude
    })
  },

  async update(id: string, payload: Partial<CargoMesaPayload>) {
    const data: Record<string, unknown> = {}
    if (payload.nome !== undefined) data.nome = payload.nome
    if (payload.ordem !== undefined) data.ordem = payload.ordem
    if (payload.obrigatorio !== undefined) data.obrigatorio = payload.obrigatorio
    return prisma.cargoMesaDiretora.update({ where: { id }, data, include: defaultInclude })
  },

  async remove(id: string) {
    await prisma.cargoMesaDiretora.delete({ where: { id } })
    return { success: true }
  },

  async removeWithMembros(id: string) {
    await prisma.membroMesaDiretora.deleteMany({ where: { cargoId: id } })
    await prisma.cargoMesaDiretora.delete({ where: { id } })
    return { success: true }
  },

  async periodoExists(id: string) {
    return prisma.periodoLegislatura.findUnique({ where: { id } })
  }
}
