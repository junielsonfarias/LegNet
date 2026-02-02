// Interfaces
export interface Sessao {
  id: string
  numero: number
  tipo: string
  data: string
  horario: string | null
  local: string | null
  status: string
  descricao: string | null
  tempoInicio: string | null
  tempoAcumulado?: number
  pautaSessao?: {
    itens: PautaItem[]
    itemAtual?: {
      id: string
      titulo: string
      secao: string
      ordem: number
      status: string
    } | null
  }
  presencas?: Presenca[]
  quorum?: {
    total: number
    presentes: number
    ausentes: number
    percentual: number
  }
}

export interface PautaItem {
  id: string
  titulo: string
  descricao: string | null
  secao: string
  ordem: number
  status: string
  tipoAcao?: 'LEITURA' | 'DISCUSSAO' | 'VOTACAO' | 'COMUNICADO' | 'HOMENAGEM' | null
  iniciadoEm?: string | null
  finalizadoEm?: string | null
  proposicao?: {
    id: string
    numero: number
    ano: number
    titulo: string
    tipo: string
    status: string
    votacoes?: VotacaoRegistro[]
    autor?: {
      id: string
      nome: string
      apelido: string | null
    }
  }
}

export interface Presenca {
  id: string
  presente: boolean
  justificativa: string | null
  parlamentar: {
    id: string
    nome: string
    apelido: string | null
    partido: string | null
    foto: string | null
  }
}

export interface VotacaoRegistro {
  id: string
  voto: 'SIM' | 'NAO' | 'ABSTENCAO' | 'AUSENTE'
  parlamentar: {
    id: string
    nome: string
    apelido: string | null
    foto?: string | null
    partido?: string | null
  }
}

export interface EstatisticasVotacao {
  sim: number
  nao: number
  abstencao: number
  ausente: number
  total: number
  aprovado: boolean
}

// Constants
export const ORDEM_SECOES = [
  'EXPEDIENTE',
  'ORDEM_DO_DIA',
  'COMUNICACOES',
  'HONRAS',
  'EXPLICACOES_PESSOAIS',
  'OUTROS',
  'SEM_SECAO'
]

export const TIPO_SESSAO_LABELS: Record<string, string> = {
  'ORDINARIA': 'Ordinaria',
  'EXTRAORDINARIA': 'Extraordinaria',
  'SOLENE': 'Solene',
  'ESPECIAL': 'Especial'
}

export const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  'AGENDADA': { label: 'Agendada', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30' },
  'EM_ANDAMENTO': { label: 'Em Andamento', color: 'bg-green-500/20 text-green-300 border-green-400/30' },
  'SUSPENSA': { label: 'Sessao Suspensa', color: 'bg-orange-500/20 text-orange-300 border-orange-400/30' },
  'CONCLUIDA': { label: 'Sessao Finalizada', color: 'bg-blue-500/20 text-blue-300 border-blue-400/30' },
  'CANCELADA': { label: 'Cancelada', color: 'bg-red-500/20 text-red-300 border-red-400/30' }
}

// Helper functions
export function formatarTempo(segundos: number): string {
  const h = Math.floor(segundos / 3600)
  const m = Math.floor((segundos % 3600) / 60)
  const s = segundos % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export function calcularVotacao(votos: VotacaoRegistro[] = []): EstatisticasVotacao {
  const sim = votos.filter(v => v.voto === 'SIM').length
  const nao = votos.filter(v => v.voto === 'NAO').length
  const abstencao = votos.filter(v => v.voto === 'ABSTENCAO').length
  const ausente = votos.filter(v => v.voto === 'AUSENTE').length
  const total = sim + nao + abstencao + ausente
  const aprovado = total > 0 && sim > (nao + abstencao)
  return { sim, nao, abstencao, ausente, total, aprovado }
}

export function ordenarItensPauta(itens: PautaItem[]): PautaItem[] {
  return [...itens].sort((a, b) => {
    const secaoA = ORDEM_SECOES.indexOf(a.secao) !== -1 ? ORDEM_SECOES.indexOf(a.secao) : 999
    const secaoB = ORDEM_SECOES.indexOf(b.secao) !== -1 ? ORDEM_SECOES.indexOf(b.secao) : 999
    if (secaoA !== secaoB) return secaoA - secaoB
    return (a.ordem || 0) - (b.ordem || 0)
  })
}

export function getTipoSessaoLabel(tipo: string): string {
  return TIPO_SESSAO_LABELS[tipo] || tipo
}

export function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] || { label: status, color: 'bg-gray-500/20 text-gray-300' }
}

export function getInitials(nome: string): string {
  return nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

export function getVotoConfig(voto: string) {
  switch (voto) {
    case 'SIM':
      return { bg: 'bg-green-500/20', border: 'border-green-500/50', text: 'text-green-300', label: 'SIM', ring: 'ring-green-500', bgSolid: 'bg-green-600' }
    case 'NAO':
      return { bg: 'bg-red-500/20', border: 'border-red-500/50', text: 'text-red-300', label: 'NAO', ring: 'ring-red-500', bgSolid: 'bg-red-600' }
    default:
      return { bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', text: 'text-yellow-300', label: 'ABST.', ring: 'ring-yellow-500', bgSolid: 'bg-yellow-600' }
  }
}
