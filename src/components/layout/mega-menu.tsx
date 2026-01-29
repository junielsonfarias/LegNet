/**
 * Mega Menu - Menu Expandivel de 3 Niveis
 * Navegacao avancada com subcategorias, links rapidos e preview
 * Conformidade: WCAG 2.1 AA - Navegacao por teclado
 */

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight, Calendar, FileText, Clock, ExternalLink, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAnnounce, useFocusTrap } from '@/components/ui/skip-link'

// =============================================================================
// TIPOS
// =============================================================================

interface MenuItem {
  name: string
  href: string
  description?: string
  badge?: string
  icon?: LucideIcon
  isExternal?: boolean
}

interface MenuCategory {
  title: string
  items: MenuItem[]
}

interface MegaMenuSection {
  title: string
  icon: LucideIcon
  href?: string
  description?: string
  categories?: MenuCategory[]
  quickLinks?: MenuItem[]
  featured?: {
    title: string
    description: string
    href: string
    badge?: string
  }
}

interface MegaMenuProps {
  sections: MegaMenuSection[]
  className?: string
}

// =============================================================================
// COMPONENTE: MegaMenuPanel
// =============================================================================

interface MegaMenuPanelProps {
  section: MegaMenuSection
  isOpen: boolean
  onClose: () => void
}

