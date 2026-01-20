'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

export type TipoQuorum =
  | 'MAIORIA_SIMPLES'
  | 'MAIORIA_ABSOLUTA'
  | 'DOIS_TERCOS'
  | 'TRES_QUINTOS'
  | 'UNANIMIDADE'

export type AplicacaoQuorum =
  | 'INSTALACAO_SESSAO'
  | 'VOTACAO_SIMPLES'
  | 'VOTACAO_ABSOLUTA'
  | 'VOTACAO_QUALIFICADA'
  | 'VOTACAO_URGENCIA'
  | 'VOTACAO_COMISSAO'
  | 'DERRUBADA_VETO'

export type BaseCalculo = 'PRESENTES' | 'TOTAL_MEMBROS' | 'TOTAL_MANDATOS'

export interface ConfiguracaoQuorum {
  id: string
  nome: string
  descricao: string | null
  aplicacao: AplicacaoQuorum
  tipoQuorum: TipoQuorum
  percentualMinimo: number | null
  numeroMinimo: number | null
  baseCalculo: string
  tiposProposicao: string | null
  permitirAbstencao: boolean
  abstencaoContaContra: boolean
  requererVotacaoNominal: boolean
  mensagemAprovacao: string | null
  mensagemRejeicao: string | null
  ativo: boolean
  ordem: number
  createdAt: string
  updatedAt: string
}

export interface CreateQuorumInput {
  nome: string
  descricao?: string
  aplicacao: AplicacaoQuorum
  tipoQuorum?: TipoQuorum
  percentualMinimo?: number
  numeroMinimo?: number
  baseCalculo?: BaseCalculo
  tiposProposicao?: string[]
  permitirAbstencao?: boolean
  abstencaoContaContra?: boolean
  requererVotacaoNominal?: boolean
  mensagemAprovacao?: string
  mensagemRejeicao?: string
  ativo?: boolean
  ordem?: number
}

export interface UpdateQuorumInput {
  nome?: string
  descricao?: string | null
  tipoQuorum?: TipoQuorum
  percentualMinimo?: number | null
  numeroMinimo?: number | null
  baseCalculo?: BaseCalculo
  tiposProposicao?: string[] | null
  permitirAbstencao?: boolean
  abstencaoContaContra?: boolean
  requererVotacaoNominal?: boolean
  mensagemAprovacao?: string | null
  mensagemRejeicao?: string | null
  ativo?: boolean
  ordem?: number
}

interface UseQuorumFilters {
  ativo?: boolean
  aplicacao?: AplicacaoQuorum
}

export function useQuorum(filters?: UseQuorumFilters) {
  const [configuracoes, setConfiguracoes] = useState<ConfiguracaoQuorum[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchConfiguracoes = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (filters?.ativo !== undefined) params.append('ativo', String(filters.ativo))
      if (filters?.aplicacao) params.append('aplicacao', filters.aplicacao)

      const queryString = params.toString()
      const url = `/api/quorum${queryString ? `?${queryString}` : ''}`

      const response = await fetch(url)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar configuracoes de quorum')
      }

      setConfiguracoes(data.data || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [filters?.ativo, filters?.aplicacao])

  useEffect(() => {
    fetchConfiguracoes()
  }, [fetchConfiguracoes])

  const getById = useCallback(async (id: string): Promise<ConfiguracaoQuorum | null> => {
    try {
      const response = await fetch(`/api/quorum/${id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar configuracao')
      }

      return data.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      toast.error(message)
      return null
    }
  }, [])

  const getByAplicacao = useCallback(async (aplicacao: AplicacaoQuorum): Promise<ConfiguracaoQuorum | null> => {
    try {
      const response = await fetch(`/api/quorum?aplicacao=${aplicacao}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar configuracao')
      }

      return data.data?.[0] || null
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      toast.error(message)
      return null
    }
  }, [])

  const create = useCallback(async (input: CreateQuorumInput): Promise<ConfiguracaoQuorum | null> => {
    try {
      const response = await fetch('/api/quorum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar configuracao')
      }

      toast.success('Configuracao de quorum criada com sucesso')
      await fetchConfiguracoes()
      return data.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      toast.error(message)
      return null
    }
  }, [fetchConfiguracoes])

  const update = useCallback(async (id: string, input: UpdateQuorumInput): Promise<ConfiguracaoQuorum | null> => {
    try {
      const response = await fetch(`/api/quorum/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar configuracao')
      }

      toast.success('Configuracao de quorum atualizada com sucesso')
      await fetchConfiguracoes()
      return data.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      toast.error(message)
      return null
    }
  }, [fetchConfiguracoes])

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/quorum/${id}`, {
        method: 'DELETE'
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao excluir configuracao')
      }

      toast.success('Configuracao de quorum excluida com sucesso')
      await fetchConfiguracoes()
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      toast.error(message)
      return false
    }
  }, [fetchConfiguracoes])

  return {
    configuracoes,
    loading,
    error,
    refetch: fetchConfiguracoes,
    getById,
    getByAplicacao,
    create,
    update,
    remove
  }
}

