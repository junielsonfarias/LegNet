/**
 * Servico de banco de dados para Proposicoes
 * Centraliza todas as operacoes Prisma de proposicoes
 */

import { prisma } from '@/lib/prisma'
import type { StatusProposicao, ResultadoVotacao } from '@prisma/client'
import { isSlugProposicao, parseSlugProposicao, gerarSlugProposicao } from '@/lib/utils/proposicao-slug'
import { ValidationError } from '@/lib/error-handler'

/**
 * Transicoes de status permitidas para proposicoes
 * Mapa: status atual -> lista de status destino validos
 */
const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  'APRESENTADA': ['EM_TRAMITACAO', 'RETIRADA', 'ARQUIVADA'],
  'EM_TRAMITACAO': ['AGUARDANDO_PAUTA', 'RETIRADA', 'ARQUIVADA'],
  'AGUARDANDO_PAUTA': ['EM_PAUTA', 'EM_TRAMITACAO', 'RETIRADA', 'ARQUIVADA'],
  'EM_PAUTA': ['EM_DISCUSSAO', 'AGUARDANDO_PAUTA', 'RETIRADA', 'ADIADA'],
  'EM_DISCUSSAO': ['EM_VOTACAO', 'EM_PAUTA', 'RETIRADA', 'ADIADA'],
  'EM_VOTACAO': ['APROVADA', 'REJEITADA', 'EM_DISCUSSAO', 'ADIADA'],
  'APROVADA': ['SANCIONADA', 'VETADA', 'PROMULGADA', 'ARQUIVADA'],
  'REJEITADA': ['ARQUIVADA'],
  'SANCIONADA': ['PROMULGADA'],
  'VETADA': ['SANCIONADA', 'ARQUIVADA'],
  'PROMULGADA': [],
  'ARQUIVADA': [],
  'RETIRADA': ['ARQUIVADA'],
}

export interface ProposicaoListFilters {
  status?: string
  tipo?: string
  autorId?: string
  ano?: number
}

export interface ProposicaoCreateData {
  slug: string
  numero: string
  ano: number
  tipo: string
  titulo: string
  ementa: string
  texto?: string | null
  urlDocumento?: string | null
  status: string
  dataApresentacao: Date
  dataVotacao?: Date | null
  resultado?: string | null
  sessaoId?: string | null
  autorId: string
  regime?: string
}

export interface ProposicaoUpdateData {
  slug?: string
  numero?: string
  ano?: number
  tipo?: string
  titulo?: string
  ementa?: string
  texto?: string
  urlDocumento?: string | null
  status?: string
  dataApresentacao?: Date
  dataVotacao?: Date | null
  resultado?: string
  sessaoId?: string
  autorId?: string
  regime?: string
}

const defaultAutorSelect = {
  id: true,
  nome: true,
  apelido: true,
  partido: true
}

const defaultSessaoSelect = {
  id: true,
  numero: true,
  data: true
}

