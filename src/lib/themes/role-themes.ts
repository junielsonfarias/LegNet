/**
 * Sistema de Temas por Tipo de Usuário
 * Define cores e estilos visuais baseados no role do usuário
 */

import { UserRole } from '@prisma/client'

export interface RoleTheme {
  // Cores principais
  primary: string
  primaryHover: string
  primaryLight: string
  accent: string

  // Gradientes
  gradient: string
  gradientHover: string
  sidebarGradient: string

  // Badge do role
  badgeBg: string
  badgeText: string
  badgeBorder: string

  // Sidebar
  sidebarActiveBg: string
  sidebarActiveText: string
  sidebarHoverBg: string

  // Cards e elementos
  cardAccent: string
  iconColor: string

  // Informações do role
  label: string
  description: string
  icon: string
}

export const roleThemes: Record<UserRole, RoleTheme> = {
  // ADMIN: Roxo - Representa poder total e controle do sistema
  ADMIN: {
    primary: '#7c3aed',
    primaryHover: '#6d28d9',
    primaryLight: '#ede9fe',
    accent: '#8b5cf6',

    gradient: 'from-violet-600 to-purple-700',
    gradientHover: 'from-violet-700 to-purple-800',
    sidebarGradient: 'from-violet-50 via-purple-50 to-white',

    badgeBg: 'bg-violet-100',
    badgeText: 'text-violet-800',
    badgeBorder: 'border-violet-200',

    sidebarActiveBg: 'bg-violet-600',
    sidebarActiveText: 'text-white',
    sidebarHoverBg: 'hover:bg-violet-50',

    cardAccent: 'border-l-violet-500',
    iconColor: 'text-violet-600',

    label: 'Administrador',
    description: 'Acesso total ao sistema',
    icon: 'Shield'
  },

  // SECRETARIA: Ciano - Representa organização e administração
  SECRETARIA: {
    primary: '#0891b2',
    primaryHover: '#0e7490',
    primaryLight: '#cffafe',
    accent: '#06b6d4',

    gradient: 'from-cyan-600 to-teal-600',
    gradientHover: 'from-cyan-700 to-teal-700',
    sidebarGradient: 'from-cyan-50 via-teal-50 to-white',

    badgeBg: 'bg-cyan-100',
    badgeText: 'text-cyan-800',
    badgeBorder: 'border-cyan-200',

    sidebarActiveBg: 'bg-cyan-600',
    sidebarActiveText: 'text-white',
    sidebarHoverBg: 'hover:bg-cyan-50',

    cardAccent: 'border-l-cyan-500',
    iconColor: 'text-cyan-600',

    label: 'Secretaria',
    description: 'Gestão administrativa',
    icon: 'ClipboardList'
  },

  // EDITOR: Azul - Representa criação e edição de conteúdo
  EDITOR: {
    primary: '#2563eb',
    primaryHover: '#1d4ed8',
    primaryLight: '#dbeafe',
    accent: '#3b82f6',

    gradient: 'from-blue-600 to-blue-700',
    gradientHover: 'from-blue-700 to-blue-800',
    sidebarGradient: 'from-blue-50 via-indigo-50 to-white',

    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-800',
    badgeBorder: 'border-blue-200',

    sidebarActiveBg: 'bg-blue-600',
    sidebarActiveText: 'text-white',
    sidebarHoverBg: 'hover:bg-blue-50',

    cardAccent: 'border-l-blue-500',
    iconColor: 'text-blue-600',

    label: 'Editor',
    description: 'Gestão de conteúdo',
    icon: 'Edit'
  },

  // OPERADOR: Verde - Representa operação e execução
  OPERADOR: {
    primary: '#059669',
    primaryHover: '#047857',
    primaryLight: '#d1fae5',
    accent: '#10b981',

    gradient: 'from-emerald-600 to-green-600',
    gradientHover: 'from-emerald-700 to-green-700',
    sidebarGradient: 'from-emerald-50 via-green-50 to-white',

    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    badgeBorder: 'border-emerald-200',

    sidebarActiveBg: 'bg-emerald-600',
    sidebarActiveText: 'text-white',
    sidebarHoverBg: 'hover:bg-emerald-50',

    cardAccent: 'border-l-emerald-500',
    iconColor: 'text-emerald-600',

    label: 'Operador',
    description: 'Operação de sessões',
    icon: 'Monitor'
  },

  // PARLAMENTAR: Âmbar/Dourado - Representa autoridade legislativa
  PARLAMENTAR: {
    primary: '#d97706',
    primaryHover: '#b45309',
    primaryLight: '#fef3c7',
    accent: '#f59e0b',

    gradient: 'from-amber-500 to-orange-500',
    gradientHover: 'from-amber-600 to-orange-600',
    sidebarGradient: 'from-amber-50 via-orange-50 to-white',

    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-200',

    sidebarActiveBg: 'bg-amber-500',
    sidebarActiveText: 'text-white',
    sidebarHoverBg: 'hover:bg-amber-50',

    cardAccent: 'border-l-amber-500',
    iconColor: 'text-amber-600',

    label: 'Parlamentar',
    description: 'Vereador(a)',
    icon: 'User'
  },

  // AUXILIAR_LEGISLATIVO: Rosa/Magenta - Representa suporte ao trabalho legislativo
  AUXILIAR_LEGISLATIVO: {
    primary: '#be185d',
    primaryHover: '#9d174d',
    primaryLight: '#fce7f3',
    accent: '#ec4899',

    gradient: 'from-pink-600 to-rose-600',
    gradientHover: 'from-pink-700 to-rose-700',
    sidebarGradient: 'from-pink-50 via-rose-50 to-white',

    badgeBg: 'bg-pink-100',
    badgeText: 'text-pink-800',
    badgeBorder: 'border-pink-200',

    sidebarActiveBg: 'bg-pink-600',
    sidebarActiveText: 'text-white',
    sidebarHoverBg: 'hover:bg-pink-50',

    cardAccent: 'border-l-pink-500',
    iconColor: 'text-pink-600',

    label: 'Auxiliar Legislativo',
    description: 'Suporte ao processo legislativo',
    icon: 'FileText'
  },

  // USER: Cinza - Representa acesso básico/visitante
  USER: {
    primary: '#6b7280',
    primaryHover: '#4b5563',
    primaryLight: '#f3f4f6',
    accent: '#9ca3af',

    gradient: 'from-gray-500 to-gray-600',
    gradientHover: 'from-gray-600 to-gray-700',
    sidebarGradient: 'from-gray-50 via-slate-50 to-white',

    badgeBg: 'bg-gray-100',
    badgeText: 'text-gray-700',
    badgeBorder: 'border-gray-200',

    sidebarActiveBg: 'bg-gray-600',
    sidebarActiveText: 'text-white',
    sidebarHoverBg: 'hover:bg-gray-100',

    cardAccent: 'border-l-gray-400',
    iconColor: 'text-gray-500',

    label: 'Usuário',
    description: 'Acesso básico',
    icon: 'UserCircle'
  }
}

