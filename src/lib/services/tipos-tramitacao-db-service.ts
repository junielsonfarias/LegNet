import { prisma } from '@/lib/prisma'

export interface TipoTramitacaoFilters {
  ativo?: boolean
  search?: string
}

export interface TipoTramitacaoPayload {
  nome: string
  descricao?: string | null
  prazoRegimental?: number
  prazoLegal?: number | null
  ativo?: boolean
  ordem?: number
  unidadeResponsavelId?: string | null
}

const defaultInclude = {
  unidadeResponsavel: {
    select: { id: true, nome: true, sigla: true }
  }
}

const buildWhereClause = (filters: TipoTramitacaoFilters = {}) => {
  const where: any = {}
  if (filters.ativo !== undefined) where.ativo = filters.ativo
  if (filters.search) {
    where.OR = [
      { nome: { contains: filters.search, mode: 'insensitive' } },
      { descricao: { contains: filters.search, mode: 'insensitive' } }
    ]
  }
  return where
}

export const tiposTramitacaoDbService = {
  async list(filters: TipoTramitacaoFilters = {}) {
    return prisma.tramitacaoTipo.findMany({
      where: buildWhereClause(filters),
      include: defaultInclude,
      orderBy: [{ ordem: 'asc' }, { nome: 'asc' }]
    })
  },

  async getById(id: string) {
    return prisma.tramitacaoTipo.findUnique({ where: { id }, include: defaultInclude })
  },

  async checkDuplicateName(nome: string, excludeId?: string) {
    const where: any = { nome }
    if (excludeId) where.id = { not: excludeId }
    return prisma.tramitacaoTipo.findFirst({ where })
  },

  async getNextOrder() {
    const ultimo = await prisma.tramitacaoTipo.findFirst({ orderBy: { ordem: 'desc' } })
    return (ultimo?.ordem ?? 0) + 1
  },

  async create(payload: TipoTramitacaoPayload) {
    return prisma.tramitacaoTipo.create({
      data: {
        nome: payload.nome,
        descricao: payload.descricao,
        prazoRegimental: payload.prazoRegimental ?? 15,
        prazoLegal: payload.prazoLegal,
        ativo: payload.ativo ?? true,
        ordem: payload.ordem ?? 0,
        unidadeResponsavelId: payload.unidadeResponsavelId
      },
      include: defaultInclude
    })
  },

  async update(id: string, payload: Partial<TipoTramitacaoPayload>) {
    const data: any = {}
    if (payload.nome !== undefined) data.nome = payload.nome
    if (payload.descricao !== undefined) data.descricao = payload.descricao
    if (payload.prazoRegimental !== undefined) data.prazoRegimental = payload.prazoRegimental
    if (payload.prazoLegal !== undefined) data.prazoLegal = payload.prazoLegal
    if (payload.ativo !== undefined) data.ativo = payload.ativo
    if (payload.ordem !== undefined) data.ordem = payload.ordem
    if (payload.unidadeResponsavelId !== undefined) data.unidadeResponsavelId = payload.unidadeResponsavelId
    return prisma.tramitacaoTipo.update({ where: { id }, data, include: defaultInclude })
  },

  async remove(id: string) {
    await prisma.tramitacaoTipo.delete({ where: { id } })
    return { success: true }
  }
}
