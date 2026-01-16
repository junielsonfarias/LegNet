'use client'

import { useState, useEffect, useCallback } from 'react'
import { parlamentaresApi, ParlamentarApi, ParlamentarFilters, ParlamentarCreate, ParlamentarUpdate } from '@/lib/api/parlamentares-api'
import { toast } from 'sonner'
import { withRetry } from '@/lib/utils/retry'
import { useStableFilters } from '@/lib/utils/use-stable-filters'

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

export function useParlamentares(filters?: ParlamentarFilters): UseParlamentaresReturn {
  const [parlamentares, setParlamentares] = useState<ParlamentarApi[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [meta, setMeta] = useState<any>(null)

  const stableFilters = useStableFilters(filters)

  const fetchParlamentares = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await withRetry(() => parlamentaresApi.getAll(stableFilters), 3, 1000)
      setParlamentares(result.data)
      setMeta(result.meta)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar parlamentares'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [stableFilters])

  useEffect(() => {
    fetchParlamentares()
  }, [fetchParlamentares])

  const create = useCallback(async (data: ParlamentarCreate): Promise<ParlamentarApi | null> => {
    try {
      setError(null)
      const novo = await parlamentaresApi.create(data)
      await fetchParlamentares()
      // Toast será mostrado pelo componente que chama
      return novo
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar parlamentar'
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    }
  }, [fetchParlamentares])

  const update = useCallback(async (id: string, data: ParlamentarUpdate): Promise<ParlamentarApi | null> => {
    try {
      setError(null)
      const atualizado = await parlamentaresApi.update(id, data)
      await fetchParlamentares()
      // Toast será mostrado pelo componente que chama
      return atualizado
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar parlamentar'
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    }
  }, [fetchParlamentares])

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null)
      await parlamentaresApi.delete(id)
      await fetchParlamentares()
      // Toast será mostrado pelo componente que chama
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir parlamentar'
      setError(errorMessage)
      toast.error(errorMessage)
      return false
    }
  }, [fetchParlamentares])

  return {
    parlamentares,
    loading,
    error,
    meta,
    refetch: fetchParlamentares,
    create,
    update,
    remove,
  }
}

export function useParlamentar(id: string | null) {
  const [parlamentar, setParlamentar] = useState<ParlamentarApi | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }

    const fetchParlamentar = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await parlamentaresApi.getById(id)
        setParlamentar(data)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar parlamentar'
        setError(errorMessage)
        toast.error(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchParlamentar()
  }, [id])

  return { parlamentar, loading, error }
}

