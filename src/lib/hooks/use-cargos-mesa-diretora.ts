'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

export interface CargoMesaDiretoraApi {
  id: string
  periodoId: string
  nome: string
  ordem: number
  obrigatorio: boolean
  periodo?: {
    id: string
    numero: number
  }
}

export interface CargoMesaDiretoraCreate {
  periodoId: string
  nome: string
  ordem: number
  obrigatorio?: boolean
}

interface UseCargosMesaDiretoraReturn {
  cargos: CargoMesaDiretoraApi[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  create: (data: CargoMesaDiretoraCreate) => Promise<CargoMesaDiretoraApi | null>
}

export function useCargosMesaDiretora(periodoId?: string): UseCargosMesaDiretoraReturn {
  const [cargos, setCargos] = useState<CargoMesaDiretoraApi[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCargos = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = periodoId ? `?periodoId=${periodoId}` : ''
      const response = await fetch(`/api/cargos-mesa-diretora${params}`, {
        cache: 'no-store'
      })
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao carregar cargos')
      }
      
      setCargos(data.data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar cargos'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [periodoId])

  useEffect(() => {
    fetchCargos()
  }, [fetchCargos])

  const create = useCallback(async (data: CargoMesaDiretoraCreate): Promise<CargoMesaDiretoraApi | null> => {
    try {
      setError(null)
      const response = await fetch('/api/cargos-mesa-diretora', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      const result = await response.json()
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao criar cargo')
      }
      
      await fetchCargos()
      toast.success('Cargo criado com sucesso')
      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar cargo'
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    }
  }, [fetchCargos])

  return {
    cargos,
    loading,
    error,
    refetch: fetchCargos,
    create,
  }
}

