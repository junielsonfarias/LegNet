'use client'

import { useSession } from 'next-auth/react'
import { useConfiguracaoInstitucional } from '@/lib/hooks/use-configuracao-institucional'
import { useVotacaoReducer, useVotacaoData, useTempoSessao } from './hooks'
import {
  LoadingScreen,
  UnauthenticatedScreen,
  SemSessaoScreen,
  PresencaNaoConfirmadaScreen,
  VotacaoHeader,
  BotoesVotacao,
  VotoRegistrado,
  ProposicaoCard,
  ContagemVotos,
  MeuVoto
} from './components'
import { VotacaoEmAndamento } from './VotacaoEmAndamento'
import { ResultadoScreen } from './ResultadoScreen'
import { AguardandoScreen } from './AguardandoScreen'
import { PautaCompletaScreen } from './PautaCompletaScreen'
import type { PautaItem } from './types/votacao'

export default function VotacaoParlamentarPage() {
  const sessionData = useSession()
  const session = sessionData?.data
  const status = sessionData?.status ?? 'loading'
  const { configuracao } = useConfiguracaoInstitucional()

  const { state, actions } = useVotacaoReducer()
  const parlamentarId = (session?.user as any)?.parlamentarId

  // Hook para tempo da sessão
  useTempoSessao({
    sessao: state.sessao,
    onTempoChange: actions.setTempo
  })

  // Hook para carregar dados
  const { registrarVoto } = useVotacaoData({
    parlamentarId,
    sessaoAtiva: state.sessao,
    itemAnterior: state.itemAnterior,
    actions,
    enabled: status === 'authenticated' && !!session?.user
  })

  // Loading state
  if (status === 'loading' || state.sessaoLoading) {
    return <LoadingScreen />
  }

  // Não autenticado
  if (status === 'unauthenticated') {
    return <UnauthenticatedScreen />
  }

  // Nenhuma sessão em andamento
  if (!state.sessao) {
    return <SemSessaoScreen />
  }

  // Presença não confirmada
  if (!state.presencaConfirmada) {
    return <PresencaNaoConfirmadaScreen />
  }

  // Dados da pauta (ordenados pela ordem de criação - usando ID que é cronológico)
  const itens = [...(state.sessao.pautaSessao?.itens || [])].sort((a, b) => a.id.localeCompare(b.id))
  const itemEmVotacao = itens.find(item => item.status === 'EM_VOTACAO' && item.proposicao)
  const itemEmDiscussao = itens.find(item => item.status === 'EM_DISCUSSAO')
  const itemEmAndamento = itemEmVotacao || itemEmDiscussao

  const nomeParlamentar = state.parlamentarInfo?.apelido || state.parlamentarInfo?.nome || (session?.user as any)?.name || 'Parlamentar'

  // Tela de votação
  if (itemEmVotacao && itemEmVotacao.proposicao) {
    return (
      <VotacaoEmAndamento
        sessao={state.sessao}
        itemEmVotacao={itemEmVotacao}
        parlamentarInfo={state.parlamentarInfo}
        nomeParlamentar={nomeParlamentar}
        tempoSessao={state.tempoSessao}
        votoRegistrado={state.votoRegistrado}
        votando={state.votando}
        configuracao={configuracao}
        onVotar={registrarVoto}
        onAlterarVoto={() => actions.setVoto(null)}
      />
    )
  }

  // Tela de resultado
  if (state.resultadoVotacao) {
    return (
      <ResultadoScreen
        sessao={state.sessao}
        resultado={state.resultadoVotacao}
        parlamentarInfo={state.parlamentarInfo}
        nomeParlamentar={nomeParlamentar}
        tempoSessao={state.tempoSessao}
        configuracao={configuracao}
        onContinuar={actions.limparResultado}
      />
    )
  }

  // Tela de aguardando (quando não há item em votação)
  if (!itemEmAndamento) {
    const itensRestantes = itens.filter(item => item.status === 'PENDENTE').length
    return (
      <AguardandoScreen
        sessao={state.sessao}
        parlamentarInfo={state.parlamentarInfo}
        nomeParlamentar={nomeParlamentar}
        tempoSessao={state.tempoSessao}
        configuracao={configuracao}
        itensRestantes={itensRestantes}
      />
    )
  }

  // Tela completa com pauta
  return (
    <PautaCompletaScreen
      sessao={state.sessao}
      parlamentarInfo={state.parlamentarInfo}
      nomeParlamentar={nomeParlamentar}
      tempoSessao={state.tempoSessao}
      configuracao={configuracao}
      itens={itens}
      itemEmDiscussao={itemEmDiscussao}
    />
  )
}
