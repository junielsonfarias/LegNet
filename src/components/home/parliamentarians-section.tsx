/**
 * Parliamentarians Section - Mesa Diretora uniforme + Vereadores em carrossel
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Users, ArrowRight, Crown, Star, Award } from 'lucide-react'
import { slugify, cn } from '@/lib/utils'

interface Parlamentar {
  id: string
  nome: string
  apelido?: string
  partido?: string
  foto?: string
  cargo?: string
  ativo: boolean
}

// Funções inteligentes para resolver cargo (match parcial)
function getCargoKey(cargo: string): string {
  const c = (cargo || '').toUpperCase()
  if (c === 'PRESIDENTE' || (c.includes('PRESIDENTE') && !c.includes('VICE'))) return 'PRESIDENTE'
  if (c.includes('VICE')) return 'VICE_PRESIDENTE'
  if (c.includes('1') && c.includes('SECRET')) return 'PRIMEIRO_SECRETARIO'
  if (c.includes('2') && c.includes('SECRET')) return 'SEGUNDO_SECRETARIO'
  return cargo
}

function getCargoIcon(cargo: string) {
  const k = getCargoKey(cargo)
  if (k === 'PRESIDENTE') return Crown
  if (k === 'VICE_PRESIDENTE') return Star
  return Award
}

function getCargoLabel(cargo: string): string {
  const labels: Record<string, string> = {
    'PRESIDENTE': 'Presidente',
    'VICE_PRESIDENTE': 'Vice-Presidente',
    'PRIMEIRO_SECRETARIO': '1º Secretário',
    'SEGUNDO_SECRETARIO': '2º Secretário',
  }
  return labels[getCargoKey(cargo)] || cargo.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function getCargoStyle(cargo: string) {
  const styles: Record<string, { gradient: string; text: string; ring: string; bg: string }> = {
    'PRESIDENTE': { gradient: 'from-amber-500 to-yellow-600', text: 'text-amber-700', ring: 'ring-amber-400/60', bg: 'bg-amber-50' },
    'VICE_PRESIDENTE': { gradient: 'from-blue-500 to-indigo-600', text: 'text-blue-700', ring: 'ring-blue-400/60', bg: 'bg-blue-50' },
    'PRIMEIRO_SECRETARIO': { gradient: 'from-emerald-500 to-teal-600', text: 'text-emerald-700', ring: 'ring-emerald-400/60', bg: 'bg-emerald-50' },
    'SEGUNDO_SECRETARIO': { gradient: 'from-violet-500 to-purple-600', text: 'text-violet-700', ring: 'ring-violet-400/60', bg: 'bg-violet-50' },
  }
  return styles[getCargoKey(cargo)] || { gradient: 'from-gray-500 to-gray-600', text: 'text-gray-600', ring: 'ring-gray-300', bg: 'bg-gray-50' }
}

function getCargoOrdem(cargo: string): number {
  const ordem: Record<string, number> = { 'PRESIDENTE': 0, 'VICE_PRESIDENTE': 1, 'PRIMEIRO_SECRETARIO': 2, 'SEGUNDO_SECRETARIO': 3 }
  return ordem[getCargoKey(cargo)] ?? 99
}

const defaultStyle = { gradient: 'from-gray-500 to-gray-600', text: 'text-gray-600', ring: 'ring-gray-300', bg: 'bg-gray-50' }

function getPerfilUrl(p: Parlamentar) {
  const slug = slugify(p.apelido || p.nome)
  return `/parlamentares/${slug || p.id}`
}

function Avatar({ parlamentar, className }: { parlamentar: Parlamentar; className?: string }) {
  const initials = (parlamentar.apelido || parlamentar.nome).split(' ').map(n => n[0]).slice(0, 2).join('')

  if (parlamentar.foto) {
    return (
      <Image
        src={parlamentar.foto}
        alt={parlamentar.apelido || parlamentar.nome}
        width={120}
        height={120}
        className={cn('rounded-full object-cover', className)}
      />
    )
  }

  return (
    <div
      className={cn('rounded-full flex items-center justify-center font-bold text-white', className)}
      style={{ backgroundColor: 'var(--municipal-primary)' }}
    >
      {initials}
    </div>
  )
}

function MesaCard({ p }: { p: Parlamentar }) {
  const style = getCargoStyle(p.cargo || '')
  const Icon = getCargoIcon(p.cargo || '')
  const label = getCargoLabel(p.cargo || '')

  return (
    <Link href={getPerfilUrl(p)} className="group block h-full">
      <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-gray-200 transition-all duration-300 hover:-translate-y-1 h-full overflow-hidden">
        {/* Background decorativo sutil */}
        <div className={cn('absolute top-0 left-0 right-0 h-20 sm:h-24 bg-gradient-to-br opacity-10', style.gradient)} />

        <div className="relative p-4 sm:p-5 flex flex-col items-center text-center h-full">
          {/* Avatar */}
          <div className={cn('ring-[3px] ring-offset-2 rounded-full mb-3 group-hover:scale-105 transition-transform duration-300 shadow-md', style.ring)}>
            <Avatar parlamentar={p} className="w-16 h-16 sm:w-20 sm:h-20 text-lg sm:text-xl" />
          </div>

          {/* Nome */}
          <h4 className="font-bold text-gray-900 text-sm sm:text-base leading-tight truncate max-w-full" title={p.apelido || p.nome}>
            {p.apelido || p.nome}
          </h4>

          {/* Badge cargo */}
          <div className={cn('inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full text-xs font-semibold', style.bg, style.text)}>
            <Icon className="h-3 w-3" />
            {label}
          </div>

          {/* Partido */}
          {p.partido && (
            <span className="text-xs text-gray-400 mt-1.5">{p.partido}</span>
          )}

          {/* CTA hover */}
          <div className="mt-auto pt-3 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-gray-500">
            Ver perfil <ArrowRight className="h-3 w-3" />
          </div>
        </div>
      </div>
    </Link>
  )
}

