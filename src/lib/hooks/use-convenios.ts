'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'

export interface Convenio {
  id: string
  numero: string
  ano: number
  convenente: string
  cnpjConvenente: string | null
  orgaoConcedente: string
  objeto: string
  programa: string | null
  acao: string | null
  valorTotal: number
  valorRepasse: number | null
  valorContrapartida: number | null
  dataCelebracao: string
  vigenciaInicio: string
  vigenciaFim: string
  responsavelTecnico: string | null
  situacao: string
  fonteRecurso: string | null
  arquivo: string | null
  observacoes: string | null
  createdAt: string
  updatedAt: string
}

export interface ConvenioFilters {
  situacao?: string
  ano?: number
  convenente?: string
  orgaoConcedente?: string
  page?: number
  limit?: number
}

export function useConvenios(filters?: ConvenioFilters) {
  const [convenios, setConvenios] = useState<Convenio[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<any>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchConvenios = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (filters?.situacao) params.append('situacao', filters.situacao)
      if (filters?.ano) params.append('ano', filters.ano.toString())
      if (filters?.convenente) params.append('convenente', filters.convenente)
      if (filters?.orgaoConcedente) params.append('orgaoConcedente', filters.orgaoConcedente)
      params.append('page', (filters?.page || 1).toString())
      params.append('limit', (filters?.limit || 50).toString())

      const response = await fetch(`/api/convenios?${params}`, { signal: controller.signal })
      const result = await response.json()

      if (controller.signal.aborted) return
      if (result.success) {
        setConvenios(result.data)
        setPagination(result.pagination)
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar convenios'
      if (!controller.signal.aborted) {
        setError(errorMessage)
        toast.error(errorMessage)
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }, [filters?.situacao, filters?.ano, filters?.convenente, filters?.orgaoConcedente, filters?.page, filters?.limit])

  useEffect(() => {
    fetchConvenios()
    return () => {
      abortRef.current?.abort()
    }
  }, [fetchConvenios])

  const create = useCallback(async (data: Partial<Convenio>) => {
    try {
      const response = await fetch('/api/convenios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      const result = await response.json()

      if (result.success) {
        toast.success('Convenio criado com sucesso')
        await fetchConvenios()
        return result.data
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar convenio'
      toast.error(errorMessage)
      return null
    }
  }, [fetchConvenios])

  const update = useCallback(async (id: string, data: Partial<Convenio>) => {
    try {
      const response = await fetch(`/api/convenios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      const result = await response.json()

      if (result.success) {
        toast.success('Convenio atualizado com sucesso')
        await fetchConvenios()
        return result.data
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar convenio'
      toast.error(errorMessage)
      return null
    }
  }, [fetchConvenios])

  const remove = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/convenios/${id}`, {
        method: 'DELETE'
      })
      const result = await response.json()

      if (result.success) {
        toast.success('Convenio excluido com sucesso')
        await fetchConvenios()
        return true
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir convenio'
      toast.error(errorMessage)
      return false
    }
  }, [fetchConvenios])

  return {
    convenios,
    loading,
    error,
    pagination,
    refetch: fetchConvenios,
    create,
    update,
    remove
  }
}
