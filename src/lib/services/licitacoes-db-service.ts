import { prisma } from '@/lib/prisma'
import type { ModalidadeLicitacao, TipoLicitacao, SituacaoLicitacao } from '@prisma/client'

export interface LicitacaoPayload {
  numero: string
  ano: number
  modalidade: ModalidadeLicitacao
  tipo?: TipoLicitacao
  objeto: string
  valorEstimado?: number | null
  dataPublicacao?: Date | string | null
  dataAbertura: Date | string
  horaAbertura?: string | null
  dataEntregaPropostas?: Date | string | null
  situacao?: SituacaoLicitacao
  unidadeGestora?: string | null
  linkEdital?: string | null
  observacoes?: string | null
}

export interface LicitacaoFilters {
  modalidade?: ModalidadeLicitacao
  situacao?: SituacaoLicitacao
  ano?: number
  objeto?: string
  dataInicio?: Date | string
  dataFim?: Date | string
  valorMinimo?: number
  valorMaximo?: number
}

const buildWhereClause = (filters: LicitacaoFilters = {}) => {
  const where: any = {}

  if (filters.modalidade) {
    where.modalidade = filters.modalidade
  }

  if (filters.situacao) {
    where.situacao = filters.situacao
  }

  if (filters.ano) {
    where.ano = filters.ano
  }

  if (filters.objeto) {
    where.objeto = { contains: filters.objeto, mode: 'insensitive' }
  }

  if (filters.dataInicio || filters.dataFim) {
    where.dataAbertura = {}
    if (filters.dataInicio) {
      where.dataAbertura.gte = new Date(filters.dataInicio)
    }
    if (filters.dataFim) {
      where.dataAbertura.lte = new Date(filters.dataFim)
    }
  }

  if (filters.valorMinimo !== undefined || filters.valorMaximo !== undefined) {
    where.valorEstimado = {}
    if (filters.valorMinimo !== undefined) {
      where.valorEstimado.gte = filters.valorMinimo
    }
    if (filters.valorMaximo !== undefined) {
      where.valorEstimado.lte = filters.valorMaximo
    }
  }

  return where
}

export const licitacoesDbService = {
  async list(filters: LicitacaoFilters = {}) {
    const licitacoes = await prisma.licitacao.findMany({
      where: buildWhereClause(filters),
      orderBy: [{ dataAbertura: 'desc' }, { createdAt: 'desc' }],
      include: {
        documentos: true,
        _count: {
          select: { contratos: true, despesas: true }
        }
      }
    })
    return licitacoes
  },

  async paginate(filters: LicitacaoFilters = {}, options: { page?: number; limit?: number } = {}) {
    const page = Math.max(1, options.page ?? 1)
    const limit = Math.min(100, Math.max(1, options.limit ?? 10))
    const skip = (page - 1) * limit

    const where = buildWhereClause(filters)

    const [total, registros] = await Promise.all([
      prisma.licitacao.count({ where }),
      prisma.licitacao.findMany({
        where,
        orderBy: [{ dataAbertura: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
        include: {
          documentos: true,
          _count: {
            select: { contratos: true, despesas: true }
          }
        }
      })
    ])

    const totalPages = Math.max(1, Math.ceil(total / limit))

    return {
      data: registros,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }
  },

  async getById(id: string) {
    return prisma.licitacao.findUnique({
      where: { id },
      include: {
        documentos: true,
        contratos: true,
        despesas: true
      }
    })
  },

  async create(payload: LicitacaoPayload) {
    return prisma.licitacao.create({
      data: {
        numero: payload.numero.trim(),
        ano: payload.ano,
        modalidade: payload.modalidade,
        tipo: payload.tipo ?? 'MENOR_PRECO',
        objeto: payload.objeto.trim(),
        valorEstimado: payload.valorEstimado ?? null,
        dataPublicacao: payload.dataPublicacao ? new Date(payload.dataPublicacao) : null,
        dataAbertura: new Date(payload.dataAbertura),
        horaAbertura: payload.horaAbertura ?? null,
        dataEntregaPropostas: payload.dataEntregaPropostas ? new Date(payload.dataEntregaPropostas) : null,
        situacao: payload.situacao ?? 'EM_ANDAMENTO',
        unidadeGestora: payload.unidadeGestora ?? null,
        linkEdital: payload.linkEdital ?? null,
        observacoes: payload.observacoes ?? null
      },
      include: {
        documentos: true
      }
    })
  },

  async update(id: string, payload: Partial<LicitacaoPayload>) {
    const data: any = {}

    if (payload.numero !== undefined) data.numero = payload.numero.trim()
    if (payload.ano !== undefined) data.ano = payload.ano
    if (payload.modalidade !== undefined) data.modalidade = payload.modalidade
    if (payload.tipo !== undefined) data.tipo = payload.tipo
    if (payload.objeto !== undefined) data.objeto = payload.objeto.trim()
    if (payload.valorEstimado !== undefined) data.valorEstimado = payload.valorEstimado
    if (payload.dataPublicacao !== undefined) data.dataPublicacao = payload.dataPublicacao ? new Date(payload.dataPublicacao) : null
    if (payload.dataAbertura !== undefined) data.dataAbertura = new Date(payload.dataAbertura)
    if (payload.horaAbertura !== undefined) data.horaAbertura = payload.horaAbertura
    if (payload.dataEntregaPropostas !== undefined) data.dataEntregaPropostas = payload.dataEntregaPropostas ? new Date(payload.dataEntregaPropostas) : null
    if (payload.situacao !== undefined) data.situacao = payload.situacao
    if (payload.unidadeGestora !== undefined) data.unidadeGestora = payload.unidadeGestora
    if (payload.linkEdital !== undefined) data.linkEdital = payload.linkEdital
    if (payload.observacoes !== undefined) data.observacoes = payload.observacoes

    return prisma.licitacao.update({
      where: { id },
      data,
      include: {
        documentos: true
      }
    })
  },

  async remove(id: string) {
    await prisma.licitacao.delete({ where: { id } })
    return { success: true }
  },

  async getStats() {
    const [total, porSituacao, valorTotal] = await Promise.all([
      prisma.licitacao.count(),
      prisma.licitacao.groupBy({
        by: ['situacao'],
        _count: { _all: true }
      }),
      prisma.licitacao.aggregate({
        _sum: { valorEstimado: true }
      })
    ])

    return {
      total,
      porSituacao: porSituacao.reduce((acc, item) => {
        acc[item.situacao] = item._count._all
        return acc
      }, {} as Record<string, number>),
      valorTotal: valorTotal._sum.valorEstimado ?? 0
    }
  },

  async getAnosDisponiveis() {
    const anos = await prisma.licitacao.groupBy({
      by: ['ano'],
      orderBy: { ano: 'desc' }
    })
    return anos.map(entry => entry.ano)
  }
}
