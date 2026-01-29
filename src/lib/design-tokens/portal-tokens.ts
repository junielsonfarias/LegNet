/**
 * Design Tokens Centralizados - Portal Institucional
 * Sistema de design consistente para acessibilidade e responsividade
 * Conformidade: WCAG 2.1 AA
 */

// =============================================================================
// ESPACAMENTO (Spacing Tokens)
// =============================================================================
export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
  '4xl': '6rem',   // 96px
} as const

// Espacamento para componentes especificos
export const componentSpacing = {
  cardPadding: spacing.lg,
  sectionGap: spacing['2xl'],
  containerPadding: spacing.md,
  buttonPadding: `${spacing.sm} ${spacing.md}`,
  inputPadding: `${spacing.sm} ${spacing.md}`,
  navItemPadding: `${spacing.sm} ${spacing.lg}`,
} as const

// =============================================================================
// TIPOGRAFIA (Typography Tokens)
// =============================================================================
export const typography = {
  // Tamanhos de fonte responsivos (mobile-first)
  fontSize: {
    xs: 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)',      // 12-14px
    sm: 'clamp(0.875rem, 0.8rem + 0.375vw, 1rem)',        // 14-16px
    base: 'clamp(1rem, 0.9rem + 0.5vw, 1.125rem)',        // 16-18px
    lg: 'clamp(1.125rem, 1rem + 0.625vw, 1.25rem)',       // 18-20px
    xl: 'clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem)',        // 20-24px
    '2xl': 'clamp(1.5rem, 1.25rem + 1.25vw, 2rem)',       // 24-32px
    '3xl': 'clamp(1.875rem, 1.5rem + 1.875vw, 2.5rem)',   // 30-40px
    '4xl': 'clamp(2.25rem, 1.75rem + 2.5vw, 3rem)',       // 36-48px
    '5xl': 'clamp(3rem, 2.25rem + 3.75vw, 4rem)',         // 48-64px
  },

  // Alturas de linha para legibilidade
  lineHeight: {
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',      // Padrao para texto de corpo
    relaxed: '1.625',   // Melhor para acessibilidade
    loose: '2',         // Para leitura facilitada
  },

  // Pesos de fonte
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },

  // Espacamento de letras
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const

// =============================================================================
// CORES (Color Tokens)
// =============================================================================
export const colors = {
  // Cores primarias institucionais
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',  // Cor principal da camara
    900: '#1e3a8a',
    950: '#172554',
  },

  // Cores secundarias
  secondary: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    950: '#052e16',
  },

  // Cores de feedback
  success: '#16a34a',
  warning: '#d97706',
  error: '#dc2626',
  info: '#0284c7',

  // Cores neutras
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a',
  },
} as const

// Cores para modo de alto contraste
export const highContrastColors = {
  background: '#000000',
  foreground: '#ffffff',
  primary: '#ffff00',      // Amarelo para links/botoes
  secondary: '#00ffff',    // Ciano para elementos secundarios
  accent: '#ff00ff',       // Magenta para destaques
  success: '#00ff00',      // Verde brilhante
  warning: '#ffaa00',      // Laranja
  error: '#ff0000',        // Vermelho
  border: '#ffffff',
  focus: '#ffff00',
  muted: '#888888',
} as const

// =============================================================================
// BREAKPOINTS (Mobile-First)
// =============================================================================
export const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1400px',
} as const

// Media queries helpers
export const mediaQueries = {
  xs: `(min-width: ${breakpoints.xs})`,
  sm: `(min-width: ${breakpoints.sm})`,
  md: `(min-width: ${breakpoints.md})`,
  lg: `(min-width: ${breakpoints.lg})`,
  xl: `(min-width: ${breakpoints.xl})`,
  '2xl': `(min-width: ${breakpoints['2xl']})`,
  // Queries especiais
  touch: '(hover: none) and (pointer: coarse)',
  mouse: '(hover: hover) and (pointer: fine)',
  reducedMotion: '(prefers-reduced-motion: reduce)',
  highContrast: '(prefers-contrast: high)',
  darkMode: '(prefers-color-scheme: dark)',
} as const

// =============================================================================
// ANIMACOES
// =============================================================================
export const animations = {
  // Duracoes
  duration: {
    instant: '0ms',
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    slower: '700ms',
  },

  // Curvas de easing
  easing: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
} as const

// =============================================================================
// SOMBRAS
// =============================================================================
export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  // Sombras para foco (acessibilidade)
  focusRing: '0 0 0 3px rgb(59 130 246 / 0.5)',
  focusRingHighContrast: '0 0 0 3px #ffff00',
} as const

