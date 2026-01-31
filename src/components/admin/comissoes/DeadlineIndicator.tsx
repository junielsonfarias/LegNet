'use client'

import { Badge } from '@/components/ui/badge'
import { Clock, AlertTriangle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DeadlineIndicatorProps {
  dias: number
  status: 'ok' | 'warning' | 'expired'
  mensagem?: string
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function DeadlineIndicator({
  dias,
  status,
  mensagem,
  showIcon = true,
  size = 'md'
}: DeadlineIndicatorProps) {
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5'
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  const statusConfig = {
    ok: {
      className: 'bg-green-100 text-green-700 border-green-200',
      icon: Clock,
      label: mensagem || `${dias} dias`
    },
    warning: {
      className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      icon: AlertTriangle,
      label: mensagem || `${dias} dias`
    },
    expired: {
      className: 'bg-red-100 text-red-700 border-red-200',
      icon: AlertCircle,
      label: mensagem || 'Prazo vencido'
    }
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge
      variant="outline"
      className={cn(
        'flex items-center gap-1 font-medium',
        sizeClasses[size],
        config.className
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      <span>{config.label}</span>
    </Badge>
  )
}

interface DeadlineListIndicatorProps {
  expiradas: number
  alertas: number
  ok: number
}

export function DeadlineListIndicator({ expiradas, alertas, ok }: DeadlineListIndicatorProps) {
  const total = expiradas + alertas + ok

  if (total === 0) {
    return (
      <span className="text-sm text-gray-500">
        Nenhuma proposicao pendente
      </span>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {expiradas > 0 && (
        <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">
          <AlertCircle className="h-3 w-3 mr-1" />
          {expiradas} vencida{expiradas > 1 ? 's' : ''}
        </Badge>
      )}
      {alertas > 0 && (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-200">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {alertas} alerta{alertas > 1 ? 's' : ''}
        </Badge>
      )}
      {ok > 0 && (
        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
          <Clock className="h-3 w-3 mr-1" />
          {ok} no prazo
        </Badge>
      )}
    </div>
  )
}
