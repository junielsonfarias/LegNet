import type { AudienciaPublica, ParticipanteAudiencia } from '@/lib/parlamentares-data'

export type { AudienciaPublica, ParticipanteAudiencia }

export interface ParlamentarApi {
  id: string
  nome: string
  apelido?: string
  partido?: string
}

export interface AudienciaFormData extends Partial<AudienciaPublica> {
  participantes: ParticipanteAudiencia[]
}

export interface ParticipanteFormData {
  nome: string
  cargo: string
  instituicao: string
  tipo: 'PARLAMENTAR' | 'CONVIDADO' | 'CIDADAO' | 'ORGAO_PUBLICO' | 'ENTIDADE' | 'ESPECIALISTA'
  confirmado: boolean
}

export const INITIAL_FORM_DATA: AudienciaFormData = {
  titulo: '',
  descricao: '',
  tipo: 'ORDINARIA',
  status: 'AGENDADA',
  dataHora: '',
  local: '',
  endereco: '',
  responsavel: '',
  parlamentarId: '',
  comissaoId: '',
  objetivo: '',
  publicoAlvo: '',
  observacoes: '',
  participantes: [],
  materiaLegislativaId: '',
  transmissaoAoVivo: {
    ativa: false,
    url: '',
    plataforma: 'YouTube',
    status: 'INATIVA'
  },
  inscricoesPublicas: {
    ativa: false,
    dataLimite: '',
    linkInscricao: '',
    totalInscritos: 0
  },
  publicacaoPublica: {
    ativa: false,
    visivelPortal: true,
    destaque: false
  },
  cronograma: {
    inicio: '',
    fim: '',
    pausas: [],
    blocos: []
  }
}

export const INITIAL_PARTICIPANTE_FORM: ParticipanteFormData = {
  nome: '',
  cargo: '',
  instituicao: '',
  tipo: 'CIDADAO',
  confirmado: false
}

// Helper functions
export function getStatusColor(status: string): string {
  switch (status) {
    case 'AGENDADA': return 'bg-blue-100 text-blue-800'
    case 'EM_ANDAMENTO': return 'bg-yellow-100 text-yellow-800'
    case 'CONCLUIDA': return 'bg-green-100 text-green-800'
    case 'CANCELADA': return 'bg-red-100 text-red-800'
    case 'ADIADA': return 'bg-orange-100 text-orange-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export function getTipoColor(tipo: string): string {
  switch (tipo) {
    case 'ORDINARIA': return 'bg-blue-100 text-blue-800'
    case 'EXTRAORDINARIA': return 'bg-orange-100 text-orange-800'
    case 'ESPECIAL': return 'bg-purple-100 text-purple-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export function getParticipanteColor(tipo: string): string {
  switch (tipo) {
    case 'PARLAMENTAR': return 'bg-blue-100 text-blue-800'
    case 'CONVIDADO': return 'bg-green-100 text-green-800'
    case 'CIDADAO': return 'bg-purple-100 text-purple-800'
    case 'ORGAO_PUBLICO': return 'bg-orange-100 text-orange-800'
    case 'ENTIDADE': return 'bg-pink-100 text-pink-800'
    case 'ESPECIALISTA': return 'bg-yellow-100 text-yellow-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'AGENDADA': return 'Agendada'
    case 'EM_ANDAMENTO': return 'Em Andamento'
    case 'CONCLUIDA': return 'Concluida'
    case 'CANCELADA': return 'Cancelada'
    case 'ADIADA': return 'Adiada'
    default: return status
  }
}

export function getTipoLabel(tipo: string): string {
  switch (tipo) {
    case 'ORDINARIA': return 'Ordinaria'
    case 'EXTRAORDINARIA': return 'Extraordinaria'
    case 'ESPECIAL': return 'Especial'
    default: return tipo
  }
}

export function getParticipanteLabel(tipo: string): string {
  switch (tipo) {
    case 'PARLAMENTAR': return 'Parlamentar'
    case 'CONVIDADO': return 'Convidado'
    case 'CIDADAO': return 'Cidadao'
    case 'ORGAO_PUBLICO': return 'Orgao Publico'
    case 'ENTIDADE': return 'Entidade'
    case 'ESPECIALISTA': return 'Especialista'
    default: return tipo
  }
}
