'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { publicParticipacaoApi } from '@/lib/api/public-participacao-api'

export function usePublicParticipacao(term?: string) {
  const [loading, setLoading] = useState(true)
  const [sugestoes, setSugestoes] = useState<any[]>([])
  const [consultas, setConsultas] = useState<any[]>([])
  const [peticoes, setPeticoes] = useState<any[]>([])
  const [estatisticas, setEstatisticas] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [sugestoesData, consultasData, peticoesData, estatisticasData] = await Promise.all([
        publicParticipacaoApi.getSugestoes(term),
        publicParticipacaoApi.getConsultas(term),
        publicParticipacaoApi.getPeticoes(term),
        publicParticipacaoApi.getEstatisticas()
      ])

      setSugestoes(sugestoesData)
      setConsultas(consultasData)
      setPeticoes(peticoesData)
      setEstatisticas(estatisticasData)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Não foi possível carregar os dados públicos.'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [term])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const votarSugestao = useCallback(async (id: string) => {
    try {
      await publicParticipacaoApi.voteSugestao(id)
      toast.success('Voto registrado com sucesso!')
      await fetchData()
    } catch (error) {
      toast.error('Não foi possível registrar o voto.')
    }
  }, [fetchData])

  const votarConsulta = useCallback(async (consultaId: string, opcaoId: string) => {
    try {
      await publicParticipacaoApi.voteConsulta(consultaId, opcaoId)
      toast.success('Voto registrado com sucesso!')
      await fetchData()
    } catch (error) {
      toast.error('Não foi possível registrar o voto.')
    }
  }, [fetchData])

  const assinarPeticao = useCallback(async (peticaoId: string, assinatura: { nome: string; email: string }) => {
    try {
      await publicParticipacaoApi.signPeticao(peticaoId, assinatura)
      toast.success('Assinatura registrada com sucesso!')
      await fetchData()
    } catch (error) {
      toast.error('Não foi possível registrar a assinatura.')
    }
  }, [fetchData])

  return {
    loading,
    error,
    sugestoes,
    consultas,
    peticoes,
    estatisticas,
    votarSugestao,
    votarConsulta,
    assinarPeticao,
    refetch: fetchData
  }
}

