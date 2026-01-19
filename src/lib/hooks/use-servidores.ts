'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

export interface Servidor {
  id: string
  nome: string
  cpf: string | null
  matricula: string | null
  cargo: string | null
  funcao: string | null
  unidade: string | null
  lotacao: string | null
  vinculo: string
  dataAdmissao: string | null
  dataDesligamento: string | null
  salarioBruto: number | null
  situacao: string
  observacoes: string | null
  createdAt: string
  updatedAt: string
}

export interface ServidorFilters {
  situacao?: string
  vinculo?: string
  cargo?: string
  unidade?: string
  nome?: string
  page?: number
  limit?: number
}

export function useServidores(filters?: ServidorFilters) {
  const [servidores, setServidores] = useState<Servidor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<any>(null)

  const fetchServidores = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (filters?.situacao) params.append('situacao', filters.situacao)
      if (filters?.vinculo) params.append('vinculo', filters.vinculo)
      if (filters?.cargo) params.append('cargo', filters.cargo)
      if (filters?.unidade) params.append('unidade', filters.unidade)
      if (filters?.nome) params.append('nome', filters.nome)
      params.append('page', (filters?.page || 1).toString())
      params.append('limit', (filters?.limit || 50).toString())

      const response = await fetch(`/api/servidores?${params}`)
      const result = await response.json()

      if (result.success) {
        setServidores(result.data)
        setPagination(result.pagination)
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar servidores'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [filters?.situacao, filters?.vinculo, filters?.cargo, filters?.unidade, filters?.nome, filters?.page, filters?.limit])

  useEffect(() => {
    fetchServidores()
  }, [fetchServidores])

  const create = useCallback(async (data: Partial<Servidor>) => {
    try {
      const response = await fetch('/api/servidores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      const result = await response.json()

      if (result.success) {
        toast.success('Servidor criado com sucesso')
        await fetchServidores()
        return result.data
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar servidor'
      toast.error(errorMessage)
      return null
    }
  }, [fetchServidores])

  const update = useCallback(async (id: string, data: Partial<Servidor>) => {
    try {
      const response = await fetch(`/api/servidores/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      const result = await response.json()

      if (result.success) {
        toast.success('Servidor atualizado com sucesso')
        await fetchServidores()
        return result.data
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar servidor'
      toast.error(errorMessage)
      return null
    }
  }, [fetchServidores])

  const remove = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/servidores/${id}`, {
        method: 'DELETE'
      })
      const result = await response.json()

      if (result.success) {
        toast.success('Servidor excluido com sucesso')
        await fetchServidores()
        return true
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir servidor'
      toast.error(errorMessage)
      return false
    }
  }, [fetchServidores])

  return {
    servidores,
    loading,
    error,
    pagination,
    refetch: fetchServidores,
    create,
    update,
    remove
  }
}

// Hook para Folha de Pagamento
export interface FolhaPagamento {
  id: string
  competencia: string
  mes: number
  ano: number
  totalServidores: number | null
  totalBruto: number | null
  totalDeducoes: number | null
  totalLiquido: number | null
  dataProcessamento: string | null
  situacao: string | null
  observacoes: string | null
  createdAt: string
  updatedAt: string
}

export interface FolhaPagamentoFilters {
  ano?: number
  mes?: number
  situacao?: string
  page?: number
  limit?: number
}

export function useFolhaPagamento(filters?: FolhaPagamentoFilters) {
  const [folhas, setFolhas] = useState<FolhaPagamento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<any>(null)

  const fetchFolhas = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (filters?.ano) params.append('ano', filters.ano.toString())
      if (filters?.mes) params.append('mes', filters.mes.toString())
      if (filters?.situacao) params.append('situacao', filters.situacao)
      params.append('page', (filters?.page || 1).toString())
      params.append('limit', (filters?.limit || 50).toString())

      const response = await fetch(`/api/folha-pagamento?${params}`)
      const result = await response.json()

      if (result.success) {
        setFolhas(result.data)
        setPagination(result.pagination)
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar folhas de pagamento'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [filters?.ano, filters?.mes, filters?.situacao, filters?.page, filters?.limit])

  useEffect(() => {
    fetchFolhas()
  }, [fetchFolhas])

  const create = useCallback(async (data: Partial<FolhaPagamento>) => {
    try {
      const response = await fetch('/api/folha-pagamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      const result = await response.json()

      if (result.success) {
        toast.success('Folha de pagamento criada com sucesso')
        await fetchFolhas()
        return result.data
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar folha de pagamento'
      toast.error(errorMessage)
      return null
    }
  }, [fetchFolhas])

  const update = useCallback(async (id: string, data: Partial<FolhaPagamento>) => {
    try {
      const response = await fetch(`/api/folha-pagamento/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      const result = await response.json()

      if (result.success) {
        toast.success('Folha de pagamento atualizada com sucesso')
        await fetchFolhas()
        return result.data
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar folha de pagamento'
      toast.error(errorMessage)
      return null
    }
  }, [fetchFolhas])

  const remove = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/folha-pagamento/${id}`, {
        method: 'DELETE'
      })
      const result = await response.json()

      if (result.success) {
        toast.success('Folha de pagamento excluida com sucesso')
        await fetchFolhas()
        return true
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir folha de pagamento'
      toast.error(errorMessage)
      return false
    }
  }, [fetchFolhas])

  return {
    folhas,
    loading,
    error,
    pagination,
    refetch: fetchFolhas,
    create,
    update,
    remove
  }
}
