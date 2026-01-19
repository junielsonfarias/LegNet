/**
 * Tabela Acessivel - Componente de Acessibilidade
 * Tabela com suporte completo a leitores de tela
 * Conformidade: WCAG 2.1 AA - Info and Relationships (1.3.1)
 */

'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface AccessibleTableProps {
  caption: string
  captionClassName?: string
  summary?: string
  children: React.ReactNode
  className?: string
}

export function AccessibleTable({
  caption,
  captionClassName,
  summary,
  children,
  className
}: AccessibleTableProps) {
  return (
    <div className="overflow-x-auto" role="region" aria-label={caption}>
      <table
        className={cn('w-full border-collapse', className)}
        aria-describedby={summary ? 'table-summary' : undefined}
      >
        <caption className={cn('text-left font-semibold mb-2 sr-only', captionClassName)}>
          {caption}
        </caption>
        {summary && (
          <caption id="table-summary" className="sr-only">
            {summary}
          </caption>
        )}
        {children}
      </table>
    </div>
  )
}

interface AccessibleTableHeaderProps {
  children: React.ReactNode
  className?: string
}

export function AccessibleTableHeader({ children, className }: AccessibleTableHeaderProps) {
  return (
    <thead className={cn('bg-muted/50', className)}>
      {children}
    </thead>
  )
}

interface AccessibleTableBodyProps {
  children: React.ReactNode
  className?: string
}

export function AccessibleTableBody({ children, className }: AccessibleTableBodyProps) {
  return (
    <tbody className={className}>
      {children}
    </tbody>
  )
}

interface AccessibleTableRowProps {
  children: React.ReactNode
  className?: string
  isHeader?: boolean
}

export function AccessibleTableRow({ children, className, isHeader }: AccessibleTableRowProps) {
  return (
    <tr
      className={cn(
        'border-b border-border',
        !isHeader && 'hover:bg-muted/30 focus-within:bg-muted/50',
        className
      )}
    >
      {children}
    </tr>
  )
}

interface AccessibleTableHeadProps {
  children: React.ReactNode
  className?: string
  scope?: 'col' | 'row' | 'colgroup' | 'rowgroup'
  sortDirection?: 'ascending' | 'descending' | 'none'
  onSort?: () => void
}

export function AccessibleTableHead({
  children,
  className,
  scope = 'col',
  sortDirection,
  onSort
}: AccessibleTableHeadProps) {
  const isSortable = sortDirection !== undefined

  return (
    <th
      scope={scope}
      className={cn(
        'px-4 py-3 text-left font-semibold text-sm',
        isSortable && 'cursor-pointer select-none',
        className
      )}
      aria-sort={sortDirection}
      onClick={onSort}
      onKeyDown={(e) => {
        if (isSortable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onSort?.()
        }
      }}
      tabIndex={isSortable ? 0 : undefined}
      role={isSortable ? 'button' : undefined}
    >
      <span className="flex items-center gap-2">
        {children}
        {isSortable && (
          <span aria-hidden="true" className="text-muted-foreground">
            {sortDirection === 'ascending' && '▲'}
            {sortDirection === 'descending' && '▼'}
            {sortDirection === 'none' && '⇅'}
          </span>
        )}
      </span>
    </th>
  )
}

interface AccessibleTableCellProps {
  children: React.ReactNode
  className?: string
  isHeader?: boolean
}

export function AccessibleTableCell({
  children,
  className,
  isHeader
}: AccessibleTableCellProps) {
  const Component = isHeader ? 'th' : 'td'

  return (
    <Component
      className={cn('px-4 py-3 text-sm', className)}
      scope={isHeader ? 'row' : undefined}
    >
      {children}
    </Component>
  )
}

/**
 * Componente de paginacao acessivel
 */
interface AccessiblePaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export function AccessiblePagination({
  currentPage,
  totalPages,
  onPageChange,
  className
}: AccessiblePaginationProps) {
  const pages = React.useMemo(() => {
    const range: (number | 'ellipsis')[] = []
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 1 && i <= currentPage + 1)
      ) {
        range.push(i)
      } else if (range[range.length - 1] !== 'ellipsis') {
        range.push('ellipsis')
      }
    }
    return range
  }, [currentPage, totalPages])

  return (
    <nav
      aria-label="Paginacao"
      className={cn('flex items-center justify-center gap-1', className)}
    >
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="Pagina anterior"
        className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
      >
        Anterior
      </button>

      {pages.map((page, index) => (
        page === 'ellipsis' ? (
          <span key={`ellipsis-${index}`} aria-hidden="true" className="px-2">
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            aria-label={`Pagina ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
            className={cn(
              'px-3 py-1 rounded border hover:bg-muted',
              page === currentPage && 'bg-primary text-primary-foreground'
            )}
          >
            {page}
          </button>
        )
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label="Proxima pagina"
        className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
      >
        Proxima
      </button>
    </nav>
  )
}
