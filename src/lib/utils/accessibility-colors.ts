/**
 * Paleta de cores acessiveis para votacao
 *
 * Atende WCAG AA com contraste minimo de 4.5:1
 * Diferenciavel para daltonicos (protanopia, deuteranopia, tritanopia)
 * Usa formas/icones alem de cores para redundancia
 */

export type TipoVoto = 'SIM' | 'NAO' | 'ABSTENCAO' | 'AUSENTE' | null

export interface VotoStyleConfig {
  /** Classes de background */
  bg: string
  /** Classes de background com opacidade */
  bgLight: string
  /** Classes de texto */
  text: string
  /** Classes de borda */
  border: string
  /** Classes de ring/outline */
  ring: string
  /** Cor hex para graficos */
  hex: string
  /** Cor hex clara para graficos */
  hexLight: string
  /** Nome do icone Lucide sugerido */
  icon: 'check' | 'x' | 'minus' | 'user-x' | 'clock'
  /** Label acessivel */
  label: string
  /** Label curto */
  labelCurto: string
  /** Padrao visual para daltonicos (alem da cor) */
  pattern: 'solid' | 'striped' | 'dotted' | 'dashed'
}

/**
 * Configuracoes de estilo para cada tipo de voto
 * Cores escolhidas para:
 * - Contraste WCAG AA (4.5:1 minimo)
 * - Diferenciacao para daltonicos
 * - Consistencia semantica (verde=positivo, vermelho=negativo)
 */
export const VOTO_STYLES: Record<TipoVoto extends infer T ? T extends null ? 'null' : T : never, VotoStyleConfig> = {
  SIM: {
    // Verde escuro com azul para melhor visibilidade
    bg: 'bg-emerald-600',
    bgLight: 'bg-emerald-600/20',
    text: 'text-emerald-50',
    border: 'border-emerald-500',
    ring: 'ring-emerald-500/50',
    hex: '#059669',
    hexLight: '#d1fae5',
    icon: 'check',
    label: 'Sim (Favoravel)',
    labelCurto: 'SIM',
    pattern: 'solid'
  },
  NAO: {
    // Vermelho escuro, claramente diferente do verde
    bg: 'bg-rose-600',
    bgLight: 'bg-rose-600/20',
    text: 'text-rose-50',
    border: 'border-rose-500',
    ring: 'ring-rose-500/50',
    hex: '#e11d48',
    hexLight: '#ffe4e6',
    icon: 'x',
    label: 'Nao (Contrario)',
    labelCurto: 'NAO',
    pattern: 'striped'
  },
  ABSTENCAO: {
    // Amarelo/âmbar com bom contraste
    bg: 'bg-amber-500',
    bgLight: 'bg-amber-500/20',
    text: 'text-amber-950',
    border: 'border-amber-400',
    ring: 'ring-amber-400/50',
    hex: '#f59e0b',
    hexLight: '#fef3c7',
    icon: 'minus',
    label: 'Abstencao',
    labelCurto: 'ABST',
    pattern: 'dotted'
  },
  AUSENTE: {
    // Cinza neutro
    bg: 'bg-slate-500',
    bgLight: 'bg-slate-500/20',
    text: 'text-slate-50',
    border: 'border-slate-400',
    ring: 'ring-slate-400/50',
    hex: '#64748b',
    hexLight: '#f1f5f9',
    icon: 'user-x',
    label: 'Ausente',
    labelCurto: 'AUS',
    pattern: 'dashed'
  },
  null: {
    // Pendente/sem voto
    bg: 'bg-gray-400',
    bgLight: 'bg-gray-400/20',
    text: 'text-gray-50',
    border: 'border-gray-300',
    ring: 'ring-gray-300/20',
    hex: '#9ca3af',
    hexLight: '#f3f4f6',
    icon: 'clock',
    label: 'Pendente',
    labelCurto: '---',
    pattern: 'dashed'
  }
}

/**
 * Obter estilo para um tipo de voto
 */
export function getVotoStyle(voto: TipoVoto): VotoStyleConfig {
  return VOTO_STYLES[voto ?? 'null']
}

/**
 * Status de item de pauta
 */
export type StatusItem =
  | 'PENDENTE'
  | 'EM_DISCUSSAO'
  | 'EM_VOTACAO'
  | 'APROVADO'
  | 'REJEITADO'
  | 'ADIADO'
  | 'CONCLUIDO'
  | 'RETIRADO'
  | 'VISTA'

