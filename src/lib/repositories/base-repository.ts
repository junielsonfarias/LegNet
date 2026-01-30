/**
 * Base Repository Pattern
 * Abstrai operações de acesso a dados para desacoplar serviços do Prisma
 *
 * Benefícios:
 * - Testabilidade: Permite criar mocks facilmente
 * - Flexibilidade: Pode trocar implementação (ex: Prisma por outro ORM)
 * - Encapsulamento: Lógica de acesso a dados isolada
 * - Padronização: Interface consistente para todas entidades
 */

/**
 * Opções de paginação
 */
export interface PaginationOptions {
  page?: number
  limit?: number
  skip?: number
}

/**
 * Opções de ordenação
 */
export interface SortOptions<TSort extends string = string> {
  orderBy?: TSort
  order?: 'asc' | 'desc'
}

/**
 * Metadados de resposta paginada
 */
export interface PaginatedMeta {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

/**
 * Resultado de consulta paginada
 */
export interface PaginatedResult<T> {
  data: T[]
  meta: PaginatedMeta
}

/**
 * Opções de consulta combinadas
 */
export interface QueryOptions<TFilter, TSort extends string = string> {
  filters?: TFilter
  pagination?: PaginationOptions
  sort?: SortOptions<TSort>
  include?: string[]
}

/**
 * Interface base para repositórios
 * Define operações CRUD padrão
 */
export interface IRepository<TEntity, TCreate, TUpdate, TFilter, TSort extends string = string> {
  /**
   * Busca uma entidade por ID
   */
  findById(id: string, include?: string[]): Promise<TEntity | null>

  /**
   * Busca uma entidade por critérios únicos
   */
  findOne(filter: Partial<TFilter>, include?: string[]): Promise<TEntity | null>

  /**
   * Busca todas as entidades com filtros e paginação
   */
  findMany(options?: QueryOptions<TFilter, TSort>): Promise<PaginatedResult<TEntity>>

  /**
   * Busca todas as entidades sem paginação (usar com cuidado)
   */
  findAll(filter?: Partial<TFilter>, include?: string[]): Promise<TEntity[]>

  /**
   * Conta entidades que correspondem ao filtro
   */
  count(filter?: Partial<TFilter>): Promise<number>

  /**
   * Verifica se existe entidade que corresponde ao filtro
   */
  exists(filter: Partial<TFilter>): Promise<boolean>

  /**
   * Cria uma nova entidade
   */
  create(data: TCreate): Promise<TEntity>

  /**
   * Cria múltiplas entidades
   */
  createMany(data: TCreate[]): Promise<TEntity[]>

  /**
   * Atualiza uma entidade existente
   */
  update(id: string, data: TUpdate): Promise<TEntity>

  /**
   * Atualiza múltiplas entidades
   */
  updateMany(filter: Partial<TFilter>, data: TUpdate): Promise<number>

  /**
   * Remove uma entidade
   */
  delete(id: string): Promise<void>

  /**
   * Remove múltiplas entidades
   */
  deleteMany(filter: Partial<TFilter>): Promise<number>

