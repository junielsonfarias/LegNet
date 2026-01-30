'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { withRetry } from '@/lib/utils/retry'
import { useStableFilters } from '@/lib/utils/use-stable-filters'

/**
 * Interface para API client padrão CRUD
 * Cada API deve implementar esses métodos para ser compatível com o hook genérico
 */
export interface CrudApiClient<T, TFilters, TCreate, TUpdate> {
  getAll: (filters?: TFilters) => Promise<{ data: T[]; meta?: any }>
  getById?: (id: string) => Promise<T>
  create: (data: TCreate) => Promise<T>
  update: (id: string, data: TUpdate) => Promise<T>
  delete: (id: string) => Promise<void>
}

/**
 * Configuração do hook CRUD genérico
 */
export interface UseCrudResourceOptions<T, TFilters, TCreate, TUpdate> {
  /** Cliente da API com métodos CRUD */
  api: CrudApiClient<T, TFilters, TCreate, TUpdate>
  /** Nome da entidade para mensagens de erro (ex: "parlamentar", "proposição") */
  entityName: string
  /** Transformação opcional dos dados recebidos */
  transformResponse?: (data: T[]) => T[]
  /** Se deve executar fetch inicial automaticamente (padrão: true) */
  autoFetch?: boolean
  /** Número de retries para fetch (padrão: 3) */
  retryCount?: number
  /** Delay entre retries em ms (padrão: 1000) */
  retryDelay?: number
}

/**
 * Retorno do hook CRUD genérico
 */
export interface UseCrudResourceReturn<T, TCreate, TUpdate> {
  /** Lista de itens */
  data: T[]
  /** Indica se está carregando */
  loading: boolean
  /** Mensagem de erro, se houver */
  error: string | null
  /** Metadados da resposta (paginação, totais, etc) */
  meta: any
  /** Recarrega os dados */
  refetch: () => Promise<void>
  /** Cria um novo item */
  create: (data: TCreate) => Promise<T | null>
  /** Atualiza um item existente */
  update: (id: string, data: TUpdate) => Promise<T | null>
  /** Remove um item */
  remove: (id: string) => Promise<boolean>
}

/**
 * Hook genérico para operações CRUD
 * Elimina duplicação de código entre hooks similares (parlamentares, proposições, etc)
 *
 * @example
 * ```tsx
 * // Uso básico
 * const { data, loading, create } = useCrudResource({
 *   api: parlamentaresApi,
 *   entityName: 'parlamentar'
 * }, filters)
 *
 * // Com tipagem específica
 * const resultado = useCrudResource<Parlamentar, ParlamentarFilters, ParlamentarCreate, ParlamentarUpdate>({
 *   api: parlamentaresApi,
 *   entityName: 'parlamentar',
 *   transformResponse: (data) => data.filter(p => p.ativo)
 * }, filters)
 * ```
 */
export function useCrudResource<T, TFilters extends object | undefined, TCreate, TUpdate>(
  options: UseCrudResourceOptions<T, TFilters, TCreate, TUpdate>,
  filters?: TFilters
): UseCrudResourceReturn<T, TCreate, TUpdate> {
  const {
    api,
    entityName,
    transformResponse,
    autoFetch = true,
    retryCount = 3,
    retryDelay = 1000,
  } = options

  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(autoFetch)
  const [error, setError] = useState<string | null>(null)
  const [meta, setMeta] = useState<any>(null)

  const stableFilters = useStableFilters(filters)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await withRetry(
        () => api.getAll(stableFilters),
        retryCount,
        retryDelay
      )
      const items = transformResponse ? transformResponse(result.data) : result.data
      setData(items)
      setMeta(result.meta)
    } catch (err) {
      const errorMessage = err instanceof Error
        ? err.message
        : `Erro ao carregar ${entityName}`
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [api, entityName, stableFilters, transformResponse, retryCount, retryDelay])

  useEffect(() => {
    if (autoFetch) {
      fetchData()
    }
  }, [fetchData, autoFetch])

  const create = useCallback(async (createData: TCreate): Promise<T | null> => {
    try {
      setError(null)
      const novo = await api.create(createData)
      await fetchData()
      return novo
    } catch (err) {
      const errorMessage = err instanceof Error
        ? err.message
        : `Erro ao criar ${entityName}`
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    }
  }, [api, entityName, fetchData])

  const update = useCallback(async (id: string, updateData: TUpdate): Promise<T | null> => {
    try {
      setError(null)
      const atualizado = await api.update(id, updateData)
      await fetchData()
      return atualizado
    } catch (err) {
      const errorMessage = err instanceof Error
        ? err.message
        : `Erro ao atualizar ${entityName}`
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    }
  }, [api, entityName, fetchData])

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null)
      await api.delete(id)
      await fetchData()
      return true
    } catch (err) {
      const errorMessage = err instanceof Error
        ? err.message
        : `Erro ao excluir ${entityName}`
      setError(errorMessage)
      toast.error(errorMessage)
      return false
    }
  }, [api, entityName, fetchData])

  return {
    data,
    loading,
    error,
    meta,
    refetch: fetchData,
    create,
    update,
    remove,
  }
}

/**
 * Retorno do hook para item único
 */
export interface UseSingleResourceReturn<T> {
  /** Item carregado */
  data: T | null
  /** Indica se está carregando */
  loading: boolean
  /** Mensagem de erro, se houver */
  error: string | null
  /** Recarrega o item */
  refetch: () => Promise<void>
}

/**
 * Hook genérico para buscar um único recurso por ID
 *
 * @example
 * ```tsx
 * const { data: parlamentar, loading } = useSingleResource({
 *   api: parlamentaresApi,
 *   entityName: 'parlamentar'
 * }, id)
 * ```
 */
export function useSingleResource<T, TFilters, TCreate, TUpdate>(
  options: {
    api: CrudApiClient<T, TFilters, TCreate, TUpdate>
    entityName: string
  },
  id: string | null
): UseSingleResourceReturn<T> {
  const { api, entityName } = options
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!id) {
      setLoading(false)
      setData(null)
      return
    }

    if (!api.getById) {
      setError(`API de ${entityName} não suporta busca por ID`)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const result = await api.getById(id)
      setData(result)
    } catch (err) {
      const errorMessage = err instanceof Error
        ? err.message
        : `Erro ao carregar ${entityName}`
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [api, entityName, id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

/**
 * Factory function para criar hooks tipados específicos para cada entidade
 * Facilita a criação de hooks especializados mantendo consistência
 *
 * @example
 * ```tsx
 * // Criar factory para parlamentares
 * const createParlamentaresHook = createCrudHookFactory<
 *   Parlamentar,
 *   ParlamentarFilters,
 *   ParlamentarCreate,
 *   ParlamentarUpdate
 * >({
 *   api: parlamentaresApi,
 *   entityName: 'parlamentar'
 * })
 *
 * // Usar em componentes
 * function Component() {
 *   const { data, loading } = createParlamentaresHook(filters)
 * }
 * ```
 */
export function createCrudHookFactory<T, TFilters extends object | undefined, TCreate, TUpdate>(
  baseOptions: Omit<UseCrudResourceOptions<T, TFilters, TCreate, TUpdate>, 'transformResponse'>
) {
  return function useCreatedHook(
    filters?: TFilters,
    additionalOptions?: Partial<UseCrudResourceOptions<T, TFilters, TCreate, TUpdate>>
  ) {
    return useCrudResource<T, TFilters, TCreate, TUpdate>(
      { ...baseOptions, ...additionalOptions },
      filters
    )
  }
}
