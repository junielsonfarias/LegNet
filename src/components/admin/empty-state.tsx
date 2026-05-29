/**
 * @deprecated Use `@/components/ui/empty-state` em vez disso.
 * Mantido aqui apenas para retrocompatibilidade. A API antiga
 * (onCreateClick + createLabel) e mapeada para a nova (action).
 */
'use client'

import { EmptyState as UIEmptyState } from '@/components/ui/empty-state'
import type { LucideIcon } from 'lucide-react'

interface LegacyEmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  onCreateClick?: () => void
  createLabel?: string
}

export function EmptyState({
  icon,
  title,
  description,
  onCreateClick,
  createLabel = 'Criar',
}: LegacyEmptyStateProps) {
  return (
    <UIEmptyState
      icon={icon}
      title={title}
      description={description}
      action={onCreateClick ? { label: createLabel, onClick: onCreateClick } : undefined}
    />
  )
}
