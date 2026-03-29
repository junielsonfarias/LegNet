/**
 * Matriz de transições válidas de status para proposições legislativas.
 * Define quais status podem transicionar para quais outros status.
 *
 * Baseado no fluxo legislativo:
 * APRESENTADA → EM_TRAMITACAO → AGUARDANDO_PAUTA → EM_PAUTA → EM_DISCUSSAO → EM_VOTACAO → APROVADA/REJEITADA → SANCIONADA → PROMULGADA
 */

export type StatusProposicao =
  | 'APRESENTADA'
  | 'EM_TRAMITACAO'
  | 'AGUARDANDO_PAUTA'
  | 'EM_PAUTA'
  | 'EM_DISCUSSAO'
  | 'EM_VOTACAO'
  | 'APROVADA'
  | 'REJEITADA'
  | 'ARQUIVADA'
  | 'VETADA'
  | 'SANCIONADA'
  | 'PROMULGADA'

export const VALID_STATUS_TRANSITIONS: Record<StatusProposicao, StatusProposicao[]> = {
  'APRESENTADA': ['EM_TRAMITACAO', 'ARQUIVADA'],
  'EM_TRAMITACAO': ['AGUARDANDO_PAUTA', 'EM_PAUTA', 'REJEITADA', 'ARQUIVADA'],
  'AGUARDANDO_PAUTA': ['EM_PAUTA', 'EM_TRAMITACAO', 'ARQUIVADA'],
  'EM_PAUTA': ['EM_DISCUSSAO', 'EM_VOTACAO', 'AGUARDANDO_PAUTA', 'ARQUIVADA'],
  'EM_DISCUSSAO': ['EM_VOTACAO', 'AGUARDANDO_PAUTA', 'ARQUIVADA'],
  'EM_VOTACAO': ['APROVADA', 'REJEITADA', 'AGUARDANDO_PAUTA'],
  'APROVADA': ['SANCIONADA', 'VETADA', 'PROMULGADA'],
  'REJEITADA': ['ARQUIVADA'],
  'ARQUIVADA': ['EM_TRAMITACAO'], // Permite desarquivar
  'VETADA': ['EM_TRAMITACAO', 'ARQUIVADA'], // Veto pode ser derrubado
  'SANCIONADA': ['PROMULGADA'],
  'PROMULGADA': [],
}

// Status finais que não permitem edição de dados da proposição
export const STATUS_FINAIS: StatusProposicao[] = ['PROMULGADA']

// Status que indicam que a proposição está em tramitação ativa
export const STATUS_ATIVOS: StatusProposicao[] = [
  'APRESENTADA', 'EM_TRAMITACAO', 'AGUARDANDO_PAUTA', 'EM_PAUTA', 'EM_DISCUSSAO', 'EM_VOTACAO'
]

/**
 * Valida se uma transição de status é permitida.
 * @returns Objeto com resultado e mensagem de erro se inválido
 */
export function validarTransicaoStatus(
  statusAtual: string,
  novoStatus: string
): { valid: boolean; error?: string } {
  const atual = statusAtual as StatusProposicao
  const novo = novoStatus as StatusProposicao

  const transicoesPermitidas = VALID_STATUS_TRANSITIONS[atual]
  if (!transicoesPermitidas) {
    return { valid: false, error: `Status atual '${atual}' nao e reconhecido` }
  }

  if (!transicoesPermitidas.includes(novo)) {
    return {
      valid: false,
      error: `Transicao de '${atual}' para '${novo}' nao e permitida. Transicoes validas: ${transicoesPermitidas.join(', ') || 'nenhuma (status final)'}`
    }
  }

  return { valid: true }
}
