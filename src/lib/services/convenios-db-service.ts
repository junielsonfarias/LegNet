import { prisma } from '@/lib/prisma'
import type { SituacaoConvenio } from '@prisma/client'

export interface ConvenioPayload {
  numero: string
  ano: number
  convenente: string
  cnpjConvenente?: string | null
  orgaoConcedente: string
  objeto: string
  programa?: string | null
  acao?: string | null
  valorTotal: number
  valorRepasse?: number | null
  valorContrapartida?: number | null
  dataCelebracao: Date | string
  vigenciaInicio: Date | string
  vigenciaFim: Date | string
  responsavelTecnico?: string | null
  situacao?: SituacaoConvenio
  fonteRecurso?: string | null
  arquivo?: string | null
  observacoes?: string | null
}

export interface ConvenioFilters {
  situacao?: SituacaoConvenio
  ano?: number
  convenente?: string
  orgaoConcedente?: string
  objeto?: string
  dataInicio?: Date | string
  dataFim?: Date | string
  valorMinimo?: number
  valorMaximo?: number
}

const buildWhereClause = (filters: ConvenioFilters = {}) => {
  const where: any = {}

  if (filters.situacao) where.situacao = filters.situacao
  if (filters.ano) where.ano = filters.ano
  if (filters.convenente) where.convenente = { contains: filters.convenente, mode: 'insensitive' }
  if (filters.orgaoConcedente) where.orgaoConcedente = { contains: filters.orgaoConcedente, mode: 'insensitive' }
  if (filters.objeto) where.objeto = { contains: filters.objeto, mode: 'insensitive' }

  if (filters.dataInicio || filters.dataFim) {
    where.dataCelebracao = {}
    if (filters.dataInicio) where.dataCelebracao.gte = new Date(filters.dataInicio)
    if (filters.dataFim) where.dataCelebracao.lte = new Date(filters.dataFim)
  }

  if (filters.valorMinimo !== undefined || filters.valorMaximo !== undefined) {
    where.valorTotal = {}
    if (filters.valorMinimo !== undefined) where.valorTotal.gte = filters.valorMinimo
    if (filters.valorMaximo !== undefined) where.valorTotal.lte = filters.valorMaximo
  }

  return where
}

export const conveniosDbService = {
  async list(filters: ConvenioFilters = {}) {
    return prisma.convenio.findMany({
      where: buildWhereClause(filters),
      orderBy: [{ dataCelebracao: 'desc' }, { createdAt: 'desc' }],
      include: { _count: { select: { despesas: true } } }
    })
  },

  async paginate(filters: ConvenioFilters = {}, options: { page?: number; limit?: number } = {}) {
    const page = Math.max(1, options.page ?? 1)
    const limit = Math.min(100, Math.max(1, options.limit ?? 10))
    const skip = (page - 1) * limit
    const where = buildWhereClause(filters)

    const [total, registros] = await Promise.all([
      prisma.convenio.count({ where }),
      prisma.convenio.findMany({
        where,
        orderBy: [{ dataCelebracao: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
        include: { _count: { select: { despesas: true } } }
      })
    ])

    const totalPages = Math.max(1, Math.ceil(total / limit))

    return {
      data: registros,
      pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 }
    }
  },

  async getById(id: string) {
    return prisma.convenio.findUnique({
      where: { id },
      include: { despesas: true }
    })
  },

  async create(payload: ConvenioPayload) {
    return prisma.convenio.create({
      data: {
        numero: payload.numero.trim(),
        ano: payload.ano,
        convenente: payload.convenente.trim(),
        cnpjConvenente: payload.cnpjConvenente || '',
        orgaoConcedente: payload.orgaoConcedente.trim(),
        objeto: payload.objeto.trim(),
        programa: payload.programa ?? null,
        acao: payload.acao ?? null,
        valorTotal: payload.valorTotal,
        valorRepasse: payload.valorRepasse ?? payload.valorTotal,
        valorContrapartida: payload.valorContrapartida ?? 0,
        dataCelebracao: new Date(payload.dataCelebracao),
        vigenciaInicio: new Date(payload.vigenciaInicio),
        vigenciaFim: new Date(payload.vigenciaFim),
        responsavelTecnico: payload.responsavelTecnico ?? null,
        situacao: payload.situacao ?? 'EM_EXECUCAO',
        fonteRecurso: payload.fonteRecurso ?? null,
        arquivo: payload.arquivo ?? null,
        observacoes: payload.observacoes ?? null
      }
    })
  },

  async update(id: string, payload: Partial<ConvenioPayload>) {
    const data: any = {}

    if (payload.numero !== undefined) data.numero = payload.numero.trim()
    if (payload.ano !== undefined) data.ano = payload.ano
    if (payload.convenente !== undefined) data.convenente = payload.convenente.trim()
    if (payload.cnpjConvenente !== undefined) data.cnpjConvenente = payload.cnpjConvenente
    if (payload.orgaoConcedente !== undefined) data.orgaoConcedente = payload.orgaoConcedente.trim()
    if (payload.objeto !== undefined) data.objeto = payload.objeto.trim()
    if (payload.programa !== undefined) data.programa = payload.programa
    if (payload.acao !== undefined) data.acao = payload.acao
    if (payload.valorTotal !== undefined) data.valorTotal = payload.valorTotal
    if (payload.valorRepasse !== undefined) data.valorRepasse = payload.valorRepasse
    if (payload.valorContrapartida !== undefined) data.valorContrapartida = payload.valorContrapartida
    if (payload.dataCelebracao !== undefined) data.dataCelebracao = new Date(payload.dataCelebracao)
    if (payload.vigenciaInicio !== undefined) data.vigenciaInicio = new Date(payload.vigenciaInicio)
    if (payload.vigenciaFim !== undefined) data.vigenciaFim = new Date(payload.vigenciaFim)
    if (payload.responsavelTecnico !== undefined) data.responsavelTecnico = payload.responsavelTecnico
    if (payload.situacao !== undefined) data.situacao = payload.situacao
    if (payload.fonteRecurso !== undefined) data.fonteRecurso = payload.fonteRecurso
    if (payload.arquivo !== undefined) data.arquivo = payload.arquivo
    if (payload.observacoes !== undefined) data.observacoes = payload.observacoes

    return prisma.convenio.update({ where: { id }, data })
  },

  async remove(id: string) {
    await prisma.convenio.delete({ where: { id } })
    return { success: true }
  },

  async getStats() {
    const [total, porSituacao, valorTotal] = await Promise.all([
      prisma.convenio.count(),
      prisma.convenio.groupBy({ by: ['situacao'], _count: { _all: true } }),
      prisma.convenio.aggregate({ _sum: { valorTotal: true, valorRepasse: true, valorContrapartida: true } })
    ])

    return {
      total,
      porSituacao: porSituacao.reduce((acc, item) => {
        acc[item.situacao] = item._count._all
        return acc
      }, {} as Record<string, number>),
      valorTotal: valorTotal._sum.valorTotal ?? 0,
      valorRepasse: valorTotal._sum.valorRepasse ?? 0,
      valorContrapartida: valorTotal._sum.valorContrapartida ?? 0
    }
  },

  async getAnosDisponiveis() {
    const anos = await prisma.convenio.groupBy({ by: ['ano'], orderBy: { ano: 'desc' } })
    return anos.map(entry => entry.ano)
  }
}
