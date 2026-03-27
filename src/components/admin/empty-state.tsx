'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FileText, Plus, LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  onCreateClick?: () => void
  createLabel?: string
}

export function EmptyState({
  icon: Icon = FileText,
  title,
  description,
  onCreateClick,
  createLabel = 'Criar',
}: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="text-center py-12">
        <Icon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <h3 className="text-lg font-semibold mb-1">{title}</h3>
        {description && <p className="text-sm text-muted-foreground mb-4">{description}</p>}
        {onCreateClick && (
          <Button onClick={onCreateClick} className="mt-2">
            <Plus className="h-4 w-4 mr-2" />
            {createLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
