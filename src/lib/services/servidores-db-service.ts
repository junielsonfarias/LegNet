import { prisma } from '@/lib/prisma'
import type { SituacaoServidor, VinculoServidor } from '@prisma/client'

export interface ServidorPayload {
  nome: string
  cpf?: string | null
  matricula?: string | null
  cargo?: string | null
  funcao?: string | null
  unidade?: string | null
  lotacao?: string | null
  vinculo: VinculoServidor
  dataAdmissao?: Date | string | null
  dataDesligamento?: Date | string | null
  salarioBruto?: number | null
  situacao?: SituacaoServidor
  observacoes?: string | null
}

export interface ServidorFilters {
  situacao?: SituacaoServidor
  vinculo?: VinculoServidor
  cargo?: string
  unidade?: string
  nome?: string
}

const buildWhereClause = (filters: ServidorFilters = {}) => {
  const where: any = {}

  if (filters.situacao) where.situacao = filters.situacao
  if (filters.vinculo) where.vinculo = filters.vinculo
  if (filters.cargo) where.cargo = { contains: filters.cargo, mode: 'insensitive' }
  if (filters.unidade) where.unidade = { contains: filters.unidade, mode: 'insensitive' }
  if (filters.nome) where.nome = { contains: filters.nome, mode: 'insensitive' }

  return where
}

