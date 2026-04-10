/**
 * Tipos e constantes para o serviço de tramitação
 * Extraído de tramitacao-service.ts para melhor organização
 */

// ======================================================================
// Interfaces CRUD
// ======================================================================

export interface TramitacaoListFilters {
  proposicaoId?: string
  tipoTramitacaoId?: string
  unidadeId?: string
  status?: string
  resultado?: string
  automatica?: boolean | null
  from?: string
  to?: string
  search?: string
}

export interface PaginationParams {
  page: number
  limit: number
}

export interface TramitacaoCreateData {
  proposicaoId: string
  tipoTramitacaoId: string
  unidadeId?: string
  dataEntrada?: string
  dataSaida?: string
  status?: 'RECEBIDA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA'
  observacoes?: string
  parecer?: string
  resultado?: 'APROVADO' | 'REJEITADO' | 'APROVADO_COM_EMENDAS' | 'ARQUIVADO'
  responsavelId?: string
  prazoVencimento?: string
  diasVencidos?: number
  automatica?: boolean
}

export interface TramitacaoUpdateData {
  tipoTramitacaoId?: string
  unidadeId?: string
  dataEntrada?: string
  dataSaida?: string | null
  status?: 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA'
  observacoes?: string | null
  parecer?: string | null
  resultado?: 'APROVADO' | 'REJEITADO' | 'APROVADO_COM_EMENDAS' | 'ARQUIVADO' | null
  responsavelId?: string | null
  prazoVencimento?: string | null
  diasVencidos?: number | null
  automatica?: boolean
}

export interface TramitacaoActionReopen {
  action: 'reopen'
  observacoes?: string | null
}

export interface TramitacaoActionFinalize {
  action: 'finalize'
  observacoes?: string | null
  resultado?: 'APROVADO' | 'REJEITADO' | 'APROVADO_COM_EMENDAS' | 'ARQUIVADO' | null
}

// ======================================================================
// Tipos de Regras de Negocio
// ======================================================================

export type TipoParecer = 'FAVORAVEL' | 'CONTRARIO' | 'FAVORAVEL_COM_EMENDAS' | 'PELA_INCONSTITUCIONALIDADE' | 'INCOMPETENCIA'

export type RegimeTramitacao = 'NORMAL' | 'PRIORIDADE' | 'URGENCIA' | 'URGENCIA_URGENTISSIMA'

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  rule?: string
}

export interface TramitacaoData {
  proposicaoId: string
  tipoTramitacaoId: string
  unidadeId: string
  observacoes?: string
  responsavelId?: string
}

export type TramitacaoResultado = 'APROVADO' | 'REJEITADO' | 'APROVADO_COM_EMENDAS' | 'ARQUIVADO'

export interface AvancarEtapaResult {
  success: boolean
  errors: string[]
  warnings: string[]
  tramitacaoAnterior?: {
    id: string
    etapa: string
    status: string
  }
  tramitacaoNova?: {
    id: string
    etapa: string
    prazoVencimento?: Date
  }
  etapaFinal: boolean
  proposicaoStatus?: string
}

// ======================================================================
// Constantes
// ======================================================================

export const PRAZOS_PARECER_DIAS: Record<RegimeTramitacao, number> = {
  NORMAL: 15,
  PRIORIDADE: 10,
  URGENCIA: 5,
  URGENCIA_URGENTISSIMA: 0
}

export const REGRAS_TRAMITACAO = {
  'RN-030': 'Toda proposição deve passar pela CLJ (exceto moções, votos, requerimentos)',
  'RN-031': 'Proposições podem ser distribuídas a múltiplas comissões conforme matéria',
  'RN-032': 'Prazos: Normal=15d, Prioridade=10d, Urgência=5d, Urgência Urgentíssima=imediato',
  'RN-033': 'Proposição só pode ser votada após parecer das comissões',
  'RN-034': 'Pareceres: favorável, contrário, favorável com emendas, pela inconstitucionalidade',
  'RN-035': 'Toda movimentação deve ser registrada com data, responsável e despacho',
  'RN-036': 'Sistema deve notificar interessados sobre tramitação',
  'RN-037': 'Alertar sobre prazos vencidos ou próximos de vencer'
}
