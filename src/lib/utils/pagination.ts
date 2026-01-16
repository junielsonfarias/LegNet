/**
 * Utilitário de Paginação Padrão
 * Fornece funções para paginação consistente em todas as APIs
 */

export interface PaginationParams {
  page?: number
  limit?: number
  orderBy?: string
  order?: 'asc' | 'desc'
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: PaginationMeta
}

// Limites padrão e máximos
export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
  ORDER: 'desc' as const
}

/**
 * Extrai parâmetros de paginação da URL
 */
export function extractPaginationParams(searchParams: URLSearchParams): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get('page') || String(PAGINATION_DEFAULTS.PAGE)))
  const limit = Math.min(
    PAGINATION_DEFAULTS.MAX_LIMIT,
    Math.max(1, parseInt(searchParams.get('limit') || String(PAGINATION_DEFAULTS.LIMIT)))
  )
  const orderBy = searchParams.get('orderBy') || undefined
  const order = (searchParams.get('order') as 'asc' | 'desc') || PAGINATION_DEFAULTS.ORDER

  return { page, limit, orderBy, order }
}

/**
 * Calcula offset para query do Prisma
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit
}

/**
 * Cria objeto de paginação para Prisma
 */
export function createPrismaPageArgs(params: PaginationParams): {
  skip: number
  take: number
  orderBy?: Record<string, 'asc' | 'desc'>
} {
  const page = params.page || PAGINATION_DEFAULTS.PAGE
  const limit = params.limit || PAGINATION_DEFAULTS.LIMIT

  const result: { skip: number; take: number; orderBy?: Record<string, 'asc' | 'desc'> } = {
    skip: calculateOffset(page, limit),
    take: limit
  }

  if (params.orderBy) {
    result.orderBy = { [params.orderBy]: params.order || PAGINATION_DEFAULTS.ORDER }
  }

  return result
}

/**
 * Cria metadados de paginação
 */
export function createPaginationMeta(
  total: number,
  page: number,
  limit: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit)

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  }
}

/**
 * Cria resposta paginada completa
 */
export function createPaginatedResponse<T>(
  items: T[],
  total: number,
  params: PaginationParams
): PaginatedResponse<T> {
  const page = params.page || PAGINATION_DEFAULTS.PAGE
  const limit = params.limit || PAGINATION_DEFAULTS.LIMIT

  return {
    items,
    pagination: createPaginationMeta(total, page, limit)
  }
}

/**
 * Helper para paginar array em memória (útil para dados mock)
 */
export function paginateArray<T>(
  items: T[],
  params: PaginationParams
): PaginatedResponse<T> {
  const page = params.page || PAGINATION_DEFAULTS.PAGE
  const limit = params.limit || PAGINATION_DEFAULTS.LIMIT
  const offset = calculateOffset(page, limit)

  const paginatedItems = items.slice(offset, offset + limit)

  return createPaginatedResponse(paginatedItems, items.length, params)
}

/**
 * Ordena array por campo específico
 */
export function sortArray<T>(
  items: T[],
  orderBy: string,
  order: 'asc' | 'desc' = 'desc'
): T[] {
  return [...items].sort((a, b) => {
    const aValue = (a as Record<string, any>)[orderBy]
    const bValue = (b as Record<string, any>)[orderBy]

    if (aValue === bValue) return 0
    if (aValue === null || aValue === undefined) return 1
    if (bValue === null || bValue === undefined) return -1

    // Comparação de datas
    if (aValue instanceof Date && bValue instanceof Date) {
      return order === 'asc'
        ? aValue.getTime() - bValue.getTime()
        : bValue.getTime() - aValue.getTime()
    }

    // Comparação de strings
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return order === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }

    // Comparação numérica
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return order === 'asc' ? aValue - bValue : bValue - aValue
    }

    return 0
  })
}

/**
 * Helper completo: ordena e pagina array
 */
export function sortAndPaginateArray<T>(
  items: T[],
  params: PaginationParams
): PaginatedResponse<T> {
  let sortedItems = items

  if (params.orderBy) {
    sortedItems = sortArray(items, params.orderBy, params.order)
  }

  return paginateArray(sortedItems, params)
}

/**
 * Gera links de navegação para paginação
 */
export function generatePaginationLinks(
  baseUrl: string,
  pagination: PaginationMeta
): {
  first: string
  prev: string | null
  next: string | null
  last: string
} {
  const url = new URL(baseUrl)

  const createLink = (page: number) => {
    url.searchParams.set('page', String(page))
    return url.toString()
  }

  return {
    first: createLink(1),
    prev: pagination.hasPrev ? createLink(pagination.page - 1) : null,
    next: pagination.hasNext ? createLink(pagination.page + 1) : null,
    last: createLink(pagination.totalPages)
  }
}

/**
 * Valida parâmetros de paginação
 */
export function validatePaginationParams(params: PaginationParams): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (params.page !== undefined && (params.page < 1 || !Number.isInteger(params.page))) {
    errors.push('page deve ser um número inteiro maior que 0')
  }

  if (params.limit !== undefined) {
    if (params.limit < 1 || !Number.isInteger(params.limit)) {
      errors.push('limit deve ser um número inteiro maior que 0')
    }
    if (params.limit > PAGINATION_DEFAULTS.MAX_LIMIT) {
      errors.push(`limit não pode ser maior que ${PAGINATION_DEFAULTS.MAX_LIMIT}`)
    }
  }

  if (params.order && !['asc', 'desc'].includes(params.order)) {
    errors.push('order deve ser "asc" ou "desc"')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
