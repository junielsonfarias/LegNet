'use client'

import {
  proposicoesApi,
  ProposicaoApi,
  ProposicaoFilters,
  ProposicaoCreate,
  ProposicaoUpdate
} from '@/lib/api/proposicoes-api'
import { useCrudResource, useSingleResource } from './use-crud-resource'

/**
 * Interface de retorno mantida para compatibilidade com código existente
 */
interface UseProposicoesReturn {
  proposicoes: ProposicaoApi[]
  loading: boolean
  error: string | null
  meta?: any
  refetch: () => Promise<void>
  create: (data: ProposicaoCreate) => Promise<ProposicaoApi | null>
  update: (id: string, data: ProposicaoUpdate) => Promise<ProposicaoApi | null>
  remove: (id: string) => Promise<boolean>
}

/**
 * Hook para operações CRUD de proposições
 * Usa o hook genérico useCrudResource internamente
 *
 * @example
 * ```tsx
 * const { proposicoes, loading, create, update, remove } = useProposicoes({ status: 'EM_TRAMITACAO' })
 * ```
 */
export function useProposicoes(filters?: ProposicaoFilters): UseProposicoesReturn {
  const {
    data,
    loading,
    error,
    meta,
    refetch,
    create,
    update,
    remove,
  } = useCrudResource<ProposicaoApi, ProposicaoFilters, ProposicaoCreate, ProposicaoUpdate>(
    {
      api: proposicoesApi,
      entityName: 'proposição',
    },
    filters
  )

  return {
    proposicoes: data,
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
 * Hook para buscar uma proposição específica por ID
 *
 * @example
 * ```tsx
 * const { proposicao, loading, error } = useProposicao(id)
 * ```
 */
export function useProposicao(id: string | null) {
  const { data, loading, error } = useSingleResource(
    {
      api: proposicoesApi,
      entityName: 'proposição',
    },
    id
  )

  return {
    proposicao: data,
    loading,
    error,
  }
}
