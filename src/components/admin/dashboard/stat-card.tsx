'use client'

import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'
import { UserRole } from '@prisma/client'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  userRole?: UserRole
  variant?: 'default' | 'highlight'
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  userRole = 'ADMIN',
  variant = 'default'
}: StatCardProps) {
  const getIconBgClass = () => {
    if (variant === 'highlight') {
      const highlightClasses: Record<UserRole, string> = {
        ADMIN: 'bg-gradient-to-br from-violet-500 to-purple-600',
        SECRETARIA: 'bg-gradient-to-br from-cyan-500 to-teal-600',
        EDITOR: 'bg-gradient-to-br from-blue-500 to-indigo-600',
        OPERADOR: 'bg-gradient-to-br from-emerald-500 to-green-600',
        PARLAMENTAR: 'bg-gradient-to-br from-amber-500 to-orange-600',
        USER: 'bg-gradient-to-br from-gray-500 to-slate-600'
      }
      return highlightClasses[userRole]
    }

    const defaultClasses: Record<UserRole, string> = {
      ADMIN: 'bg-violet-100',
      SECRETARIA: 'bg-cyan-100',
      EDITOR: 'bg-blue-100',
      OPERADOR: 'bg-emerald-100',
      PARLAMENTAR: 'bg-amber-100',
      USER: 'bg-gray-100'
    }
    return defaultClasses[userRole]
  }

  const getIconColorClass = () => {
    if (variant === 'highlight') return 'text-white'

    const colorClasses: Record<UserRole, string> = {
      ADMIN: 'text-violet-600',
      SECRETARIA: 'text-cyan-600',
      EDITOR: 'text-blue-600',
      OPERADOR: 'text-emerald-600',
      PARLAMENTAR: 'text-amber-600',
      USER: 'text-gray-600'
    }
    return colorClasses[userRole]
  }

  const getValueColorClass = () => {
    const colorClasses: Record<UserRole, string> = {
      ADMIN: 'text-violet-600',
      SECRETARIA: 'text-cyan-600',
      EDITOR: 'text-blue-600',
      OPERADOR: 'text-emerald-600',
      PARLAMENTAR: 'text-amber-600',
      USER: 'text-gray-700'
    }
    return colorClasses[userRole]
  }

  const getBorderClass = () => {
    if (variant !== 'highlight') return 'border-gray-100'

    const borderClasses: Record<UserRole, string> = {
      ADMIN: 'border-violet-200',
      SECRETARIA: 'border-cyan-200',
      EDITOR: 'border-blue-200',
      OPERADOR: 'border-emerald-200',
      PARLAMENTAR: 'border-amber-200',
      USER: 'border-gray-200'
    }
    return borderClasses[userRole]
  }

  return (
    <div className={cn(
      'bg-white rounded-xl border p-5 transition-all duration-200 hover:shadow-md',
      getBorderClass()
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className={cn('text-3xl font-bold', getValueColorClass())}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span className={cn(
                'text-xs font-medium px-1.5 py-0.5 rounded',
                trend.isPositive
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              )}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className="text-xs text-gray-400">vs mês anterior</span>
            </div>
          )}
        </div>
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center',
          getIconBgClass()
        )}>
          <Icon className={cn('h-6 w-6', getIconColorClass())} />
        </div>
      </div>
    </div>
  )
}
