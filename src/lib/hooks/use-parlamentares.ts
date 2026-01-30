'use client'

import {
  parlamentaresApi,
  ParlamentarApi,
  ParlamentarFilters,
  ParlamentarCreate,
  ParlamentarUpdate
} from '@/lib/api/parlamentares-api'
import { useCrudResource, useSingleResource } from './use-crud-resource'

/**
 * Interface de retorno mantida para compatibilidade com código existente
 */
interface UseParlamentaresReturn {
  parlamentares: ParlamentarApi[]
  loading: boolean
  error: string | null
  meta?: any
  refetch: () => Promise<void>
  create: (data: ParlamentarCreate) => Promise<ParlamentarApi | null>
  update: (id: string, data: ParlamentarUpdate) => Promise<ParlamentarApi | null>
  remove: (id: string) => Promise<boolean>
}

/**
 * Hook para operações CRUD de parlamentares
 * Usa o hook genérico useCrudResource internamente
 *
 * @example
 * ```tsx
 * const { parlamentares, loading, create, update, remove } = useParlamentares({ ativo: true })
 * ```
 */
export function useParlamentares(filters?: ParlamentarFilters): UseParlamentaresReturn {
  const {
    data,
    loading,
    error,
    meta,
    refetch,
    create,
    update,
    remove,
  } = useCrudResource<ParlamentarApi, ParlamentarFilters, ParlamentarCreate, ParlamentarUpdate>(
    {
      api: parlamentaresApi,
      entityName: 'parlamentar',
    },
    filters
  )

  // Retorna com alias para manter compatibilidade
  return {
    parlamentares: data,
    loading,
    error,
    meta,
    refetch,
    create,
    update,
    remove,
  }
}

/**
 * Hook para buscar um parlamentar específico por ID
 *
 * @example
 * ```tsx
 * const { parlamentar, loading, error } = useParlamentar(id)
 * ```
 */
export function useParlamentar(id: string | null) {
  const { data, loading, error } = useSingleResource(
    {
      api: parlamentaresApi,
      entityName: 'parlamentar',
    },
    id
  )

  return {
    parlamentar: data,
    loading,
    error,
  }
}
