import { prisma } from '@/lib/prisma'
import type { TipoBem, SituacaoBem } from '@prisma/client'

export interface BemPatrimonialPayload {
  tipo: TipoBem
  tombamento?: string | null
  descricao: string
  especificacao?: string | null
  dataAquisicao?: Date | string | null
  valorAquisicao?: number | null
  valorAtual?: number | null
  localizacao?: string | null
  responsavel?: string | null
  situacao?: SituacaoBem
  matriculaImovel?: string | null
  enderecoImovel?: string | null
  areaImovel?: number | null
  observacoes?: string | null
}

export interface BemPatrimonialFilters {
  tipo?: TipoBem
  situacao?: SituacaoBem
  descricao?: string
  localizacao?: string
  responsavel?: string
  valorMinimo?: number
  valorMaximo?: number
}

const buildWhereClause = (filters: BemPatrimonialFilters = {}) => {
  const where: any = {}

  if (filters.tipo) where.tipo = filters.tipo
  if (filters.situacao) where.situacao = filters.situacao
  if (filters.descricao) where.descricao = { contains: filters.descricao, mode: 'insensitive' }
  if (filters.localizacao) where.localizacao = { contains: filters.localizacao, mode: 'insensitive' }
  if (filters.responsavel) where.responsavel = { contains: filters.responsavel, mode: 'insensitive' }

  if (filters.valorMinimo !== undefined || filters.valorMaximo !== undefined) {
    where.valorAtual = {}
    if (filters.valorMinimo !== undefined) where.valorAtual.gte = filters.valorMinimo
    if (filters.valorMaximo !== undefined) where.valorAtual.lte = filters.valorMaximo
  }

  return where
}

export const bensPatrimoniaisDbService = {
  async list(filters: BemPatrimonialFilters = {}) {
    return prisma.bemPatrimonial.findMany({
      where: buildWhereClause(filters),
      orderBy: [{ descricao: 'asc' }]
    })
  },

  async paginate(filters: BemPatrimonialFilters = {}, options: { page?: number; limit?: number } = {}) {
    const page = Math.max(1, options.page ?? 1)
    const limit = Math.min(100, Math.max(1, options.limit ?? 10))
    const skip = (page - 1) * limit
    const where = buildWhereClause(filters)

    const [total, registros] = await Promise.all([
      prisma.bemPatrimonial.count({ where }),
      prisma.bemPatrimonial.findMany({
        where,
        orderBy: [{ descricao: 'asc' }],
        skip,
        take: limit
      })
    ])

    const totalPages = Math.max(1, Math.ceil(total / limit))

    return {
      data: registros,
      pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 }
    }
  },

  async getById(id: string) {
    return prisma.bemPatrimonial.findUnique({ where: { id } })
  },

  async create(payload: BemPatrimonialPayload) {
    // Gera tombamento automatico se nao fornecido
    const tombamento = payload.tombamento || await this.generateTombamento()

    return prisma.bemPatrimonial.create({
      data: {
        tipo: payload.tipo,
        tombamento,
        descricao: payload.descricao.trim(),
        especificacao: payload.especificacao ?? null,
        dataAquisicao: payload.dataAquisicao ? new Date(payload.dataAquisicao) : new Date(),
        valorAquisicao: payload.valorAquisicao ?? 0,
        valorAtual: payload.valorAtual ?? null,
        localizacao: payload.localizacao ?? null,
        responsavel: payload.responsavel ?? null,
        situacao: payload.situacao ?? 'EM_USO',
        matriculaImovel: payload.matriculaImovel ?? null,
        enderecoImovel: payload.enderecoImovel ?? null,
        areaImovel: payload.areaImovel ?? null,
        observacoes: payload.observacoes ?? null
      }
    })
  },

  async generateTombamento() {
    const year = new Date().getFullYear()
    const count = await prisma.bemPatrimonial.count({
      where: {
        tombamento: {
          startsWith: `${year}`
        }
      }
    })
    return `${year}${String(count + 1).padStart(5, '0')}`
  },

  async update(id: string, payload: Partial<BemPatrimonialPayload>) {
    const data: any = {}

    if (payload.tipo !== undefined) data.tipo = payload.tipo
    if (payload.tombamento !== undefined) data.tombamento = payload.tombamento
    if (payload.descricao !== undefined) data.descricao = payload.descricao.trim()
    if (payload.especificacao !== undefined) data.especificacao = payload.especificacao
    if (payload.dataAquisicao !== undefined) data.dataAquisicao = payload.dataAquisicao ? new Date(payload.dataAquisicao) : null
    if (payload.valorAquisicao !== undefined) data.valorAquisicao = payload.valorAquisicao
    if (payload.valorAtual !== undefined) data.valorAtual = payload.valorAtual
    if (payload.localizacao !== undefined) data.localizacao = payload.localizacao
    if (payload.responsavel !== undefined) data.responsavel = payload.responsavel
    if (payload.situacao !== undefined) data.situacao = payload.situacao
    if (payload.matriculaImovel !== undefined) data.matriculaImovel = payload.matriculaImovel
    if (payload.enderecoImovel !== undefined) data.enderecoImovel = payload.enderecoImovel
    if (payload.areaImovel !== undefined) data.areaImovel = payload.areaImovel
    if (payload.observacoes !== undefined) data.observacoes = payload.observacoes

    return prisma.bemPatrimonial.update({ where: { id }, data })
  },

  async remove(id: string) {
    await prisma.bemPatrimonial.delete({ where: { id } })
    return { success: true }
  },

  async getStats() {
    const [total, porTipo, porSituacao, valores] = await Promise.all([
      prisma.bemPatrimonial.count(),
      prisma.bemPatrimonial.groupBy({ by: ['tipo'], _count: { _all: true }, _sum: { valorAtual: true } }),
      prisma.bemPatrimonial.groupBy({ by: ['situacao'], _count: { _all: true } }),
      prisma.bemPatrimonial.aggregate({ _sum: { valorAquisicao: true, valorAtual: true } })
    ])

    return {
      total,
      porTipo: porTipo.map(item => ({
        tipo: item.tipo,
        quantidade: item._count._all,
        valor: item._sum.valorAtual ?? 0
      })),
      porSituacao: porSituacao.reduce((acc, item) => {
        acc[item.situacao] = item._count._all
        return acc
      }, {} as Record<string, number>),
      valorAquisicao: valores._sum.valorAquisicao ?? 0,
      valorAtual: valores._sum.valorAtual ?? 0
    }
  },

  async getMoveis() {
    return prisma.bemPatrimonial.findMany({
      where: { tipo: 'MOVEL' },
      orderBy: [{ descricao: 'asc' }]
    })
  },

  async getImoveis() {
    return prisma.bemPatrimonial.findMany({
      where: { tipo: 'IMOVEL' },
      orderBy: [{ descricao: 'asc' }]
    })
  }
}
