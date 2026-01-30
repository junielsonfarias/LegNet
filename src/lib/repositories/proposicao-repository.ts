/**
 * Repository para Proposições
 * Implementa operações de acesso a dados para proposições legislativas
 */

import { prisma } from '@/lib/prisma'
import {
  BaseRepository,
  PaginatedResult,
  QueryOptions
} from './base-repository'
import type {
  Proposicao,
  TipoProposicao,
  StatusProposicao,
  ResultadoVotacao,
  Prisma
} from '@prisma/client'

// ============================================================
// TIPOS
// ============================================================

/**
 * Proposição com relacionamentos básicos
 */
export interface ProposicaoWithRelations extends Proposicao {
  autor?: {
    id: string
    nome: string
    apelido: string | null
    partido: string | null
  }
  sessao?: {
    id: string
    numero: number
    data: Date
  } | null
  _count?: {
    votacoes: number
    tramitacoes: number
    pareceres: number
    emendas: number
  }
}

/**
 * Filtros para consulta de proposições
 */
export interface ProposicaoFilters {
  status?: StatusProposicao | StatusProposicao[]
  tipo?: TipoProposicao | TipoProposicao[]
  autorId?: string
  ano?: number
  resultado?: ResultadoVotacao
  search?: string
  sessaoId?: string
  dataInicio?: Date
  dataFim?: Date
}

/**
 * Campos de ordenação permitidos
 */
export type ProposicaoSortField =
  | 'dataApresentacao'
  | 'createdAt'
  | 'numero'
  | 'updatedAt'

/**
 * Dados para criação de proposição
 */
export interface CreateProposicaoInput {
  numero: string
  ano: number
  tipo: TipoProposicao
  titulo: string
  ementa: string
  texto?: string
  urlDocumento?: string
  status?: StatusProposicao
  dataApresentacao: Date
  autorId: string
  sessaoId?: string
}

/**
 * Dados para atualização de proposição
 */
export interface UpdateProposicaoInput {
  numero?: string
  titulo?: string
  ementa?: string
  texto?: string
  urlDocumento?: string
  status?: StatusProposicao
  dataVotacao?: Date | null
  resultado?: ResultadoVotacao | null
  sessaoId?: string | null
  sessaoVotacaoId?: string | null
}

// ============================================================
// INTERFACE DO REPOSITÓRIO
// ============================================================

/**
 * Interface para o repositório de proposições
 */
export interface IProposicaoRepository {
  findById(id: string, include?: string[]): Promise<ProposicaoWithRelations | null>
  findBySlug(slug: string): Promise<ProposicaoWithRelations | null>
  findByNumeroAno(numero: string, ano: number): Promise<ProposicaoWithRelations | null>
  findMany(options?: QueryOptions<ProposicaoFilters, ProposicaoSortField>): Promise<PaginatedResult<ProposicaoWithRelations>>
  findAll(filter?: ProposicaoFilters): Promise<ProposicaoWithRelations[]>
  findByAutor(autorId: string, options?: QueryOptions<ProposicaoFilters, ProposicaoSortField>): Promise<PaginatedResult<ProposicaoWithRelations>>
  findBySessao(sessaoId: string): Promise<ProposicaoWithRelations[]>
  count(filter?: ProposicaoFilters): Promise<number>
  countByStatus(): Promise<Record<StatusProposicao, number>>
  countByTipo(): Promise<Record<TipoProposicao, number>>
  exists(filter: Partial<ProposicaoFilters>): Promise<boolean>
  create(data: CreateProposicaoInput): Promise<ProposicaoWithRelations>
  update(id: string, data: UpdateProposicaoInput): Promise<ProposicaoWithRelations>
  updateStatus(id: string, status: StatusProposicao): Promise<ProposicaoWithRelations>
  delete(id: string): Promise<void>
  generateSlug(tipo: TipoProposicao, numero: string, ano: number): string
  getNextNumero(tipo: TipoProposicao, ano: number): Promise<string>
}

// ============================================================
// IMPLEMENTAÇÃO
// ============================================================

/**
 * Implementação do repositório de proposições usando Prisma
 */
