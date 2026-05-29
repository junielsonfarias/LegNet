'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FileText, Plus, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Componente reutilizavel para estado vazio em listas/coleções.
 *
 * Padrao: icone + titulo + descricao + CTA opcional.
 * Renderiza dentro de Card por padrao (`as='card'`); use `as='plain'` para
 * embutir em um Card existente ou em layouts customizados.
 */
export interface EmptyStateProps {
  /** Icone Lucide. Default: FileText */
  icon?: LucideIcon
  /** Titulo curto (h3) */
  title: string
  /** Descricao auxiliar (paragrafo) */
  description?: string
  /** Acao principal (cria, adiciona, busca...) */
  action?: {
    label: string
    onClick?: () => void
    href?: string
    icon?: LucideIcon
  }
  /** Acao secundaria opcional (link/texto neutro) */
  secondaryAction?: {
    label: string
    onClick?: () => void
    href?: string
  }
  /** Renderiza dentro de Card (default) ou plain div */
  as?: 'card' | 'plain'
  /** Classes extras no container */
  className?: string
  /** Conteudo customizado adicional abaixo das acoes */
  children?: React.ReactNode
}

export function EmptyState({
  icon: Icon = FileText,
  title,
  description,
  action,
  secondaryAction,
  as = 'card',
  className,
  children,
}: EmptyStateProps) {
  const ActionIcon = action?.icon ?? Plus

  const content = (
    <div className={cn('text-center py-12 px-4', className)}>
      <Icon className="h-12 w-12 text-muted-foreground mx-auto mb-3" aria-hidden="true" />
      <h3 className="text-lg font-semibold mb-1 text-foreground">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">{description}</p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-2 flex flex-col sm:flex-row gap-2 justify-center">
          {action && (
            action.href ? (
              <a href={action.href}>
                <Button>
                  <ActionIcon className="h-4 w-4 mr-2" />
                  {action.label}
                </Button>
              </a>
            ) : (
              <Button onClick={action.onClick}>
                <ActionIcon className="h-4 w-4 mr-2" />
                {action.label}
              </Button>
            )
          )}
          {secondaryAction && (
            secondaryAction.href ? (
              <a href={secondaryAction.href}>
                <Button variant="outline">{secondaryAction.label}</Button>
              </a>
            ) : (
              <Button variant="outline" onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </Button>
            )
          )}
        </div>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  )

  if (as === 'plain') return content

  return (
    <Card>
      <CardContent className="p-0">{content}</CardContent>
    </Card>
  )
}
