/**
 * Design tokens compartilhados entre os paineis
 *
 * Garante consistencia visual entre:
 * - Painel Operador
 * - Painel TV/Telao
 * - Painel Publico
 */

// Breakpoints responsivos
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1400,
  '4k': 2560
} as const

// Tamanhos de fonte para diferentes resolucoes
export const FONT_SIZES = {
  /** Tela pequena (< 768px) */
  mobile: {
    titulo: 'text-xl',
    subtitulo: 'text-lg',
    corpo: 'text-base',
    pequeno: 'text-sm',
    micro: 'text-xs'
  },
  /** Tela media (768px - 1280px) */
  tablet: {
    titulo: 'text-2xl',
    subtitulo: 'text-xl',
    corpo: 'text-base',
    pequeno: 'text-sm',
    micro: 'text-xs'
  },
  /** Tela grande (1280px - 2560px) */
  desktop: {
    titulo: 'text-3xl',
    subtitulo: 'text-2xl',
    corpo: 'text-lg',
    pequeno: 'text-base',
    micro: 'text-sm'
  },
  /** Tela 4K (> 2560px) */
  '4k': {
    titulo: 'text-5xl',
    subtitulo: 'text-4xl',
    corpo: 'text-2xl',
    pequeno: 'text-xl',
    micro: 'text-lg'
  }
} as const

// Espacamentos
export const SPACING = {
  mobile: {
    container: 'p-4',
    card: 'p-3',
    gap: 'gap-3'
  },
  tablet: {
    container: 'p-5',
    card: 'p-4',
    gap: 'gap-4'
  },
  desktop: {
    container: 'p-6',
    card: 'p-5',
    gap: 'gap-6'
  },
  '4k': {
    container: 'p-8',
    card: 'p-6',
    gap: 'gap-8'
  }
} as const

// Cores de fundo padrao
export const BG_COLORS = {
  /** Fundo principal escuro */
  primary: 'bg-slate-900',
  /** Fundo secundario */
  secondary: 'bg-slate-800',
  /** Fundo de card */
  card: 'bg-slate-800/80',
  /** Fundo transparente com blur */
  glass: 'bg-white/10 backdrop-blur-lg',
  /** Fundo de header */
  header: 'bg-slate-800/90',
  /** Gradiente de fundo */
  gradient: 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
} as const

// Cores de borda
export const BORDER_COLORS = {
  default: 'border-slate-700',
  light: 'border-slate-600',
  glass: 'border-white/20',
  accent: 'border-blue-500'
} as const

// Cores de texto
export const TEXT_COLORS = {
  primary: 'text-white',
  secondary: 'text-slate-300',
  muted: 'text-slate-400',
  accent: 'text-blue-400'
} as const

// Tamanhos de icones
export const ICON_SIZES = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8',
  '2xl': 'h-10 w-10',
  '3xl': 'h-12 w-12'
} as const

// Tamanhos de cards de vereador baseado na quantidade
export function getVereadorCardSize(quantidade: number): 'sm' | 'md' | 'lg' {
  if (quantidade <= 9) return 'lg'
  if (quantidade <= 15) return 'md'
  return 'sm'
}

// Classes responsivas para grid de vereadores
export function getVereadorGridClasses(quantidade: number): string {
  if (quantidade <= 6) {
    return 'grid-cols-3 md:grid-cols-6'
  }
  if (quantidade <= 9) {
    return 'grid-cols-3 md:grid-cols-5 lg:grid-cols-9'
  }
  if (quantidade <= 12) {
    return 'grid-cols-4 md:grid-cols-6 lg:grid-cols-12'
  }
  if (quantidade <= 15) {
    return 'grid-cols-5 md:grid-cols-5 lg:grid-cols-15'
  }
  return 'grid-cols-5 md:grid-cols-7 lg:grid-cols-9'
}

// Intervalos de polling
export const POLLING_INTERVALS = {
  /** Durante votacao ativa */
  votacaoAtiva: 1000,
  /** Sessao em andamento */
  sessaoAtiva: 3000,
  /** Sessao inativa/concluida */
  sessaoInativa: 10000,
  /** Fallback SSE */
  sseFallback: 5000
} as const

// Duracoes de animacao
export const ANIMATION_DURATIONS = {
  fast: 150,
  normal: 300,
  slow: 500,
  resultado: 5000
} as const

// Z-index layers
export const Z_INDEX = {
  base: 0,
  dropdown: 10,
  modal: 50,
  toast: 100,
  overlay: 1000
} as const

// Classes utilitarias comuns
export const COMMON_CLASSES = {
  /** Card padrao */
  card: 'bg-slate-800 border-slate-700 text-white',
  /** Card glass */
  cardGlass: 'bg-white/10 backdrop-blur-lg border border-white/20 text-white',
  /** Botao padrao */
  button: 'bg-slate-700 hover:bg-slate-600 text-white border-slate-600',
  /** Badge de status ativo */
  badgeAtivo: 'bg-green-600/20 text-green-300 border-green-400/30',
  /** Input padrao */
  input: 'bg-slate-700 border-slate-600 text-white placeholder:text-slate-400'
} as const

const painelTokens = {
  BREAKPOINTS,
  FONT_SIZES,
  SPACING,
  BG_COLORS,
  BORDER_COLORS,
  TEXT_COLORS,
  ICON_SIZES,
  POLLING_INTERVALS,
  ANIMATION_DURATIONS,
  Z_INDEX,
  COMMON_CLASSES,
  getVereadorCardSize,
  getVereadorGridClasses
}

export default painelTokens
