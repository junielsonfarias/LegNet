/**
 * Page Template - Template Padrao para Paginas Internas
 * Estrutura consistente com breadcrumbs, titulo e layout
 */

'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

// =============================================================================
// TIPOS
// =============================================================================

interface BreadcrumbItem {
  label: string
  href?: string
}

interface PageTemplateProps {
  children: ReactNode
  title: string
  subtitle?: string
  breadcrumbs?: BreadcrumbItem[]
  sidebar?: ReactNode
  sidebarPosition?: 'left' | 'right'
  className?: string
  containerClass?: string
  headerClass?: string
  showBackToHome?: boolean
  actions?: ReactNode
}

// =============================================================================
// COMPONENTE: Breadcrumbs
// =============================================================================

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  showHome?: boolean
  className?: string
}

export function Breadcrumbs({ items, showHome = true, className }: BreadcrumbsProps) {
  const allItems = showHome
    ? [{ label: 'Inicio', href: '/' }, ...items]
    : items

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('mb-4', className)}
    >
      <ol className="flex flex-wrap items-center gap-1 text-sm text-gray-600">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1
          const isFirst = index === 0

          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 mx-1 text-gray-400 flex-shrink-0" aria-hidden="true" />
              )}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className={cn(
                    'hover:text-camara-primary transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-camara-primary focus:ring-offset-2 rounded',
                    'flex items-center gap-1'
                  )}
                >
                  {isFirst && <Home className="h-4 w-4" aria-hidden="true" />}
                  <span className={isFirst ? 'sr-only sm:not-sr-only' : ''}>
                    {item.label}
                  </span>
                </Link>
              ) : (
                <span
                  className={cn(
                    'font-medium',
                    isLast ? 'text-gray-900' : 'text-gray-600'
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

// =============================================================================
// COMPONENTE: Page Header
// =============================================================================

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  breadcrumbs?: BreadcrumbItem[]
  className?: string
  variant?: 'default' | 'gradient' | 'minimal'
}

export function PageHeader({
  title,
  subtitle,
  actions,
  breadcrumbs,
  className,
  variant = 'default'
}: PageHeaderProps) {
  const variants = {
    default: 'bg-gray-50 border-b',
    gradient: 'bg-gradient-to-r from-camara-primary to-blue-700 text-white',
    minimal: 'bg-white'
  }

  return (
    <header
      className={cn(
        'py-8',
        variants[variant],
        className
      )}
    >
      <div className="container mx-auto px-4">
        {breadcrumbs && (
          <Breadcrumbs
            items={breadcrumbs}
            className={variant === 'gradient' ? 'text-blue-100 [&_a]:text-white [&_a:hover]:text-blue-200' : ''}
          />
        )}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className={cn(
              'text-3xl md:text-4xl font-bold',
              variant === 'gradient' ? 'text-white' : 'text-gray-900'
            )}>
              {title}
            </h1>
            {subtitle && (
              <p className={cn(
                'mt-2 text-lg',
                variant === 'gradient' ? 'text-blue-100' : 'text-gray-600'
              )}>
                {subtitle}
              </p>
            )}
          </div>

          {actions && (
            <div className="flex items-center gap-3 flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

// =============================================================================
// COMPONENTE: Page Template
// =============================================================================

export function PageTemplate({
  children,
  title,
  subtitle,
  breadcrumbs = [],
  sidebar,
  sidebarPosition = 'left',
  className,
  containerClass,
  headerClass,
  showBackToHome = true,
  actions
}: PageTemplateProps) {
  const hasSidebar = Boolean(sidebar)

  return (
    <div className={cn('min-h-screen bg-white', className)}>
      {/* Page Header */}
      <PageHeader
        title={title}
        subtitle={subtitle}
        breadcrumbs={breadcrumbs}
        actions={actions}
        className={headerClass}
      />

      {/* Content Area */}
      <div className={cn('container mx-auto px-4 py-8', containerClass)}>
        {hasSidebar ? (
          <div className={cn(
            'grid gap-8',
            sidebarPosition === 'left'
              ? 'lg:grid-cols-[280px_1fr]'
              : 'lg:grid-cols-[1fr_280px]'
          )}>
            {sidebarPosition === 'left' && (
              <aside
                className="lg:sticky lg:top-24 lg:self-start"
                role="complementary"
                aria-label="Barra lateral"
              >
                {sidebar}
              </aside>
            )}

            <main role="main" className="min-w-0">
              {children}
            </main>

            {sidebarPosition === 'right' && (
              <aside
                className="lg:sticky lg:top-24 lg:self-start"
                role="complementary"
                aria-label="Barra lateral"
              >
                {sidebar}
              </aside>
            )}
          </div>
        ) : (
          <main role="main">
            {children}
          </main>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// COMPONENTE: Section Title
// =============================================================================

interface SectionTitleProps {
  title: string
  subtitle?: string
  action?: ReactNode
  className?: string
}

export function SectionTitle({ title, subtitle, action, className }: SectionTitleProps) {
  return (
    <div className={cn('flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6', className)}>
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-gray-600">{subtitle}</p>
        )}
      </div>
      {action && (
        <div className="flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// COMPONENTE: Content Card
// =============================================================================

interface ContentCardProps {
  children: ReactNode
  title?: string
  description?: string
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function ContentCard({
  children,
  title,
  description,
  className,
  padding = 'md'
}: ContentCardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }

  return (
    <div className={cn(
      'bg-white rounded-lg border border-gray-200 shadow-sm',
      paddingClasses[padding],
      className
    )}>
      {(title || description) && (
        <div className="mb-4 pb-4 border-b border-gray-100">
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
        </div>
      )}
      {children}
    </div>
  )
}

// =============================================================================
// COMPONENTE: Filter Sidebar
// =============================================================================

interface FilterSidebarProps {
  children: ReactNode
  title?: string
  className?: string
}

export function FilterSidebar({
  children,
  title = 'Filtros',
  className
}: FilterSidebarProps) {
  return (
    <div className={cn('bg-gray-50 rounded-lg p-4', className)}>
      <h3 className="font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

export type {
  BreadcrumbItem,
  PageTemplateProps,
  BreadcrumbsProps,
  PageHeaderProps,
  SectionTitleProps,
  ContentCardProps,
  FilterSidebarProps
}
