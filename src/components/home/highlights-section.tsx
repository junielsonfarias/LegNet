/**
 * Highlights Section - Secao de Destaques
 * Cards com proxima sessao, sessao ao vivo e ultimas publicacoes
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  Calendar,
  Clock,
  PlayCircle,
  FileText,
  ChevronRight,
  Radio,
  Bell,
  ExternalLink
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useSessoes } from '@/lib/hooks/use-sessoes'

// =============================================================================
// COUNTDOWN HOOK
// =============================================================================

function useCountdown(targetDate: Date | null) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: true
  })

  useEffect(() => {
    if (!targetDate) return

    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const target = targetDate.getTime()
      const difference = target - now

      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true }
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
        isExpired: false
      }
    }

    setTimeLeft(calculateTimeLeft())

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [targetDate])

  return timeLeft
}

// =============================================================================
// COMPONENTE: Countdown Display
// =============================================================================

interface CountdownDisplayProps {
  days: number
  hours: number
  minutes: number
  seconds: number
  className?: string
}

function CountdownDisplay({ days, hours, minutes, seconds, className }: CountdownDisplayProps) {
  const units = [
    { value: days, label: 'dias' },
    { value: hours, label: 'horas' },
    { value: minutes, label: 'min' },
    { value: seconds, label: 'seg' }
  ]

  return (
    <div className={cn('flex gap-2', className)} role="timer" aria-label="Tempo restante">
      {units.map((unit, index) => (
        <div key={unit.label} className="flex flex-col items-center">
          <span className="text-2xl font-bold text-white bg-camara-primary rounded px-2 py-1 min-w-[48px] text-center">
            {String(unit.value).padStart(2, '0')}
          </span>
          <span className="text-xs text-gray-500 mt-1">{unit.label}</span>
        </div>
      ))}
    </div>
  )
}

// =============================================================================
// COMPONENTE: Proxima Sessao Card
// =============================================================================

function ProximaSessaoCard() {
  const { sessoes, loading } = useSessoes({ limit: 5 })

  const proximaSessao = useMemo(() => {
    if (!sessoes?.length) return null

    const agora = new Date()
    return sessoes
      .filter((s) => {
        // Combinar data e horario se disponivel
        const dataStr = s.horario ? `${s.data}T${s.horario}` : s.data
        const dataSessao = new Date(dataStr)
        return dataSessao > agora && s.status !== 'CONCLUIDA' && s.status !== 'CANCELADA'
      })
      .sort((a, b) => {
        const dataA = a.horario ? `${a.data}T${a.horario}` : a.data
        const dataB = b.horario ? `${b.data}T${b.horario}` : b.data
        return new Date(dataA).getTime() - new Date(dataB).getTime()
      })
      [0]
  }, [sessoes])

  const targetDate = proximaSessao
    ? new Date(proximaSessao.horario ? `${proximaSessao.data}T${proximaSessao.horario}` : proximaSessao.data)
    : null
  const countdown = useCountdown(targetDate)

  if (loading) {
    return (
      <Card className="h-full animate-pulse">
        <CardHeader className="pb-2">
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </CardContent>
      </Card>
    )
  }

  if (!proximaSessao) {
    return (
      <Card className="h-full bg-gray-50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-camara-primary" />
            Proxima Sessao
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm">
            Nenhuma sessao agendada no momento.
          </p>
          <Button asChild variant="link" className="p-0 h-auto mt-2 text-camara-primary">
            <Link href="/calendario">
              Ver calendario completo
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const dataSessao = new Date(
    proximaSessao.horario
      ? `${proximaSessao.data}T${proximaSessao.horario}`
      : proximaSessao.data
  )

  return (
    <Card className="h-full border-l-4 border-l-camara-primary hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-camara-primary" />
            Proxima Sessao
          </CardTitle>
          <Badge variant="outline" className="text-camara-primary border-camara-primary">
            {proximaSessao.tipo?.replace(/_/g, ' ') || 'Ordinaria'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Countdown */}
        {!countdown.isExpired && (
          <div className="py-2">
            <p className="text-xs text-gray-500 mb-2">Comeca em:</p>
            <CountdownDisplay {...countdown} />
          </div>
        )}

        {/* Detalhes */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span>
              {dataSessao.toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-gray-400" />
            <span>
              {dataSessao.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>

        {/* CTA */}
        <Button asChild className="w-full bg-camara-primary hover:bg-camara-primary/90">
          <Link href={`/legislativo/sessoes/${proximaSessao.id}`}>
            <Bell className="h-4 w-4 mr-2" />
            Ver Pauta da Sessao
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// COMPONENTE: Sessao ao Vivo Card
// =============================================================================

function SessaoAoVivoCard() {
  const { sessoes, loading } = useSessoes({ limit: 1 })

  const sessaoEmAndamento = useMemo(() => {
    if (!sessoes?.length) return null
    return sessoes.find((s) => s.status === 'EM_ANDAMENTO')
  }, [sessoes])

  if (loading) {
    return (
      <Card className="h-full animate-pulse">
        <CardHeader className="pb-2">
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        </CardHeader>
        <CardContent>
          <div className="h-24 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    )
  }

  if (!sessaoEmAndamento) {
    return (
      <Card className="h-full bg-gradient-to-br from-gray-50 to-gray-100">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <PlayCircle className="h-5 w-5 text-gray-400" />
            Transmissao ao Vivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm mb-4">
            Nenhuma sessao em andamento no momento.
          </p>
          <p className="text-xs text-gray-400">
            As transmissoes acontecem durante as sessoes legislativas.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full bg-gradient-to-br from-red-50 to-red-100 border-l-4 border-l-red-500 animate-pulse-soft">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg text-red-700">
            <Radio className="h-5 w-5 animate-pulse" />
            AO VIVO
          </CardTitle>
          <span className="flex items-center gap-1 text-xs text-red-600">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            Transmitindo
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold text-gray-900">
            Sessao {sessaoEmAndamento.tipo?.replace(/_/g, ' ')}
          </h3>
          <p className="text-sm text-gray-600">
            {new Date(sessaoEmAndamento.data).toLocaleDateString('pt-BR')}
          </p>
        </div>

        <Button asChild className="w-full bg-red-600 hover:bg-red-700">
          <Link href="/transmissao" target="_blank">
            <PlayCircle className="h-4 w-4 mr-2" />
            Assistir Agora
            <ExternalLink className="h-3 w-3 ml-2" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// COMPONENTE: Ultimas Publicacoes Card
// =============================================================================

interface Publicacao {
  id: string
  titulo: string
  tipo: string
  data: string
}

function UltimasPublicacoesCard() {
  const [publicacoes, setPublicacoes] = useState<Publicacao[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPublicacoes = async () => {
      try {
        const res = await fetch('/api/dados-abertos/publicacoes?limit=3')
        const data = await res.json()
        setPublicacoes(data.dados || [])
      } catch (error) {
        console.error('Erro ao buscar publicacoes:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchPublicacoes()
  }, [])

  if (loading) {
    return (
      <Card className="h-full animate-pulse">
        <CardHeader className="pb-2">
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5 text-camara-primary" />
          Ultimas Publicacoes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {publicacoes.length === 0 ? (
          <p className="text-gray-500 text-sm">
            Nenhuma publicacao recente.
          </p>
        ) : (
          publicacoes.map((pub) => (
            <Link
              key={pub.id}
              href="/transparencia/publicacoes"
              className="block p-2 rounded-md hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-camara-primary/10 rounded flex items-center justify-center">
                  <FileText className="h-4 w-4 text-camara-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate group-hover:text-camara-primary transition-colors">
                    {pub.titulo}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {pub.tipo}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {new Date(pub.data).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}

        <Button asChild variant="outline" className="w-full mt-2">
          <Link href="/transparencia/publicacoes">
            Ver Todas
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// COMPONENTE PRINCIPAL: HighlightsSection
// =============================================================================

interface HighlightsSectionProps {
  className?: string
}

export function HighlightsSection({ className }: HighlightsSectionProps) {
  return (
    <section
      className={cn('py-12 bg-gray-50', className)}
      aria-label="Destaques"
    >
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Proxima Sessao ou Sessao ao Vivo */}
          <div className="lg:col-span-1">
            <SessaoAoVivoFallback />
          </div>

          {/* Proxima Sessao */}
          <div className="lg:col-span-1">
            <ProximaSessaoCard />
          </div>

          {/* Ultimas Publicacoes */}
          <div className="lg:col-span-1">
            <UltimasPublicacoesCard />
          </div>
        </div>
      </div>
    </section>
  )
}

// Componente que decide entre mostrar sessao ao vivo ou conteudo alternativo
function SessaoAoVivoFallback() {
  const { sessoes } = useSessoes({ limit: 1 })
  const temSessaoAoVivo = sessoes?.some((s) => s.status === 'EM_ANDAMENTO')

  if (temSessaoAoVivo) {
    return <SessaoAoVivoCard />
  }

  // Card alternativo quando nao ha sessao ao vivo
  return (
    <Card className="h-full bg-gradient-to-br from-camara-primary to-blue-700 text-white">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg text-white">
          <PlayCircle className="h-5 w-5" />
          Canal da Camara
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-blue-100 text-sm">
          Assista as sessoes legislativas, audiencias publicas e eventos da Camara Municipal.
        </p>

        <Button asChild variant="secondary" className="w-full">
          <Link href="/transmissao">
            <PlayCircle className="h-4 w-4 mr-2" />
            Acessar Canal
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

export default HighlightsSection
