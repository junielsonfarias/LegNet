'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface UseCronometroSincronizadoOptions {
  /** Tempo de inicio da sessao/item (ISO string ou null) */
  tempoInicio: string | null
  /** Tempo acumulado em segundos (para itens pausados) */
  tempoAcumulado?: number
  /** Se o cronometro esta ativo */
  ativo?: boolean
  /** Intervalo de atualizacao em ms (padrao: 1000) */
  intervalo?: number
  /** Callback executado a cada segundo */
  onTick?: (segundos: number) => void
}

interface UseCronometroSincronizadoReturn {
  /** Tempo decorrido em segundos */
  segundos: number
  /** Tempo formatado HH:MM:SS */
  formatado: string
  /** Se o cronometro esta rodando */
  rodando: boolean
  /** Offset do servidor em ms (diferenca entre hora local e servidor) */
  offsetServidor: number
  /** Hora atual sincronizada */
  horaAtual: Date
  /** Hora atual formatada HH:MM:SS */
  horaFormatada: string
  /** Resetar o cronometro */
  resetar: () => void
}

/**
 * Calcula o offset entre hora local e servidor
 * Faz uma requisicao ao servidor para obter a hora e calcula a diferenca
 */
async function calcularOffsetServidor(): Promise<number> {
  try {
    const inicioRequisicao = Date.now()
    const response = await fetch('/api/painel/hora-servidor')
    const fimRequisicao = Date.now()

    if (!response.ok) {
      return 0
    }

    const data = await response.json()
    const horaServidor = new Date(data.timestamp).getTime()

    // Compensar latencia da rede (metade do tempo de round-trip)
    const latencia = (fimRequisicao - inicioRequisicao) / 2
    const horaServidorAjustada = horaServidor + latencia

    // Offset = hora servidor - hora local
    return horaServidorAjustada - Date.now()
  } catch (error) {
    console.warn('Erro ao sincronizar com servidor, usando hora local:', error)
    return 0
  }
}

/**
 * Formata segundos para HH:MM:SS
 */
export function formatarTempo(segundos: number): string {
  const absSegundos = Math.abs(segundos)
  const h = Math.floor(absSegundos / 3600)
  const m = Math.floor((absSegundos % 3600) / 60)
  const s = absSegundos % 60
  const sinal = segundos < 0 ? '-' : ''
  return `${sinal}${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

/**
 * Hook para cronometro sincronizado com servidor
 *
 * Resolve o problema de dessincronizacao entre paineis calculando
 * o offset entre a hora local e a hora do servidor.
 *
 * @example
 * ```tsx
 * const { segundos, formatado, horaFormatada } = useCronometroSincronizado({
 *   tempoInicio: sessao.tempoInicio,
 *   ativo: sessao.status === 'EM_ANDAMENTO'
 * })
 * ```
 */
export function useCronometroSincronizado(
  options: UseCronometroSincronizadoOptions
): UseCronometroSincronizadoReturn {
  const {
    tempoInicio,
    tempoAcumulado = 0,
    ativo = true,
    intervalo = 1000,
    onTick
  } = options

  const [segundos, setSegundos] = useState(tempoAcumulado)
  const [offsetServidor, setOffsetServidor] = useState(0)
  const [horaAtual, setHoraAtual] = useState(new Date())
  const [rodando, setRodando] = useState(false)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const offsetCalculadoRef = useRef(false)

  // Calcular offset do servidor uma vez ao montar
  useEffect(() => {
    if (!offsetCalculadoRef.current) {
      offsetCalculadoRef.current = true
      calcularOffsetServidor().then(offset => {
        setOffsetServidor(offset)
      })
    }
  }, [])

  // Funcao para calcular tempo decorrido
  const calcularTempo = useCallback(() => {
    const agora = new Date(Date.now() + offsetServidor)
    setHoraAtual(agora)

    if (!tempoInicio || !ativo) {
      setSegundos(tempoAcumulado)
      setRodando(false)
      return
    }

    const inicio = new Date(tempoInicio)
    const diff = Math.floor((agora.getTime() - inicio.getTime()) / 1000)
    const novoTempo = tempoAcumulado + (diff > 0 ? diff : 0)

    setSegundos(novoTempo)
    setRodando(true)
    onTick?.(novoTempo)
  }, [tempoInicio, tempoAcumulado, ativo, offsetServidor, onTick])

  // Iniciar/parar cronometro
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    calcularTempo()

    if (tempoInicio && ativo) {
      intervalRef.current = setInterval(calcularTempo, intervalo)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [calcularTempo, tempoInicio, ativo, intervalo])

  // Resetar cronometro
  const resetar = useCallback(() => {
    setSegundos(0)
    setRodando(false)
  }, [])

  return {
    segundos,
    formatado: formatarTempo(segundos),
    rodando,
    offsetServidor,
    horaAtual,
    horaFormatada: horaAtual.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }),
    resetar
  }
}

/**
 * Hook simplificado para apenas exibir a hora atual sincronizada
 */
export function useHoraSincronizada() {
  const [horaAtual, setHoraAtual] = useState(new Date())
  const [offsetServidor, setOffsetServidor] = useState(0)
  const offsetCalculadoRef = useRef(false)

  useEffect(() => {
    if (!offsetCalculadoRef.current) {
      offsetCalculadoRef.current = true
      calcularOffsetServidor().then(setOffsetServidor)
    }

    const interval = setInterval(() => {
      setHoraAtual(new Date(Date.now() + offsetServidor))
    }, 1000)

    return () => clearInterval(interval)
  }, [offsetServidor])

  return {
    horaAtual,
    formatada: horaAtual.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }
}

export default useCronometroSincronizado
