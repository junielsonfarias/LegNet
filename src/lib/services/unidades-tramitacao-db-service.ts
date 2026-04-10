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
  const where: Record<string, unknown> = {}
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

  async getByIdWithFullCount(id: string) {
    return prisma.tramitacaoUnidade.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            tramitacoes: true,
            tiposResponsaveis: true
          }
        }
      }
    })
  },

  async checkDuplicateName(nome: string, excludeId?: string) {
    const where: Record<string, unknown> = { nome }
    if (excludeId) where.id = { not: excludeId }
    return prisma.tramitacaoUnidade.findFirst({ where })
  },

  async checkDuplicateSigla(sigla: string, excludeId?: string) {
    const where: Record<string, unknown> = { sigla }
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
  },

  // --- Admin route helpers ---

  async listAdmin(filters: { ativo?: boolean; tipo?: string } = {}) {
    const where: Record<string, unknown> = {}
    if (filters.ativo !== undefined) where.ativo = filters.ativo
    if (filters.tipo) where.tipo = filters.tipo

    return prisma.tramitacaoUnidade.findMany({
      where,
      orderBy: [
        { tipo: 'asc' },
        { ordem: 'asc' },
        { nome: 'asc' }
      ]
    })
  },

  async createAdmin(data: {
    nome: string
    sigla?: string | null
    descricao?: string | null
    tipo: string
    ativo?: boolean
    ordem?: number
  }) {
    return prisma.tramitacaoUnidade.create({
      data: {
        nome: data.nome,
        sigla: data.sigla || null,
        descricao: data.descricao || null,
        tipo: data.tipo as any,
        ativo: data.ativo ?? true,
        ordem: data.ordem ?? 0
      }
    })
  },

  async updateAdmin(id: string, data: {
    nome?: string
    sigla?: string | null
    descricao?: string | null
    tipo?: string
    ativo?: boolean
    ordem?: number
  }) {
    return prisma.tramitacaoUnidade.update({
      where: { id },
      data: {
        ...(data.nome !== undefined && { nome: data.nome }),
        ...(data.sigla !== undefined && { sigla: data.sigla }),
        ...(data.descricao !== undefined && { descricao: data.descricao }),
        ...(data.tipo !== undefined && { tipo: data.tipo as any }),
        ...(data.ativo !== undefined && { ativo: data.ativo }),
        ...(data.ordem !== undefined && { ordem: data.ordem })
      }
    })
  },

  async countTramitacoesByUnidade(unidadeId: string) {
    return prisma.tramitacao.count({
      where: { unidadeId }
    })
  },

  async countFluxoEtapasByUnidade(unidadeId: string) {
    return prisma.fluxoTramitacaoEtapa.count({
      where: { unidadeId }
    })
  }
}
