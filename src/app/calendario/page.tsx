'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Calendar,
  ChevronRight,
  Clock,
  MapPin,
  Home,
  FileText,
  Users,
  Mic,
  Gavel,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { CalendarioLegislativo } from '@/components/calendario/calendario-legislativo'
import { cn } from '@/lib/utils'
import type { EventoCalendario } from '@/lib/services/calendario-service'

const TIPOS_EVENTO_INFO: Record<string, { label: string; cor: string; icon: any }> = {
  sessao_ordinaria: { label: 'Sessao Ordinaria', cor: '#3B82F6', icon: Gavel },
  sessao_extraordinaria: { label: 'Sessao Extraordinaria', cor: '#EF4444', icon: Gavel },
  sessao_solene: { label: 'Sessao Solene', cor: '#8B5CF6', icon: Gavel },
  sessao_especial: { label: 'Sessao Especial', cor: '#F59E0B', icon: Gavel },
  audiencia_publica: { label: 'Audiencia Publica', cor: '#10B981', icon: Mic },
  reuniao_comissao: { label: 'Reuniao de Comissao', cor: '#6366F1', icon: Users },
}

const linksUteis = [
  { label: 'Sessoes Legislativas', href: '/legislativo/sessoes', icon: Gavel },
  { label: 'Audiencias Publicas', href: '/legislativo/audiencias-publicas', icon: Mic },
  { label: 'Comissoes', href: '/legislativo/comissoes', icon: Users },
  { label: 'Pautas das Sessoes', href: '/legislativo/pautas-sessoes', icon: FileText },
]

export default function CalendarioPage() {
  const [proximosEventos, setProximosEventos] = useState<EventoCalendario[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProximos() {
      try {
        const res = await fetch('/api/calendario?periodo=proximos&limite=5')
        if (!res.ok) throw new Error('Erro ao carregar dados')
        const data = await res.json()
        setProximosEventos(data.eventos || [])
      } catch (error) {
        console.error('Erro ao buscar proximos eventos:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchProximos()
  }, [])

  const formatarData = (data: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(new Date(data))
  }

  const formatarHora = (data: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(data))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 md:py-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 mb-3 md:mb-4">
            <Link href="/" className="hover:text-camara-primary flex items-center gap-1">
              <Home className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Inicio</span>
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-gray-900 font-medium">Calendario Legislativo</span>
          </nav>

          <div className="flex items-center gap-3">
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-camara-primary to-blue-700 rounded-xl flex items-center justify-center shadow-sm">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Calendario Legislativo
              </h1>
              <p className="text-xs sm:text-sm text-gray-500">
                Sessoes, audiencias e eventos da Camara
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Calendário principal */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            <CalendarioLegislativo />
          </div>

          {/* Sidebar */}
          <div className="space-y-4 md:space-y-6 order-1 lg:order-2">
            {/* Próximos eventos */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-camara-primary" />
                  Proximos Eventos
                </h3>
              </div>
              <div className="p-3 sm:p-4">
                {loading ? (
                  <div className="text-center py-6 text-gray-400 text-sm">
                    Carregando...
                  </div>
                ) : proximosEventos.length === 0 ? (
                  <div className="text-center py-6">
                    <Calendar className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Nenhum evento programado</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {proximosEventos.map(evento => {
                      const tipoInfo = TIPOS_EVENTO_INFO[evento.tipo]
                      const Icon = tipoInfo?.icon || Calendar
                      return (
                        <div
                          key={evento.id}
                          className="group relative rounded-xl border border-gray-100 hover:border-gray-200 p-3 transition-all hover:shadow-sm"
                        >
                          {/* Barra de cor lateral */}
                          <div
                            className="absolute left-0 top-2 bottom-2 w-1 rounded-full"
                            style={{ backgroundColor: evento.cor }}
                          />
                          <div className="pl-3">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Icon className="h-3 w-3" style={{ color: evento.cor }} />
                              <span
                                className="text-[11px] font-semibold uppercase tracking-wide"
                                style={{ color: evento.cor }}
                              >
                                {tipoInfo?.label || evento.tipo}
                              </span>
                            </div>
                            <h4 className="font-medium text-sm text-gray-900 line-clamp-1">
                              {evento.titulo}
                            </h4>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500 mt-1.5">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatarData(new Date(evento.inicio))} · {formatarHora(new Date(evento.inicio))}
                              </span>
                              {evento.local && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {evento.local}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Links úteis */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-sm font-bold text-gray-900">Acesso Rapido</h3>
              </div>
              <div className="p-2">
                {linksUteis.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 hover:text-camara-primary transition-colors group"
                  >
                    <link.icon className="h-4 w-4 text-gray-400 group-hover:text-camara-primary transition-colors" />
                    <span className="flex-1">{link.label}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-camara-primary transition-colors" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Legenda (mobile: horizontal, desktop: vertical) */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-sm font-bold text-gray-900">Legenda</h3>
              </div>
              <div className="p-3 sm:p-4">
                <div className="flex flex-wrap lg:flex-col gap-2 lg:gap-1.5">
                  {Object.entries(TIPOS_EVENTO_INFO).map(([tipo, info]) => (
                    <div key={tipo} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: info.cor }}
                      />
                      <span className="text-xs text-gray-600">{info.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
