'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { createLogger } from '@/lib/logging/logger'

const log = createLogger('use-dashboard')

// Tipos para estatísticas do dashboard
export interface DashboardStats {
  instituicao: {
    nome: string
    sigla: string | null
    cidade: string | null
    estado: string | null
    legislatura: {
      id: string
      numero: number
      descricao: string
      periodoAtual: {
        numero: number
        descricao: string
      } | null
    } | null
  }
  parlamentares: {
    total: number
    ativos: number
    presencaMedia: number
  }
  sessoes: {
    total: number
    realizadas: number
    agendadas: number
    canceladas: number
  }
  proposicoes: {
    total: number
    aprovadas: number
    emTramitacao: number
    pendentes: number
    rejeitadas: number
  }
  comissoes: {
    total: number
    ativas: number
    membros: number
  }
  noticias: {
    total: number
  }
  hoje: {
    votacoes: number
  }
  sistema: {
    usuarios: number
    logsHoje: number
    uptime: string
  }
  sessaoAtual: {
    id: string
    numero: number
    tipo: string
    presentes: number
    totalParlamentares: number
    itensNaPauta: number
  } | null
  proximaSessao: {
    id: string
    numero: number
    tipo: string
    data: string
    horario: string
  } | null
  parlamentar: {
    minhasProposicoes: number
    aprovadas: number
    emTramitacao: number
  } | null
}

// Tipos para atividades recentes
export interface AtividadeRecente {
  id: string
  type: 'proposicao' | 'votacao' | 'sessao' | 'parecer' | 'usuario' | 'comissao'
  title: string
  description: string
  timestamp: string
  status: 'success' | 'warning' | 'pending'
  user?: string
}

// Tipos para próximos eventos
export interface ProximoEvento {
  id: string
  title: string
  type: 'sessao' | 'reuniao' | 'audiencia'
  date: string
  time: string
  location?: string
  attendees?: number
}

// Hook para estatísticas do dashboard
export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchStats = useCallback(async () => {
    // Cancela request em voo
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/dashboard/stats', { signal: controller.signal })

      if (!response.ok) {
        throw new Error('Erro ao carregar estatísticas')
      }

      const result = await response.json()
      if (controller.signal.aborted) return
      if (result.success) {
        setStats(result.data)
      } else {
        throw new Error(result.error || 'Erro desconhecido')
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar estatísticas'
      if (!controller.signal.aborted) {
        setError(errorMessage)
        log.error('Erro ao carregar estatisticas', err)
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
    return () => {
      abortRef.current?.abort()
    }
  }, [fetchStats])

  return { stats, loading, error, refetch: fetchStats }
}

// Hook para atividades recentes
export function useAtividadesRecentes(limit: number = 10) {
  const [atividades, setAtividades] = useState<AtividadeRecente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchAtividades = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/dashboard/atividades?limit=${limit}`, {
        signal: controller.signal
      })

      if (!response.ok) {
        throw new Error('Erro ao carregar atividades')
      }

      const result = await response.json()
      if (controller.signal.aborted) return
      if (result.success) {
        setAtividades(result.data)
      } else {
        throw new Error(result.error || 'Erro desconhecido')
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar atividades'
      if (!controller.signal.aborted) {
        setError(errorMessage)
        log.error('Erro ao carregar atividades', err)
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    fetchAtividades()
    return () => {
      abortRef.current?.abort()
    }
  }, [fetchAtividades])

  return { atividades, loading, error, refetch: fetchAtividades }
}

// Hook para próximos eventos
export function useProximosEventos(limit: number = 10) {
  const [eventos, setEventos] = useState<ProximoEvento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchEventos = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/dashboard/eventos?limit=${limit}`, {
        signal: controller.signal
      })

      if (!response.ok) {
        throw new Error('Erro ao carregar eventos')
      }

      const result = await response.json()
      if (controller.signal.aborted) return
      if (result.success) {
        setEventos(result.data)
      } else {
        throw new Error(result.error || 'Erro desconhecido')
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar eventos'
      if (!controller.signal.aborted) {
        setError(errorMessage)
        log.error('Erro ao carregar eventos', err)
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    fetchEventos()
    return () => {
      abortRef.current?.abort()
    }
  }, [fetchEventos])

  return { eventos, loading, error, refetch: fetchEventos }
}
