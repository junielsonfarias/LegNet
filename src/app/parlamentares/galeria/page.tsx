'use client'

import { useState, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Users, Loader2, Search, Crown, Star, Award,
  ArrowRight, Mail, Phone, Filter, LayoutGrid, List,
  ChevronRight
} from 'lucide-react'
import { useConfiguracaoInstitucional } from '@/lib/hooks/use-configuracao-institucional'
import { useParlamentares } from '@/lib/hooks/use-parlamentares'
import Link from 'next/link'
import { slugify } from '@/lib/utils'

const cargoLabels: Record<string, string> = {
  'PRESIDENTE': 'Presidente',
  'VICE_PRESIDENTE': 'Vice-Presidente',
  'PRIMEIRO_SECRETARIO': '1o Secretario',
  'SEGUNDO_SECRETARIO': '2o Secretario',
  'VEREADOR': 'Vereador(a)'
}

const cargoColors: Record<string, { bg: string; text: string; border: string }> = {
  'PRESIDENTE': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'VICE_PRESIDENTE': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'PRIMEIRO_SECRETARIO': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'SEGUNDO_SECRETARIO': { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  'VEREADOR': { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' },
}

const cargoIcons: Record<string, any> = {
  'PRESIDENTE': Crown,
  'VICE_PRESIDENTE': Star,
  'PRIMEIRO_SECRETARIO': Award,
  'SEGUNDO_SECRETARIO': Award,
}

const ordemCargos = ['PRESIDENTE', 'VICE_PRESIDENTE', 'PRIMEIRO_SECRETARIO', 'SEGUNDO_SECRETARIO', 'VEREADOR']

function getPerfilUrl(p: any) {
  const slug = slugify(p.apelido || p.nome)
  return `/parlamentares/${slug || p.id}`
}

function Avatar({ parlamentar, size = 'lg' }: { parlamentar: any; size?: 'md' | 'lg' | 'xl' }) {
  const sizes = {
    md: 'w-16 h-16 text-lg',
    lg: 'w-28 h-28 text-2xl',
    xl: 'w-36 h-36 text-3xl',
  }
  const initials = (parlamentar.apelido || parlamentar.nome)
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  if (parlamentar.foto) {
    return (
      <img
        src={parlamentar.foto}
        alt={parlamentar.apelido || parlamentar.nome}
        className={`${sizes[size]} rounded-full object-cover ring-4 ring-white shadow-lg`}
      />
    )
  }

  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-bold text-white ring-4 ring-white shadow-lg`}
      style={{ backgroundColor: 'var(--municipal-primary, #1e40af)' }}
    >
      {initials}
    </div>
  )
}

export default function GaleriaParlamentaresPage() {
  const { configuracao } = useConfiguracaoInstitucional()
  const { parlamentares, loading } = useParlamentares({ ativo: true })
  const [busca, setBusca] = useState('')
  const [filtroPartido, setFiltroPartido] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Ordenar: mesa diretora primeiro, depois vereadores por nome
  const parlamentaresOrdenados = useMemo(() => {
    return [...parlamentares].sort((a: any, b: any) => {
      const ordemA = ordemCargos.indexOf(a.cargo || 'VEREADOR')
      const ordemB = ordemCargos.indexOf(b.cargo || 'VEREADOR')
      if (ordemA !== ordemB) return ordemA - ordemB
      return (a.apelido || a.nome).localeCompare(b.apelido || b.nome)
    })
  }, [parlamentares])

  // Partidos unicos
  const partidos = useMemo(() => {
    const set = new Set<string>()
    parlamentares.forEach((p: any) => { if (p.partido) set.add(p.partido) })
    return Array.from(set).sort()
  }, [parlamentares])

  // Filtrar
  const filtrados = useMemo(() => {
    return parlamentaresOrdenados.filter((p: any) => {
      if (busca) {
        const termo = busca.toLowerCase()
        const match = (p.apelido || '').toLowerCase().includes(termo) ||
          p.nome.toLowerCase().includes(termo) ||
          (p.partido || '').toLowerCase().includes(termo)
        if (!match) return false
      }
      if (filtroPartido && p.partido !== filtroPartido) return false
      return true
    })
  }, [parlamentaresOrdenados, busca, filtroPartido])

  const mesa = filtrados.filter((p: any) => p.cargo && p.cargo !== 'VEREADOR')
  const vereadores = filtrados.filter((p: any) => !p.cargo || p.cargo === 'VEREADOR')

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-camara-primary mx-auto mb-3" />
          <p className="text-gray-500">Carregando vereadores...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--municipal-primary, #1e40af) 0%, var(--municipal-secondary, #1e3a5f) 100%)' }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-white/20" />
          <div className="absolute bottom-10 right-20 w-60 h-60 rounded-full bg-white/10" />
          <div className="absolute top-1/2 left-1/3 w-32 h-32 rounded-full bg-white/15" />
        </div>
        <div className="container mx-auto px-4 py-16 relative">
          <div className="text-center text-white">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full text-sm mb-6 backdrop-blur-sm">
              <Users className="h-4 w-4" />
              <span>Legislatura {new Date().getFullYear()}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Nossos Vereadores
            </h1>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              Conheca os representantes que trabalham pelo municipio na{' '}
              {configuracao?.nomeCasa || 'Camara Municipal'}
            </p>
            <div className="flex justify-center gap-8 mt-8 text-white/90">
              <div className="text-center">
                <p className="text-3xl font-bold">{parlamentares.length}</p>
                <p className="text-sm text-white/70">Vereadores</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">{partidos.length}</p>
                <p className="text-sm text-white/70">Partidos</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">{mesa.length + (filtroPartido || busca ? 0 : parlamentaresOrdenados.filter((p: any) => p.cargo && p.cargo !== 'VEREADOR').length - mesa.length)}</p>
                <p className="text-sm text-white/70">Mesa Diretora</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de filtros */}
      <div className="sticky top-0 z-20 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome ou partido..."
                className="pl-9 h-9"
                value={busca}
                onChange={e => setBusca(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant={filtroPartido === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroPartido(null)}
              >
                Todos
              </Button>
              {partidos.map(partido => (
                <Button
                  key={partido}
                  variant={filtroPartido === partido ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFiltroPartido(filtroPartido === partido ? null : partido)}
                >
                  {partido}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-1 ml-auto">
              <Button
                variant="ghost"
                size="sm"
                className={viewMode === 'grid' ? 'bg-gray-100' : ''}
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={viewMode === 'list' ? 'bg-gray-100' : ''}
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {filtrados.length === 0 ? (
          <div className="text-center py-20">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-500 mb-2">
              Nenhum vereador encontrado
            </h3>
            <p className="text-gray-400 mb-4">
              Tente ajustar os filtros de busca
            </p>
            {(busca || filtroPartido) && (
              <Button variant="outline" onClick={() => { setBusca(''); setFiltroPartido(null) }}>
                Limpar filtros
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Mesa Diretora */}
            {mesa.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Crown className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Mesa Diretora</h2>
                    <p className="text-sm text-gray-500">Membros da mesa diretora da legislatura atual</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                  {mesa.map((p: any) => {
                    const colors = cargoColors[p.cargo] || cargoColors['VEREADOR']
                    const Icon = cargoIcons[p.cargo] || Users
                    return (
                      <Link key={p.id} href={getPerfilUrl(p)} className="group">
                        <div className={`relative rounded-2xl border-2 ${colors.border} ${colors.bg} p-6 text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}>
                          <div className="absolute top-3 right-3">
                            <div className={`w-8 h-8 rounded-full ${colors.bg} flex items-center justify-center`}>
                              <Icon className={`h-4 w-4 ${colors.text}`} />
                            </div>
                          </div>
                          <div className="flex justify-center mb-4">
                            <div className="transition-transform duration-300 group-hover:scale-110">
                              <Avatar parlamentar={p} size="lg" />
                            </div>
                          </div>
                          <h3 className="font-bold text-gray-900 text-lg mb-1">
                            {p.apelido || p.nome}
                          </h3>
                          {p.apelido && p.apelido !== p.nome && (
                            <p className="text-xs text-gray-500 mb-2">{p.nome}</p>
                          )}
                          <Badge className={`${colors.bg} ${colors.text} border ${colors.border}`}>
                            {cargoLabels[p.cargo] || p.cargo}
                          </Badge>
                          {p.partido && (
                            <p className="text-sm text-gray-500 mt-2 font-medium">{p.partido}</p>
                          )}
                          <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-xs font-medium flex items-center justify-center gap-1" style={{ color: 'var(--municipal-primary, #1e40af)' }}>
                              Ver perfil completo <ChevronRight className="h-3 w-3" />
                            </span>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Vereadores */}
            {vereadores.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Vereadores</h2>
                    <p className="text-sm text-gray-500">{vereadores.length} vereador(es)</p>
                  </div>
                </div>

                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                    {vereadores.map((p: any) => (
                      <Link key={p.id} href={getPerfilUrl(p)} className="group">
                        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-gray-300">
                          {/* Foto area */}
                          <div className="relative aspect-[4/5] bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                            {p.foto ? (
                              <img
                                src={p.foto}
                                alt={p.apelido || p.nome}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--municipal-primary, #1e40af) 0%, var(--municipal-secondary, #1e3a5f) 100%)' }}>
                                <span className="text-4xl font-bold text-white/80">
                                  {(p.apelido || p.nome).split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
                                </span>
                              </div>
                            )}
                            {/* Overlay com gradiente */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <span className="inline-flex items-center gap-1 text-white text-xs font-medium bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full">
                                Ver perfil <ArrowRight className="h-3 w-3" />
                              </span>
                            </div>
                          </div>
                          {/* Info */}
                          <div className="p-4">
                            <h3 className="font-bold text-gray-900 truncate">
                              {p.apelido || p.nome}
                            </h3>
                            {p.apelido && p.apelido !== p.nome && (
                              <p className="text-xs text-gray-400 truncate">{p.nome}</p>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              {p.partido ? (
                                <Badge variant="outline" className="text-xs">
                                  {p.partido}
                                </Badge>
                              ) : (
                                <span />
                              )}
                              <Badge className="bg-gray-100 text-gray-600 text-xs">
                                Vereador(a)
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  /* Vista em lista */
                  <div className="space-y-3">
                    {vereadores.map((p: any) => (
                      <Link key={p.id} href={getPerfilUrl(p)} className="group block">
                        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 transition-all duration-200 hover:shadow-md hover:border-gray-300">
                          <div className="shrink-0 transition-transform duration-300 group-hover:scale-110">
                            <Avatar parlamentar={p} size="md" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 truncate">
                              {p.apelido || p.nome}
                            </h3>
                            {p.apelido && p.apelido !== p.nome && (
                              <p className="text-sm text-gray-500 truncate">{p.nome}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              {p.partido && (
                                <Badge variant="outline" className="text-xs">{p.partido}</Badge>
                              )}
                              <Badge className="bg-gray-100 text-gray-600 text-xs">Vereador(a)</Badge>
                            </div>
                          </div>
                          <div className="hidden sm:flex items-center gap-4 text-sm text-gray-400 shrink-0">
                            {p.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="h-4 w-4" />
                                <span className="hidden lg:inline truncate max-w-[200px]">{p.email}</span>
                              </div>
                            )}
                            {p.telefone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-4 w-4" />
                                <span className="hidden lg:inline">{p.telefone}</span>
                              </div>
                            )}
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-camara-primary transition-colors shrink-0" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
