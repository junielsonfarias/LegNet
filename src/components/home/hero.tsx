/**
 * Hero Section - Secao Principal da Home
 * Design moderno com background dinamico e CTAs
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Users,
  FileText,
  Gavel,
  Eye,
  ArrowRight,
  Calendar,
  Play,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useConfiguracaoInstitucional } from '@/lib/hooks/use-configuracao-institucional'

// =============================================================================
// CONTADOR ANIMADO
// =============================================================================

interface AnimatedCounterProps {
  end: number
  duration?: number
  suffix?: string
  className?: string
}

function AnimatedCounter({ end, duration = 2000, suffix = '', className }: AnimatedCounterProps) {
  const [count, setCount] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Intersection Observer para animar quando visivel
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    const element = document.getElementById(`counter-${end}`)
    if (element) observer.observe(element)

    return () => observer.disconnect()
  }, [end])

  useEffect(() => {
    if (!isVisible) return

    let startTime: number
    const startValue = 0

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)

      // Easing function para animacao suave
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      setCount(Math.floor(easeOutQuart * (end - startValue) + startValue))

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [isVisible, end, duration])

  return (
    <span id={`counter-${end}`} className={className}>
      {count}{suffix}
    </span>
  )
}

// =============================================================================
// STATS CARDS
// =============================================================================

interface StatCardProps {
  icon: typeof Users
  value: number
  label: string
  suffix?: string
  delay?: number
}

function StatCard({ icon: Icon, value, label, suffix = '', delay = 0 }: StatCardProps) {
  return (
    <Card
      className={cn(
        'bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 transition-all duration-300',
        'transform hover:scale-105 hover:-translate-y-1'
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardContent className="p-6 text-center">
        <Icon className="h-8 w-8 text-blue-200 mx-auto mb-2" aria-hidden="true" />
        <div className="text-2xl md:text-3xl font-bold text-white">
          <AnimatedCounter end={value} suffix={suffix} />
        </div>
        <div className="text-sm text-blue-100">{label}</div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// HERO COMPONENT
// =============================================================================

interface HeroProps {
  className?: string
}

export function Hero({ className }: HeroProps) {
  const { configuracao } = useConfiguracaoInstitucional()
  const [stats, setStats] = useState({
    vereadores: 11,
    sessoes: 27,
    materias: 294,
    transparencia: 100
  })
  const [loading, setLoading] = useState(true)

  // Buscar estatisticas da API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [parlamentaresRes, sessoesRes, proposicoesRes] = await Promise.all([
          fetch('/api/dados-abertos/parlamentares?ativo=true'),
          fetch('/api/dados-abertos/sessoes?limit=1'),
          fetch('/api/dados-abertos/proposicoes?limit=1')
        ])

        const [parlamentares, sessoes, proposicoes] = await Promise.all([
          parlamentaresRes.json(),
          sessoesRes.json(),
          proposicoesRes.json()
        ])

        setStats({
          vereadores: parlamentares.metadados?.total || parlamentares.dados?.length || 11,
          sessoes: sessoes.metadados?.total || 27,
          materias: proposicoes.metadados?.total || 294,
          transparencia: 100
        })
      } catch (error) {
        console.error('Erro ao buscar estatisticas:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const nomeCasa = configuracao.nomeCasa || 'Câmara Municipal'

  return (
    <section
      className={cn(
        'relative overflow-hidden',
        'bg-gradient-to-br from-camara-primary via-blue-700 to-blue-900',
        'text-white py-16 md:py-24',
        className
      )}
      aria-label="Secao principal"
    >
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
        aria-hidden="true"
      />

      {/* Gradient Overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-blue-900/50 to-transparent"
        aria-hidden="true"
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Conteudo principal */}
          <div className="space-y-6 animate-fade-in">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span>Legislatura 2025/2028</span>
            </div>

            {/* Titulo */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              {nomeCasa}
            </h1>

            {/* Subtitulo */}
            <p className="text-xl text-blue-100 leading-relaxed max-w-xl">
              Portal Institucional dedicado a transparencia, democracia e cidadania.
              Acompanhe as atividades legislativas e participe da construcao de uma cidade melhor.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                asChild
                size="lg"
                className="bg-white text-camara-primary hover:bg-gray-100 font-semibold shadow-lg hover:shadow-xl transition-all min-h-touch"
              >
                <Link href="/parlamentares">
                  <Users className="h-5 w-5 mr-2" aria-hidden="true" />
                  Conheca os Vereadores
                  <ChevronRight className="h-4 w-4 ml-2" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-2 border-white text-white hover:bg-white hover:text-camara-primary font-semibold transition-all min-h-touch"
              >
                <Link href="/transparencia">
                  <Eye className="h-5 w-5 mr-2" aria-hidden="true" />
                  Portal da Transparencia
                </Link>
              </Button>
            </div>

            {/* Quick Links */}
            <div className="flex flex-wrap gap-3 pt-4">
              <Link
                href="/legislativo/sessoes"
                className="flex items-center gap-1 text-sm text-blue-200 hover:text-white transition-colors"
              >
                <Calendar className="h-4 w-4" aria-hidden="true" />
                Proximas Sessoes
              </Link>
              <span className="text-blue-300/50" aria-hidden="true">|</span>
              <Link
                href="/transmissao"
                className="flex items-center gap-1 text-sm text-blue-200 hover:text-white transition-colors"
              >
                <Play className="h-4 w-4" aria-hidden="true" />
                Assistir ao Vivo
              </Link>
              <span className="text-blue-300/50" aria-hidden="true">|</span>
              <Link
                href="/legislativo/proposicoes"
                className="flex items-center gap-1 text-sm text-blue-200 hover:text-white transition-colors"
              >
                <FileText className="h-4 w-4" aria-hidden="true" />
                Projetos de Lei
              </Link>
            </div>
          </div>

          {/* Cards de estatisticas */}
          <div className="grid grid-cols-2 gap-4 lg:gap-6">
            <StatCard
              icon={Users}
              value={stats.vereadores}
              label="Vereadores"
              delay={0}
            />
            <StatCard
              icon={FileText}
              value={stats.sessoes}
              label="Sessoes"
              delay={100}
            />
            <StatCard
              icon={Gavel}
              value={stats.materias}
              label="Materias"
              delay={200}
            />
            <StatCard
              icon={Eye}
              value={stats.transparencia}
              label="Transparencia"
              suffix="%"
              delay={300}
            />
          </div>
        </div>
      </div>

      {/* Wave Divider */}
      <div className="absolute bottom-0 left-0 right-0" aria-hidden="true">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto"
          preserveAspectRatio="none"
        >
          <path
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            fill="rgb(249 250 251)"
          />
        </svg>
      </div>
    </section>
  )
}

export default Hero
