'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

export interface Despesa {
  id: string
  numeroEmpenho: string
  ano: number
  mes: number
  data: string
  credor: string
  cnpjCpf: string | null
  unidade: string | null
  elemento: string | null
  funcao: string | null
  subfuncao: string | null
  programa: string | null
  acao: string | null
  valorEmpenhado: number
  valorLiquidado: number | null
  valorPago: number | null
  situacao: string
  fonteRecurso: string | null
  modalidade: string | null
  licitacaoId: string | null
  contratoId: string | null
  convenioId: string | null
  observacoes: string | null
  createdAt: string
  updatedAt: string
}

export interface DespesaFilters {
  situacao?: string
  ano?: number
  mes?: number
  credor?: string
  funcao?: string
  page?: number
  limit?: number
}

export function useDespesas(filters?: DespesaFilters) {
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<any>(null)

  const fetchDespesas = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (filters?.situacao) params.append('situacao', filters.situacao)
      if (filters?.ano) params.append('ano', filters.ano.toString())
      if (filters?.mes) params.append('mes', filters.mes.toString())
      if (filters?.credor) params.append('credor', filters.credor)
      if (filters?.funcao) params.append('funcao', filters.funcao)
      params.append('page', (filters?.page || 1).toString())
      params.append('limit', (filters?.limit || 50).toString())

      const response = await fetch(`/api/despesas?${params}`)
      const result = await response.json()

      if (result.success) {
        setDespesas(result.data)
        setPagination(result.pagination)
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar despesas'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [filters?.situacao, filters?.ano, filters?.mes, filters?.credor, filters?.funcao, filters?.page, filters?.limit])

  useEffect(() => {
    fetchDespesas()
  }, [fetchDespesas])

  const create = useCallback(async (data: Partial<Despesa>) => {
    try {
      const response = await fetch('/api/despesas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      const result = await response.json()

      if (result.success) {
        toast.success('Despesa criada com sucesso')
        await fetchDespesas()
        return result.data
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar despesa'
      toast.error(errorMessage)
      return null
    }
  }, [fetchDespesas])

  const update = useCallback(async (id: string, data: Partial<Despesa>) => {
    try {
      const response = await fetch(`/api/despesas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      const result = await response.json()

      if (result.success) {
        toast.success('Despesa atualizada com sucesso')
        await fetchDespesas()
        return result.data
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar despesa'
      toast.error(errorMessage)
      return null
    }
  }, [fetchDespesas])

  const remove = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/despesas/${id}`, {
        method: 'DELETE'
      })
      const result = await response.json()

      if (result.success) {
        toast.success('Despesa excluida com sucesso')
        await fetchDespesas()
        return true
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir despesa'
      toast.error(errorMessage)
      return false
    }
  }, [fetchDespesas])

  return {
    despesas,
    loading,
    error,
    pagination,
    refetch: fetchDespesas,
    create,
    update,
    remove
  }
}
