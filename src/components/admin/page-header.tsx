'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Plus, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  subtitle?: string
  icon?: LucideIcon
  /** Action principal (default: 'Novo'). Renderiza Button padrao. */
  onNewClick?: () => void
  newLabel?: string
  newIcon?: LucideIcon
  /** Actions extras (renderizadas a esquerda do botao Novo) */
  children?: React.ReactNode
  /** Classes extras no container */
  className?: string
}

/**
 * Cabecalho padrao para paginas admin.
 *
 * Estrutura:
 * - Icone + Titulo (h1) + Subtitulo opcional (esquerda)
 * - Children (actions extras) + botao Novo (direita)
 *
 * Em mobile, empilha titulo acima de actions.
 *
 * ```tsx
 * <PageHeader
 *   icon={Users}
 *   title="Usuarios"
 *   subtitle="Gestao de usuarios do sistema"
 *   onNewClick={() => setIsModalOpen(true)}
 *   newLabel="Novo usuario"
 * >
 *   <Button variant="outline" onClick={handleExport}>
 *     <Download className="h-4 w-4 mr-2" /> Exportar
 *   </Button>
 * </PageHeader>
 * ```
 */
export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  onNewClick,
  newLabel,
  newIcon: NewIcon = Plus,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4', className)}>
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {Icon && <Icon className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground shrink-0" aria-hidden="true" />}
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold truncate">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
        {children}
        {onNewClick && (
          <Button onClick={onNewClick} className="w-full sm:w-auto">
            <NewIcon className="h-4 w-4 mr-2" />
            {newLabel || 'Novo'}
          </Button>
        )}
      </div>
    </div>
  )
}