// Utilitario para calcular resultado de votacao baseado no quorum
export function calcularResultadoVotacao(
  config: ConfiguracaoQuorum,
  votos: { sim: number; nao: number; abstencao: number },
  totalMembros: number,
  totalPresentes: number
): { aprovado: boolean; mensagem: string; detalhes: string } {
  const { tipoQuorum, baseCalculo, abstencaoContaContra, percentualMinimo, numeroMinimo } = config

  // Determinar base de calculo
  let base = totalPresentes
  if (baseCalculo === 'TOTAL_MEMBROS' || baseCalculo === 'TOTAL_MANDATOS') {
    base = totalMembros
  }

  // Considerar abstencoes como contra se configurado
  const votosContra = abstencaoContaContra ? votos.nao + votos.abstencao : votos.nao

  let aprovado = false
  let detalhes = ''

  switch (tipoQuorum) {
    case 'MAIORIA_SIMPLES':
      aprovado = votos.sim > votosContra
      detalhes = `${votos.sim} a favor vs ${votosContra} contra (maioria simples)`
      break

    case 'MAIORIA_ABSOLUTA':
      const maioriaAbsoluta = Math.floor(base / 2) + 1
      aprovado = votos.sim >= maioriaAbsoluta
      detalhes = `${votos.sim} a favor (necessario: ${maioriaAbsoluta} de ${base})`
      break

    case 'DOIS_TERCOS':
      const doisTercos = Math.ceil((base * 2) / 3)
      aprovado = votos.sim >= doisTercos
      detalhes = `${votos.sim} a favor (necessario: ${doisTercos} de ${base} - 2/3)`
      break

    case 'TRES_QUINTOS':
      const tresQuintos = Math.ceil((base * 3) / 5)
      aprovado = votos.sim >= tresQuintos
      detalhes = `${votos.sim} a favor (necessario: ${tresQuintos} de ${base} - 3/5)`
      break

    case 'UNANIMIDADE':
      aprovado = votos.sim === totalPresentes && votos.nao === 0 && votos.abstencao === 0
      detalhes = `${votos.sim} a favor de ${totalPresentes} presentes (unanimidade requerida)`
      break
  }

  // Verificar percentual minimo se configurado
  if (percentualMinimo && !aprovado) {
    const percentualAtingido = (votos.sim / base) * 100
    if (percentualAtingido >= percentualMinimo) {
      aprovado = true
      detalhes += ` - Atingiu ${percentualAtingido.toFixed(1)}% (minimo: ${percentualMinimo}%)`
    }
  }

  // Verificar numero minimo se configurado
  if (numeroMinimo && !aprovado && votos.sim >= numeroMinimo) {
    aprovado = true
    detalhes += ` - Atingiu minimo de ${numeroMinimo} votos`
  }

  const mensagem = aprovado
    ? config.mensagemAprovacao || 'Aprovado'
    : config.mensagemRejeicao || 'Rejeitado por nao atingir quorum'

  return { aprovado, mensagem, detalhes }
}
