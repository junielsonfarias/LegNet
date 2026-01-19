import { prisma } from '@/lib/prisma'
import type { SituacaoDespesa } from '@prisma/client'

export interface DespesaPayload {
  numeroEmpenho: string
  ano: number
  mes: number
  data: Date | string
  credor: string
  cnpjCpf?: string | null
  unidade?: string | null
  elemento?: string | null
  funcao?: string | null
  subfuncao?: string | null
  programa?: string | null
  acao?: string | null
  valorEmpenhado: number
  valorLiquidado?: number | null
  valorPago?: number | null
  situacao?: SituacaoDespesa
  fonteRecurso?: string | null
  modalidade?: string | null
  licitacaoId?: string | null
  contratoId?: string | null
  convenioId?: string | null
  observacoes?: string | null
}

export interface DespesaFilters {
  situacao?: SituacaoDespesa
  ano?: number
  mes?: number
  credor?: string
  elemento?: string
  funcao?: string
  programa?: string
  licitacaoId?: string
  contratoId?: string
  convenioId?: string
  valorMinimo?: number
  valorMaximo?: number
}

const buildWhereClause = (filters: DespesaFilters = {}) => {
  const where: any = {}

  if (filters.situacao) where.situacao = filters.situacao
  if (filters.ano) where.ano = filters.ano
  if (filters.mes) where.mes = filters.mes
  if (filters.credor) where.credor = { contains: filters.credor, mode: 'insensitive' }
  if (filters.elemento) where.elemento = { contains: filters.elemento, mode: 'insensitive' }
  if (filters.funcao) where.funcao = filters.funcao
  if (filters.programa) where.programa = filters.programa
  if (filters.licitacaoId) where.licitacaoId = filters.licitacaoId
  if (filters.contratoId) where.contratoId = filters.contratoId
  if (filters.convenioId) where.convenioId = filters.convenioId

  if (filters.valorMinimo !== undefined || filters.valorMaximo !== undefined) {
    where.valorEmpenhado = {}
    if (filters.valorMinimo !== undefined) where.valorEmpenhado.gte = filters.valorMinimo
    if (filters.valorMaximo !== undefined) where.valorEmpenhado.lte = filters.valorMaximo
  }

  return where
}

