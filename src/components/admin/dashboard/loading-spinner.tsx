'use client'

import { cn } from '@/lib/utils'
import { UserRole } from '@prisma/client'
import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  userRole?: UserRole
  text?: string
}

export function LoadingSpinner({ size = 'md', userRole = 'ADMIN', text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  const getSpinnerColor = () => {
    const colors: Record<UserRole, string> = {
      ADMIN: 'text-violet-600',
      SECRETARIA: 'text-cyan-600',
      AUXILIAR_LEGISLATIVO: 'text-teal-600',
      EDITOR: 'text-blue-600',
      OPERADOR: 'text-emerald-600',
      PARLAMENTAR: 'text-amber-600',
      USER: 'text-gray-500'
    }
    return colors[userRole]
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className={cn('animate-spin', sizeClasses[size], getSpinnerColor())} />
      {text && (
        <p className="text-sm text-gray-500 animate-pulse">{text}</p>
      )}
    </div>
  )
}

interface PageLoaderProps {
  userRole?: UserRole
}

export function PageLoader({ userRole = 'ADMIN' }: PageLoaderProps) {
  const getGradient = () => {
    const gradients: Record<UserRole, string> = {
      ADMIN: 'from-violet-500/20 via-purple-500/20 to-violet-500/20',
      SECRETARIA: 'from-cyan-500/20 via-teal-500/20 to-cyan-500/20',
      AUXILIAR_LEGISLATIVO: 'from-teal-500/20 via-cyan-500/20 to-teal-500/20',
      EDITOR: 'from-blue-500/20 via-indigo-500/20 to-blue-500/20',
      OPERADOR: 'from-emerald-500/20 via-green-500/20 to-emerald-500/20',
      PARLAMENTAR: 'from-amber-500/20 via-orange-500/20 to-amber-500/20',
      USER: 'from-gray-400/20 via-gray-500/20 to-gray-400/20'
    }
    return gradients[userRole]
  }

  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className={cn(
        'relative w-24 h-24 rounded-full bg-gradient-to-r animate-spin',
        getGradient()
      )}>
        <div className="absolute inset-2 bg-white rounded-full" />
        <div className={cn(
          'absolute inset-0 flex items-center justify-center'
        )}>
          <LoadingSpinner size="md" userRole={userRole} />
        </div>
      </div>
    </div>
  )
}
