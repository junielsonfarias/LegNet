'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  CalendarDays,
  List,
  MapPin,
  Clock,
  ExternalLink,
  Download,
  Filter,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import type { EventoCalendario, TipoEvento } from '@/lib/services/calendario-service'

type VisualizacaoCalendario = 'mes' | 'semana' | 'lista'

interface CalendarioLegislativoProps {
  className?: string
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
const MESES = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const TIPOS_EVENTO: { tipo: TipoEvento; label: string; cor: string }[] = [
  { tipo: 'sessao_ordinaria', label: 'Sessao Ordinaria', cor: '#3B82F6' },
  { tipo: 'sessao_extraordinaria', label: 'Sessao Extraordinaria', cor: '#EF4444' },
  { tipo: 'sessao_solene', label: 'Sessao Solene', cor: '#8B5CF6' },
  { tipo: 'sessao_especial', label: 'Sessao Especial', cor: '#F59E0B' },
  { tipo: 'audiencia_publica', label: 'Audiencia Publica', cor: '#10B981' },
  { tipo: 'reuniao_comissao', label: 'Reuniao de Comissao', cor: '#6366F1' },
]

export function CalendarioLegislativo({ className }: CalendarioLegislativoProps) {
  const [dataAtual, setDataAtual] = useState(new Date())
  const [visualizacao, setVisualizacao] = useState<VisualizacaoCalendario>('mes')
  const [eventos, setEventos] = useState<EventoCalendario[]>([])
  const [loading, setLoading] = useState(true)
  const [eventoSelecionado, setEventoSelecionado] = useState<EventoCalendario | null>(null)
  const [tiposFiltrados, setTiposFiltrados] = useState<TipoEvento[]>([])
  const [showFiltros, setShowFiltros] = useState(false)

  // Buscar eventos
  const buscarEventos = useCallback(async () => {
    setLoading(true)
    try {
      const ano = dataAtual.getFullYear()
      const mes = dataAtual.getMonth() + 1

      let url = `/api/calendario?periodo=mes&ano=${ano}&mes=${mes}`
      if (tiposFiltrados.length > 0) {
        url += `&tipos=${tiposFiltrados.join(',')}`
      }

      const res = await fetch(url)
      const data = await res.json()
      setEventos(data.eventos || [])
    } catch (error) {
      console.error('Erro ao buscar eventos:', error)
      setEventos([])
    } finally {
      setLoading(false)
    }
  }, [dataAtual, tiposFiltrados])

  useEffect(() => {
    buscarEventos()
  }, [buscarEventos])

  // Navegação
  const navegarMes = (direcao: number) => {
    setDataAtual(prev => {
      const novaData = new Date(prev)
      novaData.setMonth(novaData.getMonth() + direcao)
      return novaData
    })
  }

  const irParaHoje = () => {
    setDataAtual(new Date())
  }

  // Toggle filtro de tipo
  const toggleTipo = (tipo: TipoEvento) => {
    setTiposFiltrados(prev =>
      prev.includes(tipo)
        ? prev.filter(t => t !== tipo)
        : [...prev, tipo]
    )
  }

  // Obter eventos de um dia
  const getEventosDoDia = (data: Date): EventoCalendario[] => {
    return eventos.filter(e => {
      const dataEvento = new Date(e.inicio)
      return (
        dataEvento.getDate() === data.getDate() &&
        dataEvento.getMonth() === data.getMonth() &&
        dataEvento.getFullYear() === data.getFullYear()
      )
    })
  }

  // Gerar dias do mês
  const gerarDiasDoMes = () => {
    const ano = dataAtual.getFullYear()
    const mes = dataAtual.getMonth()

    const primeiroDia = new Date(ano, mes, 1)
    const ultimoDia = new Date(ano, mes + 1, 0)

    const dias: (Date | null)[] = []

    // Dias vazios antes do primeiro dia
    for (let i = 0; i < primeiroDia.getDay(); i++) {
      dias.push(null)
    }

    // Dias do mês
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      dias.push(new Date(ano, mes, dia))
    }

    return dias
  }

