/**
 * Repositórios - Camada de Acesso a Dados
 *
 * Este módulo exporta os repositórios que abstraem o Prisma,
 * permitindo operações de banco de dados desacopladas da implementação.
 *
 * @example
 * ```typescript
 * import { getProposicaoRepository } from '@/lib/repositories'
 *
 * const repo = getProposicaoRepository()
 * const proposicoes = await repo.findMany({
 *   filters: { status: 'EM_TRAMITACAO' },
 *   pagination: { page: 1, limit: 10 }
 * })
 * ```
 */

// Base
export {
  type IRepository,
  type ISoftDeleteRepository,
  type IAuditableRepository,
  type PaginationOptions,
  type SortOptions,
  type PaginatedMeta,
  type PaginatedResult,
  type QueryOptions,
  type RepositoryFactory,
  BaseRepository,
  RepositoryRegistry
} from './base-repository'

// Proposição
export {
  type IProposicaoRepository,
  type ProposicaoWithRelations,
  type ProposicaoFilters,
  type ProposicaoSortField,
  type CreateProposicaoInput,
  type UpdateProposicaoInput,
  PrismaProposicaoRepository,
  getProposicaoRepository,
  createProposicaoRepository
} from './proposicao-repository'
