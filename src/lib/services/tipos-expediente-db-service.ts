import { prisma } from '@/lib/prisma'

export interface TipoExpedienteFilters {
  ativo?: boolean
}

export interface TipoExpedientePayload {
  nome: string
  descricao?: string | null
  ordem?: number
  tempoMaximo?: number | null
  ativo?: boolean
}

export const tiposExpedienteDbService = {
  async list(filters: TipoExpedienteFilters = {}) {
    const where: any = {}
    if (filters.ativo !== undefined) where.ativo = filters.ativo

    return prisma.tipoExpediente.findMany({
      where,
      orderBy: { ordem: 'asc' }
    })
  },

  async getById(id: string) {
    return prisma.tipoExpediente.findUnique({ where: { id } })
  },

  async checkDuplicateName(nome: string, excludeId?: string) {
    const where: any = { nome: { equals: nome, mode: 'insensitive' } }
    if (excludeId) where.id = { not: excludeId }
    return prisma.tipoExpediente.findFirst({ where })
  },

  async getNextOrder() {
    const last = await prisma.tipoExpediente.findFirst({ orderBy: { ordem: 'desc' } })
    return (last?.ordem || 0) + 1
  },

  async create(payload: TipoExpedientePayload) {
    return prisma.tipoExpediente.create({
      data: {
        nome: payload.nome,
        descricao: payload.descricao || null,
        ordem: payload.ordem ?? 0,
        tempoMaximo: payload.tempoMaximo ?? null,
        ativo: payload.ativo ?? true
      }
    })
  },

  async update(id: string, payload: Partial<TipoExpedientePayload>) {
    const data: any = {}
    if (payload.nome !== undefined) data.nome = payload.nome
    if (payload.descricao !== undefined) data.descricao = payload.descricao || null
    if (payload.ordem !== undefined) data.ordem = payload.ordem
    if (payload.tempoMaximo !== undefined) data.tempoMaximo = payload.tempoMaximo
    if (payload.ativo !== undefined) data.ativo = payload.ativo
    return prisma.tipoExpediente.update({ where: { id }, data })
  },

  async remove(id: string) {
    await prisma.tipoExpediente.delete({ where: { id } })
    return { success: true }
  }
}
