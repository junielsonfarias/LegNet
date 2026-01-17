/**
 * Hook para Painel em Tempo Real
 * Gerencia polling de dados da sessao ativa
 */

import { useState, useEffect, useCallback, useRef } from 'react'

// Tipos do painel
export interface EstadoSessao {
  id: string
  numero: number
  tipo: string
  status: 'AGENDADA' | 'EM_ANDAMENTO' | 'SUSPENSA' | 'CONCLUIDA' | 'CANCELADA'
  data: Date
  horarioInicio: string
  horarioFim?: string
  presidente?: string
  secretario?: string
  local?: string
  tempoDecorrido: number
  itemAtual?: ItemPautaAtivo
}

export interface ItemPautaAtivo {
  id: string
  ordem: number
  titulo: string
  descricao?: string
  tipo: string
  status: 'PENDENTE' | 'EM_DISCUSSAO' | 'EM_VOTACAO' | 'APROVADO' | 'REJEITADO' | 'ADIADO'
  tempoDiscussao: number
  proposicaoId?: string
}

export interface VotacaoAtiva {
  id: string
  proposicaoId: string
  proposicaoTitulo: string
  proposicaoNumero: string
  status: 'ABERTA' | 'FECHADA' | 'APURANDO'
  tempoRestante: number
  votos: {
    sim: number
    nao: number
    abstencao: number
    ausente: number
  }
  votosIndividuais: VotoIndividual[]
  resultado?: 'APROVADA' | 'REJEITADA' | 'EMPATE'
  quorumNecessario: number
  tipoQuorum: 'SIMPLES' | 'ABSOLUTA' | 'QUALIFICADA'
}

export interface VotoIndividual {
  parlamentarId: string
  parlamentarNome: string
  partido: string
  voto: 'SIM' | 'NAO' | 'ABSTENCAO' | null
  horaVoto?: Date
}

export interface PresencaAtiva {
  parlamentarId: string
  nome: string
  partido: string
  foto?: string
  presente: boolean
  horaEntrada?: Date
  justificativa?: string
  conectado: boolean
}

export interface EstadoPainel {
  sessao: EstadoSessao | null
  votacaoAtiva: VotacaoAtiva | null
  presencas: PresencaAtiva[]
  pautaItems: ItemPautaAtivo[]
  transmissao: {
    ativa: boolean
    url?: string
    plataforma?: 'youtube' | 'vimeo' | 'outro'
  }
  cronometros: {
    sessao: number
    item: number
    votacao: number
    discurso: number
  }
  discursoAtivo?: {
    parlamentarId: string
    parlamentarNome: string
    tempoRestante: number
    tempoTotal: number
  }
  estatisticas: {
    totalParlamentares: number
    presentes: number
    ausentes: number
    percentualPresenca: number
    itensAprovados: number
    itensRejeitados: number
    itensPendentes: number
  }
}

interface UsePainelTempoRealOptions {
  sessaoId?: string
  intervaloAtualizacao?: number // em ms
  autoConnect?: boolean
}

interface UsePainelTempoRealResult {
  estado: EstadoPainel | null
  loading: boolean
  error: string | null
  connected: boolean
  ultimaAtualizacao: Date | null
  refresh: () => Promise<void>
  conectar: (sessaoId: string) => void
  desconectar: () => void
}

export function usePainelTempoReal(
  options: UsePainelTempoRealOptions = {}
): UsePainelTempoRealResult {
  const {
    sessaoId: sessaoIdInicial,
    intervaloAtualizacao = 3000, // 3 segundos
    autoConnect = true
  } = options

  const [sessaoId, setSessaoId] = useState<string | undefined>(sessaoIdInicial)
  const [estado, setEstado] = useState<EstadoPainel | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const mountedRef = useRef(true)

  const buscarEstado = useCallback(async () => {
    if (!sessaoId) {
      setEstado(null)
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/painel/estado?sessaoId=${sessaoId}`)

      if (!response.ok) {
        throw new Error('Erro ao buscar estado do painel')
      }

      const result = await response.json()

      if (mountedRef.current) {
        setEstado(result.data)
        setUltimaAtualizacao(new Date())
        setError(null)
        setConnected(true)
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
        setConnected(false)
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [sessaoId])

  const refresh = useCallback(async () => {
    await buscarEstado()
  }, [buscarEstado])

  const conectar = useCallback((novoSessaoId: string) => {
    setSessaoId(novoSessaoId)
  }, [])

  const desconectar = useCallback(() => {
    setSessaoId(undefined)
    setEstado(null)
    setConnected(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // Busca inicial
  useEffect(() => {
    mountedRef.current = true

    if (autoConnect && sessaoId) {
      buscarEstado()
    }

    return () => {
      mountedRef.current = false
    }
  }, [sessaoId, autoConnect, buscarEstado])

  // Polling para atualizacoes
  useEffect(() => {
    if (!sessaoId) return

    intervalRef.current = setInterval(() => {
      buscarEstado()
    }, intervaloAtualizacao)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [sessaoId, intervaloAtualizacao, buscarEstado])

  return {
    estado,
    loading,
    error,
    connected,
    ultimaAtualizacao,
    refresh,
    conectar,
    desconectar
  }
}

// Hook simplificado para buscar sessao ativa automaticamente
export function useSessaoAtiva(intervaloAtualizacao = 5000) {
  const [sessaoAtivaId, setSessaoAtivaId] = useState<string | null>(null)
  const [buscando, setBuscando] = useState(true)

  useEffect(() => {
    const buscarSessaoAtiva = async () => {
      try {
        const response = await fetch('/api/sessoes?status=EM_ANDAMENTO&limit=1')
        if (response.ok) {
          const result = await response.json()
          if (result.data && result.data.length > 0) {
            setSessaoAtivaId(result.data[0].id)
          } else {
            setSessaoAtivaId(null)
          }
        }
      } catch (error) {
        console.error('Erro ao buscar sessao ativa:', error)
      } finally {
        setBuscando(false)
      }
    }

    buscarSessaoAtiva()

    const interval = setInterval(buscarSessaoAtiva, intervaloAtualizacao)
    return () => clearInterval(interval)
  }, [intervaloAtualizacao])

  const painelResult = usePainelTempoReal({
    sessaoId: sessaoAtivaId || undefined,
    intervaloAtualizacao: 3000
  })

  return {
    ...painelResult,
    sessaoAtivaId,
    buscando
  }
}
