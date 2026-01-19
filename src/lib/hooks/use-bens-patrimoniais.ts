'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

export interface BemPatrimonial {
  id: string
  tipo: string
  tombamento: string | null
  descricao: string
  especificacao: string | null
  dataAquisicao: string | null
  valorAquisicao: number | null
  valorAtual: number | null
  localizacao: string | null
  responsavel: string | null
  situacao: string
  matriculaImovel: string | null
  enderecoImovel: string | null
  areaImovel: number | null
  observacoes: string | null
  createdAt: string
  updatedAt: string
}

export interface BemPatrimonialFilters {
  tipo?: string
  situacao?: string
  descricao?: string
  localizacao?: string
  page?: number
  limit?: number
}

export function useBensPatrimoniais(filters?: BemPatrimonialFilters) {
  const [bens, setBens] = useState<BemPatrimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<any>(null)

  const fetchBens = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (filters?.tipo) params.append('tipo', filters.tipo)
      if (filters?.situacao) params.append('situacao', filters.situacao)
      if (filters?.descricao) params.append('descricao', filters.descricao)
      if (filters?.localizacao) params.append('localizacao', filters.localizacao)
      params.append('page', (filters?.page || 1).toString())
      params.append('limit', (filters?.limit || 50).toString())

      const response = await fetch(`/api/bens-patrimoniais?${params}`)
      const result = await response.json()

      if (result.success) {
        setBens(result.data)
        setPagination(result.pagination)
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar bens patrimoniais'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [filters?.tipo, filters?.situacao, filters?.descricao, filters?.localizacao, filters?.page, filters?.limit])

  useEffect(() => {
    fetchBens()
  }, [fetchBens])

  const create = useCallback(async (data: Partial<BemPatrimonial>) => {
    try {
      const response = await fetch('/api/bens-patrimoniais', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      const result = await response.json()

      if (result.success) {
        toast.success('Bem patrimonial criado com sucesso')
        await fetchBens()
        return result.data
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar bem patrimonial'
      toast.error(errorMessage)
      return null
    }
  }, [fetchBens])

  const update = useCallback(async (id: string, data: Partial<BemPatrimonial>) => {
    try {
      const response = await fetch(`/api/bens-patrimoniais/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      const result = await response.json()

      if (result.success) {
        toast.success('Bem patrimonial atualizado com sucesso')
        await fetchBens()
        return result.data
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar bem patrimonial'
      toast.error(errorMessage)
      return null
    }
  }, [fetchBens])

  const remove = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/bens-patrimoniais/${id}`, {
        method: 'DELETE'
      })
      const result = await response.json()

      if (result.success) {
        toast.success('Bem patrimonial excluido com sucesso')
        await fetchBens()
        return true
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir bem patrimonial'
      toast.error(errorMessage)
      return false
    }
  }, [fetchBens])

  return {
    bens,
    loading,
    error,
    pagination,
    refetch: fetchBens,
    create,
    update,
    remove
  }
}