/**
 * Retorna o tema baseado no role do usuário
 */
export function getRoleTheme(role: UserRole): RoleTheme {
  return roleThemes[role] || roleThemes.USER
}

/**
 * Retorna classes CSS dinâmicas para o tema
 */
export function getThemeClasses(role: UserRole) {
  const theme = getRoleTheme(role)

  return {
    // Botão primário
    primaryButton: `bg-gradient-to-r ${theme.gradient} hover:${theme.gradientHover} text-white`,

    // Badge do role
    roleBadge: `${theme.badgeBg} ${theme.badgeText} border ${theme.badgeBorder}`,

    // Sidebar
    sidebarWrapper: `bg-gradient-to-b ${theme.sidebarGradient}`,
    sidebarActive: `${theme.sidebarActiveBg} ${theme.sidebarActiveText}`,
    sidebarHover: theme.sidebarHoverBg,

    // Cards
    cardAccent: `border-l-4 ${theme.cardAccent}`,

    // Ícones
    icon: theme.iconColor
  }
}

/**
 * CSS Variables para aplicar o tema dinamicamente
 */
export function getThemeCSSVariables(role: UserRole): Record<string, string> {
  const theme = getRoleTheme(role)

  return {
    '--role-primary': theme.primary,
    '--role-primary-hover': theme.primaryHover,
    '--role-primary-light': theme.primaryLight,
    '--role-accent': theme.accent
  }
}
