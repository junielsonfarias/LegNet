'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

import {
  tramitacoesApi,
  tramitacaoRegrasApi,
  TramitacaoApi,
  TramitacaoCreate,
  TramitacaoUpdate,
  TramitacaoFilters,
  TramitacaoRegraApi,
  TramitacaoRegraPayload,
  TramitacaoDashboardApi,
  TramitacaoAdvancePayload,
  TramitacaoAdvanceResponse,
  TramitacaoReopenPayload,
  TramitacaoFinalizePayload
} from '@/lib/api/tramitacoes-api'
import { withRetry } from '@/lib/utils/retry'
import { useStableFilters } from '@/lib/utils/use-stable-filters'

interface TramitacaoListMeta {
  total?: number
  page?: number
  limit?: number
  totalPages?: number
}

interface UseTramitacoesReturn {
  tramitacoes: TramitacaoApi[]
  loading: boolean
  error: string | null
  meta: TramitacaoListMeta | null
  refetch: () => Promise<void>
  create: (payload: TramitacaoCreate) => Promise<TramitacaoApi | null>
  update: (id: string, payload: TramitacaoUpdate) => Promise<TramitacaoApi | null>
  remove: (id: string) => Promise<boolean>
  advance: (id: string, payload?: TramitacaoAdvancePayload) => Promise<TramitacaoAdvanceResponse | null>
  reopen: (id: string, payload?: TramitacaoReopenPayload) => Promise<TramitacaoApi | null>
  finalize: (id: string, payload?: TramitacaoFinalizePayload) => Promise<TramitacaoApi | null>
}

export function useTramitacoes(filters?: TramitacaoFilters): UseTramitacoesReturn {
  const [tramitacoes, setTramitacoes] = useState<TramitacaoApi[]>([])
  const [meta, setMeta] = useState<TramitacaoListMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const stableFilters = useStableFilters(filters)

  const fetchTramitacoes = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await withRetry(
        () => tramitacoesApi.list(stableFilters as TramitacaoFilters),
        3,
        1000
      )

      setTramitacoes(response.data)
      setMeta({
        total: response.total ?? response.meta?.total,
        page: response.meta?.page,
        limit: response.meta?.limit,
        totalPages: response.meta?.totalPages
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar tramitações'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [stableFilters])

  useEffect(() => {
    fetchTramitacoes()
  }, [fetchTramitacoes])

  const create = useCallback(async (payload: TramitacaoCreate): Promise<TramitacaoApi | null> => {
    try {
      setError(null)
      const created = await tramitacoesApi.create(payload)
      await fetchTramitacoes()
      return created
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar tramitação'
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    }
  }, [fetchTramitacoes])

  const update = useCallback(async (id: string, payload: TramitacaoUpdate): Promise<TramitacaoApi | null> => {
    try {
      setError(null)
      const updated = await tramitacoesApi.update(id, payload)
      await fetchTramitacoes()
      return updated
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar tramitação'
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    }
  }, [fetchTramitacoes])

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null)
      await tramitacoesApi.delete(id)
      await fetchTramitacoes()
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao remover tramitação'
      setError(errorMessage)
      toast.error(errorMessage)
      return false
    }
  }, [fetchTramitacoes])

  const advance = useCallback(
    async (id: string, payload: TramitacaoAdvancePayload = {}): Promise<TramitacaoAdvanceResponse | null> => {
      try {
        setError(null)
        const resultado = await tramitacoesApi.advance(id, payload)
        await fetchTramitacoes()
        return resultado
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao avançar tramitação'
        setError(errorMessage)
        toast.error(errorMessage)
        return null
      }
    },
    [fetchTramitacoes]
  )

  const reopen = useCallback(
    async (id: string, payload: TramitacaoReopenPayload = {}): Promise<TramitacaoApi | null> => {
      try {
        setError(null)
        const resultado = await tramitacoesApi.reopen(id, payload)
        await fetchTramitacoes()
        return resultado
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao reabrir tramitação'
        setError(errorMessage)
        toast.error(errorMessage)
        return null
      }
    },
    [fetchTramitacoes]
  )

  const finalize = useCallback(
    async (id: string, payload: TramitacaoFinalizePayload = {}): Promise<TramitacaoApi | null> => {
      try {
        setError(null)
        const resultado = await tramitacoesApi.finalize(id, payload)
        await fetchTramitacoes()
        return resultado
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao finalizar tramitação'
        setError(errorMessage)
        toast.error(errorMessage)
        return null
      }
    },
    [fetchTramitacoes]
  )

  return {
    tramitacoes,
    loading,
    error,
    meta,
    refetch: fetchTramitacoes,
    create,
    update,
    remove,
    advance,
    reopen,
    finalize
  }
}

