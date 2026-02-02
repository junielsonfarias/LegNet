'use client'

import { useState, useEffect, useCallback } from 'react'
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

  // Calcular tempo da sessao (considera tempoAcumulado para suspensao)
  useEffect(() => {
    const tempoAcumulado = sessao?.tempoAcumulado || 0

    if (sessao?.status === 'EM_ANDAMENTO' && sessao?.tempoInicio) {
      const interval = setInterval(() => {
        const inicio = new Date(sessao.tempoInicio!)
        const agora = new Date()
        const diff = Math.floor((agora.getTime() - inicio.getTime()) / 1000)
        setTempoSessao(tempoAcumulado + (diff > 0 ? diff : 0))
      }, 1000)
      return () => clearInterval(interval)
    } else if (sessao?.status === 'SUSPENSA' || sessao?.status === 'CONCLUIDA') {
      setTempoSessao(tempoAcumulado)
    }
  }, [sessao?.tempoInicio, sessao?.status, sessao?.tempoAcumulado])

  // Carregar dados da sessao
  const carregarDados = useCallback(async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true)
      }
      setError(null)

      let sessaoId = sessaoIdParam

      // Se nao tem sessaoId, buscar sessao em andamento ou a mais recente
      if (!sessaoId) {
        const response = await fetch('/api/dados-abertos/sessoes')
        const data = await response.json()

        if (data.dados && data.dados.length > 0) {
          const sessaoEmAndamento = data.dados.find((s: any) => s.status === 'EM_ANDAMENTO')
          if (sessaoEmAndamento) {
            sessaoId = sessaoEmAndamento.id
          } else {
            sessaoId = data.dados[0].id
          }
        }
      }

      if (!sessaoId) {
        setError('Nenhuma sessao disponivel')
        setLoading(false)
        return
      }

      const [sessaoRes, presencaRes, votacaoRes] = await Promise.all([
        fetch(`/api/painel/sessao-completa?sessaoId=${sessaoId}`),
        fetch(`/api/sessoes/${sessaoId}/presenca`),
        fetch(`/api/sessoes/${sessaoId}/votacao`)
      ])

      const sessaoData = await sessaoRes.json()
      const presencaData = await presencaRes.json()
      const votacaoData = await votacaoRes.json()

      if (sessaoData.success && sessaoData.data) {
        setSessao(sessaoData.data)
        if (sessaoData.data.presencas && sessaoData.data.presencas.length > 0) {
          setPresencas(sessaoData.data.presencas)
        } else if (presencaData.success && presencaData.data && presencaData.data.length > 0) {
          setPresencas(presencaData.data)
        }
      }

      if (votacaoData.success && votacaoData.data) {
        setVotacoes(votacaoData.data)
      }

    } catch (err) {
      console.error('Erro ao carregar dados:', err)
      if (!initialLoadDone) {
        setError('Erro ao carregar dados do painel')
      }
    } finally {
      if (!initialLoadDone) {
        setLoading(false)
        setInitialLoadDone(true)
      }
    }
  }, [sessaoIdParam, initialLoadDone])

  // Carregar dados inicialmente e atualizar a cada 5 segundos
  useEffect(() => {
    carregarDados(true)
    const interval = setInterval(() => carregarDados(false), 5000)
    return () => clearInterval(interval)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

  // Calcular dados derivados
  const itensOrdenados = sessao?.pautaSessao?.itens ? ordenarItensPauta(sessao.pautaSessao.itens) : []
  const itemAtual = itensOrdenados[itemAtualIndex] || null
  const totalItens = itensOrdenados.length

  const presentes = presencas.filter(p => p.presente)
  const ausentes = presencas.filter(p => !p.presente)
  const totalParlamentares = sessao?.quorum?.total || presencas.length
  const percentualPresenca = sessao?.quorum?.percentual ?? (
    totalParlamentares > 0
      ? Math.round((presentes.length / totalParlamentares) * 100)
      : 0
  )

  // Votacoes do item atual
  const votacoesItemAtual = itemAtual?.proposicao
    ? getVotacoesProposicao(itemAtual.proposicao.id, itemAtual.proposicao)
    : []
  const estatisticasVotacao = calcularVotacao(votacoesItemAtual)

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
