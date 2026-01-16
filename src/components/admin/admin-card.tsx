import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface AdminCardProps {
  title?: string
  description?: string
  children: ReactNode
  className?: string
  headerAction?: ReactNode
  variant?: 'default' | 'highlight' | 'success' | 'warning' | 'error'
}

const variantStyles = {
  default: 'border-gray-200 bg-white shadow-sm',
  highlight: 'border-camara-primary/20 bg-camara-primary/5 shadow-md',
  success: 'border-green-200 bg-green-50 shadow-sm',
  warning: 'border-yellow-200 bg-yellow-50 shadow-sm',
  error: 'border-red-200 bg-red-50 shadow-sm'
}

export function AdminCard({ 
  title, 
  description, 
  children, 
  className,
  headerAction,
  variant = 'default'
}: AdminCardProps) {
  return (
    <Card className={cn(
      'transition-all duration-200 hover:shadow-md',
      variantStyles[variant],
      className
    )}>
      {(title || description || headerAction) && (
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              {title && (
                <CardTitle className="text-lg font-semibold text-gray-900">
                  {title}
                </CardTitle>
              )}
              {description && (
                <p className="text-sm text-gray-600">
                  {description}
                </p>
              )}
            </div>
            {headerAction && (
              <div className="flex-shrink-0">
                {headerAction}
              </div>
            )}
          </div>
        </CardHeader>
      )}
      <CardContent className="pt-0">
        {children}
      </CardContent>
    </Card>
  )
}

interface AdminStatsCardProps {
  title: string
  value: string | number
  description?: string
  icon?: ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  variant?: 'default' | 'success' | 'warning' | 'error'
}

const statsVariantStyles = {
  default: 'border-gray-200 bg-white',
  success: 'border-green-200 bg-green-50',
  warning: 'border-yellow-200 bg-yellow-50',
  error: 'border-red-200 bg-red-50'
}

export function AdminStatsCard({ 
  title, 
  value, 
  description, 
  icon,
  trend,
  variant = 'default'
}: AdminStatsCardProps) {
  return (
    <Card className={cn(
      'transition-all duration-200 hover:shadow-md',
      statsVariantStyles[variant]
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600">
              {title}
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {value}
            </p>
            {description && (
              <p className="text-xs text-gray-500">
                {description}
              </p>
            )}
            {trend && (
              <div className={cn(
                'flex items-center text-xs font-medium',
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              )}>
                <span className={cn(
                  'mr-1',
                  trend.isPositive ? '↗' : '↘'
                )}>
                  {trend.value}%
                </span>
                vs período anterior
              </div>
            )}
          </div>
          {icon && (
            <div className={cn(
              'p-3 rounded-lg',
              variant === 'default' && 'bg-gray-100',
              variant === 'success' && 'bg-green-100',
              variant === 'warning' && 'bg-yellow-100',
              variant === 'error' && 'bg-red-100'
            )}>
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