export function useTramitacao(id: string | null) {
  const [tramitacao, setTramitacao] = useState<TramitacaoApi | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setTramitacao(null)
      setLoading(false)
      return
    }

    const fetchTramitacao = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await tramitacoesApi.getById(id)
        setTramitacao(data)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar tramitação'
        setError(errorMessage)
        toast.error(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchTramitacao()
  }, [id])

  const refetch = useCallback(async () => {
    if (!id) return

    try {
      setLoading(true)
      const data = await tramitacoesApi.getById(id)
      setTramitacao(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar tramitação'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [id])

  const advance = useCallback(
    async (payload: TramitacaoAdvancePayload = {}): Promise<TramitacaoAdvanceResponse | null> => {
      if (!id) return null
      try {
        setError(null)
        const resultado = await tramitacoesApi.advance(id, payload)
        await refetch()
        return resultado
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao avançar tramitação'
        setError(errorMessage)
        toast.error(errorMessage)
        return null
      }
    },
    [id, refetch]
  )

  const reopen = useCallback(
    async (payload: TramitacaoReopenPayload = {}): Promise<TramitacaoApi | null> => {
      if (!id) return null
      try {
        setError(null)
        const resultado = await tramitacoesApi.reopen(id, payload)
        await refetch()
        return resultado
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao reabrir tramitação'
        setError(errorMessage)
        toast.error(errorMessage)
        return null
      }
    },
    [id, refetch]
  )

  const finalize = useCallback(
    async (payload: TramitacaoFinalizePayload = {}): Promise<TramitacaoApi | null> => {
      if (!id) return null
      try {
        setError(null)
        const resultado = await tramitacoesApi.finalize(id, payload)
        await refetch()
        return resultado
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao finalizar tramitação'
        setError(errorMessage)
        toast.error(errorMessage)
        return null
      }
    },
    [id, refetch]
  )

  return { tramitacao, loading, error, refetch, advance, reopen, finalize }
}

interface UseTramitacaoRegrasReturn {
  regras: TramitacaoRegraApi[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  create: (payload: TramitacaoRegraPayload) => Promise<TramitacaoRegraApi | null>
  update: (id: string, payload: TramitacaoRegraPayload) => Promise<TramitacaoRegraApi | null>
  remove: (id: string) => Promise<boolean>
}

export function useTramitacaoRegras(filters?: { ativo?: boolean }): UseTramitacaoRegrasReturn {
  const [regras, setRegras] = useState<TramitacaoRegraApi[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const stableFilters = useStableFilters(filters)

  const fetchRegras = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await withRetry(
        () => tramitacaoRegrasApi.list(stableFilters as { ativo?: boolean }),
        3,
        1000
      )
      setRegras(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar regras de tramitação'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [stableFilters])

  useEffect(() => {
    fetchRegras()
  }, [fetchRegras])

  const create = useCallback(async (payload: TramitacaoRegraPayload): Promise<TramitacaoRegraApi | null> => {
    try {
      setError(null)
      const created = await tramitacaoRegrasApi.create(payload)
      await fetchRegras()
      return created
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar regra de tramitação'
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    }
  }, [fetchRegras])

  const update = useCallback(async (id: string, payload: TramitacaoRegraPayload): Promise<TramitacaoRegraApi | null> => {
    try {
      setError(null)
      const updated = await tramitacaoRegrasApi.update(id, payload)
      await fetchRegras()
      return updated
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar regra de tramitação'
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    }
  }, [fetchRegras])

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null)
      await tramitacaoRegrasApi.delete(id)
      await fetchRegras()
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao remover regra de tramitação'
      setError(errorMessage)
      toast.error(errorMessage)
      return false
    }
  }, [fetchRegras])

  return {
    regras,
    loading,
    error,
    refetch: fetchRegras,
    create,
    update,
    remove
  }
}

export function useTramitacaoDashboard() {
  const [dashboard, setDashboard] = useState<TramitacaoDashboardApi | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const data = await withRetry(
        () => tramitacoesApi.getDashboard(),
        3,
        1000
      )

      setDashboard(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar dashboard de tramitação'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  return {
    dashboard,
    loading,
    error,
    refetch: fetchDashboard
  }
}


