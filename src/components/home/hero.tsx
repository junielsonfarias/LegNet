/**
 * Hero Section - Layout com 4 cards de acesso rapido
 * Inspirado no layout de Curitiba com 4 boxes proeminentes
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import {
  Search,
  Users,
  FileText,
  Eye,
  Video,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useConfiguracaoInstitucional } from '@/lib/hooks/use-configuracao-institucional'
import { useStaggerReveal } from '@/lib/hooks/use-scroll-reveal'

// Contador animado reutilizavel
function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const prevValue = useRef(0)

  useEffect(() => {
    // Se o valor não mudou ou é 0, não animar
    if (value === prevValue.current || !ref.current) return
    prevValue.current = value

    // Se já está visível, animar imediatamente
    const doAnimate = () => {
      const duration = 1800
      const startTime = performance.now()
      const animate = (now: number) => {
        const progress = Math.min((now - startTime) / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setCount(Math.floor(eased * value))
        if (progress < 1) requestAnimationFrame(animate)
      }
      requestAnimationFrame(animate)
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          doAnimate()
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [value])

  return <span ref={ref}>{count}{suffix}</span>
}

// 4 cards de acesso rapido proeminentes
const quickAccessCards = [
  {
    icon: FileText,
    title: 'Proposicoes',
    subtitle: 'Acompanhe projetos de lei',
    href: '/legislativo/proposicoes',
    gradient: 'from-indigo-500 to-indigo-700',
    shadowColor: 'shadow-indigo-500/25',
  },
  {
    icon: Video,
    title: 'Sessoes',
    subtitle: 'Assista sessoes ao vivo',
    href: '/legislativo/sessoes',
    gradient: 'from-emerald-500 to-emerald-700',
    shadowColor: 'shadow-emerald-500/25',
  },
  {
    icon: Users,
    title: 'Vereadores',
    subtitle: 'Conheca os parlamentares',
    href: '/parlamentares',
    gradient: 'from-violet-500 to-violet-700',
    shadowColor: 'shadow-violet-500/25',
  },
  {
    icon: Eye,
    title: 'Transparencia',
    subtitle: 'Acesse dados publicos',
    href: '/transparencia',
    gradient: 'from-amber-500 to-amber-700',
    shadowColor: 'shadow-amber-500/25',
  },
]

function QuickAccessCards() {
  const { containerRef, getItemStyle } = useStaggerReveal({
    direction: 'up',
    distance: 40,
    duration: 700,
    staggerDelay: 100,
    threshold: 0.2,
  })

  return (
    <section className="relative z-20 -mt-16 mb-4">
      <div className="container mx-auto px-4" ref={containerRef}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
          {quickAccessCards.map((card, index) => (
            <Link
              key={card.href}
              href={card.href}
              className="group"
              style={getItemStyle(index)}
            >
              <div
                className={cn(
                  'relative overflow-hidden rounded-2xl bg-gradient-to-br p-4 sm:p-6 md:p-8 h-full',
                  'shadow-xl transition-all duration-300',
                  'hover:shadow-2xl hover:scale-[1.03] hover:-translate-y-1',
                  card.gradient,
                  card.shadowColor
                )}
              >
                {/* Decoracao com glass effect */}
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/10 -mr-8 -mt-8 group-hover:scale-125 transition-transform duration-500" aria-hidden="true" />
                <div className="absolute bottom-0 left-0 w-16 h-16 rounded-full bg-white/5 -ml-4 -mb-4 group-hover:scale-150 transition-transform duration-700" aria-hidden="true" />

                <div className="relative z-10 flex flex-col h-full">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-white/30 group-hover:rotate-3 transition-all duration-300">
                    <card.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-1">
                    {card.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-white/70 flex-1">
                    {card.subtitle}
                  </p>
                  <div className="mt-3 sm:mt-4 flex items-center gap-1 text-white/60 group-hover:text-white/90 transition-colors text-xs sm:text-sm font-medium">
                    Acessar <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:translate-x-2 transition-transform duration-300" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export function Hero() {
  const { configuracao } = useConfiguracaoInstitucional()
  const [searchQuery, setSearchQuery] = useState('')
  const [stats, setStats] = useState({ vereadores: 0, sessoes: 0, materias: 0 })

  useEffect(() => {
    const fetchStat = async (url: string): Promise<number> => {
      try {
        const res = await fetch(url)
        if (!res.ok) return 0
        const data = await res.json()
        return data.metadados?.total || data.dados?.length || data.pagination?.total || 0
      } catch {
        return 0
      }
    }

    Promise.all([
      fetchStat('/api/dados-abertos/parlamentares'),
      fetchStat('/api/dados-abertos/sessoes?limit=1'),
      fetchStat('/api/dados-abertos/proposicoes?limit=1'),
    ]).then(([vereadores, sessoes, materias]) => {
      setStats({ vereadores, sessoes, materias })
    })
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/legislativo/proposicoes?search=${encodeURIComponent(searchQuery)}`
    }
  }

  const nomeCasa = configuracao.nomeCasa || 'Camara Municipal'

  return (
    <>
      {/* Hero Principal */}
      <section className="relative overflow-hidden bg-gray-50">
        {/* Background */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(160deg, var(--municipal-primary) 0%, var(--municipal-primary-dark) 40%, var(--municipal-primary-darker) 100%)`
          }}
        />

        {/* Textura noise overlay para profundidade */}
        <div
          className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
          aria-hidden="true"
        />

        {/* Elementos decorativos geometricos com animacao */}
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-white/5 animate-[pulse-soft_8s_ease-in-out_infinite]" />
          <div className="absolute top-20 -left-20 w-72 h-72 rounded-full bg-white/5 animate-[pulse-soft_10s_ease-in-out_infinite_1s]" />
          <div className="absolute bottom-10 right-1/4 w-48 h-48 rounded-full bg-white/5 animate-[pulse-soft_12s_ease-in-out_infinite_2s]" />
          {/* Linhas diagonais sutis */}
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `repeating-linear-gradient(
                -45deg,
                transparent,
                transparent 40px,
                rgba(255,255,255,0.5) 40px,
                rgba(255,255,255,0.5) 41px
              )`,
            }}
          />
        </div>

        <div className="relative z-10 container mx-auto px-4 pt-12 pb-24 md:pt-16 md:pb-32">
          {/* Top: Brasao + Nome */}
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-4 mb-4">
              {configuracao.brasaoUrl && (
                <Image
                  src={configuracao.brasaoUrl}
                  alt={`Brasao - ${nomeCasa}`}
                  width={72}
                  height={72}
                  className="w-14 h-14 md:w-[72px] md:h-[72px] object-contain drop-shadow-lg"
                />
              )}
              <div className="text-left">
                <h1 className="text-2xl md:text-4xl font-bold text-white tracking-tight">
                  {nomeCasa}
                </h1>
                <p className="text-sm md:text-base text-white/70">
                  Portal Institucional | Legislatura {configuracao.legislatura || '2025/2028'}
                </p>
              </div>
            </div>
          </div>

          {/* Barra de Busca Central */}
          <div className="max-w-2xl mx-auto mb-12">
            <form onSubmit={handleSearch} className="relative group">
              <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl group-focus-within:bg-white/30 transition-all" />
              <div className="relative flex items-center bg-white rounded-xl shadow-2xl shadow-black/10 overflow-hidden">
                <Search className="h-5 w-5 text-gray-400 ml-5 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar proposicoes, sessoes, normas..."
                  className="flex-1 px-4 py-4 md:py-5 text-base md:text-lg text-gray-900 placeholder:text-gray-400 outline-none bg-transparent"
                />
                <Button
                  type="submit"
                  className="mr-2 rounded-lg px-5 py-2.5 font-medium"
                  style={{ backgroundColor: 'var(--municipal-primary)' }}
                >
                  Buscar
                </Button>
              </div>
            </form>

            {/* Links rapidos abaixo da busca */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-4 text-sm text-white/60">
              <span>Populares:</span>
              <Link href="/legislativo/proposicoes?tipo=PROJETO_LEI" className="hover:text-white transition-colors">
                Projetos de Lei
              </Link>
              <Link href="/legislativo/proposicoes?tipo=REQUERIMENTO" className="hover:text-white transition-colors">
                Requerimentos
              </Link>
              <Link href="/legislativo/sessoes" className="hover:text-white transition-colors">
                Sessoes Plenarias
              </Link>
            </div>
          </div>

          {/* Numeros/Estatisticas */}
          <div className="flex items-center justify-center gap-8 md:gap-16">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white">
                <AnimatedNumber value={stats.vereadores} />
              </div>
              <div className="text-xs md:text-sm text-white/60 mt-1">Vereadores</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white">
                <AnimatedNumber value={stats.sessoes} />
              </div>
              <div className="text-xs md:text-sm text-white/60 mt-1">Sessoes</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white">
                <AnimatedNumber value={stats.materias} />
              </div>
              <div className="text-xs md:text-sm text-white/60 mt-1">Materias</div>
            </div>
            <div className="w-px h-10 bg-white/20 hidden sm:block" />
            <div className="text-center hidden sm:block">
              <div className="text-3xl md:text-4xl font-bold text-emerald-300">100%</div>
              <div className="text-xs md:text-sm text-white/60 mt-1">Transparencia</div>
            </div>
          </div>
        </div>

        {/* Transicao suave */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-50 to-transparent" />
      </section>

      {/* 4 Cards de Acesso Rapido - Flutuante com stagger reveal */}
      <QuickAccessCards />
    </>
  )
}

export default Hero
