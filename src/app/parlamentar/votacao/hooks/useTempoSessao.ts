import { useEffect, useCallback } from 'react'
import type { SessaoCompleta } from '../types/votacao'

interface UseTempoSessaoOptions {
  sessao: SessaoCompleta | null
  onTempoChange: (tempo: number) => void
}

export function useTempoSessao({ sessao, onTempoChange }: UseTempoSessaoOptions) {
  const calcularTempo = useCallback(() => {
    const acumulado = sessao?.tempoAcumulado || 0
    if (sessao?.status === 'EM_ANDAMENTO' && sessao?.tempoInicio) {
      const inicio = new Date(sessao.tempoInicio)
      const agora = new Date()
      const tempoAtual = Math.floor((agora.getTime() - inicio.getTime()) / 1000)
      onTempoChange(acumulado + (tempoAtual > 0 ? tempoAtual : 0))
    } else if (sessao?.status === 'SUSPENSA') {
      onTempoChange(acumulado)
    }
  }, [sessao?.status, sessao?.tempoInicio, sessao?.tempoAcumulado, onTempoChange])

  useEffect(() => {
    calcularTempo()
    if (sessao?.status === 'EM_ANDAMENTO' && sessao?.tempoInicio) {
      const interval = setInterval(calcularTempo, 1000)
      return () => clearInterval(interval)
    }
  }, [calcularTempo, sessao?.status, sessao?.tempoInicio])
}

export function formatarTempo(segundos: number): string {
  const h = Math.floor(segundos / 3600)
  const m = Math.floor((segundos % 3600) / 60)
  const s = segundos % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export function formatarTipoSessao(tipo: string, abreviado = false): string {
  const tipos: Record<string, { completo: string; abreviado: string }> = {
    ORDINARIA: { completo: 'Ordinária', abreviado: 'Ord.' },
    EXTRAORDINARIA: { completo: 'Extraordinária', abreviado: 'Ext.' },
    SOLENE: { completo: 'Solene', abreviado: 'Sol.' },
    ESPECIAL: { completo: 'Especial', abreviado: 'Esp.' }
  }
  return tipos[tipo]?.[abreviado ? 'abreviado' : 'completo'] || tipo
}

export function formatarDataSessao(dataStr: string): string {
  const data = new Date(dataStr)
  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}