function VereadorCard({ p }: { p: Parlamentar }) {
  return (
    <Link href={getPerfilUrl(p)} className="group shrink-0 w-32 sm:w-36 md:w-40">
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-lg hover:border-gray-300 transition-all duration-300 hover:-translate-y-1 text-center">
        <div className="flex justify-center mb-3">
          <div className="transition-transform duration-300 group-hover:scale-110">
            <Avatar parlamentar={p} className="w-20 h-20 text-xl ring-2 ring-white shadow-md" />
          </div>
        </div>
        <p className="font-semibold text-gray-800 text-sm truncate" title={p.apelido || p.nome}>
          {p.apelido || p.nome}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{p.partido}</p>
        <div className="mt-2 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--municipal-primary)' }}>
          Ver perfil
        </div>
      </div>
    </Link>
  )
}

function MarqueeCarousel({ vereadores }: { vereadores: Parlamentar[] }) {
  const [paused, setPaused] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)
  const items = [...vereadores, ...vereadores]
  const duration = Math.max(vereadores.length * 4, 20)

  return (
    <div
      className="relative overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="absolute top-0 left-0 bottom-0 w-16 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 right-0 bottom-0 w-16 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none" />

      <div
        ref={trackRef}
        className="flex gap-4 py-2"
        style={{
          animation: `marquee-scroll ${duration}s linear infinite`,
          animationPlayState: paused ? 'paused' : 'running',
          width: 'max-content',
        }}
      >
        {items.map((p, i) => (
          <VereadorCard key={`${p.id}-${i}`} p={p} />
        ))}
      </div>

      <style jsx>{`
        @keyframes marquee-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}

export function ParliamentariansSection() {
  const [parlamentares, setParlamentares] = useState<Parlamentar[]>([])
  const [mesaInstitucional, setMesaInstitucional] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // Buscar parlamentares + mesa diretora em paralelo
        const [parlRes, instRes] = await Promise.all([
          fetch('/api/dados-abertos/parlamentares?ativo=true'),
          fetch('/api/institucional')
        ])

        if (parlRes.ok) {
          const parlData = await parlRes.json()
          setParlamentares(parlData.dados || [])
        }

        // Mesa diretora da API institucional (fonte correta: tabela MesaDiretora)
        if (instRes.ok) {
          const instData = await instRes.json()
          const mesaInst = instData?.dados?.mesaDiretora || []
          if (mesaInst.length > 0) {
            setMesaInstitucional(mesaInst)
          }
        }
      } catch (err) {
        console.warn('Erro ao carregar parlamentares:', err)
      } finally { setLoading(false) }
    }
    fetchAll()
  }, [])

  // Mesa diretora: priorizar tabela MesaDiretora, fallback para Parlamentar.cargo
  const mesa = mesaInstitucional.length > 0
    ? mesaInstitucional.map((m: any) => ({
        id: m.id, nome: m.nome, apelido: m.apelido,
        cargo: m.cargo, partido: m.partido, foto: m.foto, ativo: true
      }))
    : parlamentares.filter(p => p.cargo && p.cargo !== 'VEREADOR')

  // Filtrar vereadores removendo quem já está na mesa (evita duplicata)
  const mesaIds = new Set(mesa.map(m => m.id))
  const vereadores = parlamentares.filter(p => (!p.cargo || p.cargo === 'VEREADOR') && !mesaIds.has(p.id))
  const todosParaCarrossel = [...mesa, ...vereadores]

  mesa.sort((a, b) => getCargoOrdem(a.cargo || '') - getCargoOrdem(b.cargo || ''))

  if (loading) {
    return (
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-64 bg-gray-200 rounded-lg" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-52 bg-gray-100 rounded-2xl" />)}
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-12 md:py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div>
            <h2 className="text-xl md:text-3xl font-bold text-gray-900">Vereadores</h2>
            <p className="text-sm md:text-base text-gray-500 mt-1">Conheca os representantes do municipio</p>
          </div>
          <Button asChild variant="outline" className="hidden md:flex">
            <Link href="/parlamentares">
              Ver todos <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>

        {/* Mesa Diretora */}
        {mesa.length > 0 && (
          <div className="mb-10 md:mb-12">
            {/* Título */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-sm">
                <Crown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900">Mesa Diretora</h3>
                <p className="text-[11px] sm:text-xs text-gray-400">Legislatura atual</p>
              </div>
            </div>

            {/* Presidente em destaque + demais em grid */}
            {(() => {
              const presidente = mesa.find(p => getCargoKey(p.cargo || '') === 'PRESIDENTE')
              const demais = mesa.filter(p => p !== presidente)
              return (
                <>
                  {/* Presidente - card horizontal destacado */}
                  {presidente && (
                    <Link href={getPerfilUrl(presidente)} className="group block mb-4">
                      <div className="relative bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 overflow-hidden">
                        <div className="flex items-center gap-4 sm:gap-6 p-4 sm:p-6">
                          <div className="ring-[3px] ring-offset-2 ring-amber-400/60 rounded-full shadow-lg flex-shrink-0">
                            <Avatar parlamentar={presidente} className="w-20 h-20 sm:w-24 sm:h-24 text-2xl" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold mb-1.5', 'bg-amber-100 text-amber-700')}>
                              <Crown className="h-3 w-3" />
                              Presidente
                            </div>
                            <h4 className="font-bold text-gray-900 text-lg sm:text-xl truncate">
                              {presidente.apelido || presidente.nome}
                            </h4>
                            {presidente.partido && (
                              <span className="text-sm text-amber-600 font-medium">{presidente.partido}</span>
                            )}
                          </div>
                          <ArrowRight className="h-5 w-5 text-amber-400 group-hover:translate-x-1 transition-transform flex-shrink-0 hidden sm:block" />
                        </div>
                      </div>
                    </Link>
                  )}

                  {/* Demais membros em grid */}
                  {demais.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                      {demais.map(p => (
                        <div key={p.id}>
                          <MesaCard p={p} />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )
            })()}
          </div>
        )}

        {/* Vereadores - Carrossel */}
        {todosParaCarrossel.length > 0 && (
          <div>
            <h3 className="text-xs sm:text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Todos os Vereadores</h3>
            <MarqueeCarousel vereadores={todosParaCarrossel} />
          </div>
        )}

        {/* Mobile CTA */}
        <div className="mt-6 text-center md:hidden">
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/parlamentares">
              Ver todos os vereadores <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

export default ParliamentariansSection