export const servidoresDbService = {
  async list(filters: ServidorFilters = {}) {
    return prisma.servidor.findMany({
      where: buildWhereClause(filters),
      orderBy: [{ nome: 'asc' }]
    })
  },

  async paginate(filters: ServidorFilters = {}, options: { page?: number; limit?: number } = {}) {
    const page = Math.max(1, options.page ?? 1)
    const limit = Math.min(100, Math.max(1, options.limit ?? 10))
    const skip = (page - 1) * limit
    const where = buildWhereClause(filters)

    const [total, registros] = await Promise.all([
      prisma.servidor.count({ where }),
      prisma.servidor.findMany({
        where,
        orderBy: [{ nome: 'asc' }],
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
    return prisma.servidor.findUnique({ where: { id } })
  },

  async create(payload: ServidorPayload) {
    // Gera matricula automatica se nao fornecida
    const matricula = payload.matricula || await this.generateMatricula()

    return prisma.servidor.create({
      data: {
        nome: payload.nome.trim(),
        cpf: payload.cpf || '',
        matricula,
        cargo: payload.cargo || 'A DEFINIR',
        funcao: payload.funcao ?? null,
        unidade: payload.unidade ?? null,
        lotacao: payload.lotacao ?? null,
        vinculo: payload.vinculo,
        dataAdmissao: payload.dataAdmissao ? new Date(payload.dataAdmissao) : new Date(),
        dataDesligamento: payload.dataDesligamento ? new Date(payload.dataDesligamento) : null,
        salarioBruto: payload.salarioBruto ?? 0,
        situacao: payload.situacao ?? 'ATIVO',
        observacoes: payload.observacoes ?? null
      }
    })
  },

  async generateMatricula() {
    const year = new Date().getFullYear()
    const count = await prisma.servidor.count()
    return `${year}${String(count + 1).padStart(5, '0')}`
  },

  async update(id: string, payload: Partial<ServidorPayload>) {
    const data: any = {}

    if (payload.nome !== undefined) data.nome = payload.nome.trim()
    if (payload.cpf !== undefined) data.cpf = payload.cpf
    if (payload.matricula !== undefined) data.matricula = payload.matricula
    if (payload.cargo !== undefined) data.cargo = payload.cargo
    if (payload.funcao !== undefined) data.funcao = payload.funcao
    if (payload.unidade !== undefined) data.unidade = payload.unidade
    if (payload.lotacao !== undefined) data.lotacao = payload.lotacao
    if (payload.vinculo !== undefined) data.vinculo = payload.vinculo
    if (payload.dataAdmissao !== undefined) data.dataAdmissao = payload.dataAdmissao ? new Date(payload.dataAdmissao) : null
    if (payload.dataDesligamento !== undefined) data.dataDesligamento = payload.dataDesligamento ? new Date(payload.dataDesligamento) : null
    if (payload.salarioBruto !== undefined) data.salarioBruto = payload.salarioBruto
    if (payload.situacao !== undefined) data.situacao = payload.situacao
    if (payload.observacoes !== undefined) data.observacoes = payload.observacoes

    return prisma.servidor.update({ where: { id }, data })
  },

  async remove(id: string) {
    await prisma.servidor.delete({ where: { id } })
    return { success: true }
  },

  async getStats() {
    const [total, porSituacao, porVinculo, totalSalarios] = await Promise.all([
      prisma.servidor.count(),
      prisma.servidor.groupBy({ by: ['situacao'], _count: { _all: true } }),
      prisma.servidor.groupBy({ by: ['vinculo'], _count: { _all: true } }),
      prisma.servidor.aggregate({ where: { situacao: 'ATIVO' }, _sum: { salarioBruto: true } })
    ])

    return {
      total,
      porSituacao: porSituacao.reduce((acc, item) => {
        acc[item.situacao] = item._count._all
        return acc
      }, {} as Record<string, number>),
      porVinculo: porVinculo.reduce((acc, item) => {
        acc[item.vinculo] = item._count._all
        return acc
      }, {} as Record<string, number>),
      totalSalarios: totalSalarios._sum.salarioBruto ?? 0
    }
  }
}

// Folha de Pagamento Service
export interface FolhaPagamentoPayload {
  competencia: string
  mes: number
  ano: number
  totalServidores?: number | null
  totalBruto?: number | null
  totalDeducoes?: number | null
  totalLiquido?: number | null
  dataProcessamento?: Date | string | null
  situacao?: string | null
  observacoes?: string | null
}

export interface FolhaPagamentoFilters {
  ano?: number
  mes?: number
  situacao?: string
}

const buildFolhaWhereClause = (filters: FolhaPagamentoFilters = {}) => {
  const where: any = {}

  if (filters.ano) where.ano = filters.ano
  if (filters.mes) where.mes = filters.mes
  if (filters.situacao) where.situacao = filters.situacao

  return where
}

export const folhaPagamentoDbService = {
  async list(filters: FolhaPagamentoFilters = {}) {
    return prisma.folhaPagamento.findMany({
      where: buildFolhaWhereClause(filters),
      orderBy: [{ ano: 'desc' }, { mes: 'desc' }]
    })
  },

  async paginate(filters: FolhaPagamentoFilters = {}, options: { page?: number; limit?: number } = {}) {
    const page = Math.max(1, options.page ?? 1)
    const limit = Math.min(100, Math.max(1, options.limit ?? 10))
    const skip = (page - 1) * limit
    const where = buildFolhaWhereClause(filters)

    const [total, registros] = await Promise.all([
      prisma.folhaPagamento.count({ where }),
      prisma.folhaPagamento.findMany({
        where,
        orderBy: [{ ano: 'desc' }, { mes: 'desc' }],
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
    return prisma.folhaPagamento.findUnique({ where: { id } })
  },

  async create(payload: FolhaPagamentoPayload) {
    return prisma.folhaPagamento.create({
      data: {
        competencia: payload.competencia.trim(),
        mes: payload.mes,
        ano: payload.ano,
        totalServidores: payload.totalServidores ?? 0,
        totalBruto: payload.totalBruto ?? 0,
        totalDeducoes: payload.totalDeducoes ?? 0,
        totalLiquido: payload.totalLiquido ?? 0,
        dataProcessamento: payload.dataProcessamento ? new Date(payload.dataProcessamento) : null,
        situacao: payload.situacao ?? 'PROCESSADA',
        observacoes: payload.observacoes ?? null
      }
    })
  },

  async update(id: string, payload: Partial<FolhaPagamentoPayload>) {
    const data: any = {}

    if (payload.competencia !== undefined) data.competencia = payload.competencia.trim()
    if (payload.mes !== undefined) data.mes = payload.mes
    if (payload.ano !== undefined) data.ano = payload.ano
    if (payload.totalServidores !== undefined) data.totalServidores = payload.totalServidores
    if (payload.totalBruto !== undefined) data.totalBruto = payload.totalBruto
    if (payload.totalDeducoes !== undefined) data.totalDeducoes = payload.totalDeducoes
    if (payload.totalLiquido !== undefined) data.totalLiquido = payload.totalLiquido
    if (payload.dataProcessamento !== undefined) data.dataProcessamento = payload.dataProcessamento ? new Date(payload.dataProcessamento) : null
    if (payload.situacao !== undefined) data.situacao = payload.situacao
    if (payload.observacoes !== undefined) data.observacoes = payload.observacoes

    return prisma.folhaPagamento.update({ where: { id }, data })
  },

  async remove(id: string) {
    await prisma.folhaPagamento.delete({ where: { id } })
    return { success: true }
  },

  async getStats(ano?: number) {
    const where = ano ? { ano } : {}

    const [total, valores] = await Promise.all([
      prisma.folhaPagamento.count({ where }),
      prisma.folhaPagamento.aggregate({
        where,
        _sum: { totalBruto: true, totalDeducoes: true, totalLiquido: true, totalServidores: true }
      })
    ])

    return {
      total,
      totalBruto: valores._sum.totalBruto ?? 0,
      totalDeducoes: valores._sum.totalDeducoes ?? 0,
      totalLiquido: valores._sum.totalLiquido ?? 0,
      totalServidores: valores._sum.totalServidores ?? 0
    }
  },

  async getAnosDisponiveis() {
    const anos = await prisma.folhaPagamento.groupBy({ by: ['ano'], orderBy: { ano: 'desc' } })
    return anos.map(entry => entry.ano)
  }
}
