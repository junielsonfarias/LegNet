'use client'

import { cn } from '@/lib/utils'
import { UserRole } from '@prisma/client'
import {
  FileText,
  Vote,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  Edit3
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ActivityItem {
  id: string
  type: 'proposicao' | 'votacao' | 'sessao' | 'parecer' | 'usuario' | 'comentario'
  title: string
  description: string
  timestamp: Date
  status?: 'success' | 'warning' | 'pending'
  user?: string
}

interface RecentActivityProps {
  userRole: UserRole
  activities?: ActivityItem[]
}

// Dados mock para demonstração
const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'proposicao',
    title: 'PL 015/2026 cadastrado',
    description: 'Projeto de Lei sobre iluminação pública',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min atrás
    status: 'success',
    user: 'Maria Silva'
  },
  {
    id: '2',
    type: 'votacao',
    title: 'Votação concluída',
    description: 'PL 012/2026 aprovado por 7x2',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 horas atrás
    status: 'success'
  },
  {
    id: '3',
    type: 'sessao',
    title: 'Sessão agendada',
    description: 'Sessão Ordinária 037 - 25/01/2026',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 horas atrás
    status: 'pending'
  },
  {
    id: '4',
    type: 'parecer',
    title: 'Parecer emitido',
    description: 'CLJ: Favorável ao PL 010/2026',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 horas atrás
    status: 'success',
    user: 'João Santos'
  },
  {
    id: '5',
    type: 'usuario',
    title: 'Novo usuário cadastrado',
    description: 'Pedro Oliveira (Operador)',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 dia atrás
    status: 'success'
  }
]

export function RecentActivity({ userRole, activities = mockActivities }: RecentActivityProps) {
  const getIconByType = (type: ActivityItem['type']) => {
    const icons = {
      proposicao: FileText,
      votacao: Vote,
      sessao: Calendar,
      parecer: Edit3,
      usuario: Users,
      comentario: MessageSquare
    }
    return icons[type]
  }

  const getStatusIcon = (status?: ActivityItem['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-amber-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-blue-500" />
      default:
        return null
    }
  }

  const getAccentColor = () => {
    const colors: Record<UserRole, string> = {
      ADMIN: 'border-l-violet-500',
      SECRETARIA: 'border-l-cyan-500',
      AUXILIAR_LEGISLATIVO: 'border-l-teal-500',
      EDITOR: 'border-l-blue-500',
      OPERADOR: 'border-l-emerald-500',
      PARLAMENTAR: 'border-l-amber-500',
      USER: 'border-l-gray-400'
    }
    return colors[userRole]
  }

  const getIconBgColor = () => {
    const colors: Record<UserRole, string> = {
      ADMIN: 'bg-violet-100 text-violet-600',
      SECRETARIA: 'bg-cyan-100 text-cyan-600',
      AUXILIAR_LEGISLATIVO: 'bg-teal-100 text-teal-600',
      EDITOR: 'bg-blue-100 text-blue-600',
      OPERADOR: 'bg-emerald-100 text-emerald-600',
      PARLAMENTAR: 'bg-amber-100 text-amber-600',
      USER: 'bg-gray-100 text-gray-600'
    }
    return colors[userRole]
  }

  return (
    <div className={cn(
      'bg-white rounded-xl border border-gray-100 p-5 border-l-4',
      getAccentColor()
    )}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Atividade Recente</h3>
        <span className="text-xs text-gray-400">Últimas 24h</span>
      </div>
      <div className="space-y-4">
        {activities.slice(0, 5).map((activity) => {
          const Icon = getIconByType(activity.type)
          return (
            <div key={activity.id} className="flex items-start gap-3">
              <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                getIconBgColor()
              )}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.title}
                  </p>
                  {getStatusIcon(activity.status)}
                </div>
                <p className="text-xs text-gray-500 truncate">
                  {activity.description}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(activity.timestamp, {
                      addSuffix: true,
                      locale: ptBR
                    })}
                  </span>
                  {activity.user && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span className="text-xs text-gray-400">{activity.user}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {activities.length > 5 && (
        <button className="w-full mt-4 text-sm text-gray-500 hover:text-gray-700 font-medium">
          Ver todas as atividades
        </button>
      )}
    </div>
  )
}