// =============================================================================
// BORDAS E RAIOS
// =============================================================================
export const borders = {
  radius: {
    none: '0',
    sm: '0.125rem',    // 2px
    base: '0.25rem',   // 4px
    md: '0.375rem',    // 6px
    lg: '0.5rem',      // 8px
    xl: '0.75rem',     // 12px
    '2xl': '1rem',     // 16px
    '3xl': '1.5rem',   // 24px
    full: '9999px',
  },
  width: {
    none: '0',
    thin: '1px',
    base: '2px',
    thick: '3px',
  },
} as const

// =============================================================================
// TAMANHOS DE TOQUE (Touch Targets)
// Conformidade WCAG: minimo 44x44px
// =============================================================================
export const touchTargets = {
  min: '44px',       // Minimo WCAG
  comfortable: '48px',
  large: '56px',
} as const

// =============================================================================
// Z-INDEX
// =============================================================================
export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
} as const

// =============================================================================
// ACESSIBILIDADE - Configuracoes
// =============================================================================
export const accessibilityConfig = {
  // Niveis de tamanho de fonte
  fontSizeLevels: {
    normal: 1,
    medium: 1.15,
    large: 1.3,
  },

  // Niveis de espacamento de linha
  lineHeightLevels: {
    normal: 1.5,
    comfortable: 1.75,
    spacious: 2,
  },

  // Tempo minimo para animacoes (para reducedMotion)
  minAnimationDuration: 0,

  // Contrast ratio minimo (WCAG AA)
  minContrastRatio: 4.5,
  minContrastRatioLarge: 3, // Para texto grande (18pt+ ou 14pt bold+)
} as const

// =============================================================================
// TOKENS PARA TAILWIND CSS
// =============================================================================
export const tailwindTokens = {
  spacing: {
    'portal-xs': spacing.xs,
    'portal-sm': spacing.sm,
    'portal-md': spacing.md,
    'portal-lg': spacing.lg,
    'portal-xl': spacing.xl,
    'portal-2xl': spacing['2xl'],
    'portal-3xl': spacing['3xl'],
    'portal-4xl': spacing['4xl'],
  },
  fontSize: {
    'portal-xs': [typography.fontSize.xs, { lineHeight: typography.lineHeight.normal }],
    'portal-sm': [typography.fontSize.sm, { lineHeight: typography.lineHeight.normal }],
    'portal-base': [typography.fontSize.base, { lineHeight: typography.lineHeight.relaxed }],
    'portal-lg': [typography.fontSize.lg, { lineHeight: typography.lineHeight.relaxed }],
    'portal-xl': [typography.fontSize.xl, { lineHeight: typography.lineHeight.snug }],
    'portal-2xl': [typography.fontSize['2xl'], { lineHeight: typography.lineHeight.tight }],
    'portal-3xl': [typography.fontSize['3xl'], { lineHeight: typography.lineHeight.tight }],
    'portal-4xl': [typography.fontSize['4xl'], { lineHeight: typography.lineHeight.tight }],
    'portal-5xl': [typography.fontSize['5xl'], { lineHeight: typography.lineHeight.tight }],
  },
} as const

// =============================================================================
// HELPER: CSS Custom Properties
// =============================================================================
export function getCSSVariables() {
  return {
    // Espacamento
    '--portal-space-xs': spacing.xs,
    '--portal-space-sm': spacing.sm,
    '--portal-space-md': spacing.md,
    '--portal-space-lg': spacing.lg,
    '--portal-space-xl': spacing.xl,

    // Tipografia
    '--portal-text-xs': typography.fontSize.xs,
    '--portal-text-sm': typography.fontSize.sm,
    '--portal-text-base': typography.fontSize.base,
    '--portal-text-lg': typography.fontSize.lg,
    '--portal-text-xl': typography.fontSize.xl,
    '--portal-text-2xl': typography.fontSize['2xl'],
    '--portal-text-3xl': typography.fontSize['3xl'],
    '--portal-text-4xl': typography.fontSize['4xl'],

    // Cores primarias
    '--portal-primary': colors.primary[800],
    '--portal-primary-light': colors.primary[600],
    '--portal-primary-dark': colors.primary[900],

    // Alto contraste
    '--portal-hc-bg': highContrastColors.background,
    '--portal-hc-fg': highContrastColors.foreground,
    '--portal-hc-primary': highContrastColors.primary,
    '--portal-hc-focus': highContrastColors.focus,

    // Animacoes
    '--portal-duration-fast': animations.duration.fast,
    '--portal-duration-normal': animations.duration.normal,
    '--portal-duration-slow': animations.duration.slow,
    '--portal-easing': animations.easing.easeInOut,

    // Touch targets
    '--portal-touch-min': touchTargets.min,
    '--portal-touch-comfortable': touchTargets.comfortable,
  }
}

// Export default
export default {
  spacing,
  componentSpacing,
  typography,
  colors,
  highContrastColors,
  breakpoints,
  mediaQueries,
  animations,
  shadows,
  borders,
  touchTargets,
  zIndex,
  accessibilityConfig,
  tailwindTokens,
  getCSSVariables,
}
