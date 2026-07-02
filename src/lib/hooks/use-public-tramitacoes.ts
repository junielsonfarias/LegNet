'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'

import { withRetry } from '@/lib/utils/retry'
import { useStableFilters } from '@/lib/utils/use-stable-filters'

export interface PublicTramitacaoResumo {
  id: string
  proposicaoId: string
  proposicaoNumero?: string | null
  proposicaoTitulo?: string | null
  autor?: {
    id: string
    nome: string
    partido?: string | null
  } | null
  status: string
  resultado?: string | null
  dataEntrada: string
  dataSaida?: string | null
  unidade?: {
    id: string
    nome: string
    sigla?: string | null
  } | null
  tipo?: {
    id: string
    nome: string
  } | null
  observacoes?: string | null
  parecer?: string | null
  prazoVencimento?: string | null
  diasVencidos?: number | null
}

export interface PublicTramitacaoDetalhe extends PublicTramitacaoResumo {
  historicos: Array<{
    id: string
    data: string
    acao: string
    descricao?: string | null
    usuarioId?: string | null
    dadosAnteriores?: unknown
    dadosNovos?: unknown
  }>
}

export interface PublicTramitacaoFilters {
  status?: string
  resultado?: string
  autorId?: string
  search?: string
  from?: string
  to?: string
  page?: number
  limit?: number
}

interface PublicTramitacaoMeta {
  total?: number
  page?: number
  limit?: number
  totalPages?: number
}

export function usePublicTramitacoes(filters?: PublicTramitacaoFilters) {
  const [tramitacoes, setTramitacoes] = useState<PublicTramitacaoResumo[]>([])
  const [meta, setMeta] = useState<PublicTramitacaoMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const stableFilters = useStableFilters(filters)

  const fetchTramitacoes = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      const f = stableFilters as PublicTramitacaoFilters | undefined
      if (f?.status) params.set('status', f.status)
      if (f?.resultado) params.set('resultado', f.resultado)
      if (f?.autorId) params.set('autorId', f.autorId)
      if (f?.search) params.set('search', f.search)
      if (f?.from) params.set('from', f.from)
      if (f?.to) params.set('to', f.to)
      if (f?.page) params.set('page', String(f.page))
      if (f?.limit) params.set('limit', String(f.limit))

      const response = await withRetry(
        async () => {
          const res = await fetch(`/api/publico/tramitacoes?${params.toString()}`, {
            signal: controller.signal
          })
          if (!res.ok) throw new Error('Erro ao carregar tramitações')
          return res.json()
        },
        2,
        500
      )

      if (controller.signal.aborted) return
      if (response.success) {
        setTramitacoes(response.data?.items ?? response.data ?? [])
        setMeta(response.meta ?? response.data?.meta ?? null)
      } else {
        throw new Error(response.error || 'Erro ao carregar tramitações')
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      const errorMessage = err instanceof Error ? err.message : 'Não foi possível carregar as tramitações.'
      if (!controller.signal.aborted) {
        setError(errorMessage)
        toast.error(errorMessage)
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }, [stableFilters])

  useEffect(() => {
    fetchTramitacoes()
    return () => {
      abortRef.current?.abort()
    }
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
  const abortRef = useRef<AbortController | null>(null)

  const fetchTramitacao = useCallback(async () => {
    if (!id) {
      setTramitacao(null)
      setLoading(false)
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      setLoading(true)
      setError(null)

      const response = await withRetry(
        async () => {
          const res = await fetch(`/api/publico/tramitacoes/${id}`, {
            signal: controller.signal
          })
          if (!res.ok) throw new Error('Erro ao carregar tramitação')
          return res.json()
        },
        2,
        500
      )

      if (controller.signal.aborted) return
      if (response.success) {
        setTramitacao(response.data)
      } else {
        throw new Error(response.error || 'Erro ao carregar tramitação')
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      const errorMessage = err instanceof Error ? err.message : 'Não foi possível carregar a tramitação.'
      if (!controller.signal.aborted) {
        setError(errorMessage)
        toast.error(errorMessage)
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchTramitacao()
    return () => {
      abortRef.current?.abort()
    }
  }, [fetchTramitacao])

  return {
    tramitacao,
    loading,
    error,
    refetch: fetchTramitacao
  }
}
