import { prisma } from '@/lib/prisma'
import type { TipoSessao } from '@prisma/client'

export interface TemplateSessaoFilters {
  tipo?: TipoSessao
  ativo?: boolean
  includeItems?: boolean
}

export interface TemplateItemPayload {
  secao: string
  ordem?: number
  titulo: string
  descricao?: string | null
  tempoEstimado?: number | null
  tipoProposicao?: string | null
  obrigatorio?: boolean
}

export interface TemplateSessaoPayload {
  nome: string
  descricao?: string | null
  tipo: TipoSessao
  ativo?: boolean
  duracaoEstimativa?: number | null
  itens: TemplateItemPayload[]
}

export const templatesSessaoDbService = {
  async list(filters: TemplateSessaoFilters = {}) {
    const where: any = {}
    if (filters.tipo) where.tipo = filters.tipo
    if (filters.ativo !== undefined) where.ativo = filters.ativo

    return prisma.sessaoTemplate.findMany({
      where,
      orderBy: { nome: 'asc' },
      include: filters.includeItems ? { itens: { orderBy: { ordem: 'asc' } } } : undefined
    })
  },

  async getById(id: string) {
    return prisma.sessaoTemplate.findUnique({
      where: { id },
      include: { itens: { orderBy: { ordem: 'asc' } } }
    })
  },

  async checkDuplicate(nome: string, tipo: TipoSessao, excludeId?: string) {
    const where: any = { nome, tipo }
    if (excludeId) where.id = { not: excludeId }
    return prisma.sessaoTemplate.findFirst({ where })
  },

  async create(payload: TemplateSessaoPayload) {
    return prisma.sessaoTemplate.create({
      data: {
        nome: payload.nome,
        descricao: payload.descricao || null,
        tipo: payload.tipo,
        ativo: payload.ativo ?? true,
        duracaoEstimativa: payload.duracaoEstimativa ?? null,
        itens: {
          create: payload.itens.map((item, index) => ({
            secao: item.secao,
            ordem: item.ordem ?? index + 1,
            titulo: item.titulo,
            descricao: item.descricao || null,
            tempoEstimado: item.tempoEstimado ?? null,
            tipoProposicao: item.tipoProposicao || null,
            obrigatorio: item.obrigatorio ?? false
          }))
        }
      },
      include: { itens: { orderBy: { ordem: 'asc' } } }
    })
  },

  async update(id: string, payload: Partial<TemplateSessaoPayload>) {
    const data: any = {}
    if (payload.nome !== undefined) data.nome = payload.nome
    if (payload.descricao !== undefined) data.descricao = payload.descricao || null
    if (payload.tipo !== undefined) data.tipo = payload.tipo
    if (payload.ativo !== undefined) data.ativo = payload.ativo
    if (payload.duracaoEstimativa !== undefined) data.duracaoEstimativa = payload.duracaoEstimativa

    if (payload.itens) {
      await prisma.templateItem.deleteMany({ where: { templateId: id } })
      data.itens = {
        create: payload.itens.map((item, index) => ({
          secao: item.secao,
          ordem: item.ordem ?? index + 1,
          titulo: item.titulo,
          descricao: item.descricao || null,
          tempoEstimado: item.tempoEstimado ?? null,
          tipoProposicao: item.tipoProposicao || null,
          obrigatorio: item.obrigatorio ?? false
        }))
      }
    }

    return prisma.sessaoTemplate.update({
      where: { id },
      data,
      include: { itens: { orderBy: { ordem: 'asc' } } }
    })
  },

  async remove(id: string) {
    await prisma.sessaoTemplate.delete({ where: { id } })
    return { success: true }
  }
}
