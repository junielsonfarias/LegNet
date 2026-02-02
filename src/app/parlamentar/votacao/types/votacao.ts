export interface PautaItem {
  id: string
  titulo: string
  descricao: string | null
  secao: string
  ordem: number
  status: string
  proposicao?: {
    id: string
    numero: number
    ano: number
    titulo: string
    tipo: string
    status: string
    ementa?: string
    autor?: {
      nome: string
      apelido: string | null
      partido?: string | null
    }
  }
}

export interface SessaoCompleta {
  id: string
  numero: number
  tipo: string
  data: string
  horario: string | null
  status: string
  tempoInicio: string | null
  tempoAcumulado?: number
  pautaSessao?: {
    itens: PautaItem[]
  }
}

export interface ParlamentarInfo {
  id: string
  nome: string
  apelido: string | null
  foto: string | null
  partido: string | null
}

export interface ResultadoVotacao {
  proposicao: {
    id: string
    numero: number
    ano: number
    titulo: string
    tipo: string
    autor?: {
      nome: string
      apelido: string | null
      partido?: string | null
    }
  }
  resultado: 'APROVADO' | 'REJEITADO'
  votosSim: number
  votosNao: number
  votosAbstencao: number
  totalVotos: number
  meuVoto: string | null
}

export type VotoTipo = 'SIM' | 'NAO' | 'ABSTENCAO'

export interface VotacaoState {
  sessao: SessaoCompleta | null
  sessaoLoading: boolean
  parlamentarInfo: ParlamentarInfo | null
  presencaConfirmada: boolean
  votoRegistrado: string | null
  votando: boolean
  itemAnterior: string | null
  resultadoVotacao: ResultadoVotacao | null
  tempoSessao: number
}

export type VotacaoAction =
  | { type: 'SET_SESSAO'; payload: SessaoCompleta | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_PARLAMENTAR'; payload: ParlamentarInfo | null }
  | { type: 'SET_PRESENCA'; payload: boolean }
  | { type: 'SET_VOTO'; payload: string | null }
  | { type: 'SET_VOTANDO'; payload: boolean }
  | { type: 'SET_ITEM_ANTERIOR'; payload: string | null }
  | { type: 'SET_RESULTADO'; payload: ResultadoVotacao | null }
  | { type: 'SET_TEMPO'; payload: number }
  | { type: 'LIMPAR_RESULTADO' }

export interface ConfiguracaoInstitucional {
  logoUrl?: string | null
  nomeCasa?: string | null
  sigla?: string | null
  endereco?: { cidade?: string | null } | null
}
