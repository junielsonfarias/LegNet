'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { withRetry } from '@/lib/utils/retry'

export interface PeriodoLegislaturaApi {
  id: string
  legislaturaId: string
  numero: number
  dataInicio: string
  dataFim: string | null
  descricao: string | null
  legislatura?: {
    id: string
    numero: number
    anoInicio: number
    anoFim: number
  }
  cargos?: Array<{
    id: string
    nome: string
    ordem: number
    obrigatorio: boolean
  }>
}

export interface PeriodoLegislaturaCreate {
  legislaturaId: string
  numero: number
  dataInicio: string
  dataFim?: string
  descricao?: string
}

interface UsePeriodosLegislaturaReturn {
  periodos: PeriodoLegislaturaApi[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  create: (data: PeriodoLegislaturaCreate) => Promise<PeriodoLegislaturaApi | null>
}

export function usePeriodosLegislatura(legislaturaId?: string): UsePeriodosLegislaturaReturn {
  const [periodos, setPeriodos] = useState<PeriodoLegislaturaApi[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPeriodos = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = legislaturaId ? `?legislaturaId=${legislaturaId}` : ''
      const response = await fetch(`/api/periodos-legislatura${params}`, {
        cache: 'no-store'
      })
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao carregar períodos')
      }
      
      setPeriodos(data.data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar períodos'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [legislaturaId])

  useEffect(() => {
    fetchPeriodos()
  }, [fetchPeriodos])

  const create = useCallback(async (data: PeriodoLegislaturaCreate): Promise<PeriodoLegislaturaApi | null> => {
    try {
      setError(null)
      const response = await fetch('/api/periodos-legislatura', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      const result = await response.json()
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao criar período')
      }
      
      await fetchPeriodos()
      toast.success('Período criado com sucesso')
      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar período'
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    }
  }, [fetchPeriodos])

  return {
    periodos,
    loading,
    error,
    refetch: fetchPeriodos,
    create,
  }
}

