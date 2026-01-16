'use client'

import { useCallback, useEffect, useState } from 'react'

import { HistoricoParticipacaoApi, parlamentaresApi } from '@/lib/api/parlamentares-api'
import { withRetry } from '@/lib/utils/retry'
import { toast } from 'sonner'

interface UseParlamentarHistoricoReturn {
  historico: HistoricoParticipacaoApi[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useParlamentarHistorico(parlamentarId: string | null): UseParlamentarHistoricoReturn {
  const [historico, setHistorico] = useState<HistoricoParticipacaoApi[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchHistorico = useCallback(async () => {
    if (!parlamentarId) {
      setHistorico([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await withRetry(() => parlamentaresApi.getHistorico(parlamentarId), 3, 500)
      setHistorico(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar histórico do parlamentar'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [parlamentarId])

  useEffect(() => {
    fetchHistorico()
  }, [fetchHistorico])

  return {
    historico,
    loading,
    error,
    refetch: fetchHistorico
  }
}

