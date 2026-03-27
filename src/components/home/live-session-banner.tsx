/**
 * Live Session Banner - Banner flutuante para sessao ao vivo ou proxima sessao
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Radio,
  Calendar,
  Clock,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Sessao {
  id: string
  numero: number
  tipo: string
  data: string
  horario?: string
  status: string
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
        minutos: Math.floor((diff % 3600000) / 60000),
      }
    }
    setTimeLeft(calc())
    const id = setInterval(() => setTimeLeft(calc()), 60000)
    return () => clearInterval(id)
  }, [targetDate])

  return (
    <div className="flex items-center gap-2">
      {[
        { value: timeLeft.dias, label: 'd' },
        { value: timeLeft.horas, label: 'h' },
        { value: timeLeft.minutos, label: 'm' },
      ].map((item, i) => (
        <span key={item.label} className="flex items-center gap-0.5">
          {i > 0 && <span className="text-white/40 mx-0.5">:</span>}
          <span className="font-bold text-white text-lg tabular-nums">
            {String(item.value).padStart(2, '0')}
          </span>
          <span className="text-white/60 text-xs">{item.label}</span>
        </span>
      ))}
    </div>
  )
}

export function LiveSessionBanner() {
  const [sessaoAoVivo, setSessaoAoVivo] = useState<Sessao | null>(null)
  const [proximaSessao, setProximaSessao] = useState<Sessao | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check for live session
        const liveRes = await fetch('/api/sessoes?status=EM_ANDAMENTO&limit=1')
        const liveData = await liveRes.json()
        if (liveData.data?.length > 0) {
          setSessaoAoVivo(liveData.data[0])
          setVisible(true)
          return
        }

        // Check for next scheduled session
        const nextRes = await fetch('/api/sessoes?status=AGENDADA&limit=1')
        const nextData = await nextRes.json()
        if (nextData.data?.length > 0) {
          setProximaSessao(nextData.data[0])
          setVisible(true)
        }
      } catch {}
    }
    fetchData()
  }, [])

  if (!visible) return null

  // Live session banner
  if (sessaoAoVivo) {
    return (
      <section className="relative overflow-hidden">
        <div className="bg-gradient-to-r from-red-600 via-red-500 to-red-700">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
                  </span>
                  <span className="font-bold text-sm text-white uppercase tracking-wider">Ao Vivo</span>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm md:text-base">
                    {sessaoAoVivo.tipo} {sessaoAoVivo.numero}/{new Date(sessaoAoVivo.data).getFullYear()}
                  </p>
                  <p className="text-white/70 text-xs hidden sm:block">Sessao em andamento</p>
                </div>
              </div>
              <Button
                asChild
                size="sm"
                className="bg-white text-red-600 hover:bg-white/90 font-semibold shadow-lg"
              >
                <Link href="/legislativo/ao-vivo">
                  Assistir agora <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  // Next session banner
  if (proximaSessao) {
    const sessionDate = new Date(proximaSessao.data)
    const formattedDate = sessionDate.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
    })

    return (
      <section className="relative overflow-hidden">
        <div
          className="py-4"
          style={{
            background: 'linear-gradient(135deg, var(--municipal-primary-dark) 0%, var(--municipal-primary) 100%)',
          }}
        >
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-white/15 rounded-full px-3 py-1.5">
                  <Calendar className="h-4 w-4 text-white" />
                  <span className="font-semibold text-sm text-white">Proxima Sessao</span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-white font-semibold text-sm">
                    {proximaSessao.tipo} - {formattedDate}
                    {proximaSessao.horario && ` as ${proximaSessao.horario}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Countdown targetDate={proximaSessao.data} />
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="border-white/40 text-white hover:bg-white/10"
                >
                  <Link href="/legislativo/sessoes">
                    Detalhes <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return null
}

export default LiveSessionBanner
