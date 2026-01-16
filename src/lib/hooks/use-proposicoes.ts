'use client'

import { useState, useEffect, useCallback } from 'react'
import { proposicoesApi, ProposicaoApi, ProposicaoFilters, ProposicaoCreate, ProposicaoUpdate } from '@/lib/api/proposicoes-api'
import { toast } from 'sonner'
import { withRetry } from '@/lib/utils/retry'
import { useStableFilters } from '@/lib/utils/use-stable-filters'

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

export function useProposicoes(filters?: ProposicaoFilters): UseProposicoesReturn {
  const [proposicoes, setProposicoes] = useState<ProposicaoApi[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [meta, setMeta] = useState<any>(null)

  const stableFilters = useStableFilters(filters)

  const fetchProposicoes = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await withRetry(() => proposicoesApi.getAll(stableFilters), 3, 1000)
      setProposicoes(result.data)
      setMeta(result.meta)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar proposições'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [stableFilters])

  useEffect(() => {
    fetchProposicoes()
  }, [fetchProposicoes])

  const create = useCallback(async (data: ProposicaoCreate): Promise<ProposicaoApi | null> => {
    try {
      setError(null)
      const nova = await proposicoesApi.create(data)
      await fetchProposicoes()
      return nova
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar proposição'
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    }
  }, [fetchProposicoes])

  const update = useCallback(async (id: string, data: ProposicaoUpdate): Promise<ProposicaoApi | null> => {
    try {
      setError(null)
      const atualizada = await proposicoesApi.update(id, data)
      await fetchProposicoes()
      return atualizada
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar proposição'
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    }
  }, [fetchProposicoes])

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null)
      await proposicoesApi.delete(id)
      await fetchProposicoes()
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir proposição'
      setError(errorMessage)
      toast.error(errorMessage)
      return false
    }
  }, [fetchProposicoes])

  return {
    proposicoes,
    loading,
    error,
    meta,
    refetch: fetchProposicoes,
    create,
    update,
    remove,
  }
}

export function useProposicao(id: string | null) {
  const [proposicao, setProposicao] = useState<ProposicaoApi | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }

    const fetchProposicao = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await proposicoesApi.getById(id)
        setProposicao(data)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar proposição'
        setError(errorMessage)
        toast.error(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchProposicao()
  }, [id])

  return { proposicao, loading, error }
}

