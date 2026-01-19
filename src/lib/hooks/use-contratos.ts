'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

export interface Contrato {
  id: string
  numero: string
  ano: number
  modalidade: string
  objeto: string
  contratado: string
  cnpjCpf: string | null
  valorTotal: number
  dataAssinatura: string
  vigenciaInicio: string
  vigenciaFim: string
  fiscalContrato: string | null
  situacao: string
  licitacaoId: string | null
  arquivo: string | null
  observacoes: string | null
  createdAt: string
  updatedAt: string
}

export interface ContratoFilters {
  modalidade?: string
  situacao?: string
  ano?: number
  contratado?: string
  page?: number
  limit?: number
}

export function useContratos(filters?: ContratoFilters) {
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<any>(null)

  const fetchContratos = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (filters?.modalidade) params.append('modalidade', filters.modalidade)
      if (filters?.situacao) params.append('situacao', filters.situacao)
      if (filters?.ano) params.append('ano', filters.ano.toString())
      if (filters?.contratado) params.append('contratado', filters.contratado)
      params.append('page', (filters?.page || 1).toString())
      params.append('limit', (filters?.limit || 50).toString())

      const response = await fetch(`/api/contratos?${params}`)
      const result = await response.json()

      if (result.success) {
        setContratos(result.data)
        setPagination(result.pagination)
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar contratos'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [filters?.modalidade, filters?.situacao, filters?.ano, filters?.contratado, filters?.page, filters?.limit])

  useEffect(() => {
    fetchContratos()
  }, [fetchContratos])

  const create = useCallback(async (data: Partial<Contrato>) => {
    try {
      const response = await fetch('/api/contratos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      const result = await response.json()

      if (result.success) {
        toast.success('Contrato criado com sucesso')
        await fetchContratos()
        return result.data
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar contrato'
      toast.error(errorMessage)
      return null
    }
  }, [fetchContratos])

  const update = useCallback(async (id: string, data: Partial<Contrato>) => {
    try {
      const response = await fetch(`/api/contratos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      const result = await response.json()

      if (result.success) {
        toast.success('Contrato atualizado com sucesso')
        await fetchContratos()
        return result.data
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar contrato'
      toast.error(errorMessage)
      return null
    }
  }, [fetchContratos])

  const remove = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/contratos/${id}`, {
        method: 'DELETE'
      })
      const result = await response.json()

      if (result.success) {
        toast.success('Contrato excluido com sucesso')
        await fetchContratos()
        return true
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir contrato'
      toast.error(errorMessage)
      return false
    }
  }, [fetchContratos])

  return {
    contratos,
    loading,
    error,
    pagination,
    refetch: fetchContratos,
    create,
    update,
    remove
  }
}