export interface StatusStyleConfig {
  bg: string
  bgLight: string
  text: string
  border: string
  icon: string
  label: string
  /** Se o status indica que o item esta ativo/em execucao */
  ativo: boolean
  /** Se o status indica conclusao */
  concluido: boolean
}

/**
 * Configuracoes de estilo para cada status de item
 */
export const STATUS_ITEM_STYLES: Record<StatusItem, StatusStyleConfig> = {
  PENDENTE: {
    bg: 'bg-slate-600',
    bgLight: 'bg-slate-600/20',
    text: 'text-slate-200',
    border: 'border-slate-500',
    icon: 'clock',
    label: 'Pendente',
    ativo: false,
    concluido: false
  },
  EM_DISCUSSAO: {
    bg: 'bg-blue-600',
    bgLight: 'bg-blue-600/20',
    text: 'text-blue-100',
    border: 'border-blue-500',
    icon: 'message-circle',
    label: 'Em Discussao',
    ativo: true,
    concluido: false
  },
  EM_VOTACAO: {
    bg: 'bg-purple-600',
    bgLight: 'bg-purple-600/20',
    text: 'text-purple-100',
    border: 'border-purple-500',
    icon: 'vote',
    label: 'Em Votacao',
    ativo: true,
    concluido: false
  },
  APROVADO: {
    bg: 'bg-emerald-600',
    bgLight: 'bg-emerald-600/20',
    text: 'text-emerald-100',
    border: 'border-emerald-500',
    icon: 'check-circle',
    label: 'Aprovado',
    ativo: false,
    concluido: true
  },
  REJEITADO: {
    bg: 'bg-rose-600',
    bgLight: 'bg-rose-600/20',
    text: 'text-rose-100',
    border: 'border-rose-500',
    icon: 'x-circle',
    label: 'Rejeitado',
    ativo: false,
    concluido: true
  },
  ADIADO: {
    bg: 'bg-amber-600',
    bgLight: 'bg-amber-600/20',
    text: 'text-amber-100',
    border: 'border-amber-500',
    icon: 'clock',
    label: 'Adiado',
    ativo: false,
    concluido: false
  },
  CONCLUIDO: {
    bg: 'bg-teal-600',
    bgLight: 'bg-teal-600/20',
    text: 'text-teal-100',
    border: 'border-teal-500',
    icon: 'check',
    label: 'Concluido',
    ativo: false,
    concluido: true
  },
  RETIRADO: {
    bg: 'bg-orange-600',
    bgLight: 'bg-orange-600/20',
    text: 'text-orange-100',
    border: 'border-orange-500',
    icon: 'minus-circle',
    label: 'Retirado',
    ativo: false,
    concluido: true
  },
  VISTA: {
    bg: 'bg-indigo-600',
    bgLight: 'bg-indigo-600/20',
    text: 'text-indigo-100',
    border: 'border-indigo-500',
    icon: 'eye',
    label: 'Vista',
    ativo: false,
    concluido: false
  }
}

/**
 * Obter estilo para um status de item
 */
export function getStatusItemStyle(status: string): StatusStyleConfig {
  return STATUS_ITEM_STYLES[status as StatusItem] ?? STATUS_ITEM_STYLES.PENDENTE
}

/**
 * Status da sessao
 */
export type StatusSessao = 'AGENDADA' | 'EM_ANDAMENTO' | 'SUSPENSA' | 'CONCLUIDA' | 'CANCELADA'

export interface StatusSessaoStyleConfig {
  bg: string
  bgLight: string
  text: string
  border: string
  icon: string
  label: string
}

export const STATUS_SESSAO_STYLES: Record<StatusSessao, StatusSessaoStyleConfig> = {
  AGENDADA: {
    bg: 'bg-blue-600',
    bgLight: 'bg-blue-600/20',
    text: 'text-blue-100',
    border: 'border-blue-500',
    icon: 'calendar',
    label: 'Agendada'
  },
  EM_ANDAMENTO: {
    bg: 'bg-green-600',
    bgLight: 'bg-green-600/20',
    text: 'text-green-100',
    border: 'border-green-500',
    icon: 'play-circle',
    label: 'Em Andamento'
  },
  CONCLUIDA: {
    bg: 'bg-gray-600',
    bgLight: 'bg-gray-600/20',
    text: 'text-gray-100',
    border: 'border-gray-500',
    icon: 'check-circle',
    label: 'Concluida'
  },
  CANCELADA: {
    bg: 'bg-red-600',
    bgLight: 'bg-red-600/20',
    text: 'text-red-100',
    border: 'border-red-500',
    icon: 'x-circle',
    label: 'Cancelada'
  },
  SUSPENSA: {
    bg: 'bg-orange-600',
    bgLight: 'bg-orange-600/20',
    text: 'text-orange-100',
    border: 'border-orange-500',
    icon: 'pause-circle',
    label: 'Suspensa'
  }
}

