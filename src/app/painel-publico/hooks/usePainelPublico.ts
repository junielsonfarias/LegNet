'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Sessao, Presenca, PautaItem, VotacaoRegistro } from '../types'
import { ordenarItensPauta, calcularVotacao } from '../types'

interface UsePainelPublicoProps {
  sessaoIdParam: string | null
}

export function usePainelPublico({ sessaoIdParam }: UsePainelPublicoProps) {
  const [sessao, setSessao] = useState<Sessao | null>(null)
  const [presencas, setPresencas] = useState<Presenca[]>([])
  const [votacoes, setVotacoes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [initialLoadDone, setInitialLoadDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [tempoSessao, setTempoSessao] = useState(0)
  const [itemAtualIndex, setItemAtualIndex] = useState(0)

  // Atualizar relogio a cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Calcular tempo da sessao sincronizado com servidor
  // Busca offset do servidor na montagem para compensar drift de clock
  const [offsetServidor, setOffsetServidor] = useState(0)
  useEffect(() => {
    async function syncTime() {
      try {
        const inicio = Date.now()
        const res = await fetch('/api/painel/hora-servidor')
        const fim = Date.now()
        if (res.ok) {
          const data = await res.json()
          const latencia = (fim - inicio) / 2
          setOffsetServidor(new Date(data.timestamp).getTime() + latencia - Date.now())
        }
      } catch {}
    }
    syncTime()
  }, [])

  useEffect(() => {
    const tempoAcumulado = sessao?.tempoAcumulado || 0

    if (sessao?.status === 'EM_ANDAMENTO' && sessao?.tempoInicio) {
      const interval = setInterval(() => {
        const inicio = new Date(sessao.tempoInicio!)
        const agoraSincronizado = Date.now() + offsetServidor
        const diff = Math.floor((agoraSincronizado - inicio.getTime()) / 1000)
        setTempoSessao(tempoAcumulado + (diff > 0 ? diff : 0))
      }, 1000)
      return () => clearInterval(interval)
    } else if (sessao?.status === 'SUSPENSA' || sessao?.status === 'CONCLUIDA') {
      setTempoSessao(tempoAcumulado)
    }
  }, [sessao?.tempoInicio, sessao?.status, sessao?.tempoAcumulado, offsetServidor])

  // Carregar dados da sessao
  const carregarDados = useCallback(async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true)
      }
      setError(null)

      let sessaoId = sessaoIdParam

      // Se nao tem sessaoId, buscar sessao ativa ou próxima (30 min antes)
      if (!sessaoId) {
        const response = await fetch('/api/dados-abertos/sessoes')
        const data = await response.json()

        if (data.dados && data.dados.length > 0) {
          // Prioridade 1: sessão EM_ANDAMENTO ou SUSPENSA
          const sessaoAtiva = data.dados.find((s: any) => s.status === 'EM_ANDAMENTO' || s.status === 'SUSPENSA')
          if (sessaoAtiva) {
            sessaoId = sessaoAtiva.id
          } else {
            // Prioridade 2: sessão AGENDADA que começa em até 30 minutos
            const agora = new Date()
            const limite30min = new Date(agora.getTime() + 30 * 60 * 1000)
            const proximaSessao = data.dados.find((s: any) => {
              if (s.status !== 'AGENDADA') return false
              const dataSessao = new Date(s.data)
              // Combinar data da sessão com horário se disponível
              if (s.horarioInicio) {
                const [h, m] = s.horarioInicio.split(':')
                dataSessao.setHours(parseInt(h), parseInt(m), 0, 0)
              }
              return dataSessao <= limite30min && dataSessao >= new Date(agora.getTime() - 60 * 60 * 1000)
            })
            if (proximaSessao) {
              sessaoId = proximaSessao.id
            } else {
              // Prioridade 3: sessão CONCLUIDA mais recente (para exibir resultado)
              const sessaoConcluida = data.dados.find((s: any) => s.status === 'CONCLUIDA')
              if (sessaoConcluida) {
                sessaoId = sessaoConcluida.id
              }
            }
          }
        }
      }

      if (!sessaoId) {
        setError('Nenhuma sessao disponivel')
        setLoading(false)
        return
      }

      // Request único: sessao-completa já inclui presencas e votacoes
      const sessaoRes = await fetch(`/api/painel/sessao-completa?sessaoId=${sessaoId}`)
      const sessaoData = await sessaoRes.json()

      if (sessaoData.success && sessaoData.data) {
        setSessao(sessaoData.data)
        if (sessaoData.data.presencas && sessaoData.data.presencas.length > 0) {
          setPresencas(sessaoData.data.presencas)
        }
      }

      // Buscar votacoes apenas se sessão tem itens em votação (evita query pesada)
      const temVotacao = sessaoData.data?.pautaSessao?.itens?.some(
        (i: any) => ['EM_VOTACAO', 'APROVADO', 'REJEITADO'].includes(i.status)
      )
      if (temVotacao) {
        try {
          const votacaoRes = await fetch(`/api/sessoes/${sessaoId}/votacao`)
          const votacaoData = await votacaoRes.json()
          if (votacaoData.success && votacaoData.data) {
            setVotacoes(votacaoData.data)
          }
        } catch {}
      }

    } catch (err) {
      console.error('Erro ao carregar dados:', err)
      if (!initialLoadDone) {
        setError('Erro ao carregar dados do painel')
      }
    } finally {
      // Sempre desligar loading após carregar (não apenas no primeiro load)
      setLoading(false)
      if (!initialLoadDone) {
        setInitialLoadDone(true)
      }
    }
  }, [sessaoIdParam, initialLoadDone])

  // Carregar dados inicialmente
  useEffect(() => {
    carregarDados(true)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Detectar se há votação ativa para polling mais rápido
  const temVotacaoAtiva = sessao?.pautaSessao?.itens?.some(
    (i: any) => i.status === 'EM_VOTACAO'
  )

  // Atualizar periodicamente com intervalo adaptativo
  useEffect(() => {
    const refreshInterval = temVotacaoAtiva
      ? 2000   // 2s durante votação ativa (máxima responsividade)
      : sessao?.status === 'EM_ANDAMENTO' || sessao?.status === 'SUSPENSA'
        ? 4000   // 4s durante sessão ativa
        : sessao?.status === 'AGENDADA'
          ? 10000  // 10s durante espera pré-sessão
          : 30000  // 30s sem sessão ou sessão concluída
    const interval = setInterval(() => carregarDados(false), refreshInterval)
    return () => clearInterval(interval)
  }, [sessao?.status, temVotacaoAtiva]) // eslint-disable-line react-hooks/exhaustive-deps

  // SSE: Conectar ao stream para receber atualizações em tempo real
  useEffect(() => {
    if (!sessao?.id || sessao.status === 'CONCLUIDA' || sessao.status === 'CANCELADA') return

    let eventSource: EventSource | null = null
    try {
      eventSource = new EventSource(`/api/painel/stream?sessaoId=${sessao.id}`)

      eventSource.addEventListener('estado', () => {
        // Quando o estado muda no servidor, recarregar dados
        carregarDados(false)
      })

      eventSource.addEventListener('voto', () => {
        carregarDados(false)
      })

      eventSource.addEventListener('votacao-iniciada', () => {
        carregarDados(false)
      })

      eventSource.addEventListener('votacao-finalizada', () => {
        carregarDados(false)
      })

      eventSource.addEventListener('presenca', () => {
        carregarDados(false)
      })

      eventSource.onerror = () => {
        // SSE falhou, polling continua como fallback
        eventSource?.close()
      }
    } catch {
      // SSE não disponível, polling continua
    }

    return () => {
      eventSource?.close()
    }
  }, [sessao?.id, sessao?.status]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sincronizar com item atual do operador quando sessao em andamento
  useEffect(() => {
    if (sessao?.status === 'EM_ANDAMENTO' && sessao?.pautaSessao?.itemAtual) {
      const itensOrdenados = ordenarItensPauta(sessao.pautaSessao?.itens || [])
      const itemAtualId = sessao.pautaSessao.itemAtual.id
      const novoIndex = itensOrdenados.findIndex(item => item.id === itemAtualId)

      if (novoIndex !== -1 && novoIndex !== itemAtualIndex) {
        setItemAtualIndex(novoIndex)
      }
    }
  }, [sessao?.pautaSessao?.itemAtual?.id, sessao?.status]) // eslint-disable-line react-hooks/exhaustive-deps

  // Obter votacoes de uma proposicao especifica
  const getVotacoesProposicao = useCallback((proposicaoId: string, itemProposicao?: PautaItem['proposicao']): VotacaoRegistro[] => {
    const prop = votacoes.find(v => v.id === proposicaoId)
    if (prop?.votacoes && prop.votacoes.length > 0) {
      return prop.votacoes
    }
    if (itemProposicao?.votacoes && itemProposicao.votacoes.length > 0) {
      return itemProposicao.votacoes
    }
    return []
  }, [votacoes])

  // Navegacao entre itens
  const irParaAnterior = useCallback(() => {
    if (itemAtualIndex > 0) {
      setItemAtualIndex(itemAtualIndex - 1)
    }
  }, [itemAtualIndex])

  const irParaProximo = useCallback(() => {
    const itens = sessao?.pautaSessao?.itens || []
    if (itemAtualIndex < itens.length - 1) {
      setItemAtualIndex(itemAtualIndex + 1)
    }
  }, [itemAtualIndex, sessao?.pautaSessao?.itens])

  // Calcular dados derivados (memoizados para evitar recálculo a cada render)
  const itensOrdenados = useMemo(
    () => sessao?.pautaSessao?.itens ? ordenarItensPauta(sessao.pautaSessao.itens) : [],
    [sessao?.pautaSessao?.itens]
  )
  const itemAtual = itensOrdenados[itemAtualIndex] || null
  const totalItens = itensOrdenados.length

  const { presentes, ausentes } = useMemo(() => ({
    presentes: presencas.filter(p => p.presente),
    ausentes: presencas.filter(p => !p.presente)
  }), [presencas])

  const totalParlamentares = sessao?.quorum?.total || presencas.length
  const percentualPresenca = totalParlamentares > 0
    ? Math.round((presentes.length / totalParlamentares) * 100) : 0

  // Votacoes do item atual (memoizado)
  const votacoesItemAtual = useMemo(
    () => itemAtual?.proposicao
      ? getVotacoesProposicao(itemAtual.proposicao.id, itemAtual.proposicao)
      : [],
    [itemAtual?.proposicao?.id, votacoes] // eslint-disable-line react-hooks/exhaustive-deps
  )
  const estatisticasVotacao = useMemo(
    () => calcularVotacao(votacoesItemAtual),
    [votacoesItemAtual]
  )

  return {
    sessao,
    presencas,
    loading,
    error,
    currentTime,
    tempoSessao,
    itemAtualIndex,
    itensOrdenados,
    itemAtual,
    totalItens,
    presentes,
    ausentes,
    totalParlamentares,
    percentualPresenca,
    votacoesItemAtual,
    estatisticasVotacao,
    irParaAnterior,
    irParaProximo
  }
}
