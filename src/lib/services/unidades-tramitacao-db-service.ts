import { prisma } from '@/lib/prisma'

export interface UnidadeTramitacaoFilters {
  ativo?: boolean
  tipo?: string
  search?: string
}

export interface UnidadeTramitacaoPayload {
  nome: string
  sigla?: string | null
  descricao?: string | null
  tipo: string
  ativo?: boolean
}

const buildWhereClause = (filters: UnidadeTramitacaoFilters = {}) => {
  const where: any = {}
  if (filters.ativo !== undefined) where.ativo = filters.ativo
  if (filters.tipo) where.tipo = filters.tipo
  if (filters.search) {
    where.OR = [
      { nome: { contains: filters.search, mode: 'insensitive' } },
      { sigla: { contains: filters.search, mode: 'insensitive' } },
      { descricao: { contains: filters.search, mode: 'insensitive' } }
    ]
  }
  return where
}

export const unidadesTramitacaoDbService = {
  async list(filters: UnidadeTramitacaoFilters = {}) {
    return prisma.tramitacaoUnidade.findMany({
      where: buildWhereClause(filters),
      include: { _count: { select: { tramitacoes: true } } },
      orderBy: [{ tipo: 'asc' }, { nome: 'asc' }]
    })
  },

  async getById(id: string) {
    return prisma.tramitacaoUnidade.findUnique({
      where: { id },
      include: { _count: { select: { tramitacoes: true } } }
    })
  },

  async checkDuplicateName(nome: string, excludeId?: string) {
    const where: any = { nome }
    if (excludeId) where.id = { not: excludeId }
    return prisma.tramitacaoUnidade.findFirst({ where })
  },

  async checkDuplicateSigla(sigla: string, excludeId?: string) {
    const where: any = { sigla }
    if (excludeId) where.id = { not: excludeId }
    return prisma.tramitacaoUnidade.findFirst({ where })
  },

  async create(payload: UnidadeTramitacaoPayload) {
    return prisma.tramitacaoUnidade.create({
      data: {
        nome: payload.nome,
        sigla: payload.sigla,
        descricao: payload.descricao,
        tipo: payload.tipo as any,
        ativo: payload.ativo ?? true
      }
    })
  },

  async update(id: string, payload: Partial<UnidadeTramitacaoPayload>) {
    const data: any = {}
    if (payload.nome !== undefined) data.nome = payload.nome
    if (payload.sigla !== undefined) data.sigla = payload.sigla
    if (payload.descricao !== undefined) data.descricao = payload.descricao
    if (payload.tipo !== undefined) data.tipo = payload.tipo
    if (payload.ativo !== undefined) data.ativo = payload.ativo
    return prisma.tramitacaoUnidade.update({ where: { id }, data })
  },

  async remove(id: string) {
    await prisma.tramitacaoUnidade.delete({ where: { id } })
    return { success: true }
  }
}