export const proposicaoDbService = {
  async list(
    filters: ProposicaoListFilters = {},
    options: { page?: number; limit?: number } = {}
  ) {
    const page = Math.max(1, options.page ?? 1)
    const limit = Math.min(500, Math.max(1, options.limit ?? 50))
    const where: any = {}

    if (filters.status) where.status = filters.status
    if (filters.tipo) where.tipo = filters.tipo
    if (filters.autorId) where.autorId = filters.autorId
    if (filters.ano) where.ano = filters.ano

    const [proposicoes, total] = await Promise.all([
      prisma.proposicao.findMany({
        where,
        include: {
          autor: { select: defaultAutorSelect },
          sessao: { select: defaultSessaoSelect }
        },
        orderBy: { dataApresentacao: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.proposicao.count({ where })
    ])

    return { proposicoes, total, page, limit, totalPages: Math.ceil(total / limit) }
  },

  /**
   * Busca proposicao por ID tecnico ou slug amigavel
   * Tambem tenta buscar por numero/ano/tipo se o slug nao encontrar
   */
  async findByIdOrSlug(idOrSlug: string) {
    if (isSlugProposicao(idOrSlug)) {
      // Primeiro tenta buscar pelo slug armazenado
      try {
        const bySlug = await prisma.proposicao.findUnique({
          where: { slug: idOrSlug }
        })
        if (bySlug) return bySlug
      } catch {
        // Campo slug pode nao existir no banco ainda
      }

      // Fallback: busca por numero/ano/tipo
      const parsed = parseSlugProposicao(idOrSlug)
      if (parsed) {
        const numeroSemZeros = parsed.numero.replace(/^0+/, '') || '0'
        return prisma.proposicao.findFirst({
          where: {
            OR: [
              { numero: parsed.numero, ano: parsed.ano, tipo: parsed.tipo as any },
              { numero: numeroSemZeros, ano: parsed.ano, tipo: parsed.tipo as any }
            ]
          }
        })
      }

      return null
    }

    return prisma.proposicao.findUnique({ where: { id: idOrSlug } })
  },

  /**
   * Busca proposicao por ID ou slug com includes completos para GET
   */
  async getByIdOrSlug(idOrSlug: string) {
    const includeConfig = {
      autor: { select: { ...defaultAutorSelect, foto: true } },
      sessao: { select: defaultSessaoSelect },
      sessaoVotacao: { select: defaultSessaoSelect },
      tramitacoes: {
        orderBy: { dataEntrada: 'desc' as const },
        include: {
          tipoTramitacao: { select: { nome: true } },
          unidade: { select: { nome: true, sigla: true } }
        }
      },
      votacoes: {
        include: {
          parlamentar: { select: { id: true, nome: true, apelido: true, partido: true } }
        },
        orderBy: { createdAt: 'asc' as const }
      },
      votacoesAgrupadas: {
        orderBy: { turno: 'asc' as const }
      },
      emendas: {
        include: {
          autor: { select: { id: true, nome: true, apelido: true, partido: true } }
        },
        orderBy: { numero: 'asc' as const }
      },
      pareceres: {
        include: {
          comissao: { select: { id: true, nome: true, sigla: true } },
          relator: { select: { id: true, nome: true, apelido: true } }
        },
        orderBy: { dataDistribuicao: 'desc' as const }
      },
      pautaItens: {
        include: {
          pauta: {
            select: {
              sessao: { select: { id: true, numero: true, data: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' as const },
        take: 5
      }
    }

    if (isSlugProposicao(idOrSlug)) {
      // Primeiro tenta buscar pelo slug armazenado
      try {
        const bySlug = await prisma.proposicao.findUnique({
          where: { slug: idOrSlug },
          include: includeConfig
        })
        if (bySlug) return bySlug
      } catch {
        // Campo slug pode nao existir no banco ainda
      }

      // Fallback: busca por numero/ano/tipo
      const parsed = parseSlugProposicao(idOrSlug)
      if (parsed) {
        const numeroSemZeros = parsed.numero.replace(/^0+/, '') || '0'
        return prisma.proposicao.findFirst({
          where: {
            OR: [
              { numero: parsed.numero, ano: parsed.ano, tipo: parsed.tipo as any },
              { numero: numeroSemZeros, ano: parsed.ano, tipo: parsed.tipo as any }
            ]
          },
          include: includeConfig
        })
      }

      return null
    }

    return prisma.proposicao.findFirst({
      where: { id: idOrSlug },
      include: includeConfig
    })
  },

  async checkDuplicate(tipo: string, numero: string, ano: number, excludeId?: string) {
    const found = await prisma.proposicao.findUnique({
      where: { tipo_numero_ano: { tipo, numero, ano } }
    })
    if (found && excludeId && found.id === excludeId) return null
    return found
  },

  async checkAutorExists(autorId: string) {
    // Busca em Parlamentar (autorId legado) OU em Autor (autorEntidadeId novo)
    const parlamentar = await prisma.parlamentar.findUnique({ where: { id: autorId } })
    if (parlamentar) return parlamentar
    const autor = await prisma.autor.findUnique({ where: { id: autorId } })
    return autor
  },

  async create(data: ProposicaoCreateData) {
    return prisma.proposicao.create({
      data: {
        slug: data.slug,
        numero: data.numero,
        ano: data.ano,
        tipo: data.tipo,
        titulo: data.titulo,
        ementa: data.ementa,
        texto: data.texto || null,
        urlDocumento: data.urlDocumento || null,
        status: (data.status || 'APRESENTADA') as StatusProposicao,
        dataApresentacao: data.dataApresentacao,
        dataVotacao: data.dataVotacao || null,
        resultado: (data.resultado || null) as ResultadoVotacao | null,
        sessaoId: data.sessaoId || null,
        autorId: data.autorId,
        regime: data.regime || 'NORMAL'
      },
      include: {
        autor: {
          select: { id: true, nome: true, apelido: true }
        }
      }
    })
  },

  async update(id: string, data: ProposicaoUpdateData) {
    // Validar transicao de status se status esta sendo alterado
    if (data.status !== undefined) {
      const current = await prisma.proposicao.findUnique({
        where: { id },
        select: { status: true }
      })

      if (current && data.status !== current.status) {
        const currentStatus = current.status as string
        const allowed = VALID_STATUS_TRANSITIONS[currentStatus]

        if (!allowed || !allowed.includes(data.status)) {
          throw new ValidationError(
            `Transição de status inválida: ${currentStatus} → ${data.status}`
          )
        }
      }
    }

    // Filtrar campos undefined para evitar sobrescrever com null
    const updateFields: Record<string, any> = {}
    if (data.slug !== undefined) updateFields.slug = data.slug
    if (data.numero !== undefined) updateFields.numero = data.numero
    if (data.ano !== undefined) updateFields.ano = data.ano
    if (data.tipo !== undefined) updateFields.tipo = data.tipo
    if (data.titulo !== undefined) updateFields.titulo = data.titulo
    if (data.ementa !== undefined) updateFields.ementa = data.ementa
    if (data.texto !== undefined) updateFields.texto = data.texto
    if (data.urlDocumento !== undefined) updateFields.urlDocumento = data.urlDocumento
    if (data.status !== undefined) updateFields.status = data.status as StatusProposicao
    if (data.dataApresentacao !== undefined) updateFields.dataApresentacao = data.dataApresentacao
    if (data.dataVotacao !== undefined) updateFields.dataVotacao = data.dataVotacao
    if (data.resultado !== undefined) updateFields.resultado = data.resultado as ResultadoVotacao
    if (data.sessaoId !== undefined) updateFields.sessaoId = data.sessaoId
    if (data.autorId !== undefined) updateFields.autorId = data.autorId
    if (data.regime !== undefined) updateFields.regime = data.regime

    return prisma.proposicao.update({
      where: { id },
      data: updateFields,
      include: {
        autor: {
          select: { id: true, nome: true, apelido: true }
        }
      }
    })
  },

  async remove(id: string) {
    await prisma.proposicao.delete({ where: { id } })
    return { success: true }
  },

  /**
   * Reverte status de proposicoes de EM_PAUTA para AGUARDANDO_PAUTA
   */
  async revertStatusPauta(proposicoesIds: string[]) {
    if (proposicoesIds.length === 0) return { count: 0 }
    return prisma.proposicao.updateMany({
      where: { id: { in: proposicoesIds }, status: 'EM_PAUTA' },
      data: { status: 'AGUARDANDO_PAUTA' }
    })
  },

  /**
   * Lista proposicoes para API publica de integracoes
   */
  async listPublic(filters: {
    status?: string
    tipo?: string
    autorId?: string
    ano?: number
    limit?: number
  }) {
    const where: any = {}
    if (filters.status) where.status = filters.status
    if (filters.tipo) where.tipo = filters.tipo
    if (filters.autorId) where.autorId = filters.autorId
    if (filters.ano) where.ano = filters.ano

    return prisma.proposicao.findMany({
      where,
      orderBy: { dataApresentacao: 'desc' },
      take: filters.limit || 50,
      include: {
        autor: {
          select: { id: true, nome: true, apelido: true, partido: true }
        },
        votacoes: {
          select: { id: true, voto: true, parlamentarId: true, createdAt: true }
        }
      }
    })
  }
}
