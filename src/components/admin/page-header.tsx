'use client'

import { Button } from '@/components/ui/button'
import { Plus, LucideIcon } from 'lucide-react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  icon?: LucideIcon
  onNewClick?: () => void
  newLabel?: string
  children?: React.ReactNode
}

export function PageHeader({ title, subtitle, icon: Icon, onNewClick, newLabel, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {Icon && <Icon className="h-8 w-8 text-muted-foreground" />}
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {children}
        {onNewClick && (
          <Button onClick={onNewClick}>
            <Plus className="h-4 w-4 mr-2" />
            {newLabel || 'Novo'}
          </Button>
        )}
      </div>
    </div>
  )
}
