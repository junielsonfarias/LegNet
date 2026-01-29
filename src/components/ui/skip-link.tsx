/**
 * Skip Links - Sistema de Acessibilidade Expandido
 * Permite que usuarios de teclado pulem para diferentes secoes
 * Conformidade: WCAG 2.1 AA - Bypass Blocks (2.4.1)
 */

'use client'

import { useCallback, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

// =============================================================================
// SKIP LINKS MULTIPLOS
// =============================================================================

interface SkipLinkItem {
  href: string
  label: string
}

interface SkipLinksProps {
  links?: SkipLinkItem[]
  className?: string
}

const defaultLinks: SkipLinkItem[] = [
  { href: '#main-content', label: 'Pular para o conteudo principal' },
  { href: '#main-nav', label: 'Pular para a navegacao' },
  { href: '#footer', label: 'Pular para o rodape' },
]

export function SkipLinks({ links = defaultLinks, className }: SkipLinksProps) {
  return (
    <div
      className={cn(
        'fixed top-0 left-0 z-[9999] flex flex-col gap-1 p-2',
        className
      )}
      role="navigation"
      aria-label="Links de navegacao rapida"
    >
      {links.map((link, index) => (
        <a
          key={link.href}
          href={link.href}
          className={cn(
            'sr-only focus:not-sr-only',
            'bg-camara-primary text-white',
            'px-4 py-3 rounded-md font-medium',
            'focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-camara-primary',
            'transition-all duration-200',
            'transform -translate-y-full focus:translate-y-0',
            'shadow-lg',
            'min-w-[200px] text-center',
            // Delay para animacao staggered
            index === 0 && 'focus:delay-0',
            index === 1 && 'focus:delay-75',
            index === 2 && 'focus:delay-150'
          )}
          style={{
            transitionDelay: `${index * 50}ms`
          }}
        >
          {link.label}
        </a>
      ))}
    </div>
  )
}

// =============================================================================
// SKIP LINK SIMPLES (Retrocompatibilidade)
// =============================================================================

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
        'fixed top-0 left-0 z-[9999]',
        'bg-camara-primary text-white',
        'px-4 py-3 m-2 rounded-md font-medium',
        'focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2',
        'transition-transform duration-200',
        'transform -translate-y-full focus:translate-y-0',
        'shadow-lg',
        className
      )}
    >
      {children}
    </a>
  )
}

// =============================================================================
// MAIN CONTENT - Area principal do conteudo
// =============================================================================

interface MainContentProps {
  children: React.ReactNode
  className?: string
  as?: 'main' | 'div'
}

export function MainContent({
  children,
  className,
  as: Component = 'main'
}: MainContentProps) {
  return (
    <Component
      id="main-content"
      tabIndex={-1}
      className={cn('outline-none focus:outline-none', className)}
      role="main"
      aria-label="Conteudo principal"
    >
      {children}
    </Component>
  )
}

// =============================================================================
// NAVIGATION REGION - Regiao de navegacao acessivel
// =============================================================================

interface NavigationRegionProps {
  children: React.ReactNode
  label: string
  id?: string
  className?: string
}

export function NavigationRegion({
  children,
  label,
  id = 'main-nav',
  className
}: NavigationRegionProps) {
  return (
    <nav
      id={id}
      aria-label={label}
      role="navigation"
      tabIndex={-1}
      className={cn('outline-none focus:outline-none', className)}
    >
      {children}
    </nav>
  )
}

// =============================================================================
// FOOTER REGION - Rodape acessivel
// =============================================================================

interface FooterRegionProps {
  children: React.ReactNode
  className?: string
}

export function FooterRegion({ children, className }: FooterRegionProps) {
  return (
    <footer
      id="footer"
      role="contentinfo"
      tabIndex={-1}
      aria-label="Rodape do site"
      className={cn('outline-none focus:outline-none', className)}
    >
      {children}
    </footer>
  )
}

// =============================================================================
// COMPLEMENTARY REGION - Regiao complementar (sidebar)
// =============================================================================

interface ComplementaryRegionProps {
  children: React.ReactNode
  label: string
  id?: string
  className?: string
}

export function ComplementaryRegion({
  children,
  label,
  id = 'sidebar',
  className
}: ComplementaryRegionProps) {
  return (
    <aside
      id={id}
      role="complementary"
      aria-label={label}
      tabIndex={-1}
      className={cn('outline-none focus:outline-none', className)}
    >
      {children}
    </aside>
  )
}

// =============================================================================
// LIVE REGION - Anuncios para leitores de tela
// =============================================================================

interface LiveRegionProps {
  message: string
  type?: 'polite' | 'assertive'
  atomic?: boolean
  className?: string
}

export function LiveRegion({
  message,
  type = 'polite',
  atomic = true,
  className
}: LiveRegionProps) {
  return (
    <div
      aria-live={type}
      aria-atomic={atomic}
      role={type === 'assertive' ? 'alert' : 'status'}
      className={cn('sr-only', className)}
    >
      {message}
    </div>
  )
}

// =============================================================================
// HOOK: useAnnounce - Anuncios dinamicos
// =============================================================================

