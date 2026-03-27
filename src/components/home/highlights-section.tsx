/**
 * Highlights Section - Layout com Proxima Sessao + Atividade Legislativa
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Calendar,
  Clock,
  MapPin,
  FileText,
  ArrowRight,
  TrendingUp,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface Sessao {
  id: string
  numero: number
  tipo: string
  data: string
  horario?: string
  local?: string
  status: string
}

interface Proposicao {
  id: string
  numero: string
  ano: number
  tipo: string
  titulo: string
  status: string
  ementa?: string
  dataApresentacao: string
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function Countdown({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState({ dias: 0, horas: 0, minutos: 0 })

  useEffect(() => {
    const calc = () => {
      const diff = new Date(targetDate).getTime() - Date.now()
      if (diff <= 0) return { dias: 0, horas: 0, minutos: 0 }
      return {
        dias: Math.floor(diff / 86400000),
        horas: Math.floor((diff % 86400000) / 3600000),
        minutos: Math.floor((diff % 3600000) / 60000)
      }
    }
    setTimeLeft(calc())
    const id = setInterval(() => setTimeLeft(calc()), 60000)
    return () => clearInterval(id)
  }, [targetDate])

  return (
    <div className="flex gap-3">
      {[
        { value: timeLeft.dias, label: 'dias' },
        { value: timeLeft.horas, label: 'hrs' },
        { value: timeLeft.minutos, label: 'min' },
      ].map((item) => (
        <div key={item.label} className="text-center">
          <div className="text-2xl font-bold" style={{ color: 'var(--municipal-primary)' }}>
            {String(item.value).padStart(2, '0')}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">{item.label}</div>
        </div>
      ))}
    </div>
  )
}

const statusColors: Record<string, string> = {
  'APROVADA': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'REJEITADA': 'bg-red-50 text-red-700 border-red-200',
  'EM_TRAMITACAO': 'bg-blue-50 text-blue-700 border-blue-200',
  'EM_PAUTA': 'bg-amber-50 text-amber-700 border-amber-200',
  'AGUARDANDO_PAUTA': 'bg-gray-50 text-gray-600 border-gray-200',
}

const tipoLabels: Record<string, string> = {
  'PROJETO_LEI': 'PL',
  'PROJETO_LEI_COMPLEMENTAR': 'PLC',
  'REQUERIMENTO': 'REQ',
  'INDICACAO': 'IND',
  'MOCAO': 'MOC',
  'DECRETO_LEGISLATIVO': 'DL',
}

export function HighlightsSection() {
  const [proximaSessao, setProximaSessao] = useState<Sessao | null>(null)
  const [proposicoesRecentes, setProposicoesRecentes] = useState<Proposicao[]>([])

  useEffect(() => {
    const fetchSessao = async () => {
      try {
        const res = await fetch('/api/sessoes?status=AGENDADA&limit=1')
        const data = await res.json()
        if (data.data?.length > 0) setProximaSessao(data.data[0])
      } catch {}
    }
    const fetchProposicoes = async () => {
      try {
        const res = await fetch('/api/dados-abertos/proposicoes?limit=6')
        const data = await res.json()
        setProposicoesRecentes(data.dados || [])
      } catch {}
    }
    fetchSessao()
    fetchProposicoes()
  }, [])

  return (
    <section className="py-10 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Proxima Sessao */}
          <Card className="lg:col-span-1 border-0 shadow-lg shadow-gray-200/50 overflow-hidden">
            <div
              className="h-1.5"
              style={{ background: 'linear-gradient(90deg, var(--municipal-primary), var(--municipal-primary-light))' }}
            />
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
                  <Calendar className="h-4 w-4" style={{ color: 'var(--municipal-primary)' }} />
                  Proxima Sessao
                </CardTitle>
                {proximaSessao && (
                  <Badge variant="outline" className="text-[10px] font-semibold uppercase">
                    {proximaSessao.tipo}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {proximaSessao ? (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>{formatDate(proximaSessao.data)}</span>
                      {proximaSessao.horario && (
                        <span className="text-gray-400">as {proximaSessao.horario}</span>
                      )}
                    </div>
                    {proximaSessao.local && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{proximaSessao.local}</span>
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">Contagem regressiva</p>
                    <Countdown targetDate={proximaSessao.data} />
                  </div>

                  <Button asChild variant="outline" className="w-full" size="sm">
                    <Link href="/legislativo/sessoes">
                      Ver detalhes <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Link>
                  </Button>
                </>
              ) : (
                <div className="text-center py-6">
                  <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">Nenhuma sessao agendada</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Atividade Legislativa Recente */}
          <Card className="lg:col-span-2 border-0 shadow-lg shadow-gray-200/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" style={{ color: 'var(--municipal-primary)' }} />
                  Atividade Legislativa
                </CardTitle>
                <Link
                  href="/legislativo/proposicoes"
                  className="text-sm font-medium hover:underline flex items-center gap-1"
                  style={{ color: 'var(--municipal-primary)' }}
                >
                  Ver todas <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {proposicoesRecentes.length > 0 ? (
                <div className="space-y-1">
                  {proposicoesRecentes.map((prop) => (
                    <Link
                      key={prop.id}
                      href={`/legislativo/proposicoes/${prop.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <div className="shrink-0 w-11 h-11 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                        <FileText className="h-5 w-5 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-500 uppercase">
                            {tipoLabels[prop.tipo] || prop.tipo} {prop.numero}/{prop.ano}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 ${statusColors[prop.status] || 'bg-gray-50 text-gray-600'}`}
                          >
                            {prop.status?.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 truncate mt-0.5">
                          {prop.titulo || prop.ementa || 'Sem titulo'}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400 shrink-0 hidden md:block">
                        {formatDateShort(prop.dataApresentacao)}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">Nenhuma proposicao recente</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}

export default HighlightsSection
