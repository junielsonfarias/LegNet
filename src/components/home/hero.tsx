/**
 * Hero Section - Novo Layout Moderno
 * Design limpo com barra de busca, servicos rapidos e sessao ao vivo
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
  Gavel,
  Eye,
  Radio,
  Calendar,
  ArrowRight,
  Scale,
  BookOpen,
  MessageSquare,
  Shield
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
          let start = 0
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

// Servico rapido
const quickServices = [
  { icon: Eye, label: 'Transparencia', href: '/transparencia', color: 'from-emerald-500 to-emerald-600' },
  { icon: Users, label: 'Vereadores', href: '/parlamentares', color: 'from-blue-500 to-blue-600' },
  { icon: FileText, label: 'Proposicoes', href: '/legislativo/proposicoes', color: 'from-violet-500 to-violet-600' },
  { icon: Calendar, label: 'Sessoes', href: '/legislativo/sessoes', color: 'from-amber-500 to-amber-600' },
  { icon: Scale, label: 'Normas', href: '/legislativo/normas', color: 'from-rose-500 to-rose-600' },
  { icon: MessageSquare, label: 'Ouvidoria', href: '/institucional/ouvidoria', color: 'from-cyan-500 to-cyan-600' },
  { icon: BookOpen, label: 'Lei Organica', href: '/institucional/lei-organica', color: 'from-orange-500 to-orange-600' },
  { icon: Shield, label: 'E-SIC', href: '/institucional/e-sic', color: 'from-teal-500 to-teal-600' },
]

export function Hero() {
  const { configuracao } = useConfiguracaoInstitucional()
  const [searchQuery, setSearchQuery] = useState('')
  const [stats, setStats] = useState({ vereadores: 0, sessoes: 0, materias: 0 })
  const [sessaoAoVivo, setSessaoAoVivo] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, sRes, prRes] = await Promise.all([
          fetch('/api/dados-abertos/parlamentares?ativo=true'),
          fetch('/api/dados-abertos/sessoes?limit=1'),
          fetch('/api/dados-abertos/proposicoes?limit=1')
        ])
        const [p, s, pr] = await Promise.all([pRes.json(), sRes.json(), prRes.json()])
        setStats({
          vereadores: p.metadados?.total || p.dados?.length || 0,
          sessoes: s.metadados?.total || s.data?.length || s.pagination?.total || 0,
          materias: pr.metadados?.total || pr.dados?.length || 0,
        })
      } catch {}
    }

    const fetchSessao = async () => {
      try {
        const res = await fetch('/api/sessoes?status=EM_ANDAMENTO&limit=1')
        const data = await res.json()
        if (data.data?.length > 0) setSessaoAoVivo(data.data[0])
      } catch {}
    }

    fetchData()
    fetchSessao()
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
      {/* Sessao ao vivo - Banner fixo */}
      {sessaoAoVivo && (
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white">
          <div className="container mx-auto px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2 font-semibold text-sm">
                <Radio className="h-4 w-4 animate-pulse" />
                AO VIVO
              </span>
              <span className="text-sm text-white/90 hidden sm:inline">
                {sessaoAoVivo.tipo} {sessaoAoVivo.numero}/{new Date(sessaoAoVivo.data).getFullYear()} em andamento
              </span>
            </div>
            <Link
              href={`/legislativo/sessoes/${sessaoAoVivo.id}`}
              className="text-sm font-medium hover:underline flex items-center gap-1"
            >
              Acompanhar <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

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

        <div className="relative z-10 container mx-auto px-4 pt-12 pb-20 md:pt-16 md:pb-28">
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
          <div className="flex items-center justify-center gap-8 md:gap-16 mb-0">
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

      {/* Servicos Rapidos - Barra flutuante */}
      <section className="relative z-20 -mt-8 mb-8">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-4 md:p-6">
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3 md:gap-4">
              {quickServices.map((service) => (
                <Link
                  key={service.href}
                  href={service.href}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-all group"
                >
                  <div className={cn(
                    'w-11 h-11 md:w-12 md:h-12 rounded-xl bg-gradient-to-br flex items-center justify-center',
                    'shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all',
                    service.color
                  )}>
                    <service.icon className="h-5 w-5 md:h-6 md:w-6 text-white" />
                  </div>
                  <span className="text-[11px] md:text-xs font-medium text-gray-600 text-center leading-tight">
                    {service.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default Hero
