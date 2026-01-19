import { prisma } from '@/lib/prisma'
import type { CategoriaReceita, OrigemReceita, SituacaoReceita } from '@prisma/client'

export interface ReceitaPayload {
  numero?: string | null
  ano: number
  mes: number
  data: Date | string
  contribuinte?: string | null
  cnpjCpf?: string | null
  unidade?: string | null
  categoria: CategoriaReceita
  origem: OrigemReceita
  especie?: string | null
  rubrica?: string | null
  valorPrevisto?: number | null
  valorArrecadado: number
  situacao?: SituacaoReceita
  fonteRecurso?: string | null
  observacoes?: string | null
}

export interface ReceitaFilters {
  categoria?: CategoriaReceita
  origem?: OrigemReceita
  situacao?: SituacaoReceita
  ano?: number
  mes?: number
  contribuinte?: string
  valorMinimo?: number
  valorMaximo?: number
}

const buildWhereClause = (filters: ReceitaFilters = {}) => {
  const where: any = {}

  if (filters.categoria) where.categoria = filters.categoria
  if (filters.origem) where.origem = filters.origem
  if (filters.situacao) where.situacao = filters.situacao
  if (filters.ano) where.ano = filters.ano
  if (filters.mes) where.mes = filters.mes
  if (filters.contribuinte) where.contribuinte = { contains: filters.contribuinte, mode: 'insensitive' }

  if (filters.valorMinimo !== undefined || filters.valorMaximo !== undefined) {
    where.valorArrecadado = {}
    if (filters.valorMinimo !== undefined) where.valorArrecadado.gte = filters.valorMinimo
    if (filters.valorMaximo !== undefined) where.valorArrecadado.lte = filters.valorMaximo
  }

  return where
}

export const receitasDbService = {
  async list(filters: ReceitaFilters = {}) {
    return prisma.receita.findMany({
      where: buildWhereClause(filters),
      orderBy: [{ data: 'desc' }, { createdAt: 'desc' }]
    })
  },

  async paginate(filters: ReceitaFilters = {}, options: { page?: number; limit?: number } = {}) {
    const page = Math.max(1, options.page ?? 1)
    const limit = Math.min(100, Math.max(1, options.limit ?? 10))
    const skip = (page - 1) * limit
    const where = buildWhereClause(filters)

    const [total, registros] = await Promise.all([
      prisma.receita.count({ where }),
      prisma.receita.findMany({
        where,
        orderBy: [{ data: 'desc' }, { createdAt: 'desc' }],
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
    return prisma.receita.findUnique({ where: { id } })
  },

  async create(payload: ReceitaPayload) {
    return prisma.receita.create({
      data: {
        numero: payload.numero ?? null,
        ano: payload.ano,
        mes: payload.mes,
        data: new Date(payload.data),
        contribuinte: payload.contribuinte ?? null,
        cnpjCpf: payload.cnpjCpf ?? null,
        unidade: payload.unidade ?? null,
        categoria: payload.categoria,
        origem: payload.origem,
        especie: payload.especie ?? null,
        rubrica: payload.rubrica ?? null,
        valorPrevisto: payload.valorPrevisto ?? 0,
        valorArrecadado: payload.valorArrecadado ?? 0,
        situacao: payload.situacao ?? 'ARRECADADA',
        fonteRecurso: payload.fonteRecurso ?? null,
        observacoes: payload.observacoes ?? null
      }
    })
  },

  async update(id: string, payload: Partial<ReceitaPayload>) {
    const data: any = {}

    if (payload.numero !== undefined) data.numero = payload.numero
    if (payload.ano !== undefined) data.ano = payload.ano
    if (payload.mes !== undefined) data.mes = payload.mes
    if (payload.data !== undefined) data.data = new Date(payload.data)
    if (payload.contribuinte !== undefined) data.contribuinte = payload.contribuinte
    if (payload.cnpjCpf !== undefined) data.cnpjCpf = payload.cnpjCpf
    if (payload.unidade !== undefined) data.unidade = payload.unidade
    if (payload.categoria !== undefined) data.categoria = payload.categoria
    if (payload.origem !== undefined) data.origem = payload.origem
    if (payload.especie !== undefined) data.especie = payload.especie
    if (payload.rubrica !== undefined) data.rubrica = payload.rubrica
    if (payload.valorPrevisto !== undefined) data.valorPrevisto = payload.valorPrevisto
    if (payload.valorArrecadado !== undefined) data.valorArrecadado = payload.valorArrecadado
    if (payload.situacao !== undefined) data.situacao = payload.situacao
    if (payload.fonteRecurso !== undefined) data.fonteRecurso = payload.fonteRecurso
    if (payload.observacoes !== undefined) data.observacoes = payload.observacoes

    return prisma.receita.update({ where: { id }, data })
  },

  async remove(id: string) {
    await prisma.receita.delete({ where: { id } })
    return { success: true }
  },

  async getStats(ano?: number) {
    const where = ano ? { ano } : {}

    const [total, porCategoria, porOrigem, valores] = await Promise.all([
      prisma.receita.count({ where }),
      prisma.receita.groupBy({ by: ['categoria'], where, _count: { _all: true }, _sum: { valorArrecadado: true } }),
      prisma.receita.groupBy({ by: ['origem'], where, _count: { _all: true }, _sum: { valorArrecadado: true } }),
      prisma.receita.aggregate({ where, _sum: { valorPrevisto: true, valorArrecadado: true } })
    ])

    return {
      total,
      porCategoria: porCategoria.map(item => ({
        categoria: item.categoria,
        quantidade: item._count._all,
        valor: item._sum.valorArrecadado ?? 0
      })),
      porOrigem: porOrigem.map(item => ({
        origem: item.origem,
        quantidade: item._count._all,
        valor: item._sum.valorArrecadado ?? 0
      })),
      valorPrevisto: valores._sum.valorPrevisto ?? 0,
      valorArrecadado: valores._sum.valorArrecadado ?? 0
    }
  },

  async getAnosDisponiveis() {
    const anos = await prisma.receita.groupBy({ by: ['ano'], orderBy: { ano: 'desc' } })
    return anos.map(entry => entry.ano)
  },

  async getMesesDisponiveis(ano: number) {
    const meses = await prisma.receita.groupBy({ by: ['mes'], where: { ano }, orderBy: { mes: 'asc' } })
    return meses.map(entry => entry.mes)
  }
}
