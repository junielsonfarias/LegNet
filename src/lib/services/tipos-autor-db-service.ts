import { prisma } from '@/lib/prisma'

export interface TipoAutorFilters {
  ativo?: boolean
}

export interface TipoAutorPayload {
  nome: string
  descricao?: string | null
  ativo?: boolean
  ordem?: number
}

export const tiposAutorDbService = {
  async list(filters: TipoAutorFilters = {}) {
    const where: any = {}
    if (filters.ativo !== undefined) where.ativo = filters.ativo

    return prisma.tipoAutor.findMany({
      where,
      orderBy: [{ ordem: 'asc' }, { nome: 'asc' }],
      include: { _count: { select: { autores: true } } }
    })
  },

  async getById(id: string) {
    return prisma.tipoAutor.findUnique({
      where: { id },
      include: { _count: { select: { autores: true } } }
    })
  },

  async checkDuplicateName(nome: string, excludeId?: string) {
    const where: any = { nome }
    if (excludeId) where.id = { not: excludeId }
    return prisma.tipoAutor.findFirst({ where })
  },

  async create(payload: TipoAutorPayload) {
    return prisma.tipoAutor.create({ data: payload })
  },

  async update(id: string, payload: Partial<TipoAutorPayload>) {
    const data: any = {}
    if (payload.nome !== undefined) data.nome = payload.nome
    if (payload.descricao !== undefined) data.descricao = payload.descricao || null
    if (payload.ativo !== undefined) data.ativo = payload.ativo
    if (payload.ordem !== undefined) data.ordem = payload.ordem
    return prisma.tipoAutor.update({ where: { id }, data })
  },

  async remove(id: string) {
    const count = await prisma.autor.count({ where: { tipoAutorId: id } })
    if (count > 0) {
      throw new Error(`Tipo de autor possui ${count} autores vinculados`)
    }
    await prisma.tipoAutor.delete({ where: { id } })
    return { success: true }
  }
}
