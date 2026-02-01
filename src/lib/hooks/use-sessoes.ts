'use client'

import { useState, useEffect, useCallback } from 'react'
import { sessoesApi, SessaoApi, SessaoFilters, SessaoCreate, SessaoUpdate } from '@/lib/api/sessoes-api'
import { toast } from 'sonner'
import { withRetry } from '@/lib/utils/retry'
import { useStableFilters } from '@/lib/utils/use-stable-filters'

interface UseSessoesReturn {
  sessoes: SessaoApi[]
  loading: boolean
  error: string | null
  meta?: any
  refetch: () => Promise<number>
  create: (data: SessaoCreate) => Promise<SessaoApi | null>
  update: (id: string, data: SessaoUpdate) => Promise<SessaoApi | null>
  remove: (id: string) => Promise<boolean>
}

export function useSessoes(filters?: SessaoFilters): UseSessoesReturn {
  const [sessoes, setSessoes] = useState<SessaoApi[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [meta, setMeta] = useState<any>(null)

  const stableFilters = useStableFilters(filters)

  const fetchSessoes = useCallback(async (): Promise<number> => {
    try {
      setLoading(true)
      setError(null)
      const result = await withRetry(() => sessoesApi.getAll(stableFilters), 3, 1000)
      setSessoes(result.data)
      setMeta(result.meta)
      return result.data.length
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar sessões'
      setError(errorMessage)
      toast.error(errorMessage)
      return 0
    } finally {
      setLoading(false)
    }
  }, [stableFilters])

  useEffect(() => {
    fetchSessoes()
  }, [fetchSessoes])

  const create = useCallback(async (data: SessaoCreate): Promise<SessaoApi | null> => {
    try {
      setError(null)
      const nova = await sessoesApi.create(data)

      // Delay para garantir que o servidor processou completamente
      await new Promise(resolve => setTimeout(resolve, 500))

      await fetchSessoes()
      return nova
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar sessão'
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    }
  }, [fetchSessoes])

  const update = useCallback(async (id: string, data: SessaoUpdate): Promise<SessaoApi | null> => {
    try {
      setError(null)
      const atualizada = await sessoesApi.update(id, data)
      await fetchSessoes()
      return atualizada
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar sessão'
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    }
  }, [fetchSessoes])

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null)
      await sessoesApi.delete(id)
      await fetchSessoes()
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir sessão'
      setError(errorMessage)
      toast.error(errorMessage)
      return false
    }
  }, [fetchSessoes])

  return {
    sessoes,
    loading,
    error,
    meta,
    refetch: async () => {
      return await fetchSessoes()
    },
    create,
    update,
    remove,
  }
}

export function useSessao(id: string | null) {
  const [sessao, setSessao] = useState<SessaoApi | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }

    const fetchSessao = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await sessoesApi.getById(id)
        setSessao(data)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar sessão'
        setError(errorMessage)
        toast.error(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchSessao()
  }, [id])

  return { sessao, loading, error }
}