export const despesasDbService = {
  async list(filters: DespesaFilters = {}) {
    return prisma.despesa.findMany({
      where: buildWhereClause(filters),
      orderBy: [{ data: 'desc' }, { createdAt: 'desc' }],
      include: { licitacao: true, contrato: true, convenio: true }
    })
  },

  async paginate(filters: DespesaFilters = {}, options: { page?: number; limit?: number } = {}) {
    const page = Math.max(1, options.page ?? 1)
    const limit = Math.min(100, Math.max(1, options.limit ?? 10))
    const skip = (page - 1) * limit
    const where = buildWhereClause(filters)

    const [total, registros] = await Promise.all([
      prisma.despesa.count({ where }),
      prisma.despesa.findMany({
        where,
        orderBy: [{ data: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
        include: { licitacao: true, contrato: true, convenio: true }
      })
    ])

    const totalPages = Math.max(1, Math.ceil(total / limit))

    return {
      data: registros,
      pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 }
    }
  },

  async getById(id: string) {
    return prisma.despesa.findUnique({
      where: { id },
      include: { licitacao: true, contrato: true, convenio: true }
    })
  },

  async create(payload: DespesaPayload) {
    return prisma.despesa.create({
      data: {
        numeroEmpenho: payload.numeroEmpenho.trim(),
        ano: payload.ano,
        mes: payload.mes,
        data: new Date(payload.data),
        credor: payload.credor.trim(),
        cnpjCpf: payload.cnpjCpf || '',
        unidade: payload.unidade ?? null,
        elemento: payload.elemento ?? null,
        funcao: payload.funcao ?? null,
        subfuncao: payload.subfuncao ?? null,
        programa: payload.programa ?? null,
        acao: payload.acao ?? null,
        valorEmpenhado: payload.valorEmpenhado,
        valorLiquidado: payload.valorLiquidado ?? 0,
        valorPago: payload.valorPago ?? 0,
        situacao: payload.situacao ?? 'EMPENHADA',
        fonteRecurso: payload.fonteRecurso ?? null,
        modalidade: payload.modalidade ?? null,
        licitacaoId: payload.licitacaoId ?? null,
        contratoId: payload.contratoId ?? null,
        convenioId: payload.convenioId ?? null,
        observacoes: payload.observacoes ?? null
      },
      include: { licitacao: true, contrato: true, convenio: true }
    })
  },

  async update(id: string, payload: Partial<DespesaPayload>) {
    const data: any = {}

    if (payload.numeroEmpenho !== undefined) data.numeroEmpenho = payload.numeroEmpenho.trim()
    if (payload.ano !== undefined) data.ano = payload.ano
    if (payload.mes !== undefined) data.mes = payload.mes
    if (payload.data !== undefined) data.data = new Date(payload.data)
    if (payload.credor !== undefined) data.credor = payload.credor.trim()
    if (payload.cnpjCpf !== undefined) data.cnpjCpf = payload.cnpjCpf
    if (payload.unidade !== undefined) data.unidade = payload.unidade
    if (payload.elemento !== undefined) data.elemento = payload.elemento
    if (payload.funcao !== undefined) data.funcao = payload.funcao
    if (payload.subfuncao !== undefined) data.subfuncao = payload.subfuncao
    if (payload.programa !== undefined) data.programa = payload.programa
    if (payload.acao !== undefined) data.acao = payload.acao
    if (payload.valorEmpenhado !== undefined) data.valorEmpenhado = payload.valorEmpenhado
    if (payload.valorLiquidado !== undefined) data.valorLiquidado = payload.valorLiquidado
    if (payload.valorPago !== undefined) data.valorPago = payload.valorPago
    if (payload.situacao !== undefined) data.situacao = payload.situacao
    if (payload.fonteRecurso !== undefined) data.fonteRecurso = payload.fonteRecurso
    if (payload.modalidade !== undefined) data.modalidade = payload.modalidade
    if (payload.licitacaoId !== undefined) data.licitacaoId = payload.licitacaoId
    if (payload.contratoId !== undefined) data.contratoId = payload.contratoId
    if (payload.convenioId !== undefined) data.convenioId = payload.convenioId
    if (payload.observacoes !== undefined) data.observacoes = payload.observacoes

    return prisma.despesa.update({
      where: { id },
      data,
      include: { licitacao: true, contrato: true, convenio: true }
    })
  },

  async remove(id: string) {
    await prisma.despesa.delete({ where: { id } })
    return { success: true }
  },

  async getStats(ano?: number) {
    const where = ano ? { ano } : {}

    const [total, porSituacao, porFuncao, valores] = await Promise.all([
      prisma.despesa.count({ where }),
      prisma.despesa.groupBy({ by: ['situacao'], where, _count: { _all: true }, _sum: { valorEmpenhado: true, valorPago: true } }),
      prisma.despesa.groupBy({ by: ['funcao'], where, _count: { _all: true }, _sum: { valorEmpenhado: true } }),
      prisma.despesa.aggregate({ where, _sum: { valorEmpenhado: true, valorLiquidado: true, valorPago: true } })
    ])

    return {
      total,
      porSituacao: porSituacao.map(item => ({
        situacao: item.situacao,
        quantidade: item._count._all,
        valorEmpenhado: item._sum.valorEmpenhado ?? 0,
        valorPago: item._sum.valorPago ?? 0
      })),
      porFuncao: porFuncao.filter(item => item.funcao).map(item => ({
        funcao: item.funcao,
        quantidade: item._count._all,
        valor: item._sum.valorEmpenhado ?? 0
      })),
      valorEmpenhado: valores._sum.valorEmpenhado ?? 0,
      valorLiquidado: valores._sum.valorLiquidado ?? 0,
      valorPago: valores._sum.valorPago ?? 0
    }
  },

  async getAnosDisponiveis() {
    const anos = await prisma.despesa.groupBy({ by: ['ano'], orderBy: { ano: 'desc' } })
    return anos.map(entry => entry.ano)
  },

  async getMesesDisponiveis(ano: number) {
    const meses = await prisma.despesa.groupBy({ by: ['mes'], where: { ano }, orderBy: { mes: 'asc' } })
    return meses.map(entry => entry.mes)
  }
}