export function useAnnounce() {
  const announce = useCallback((message: string, type: 'polite' | 'assertive' = 'polite') => {
    const region = document.createElement('div')
    region.setAttribute('aria-live', type)
    region.setAttribute('aria-atomic', 'true')
    region.setAttribute('role', type === 'assertive' ? 'alert' : 'status')
    region.className = 'sr-only'
    region.textContent = message
    document.body.appendChild(region)

    // Remove apos 1 segundo
    setTimeout(() => {
      if (document.body.contains(region)) {
        document.body.removeChild(region)
      }
    }, 1000)
  }, [])

  return { announce }
}

// =============================================================================
// HOOK: useFocusTrap - Aprisiona foco em um container
// =============================================================================

interface UseFocusTrapOptions {
  enabled?: boolean
  returnFocus?: boolean
  initialFocus?: string | HTMLElement | null
}

export function useFocusTrap<T extends HTMLElement>(
  options: UseFocusTrapOptions = {}
) {
  const { enabled = true, returnFocus = true, initialFocus } = options
  const [containerRef, setContainerRef] = useState<T | null>(null)
  const previousFocusRef = useState<Element | null>(null)[0]

  useEffect(() => {
    if (!enabled || !containerRef) return

    // Salvar elemento focado anteriormente
    const previousElement = document.activeElement

    // Elementos focaveis
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      'audio[controls]',
      'video[controls]',
      '[contenteditable]:not([contenteditable="false"])',
    ].join(', ')

    const getFocusableElements = () => {
      const elements = containerRef.querySelectorAll<HTMLElement>(focusableSelectors)
      return Array.from(elements).filter(el => {
        return el.offsetParent !== null // Visivel
      })
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      const focusableElements = getFocusableElements()
      if (focusableElements.length === 0) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    // Foco inicial
    const setInitialFocus = () => {
      if (initialFocus) {
        const element = typeof initialFocus === 'string'
          ? containerRef.querySelector<HTMLElement>(initialFocus)
          : initialFocus
        element?.focus()
      } else {
        const focusableElements = getFocusableElements()
        focusableElements[0]?.focus()
      }
    }

    // Configurar trap
    containerRef.addEventListener('keydown', handleKeyDown)
    setInitialFocus()

    return () => {
      containerRef.removeEventListener('keydown', handleKeyDown)

      // Retornar foco ao elemento anterior
      if (returnFocus && previousElement instanceof HTMLElement) {
        previousElement.focus()
      }
    }
  }, [enabled, containerRef, returnFocus, initialFocus])

  return { ref: setContainerRef }
}

// =============================================================================
// HOOK: useKeyboardNavigation - Navegacao por teclado
// =============================================================================

interface UseKeyboardNavigationOptions {
  onEscape?: () => void
  onEnter?: () => void
  orientation?: 'horizontal' | 'vertical' | 'both'
}

export function useKeyboardNavigation(options: UseKeyboardNavigationOptions = {}) {
  const { onEscape, onEnter, orientation = 'vertical' } = options

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        onEscape?.()
        break
      case 'Enter':
        onEnter?.()
        break
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'both') {
          e.preventDefault()
          focusNextElement()
        }
        break
      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'both') {
          e.preventDefault()
          focusPreviousElement()
        }
        break
      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'both') {
          e.preventDefault()
          focusNextElement()
        }
        break
      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'both') {
          e.preventDefault()
          focusPreviousElement()
        }
        break
      case 'Home':
        e.preventDefault()
        focusFirstElement()
        break
      case 'End':
        e.preventDefault()
        focusLastElement()
        break
    }
  }, [onEscape, onEnter, orientation])

  return { handleKeyDown }
}

function focusNextElement() {
  const focusable = getFocusableElements()
  const currentIndex = focusable.indexOf(document.activeElement as HTMLElement)
  const nextIndex = (currentIndex + 1) % focusable.length
  focusable[nextIndex]?.focus()
}

function focusPreviousElement() {
  const focusable = getFocusableElements()
  const currentIndex = focusable.indexOf(document.activeElement as HTMLElement)
  const prevIndex = currentIndex <= 0 ? focusable.length - 1 : currentIndex - 1
  focusable[prevIndex]?.focus()
}

function focusFirstElement() {
  const focusable = getFocusableElements()
  focusable[0]?.focus()
}

function focusLastElement() {
  const focusable = getFocusableElements()
  focusable[focusable.length - 1]?.focus()
}

function getFocusableElements(): HTMLElement[] {
  const selector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  return Array.from(document.querySelectorAll<HTMLElement>(selector))
}

// =============================================================================
// VISUALLY HIDDEN - Texto oculto visualmente mas acessivel
// =============================================================================

interface VisuallyHiddenProps {
  children: React.ReactNode
  as?: keyof JSX.IntrinsicElements
}

export function VisuallyHidden({ children, as: Component = 'span' }: VisuallyHiddenProps) {
  return (
    <Component className="sr-only">
      {children}
    </Component>
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  type SkipLinkItem,
  type SkipLinksProps,
  type MainContentProps,
  type NavigationRegionProps,
  type FooterRegionProps,
  type ComplementaryRegionProps,
  type LiveRegionProps,
  type UseFocusTrapOptions,
  type UseKeyboardNavigationOptions,
  type VisuallyHiddenProps,
}
