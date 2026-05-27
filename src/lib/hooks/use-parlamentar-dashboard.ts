'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface ParlamentarDashboard {
  parlamentar: {
    id: string
    nome: string
    apelido?: string | null
    cargo: string
    legislatura?: string | null
    ativo: boolean | null
  }
  resumo: {
    totalMandatos: number
    mandatoAtual: any
    comissoesAtivas: number
    mesasAtivas: number
    presencaPercentual: number
    totalVotacoes: number
  }
  presenca: any
  votacoes: any
  mandatos: any[]
  filiacoes: any[]
  comissoes: {
    ativas: any[]
    historico: any[]
  }
  mesas: {
    ativas: any[]
    historico: any[]
  }
  agenda: any[]
}

interface UseParlamentarDashboardReturn {
  dashboard: ParlamentarDashboard | null
  loading: boolean
  error: string | null
}

export const useParlamentarDashboard = (id?: string | null): UseParlamentarDashboardReturn => {
  const [dashboard, setDashboard] = useState<ParlamentarDashboard | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setDashboard(null)
      setLoading(false)
      return
    }

    const controller = new AbortController()

    const fetchDashboard = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/parlamentares/${id}/dashboard`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          cache: 'no-store',
          signal: controller.signal
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data?.error || 'Erro ao carregar painel do parlamentar')
        }

        const payload = await response.json()
        if (controller.signal.aborted) return
        if (payload?.success) {
          setDashboard(payload.data)
        } else {
          setDashboard(null)
          throw new Error(payload?.error || 'Erro desconhecido')
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
        const message = err instanceof Error ? err.message : 'Erro ao carregar painel do parlamentar'
        if (!controller.signal.aborted) {
          setError(message)
          setDashboard(null)
          toast.error(message)
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    fetchDashboard()

    return () => {
      controller.abort()
    }
  }, [id])

  return { dashboard, loading, error }
}

