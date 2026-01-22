'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Search,
  FileText,
  User,
  Calendar,
  BookOpen,
  Newspaper,
  Users,
  Loader2,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  SlidersHorizontal
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/lib/hooks/use-debounce'

type TipoResultado = 'proposicao' | 'parlamentar' | 'sessao' | 'publicacao' | 'noticia' | 'comissao'

interface ResultadoBusca {
  id: string
  tipo: TipoResultado
  titulo: string
  descricao: string
  url: string
  data?: string
  destaque?: string
  relevancia: number
  metadata?: Record<string, unknown>
}

interface FacetasTipo {
  tipo: TipoResultado
  count: number
}

interface FacetasAno {
  ano: number
  count: number
}

interface ResultadoPaginado {
  resultados: ResultadoBusca[]
  total: number
  pagina: number
  totalPaginas: number
  facetas: {
    tipos: FacetasTipo[]
    anos: FacetasAno[]
  }
  sugestoes: string[]
  tempoMs: number
}

const getTipoIcon = (tipo: TipoResultado) => {
  const icons: Record<TipoResultado, typeof FileText> = {
    proposicao: FileText,
    parlamentar: User,
    sessao: Calendar,
    publicacao: BookOpen,
    noticia: Newspaper,
    comissao: Users,
  }
  return icons[tipo] || FileText
}

const getTipoLabel = (tipo: TipoResultado): string => {
  const labels: Record<TipoResultado, string> = {
    proposicao: 'Proposicao',
    parlamentar: 'Parlamentar',
    sessao: 'Sessao',
    publicacao: 'Publicacao',
    noticia: 'Noticia',
    comissao: 'Comissao',
  }
  return labels[tipo] || tipo
}

const getTipoColor = (tipo: TipoResultado): string => {
  const colors: Record<TipoResultado, string> = {
    proposicao: 'bg-blue-100 text-blue-700 border-blue-200',
    parlamentar: 'bg-violet-100 text-violet-700 border-violet-200',
    sessao: 'bg-green-100 text-green-700 border-green-200',
    publicacao: 'bg-amber-100 text-amber-700 border-amber-200',
    noticia: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    comissao: 'bg-rose-100 text-rose-700 border-rose-200',
  }
  return colors[tipo] || 'bg-gray-100 text-gray-700 border-gray-200'
}

const TODOS_TIPOS: TipoResultado[] = ['proposicao', 'parlamentar', 'sessao', 'publicacao', 'noticia', 'comissao']

