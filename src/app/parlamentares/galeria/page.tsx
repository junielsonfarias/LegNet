'use client'

import { useState, useEffect, useMemo, type ComponentType } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Image from 'next/image'
import {
  Users, Loader2, Search, Crown, Star, Award,
  ArrowRight, Calendar, LayoutGrid, List,
  ChevronRight, UserX, type LucideProps
} from 'lucide-react'
import { useConfiguracaoInstitucional } from '@/lib/hooks/use-configuracao-institucional'
import { useParlamentares } from '@/lib/hooks/use-parlamentares'
import type { ParlamentarApi } from '@/lib/api/parlamentares-api'
import Link from 'next/link'
import { slugify, cn } from '@/lib/utils'

interface Legislatura {
  id: string
  numero: number
  anoInicio: number
  anoFim: number
  ativa: boolean
}

const cargoLabels: Record<string, string> = {
  'PRESIDENTE': 'Presidente',
  'VICE_PRESIDENTE': 'Vice-Presidente',
  'PRIMEIRO_SECRETARIO': '1o Secretario',
  'SEGUNDO_SECRETARIO': '2o Secretario',
  'VEREADOR': 'Vereador(a)'
}

type LucideIcon = ComponentType<LucideProps>
const cargoStyle: Record<string, { gradient: string; bg: string; text: string; icon: LucideIcon }> = {
  'PRESIDENTE': { gradient: 'from-amber-500 to-yellow-600', bg: 'bg-amber-50', text: 'text-amber-700', icon: Crown },
  'VICE_PRESIDENTE': { gradient: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50', text: 'text-blue-700', icon: Star },
  'PRIMEIRO_SECRETARIO': { gradient: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: Award },
  'SEGUNDO_SECRETARIO': { gradient: 'from-violet-500 to-purple-600', bg: 'bg-violet-50', text: 'text-violet-700', icon: Award },
}

const ordemCargos = ['PRESIDENTE', 'VICE_PRESIDENTE', 'PRIMEIRO_SECRETARIO', 'SEGUNDO_SECRETARIO', 'VEREADOR']

function getPerfilUrl(p: ParlamentarApi) {
  const slug = slugify(p.apelido || p.nome)
  return `/parlamentares/${slug || p.id}`
}

function getInitials(p: ParlamentarApi) {
  return (p.apelido || p.nome).split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
}

/* ============ Card do Vereador (Grid) ============ */
function VereadorGridCard({ p, inactive }: { p: ParlamentarApi; inactive?: boolean }) {
  const isMesa = p.cargo && p.cargo !== 'VEREADOR'
  const style = cargoStyle[p.cargo] || null
  const Icon = style?.icon || Users

  return (
    <Link href={getPerfilUrl(p)} className="group block h-full">
      <div className={cn(
        'relative bg-white rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 h-full',
        inactive ? 'border-gray-200 opacity-80 hover:opacity-100' : 'border-gray-100 hover:border-gray-200'
      )}>
        {/* Barra de cor no topo */}
        {isMesa && style && (
          <div className={cn('h-1.5 w-full bg-gradient-to-r', style.gradient)} />
        )}

        {/* Foto */}
        <div className={cn(
          'relative aspect-[4/5] overflow-hidden',
          inactive ? 'grayscale-[30%] group-hover:grayscale-0 transition-all' : ''
        )}>
          {p.foto ? (
            <Image
              src={p.foto}
              alt={p.apelido || p.nome}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: inactive
                ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
                : 'linear-gradient(135deg, var(--municipal-primary, #374151) 0%, var(--municipal-secondary, #6b7280) 100%)'
              }}
            >
              <span className="text-3xl sm:text-4xl font-bold text-white/60">{getInitials(p)}</span>
            </div>
          )}
          {/* Overlay hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className="inline-flex items-center gap-1 text-white text-xs font-medium bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full">
              Ver perfil <ArrowRight className="h-3 w-3" />
            </span>
          </div>

          {/* Badge cargo sobre a foto */}
          {isMesa && style && (
            <div className="absolute top-2 right-2">
              <div className={cn('w-7 h-7 rounded-full flex items-center justify-center shadow-md bg-gradient-to-br', style.gradient)}>
                <Icon className="h-3.5 w-3.5 text-white" />
              </div>
            </div>
          )}

          {/* Badge inativo */}
          {inactive && (
            <div className="absolute top-2 left-2">
              <Badge variant="secondary" className="bg-gray-800/70 text-white text-[10px] backdrop-blur-sm">
                Inativo
              </Badge>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3 sm:p-4">
          <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate" title={p.apelido || p.nome}>
            {p.apelido || p.nome}
          </h3>
          {p.apelido && p.apelido !== p.nome && (
            <p className="text-[11px] text-gray-400 truncate">{p.nome}</p>
          )}
          <div className="flex items-center flex-wrap gap-1.5 mt-2">
            {isMesa && style ? (
              <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold', style.bg, style.text)}>
                <Icon className="h-2.5 w-2.5" />
                {cargoLabels[p.cargo]}
              </span>
            ) : (
              <Badge variant="outline" className="text-[11px] px-2 py-0.5">Vereador(a)</Badge>
            )}
            {p.partido && (
              <span className="text-[11px] text-gray-500 font-medium">{p.partido}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

/* ============ Card do Vereador (Lista) ============ */
function VereadorListCard({ p, inactive }: { p: ParlamentarApi; inactive?: boolean }) {
  const isMesa = p.cargo && p.cargo !== 'VEREADOR'
  const style = cargoStyle[p.cargo] || null
  const Icon = style?.icon || Users

  return (
    <Link href={getPerfilUrl(p)} className="group block">
      <div className={cn(
        'bg-white rounded-xl border p-3 sm:p-4 flex items-center gap-3 sm:gap-4 transition-all duration-200 hover:shadow-md',
        inactive ? 'border-gray-200 opacity-80 hover:opacity-100' : 'border-gray-100 hover:border-gray-200'
      )}>
        <div className={cn('shrink-0 relative transition-transform duration-300 group-hover:scale-105', inactive && 'grayscale-[30%] group-hover:grayscale-0')}>
          {p.foto ? (
            <Image
              src={p.foto}
              alt={p.apelido || p.nome}
              width={56}
              height={56}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover ring-2 ring-gray-100 shadow-sm"
            />
          ) : (
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-bold text-white text-sm ring-2 ring-gray-100 shadow-sm"
              style={{ backgroundColor: inactive ? '#6b7280' : 'var(--municipal-primary, #374151)' }}
            >
              {getInitials(p)}
            </div>
          )}
          {isMesa && style && (
            <div className={cn('absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center shadow bg-gradient-to-br', style.gradient)}>
              <Icon className="h-2.5 w-2.5 text-white" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-sm truncate">{p.apelido || p.nome}</h3>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {isMesa && style ? (
              <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold', style.bg, style.text)}>
                {cargoLabels[p.cargo]}
              </span>
            ) : (
              <span className="text-xs text-gray-400">Vereador(a)</span>
            )}
            {p.partido && <span className="text-xs text-gray-500">· {p.partido}</span>}
            {inactive && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Inativo</Badge>}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-camara-primary transition-colors shrink-0" />
      </div>
    </Link>
  )
}

/* ============ Página Principal ============ */
export default function GaleriaParlamentaresPage() {
  const { configuracao } = useConfiguracaoInstitucional()
  const [busca, setBusca] = useState('')
  const [filtroPartido, setFiltroPartido] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [legislaturas, setLegislaturas] = useState<Legislatura[]>([])
  const [selectedLegId, setSelectedLegId] = useState<string>('')

  // Buscar legislaturas
  useEffect(() => {
    const fetchLeg = async () => {
      try {
        const res = await fetch('/api/legislaturas?limit=20')
        const data = await res.json()
        const items: Legislatura[] = data.data || data.dados || []
        items.sort((a, b) => {
          if (a.ativa && !b.ativa) return -1
          if (!a.ativa && b.ativa) return 1
          return b.anoInicio - a.anoInicio
        })
        setLegislaturas(items)
        const ativa = items.find(l => l.ativa)
        if (ativa) setSelectedLegId(ativa.id)
      } catch {}
    }
    fetchLeg()
  }, [])

  const legAtual = legislaturas.find(l => l.ativa)
  const isCurrentLeg = !selectedLegId || selectedLegId === legAtual?.id

  // Para legislatura atual: buscar todos (ativos + inativos) para separar
  // Para legislatura anterior: buscar por mandato
  const { parlamentares, loading } = useParlamentares(
    isCurrentLeg ? {} : { legislaturaId: selectedLegId }
  )

  // Separar ativos e inativos
  const { ativos, inativos } = useMemo(() => {
    const sorted = [...parlamentares].sort((a: ParlamentarApi, b: ParlamentarApi) => {
      const ordemA = ordemCargos.indexOf(a.cargo || 'VEREADOR')
      const ordemB = ordemCargos.indexOf(b.cargo || 'VEREADOR')
      if (ordemA !== ordemB) return ordemA - ordemB
      return (a.apelido || a.nome).localeCompare(b.apelido || b.nome)
    })
    return {
      ativos: sorted.filter((p: ParlamentarApi) => p.ativo),
      inativos: sorted.filter((p: ParlamentarApi) => !p.ativo),
    }
  }, [parlamentares])

  // Partidos
  const partidos = useMemo(() => {
    const set = new Set<string>()
    parlamentares.forEach((p: ParlamentarApi) => { if (p.partido) set.add(p.partido) })
    return Array.from(set).sort()
  }, [parlamentares])

  // Filtrar por busca e partido
  const filterFn = (list: ParlamentarApi[]) => list.filter((p: ParlamentarApi) => {
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

  const ativosFiltrados = filterFn(ativos)
  const inativosFiltrados = filterFn(inativos)

  const selectedLeg = legislaturas.find(l => l.id === selectedLegId)

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
      {/* Hero compacto */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--municipal-primary, #374151) 0%, var(--municipal-secondary, #6b7280) 100%)' }}>
        <div className="absolute inset-0 opacity-10" aria-hidden="true">
          <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-white/20" />
          <div className="absolute bottom-10 right-20 w-60 h-60 rounded-full bg-white/10" />
        </div>
        <div className="container mx-auto px-4 py-10 md:py-14 relative">
          <div className="text-center text-white">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">
              Galeria de Vereadores
            </h1>
            <p className="text-sm md:text-base text-white/70 max-w-xl mx-auto">
              {configuracao?.nomeCasa || 'Camara Municipal'} — Legislatura {selectedLeg?.anoInicio || ''}/{selectedLeg?.anoFim || ''}
            </p>
            <div className="flex justify-center gap-6 sm:gap-8 mt-6 text-white/90">
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold">{ativos.length}</p>
                <p className="text-xs sm:text-sm text-white/60">Ativos</p>
              </div>
              {inativos.length > 0 && (
                <div className="text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-white/50">{inativos.length}</p>
                  <p className="text-xs sm:text-sm text-white/40">Inativos</p>
                </div>
              )}
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold">{partidos.length}</p>
                <p className="text-xs sm:text-sm text-white/60">Partidos</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de filtros sticky */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col gap-2.5">
            {/* Linha 1: Legislatura */}
            {legislaturas.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
                <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
                {legislaturas.map(leg => (
                  <button
                    key={leg.id}
                    onClick={() => { setSelectedLegId(leg.id); setFiltroPartido(null) }}
                    className={cn(
                      'shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all border whitespace-nowrap',
                      selectedLegId === leg.id
                        ? 'bg-camara-primary text-white border-camara-primary'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    )}
                  >
                    {leg.anoInicio}/{leg.anoFim}
                    {leg.ativa && <span className={cn('ml-1 text-[10px] font-bold', selectedLegId === leg.id ? 'text-white/80' : 'text-emerald-600')}>ATUAL</span>}
                  </button>
                ))}
              </div>
            )}

            {/* Linha 2: Busca + Partidos + View mode */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[160px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome ou partido..."
                  className="pl-9 h-9 rounded-lg text-sm"
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                <button
                  onClick={() => setFiltroPartido(null)}
                  className={cn(
                    'shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
                    !filtroPartido ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  Todos
                </button>
                {partidos.map(partido => (
                  <button
                    key={partido}
                    onClick={() => setFiltroPartido(filtroPartido === partido ? null : partido)}
                    className={cn(
                      'shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
                      filtroPartido === partido ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {partido}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 ml-auto shrink-0">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn('p-1.5 rounded-lg transition-colors', viewMode === 'grid' ? 'bg-gray-200 text-gray-900' : 'text-gray-400 hover:text-gray-600')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn('p-1.5 rounded-lg transition-colors', viewMode === 'list' ? 'bg-gray-200 text-gray-900' : 'text-gray-400 hover:text-gray-600')}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Banner legislatura anterior */}
      {!isCurrentLeg && selectedLeg && (
        <div className="container mx-auto px-4 mt-4">
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-sm text-amber-800">
            <Calendar className="h-4 w-4 shrink-0" />
            <span>Legislatura <strong>{selectedLeg.anoInicio}/{selectedLeg.anoFim}</strong></span>
            <button
              onClick={() => legAtual && setSelectedLegId(legAtual.id)}
              className="ml-auto text-xs font-semibold text-amber-700 hover:text-amber-900 underline shrink-0"
            >
              Voltar para atual
            </button>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-6 md:py-8">
        {ativosFiltrados.length === 0 && inativosFiltrados.length === 0 ? (
          <div className="text-center py-16">
            <Users className="h-14 w-14 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-500 mb-2">Nenhum vereador encontrado</h3>
            <p className="text-sm text-gray-400 mb-4">Tente ajustar os filtros de busca</p>
            {(busca || filtroPartido) && (
              <Button variant="outline" size="sm" onClick={() => { setBusca(''); setFiltroPartido(null) }}>
                Limpar filtros
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Vereadores Ativos */}
            {ativosFiltrados.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-6 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-600" />
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">
                    Vereadores Ativos
                  </h2>
                  <span className="text-xs text-gray-400 font-medium">({ativosFiltrados.length})</span>
                </div>

                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                    {ativosFiltrados.map((p: ParlamentarApi) => (
                      <VereadorGridCard key={p.id} p={p} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {ativosFiltrados.map((p: ParlamentarApi) => (
                      <VereadorListCard key={p.id} p={p} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Vereadores Inativos */}
            {inativosFiltrados.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-6 rounded-full bg-gradient-to-b from-gray-300 to-gray-400" />
                  <UserX className="h-4 w-4 text-gray-400" />
                  <h2 className="text-base sm:text-lg font-bold text-gray-500">
                    Inativos
                  </h2>
                  <span className="text-xs text-gray-400 font-medium">({inativosFiltrados.length})</span>
                </div>

                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                    {inativosFiltrados.map((p: ParlamentarApi) => (
                      <VereadorGridCard key={p.id} p={p} inactive />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {inativosFiltrados.map((p: ParlamentarApi) => (
                      <VereadorListCard key={p.id} p={p} inactive />
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
