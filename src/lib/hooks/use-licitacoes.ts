'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

export interface Licitacao {
  id: string
  numero: string
  ano: number
  modalidade: string
  tipo: string
  objeto: string
  valorEstimado: number | null
  dataPublicacao: string | null
  dataAbertura: string
  horaAbertura: string | null
  dataEntregaPropostas: string | null
  situacao: string
  unidadeGestora: string | null
  linkEdital: string | null
  observacoes: string | null
  createdAt: string
  updatedAt: string
}

export interface LicitacaoFilters {
  modalidade?: string
  situacao?: string
  ano?: number
  objeto?: string
  page?: number
  limit?: number
}

export function useLicitacoes(filters?: LicitacaoFilters) {
  const [licitacoes, setLicitacoes] = useState<Licitacao[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<any>(null)

  const fetchLicitacoes = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (filters?.modalidade) params.append('modalidade', filters.modalidade)
      if (filters?.situacao) params.append('situacao', filters.situacao)
      if (filters?.ano) params.append('ano', filters.ano.toString())
      if (filters?.objeto) params.append('objeto', filters.objeto)
      params.append('page', (filters?.page || 1).toString())
      params.append('limit', (filters?.limit || 50).toString())

      const response = await fetch(`/api/licitacoes?${params}`)
      const result = await response.json()

      if (result.success) {
        setLicitacoes(result.data)
        setPagination(result.pagination)
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar licitacoes'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [filters?.modalidade, filters?.situacao, filters?.ano, filters?.objeto, filters?.page, filters?.limit])

  useEffect(() => {
    fetchLicitacoes()
  }, [fetchLicitacoes])

  const create = useCallback(async (data: Partial<Licitacao>) => {
    try {
      const response = await fetch('/api/licitacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      const result = await response.json()

      if (result.success) {
        toast.success('Licitacao criada com sucesso')
        await fetchLicitacoes()
        return result.data
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar licitacao'
      toast.error(errorMessage)
      return null
    }
  }, [fetchLicitacoes])

  const update = useCallback(async (id: string, data: Partial<Licitacao>) => {
    try {
      const response = await fetch(`/api/licitacoes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      const result = await response.json()

      if (result.success) {
        toast.success('Licitacao atualizada com sucesso')
        await fetchLicitacoes()
        return result.data
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar licitacao'
      toast.error(errorMessage)
      return null
    }
  }, [fetchLicitacoes])

  const remove = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/licitacoes/${id}`, {
        method: 'DELETE'
      })
      const result = await response.json()

      if (result.success) {
        toast.success('Licitacao excluida com sucesso')
        await fetchLicitacoes()
        return true
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir licitacao'
      toast.error(errorMessage)
      return false
    }
  }, [fetchLicitacoes])

  return {
    licitacoes,
    loading,
    error,
    pagination,
    refetch: fetchLicitacoes,
    create,
    update,
    remove
  }
}