export default function BuscaPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const queryInicial = searchParams.get('q') || ''

  const [query, setQuery] = useState(queryInicial)
  const [resultados, setResultados] = useState<ResultadoBusca[]>([])
  const [total, setTotal] = useState(0)
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(0)
  const [facetas, setFacetas] = useState<ResultadoPaginado['facetas']>({ tipos: [], anos: [] })
  const [sugestoes, setSugestoes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [tempoMs, setTempoMs] = useState(0)

  // Filtros
  const [tiposSelecionados, setTiposSelecionados] = useState<TipoResultado[]>([])
  const [anoSelecionado, setAnoSelecionado] = useState<string>('')
  const [showFilters, setShowFilters] = useState(true)

  const debouncedQuery = useDebounce(query, 400)

  const buscar = useCallback(async (termo: string, paginaAtual: number = 1) => {
    if (termo.length < 2) {
      setResultados([])
      setTotal(0)
      setTotalPaginas(0)
      return
    }

    setLoading(true)

    try {
      const params = new URLSearchParams({
        q: termo,
        limite: '15',
        pagina: String(paginaAtual),
      })

      if (tiposSelecionados.length > 0) {
        params.set('tipos', tiposSelecionados.join(','))
      }

      if (anoSelecionado) {
        const anoNum = parseInt(anoSelecionado)
        params.set('dataInicio', `${anoNum}-01-01`)
        params.set('dataFim', `${anoNum}-12-31`)
      }

      const response = await fetch(`/api/busca?${params.toString()}`)

      if (response.ok) {
        const data: ResultadoPaginado = await response.json()
        setResultados(data.resultados)
        setTotal(data.total)
        setPagina(data.pagina)
        setTotalPaginas(data.totalPaginas)
        setFacetas(data.facetas)
        setSugestoes(data.sugestoes)
        setTempoMs(data.tempoMs)
      }
    } catch (error) {
      console.error('Erro na busca:', error)
    } finally {
      setLoading(false)
    }
  }, [tiposSelecionados, anoSelecionado])

  // Buscar quando query ou filtros mudam
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      buscar(debouncedQuery, 1)
      // Atualizar URL
      router.replace(`/admin/busca?q=${encodeURIComponent(debouncedQuery)}`, { scroll: false })
    }
  }, [debouncedQuery, tiposSelecionados, anoSelecionado, buscar, router])

  // Buscar ao mudar pagina
  useEffect(() => {
    if (debouncedQuery.length >= 2 && pagina > 1) {
      buscar(debouncedQuery, pagina)
    }
  }, [pagina, debouncedQuery, buscar])

  const toggleTipo = (tipo: TipoResultado) => {
    setTiposSelecionados(prev =>
      prev.includes(tipo)
        ? prev.filter(t => t !== tipo)
        : [...prev, tipo]
    )
    setPagina(1)
  }

  const limparFiltros = () => {
    setTiposSelecionados([])
    setAnoSelecionado('')
    setPagina(1)
  }

  const temFiltrosAtivos = tiposSelecionados.length > 0 || anoSelecionado !== ''

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Busca Global</h1>

        {/* Campo de busca */}
        <div className="relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar proposicoes, parlamentares, sessoes, noticias..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPagina(1)
            }}
            className="pl-12 pr-4 py-3 text-lg h-14"
            autoFocus
          />
          {query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuery('')
                setResultados([])
              }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Sugestoes */}
        {sugestoes.length > 0 && query.length >= 2 && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-500">Sugestoes:</span>
            {sugestoes.slice(0, 5).map((sugestao, idx) => (
              <button
                key={idx}
                onClick={() => setQuery(sugestao)}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                {sugestao}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Conteudo principal */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar de filtros */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-100 p-4 sticky top-20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filtros
              </h2>
              {temFiltrosAtivos && (
                <Button variant="ghost" size="sm" onClick={limparFiltros}>
                  Limpar
                </Button>
              )}
            </div>

            {/* Filtro por tipo */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Tipo</h3>
              <div className="space-y-2">
                {TODOS_TIPOS.map(tipo => {
                  const faceta = facetas.tipos.find(f => f.tipo === tipo)
                  const count = faceta?.count || 0
                  const isSelected = tiposSelecionados.includes(tipo)

                  return (
                    <button
                      key={tipo}
                      onClick={() => toggleTipo(tipo)}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors',
                        isSelected
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'hover:bg-gray-50 text-gray-600'
                      )}
                    >
                      <span className="flex items-center gap-2">
                        {(() => {
                          const Icon = getTipoIcon(tipo)
                          return <Icon className="h-4 w-4" />
                        })()}
                        {getTipoLabel(tipo)}
                      </span>
                      <span className={cn(
                        'text-xs px-1.5 py-0.5 rounded',
                        isSelected ? 'bg-blue-100' : 'bg-gray-100'
                      )}>
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Filtro por ano */}
            {facetas.anos.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Ano</h3>
                <Select value={anoSelecionado} onValueChange={setAnoSelecionado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os anos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os anos</SelectItem>
                    {facetas.anos.map(({ ano, count }) => (
                      <SelectItem key={ano} value={String(ano)}>
                        {ano} ({count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* Resultados */}
        <div className="lg:col-span-3">
          {/* Info da busca */}
          {query.length >= 2 && (
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                {loading ? (
                  'Buscando...'
                ) : (
                  <>
                    {total} resultado{total !== 1 ? 's' : ''} para <strong>&quot;{query}&quot;</strong>
                    {tempoMs > 0 && <span className="text-gray-400"> ({tempoMs}ms)</span>}
                  </>
                )}
              </p>

              {temFiltrosAtivos && (
                <div className="flex items-center gap-2">
                  {tiposSelecionados.map(tipo => (
                    <Badge
                      key={tipo}
                      variant="secondary"
                      className={cn('cursor-pointer', getTipoColor(tipo))}
                      onClick={() => toggleTipo(tipo)}
                    >
                      {getTipoLabel(tipo)}
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                  {anoSelecionado && (
                    <Badge
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => setAnoSelecionado('')}
                    >
                      {anoSelecionado}
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <Loader2 className="h-8 w-8 mx-auto mb-3 text-blue-500 animate-spin" />
              <p className="text-gray-500">Buscando resultados...</p>
            </div>
          )}

          {/* Sem resultados */}
          {!loading && query.length >= 2 && resultados.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum resultado encontrado
              </h3>
              <p className="text-gray-500 mb-4">
                Nao encontramos resultados para &quot;{query}&quot;.
              </p>
              <div className="text-sm text-gray-500">
                <p>Sugestoes:</p>
                <ul className="mt-2 space-y-1">
                  <li>Verifique a ortografia</li>
                  <li>Tente termos mais genericos</li>
                  <li>Remova alguns filtros</li>
                </ul>
              </div>
            </div>
          )}

          {/* Lista de resultados */}
          {!loading && resultados.length > 0 && (
            <div className="space-y-3">
              {resultados.map((resultado) => {
                const Icon = getTipoIcon(resultado.tipo)

                return (
                  <Link
                    key={`${resultado.tipo}-${resultado.id}`}
                    href={resultado.url}
                    className="block bg-white rounded-xl border border-gray-100 p-4 hover:border-gray-200 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
                        getTipoColor(resultado.tipo)
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900 truncate">
                            {resultado.titulo}
                          </h3>
                          <Badge variant="outline" className={cn('text-xs', getTipoColor(resultado.tipo))}>
                            {getTipoLabel(resultado.tipo)}
                          </Badge>
                        </div>

                        <p className="text-sm text-gray-600 line-clamp-2">
                          {resultado.destaque ? (
                            <span dangerouslySetInnerHTML={{ __html: resultado.destaque }} />
                          ) : (
                            resultado.descricao
                          )}
                        </p>

                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          {resultado.data && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(resultado.data).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                          {resultado.metadata && typeof resultado.metadata.autor === 'string' && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {resultado.metadata.autor}
                            </span>
                          )}
                          {resultado.metadata && typeof resultado.metadata.status === 'string' && (
                            <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">
                              {resultado.metadata.status}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {/* Paginacao */}
          {!loading && totalPaginas > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Pagina {pagina} de {totalPaginas}
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagina(p => Math.max(1, p - 1))}
                  disabled={pagina <= 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                    let pageNum: number
                    if (totalPaginas <= 5) {
                      pageNum = i + 1
                    } else if (pagina <= 3) {
                      pageNum = i + 1
                    } else if (pagina >= totalPaginas - 2) {
                      pageNum = totalPaginas - 4 + i
                    } else {
                      pageNum = pagina - 2 + i
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={pagina === pageNum ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setPagina(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                  disabled={pagina >= totalPaginas}
                >
                  Proxima
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Estado inicial */}
          {query.length < 2 && (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Busca Global
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Digite pelo menos 2 caracteres para buscar em proposicoes, parlamentares, sessoes, noticias e mais.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
