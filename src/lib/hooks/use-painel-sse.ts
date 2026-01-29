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

  // Usar ref para callbacks para evitar re-renders infinitos
  // quando o consumidor não memoiza os callbacks
  const callbacksRef = useRef(callbacks)
  callbacksRef.current = callbacks

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
        callbacksRef.current?.onConexao?.(true)
      }

      eventSource.onerror = (event) => {
        console.error('Erro SSE:', event)
        setConectado(false)
        callbacksRef.current?.onConexao?.(false)

        const error = new Error('Erro na conexao SSE')
        setErro(error)
        callbacksRef.current?.onErro?.(error)

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
          callbacksRef.current?.onEstado?.(data)
        } catch (e) {
          console.error('Erro ao parsear evento estado:', e)
        }
      })

      // Handler para evento de voto
      eventSource.addEventListener('voto', (event) => {
        try {
          const data: EventoVoto = JSON.parse(event.data)
          callbacksRef.current?.onVoto?.(data)
        } catch (e) {
          console.error('Erro ao parsear evento voto:', e)
        }
      })

      // Handler para votacao iniciada
      eventSource.addEventListener('votacao-iniciada', (event) => {
        try {
          const data: EventoVotacaoIniciada = JSON.parse(event.data)
          callbacksRef.current?.onVotacaoIniciada?.(data)
        } catch (e) {
          console.error('Erro ao parsear evento votacao-iniciada:', e)
        }
      })

      // Handler para votacao finalizada
      eventSource.addEventListener('votacao-finalizada', (event) => {
        try {
          const data: EventoVotacaoFinalizada = JSON.parse(event.data)
          callbacksRef.current?.onVotacaoFinalizada?.(data)
        } catch (e) {
          console.error('Erro ao parsear evento votacao-finalizada:', e)
        }
      })

      // Handler para presenca
      eventSource.addEventListener('presenca', (event) => {
        try {
          const data: EventoPresenca = JSON.parse(event.data)
          callbacksRef.current?.onPresenca?.(data)
        } catch (e) {
          console.error('Erro ao parsear evento presenca:', e)
        }
      })
    } catch (e) {
      const error = e instanceof Error ? e : new Error('Erro ao conectar SSE')
      setErro(error)
      callbacksRef.current?.onErro?.(error)
    }
  }, [
    sessaoId,
    enabled,
    closeConnection,
    reconnectOnError,
    reconnectDelay,
    maxReconnectAttempts
    // callbacks removido das dependências - usando ref
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
 * MEL-VIS-010: Polling inteligente
 *
 * Intervalos adaptativos:
 * - 1s durante votacao ativa
 * - 3s durante sessao em andamento
 * - 10s durante sessao inativa/concluida
 */
const POLLING_INTERVALS = {
  votacaoAtiva: 1000,
  sessaoAtiva: 3000,
  sessaoInativa: 10000
} as const

/**
 * Hook simplificado para usar apenas o estado do painel
 * Usa polling se SSE nao estiver disponivel
 *
 * MEL-VIS-010: Implementa polling inteligente com intervalos adaptativos
 */
export function usePainelTempoReal(
  sessaoId: string | null | undefined,
  options?: {
    pollingFallback?: boolean
    /** Intervalo fixo de polling (se nao informado, usa intervalo adaptativo) */
    pollingInterval?: number
    /** Usar intervalo adaptativo baseado no estado */
    adaptivePolling?: boolean
  }
): {
  estado: EstadoPainelSSE | null
  loading: boolean
  erro: Error | null
  atualizar: () => void
  /** Intervalo atual de polling */
  pollingAtual: number
} {
  const { pollingFallback = true, pollingInterval, adaptivePolling = true } = options || {}

  const [estado, setEstado] = useState<EstadoPainelSSE | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<Error | null>(null)
  const [usandoPolling, setUsandoPolling] = useState(false)
  const [intervaloAtual, setIntervaloAtual] = useState<number>(POLLING_INTERVALS.sessaoAtiva)

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

  // Calcular intervalo adaptativo baseado no estado
  useEffect(() => {
    if (!adaptivePolling || pollingInterval) {
      setIntervaloAtual(pollingInterval || POLLING_INTERVALS.sessaoAtiva)
      return
    }

    if (!estado?.sessao) {
      setIntervaloAtual(POLLING_INTERVALS.sessaoInativa)
      return
    }

    // Verificar se ha votacao em andamento
    const emVotacao = estado.itemAtual?.status === 'EM_VOTACAO'
    if (emVotacao) {
      setIntervaloAtual(POLLING_INTERVALS.votacaoAtiva)
      return
    }

    // Verificar status da sessao
    if (estado.sessao.status === 'EM_ANDAMENTO') {
      setIntervaloAtual(POLLING_INTERVALS.sessaoAtiva)
    } else {
      setIntervaloAtual(POLLING_INTERVALS.sessaoInativa)
    }
  }, [estado, adaptivePolling, pollingInterval])

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

  // Usar polling se necessario com intervalo adaptativo
  useEffect(() => {
    if (!usandoPolling || !sessaoId) return

    fetchEstado()
    const interval = setInterval(fetchEstado, intervaloAtual)
    return () => clearInterval(interval)
  }, [usandoPolling, sessaoId, fetchEstado, intervaloAtual])

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
    atualizar: fetchEstado,
    pollingAtual: intervaloAtual
  }
}

export default usePainelSSE
