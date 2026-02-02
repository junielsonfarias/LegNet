import { useCallback, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { sessoesApi } from '@/lib/api/sessoes-api'
import type { PautaItem, SessaoCompleta, ParlamentarInfo, ResultadoVotacao, VotoTipo } from '../types/votacao'

interface VotacaoDataActions {
  setSessao: (sessao: SessaoCompleta | null) => void
  setLoading: (loading: boolean) => void
  setParlamentar: (parlamentar: ParlamentarInfo | null) => void
  setPresenca: (presenca: boolean) => void
  setVoto: (voto: string | null) => void
  setVotando: (votando: boolean) => void
  setItemAnterior: (item: string | null) => void
  setResultado: (resultado: ResultadoVotacao | null) => void
}

interface UseVotacaoDataOptions {
  parlamentarId: string | undefined
  sessaoAtiva: SessaoCompleta | null
  itemAnterior: string | null
  actions: VotacaoDataActions
  enabled: boolean
}

export function useVotacaoData({
  parlamentarId,
  sessaoAtiva,
  itemAnterior,
  actions,
  enabled
}: UseVotacaoDataOptions) {
  const itemAnteriorRef = useRef(itemAnterior)
  itemAnteriorRef.current = itemAnterior

  // Buscar informações do parlamentar
  const buscarParlamentar = useCallback(async () => {
    if (!parlamentarId) return
    try {
      const response = await fetch(`/api/parlamentares/${parlamentarId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.data) {
          actions.setParlamentar({
            id: data.data.id,
            nome: data.data.nome,
            apelido: data.data.apelido,
            foto: data.data.foto,
            partido: data.data.partido
          })
        }
      }
    } catch (error) {
      console.error('Erro ao buscar parlamentar:', error)
    }
  }, [parlamentarId, actions])

  // Carregar dados da sessão e votação
  const carregarDados = useCallback(async () => {
    if (!parlamentarId) return

    try {
      const { data: sessoes } = await sessoesApi.getAll()
      const sessaoEmAndamento = sessoes.find(s => s.status === 'EM_ANDAMENTO')

      if (!sessaoEmAndamento) {
        actions.setSessao(null)
        actions.setLoading(false)
        return
      }

      const sessaoResponse = await fetch(`/api/sessoes/${sessaoEmAndamento.id}`)
      const sessaoData = await sessaoResponse.json()

      if (sessaoData.success && sessaoData.data) {
        actions.setSessao(sessaoData.data)
      }

      // Verificar presença
      const presencaResponse = await fetch(`/api/sessoes/${sessaoEmAndamento.id}/presenca`)
      if (presencaResponse.ok) {
        const { data: presencas } = await presencaResponse.json()
        const presenca = presencas.find((p: any) => p.parlamentarId === parlamentarId)
        actions.setPresenca(presenca?.presente || false)
      }

      // Verificar votação atual
      const itemEmVotacao = sessaoData.data?.pautaSessao?.itens?.find(
        (item: PautaItem) => item.status === 'EM_VOTACAO' && item.proposicao
      )

      if (itemEmVotacao?.proposicao) {
        actions.setItemAnterior(itemEmVotacao.proposicao.id)
        actions.setResultado(null)

        const votacaoResponse = await fetch(`/api/sessoes/${sessaoEmAndamento.id}/votacao`)
        if (votacaoResponse.ok) {
          const { data: proposicoesVotacao } = await votacaoResponse.json()
          const proposicaoComVotos = proposicoesVotacao.find(
            (p: any) => p.id === itemEmVotacao.proposicao!.id
          )
          if (proposicaoComVotos) {
            const voto = proposicaoComVotos.votacoes?.find(
              (v: any) => v.parlamentarId === parlamentarId
            )
            actions.setVoto(voto?.voto || null)
          } else {
            actions.setVoto(null)
          }
        }
      } else {
        // Verificar se acabou de encerrar uma votação
        if (itemAnteriorRef.current) {
          const itemEncerrado = sessaoData.data?.pautaSessao?.itens?.find(
            (item: PautaItem) =>
              item.proposicao?.id === itemAnteriorRef.current &&
              (item.status === 'APROVADO' || item.status === 'REJEITADO')
          )

          if (itemEncerrado?.proposicao) {
            const votacaoResponse = await fetch(`/api/sessoes/${sessaoEmAndamento.id}/votacao`)
            if (votacaoResponse.ok) {
              const { data: proposicoesVotacao } = await votacaoResponse.json()
              const proposicaoComVotos = proposicoesVotacao.find(
                (p: any) => p.id === itemEncerrado.proposicao!.id
              )

              if (proposicaoComVotos) {
                const votos = proposicaoComVotos.votacoes || []
                const votosSim = votos.filter((v: any) => v.voto === 'SIM').length
                const votosNao = votos.filter((v: any) => v.voto === 'NAO').length
                const votosAbstencao = votos.filter((v: any) => v.voto === 'ABSTENCAO').length
                const meuVoto = votos.find((v: any) => v.parlamentarId === parlamentarId)?.voto || null

                actions.setResultado({
                  proposicao: itemEncerrado.proposicao,
                  resultado: itemEncerrado.status as 'APROVADO' | 'REJEITADO',
                  votosSim,
                  votosNao,
                  votosAbstencao,
                  totalVotos: votosSim + votosNao + votosAbstencao,
                  meuVoto
                })
              }
            }
          }
          actions.setItemAnterior(null)
        }
        actions.setVoto(null)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados da sessão')
    } finally {
      actions.setLoading(false)
    }
  }, [parlamentarId, actions])

  // Registrar voto
  const registrarVoto = useCallback(async (voto: VotoTipo) => {
    const itemEmVotacao = sessaoAtiva?.pautaSessao?.itens?.find(
      item => item.status === 'EM_VOTACAO' && item.proposicao
    )

    if (!sessaoAtiva || !itemEmVotacao?.proposicao || !parlamentarId) {
      if (!parlamentarId) {
        toast.error('Parlamentar não identificado. Verifique se seu usuário está vinculado a um parlamentar.')
      }
      return
    }

    try {
      actions.setVotando(true)

      const response = await fetch(`/api/sessoes/${sessaoAtiva.id}/votacao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposicaoId: itemEmVotacao.proposicao.id,
          parlamentarId,
          voto
        })
      })

      if (response.ok) {
        actions.setVoto(voto)
        toast.success('Voto registrado com sucesso!')
      } else {
        const error = await response.json()
        toast.error(error.message || 'Erro ao registrar voto')
      }
    } catch (error) {
      console.error('Erro ao registrar voto:', error)
      toast.error('Erro ao registrar voto')
    } finally {
      actions.setVotando(false)
    }
  }, [sessaoAtiva, parlamentarId, actions])

  // Efeito para buscar parlamentar
  useEffect(() => {
    if (enabled && parlamentarId) {
      buscarParlamentar()
    }
  }, [enabled, parlamentarId, buscarParlamentar])

  // Efeito para carregar dados e polling
  useEffect(() => {
    if (!enabled) return

    carregarDados()
    const interval = setInterval(carregarDados, 5000)
    return () => clearInterval(interval)
  }, [enabled, carregarDados])

  return {
    carregarDados,
    registrarVoto
  }
}
