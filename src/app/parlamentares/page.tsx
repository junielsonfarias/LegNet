'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Users,
  Search,
  User,
  Crown,
  Shield,
  FileText,
  Building,
  BarChart3,
  ArrowRight,
  Calendar,
  ChevronDown,
} from 'lucide-react'
import { useParlamentares } from '@/lib/hooks/use-parlamentares'
import { ParlamentaresListSkeleton } from '@/components/skeletons/parlamentar-skeleton'
import { useConfiguracaoInstitucional } from '@/lib/hooks/use-configuracao-institucional'
import { slugify, cn } from '@/lib/utils'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { useBreadcrumbs } from '@/lib/hooks/use-breadcrumbs'

interface Legislatura {
  id: string
  numero: number
  anoInicio: number
  anoFim: number
  ativa: boolean
}

// Configuracao de cargos usando cores municipais com variacao de opacidade
const cargoConfig: Record<string, { label: string; opacity: number; icon: any }> = {
  'PRESIDENTE': { label: 'Presidente', opacity: 1.0, icon: Crown },
  'VICE_PRESIDENTE': { label: 'Vice-presidente', opacity: 0.85, icon: Shield },
  'PRIMEIRO_SECRETARIO': { label: '1o Secretario', opacity: 0.7, icon: FileText },
  'SEGUNDO_SECRETARIO': { label: '2o Secretario', opacity: 0.6, icon: FileText },
  'VEREADOR': { label: 'Vereador(a)', opacity: 0.4, icon: User },
}

const defaultCargo = { label: 'Vereador(a)', opacity: 0.4, icon: User }

