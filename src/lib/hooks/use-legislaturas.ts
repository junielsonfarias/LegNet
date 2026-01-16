'use client'

import { useState, useEffect, useCallback } from 'react'
import { legislaturasApi, LegislaturaApi, LegislaturaFilters, LegislaturaCreate, LegislaturaUpdate } from '@/lib/api/legislaturas-api'
import { toast } from 'sonner'
import { withRetry } from '@/lib/utils/retry'
import { useStableFilters } from '@/lib/utils/use-stable-filters'

interface UseLegislaturasReturn {
  legislaturas: LegislaturaApi[]
  loading: boolean
  error: string | null
  meta: any
  refetch: () => Promise<void>
  create: (data: LegislaturaCreate) => Promise<LegislaturaApi | null>
  update: (id: string, data: LegislaturaUpdate) => Promise<LegislaturaApi | null>
  remove: (id: string) => Promise<boolean>
}

export function useLegislaturas(filters?: LegislaturaFilters): UseLegislaturasReturn {
  const [legislaturas, setLegislaturas] = useState<LegislaturaApi[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [meta, setMeta] = useState<any>(null)

  const stableFilters = useStableFilters(filters)

  const fetchLegislaturas = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await withRetry(() => legislaturasApi.getAll(stableFilters), 3, 1000)
      setLegislaturas(result.data)
      setMeta(result.meta)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar legislaturas'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [stableFilters])

  useEffect(() => {
    fetchLegislaturas()
  }, [fetchLegislaturas])

  const create = useCallback(async (data: LegislaturaCreate): Promise<LegislaturaApi | null> => {
    try {
      const nova = await legislaturasApi.create(data)
      await fetchLegislaturas()
      toast.success('Legislatura criada com sucesso')
      return nova
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar legislatura'
      toast.error(errorMessage)
      return null
    }
  }, [fetchLegislaturas])

  const update = useCallback(async (id: string, data: LegislaturaUpdate): Promise<LegislaturaApi | null> => {
    try {
      const atualizada = await legislaturasApi.update(id, data)
      await fetchLegislaturas()
      toast.success('Legislatura atualizada com sucesso')
      return atualizada
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar legislatura'
      toast.error(errorMessage)
      return null
    }
  }, [fetchLegislaturas])

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      await legislaturasApi.delete(id)
      await fetchLegislaturas()
      toast.success('Legislatura excluída com sucesso')
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir legislatura'
      toast.error(errorMessage)
      return false
    }
  }, [fetchLegislaturas])

  return {
    legislaturas,
    loading,
    error,
    meta,
    refetch: fetchLegislaturas,
    create,
    update,
    remove
  }
}