function MegaMenuPanel({ section, isOpen, onClose }: MegaMenuPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const { announce } = useAnnounce()
  const { ref: focusTrapRef } = useFocusTrap({ enabled: isOpen, returnFocus: true })

  // Fechar com ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
        announce('Menu fechado')
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose, announce])

  if (!section.categories && !section.quickLinks && !section.featured) {
    return null
  }

  return (
    <div
      ref={(el) => {
        // @ts-ignore - combinando refs
        if (panelRef) panelRef.current = el
        if (focusTrapRef) focusTrapRef(el as HTMLDivElement)
      }}
      className={cn(
        'absolute top-full left-0 right-0 w-full bg-white shadow-xl border-t border-gray-200',
        'transition-all duration-300 ease-in-out',
        isOpen
          ? 'opacity-100 visible translate-y-0'
          : 'opacity-0 invisible -translate-y-4 pointer-events-none'
      )}
      role="menu"
      aria-label={`Submenu de ${section.title}`}
      aria-hidden={!isOpen}
    >
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Categorias principais (lado esquerdo) */}
          {section.categories && section.categories.length > 0 && (
            <div className="col-span-8 grid grid-cols-3 gap-6">
              {section.categories.map((category) => (
                <div key={category.title}>
                  <h3 className="font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-100">
                    {category.title}
                  </h3>
                  <ul className="space-y-1" role="menu">
                    {category.items.map((item) => (
                      <li key={item.name} role="none">
                        <Link
                          href={item.href}
                          className={cn(
                            'flex items-center gap-2 px-3 py-2 rounded-md text-sm',
                            'text-gray-600 hover:text-camara-primary hover:bg-gray-50',
                            'transition-all duration-150',
                            'focus:outline-none focus:ring-2 focus:ring-camara-primary focus:bg-gray-50'
                          )}
                          role="menuitem"
                          onClick={onClose}
                          target={item.isExternal ? '_blank' : undefined}
                          rel={item.isExternal ? 'noopener noreferrer' : undefined}
                        >
                          {item.icon && <item.icon className="h-4 w-4" aria-hidden="true" />}
                          <span className="flex-1">{item.name}</span>
                          {item.badge && (
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                              {item.badge}
                            </span>
                          )}
                          {item.isExternal && <ExternalLink className="h-3 w-3 text-gray-400" aria-hidden="true" />}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* Sidebar (lado direito) - Links rapidos e Featured */}
          <div className="col-span-4 space-y-6">
            {/* Links Rapidos */}
            {section.quickLinks && section.quickLinks.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  Acesso Rapido
                </h3>
                <ul className="space-y-2" role="menu">
                  {section.quickLinks.map((link) => (
                    <li key={link.name} role="none">
                      <Link
                        href={link.href}
                        className={cn(
                          'flex items-center gap-2 text-sm text-camara-primary hover:underline',
                          'focus:outline-none focus:ring-2 focus:ring-camara-primary rounded px-1'
                        )}
                        role="menuitem"
                        onClick={onClose}
                      >
                        <ChevronRight className="h-3 w-3" aria-hidden="true" />
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Featured/Destaque */}
            {section.featured && (
              <Link
                href={section.featured.href}
                className={cn(
                  'block bg-gradient-to-br from-camara-primary to-blue-700 rounded-lg p-4 text-white',
                  'hover:shadow-lg transition-shadow duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-camara-primary'
                )}
                onClick={onClose}
              >
                <div className="flex items-start justify-between">
                  <div>
                    {section.featured.badge && (
                      <span className="inline-block bg-white/20 text-xs px-2 py-0.5 rounded-full mb-2">
                        {section.featured.badge}
                      </span>
                    )}
                    <h4 className="font-semibold mb-1">{section.featured.title}</h4>
                    <p className="text-sm text-white/80">{section.featured.description}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// COMPONENTE: MegaMenu
// =============================================================================

export function MegaMenu({ sections, className }: MegaMenuProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const menuRef = useRef<HTMLElement>(null)

  const handleMouseEnter = useCallback((sectionTitle: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveSection(sectionTitle)
    }, 100)
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveSection(null)
    }, 200)
  }, [])

  const handleClose = useCallback(() => {
    setActiveSection(null)
  }, [])

  // Cleanup
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  return (
    <nav
      ref={menuRef}
      className={cn('relative', className)}
      role="navigation"
      aria-label="Menu principal"
      onMouseLeave={handleMouseLeave}
    >
      <ul className="flex items-center justify-center gap-1" role="menubar">
        {sections.map((section) => {
          const hasSubmenu = section.categories || section.quickLinks || section.featured
          const isActive = activeSection === section.title

          return (
            <li
              key={section.title}
              className="relative"
              role="none"
              onMouseEnter={() => hasSubmenu && handleMouseEnter(section.title)}
            >
              {!hasSubmenu && section.href ? (
                // Link simples sem submenu
                <Link
                  href={section.href}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-md',
                    'text-gray-700 hover:text-camara-primary hover:bg-gray-50',
                    'transition-colors duration-150',
                    'focus:outline-none focus:ring-2 focus:ring-camara-primary focus:ring-offset-2',
                    'min-h-touch'
                  )}
                  role="menuitem"
                >
                  <section.icon className="h-4 w-4" aria-hidden="true" />
                  <span>{section.title}</span>
                </Link>
              ) : (
                // Botao com submenu
                <button
                  className={cn(
                    'flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-md',
                    'transition-colors duration-150',
                    'focus:outline-none focus:ring-2 focus:ring-camara-primary focus:ring-offset-2',
                    'min-h-touch',
                    isActive
                      ? 'text-camara-primary bg-gray-50'
                      : 'text-gray-700 hover:text-camara-primary hover:bg-gray-50'
                  )}
                  role="menuitem"
                  aria-haspopup="true"
                  aria-expanded={isActive}
                  onClick={() => setActiveSection(isActive ? null : section.title)}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown' && hasSubmenu) {
                      e.preventDefault()
                      setActiveSection(section.title)
                    }
                  }}
                >
                  <section.icon className="h-4 w-4" aria-hidden="true" />
                  <span>{section.title}</span>
                  <ChevronDown
                    className={cn(
                      'h-3 w-3 transition-transform duration-200',
                      isActive && 'rotate-180'
                    )}
                    aria-hidden="true"
                  />
                </button>
              )}

              {/* Mega Menu Panel */}
              {hasSubmenu && (
                <MegaMenuPanel
                  section={section}
                  isOpen={isActive}
                  onClose={handleClose}
                />
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

// =============================================================================
// COMPONENTE: MegaMenuWrapper (com container)
// =============================================================================

interface MegaMenuWrapperProps {
  sections: MegaMenuSection[]
  className?: string
}

export function MegaMenuWrapper({ sections, className }: MegaMenuWrapperProps) {
  return (
    <div className={cn('border-t bg-white', className)}>
      <div className="container mx-auto px-4">
        <MegaMenu sections={sections} />
      </div>
    </div>
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

export type { MenuItem, MenuCategory, MegaMenuSection, MegaMenuProps }
