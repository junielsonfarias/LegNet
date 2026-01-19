/**
 * Skip Link - Componente de Acessibilidade
 * Permite que usuarios de teclado pulem diretamente para o conteudo principal
 * Conformidade: WCAG 2.1 AA - Bypass Blocks (2.4.1)
 */

'use client'

import { cn } from '@/lib/utils'

interface SkipLinkProps {
  href?: string
  children?: React.ReactNode
  className?: string
}

export function SkipLink({
  href = '#main-content',
  children = 'Pular para o conteudo principal',
  className
}: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        'sr-only focus:not-sr-only',
        'fixed top-0 left-0 z-[100]',
        'bg-primary text-primary-foreground',
        'px-4 py-2 m-2 rounded-md',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'transition-transform duration-200',
        'transform -translate-y-full focus:translate-y-0',
        className
      )}
    >
      {children}
    </a>
  )
}

/**
 * Componente para marcar a area principal do conteudo
 */
interface MainContentProps {
  children: React.ReactNode
  className?: string
}

export function MainContent({ children, className }: MainContentProps) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className={cn('outline-none', className)}
      role="main"
      aria-label="Conteudo principal"
    >
      {children}
    </main>
  )
}

/**
 * Componente de regiao de navegacao
 */
interface NavigationRegionProps {
  children: React.ReactNode
  label: string
  className?: string
}

export function NavigationRegion({ children, label, className }: NavigationRegionProps) {
  return (
    <nav
      aria-label={label}
      className={className}
    >
      {children}
    </nav>
  )
}

/**
 * Componente de anuncio para leitores de tela
 */
interface LiveRegionProps {
  message: string
  type?: 'polite' | 'assertive'
  className?: string
}

export function LiveRegion({ message, type = 'polite', className }: LiveRegionProps) {
  return (
    <div
      aria-live={type}
      aria-atomic="true"
      className={cn('sr-only', className)}
    >
      {message}
    </div>
  )
}

/**
 * Hook para anuncios de tela
 */
export function useAnnounce() {
  const announce = (message: string, type: 'polite' | 'assertive' = 'polite') => {
    const region = document.createElement('div')
    region.setAttribute('aria-live', type)
    region.setAttribute('aria-atomic', 'true')
    region.className = 'sr-only'
    region.textContent = message
    document.body.appendChild(region)

    setTimeout(() => {
      document.body.removeChild(region)
    }, 1000)
  }

  return { announce }
}
