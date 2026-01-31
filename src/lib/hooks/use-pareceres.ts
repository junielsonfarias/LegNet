'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

export interface Parecer {
  id: string
  proposicaoId: string
  comissaoId: string
  relatorId: string
  numero: string | null
  ano: number
  tipo: string
  status: string
  fundamentacao: string
  conclusao: string | null
  ementa: string | null
  emendasPropostas: string | null
  dataDistribuicao: string
  prazoEmissao: string | null
  dataElaboracao: string | null
  dataVotacao: string | null
  dataEmissao: string | null
  votosAFavor: number
  votosContra: number
  votosAbstencao: number
  observacoes: string | null
  motivoRejeicao: string | null
  // Campos de anexo
  arquivoUrl: string | null
  arquivoNome: string | null
  arquivoTamanho: number | null
  driveUrl: string | null
  createdAt: string
  updatedAt: string
  proposicao?: {
    id: string
    numero: string
    ano: number
    tipo: string
    titulo: string
    ementa?: string
    status?: string
    texto?: string
    autor?: {
      id: string
      nome: string
      apelido?: string
    }
  }
  comissao?: {
    id: string
    nome: string
    sigla?: string
    tipo?: string
    membros?: Array<{
      id: string
      parlamentarId: string
      cargo: string
      ativo: boolean
      parlamentar?: {
        id: string
        nome: string
        apelido?: string
        partido?: string
        foto?: string
      }
    }>
  }
  relator?: {
    id: string
    nome: string
    apelido?: string
    partido?: string
    foto?: string
  }
  votosComissao?: Array<{
    id: string
    parlamentarId: string
    voto: string
    dataVoto: string
    observacoes?: string
    parlamentar?: {
      id: string
      nome: string
      apelido?: string
      partido?: string
    }
  }>
  _count?: {
    votosComissao: number
  }
}

export interface CreateParecerInput {
  proposicaoId: string
  comissaoId: string
  relatorId: string
  tipo: string
  fundamentacao: string
  conclusao?: string
  ementa?: string
  emendasPropostas?: string
  prazoEmissao?: string
  observacoes?: string
  // Campos de anexo
  arquivoUrl?: string | null
  arquivoNome?: string | null
  arquivoTamanho?: number | null
  driveUrl?: string | null
}

export interface UpdateParecerInput {
  tipo?: string
  status?: string
  fundamentacao?: string
  conclusao?: string
  ementa?: string
  emendasPropostas?: string
  prazoEmissao?: string
  dataElaboracao?: string
  dataVotacao?: string
  dataEmissao?: string
  observacoes?: string
  motivoRejeicao?: string
  // Campos de anexo
  arquivoUrl?: string | null
  arquivoNome?: string | null
  arquivoTamanho?: number | null
  driveUrl?: string | null
}

export interface VotarInput {
  parlamentarId: string
  voto: 'SIM' | 'NAO' | 'ABSTENCAO'
  observacoes?: string
}

export interface EncerrarVotacaoInput {
  action: 'encerrar'
  resultado: 'APROVADO_COMISSAO' | 'REJEITADO_COMISSAO'
  motivoRejeicao?: string
}

interface UseParecresFilters {
  comissaoId?: string
  proposicaoId?: string
  relatorId?: string
  status?: string
  tipo?: string
  ano?: number
}

export function usePareceres(filters?: UseParecresFilters) {
  const [pareceres, setPareceres] = useState<Parecer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPareceres = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (filters?.comissaoId) params.append('comissaoId', filters.comissaoId)
      if (filters?.proposicaoId) params.append('proposicaoId', filters.proposicaoId)
      if (filters?.relatorId) params.append('relatorId', filters.relatorId)
      if (filters?.status) params.append('status', filters.status)
      if (filters?.tipo) params.append('tipo', filters.tipo)
      if (filters?.ano) params.append('ano', filters.ano.toString())

      const queryString = params.toString()
      const url = `/api/pareceres${queryString ? `?${queryString}` : ''}`

      const response = await fetch(url)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar pareceres')
      }

      setPareceres(data.data || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [filters?.comissaoId, filters?.proposicaoId, filters?.relatorId, filters?.status, filters?.tipo, filters?.ano])

  useEffect(() => {
    fetchPareceres()
  }, [fetchPareceres])

  const getById = useCallback(async (id: string): Promise<Parecer | null> => {
    try {
      const response = await fetch(`/api/pareceres/${id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar parecer')
      }

      return data.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      toast.error(message)
      return null
    }
  }, [])

  const create = useCallback(async (input: CreateParecerInput): Promise<Parecer | null> => {
    try {
      const response = await fetch('/api/pareceres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar parecer')
      }

      toast.success('Parecer criado com sucesso')
      await fetchPareceres()
      return data.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      toast.error(message)
      return null
    }
  }, [fetchPareceres])

  const update = useCallback(async (id: string, input: UpdateParecerInput): Promise<Parecer | null> => {
    try {
      const response = await fetch(`/api/pareceres/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar parecer')
      }

      toast.success('Parecer atualizado com sucesso')
      await fetchPareceres()
      return data.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      toast.error(message)
      return null
    }
  }, [fetchPareceres])

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/pareceres/${id}`, {
        method: 'DELETE'
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao excluir parecer')
      }

      toast.success('Parecer excluído com sucesso')
      await fetchPareceres()
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      toast.error(message)
      return false
    }
  }, [fetchPareceres])

  const votar = useCallback(async (parecerId: string, input: VotarInput): Promise<any> => {
    try {
      const response = await fetch(`/api/pareceres/${parecerId}/votar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao registrar voto')
      }

      toast.success('Voto registrado com sucesso')
      await fetchPareceres()
      return data.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      toast.error(message)
      return null
    }
  }, [fetchPareceres])

  const encerrarVotacao = useCallback(async (parecerId: string, input: EncerrarVotacaoInput): Promise<Parecer | null> => {
    try {
      const response = await fetch(`/api/pareceres/${parecerId}/votar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao encerrar votação')
      }

      toast.success(data.message || 'Votação encerrada com sucesso')
      await fetchPareceres()
      return data.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      toast.error(message)
      return null
    }
  }, [fetchPareceres])

  const getVotos = useCallback(async (parecerId: string): Promise<any> => {
    try {
      const response = await fetch(`/api/pareceres/${parecerId}/votar`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar votos')
      }

      return data.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      toast.error(message)
      return null
    }
  }, [])

  const enviarParaVotacao = useCallback(async (parecerId: string): Promise<Parecer | null> => {
    return update(parecerId, { status: 'AGUARDANDO_VOTACAO' })
  }, [update])

  const emitirParecer = useCallback(async (parecerId: string): Promise<Parecer | null> => {
    return update(parecerId, { status: 'EMITIDO' })
  }, [update])

  const arquivar = useCallback(async (parecerId: string): Promise<Parecer | null> => {
    return update(parecerId, { status: 'ARQUIVADO' })
  }, [update])

  return {
    pareceres,
    loading,
    error,
    refetch: fetchPareceres,
    getById,
    create,
    update,
    remove,
    votar,
    encerrarVotacao,
    getVotos,
    enviarParaVotacao,
    emitirParecer,
    arquivar
  }
}
