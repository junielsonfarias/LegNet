import { prisma } from '@/lib/prisma'
import type { ModalidadeContrato, SituacaoContrato } from '@prisma/client'

export interface ContratoPayload {
  numero: string
  ano: number
  modalidade: ModalidadeContrato
  objeto: string
  contratado: string
  cnpjCpf?: string | null
  valorTotal: number
  dataAssinatura: Date | string
  vigenciaInicio: Date | string
  vigenciaFim: Date | string
  fiscalContrato?: string | null
  situacao?: SituacaoContrato
  licitacaoId?: string | null
  arquivo?: string | null
  observacoes?: string | null
}

export interface ContratoFilters {
  modalidade?: ModalidadeContrato
  situacao?: SituacaoContrato
  ano?: number
  contratado?: string
  objeto?: string
  licitacaoId?: string
  dataInicio?: Date | string
  dataFim?: Date | string
  valorMinimo?: number
  valorMaximo?: number
}

const buildWhereClause = (filters: ContratoFilters = {}) => {
  const where: any = {}

  if (filters.modalidade) where.modalidade = filters.modalidade
  if (filters.situacao) where.situacao = filters.situacao
  if (filters.ano) where.ano = filters.ano
  if (filters.licitacaoId) where.licitacaoId = filters.licitacaoId
  if (filters.contratado) where.contratado = { contains: filters.contratado, mode: 'insensitive' }
  if (filters.objeto) where.objeto = { contains: filters.objeto, mode: 'insensitive' }

  if (filters.dataInicio || filters.dataFim) {
    where.dataAssinatura = {}
    if (filters.dataInicio) where.dataAssinatura.gte = new Date(filters.dataInicio)
    if (filters.dataFim) where.dataAssinatura.lte = new Date(filters.dataFim)
  }

  if (filters.valorMinimo !== undefined || filters.valorMaximo !== undefined) {
    where.valorTotal = {}
    if (filters.valorMinimo !== undefined) where.valorTotal.gte = filters.valorMinimo
    if (filters.valorMaximo !== undefined) where.valorTotal.lte = filters.valorMaximo
  }

  return where
}

export const contratosDbService = {
  async list(filters: ContratoFilters = {}) {
    return prisma.contrato.findMany({
      where: buildWhereClause(filters),
      orderBy: [{ dataAssinatura: 'desc' }, { createdAt: 'desc' }],
      include: {
        licitacao: true,
        aditivos: true,
        _count: { select: { despesas: true } }
      }
    })
  },

  async paginate(filters: ContratoFilters = {}, options: { page?: number; limit?: number } = {}) {
    const page = Math.max(1, options.page ?? 1)
    const limit = Math.min(100, Math.max(1, options.limit ?? 10))
    const skip = (page - 1) * limit
    const where = buildWhereClause(filters)

    const [total, registros] = await Promise.all([
      prisma.contrato.count({ where }),
      prisma.contrato.findMany({
        where,
        orderBy: [{ dataAssinatura: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
        include: {
          licitacao: true,
          aditivos: true,
          _count: { select: { despesas: true } }
        }
      })
    ])

    const totalPages = Math.max(1, Math.ceil(total / limit))

    return {
      data: registros,
      pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 }
    }
  },

  async getById(id: string) {
    return prisma.contrato.findUnique({
      where: { id },
      include: { licitacao: true, aditivos: true, despesas: true }
    })
  },

  async create(payload: ContratoPayload) {
    return prisma.contrato.create({
      data: {
        numero: payload.numero.trim(),
        ano: payload.ano,
        modalidade: payload.modalidade,
        objeto: payload.objeto.trim(),
        contratado: payload.contratado.trim(),
        cnpjCpf: payload.cnpjCpf || '',
        valorTotal: payload.valorTotal,
        dataAssinatura: new Date(payload.dataAssinatura),
        vigenciaInicio: new Date(payload.vigenciaInicio),
        vigenciaFim: new Date(payload.vigenciaFim),
        fiscalContrato: payload.fiscalContrato ?? null,
        situacao: payload.situacao ?? 'VIGENTE',
        licitacaoId: payload.licitacaoId ?? null,
        arquivo: payload.arquivo ?? null,
        observacoes: payload.observacoes ?? null
      },
      include: { licitacao: true }
    })
  },

  async update(id: string, payload: Partial<ContratoPayload>) {
    const data: any = {}

    if (payload.numero !== undefined) data.numero = payload.numero.trim()
    if (payload.ano !== undefined) data.ano = payload.ano
    if (payload.modalidade !== undefined) data.modalidade = payload.modalidade
    if (payload.objeto !== undefined) data.objeto = payload.objeto.trim()
    if (payload.contratado !== undefined) data.contratado = payload.contratado.trim()
    if (payload.cnpjCpf !== undefined) data.cnpjCpf = payload.cnpjCpf
    if (payload.valorTotal !== undefined) data.valorTotal = payload.valorTotal
    if (payload.dataAssinatura !== undefined) data.dataAssinatura = new Date(payload.dataAssinatura)
    if (payload.vigenciaInicio !== undefined) data.vigenciaInicio = new Date(payload.vigenciaInicio)
    if (payload.vigenciaFim !== undefined) data.vigenciaFim = new Date(payload.vigenciaFim)
    if (payload.fiscalContrato !== undefined) data.fiscalContrato = payload.fiscalContrato
    if (payload.situacao !== undefined) data.situacao = payload.situacao
    if (payload.licitacaoId !== undefined) data.licitacaoId = payload.licitacaoId
    if (payload.arquivo !== undefined) data.arquivo = payload.arquivo
    if (payload.observacoes !== undefined) data.observacoes = payload.observacoes

    return prisma.contrato.update({
      where: { id },
      data,
      include: { licitacao: true }
    })
  },

  async remove(id: string) {
    await prisma.contrato.delete({ where: { id } })
    return { success: true }
  },

  async getStats() {
    const [total, porSituacao, valorTotal] = await Promise.all([
      prisma.contrato.count(),
      prisma.contrato.groupBy({ by: ['situacao'], _count: { _all: true } }),
      prisma.contrato.aggregate({ _sum: { valorTotal: true } })
    ])

    return {
      total,
      porSituacao: porSituacao.reduce((acc, item) => {
        acc[item.situacao] = item._count._all
        return acc
      }, {} as Record<string, number>),
      valorTotal: valorTotal._sum.valorTotal ?? 0
    }
  },

  async getAnosDisponiveis() {
    const anos = await prisma.contrato.groupBy({ by: ['ano'], orderBy: { ano: 'desc' } })
    return anos.map(entry => entry.ano)
  }
}
