'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// Tipos para o estado do painel
interface VereadorVoto {
  id: string
  nome: string
  apelido?: string | null
  foto?: string | null
  partido?: string | null
  voto: 'SIM' | 'NAO' | 'ABSTENCAO' | null
}

interface ItemPauta {
  id: string
  titulo: string
  status: string
  proposicao?: {
    id: string
    numero: string
    ano: number
    tipo: string
    ementa?: string | null
  } | null
}

interface VotacaoContagem {
  sim: number
  nao: number
  abstencao: number
  pendentes: number
}

export interface EstadoPainelSSE {
  sessao: {
    id: string
    numero: number
    tipo: string
    status: string
    data: string
    horarioInicio?: string | null
    tempoInicio?: string | null
  } | null
  itemAtual: ItemPauta | null
  votacao: VotacaoContagem
  vereadores: VereadorVoto[]
  presentes: number
  totalVereadores: number
  resultado?: 'APROVADA' | 'REJEITADA' | 'EMPATE' | null
  timestamp: string
}

// Eventos SSE
interface EventoVoto {
  parlamentarId: string
  parlamentarNome: string
  voto: 'SIM' | 'NAO' | 'ABSTENCAO'
  timestamp: string
}

interface EventoVotacaoIniciada {
  itemId: string
  proposicao?: {
    id: string
    numero: string
    ano: number
    tipo: string
  } | null
}

interface EventoVotacaoFinalizada {
  itemId: string
  resultado: 'APROVADA' | 'REJEITADA' | 'EMPATE'
  votos: VotacaoContagem
}

interface EventoPresenca {
  presentes: number
  totalVereadores: number
}

// Callbacks para eventos
interface UsePainelSSECallbacks {
  onEstado?: (estado: EstadoPainelSSE) => void
  onVoto?: (evento: EventoVoto) => void
  onVotacaoIniciada?: (evento: EventoVotacaoIniciada) => void
  onVotacaoFinalizada?: (evento: EventoVotacaoFinalizada) => void
  onPresenca?: (evento: EventoPresenca) => void
  onConexao?: (conectado: boolean) => void
  onErro?: (erro: Error) => void
}

interface UsePainelSSEOptions {
  enabled?: boolean
  reconnectOnError?: boolean
  reconnectDelay?: number
  maxReconnectAttempts?: number
}

interface UsePainelSSEReturn {
  estado: EstadoPainelSSE | null
  conectado: boolean
  erro: Error | null
  reconectar: () => void
}

/**
 * Hook para consumir eventos SSE do painel em tempo real
 *
 * @param sessaoId - ID da sessao
 * @param callbacks - Callbacks para eventos especificos
 * @param options - Opcoes de configuracao
 *
 * @example
 * ```tsx
 * const { estado, conectado, erro, reconectar } = usePainelSSE(sessaoId, {
 *   onVoto: (voto) => console.log('Novo voto:', voto),
 *   onVotacaoFinalizada: (resultado) => toast.success(`Votacao finalizada: ${resultado.resultado}`)
 * })
 * ```
 */
