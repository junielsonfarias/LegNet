'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  comissoesApi,
  ComissaoApi,
  ComissaoCreate,
  ComissaoUpdate,
  MembroComissaoApi,
  MembroComissaoCreate,
  MembroComissaoUpdate
} from '@/lib/api/comissoes-api'
import { toast } from 'sonner'
import { withRetry } from '@/lib/utils/retry'
import { useStableFilters } from '@/lib/utils/use-stable-filters'

interface UseComissoesReturn {
  comissoes: ComissaoApi[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  create: (data: ComissaoCreate) => Promise<ComissaoApi | null>
  update: (id: string, data: ComissaoUpdate) => Promise<ComissaoApi | null>
  remove: (id: string) => Promise<boolean>
  addMember: (comissaoId: string, data: MembroComissaoCreate) => Promise<MembroComissaoApi | null>
  updateMember: (comissaoId: string, membroId: string, data: MembroComissaoUpdate) => Promise<MembroComissaoApi | null>
  removeMember: (comissaoId: string, membroId: string) => Promise<boolean>
}

export function useComissoes(filters?: { ativa?: boolean }): UseComissoesReturn {
  const [comissoes, setComissoes] = useState<ComissaoApi[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const stableFilters = useStableFilters(filters)

  const fetchComissoes = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await withRetry(() => comissoesApi.getAll(stableFilters), 3, 1000)
      setComissoes(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar comissões'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [stableFilters])

  useEffect(() => {
    fetchComissoes()
  }, [fetchComissoes])

  const create = useCallback(async (data: ComissaoCreate): Promise<ComissaoApi | null> => {
    try {
      setError(null)
      const nova = await comissoesApi.create(data)
      await fetchComissoes()
      // Toast será mostrado pelo componente que chama
      return nova
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar comissão'
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    }
  }, [fetchComissoes])

  const update = useCallback(async (id: string, data: ComissaoUpdate): Promise<ComissaoApi | null> => {
    try {
      setError(null)
      const atualizada = await comissoesApi.update(id, data)
      await fetchComissoes()
      // Toast será mostrado pelo componente que chama
      return atualizada
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar comissão'
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    }
  }, [fetchComissoes])

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null)
      await comissoesApi.delete(id)
      await fetchComissoes()
      // Toast será mostrado pelo componente que chama
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir comissão'
      setError(errorMessage)
      toast.error(errorMessage)
      return false
    }
  }, [fetchComissoes])

  const addMember = useCallback(async (
    comissaoId: string,
    data: MembroComissaoCreate
  ): Promise<MembroComissaoApi | null> => {
    try {
      setError(null)
      const membro = await comissoesApi.addMember(comissaoId, data)
      await fetchComissoes()
      return membro
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao adicionar membro'
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    }
  }, [fetchComissoes])

  const updateMember = useCallback(async (
    comissaoId: string,
    membroId: string,
    data: MembroComissaoUpdate
  ): Promise<MembroComissaoApi | null> => {
    try {
      setError(null)
      const membro = await comissoesApi.updateMember(comissaoId, membroId, data)
      await fetchComissoes()
      return membro
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar membro'
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    }
  }, [fetchComissoes])

  const removeMember = useCallback(async (
    comissaoId: string,
    membroId: string
  ): Promise<boolean> => {
    try {
      setError(null)
      await comissoesApi.removeMember(comissaoId, membroId)
      await fetchComissoes()
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao remover membro'
      setError(errorMessage)
      toast.error(errorMessage)
      return false
    }
  }, [fetchComissoes])

  return {
    comissoes,
    loading,
    error,
    refetch: fetchComissoes,
    create,
    update,
    remove,
    addMember,
    updateMember,
    removeMember
  }
}

export function useComissao(id: string | null) {
  const [comissao, setComissao] = useState<ComissaoApi | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }

    const fetchComissao = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await comissoesApi.getById(id)
        setComissao(data)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar comissão'
        setError(errorMessage)
        toast.error(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchComissao()
  }, [id])

  return { comissao, loading, error }
}

