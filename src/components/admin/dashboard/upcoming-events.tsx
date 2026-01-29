'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { UserRole } from '@prisma/client'
import { Calendar, Clock, MapPin, Users, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface UpcomingEvent {
  id: string
  title: string
  type: 'sessao' | 'reuniao' | 'audiencia'
  date: Date
  time: string
  location?: string
  attendees?: number
}

interface UpcomingEventsProps {
  userRole: UserRole
  events?: UpcomingEvent[]
}

// Dados mock para demonstração
const mockEvents: UpcomingEvent[] = [
  {
    id: '1',
    title: 'Sessão Ordinária 037',
    type: 'sessao',
    date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2), // 2 dias
    time: '09:00',
    location: 'Plenário',
    attendees: 9
  },
  {
    id: '2',
    title: 'Reunião CLJ',
    type: 'reuniao',
    date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3), // 3 dias
    time: '14:00',
    location: 'Sala de Comissões',
    attendees: 5
  },
  {
    id: '3',
    title: 'Audiência Pública - Orçamento',
    type: 'audiencia',
    date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5), // 5 dias
    time: '18:00',
    location: 'Plenário',
    attendees: 50
  }
]

export function UpcomingEvents({ userRole, events = mockEvents }: UpcomingEventsProps) {
  const getTypeLabel = (type: UpcomingEvent['type']) => {
    const labels = {
      sessao: 'Sessão',
      reuniao: 'Reunião',
      audiencia: 'Audiência'
    }
    return labels[type]
  }

  const getTypeBadgeClass = (type: UpcomingEvent['type']) => {
    const classes = {
      sessao: 'bg-blue-100 text-blue-700',
      reuniao: 'bg-purple-100 text-purple-700',
      audiencia: 'bg-green-100 text-green-700'
    }
    return classes[type]
  }

  const getAccentColor = () => {
    const colors: Record<UserRole, string> = {
      ADMIN: 'text-violet-600',
      SECRETARIA: 'text-cyan-600',
      AUXILIAR_LEGISLATIVO: 'text-teal-600',
      EDITOR: 'text-blue-600',
      OPERADOR: 'text-emerald-600',
      PARLAMENTAR: 'text-amber-600',
      USER: 'text-gray-600'
    }
    return colors[userRole]
  }

  const getHoverClass = () => {
    const classes: Record<UserRole, string> = {
      ADMIN: 'hover:border-violet-200 hover:bg-violet-50/50',
      SECRETARIA: 'hover:border-cyan-200 hover:bg-cyan-50/50',
      AUXILIAR_LEGISLATIVO: 'hover:border-teal-200 hover:bg-teal-50/50',
      EDITOR: 'hover:border-blue-200 hover:bg-blue-50/50',
      OPERADOR: 'hover:border-emerald-200 hover:bg-emerald-50/50',
      PARLAMENTAR: 'hover:border-amber-200 hover:bg-amber-50/50',
      USER: 'hover:border-gray-300 hover:bg-gray-50'
    }
    return classes[userRole]
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isTomorrow = (date: Date) => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return date.toDateString() === tomorrow.toDateString()
  }

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Hoje'
    if (isTomorrow(date)) return 'Amanhã'
    return format(date, "dd 'de' MMMM", { locale: ptBR })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className={cn('h-5 w-5', getAccentColor())} />
          <h3 className="font-semibold text-gray-900">Próximos Eventos</h3>
        </div>
        <Link
          href="/admin/sessoes-legislativas"
          className={cn('text-sm font-medium flex items-center gap-1', getAccentColor())}
        >
          Ver agenda
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="space-y-3">
        {events.slice(0, 4).map((event) => (
          <div
            key={event.id}
            className={cn(
              'p-3 rounded-lg border border-gray-100 transition-all duration-200',
              getHoverClass()
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded-full',
                    getTypeBadgeClass(event.type)
                  )}>
                    {getTypeLabel(event.type)}
                  </span>
                  {(isToday(event.date) || isTomorrow(event.date)) && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                      {getDateLabel(event.date)}
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-900 truncate">
                  {event.title}
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{getDateLabel(event.date)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{event.time}</span>
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>{event.location}</span>
                    </div>
                  )}
                </div>
              </div>
              {event.attendees && (
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Users className="h-3 w-3" />
                  <span>{event.attendees}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {events.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhum evento próximo</p>
        </div>
      )}
    </div>
  )
}