export function usePainelSSE(
  sessaoId: string | null | undefined,
  callbacks?: UsePainelSSECallbacks,
  options?: UsePainelSSEOptions
): UsePainelSSEReturn {
  const [estado, setEstado] = useState<EstadoPainelSSE | null>(null)
  const [conectado, setConectado] = useState(false)
  const [erro, setErro] = useState<Error | null>(null)

  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)

  const {
    enabled = true,
    reconnectOnError = true,
    reconnectDelay = 3000,
    maxReconnectAttempts = 10
  } = options || {}

  // Limpar timeout de reconexao
  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
  }, [])

  // Fechar conexao existente
  const closeConnection = useCallback(() => {
    clearReconnectTimeout()
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
  }, [clearReconnectTimeout])

  // Conectar ao SSE
  const connect = useCallback(() => {
    if (!sessaoId || !enabled) return

    closeConnection()

    try {
      const url = `/api/painel/stream?sessaoId=${encodeURIComponent(sessaoId)}`
      const eventSource = new EventSource(url)
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        setConectado(true)
        setErro(null)
        reconnectAttemptsRef.current = 0
        callbacks?.onConexao?.(true)
      }

      eventSource.onerror = (event) => {
        console.error('Erro SSE:', event)
        setConectado(false)
        callbacks?.onConexao?.(false)

        const error = new Error('Erro na conexao SSE')
        setErro(error)
        callbacks?.onErro?.(error)

        // Tentar reconectar
        if (reconnectOnError && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, reconnectDelay * reconnectAttemptsRef.current)
        }
      }

      // Handler para evento de estado
      eventSource.addEventListener('estado', (event) => {
        try {
          const data: EstadoPainelSSE = JSON.parse(event.data)
          setEstado(data)
          callbacks?.onEstado?.(data)
        } catch (e) {
          console.error('Erro ao parsear evento estado:', e)
        }
      })

      // Handler para evento de voto
      eventSource.addEventListener('voto', (event) => {
        try {
          const data: EventoVoto = JSON.parse(event.data)
          callbacks?.onVoto?.(data)
        } catch (e) {
          console.error('Erro ao parsear evento voto:', e)
        }
      })

      // Handler para votacao iniciada
      eventSource.addEventListener('votacao-iniciada', (event) => {
        try {
          const data: EventoVotacaoIniciada = JSON.parse(event.data)
          callbacks?.onVotacaoIniciada?.(data)
        } catch (e) {
          console.error('Erro ao parsear evento votacao-iniciada:', e)
        }
      })

      // Handler para votacao finalizada
      eventSource.addEventListener('votacao-finalizada', (event) => {
        try {
          const data: EventoVotacaoFinalizada = JSON.parse(event.data)
          callbacks?.onVotacaoFinalizada?.(data)
        } catch (e) {
          console.error('Erro ao parsear evento votacao-finalizada:', e)
        }
      })

      // Handler para presenca
      eventSource.addEventListener('presenca', (event) => {
        try {
          const data: EventoPresenca = JSON.parse(event.data)
          callbacks?.onPresenca?.(data)
        } catch (e) {
          console.error('Erro ao parsear evento presenca:', e)
        }
      })
    } catch (e) {
      const error = e instanceof Error ? e : new Error('Erro ao conectar SSE')
      setErro(error)
      callbacks?.onErro?.(error)
    }
  }, [
    sessaoId,
    enabled,
    closeConnection,
    reconnectOnError,
    reconnectDelay,
    maxReconnectAttempts,
    callbacks
  ])

  // Funcao para reconectar manualmente
  const reconectar = useCallback(() => {
    reconnectAttemptsRef.current = 0
    connect()
  }, [connect])

  // Conectar ao montar e limpar ao desmontar
  useEffect(() => {
    if (sessaoId && enabled) {
      connect()
    }

    return () => {
      closeConnection()
    }
  }, [sessaoId, enabled, connect, closeConnection])

  return {
    estado,
    conectado,
    erro,
    reconectar
  }
}

/**
 * Hook simplificado para usar apenas o estado do painel
 * Usa polling se SSE nao estiver disponivel
 */
export function usePainelTempoReal(
  sessaoId: string | null | undefined,
  options?: { pollingFallback?: boolean; pollingInterval?: number }
): {
  estado: EstadoPainelSSE | null
  loading: boolean
  erro: Error | null
  atualizar: () => void
} {
  const { pollingFallback = true, pollingInterval = 3000 } = options || {}

  const [estado, setEstado] = useState<EstadoPainelSSE | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<Error | null>(null)
  const [usandoPolling, setUsandoPolling] = useState(false)

  // Tentar usar SSE primeiro
  const { estado: estadoSSE, conectado, erro: erroSSE } = usePainelSSE(
    sessaoId,
    undefined,
    { enabled: !usandoPolling, maxReconnectAttempts: 3 }
  )

  // Fallback para polling se SSE falhar
  useEffect(() => {
    if (erroSSE && pollingFallback && !usandoPolling) {
      console.log('SSE falhou, usando polling como fallback')
      setUsandoPolling(true)
    }
  }, [erroSSE, pollingFallback, usandoPolling])

  // Funcao de polling
  const fetchEstado = useCallback(async () => {
    if (!sessaoId) return

    try {
      const res = await fetch(`/api/painel/estado?sessaoId=${encodeURIComponent(sessaoId)}`)
      if (!res.ok) throw new Error('Erro ao buscar estado')
      const data = await res.json()
      setEstado(data.data)
      setErro(null)
    } catch (e) {
      setErro(e instanceof Error ? e : new Error('Erro ao buscar estado'))
    } finally {
      setLoading(false)
    }
  }, [sessaoId])

  // Usar polling se necessario
  useEffect(() => {
    if (!usandoPolling || !sessaoId) return

    fetchEstado()
    const interval = setInterval(fetchEstado, pollingInterval)
    return () => clearInterval(interval)
  }, [usandoPolling, sessaoId, fetchEstado, pollingInterval])

  // Usar estado do SSE se disponivel
  useEffect(() => {
    if (!usandoPolling && estadoSSE) {
      setEstado(estadoSSE)
      setLoading(false)
    }
  }, [usandoPolling, estadoSSE])

  return {
    estado,
    loading: loading && !estado,
    erro: usandoPolling ? erro : erroSSE,
    atualizar: fetchEstado
  }
}

export default usePainelSSE