  // Formatar hora
  const formatarHora = (data: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(data))
  }

  // Formatar data completa
  const formatarDataCompleta = (data: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(data))
  }

  // Gerar link Google Calendar
  const gerarLinkGoogleCalendar = (evento: EventoCalendario) => {
    const formatarData = (data: Date) => {
      return new Date(data).toISOString().replace(/-|:|\.\d{3}/g, '')
    }

    const inicio = formatarData(new Date(evento.inicio))
    const fim = evento.fim
      ? formatarData(new Date(evento.fim))
      : formatarData(new Date(new Date(evento.inicio).getTime() + 2 * 60 * 60 * 1000))

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: evento.titulo,
      dates: `${inicio}/${fim}`,
      details: evento.descricao || '',
      location: evento.local || '',
    })

    return `https://calendar.google.com/calendar/render?${params.toString()}`
  }

  const hoje = new Date()
  const diasDoMes = gerarDiasDoMes()

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {MESES[dataAtual.getMonth()]} {dataAtual.getFullYear()}
          </h2>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={() => navegarMes(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={irParaHoje}>
              Hoje
            </Button>
            <Button variant="outline" size="icon" onClick={() => navegarMes(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Filtros */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFiltros(!showFiltros)}
            className={tiposFiltrados.length > 0 ? 'border-camara-primary text-camara-primary' : ''}
          >
            <Filter className="h-4 w-4 mr-1" />
            Filtros
            {tiposFiltrados.length > 0 && (
              <Badge variant="secondary" className="ml-1 px-1.5">
                {tiposFiltrados.length}
              </Badge>
            )}
          </Button>

          {/* Visualização */}
          <div className="flex border rounded-lg overflow-hidden">
            <Button
              variant={visualizacao === 'mes' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-none"
              onClick={() => setVisualizacao('mes')}
            >
              <Calendar className="h-4 w-4" />
            </Button>
            <Button
              variant={visualizacao === 'semana' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-none"
              onClick={() => setVisualizacao('semana')}
            >
              <CalendarDays className="h-4 w-4" />
            </Button>
            <Button
              variant={visualizacao === 'lista' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-none"
              onClick={() => setVisualizacao('lista')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Download iCal */}
          <Button variant="outline" size="sm" asChild>
            <a
              href={`/api/calendario?periodo=mes&ano=${dataAtual.getFullYear()}&mes=${dataAtual.getMonth() + 1}&formato=ical`}
              download
            >
              <Download className="h-4 w-4 mr-1" />
              iCal
            </a>
          </Button>
        </div>
      </div>

      {/* Painel de filtros */}
      {showFiltros && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3">
              {TIPOS_EVENTO.map(({ tipo, label, cor }) => (
                <label
                  key={tipo}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Checkbox
                    checked={tiposFiltrados.length === 0 || tiposFiltrados.includes(tipo)}
                    onCheckedChange={() => toggleTipo(tipo)}
                  />
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: cor }}
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
              {tiposFiltrados.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTiposFiltrados([])}
                  className="text-gray-500"
                >
                  <X className="h-3 w-3 mr-1" />
                  Limpar filtros
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Visualização Mês */}
      {visualizacao === 'mes' && (
        <Card>
          <CardContent className="p-4">
            {/* Cabeçalho dias da semana */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DIAS_SEMANA.map(dia => (
                <div
                  key={dia}
                  className="text-center text-sm font-medium text-gray-500 py-2"
                >
                  {dia}
                </div>
              ))}
            </div>

            {/* Dias do mês */}
            <div className="grid grid-cols-7 gap-1">
              {diasDoMes.map((data, index) => {
                if (!data) {
                  return <div key={`empty-${index}`} className="min-h-[100px]" />
                }

                const eventosData = getEventosDoDia(data)
                const isHoje =
                  data.getDate() === hoje.getDate() &&
                  data.getMonth() === hoje.getMonth() &&
                  data.getFullYear() === hoje.getFullYear()

                return (
                  <div
                    key={data.toISOString()}
                    className={cn(
                      'min-h-[100px] border rounded-lg p-1 transition-colors',
                      isHoje ? 'bg-camara-primary/5 border-camara-primary' : 'hover:bg-gray-50'
                    )}
                  >
                    <div
                      className={cn(
                        'text-sm font-medium mb-1 px-1',
                        isHoje ? 'text-camara-primary' : 'text-gray-700'
                      )}
                    >
                      {data.getDate()}
                    </div>
                    <div className="space-y-1">
                      {eventosData.slice(0, 3).map(evento => (
                        <button
                          key={evento.id}
                          onClick={() => setEventoSelecionado(evento)}
                          className="w-full text-left text-xs p-1 rounded truncate"
                          style={{ backgroundColor: `${evento.cor}20`, color: evento.cor }}
                        >
                          {formatarHora(new Date(evento.inicio))} {evento.titulo}
                        </button>
                      ))}
                      {eventosData.length > 3 && (
                        <div className="text-xs text-gray-500 px-1">
                          +{eventosData.length - 3} mais
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Visualização Lista */}
      {visualizacao === 'lista' && (
        <Card>
          <CardContent className="p-4">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Carregando...</div>
            ) : eventos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhum evento neste mes
              </div>
            ) : (
              <div className="space-y-3">
                {eventos.map(evento => (
                  <button
                    key={evento.id}
                    onClick={() => setEventoSelecionado(evento)}
                    className="w-full text-left p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="w-1 h-full min-h-[60px] rounded-full"
                        style={{ backgroundColor: evento.cor }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant="secondary"
                            className="text-xs"
                            style={{
                              backgroundColor: `${evento.cor}20`,
                              color: evento.cor,
                            }}
                          >
                            {TIPOS_EVENTO.find(t => t.tipo === evento.tipo)?.label}
                          </Badge>
                        </div>
                        <h4 className="font-medium text-gray-900">{evento.titulo}</h4>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {formatarDataCompleta(new Date(evento.inicio))}
                            {' - '}
                            {formatarHora(new Date(evento.inicio))}
                          </span>
                          {evento.local && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {evento.local}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Visualização Semana */}
      {visualizacao === 'semana' && (
        <Card>
          <CardContent className="p-4">
            <div className="text-center py-8 text-gray-500">
              Visualizacao semanal em desenvolvimento
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legenda */}
      <Card>
        <CardContent className="p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Legenda</h4>
          <div className="flex flex-wrap gap-4">
            {TIPOS_EVENTO.map(({ tipo, label, cor }) => (
              <div key={tipo} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: cor }}
                />
                <span className="text-sm text-gray-600">{label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal de detalhes do evento */}
      <Dialog open={!!eventoSelecionado} onOpenChange={() => setEventoSelecionado(null)}>
        <DialogContent className="max-w-md">
          {eventoSelecionado && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge
                    style={{
                      backgroundColor: `${eventoSelecionado.cor}20`,
                      color: eventoSelecionado.cor,
                    }}
                  >
                    {TIPOS_EVENTO.find(t => t.tipo === eventoSelecionado.tipo)?.label}
                  </Badge>
                </div>
                <DialogTitle>{eventoSelecionado.titulo}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>
                    {formatarDataCompleta(new Date(eventoSelecionado.inicio))}
                    <br />
                    {formatarHora(new Date(eventoSelecionado.inicio))}
                    {eventoSelecionado.fim &&
                      ` - ${formatarHora(new Date(eventoSelecionado.fim))}`}
                  </span>
                </div>

                {eventoSelecionado.local && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{eventoSelecionado.local}</span>
                  </div>
                )}

                {eventoSelecionado.descricao && (
                  <p className="text-sm text-gray-600">
                    {eventoSelecionado.descricao}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  {eventoSelecionado.url && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={eventoSelecionado.url}>
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Ver detalhes
                      </Link>
                    </Button>
                  )}
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={gerarLinkGoogleCalendar(eventoSelecionado)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Calendar className="h-4 w-4 mr-1" />
                      Google Calendar
                    </a>
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
