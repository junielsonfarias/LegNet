'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

export interface Receita {
  id: string
  numero: string | null
  ano: number
  mes: number
  data: string
  contribuinte: string | null
  cnpjCpf: string | null
  unidade: string | null
  categoria: string
  origem: string
  especie: string | null
  rubrica: string | null
  valorPrevisto: number | null
  valorArrecadado: number
  situacao: string
  fonteRecurso: string | null
  observacoes: string | null
  createdAt: string
  updatedAt: string
}

export interface ReceitaFilters {
  categoria?: string
  origem?: string
  situacao?: string
  ano?: number
  mes?: number
  page?: number
  limit?: number
}

export function useReceitas(filters?: ReceitaFilters) {
  const [receitas, setReceitas] = useState<Receita[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<any>(null)

  const fetchReceitas = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (filters?.categoria) params.append('categoria', filters.categoria)
      if (filters?.origem) params.append('origem', filters.origem)
      if (filters?.situacao) params.append('situacao', filters.situacao)
      if (filters?.ano) params.append('ano', filters.ano.toString())
      if (filters?.mes) params.append('mes', filters.mes.toString())
      params.append('page', (filters?.page || 1).toString())
      params.append('limit', (filters?.limit || 50).toString())

      const response = await fetch(`/api/receitas?${params}`)
      const result = await response.json()

      if (result.success) {
        setReceitas(result.data)
        setPagination(result.pagination)
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar receitas'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [filters?.categoria, filters?.origem, filters?.situacao, filters?.ano, filters?.mes, filters?.page, filters?.limit])

  useEffect(() => {
    fetchReceitas()
  }, [fetchReceitas])

  const create = useCallback(async (data: Partial<Receita>) => {
    try {
      const response = await fetch('/api/receitas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      const result = await response.json()

      if (result.success) {
        toast.success('Receita criada com sucesso')
        await fetchReceitas()
        return result.data
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar receita'
      toast.error(errorMessage)
      return null
    }
  }, [fetchReceitas])

  const update = useCallback(async (id: string, data: Partial<Receita>) => {
    try {
      const response = await fetch(`/api/receitas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      const result = await response.json()

      if (result.success) {
        toast.success('Receita atualizada com sucesso')
        await fetchReceitas()
        return result.data
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar receita'
      toast.error(errorMessage)
      return null
    }
  }, [fetchReceitas])

  const remove = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/receitas/${id}`, {
        method: 'DELETE'
      })
      const result = await response.json()

      if (result.success) {
        toast.success('Receita excluida com sucesso')
        await fetchReceitas()
        return true
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir receita'
      toast.error(errorMessage)
      return false
    }
  }, [fetchReceitas])

  return {
    receitas,
    loading,
    error,
    pagination,
    refetch: fetchReceitas,
    create,
    update,
    remove
  }
}