export class PrismaProposicaoRepository
  extends BaseRepository<ProposicaoWithRelations, CreateProposicaoInput, UpdateProposicaoInput, ProposicaoFilters, ProposicaoSortField>
  implements IProposicaoRepository {

  /**
   * Inclui padrão para relacionamentos
   */
  private readonly defaultInclude: Prisma.ProposicaoInclude = {
    autor: {
      select: {
        id: true,
        nome: true,
        apelido: true,
        partido: true
      }
    },
    sessao: {
      select: {
        id: true,
        numero: true,
        data: true
      }
    },
    _count: {
      select: {
        votacoes: true,
        tramitacoes: true,
        pareceres: true,
        emendas: true
      }
    }
  }

  /**
   * Converte filtros para where clause do Prisma
   */
  private buildWhereClause(filters?: ProposicaoFilters): Prisma.ProposicaoWhereInput {
    if (!filters) return {}

    const where: Prisma.ProposicaoWhereInput = {}

    if (filters.status) {
      where.status = Array.isArray(filters.status)
        ? { in: filters.status }
        : filters.status
    }

    if (filters.tipo) {
      where.tipo = Array.isArray(filters.tipo)
        ? { in: filters.tipo }
        : filters.tipo
    }

    if (filters.autorId) {
      where.autorId = filters.autorId
    }

    if (filters.ano) {
      where.ano = filters.ano
    }

    if (filters.resultado) {
      where.resultado = filters.resultado
    }

    if (filters.sessaoId) {
      where.sessaoId = filters.sessaoId
    }

    if (filters.dataInicio || filters.dataFim) {
      where.dataApresentacao = {}
      if (filters.dataInicio) {
        where.dataApresentacao.gte = filters.dataInicio
      }
      if (filters.dataFim) {
        where.dataApresentacao.lte = filters.dataFim
      }
    }

    if (filters.search) {
      const searchTerm = filters.search.trim()
      where.OR = [
        { numero: { contains: searchTerm, mode: 'insensitive' } },
        { titulo: { contains: searchTerm, mode: 'insensitive' } },
        { ementa: { contains: searchTerm, mode: 'insensitive' } }
      ]
    }

    return where
  }

  // ============================================================
  // IMPLEMENTAÇÃO DOS MÉTODOS
  // ============================================================

  async findById(id: string, include?: string[]): Promise<ProposicaoWithRelations | null> {
    // Se include for passado, usamos apenas os campos especificados
    // Caso contrário, usamos o include padrão
    const includeConfig = include
      ? Object.fromEntries(include.map(field => [field, true]))
      : this.defaultInclude

    return prisma.proposicao.findUnique({
      where: { id },
      include: includeConfig
    }) as Promise<ProposicaoWithRelations | null>
  }

  async findBySlug(slug: string): Promise<ProposicaoWithRelations | null> {
    return prisma.proposicao.findUnique({
      where: { slug },
      include: this.defaultInclude
    }) as Promise<ProposicaoWithRelations | null>
  }

  async findByNumeroAno(numero: string, ano: number): Promise<ProposicaoWithRelations | null> {
    return prisma.proposicao.findUnique({
      where: { numero_ano: { numero, ano } },
      include: this.defaultInclude
    }) as Promise<ProposicaoWithRelations | null>
  }

  async findOne(filter: Partial<ProposicaoFilters>): Promise<ProposicaoWithRelations | null> {
    return prisma.proposicao.findFirst({
      where: this.buildWhereClause(filter as ProposicaoFilters),
      include: this.defaultInclude
    }) as Promise<ProposicaoWithRelations | null>
  }

  async findMany(
    options?: QueryOptions<ProposicaoFilters, ProposicaoSortField>
  ): Promise<PaginatedResult<ProposicaoWithRelations>> {
    const where = this.buildWhereClause(options?.filters)
    const skip = this.calculateSkip(options?.pagination)
    const take = options?.pagination?.limit || 20
    const orderBy = this.buildOrderBy(options?.sort, 'dataApresentacao', 'desc')

    const [data, total] = await Promise.all([
      prisma.proposicao.findMany({
        where,
        include: this.defaultInclude,
        skip,
        take,
        orderBy
      }),
      prisma.proposicao.count({ where })
    ])

    return {
      data: data as ProposicaoWithRelations[],
      meta: this.calculatePagination(total, options?.pagination)
    }
  }

  async findAll(filter?: ProposicaoFilters): Promise<ProposicaoWithRelations[]> {
    return prisma.proposicao.findMany({
      where: this.buildWhereClause(filter),
      include: this.defaultInclude,
      orderBy: { dataApresentacao: 'desc' }
    }) as Promise<ProposicaoWithRelations[]>
  }

  async findByAutor(
    autorId: string,
    options?: QueryOptions<ProposicaoFilters, ProposicaoSortField>
  ): Promise<PaginatedResult<ProposicaoWithRelations>> {
    return this.findMany({
      ...options,
      filters: { ...options?.filters, autorId }
    })
  }

  async findBySessao(sessaoId: string): Promise<ProposicaoWithRelations[]> {
    return prisma.proposicao.findMany({
      where: {
        OR: [
          { sessaoId },
          { sessaoVotacaoId: sessaoId }
        ]
      },
      include: this.defaultInclude,
      orderBy: { dataApresentacao: 'asc' }
    }) as Promise<ProposicaoWithRelations[]>
  }

  async count(filter?: ProposicaoFilters): Promise<number> {
    return prisma.proposicao.count({
      where: this.buildWhereClause(filter)
    })
  }

  async countByStatus(): Promise<Record<StatusProposicao, number>> {
    const results = await prisma.proposicao.groupBy({
      by: ['status'],
      _count: { status: true }
    })

    const counts: Partial<Record<StatusProposicao, number>> = {}
    for (const result of results) {
      counts[result.status] = result._count.status
    }

    return counts as Record<StatusProposicao, number>
  }

  async countByTipo(): Promise<Record<TipoProposicao, number>> {
    const results = await prisma.proposicao.groupBy({
      by: ['tipo'],
      _count: { tipo: true }
    })

    const counts: Partial<Record<TipoProposicao, number>> = {}
    for (const result of results) {
      counts[result.tipo] = result._count.tipo
    }

    return counts as Record<TipoProposicao, number>
  }

  async exists(filter: Partial<ProposicaoFilters>): Promise<boolean> {
    const count = await prisma.proposicao.count({
      where: this.buildWhereClause(filter as ProposicaoFilters),
      take: 1
    })
    return count > 0
  }

  async create(data: CreateProposicaoInput): Promise<ProposicaoWithRelations> {
    const slug = this.generateSlug(data.tipo, data.numero, data.ano)

    return prisma.proposicao.create({
      data: {
        ...data,
        slug,
        status: data.status || 'APRESENTADA'
      },
      include: this.defaultInclude
    }) as Promise<ProposicaoWithRelations>
  }

  async createMany(data: CreateProposicaoInput[]): Promise<ProposicaoWithRelations[]> {
    // Prisma createMany não retorna os registros criados, então criamos um por um
    const results: ProposicaoWithRelations[] = []
    for (const item of data) {
      const created = await this.create(item)
      results.push(created)
    }
    return results
  }

  async update(id: string, data: UpdateProposicaoInput): Promise<ProposicaoWithRelations> {
    return prisma.proposicao.update({
      where: { id },
      data,
      include: this.defaultInclude
    }) as Promise<ProposicaoWithRelations>
  }

  async updateStatus(id: string, status: StatusProposicao): Promise<ProposicaoWithRelations> {
    return this.update(id, { status })
  }

  async updateMany(filter: Partial<ProposicaoFilters>, data: UpdateProposicaoInput): Promise<number> {
    const result = await prisma.proposicao.updateMany({
      where: this.buildWhereClause(filter as ProposicaoFilters),
      data
    })
    return result.count
  }

  async delete(id: string): Promise<void> {
    await prisma.proposicao.delete({ where: { id } })
  }

  async deleteMany(filter: Partial<ProposicaoFilters>): Promise<number> {
    const result = await prisma.proposicao.deleteMany({
      where: this.buildWhereClause(filter as ProposicaoFilters)
    })
    return result.count
  }

  async upsert(
    where: Partial<ProposicaoFilters>,
    create: CreateProposicaoInput,
    update: UpdateProposicaoInput
  ): Promise<ProposicaoWithRelations> {
    // Prisma upsert precisa de unique fields, então buscamos primeiro
    const existing = await this.findOne(where)

    if (existing) {
      return this.update(existing.id, update)
    }

    return this.create(create)
  }

  /**
   * Gera slug para proposição
   */
  generateSlug(tipo: TipoProposicao, numero: string, ano: number): string {
    const siglas: Record<TipoProposicao, string> = {
      PROJETO_LEI: 'pl',
      PROJETO_RESOLUCAO: 'pr',
      PROJETO_DECRETO: 'pd',
      INDICACAO: 'ind',
      REQUERIMENTO: 'req',
      MOCAO: 'moc',
      VOTO_PESAR: 'vp',
      VOTO_APLAUSO: 'va'
    }

    const sigla = siglas[tipo] || tipo.toLowerCase().replace(/_/g, '-')
    const numFormatado = numero.padStart(4, '0')

    return `${sigla}-${numFormatado}-${ano}`
  }

  /**
   * Obtém próximo número disponível para tipo/ano
   */
  async getNextNumero(tipo: TipoProposicao, ano: number): Promise<string> {
    const count = await prisma.proposicao.count({
      where: { tipo, ano }
    })

    return String(count + 1).padStart(3, '0')
  }
}

// ============================================================
// SINGLETON E FACTORY
// ============================================================

let _instance: PrismaProposicaoRepository | null = null

/**
 * Retorna instância singleton do repositório de proposições
 */
export function getProposicaoRepository(): IProposicaoRepository {
  if (!_instance) {
    _instance = new PrismaProposicaoRepository()
  }
  return _instance
}

/**
 * Cria nova instância do repositório (útil para testes)
 */
export function createProposicaoRepository(): IProposicaoRepository {
  return new PrismaProposicaoRepository()
}
