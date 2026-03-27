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

// Contador animado reutilizavel
function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const animated = useRef(false)

  useEffect(() => {
    if (!ref.current || animated.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true
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
    gradient: 'from-blue-500 to-blue-700',
    shadowColor: 'shadow-blue-500/25',
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

        {/* Elementos decorativos geometricos */}
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-white/5" />
          <div className="absolute top-20 -left-20 w-72 h-72 rounded-full bg-white/5" />
          <div className="absolute bottom-10 right-1/4 w-48 h-48 rounded-full bg-white/5" />
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

      {/* 4 Cards de Acesso Rapido - Flutuante */}
      <section className="relative z-20 -mt-16 mb-4">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
            {quickAccessCards.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="group"
              >
                <div
                  className={cn(
                    'relative overflow-hidden rounded-2xl bg-gradient-to-br p-6 md:p-8',
                    'shadow-xl hover:shadow-2xl transition-all duration-300',
                    'hover:scale-[1.03] hover:-translate-y-1',
                    card.gradient,
                    card.shadowColor
                  )}
                >
                  {/* Decoracao */}
                  <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/10 -mr-8 -mt-8" aria-hidden="true" />
                  <div className="absolute bottom-0 left-0 w-16 h-16 rounded-full bg-white/5 -ml-4 -mb-4" aria-hidden="true" />

                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4 group-hover:bg-white/30 transition-colors">
                      <card.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-white mb-1">
                      {card.title}
                    </h3>
                    <p className="text-sm text-white/70">
                      {card.subtitle}
                    </p>
                    <div className="mt-4 flex items-center gap-1 text-white/60 group-hover:text-white/90 transition-colors text-sm font-medium">
                      Acessar <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

export default Hero