export function getStatusSessaoStyle(status: string): StatusSessaoStyleConfig {
  return STATUS_SESSAO_STYLES[status as StatusSessao] ?? STATUS_SESSAO_STYLES.AGENDADA
}

/**
 * Tipo de acao (para badges de item)
 */
export type TipoAcao = 'VOTACAO' | 'LEITURA' | 'DISCUSSAO' | 'COMUNICACAO' | 'COMUNICADO' | 'HOMENAGEM'

export interface TipoAcaoStyleConfig {
  bg: string
  bgLight: string
  text: string
  border: string
  icon: string
  label: string
}

export const TIPO_ACAO_STYLES: Record<TipoAcao, TipoAcaoStyleConfig> = {
  VOTACAO: {
    bg: 'bg-purple-600',
    bgLight: 'bg-purple-600/20',
    text: 'text-purple-200',
    border: 'border-purple-500/50',
    icon: 'vote',
    label: 'Votacao'
  },
  LEITURA: {
    bg: 'bg-blue-600',
    bgLight: 'bg-blue-600/20',
    text: 'text-blue-200',
    border: 'border-blue-500/50',
    icon: 'book-open',
    label: 'Leitura'
  },
  DISCUSSAO: {
    bg: 'bg-teal-600',
    bgLight: 'bg-teal-600/20',
    text: 'text-teal-200',
    border: 'border-teal-500/50',
    icon: 'message-circle',
    label: 'Discussao'
  },
  COMUNICACAO: {
    bg: 'bg-amber-600',
    bgLight: 'bg-amber-600/20',
    text: 'text-amber-200',
    border: 'border-amber-500/50',
    icon: 'megaphone',
    label: 'Comunicacao'
  },
  COMUNICADO: {
    bg: 'bg-amber-600',
    bgLight: 'bg-amber-600/20',
    text: 'text-amber-200',
    border: 'border-amber-500/50',
    icon: 'megaphone',
    label: 'Comunicado'
  },
  HOMENAGEM: {
    bg: 'bg-pink-600',
    bgLight: 'bg-pink-600/20',
    text: 'text-pink-200',
    border: 'border-pink-500/50',
    icon: 'award',
    label: 'Homenagem'
  }
}

export function getTipoAcaoStyle(tipo: string): TipoAcaoStyleConfig {
  return TIPO_ACAO_STYLES[tipo as TipoAcao] ?? TIPO_ACAO_STYLES.DISCUSSAO
}

/**
 * Resultado de votacao
 */
export type ResultadoVotacao = 'APROVADA' | 'REJEITADA' | 'EMPATE'

export interface ResultadoStyleConfig {
  bg: string
  bgGradient: string
  text: string
  border: string
  icon: string
  label: string
}

export const RESULTADO_STYLES: Record<ResultadoVotacao, ResultadoStyleConfig> = {
  APROVADA: {
    bg: 'bg-emerald-600',
    bgGradient: 'bg-gradient-to-r from-emerald-600 to-emerald-500',
    text: 'text-emerald-50',
    border: 'border-emerald-400',
    icon: 'check-circle',
    label: 'Aprovada'
  },
  REJEITADA: {
    bg: 'bg-rose-600',
    bgGradient: 'bg-gradient-to-r from-rose-600 to-rose-500',
    text: 'text-rose-50',
    border: 'border-rose-400',
    icon: 'x-circle',
    label: 'Rejeitada'
  },
  EMPATE: {
    bg: 'bg-amber-600',
    bgGradient: 'bg-gradient-to-r from-amber-600 to-amber-500',
    text: 'text-amber-50',
    border: 'border-amber-400',
    icon: 'minus-circle',
    label: 'Empate'
  }
}

export function getResultadoStyle(resultado: string): ResultadoStyleConfig {
  return RESULTADO_STYLES[resultado as ResultadoVotacao] ?? RESULTADO_STYLES.EMPATE
}
