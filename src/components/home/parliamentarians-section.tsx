/**
 * Parliamentarians Section - Layout moderno com cards compactos
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  'PRESIDENTE': 'from-amber-500 to-amber-600',
  'VICE_PRESIDENTE': 'from-blue-500 to-blue-600',
  'PRIMEIRO_SECRETARIO': 'from-emerald-500 to-emerald-600',
  'SEGUNDO_SECRETARIO': 'from-violet-500 to-violet-600',
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
      <section className="py-14 bg-white">
        <div className="container mx-auto px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-64 bg-gray-200 rounded-lg" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-100 rounded-xl" />)}
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-14 bg-white">
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

        {/* Mesa Diretora */}
        {mesa.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Mesa Diretora</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {mesa.map((p) => {
                const Icon = cargoIcon[p.cargo || ''] || Users
                return (
                  <Link
                    key={p.id}
                    href={`/parlamentares`}
                    className="group"
                  >
                    <Card className="border-0 shadow-md hover:shadow-lg transition-all overflow-hidden group-hover:-translate-y-0.5">
                      <div className={`h-1 bg-gradient-to-r ${cargoColor[p.cargo || ''] || 'from-gray-400 to-gray-500'}`} />
                      <CardContent className="p-4 flex items-center gap-3">
                        <ParlamentarAvatar parlamentar={p} size="md" />
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">
                            {p.apelido || p.nome}
                          </p>
                          <p className="text-xs text-gray-500">{p.partido}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Icon className="h-3 w-3 text-gray-400" />
                            <span className="text-[10px] font-medium text-gray-400 uppercase">
                              {cargoLabel[p.cargo || ''] || p.cargo}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Vereadores */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {vereadores.map((p) => (
            <Link key={p.id} href={`/parlamentares`} className="group">
              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <ParlamentarAvatar parlamentar={p} size="sm" />
                <div className="min-w-0">
                  <p className="font-medium text-gray-800 text-sm truncate">{p.apelido || p.nome}</p>
                  <p className="text-xs text-gray-400">{p.partido}</p>
                </div>
              </div>
            </Link>
          ))}
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
