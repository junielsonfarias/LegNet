'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

import {
  publicTramitacoesApi,
  type PublicTramitacaoResumo,
  type PublicTramitacaoDetalhe,
  type PublicTramitacaoFilters
} from '@/lib/api/public-tramitacoes-api'
import { withRetry } from '@/lib/utils/retry'
import { useStableFilters } from '@/lib/utils/use-stable-filters'

interface PublicTramitacaoMeta {
  total?: number
  page?: number
  limit?: number
  totalPages?: number
}

interface UsePublicTramitacoesReturn {
  tramitacoes: PublicTramitacaoResumo[]
  loading: boolean
  error: string | null
  meta: PublicTramitacaoMeta | null
  refetch: () => Promise<void>
}

export function usePublicTramitacoes(filters?: PublicTramitacaoFilters): UsePublicTramitacoesReturn {
  const [tramitacoes, setTramitacoes] = useState<PublicTramitacaoResumo[]>([])
  const [meta, setMeta] = useState<PublicTramitacaoMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const stableFilters = useStableFilters(filters)

  const fetchTramitacoes = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await withRetry(
        () => publicTramitacoesApi.list(stableFilters as PublicTramitacaoFilters),
        2,
        500
      )

      setTramitacoes(response.items)
      setMeta(response.meta ?? null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Não foi possível carregar as tramitações.'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [stableFilters])

  useEffect(() => {
    fetchTramitacoes()
  }, [fetchTramitacoes])

  return {
    tramitacoes,
    loading,
    error,
    meta,
    refetch: fetchTramitacoes
  }
}

export function usePublicTramitacao(id: string | null) {
  const [tramitacao, setTramitacao] = useState<PublicTramitacaoDetalhe | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTramitacao = useCallback(async () => {
    if (!id) {
      setTramitacao(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const data = await withRetry(() => publicTramitacoesApi.getById(id), 2, 500)
      setTramitacao(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Não foi possível carregar a tramitação.'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchTramitacao()
  }, [fetchTramitacao])

  return {
    tramitacao,
    loading,
    error,
    refetch: fetchTramitacao
  }
}

