/**
 * Parliamentarians Section - Mesa Diretora compacta + Vereadores em scroll horizontal
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, ArrowRight, Crown, Star, Award } from 'lucide-react'

interface Parlamentar {
  id: string
  nome: string
  apelido?: string
  partido?: string
  foto?: string
  cargo?: string
  ativo: boolean
}

const cargoIcon: Record<string, any> = {
  'PRESIDENTE': Crown,
  'VICE_PRESIDENTE': Star,
  'PRIMEIRO_SECRETARIO': Award,
  'SEGUNDO_SECRETARIO': Award,
}

const cargoLabel: Record<string, string> = {
  'PRESIDENTE': 'Presidente',
  'VICE_PRESIDENTE': 'Vice-presidente',
  'PRIMEIRO_SECRETARIO': '1o Secretario',
  'SEGUNDO_SECRETARIO': '2o Secretario',
}

const cargoColor: Record<string, string> = {
  'PRESIDENTE': 'bg-amber-100 text-amber-700',
  'VICE_PRESIDENTE': 'bg-blue-100 text-blue-700',
  'PRIMEIRO_SECRETARIO': 'bg-emerald-100 text-emerald-700',
  'SEGUNDO_SECRETARIO': 'bg-violet-100 text-violet-700',
}

function ParlamentarAvatar({ parlamentar, size = 'md' }: { parlamentar: Parlamentar; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-10 h-10 text-sm', md: 'w-14 h-14 text-base', lg: 'w-20 h-20 text-xl' }
  const initials = (parlamentar.apelido || parlamentar.nome).split(' ').map(n => n[0]).slice(0, 2).join('')

  if (parlamentar.foto) {
    return (
      <img
        src={parlamentar.foto}
        alt={parlamentar.apelido || parlamentar.nome}
        className={`${sizes[size]} rounded-full object-cover ring-2 ring-white shadow-md`}
      />
    )
  }

  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-bold text-white ring-2 ring-white shadow-md`}
      style={{ backgroundColor: 'var(--municipal-primary)' }}
    >
      {initials}
    </div>
  )
}

export function ParliamentariansSection() {
  const [parlamentares, setParlamentares] = useState<Parlamentar[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch('/api/dados-abertos/parlamentares?ativo=true')
        const data = await res.json()
        setParlamentares(data.dados || [])
      } catch {} finally { setLoading(false) }
    }
    fetch_()
  }, [])

  const mesa = parlamentares.filter(p => p.cargo && p.cargo !== 'VEREADOR')
  const vereadores = parlamentares.filter(p => !p.cargo || p.cargo === 'VEREADOR')

  const ordemCargos = ['PRESIDENTE', 'VICE_PRESIDENTE', 'PRIMEIRO_SECRETARIO', 'SEGUNDO_SECRETARIO']
  mesa.sort((a, b) => ordemCargos.indexOf(a.cargo || '') - ordemCargos.indexOf(b.cargo || ''))

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-64 bg-gray-200 rounded-lg" />
            <div className="flex gap-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-16 w-48 bg-gray-100 rounded-xl shrink-0" />)}
            </div>
            <div className="flex gap-4 overflow-hidden">
              {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-40 w-36 bg-gray-100 rounded-xl shrink-0" />)}
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Vereadores</h2>
            <p className="text-gray-500 mt-1">Conheca os representantes do municipio</p>
          </div>
          <Button asChild variant="outline" className="hidden md:flex">
            <Link href="/parlamentares">
              Ver todos <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>

        {/* Mesa Diretora - Compacta em linha horizontal */}
        {mesa.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Mesa Diretora</h3>
            <div className="flex flex-wrap gap-3">
              {mesa.map((p) => {
                const Icon = cargoIcon[p.cargo || ''] || Users
                return (
                  <Link
                    key={p.id}
                    href="/parlamentares"
                    className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all group"
                  >
                    <ParlamentarAvatar parlamentar={p} size="sm" />
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate" title={p.apelido || p.nome}>
                        {p.apelido || p.nome}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge
                          variant="secondary"
                          className={`text-[10px] px-1.5 py-0 ${cargoColor[p.cargo || ''] || 'bg-gray-100 text-gray-600'}`}
                        >
                          <Icon className="h-2.5 w-2.5 mr-0.5" />
                          {cargoLabel[p.cargo || ''] || p.cargo}
                        </Badge>
                        {p.partido && (
                          <span className="text-[10px] text-gray-400">{p.partido}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Vereadores - Scroll horizontal */}
        <div className="relative">
          <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
              {vereadores.map((p) => (
                <Link
                  key={p.id}
                  href="/parlamentares"
                  className="group shrink-0 w-36 md:w-40"
                >
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-300 hover:-translate-y-1 text-center">
                    <div className="flex justify-center mb-3">
                      <ParlamentarAvatar parlamentar={p} size="lg" />
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
              ))}
            </div>
          </div>
          {/* Gradient fade on right edge */}
          <div className="absolute top-0 right-0 bottom-4 w-12 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none" />
        </div>

        {/* Mobile CTA */}
        <div className="mt-6 text-center md:hidden">
          <Button asChild variant="outline">
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