  /**
   * Cria ou atualiza uma entidade (upsert)
   */
  upsert(where: Partial<TFilter>, create: TCreate, update: TUpdate): Promise<TEntity>
}

/**
 * Classe abstrata base para implementações de repositório
 * Fornece utilitários comuns
 */
export abstract class BaseRepository<TEntity, TCreate, TUpdate, TFilter, TSort extends string = string>
  implements IRepository<TEntity, TCreate, TUpdate, TFilter, TSort> {

  /**
   * Calcula metadados de paginação
   */
  protected calculatePagination(
    total: number,
    options?: PaginationOptions
  ): PaginatedMeta {
    const page = options?.page || 1
    const limit = options?.limit || 20
    const totalPages = Math.ceil(total / limit)

    return {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1
    }
  }

  /**
   * Calcula skip para paginação
   */
  protected calculateSkip(options?: PaginationOptions): number {
    if (options?.skip !== undefined) {
      return options.skip
    }
    const page = options?.page || 1
    const limit = options?.limit || 20
    return (page - 1) * limit
  }

  /**
   * Converte sort options para formato Prisma
   */
  protected buildOrderBy(
    sort?: SortOptions<TSort>,
    defaultOrderBy: string = 'createdAt',
    defaultOrder: 'asc' | 'desc' = 'desc'
  ): Record<string, 'asc' | 'desc'> {
    const orderBy = sort?.orderBy || defaultOrderBy
    const order = sort?.order || defaultOrder
    return { [orderBy]: order }
  }

  // Métodos abstratos que devem ser implementados pelas classes concretas
  abstract findById(id: string, include?: string[]): Promise<TEntity | null>
  abstract findOne(filter: Partial<TFilter>, include?: string[]): Promise<TEntity | null>
  abstract findMany(options?: QueryOptions<TFilter, TSort>): Promise<PaginatedResult<TEntity>>
  abstract findAll(filter?: Partial<TFilter>, include?: string[]): Promise<TEntity[]>
  abstract count(filter?: Partial<TFilter>): Promise<number>
  abstract exists(filter: Partial<TFilter>): Promise<boolean>
  abstract create(data: TCreate): Promise<TEntity>
  abstract createMany(data: TCreate[]): Promise<TEntity[]>
  abstract update(id: string, data: TUpdate): Promise<TEntity>
  abstract updateMany(filter: Partial<TFilter>, data: TUpdate): Promise<number>
  abstract delete(id: string): Promise<void>
  abstract deleteMany(filter: Partial<TFilter>): Promise<number>
  abstract upsert(where: Partial<TFilter>, create: TCreate, update: TUpdate): Promise<TEntity>
}

/**
 * Interface para repositório com soft delete
 */
export interface ISoftDeleteRepository<TEntity> {
  /**
   * Remove logicamente (soft delete)
   */
  softDelete(id: string): Promise<TEntity>

  /**
   * Restaura uma entidade removida
   */
  restore(id: string): Promise<TEntity>

  /**
   * Busca incluindo removidos
   */
  findWithDeleted(id: string): Promise<TEntity | null>
}

/**
 * Interface para repositório com auditoria
 */
export interface IAuditableRepository<TEntity, TAudit> {
  /**
   * Busca histórico de alterações
   */
  getAuditHistory(entityId: string): Promise<TAudit[]>

  /**
   * Busca versão específica
   */
  getVersion(entityId: string, version: number): Promise<TEntity | null>
}

/**
 * Factory type para criar repositórios
 */
export type RepositoryFactory<TRepo> = () => TRepo

/**
 * Registro de repositórios para dependency injection
 */
export class RepositoryRegistry {
  private static instance: RepositoryRegistry
  private repositories: Map<string, unknown> = new Map()

  private constructor() {}

  static getInstance(): RepositoryRegistry {
    if (!RepositoryRegistry.instance) {
      RepositoryRegistry.instance = new RepositoryRegistry()
    }
    return RepositoryRegistry.instance
  }

  /**
   * Registra um repositório
   */
  register<T>(name: string, repository: T): void {
    this.repositories.set(name, repository)
  }

  /**
   * Obtém um repositório registrado
   */
  get<T>(name: string): T {
    const repo = this.repositories.get(name)
    if (!repo) {
      throw new Error(`Repository "${name}" not registered`)
    }
    return repo as T
  }

  /**
   * Verifica se repositório está registrado
   */
  has(name: string): boolean {
    return this.repositories.has(name)
  }

  /**
   * Remove registro de repositório
   */
  unregister(name: string): void {
    this.repositories.delete(name)
  }

  /**
   * Limpa todos os registros (útil para testes)
   */
  clear(): void {
    this.repositories.clear()
  }
}
