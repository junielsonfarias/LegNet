import { useReducer } from 'react'
import type { VotacaoState, VotacaoAction } from '../types/votacao'

const initialState: VotacaoState = {
  sessao: null,
  sessaoLoading: true,
  parlamentarInfo: null,
  presencaConfirmada: false,
  votoRegistrado: null,
  votando: false,
  itemAnterior: null,
  resultadoVotacao: null,
  tempoSessao: 0
}

function votacaoReducer(state: VotacaoState, action: VotacaoAction): VotacaoState {
  switch (action.type) {
    case 'SET_SESSAO':
      return { ...state, sessao: action.payload }
    case 'SET_LOADING':
      return { ...state, sessaoLoading: action.payload }
    case 'SET_PARLAMENTAR':
      return { ...state, parlamentarInfo: action.payload }
    case 'SET_PRESENCA':
      return { ...state, presencaConfirmada: action.payload }
    case 'SET_VOTO':
      return { ...state, votoRegistrado: action.payload }
    case 'SET_VOTANDO':
      return { ...state, votando: action.payload }
    case 'SET_ITEM_ANTERIOR':
      return { ...state, itemAnterior: action.payload }
    case 'SET_RESULTADO':
      return { ...state, resultadoVotacao: action.payload }
    case 'SET_TEMPO':
      return { ...state, tempoSessao: action.payload }
    case 'LIMPAR_RESULTADO':
      return { ...state, resultadoVotacao: null }
    default:
      return state
  }
}

export function useVotacaoReducer() {
  const [state, dispatch] = useReducer(votacaoReducer, initialState)

  return {
    state,
    dispatch,
    actions: {
      setSessao: (sessao: VotacaoState['sessao']) =>
        dispatch({ type: 'SET_SESSAO', payload: sessao }),
      setLoading: (loading: boolean) =>
        dispatch({ type: 'SET_LOADING', payload: loading }),
      setParlamentar: (parlamentar: VotacaoState['parlamentarInfo']) =>
        dispatch({ type: 'SET_PARLAMENTAR', payload: parlamentar }),
      setPresenca: (presenca: boolean) =>
        dispatch({ type: 'SET_PRESENCA', payload: presenca }),
      setVoto: (voto: string | null) =>
        dispatch({ type: 'SET_VOTO', payload: voto }),
      setVotando: (votando: boolean) =>
        dispatch({ type: 'SET_VOTANDO', payload: votando }),
      setItemAnterior: (item: string | null) =>
        dispatch({ type: 'SET_ITEM_ANTERIOR', payload: item }),
      setResultado: (resultado: VotacaoState['resultadoVotacao']) =>
        dispatch({ type: 'SET_RESULTADO', payload: resultado }),
      setTempo: (tempo: number) =>
        dispatch({ type: 'SET_TEMPO', payload: tempo }),
      limparResultado: () =>
        dispatch({ type: 'LIMPAR_RESULTADO' })
    }
  }
}
