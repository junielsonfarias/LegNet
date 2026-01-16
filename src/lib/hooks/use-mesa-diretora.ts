'use client'

import { useState, useEffect, useCallback } from 'react'
import { mesaDiretoraApi, MesaDiretoraApi, MesaDiretoraFilters, MesaDiretoraCreate, MesaDiretoraUpdate } from '@/lib/api/mesa-diretora-api'
import { toast } from 'sonner'
import { withRetry } from '@/lib/utils/retry'
import { useStableFilters } from '@/lib/utils/use-stable-filters'

interface UseMesaDiretoraReturn {
  mesas: MesaDiretoraApi[]
  loading: boolean
  error: string | null
  meta?: any
  refetch: () => Promise<void>
  create: (data: MesaDiretoraCreate) => Promise<MesaDiretoraApi | null>
  update: (id: string, data: MesaDiretoraUpdate) => Promise<MesaDiretoraApi | null>
  remove: (id: string) => Promise<boolean>
}

export function useMesaDiretora(filters?: MesaDiretoraFilters): UseMesaDiretoraReturn {
  const [mesas, setMesas] = useState<MesaDiretoraApi[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [meta, setMeta] = useState<any>(null)

  const stableFilters = useStableFilters(filters)

  const fetchMesas = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await withRetry(() => mesaDiretoraApi.getAll(stableFilters), 3, 1000)
      setMesas(result.data)
      setMeta(result.meta)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar mesas diretora'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [stableFilters])

  useEffect(() => {
    fetchMesas()
  }, [fetchMesas])

  const create = useCallback(async (data: MesaDiretoraCreate): Promise<MesaDiretoraApi | null> => {
    try {
      setError(null)
      const nova = await mesaDiretoraApi.create(data)
      await fetchMesas()
      toast.success('Mesa diretora criada com sucesso')
      return nova
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar mesa diretora'
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    }
  }, [fetchMesas])

  const update = useCallback(async (id: string, data: MesaDiretoraUpdate): Promise<MesaDiretoraApi | null> => {
    try {
      setError(null)
      const atualizada = await mesaDiretoraApi.update(id, data)
      await fetchMesas()
      toast.success('Mesa diretora atualizada com sucesso')
      return atualizada
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar mesa diretora'
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    }
  }, [fetchMesas])

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null)
      await mesaDiretoraApi.delete(id)
      await fetchMesas()
      toast.success('Mesa diretora excluída com sucesso')
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir mesa diretora'
      setError(errorMessage)
      toast.error(errorMessage)
      return false
    }
  }, [fetchMesas])

  return {
    mesas,
    loading,
    error,
    meta,
    refetch: fetchMesas,
    create,
    update,
    remove,
  }
}

export function useMesaDiretoraById(id: string | null) {
  const [mesa, setMesa] = useState<MesaDiretoraApi | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }

    const fetchMesa = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await mesaDiretoraApi.getById(id)
        setMesa(data)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar mesa diretora'
        setError(errorMessage)
        toast.error(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchMesa()
  }, [id])

  return { mesa, loading, error }
}