function ParlamentarCard({ parlamentar }: { parlamentar: any }) {
  const config = cargoConfig[parlamentar.cargo] || defaultCargo
  const Icon = config.icon
  const slug = slugify(parlamentar.apelido || parlamentar.nome) || parlamentar.id
  const initials = (parlamentar.apelido || parlamentar.nome).split(' ').map((n: string) => n[0]).slice(0, 2).join('')

  return (
    <Link href={`/parlamentares/${slug}`} className="group block h-full">
      <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-gray-200 transition-all duration-300 hover:-translate-y-1 h-full overflow-hidden">
        {/* Barra de cor no topo */}
        <div className="h-1.5 w-full" style={{ background: `linear-gradient(to right, var(--municipal-primary), var(--municipal-primary-dark))`, opacity: config.opacity }} />

        {/* Background decorativo */}
        <div className="absolute top-0 left-0 right-0 h-24" style={{ background: `linear-gradient(to bottom right, var(--municipal-primary), var(--municipal-primary-dark))`, opacity: 0.07 * config.opacity }} />

        <div className="relative p-4 sm:p-5 flex flex-col items-center text-center h-[calc(100%-6px)]">
          {/* Avatar */}
          <div className="relative mb-3 group-hover:scale-105 transition-transform duration-300">
            {parlamentar.foto ? (
              <Image
                src={parlamentar.foto}
                alt={parlamentar.apelido || parlamentar.nome}
                width={88}
                height={88}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover ring-[3px] ring-offset-2 ring-gray-200 group-hover:ring-[var(--municipal-primary-light)] transition-all shadow-md"
              />
            ) : (
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center font-bold text-white text-lg sm:text-xl ring-[3px] ring-offset-2 ring-gray-200 shadow-md"
                style={{ backgroundColor: 'var(--municipal-primary)' }}
              >
                {initials}
              </div>
            )}
            {/* Badge icone do cargo */}
            {parlamentar.cargo !== 'VEREADOR' && (
              <div
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center shadow-md"
                style={{ background: `linear-gradient(to bottom right, var(--municipal-primary), var(--municipal-primary-dark))` }}
              >
                <Icon className="h-3.5 w-3.5 text-white" />
              </div>
            )}
          </div>

          {/* Nome */}
          <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-tight truncate max-w-full" title={parlamentar.nome}>
            {parlamentar.apelido || parlamentar.nome}
          </h3>

          {/* Nome completo se tem apelido */}
          {parlamentar.apelido && parlamentar.nome !== parlamentar.apelido && (
            <p className="text-[11px] text-gray-400 truncate max-w-full mt-0.5" title={parlamentar.nome}>
              {parlamentar.nome}
            </p>
          )}

          {/* Cargo badge */}
          <div
            className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ backgroundColor: 'var(--municipal-primary-lighter)', color: 'var(--municipal-primary-dark)' }}
          >
            <Icon className="h-3 w-3" />
            {config.label}
          </div>

          {/* Partido */}
          {parlamentar.partido && (
            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
              <Building className="h-3 w-3" />
              {parlamentar.partido}
            </div>
          )}

          {/* Spacer + CTA */}
          <div className="mt-auto pt-3 w-full">
            <div className="flex items-center justify-center gap-1 text-xs font-medium text-gray-400 group-hover:text-camara-primary transition-colors">
              Ver perfil <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function ParlamentaresPage() {
  const breadcrumbs = useBreadcrumbs()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'todos' | 'mesa' | 'vereadores'>('todos')
  const [legislaturas, setLegislaturas] = useState<Legislatura[]>([])
  const [selectedLegislaturaId, setSelectedLegislaturaId] = useState<string>('')

  // Buscar legislaturas disponíveis
  useEffect(() => {
    const fetchLegislaturas = async () => {
      try {
        const res = await fetch('/api/legislaturas?limit=20')
        const data = await res.json()
        const items: Legislatura[] = data.data || data.dados || []
        // Ordenar: ativa primeiro, depois por ano decrescente
        items.sort((a, b) => {
          if (a.ativa && !b.ativa) return -1
          if (!a.ativa && b.ativa) return 1
          return b.anoInicio - a.anoInicio
        })
        setLegislaturas(items)
        // Selecionar a legislatura ativa por padrão
        const ativa = items.find(l => l.ativa)
        if (ativa) setSelectedLegislaturaId(ativa.id)
      } catch {}
    }
    fetchLegislaturas()
  }, [])

  // Filtrar parlamentares pela legislatura selecionada
  // Para legislatura atual ou sem seleção: busca ativos (garante resultado mesmo sem mandatos)
  // Para legislaturas anteriores: filtra por mandato vinculado
  const isCurrentLeg = !selectedLegislaturaId || selectedLegislaturaId === legislaturas.find(l => l.ativa)?.id
  const filters = useMemo(() => {
    if (!selectedLegislaturaId || isCurrentLeg) {
      return { ativo: true }
    }
    return { legislaturaId: selectedLegislaturaId }
  }, [selectedLegislaturaId, isCurrentLeg])

  const { parlamentares, loading } = useParlamentares(filters)
  const { configuracao } = useConfiguracaoInstitucional()
  const nomeCasa = configuracao.nomeCasa || 'Câmara Municipal'

  const legislaturaAtual = legislaturas.find(l => l.ativa)
  const isLegislaturaAtual = selectedLegislaturaId === legislaturaAtual?.id

  const mesaDiretora = useMemo(() => {
    const ordemCargos = ['PRESIDENTE', 'VICE_PRESIDENTE', 'PRIMEIRO_SECRETARIO', 'SEGUNDO_SECRETARIO']
    return parlamentares
      .filter(p => p.cargo !== 'VEREADOR')
      .sort((a, b) => ordemCargos.indexOf(a.cargo || '') - ordemCargos.indexOf(b.cargo || ''))
  }, [parlamentares])

  const vereadores = useMemo(() => {
    return parlamentares.filter(p => p.cargo === 'VEREADOR')
  }, [parlamentares])

  const todosParlamentares = useMemo(() => {
    return [...mesaDiretora, ...vereadores]
  }, [mesaDiretora, vereadores])

  const getActiveData = () => {
    switch (activeTab) {
      case 'mesa': return mesaDiretora
      case 'vereadores': return vereadores
      default: return todosParlamentares
    }
  }

  const filteredData = getActiveData().filter(p =>
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.apelido && p.apelido.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.partido && p.partido.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <ParlamentaresListSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Breadcrumbs */}
        <div className="mb-6">
          <Breadcrumb items={breadcrumbs} />
        </div>

        {/* Header */}
        <div className="text-center mb-8 md:mb-10">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2 sm:gap-3">
            <Users className="h-7 w-7 sm:h-9 sm:w-9 text-camara-primary" />
            Parlamentares
          </h1>
          <p className="text-sm md:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto">
            Conheca os vereadores e a Mesa Diretora da {nomeCasa}
          </p>
        </div>

        {/* Stats compactos */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          {[
            { value: todosParlamentares.length, label: 'Total' },
            { value: mesaDiretora.length, label: 'Mesa Diretora' },
            { value: vereadores.length, label: 'Vereadores' },
            { value: new Set(todosParlamentares.map(p => p.partido).filter(Boolean)).size, label: 'Partidos' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-3 sm:p-4 text-center shadow-sm">
              <div className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--municipal-primary)' }}>{stat.value}</div>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Filtro de Legislatura */}
        {legislaturas.length > 1 && (
          <div className="mb-4 md:mb-6">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 shrink-0">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Legislatura:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {legislaturas.map((leg) => (
                  <button
                    key={leg.id}
                    onClick={() => setSelectedLegislaturaId(leg.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all border',
                      selectedLegislaturaId === leg.id
                        ? 'bg-camara-primary text-white border-camara-primary shadow-sm'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    )}
                  >
                    {leg.anoInicio}/{leg.anoFim}
                    {leg.ativa && (
                      <span className={cn(
                        'ml-1.5 text-[10px] font-bold',
                        selectedLegislaturaId === leg.id ? 'text-white/80' : 'text-emerald-600'
                      )}>
                        ATUAL
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Filtros: Abas + Busca */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6 md:mb-8">
          {/* Abas */}
          <div className="flex gap-1.5 bg-gray-100 rounded-xl p-1 flex-shrink-0">
            {[
              { key: 'todos' as const, label: 'Todos', icon: Users, count: todosParlamentares.length },
              { key: 'mesa' as const, label: 'Mesa', icon: Crown, count: mesaDiretora.length },
              { key: 'vereadores' as const, label: 'Vereadores', icon: User, count: vereadores.length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all',
                  activeTab === tab.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="text-[10px] sm:text-xs opacity-60">({tab.count})</span>
              </button>
            ))}
          </div>

          {/* Busca */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por nome ou partido..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-gray-200 rounded-xl"
            />
          </div>

          {/* Link comparativo */}
          <Button asChild variant="outline" size="sm" className="hidden lg:flex rounded-xl shrink-0">
            <Link href="/parlamentares/comparativo">
              <BarChart3 className="h-4 w-4 mr-1.5" />
              Comparativo
            </Link>
          </Button>
        </div>

        {/* Indicador de legislatura anterior */}
        {!isLegislaturaAtual && selectedLegislaturaId && (
          <div className="mb-4 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-sm text-amber-800">
            <Calendar className="h-4 w-4 shrink-0" />
            <span>
              Exibindo parlamentares da legislatura{' '}
              <strong>{legislaturas.find(l => l.id === selectedLegislaturaId)?.anoInicio}/{legislaturas.find(l => l.id === selectedLegislaturaId)?.anoFim}</strong>
            </span>
            <button
              onClick={() => legislaturaAtual && setSelectedLegislaturaId(legislaturaAtual.id)}
              className="ml-auto text-xs font-semibold text-amber-700 hover:text-amber-900 underline shrink-0"
            >
              Voltar para atual
            </button>
          </div>
        )}

        {/* Grid de Parlamentares */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
          {filteredData.map((parlamentar) => (
            <ParlamentarCard key={parlamentar.id} parlamentar={parlamentar} />
          ))}
        </div>

        {/* Empty state */}
        {filteredData.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 sm:p-12 text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum parlamentar encontrado</h3>
            <p className="text-sm text-gray-500">
              {searchTerm ? 'Tente ajustar os filtros de busca.' : 'Nao ha parlamentares cadastrados.'}
            </p>
          </div>
        )}

        {/* Mobile CTA comparativo */}
        <div className="mt-6 text-center lg:hidden">
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/parlamentares/comparativo">
              <BarChart3 className="h-4 w-4 mr-1.5" />
              Comparativo de Performance
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
