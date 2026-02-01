'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Calendar,
  ChevronRight,
  Clock,
  MapPin,
  Home,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalendarioLegislativo } from '@/components/calendario/calendario-legislativo'
import type { EventoCalendario } from '@/lib/services/calendario-service'

const TIPOS_EVENTO_INFO: Record<string, { label: string; cor: string }> = {
  sessao_ordinaria: { label: 'Sessão Ordinária', cor: '#3B82F6' },
  sessao_extraordinaria: { label: 'Sessão Extraordinária', cor: '#EF4444' },
  sessao_solene: { label: 'Sessão Solene', cor: '#8B5CF6' },
  sessao_especial: { label: 'Sessão Especial', cor: '#F59E0B' },
  audiencia_publica: { label: 'Audiência Pública', cor: '#10B981' },
  reuniao_comissao: { label: 'Reunião de Comissão', cor: '#6366F1' },
}

export default function CalendarioPage() {
  const [proximosEventos, setProximosEventos] = useState<EventoCalendario[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProximos() {
      try {
        const res = await fetch('/api/calendario?periodo=proximos&limite=5')
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
        <div className="container mx-auto px-4 py-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/" className="hover:text-camara-primary flex items-center gap-1">
              <Home className="h-4 w-4" />
              Inicio
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-gray-900">Calendario Legislativo</span>
          </nav>

          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-camara-primary/10 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-camara-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Calendario Legislativo
              </h1>
              <p className="text-gray-600">
                Acompanhe as sessoes, audiencias e eventos da Camara Municipal
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendário principal */}
          <div className="lg:col-span-3">
            <CalendarioLegislativo />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Próximos eventos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-camara-primary" />
                  Proximos Eventos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    Carregando...
                  </div>
                ) : proximosEventos.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    Nenhum evento programado
                  </div>
                ) : (
                  <div className="space-y-4">
                    {proximosEventos.map(evento => {
                      const tipoInfo = TIPOS_EVENTO_INFO[evento.tipo]
                      return (
                        <div
                          key={evento.id}
                          className="border-l-2 pl-3 py-1"
                          style={{ borderColor: evento.cor }}
                        >
                          <Badge
                            variant="secondary"
                            className="text-xs mb-1"
                            style={{
                              backgroundColor: `${evento.cor}20`,
                              color: evento.cor,
                            }}
                          >
                            {tipoInfo?.label || evento.tipo}
                          </Badge>
                          <h4 className="font-medium text-sm text-gray-900 line-clamp-1">
                            {evento.titulo}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                            <Clock className="h-3 w-3" />
                            {formatarData(new Date(evento.inicio))} - {formatarHora(new Date(evento.inicio))}
                          </div>
                          {evento.local && (
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <MapPin className="h-3 w-3" />
                              {evento.local}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Links úteis */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Links Uteis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link
                  href="/legislativo/sessoes"
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-camara-primary transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                  Sessoes Legislativas
                </Link>
                <Link
                  href="/legislativo/audiencias-publicas"
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-camara-primary transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                  Audiencias Publicas
                </Link>
                <Link
                  href="/legislativo/comissoes"
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-camara-primary transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                  Comissoes
                </Link>
                <Link
                  href="/legislativo/pautas-sessoes"
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-camara-primary transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                  Pautas das Sessoes
                </Link>
              </CardContent>
            </Card>

            {/* Informações */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sobre o Calendario</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 space-y-2">
                <p>
                  O calendario legislativo mostra todos os eventos programados
                  da Camara Municipal, incluindo:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Sessoes ordinarias e extraordinarias</li>
                  <li>Sessoes solenes e especiais</li>
                  <li>Audiencias publicas</li>
                  <li>Reunioes de comissoes</li>
                </ul>
                <p className="pt-2">
                  Use os filtros para visualizar apenas os tipos de eventos
                  que deseja acompanhar.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
