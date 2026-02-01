'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { sanitizeHtml } from '@/lib/utils/sanitize-html'
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
  SlidersHorizontal,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { ResultadoBusca, TipoResultado, ResultadoPaginado } from '@/lib/services/busca-service'

const tipoIcones: Record<TipoResultado, React.ReactNode> = {
  proposicao: <FileText className="h-4 w-4" />,
  parlamentar: <User className="h-4 w-4" />,
  sessao: <Calendar className="h-4 w-4" />,
  publicacao: <BookOpen className="h-4 w-4" />,
  noticia: <Newspaper className="h-4 w-4" />,
  comissao: <Users className="h-4 w-4" />,
}

const tipoLabels: Record<TipoResultado, string> = {
  proposicao: 'Proposicoes',
  parlamentar: 'Parlamentares',
  sessao: 'Sessoes',
  publicacao: 'Publicacoes',
  noticia: 'Noticias',
  comissao: 'Comissoes',
}

const tipoCores: Record<TipoResultado, string> = {
  proposicao: 'bg-blue-100 text-blue-700 border-blue-200',
  parlamentar: 'bg-green-100 text-green-700 border-green-200',
  sessao: 'bg-purple-100 text-purple-700 border-purple-200',
  publicacao: 'bg-orange-100 text-orange-700 border-orange-200',
  noticia: 'bg-pink-100 text-pink-700 border-pink-200',
  comissao: 'bg-yellow-100 text-yellow-700 border-yellow-200',
}

function BuscaContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [tiposSelecionados, setTiposSelecionados] = useState<TipoResultado[]>([])
  const [anoSelecionado, setAnoSelecionado] = useState<string>('all')
  const [pagina, setPagina] = useState(1)
  const [resultado, setResultado] = useState<ResultadoPaginado | null>(null)
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // Buscar ao carregar ou quando parametros mudam
  const realizarBusca = useCallback(async () => {
    if (!query || query.length < 2) {
      setResultado(null)
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('q', query)
      params.set('pagina', pagina.toString())
      params.set('limite', '20')

      if (tiposSelecionados.length > 0) {
        params.set('tipos', tiposSelecionados.join(','))
      }

      if (anoSelecionado && anoSelecionado !== 'all') {
        params.set('dataInicio', `${anoSelecionado}-01-01`)
        params.set('dataFim', `${anoSelecionado}-12-31`)
      }

      const res = await fetch(`/api/busca?${params.toString()}`)
      const data = await res.json()
      setResultado(data)
    } catch (error) {
      console.error('Erro na busca:', error)
    } finally {
      setLoading(false)
    }
  }, [query, pagina, tiposSelecionados, anoSelecionado])

  useEffect(() => {
    const q = searchParams.get('q')
    if (q) {
      setQuery(q)
    }
  }, [searchParams])

  useEffect(() => {
    realizarBusca()
  }, [realizarBusca])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPagina(1)
    router.push(`/busca?q=${encodeURIComponent(query)}`)
    realizarBusca()
  }

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
    setAnoSelecionado('all')
    setPagina(1)
  }

  const formatarData = (data?: Date) => {
    if (!data) return ''
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(data))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header da busca */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar proposicoes, parlamentares, sessoes..."
                className="pl-10 h-12 text-base"
                autoFocus
              />
            </div>
            <Button type="submit" size="lg" className="h-12">
              Buscar
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-12"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="h-5 w-5" />
            </Button>
          </form>

          {/* Filtros expandidos */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex flex-wrap gap-4">
                {/* Filtro por tipo */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Tipo de conteudo
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(tipoLabels).map(([tipo, label]) => (
                      <button
                        key={tipo}
                        onClick={() => toggleTipo(tipo as TipoResultado)}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors',
                          tiposSelecionados.includes(tipo as TipoResultado)
                            ? tipoCores[tipo as TipoResultado]
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        )}
                      >
                        {tipoIcones[tipo as TipoResultado]}
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filtro por ano */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Ano
                  </label>
                  <Select value={anoSelecionado} onValueChange={(v) => { setAnoSelecionado(v); setPagina(1); }}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Todos os anos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os anos</SelectItem>
                      {[2026, 2025, 2024, 2023, 2022, 2021, 2020].map(ano => (
                        <SelectItem key={ano} value={ano.toString()}>
                          {ano}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Limpar filtros */}
                {(tiposSelecionados.length > 0 || (anoSelecionado && anoSelecionado !== 'all')) && (
                  <div className="flex items-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={limparFiltros}
                      className="text-gray-500"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Limpar filtros
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Resultados */}
          <div className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-camara-primary" />
              </div>
            ) : resultado ? (
              <>
                {/* Info dos resultados */}
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-600">
                    {resultado.total} resultado{resultado.total !== 1 ? 's' : ''} encontrado{resultado.total !== 1 ? 's' : ''}
                    {resultado.tempoMs && <span className="text-gray-400"> ({resultado.tempoMs}ms)</span>}
                  </p>
                </div>

                {/* Lista de resultados */}
                {resultado.resultados.length > 0 ? (
                  <div className="space-y-3">
                    {resultado.resultados.map((item) => (
                      <Link
                        key={`${item.tipo}-${item.id}`}
                        href={item.url}
                        className="block"
                      >
                        <Card className="hover:shadow-md transition-shadow hover:border-camara-primary/30">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              <div className={cn(
                                'flex h-10 w-10 items-center justify-center rounded-lg shrink-0',
                                tipoCores[item.tipo]
                              )}>
                                {tipoIcones[item.tipo]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="secondary" className="text-xs">
                                    {tipoLabels[item.tipo]}
                                  </Badge>
                                  {item.data && (
                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {formatarData(item.data)}
                                    </span>
                                  )}
                                </div>
                                <h3 className="font-medium text-gray-900 mb-1">
                                  {item.titulo}
                                </h3>
                                <p
                                  className="text-sm text-gray-600 line-clamp-2"
                                  dangerouslySetInnerHTML={{
                                    __html: sanitizeHtml(item.destaque || item.descricao)
                                  }}
                                />
                                {item.metadata && (() => {
                                  const meta = item.metadata as Record<string, unknown>
                                  return (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      {meta.status ? (
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                          {String(meta.status)}
                                        </span>
                                      ) : null}
                                      {meta.autor ? (
                                        <span className="text-xs text-gray-500">
                                          por {String(meta.autor)}
                                        </span>
                                      ) : null}
                                      {meta.partido ? (
                                        <span className="text-xs text-gray-500">
                                          {String(meta.partido)}
                                        </span>
                                      ) : null}
                                    </div>
                                  )
                                })()}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <Search className="mx-auto h-12 w-12 text-gray-300" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">
                      Nenhum resultado encontrado
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Tente buscar com outros termos ou remova alguns filtros.
                    </p>
                  </div>
                )}

                {/* Paginacao */}
                {resultado.totalPaginas > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagina(p => Math.max(1, p - 1))}
                      disabled={pagina === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    <span className="text-sm text-gray-600 px-4">
                      Pagina {pagina} de {resultado.totalPaginas}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagina(p => Math.min(resultado.totalPaginas, p + 1))}
                      disabled={pagina === resultado.totalPaginas}
                    >
                      Proxima
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            ) : query.length >= 2 ? (
              <div className="text-center py-20">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="text-center py-20">
                <Search className="mx-auto h-16 w-16 text-gray-200" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  Busque em todo o sistema
                </h3>
                <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                  Encontre proposicoes, parlamentares, sessoes, publicacoes e muito mais.
                  Digite pelo menos 2 caracteres para iniciar a busca.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {['Projeto de Lei', 'Sessao Ordinaria', 'Vereador', 'Comissao de Justica'].map(sugestao => (
                    <button
                      key={sugestao}
                      onClick={() => { setQuery(sugestao); router.push(`/busca?q=${encodeURIComponent(sugestao)}`); }}
                      className="rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 transition-colors"
                    >
                      {sugestao}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar com facetas */}
          {resultado && resultado.resultados.length > 0 && (
            <div className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-24">
                {/* Faceta por tipo */}
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      Filtrar por tipo
                    </h4>
                    <div className="space-y-2">
                      {resultado.facetas.tipos.map(({ tipo, count }) => (
                        <label
                          key={tipo}
                          className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-1.5 rounded"
                        >
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={tiposSelecionados.includes(tipo)}
                              onCheckedChange={() => toggleTipo(tipo)}
                            />
                            <span className="text-sm text-gray-700">
                              {tipoLabels[tipo]}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400">{count}</span>
                        </label>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Faceta por ano */}
                {resultado.facetas.anos.length > 0 && (
                  <Card className="mt-4">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Filtrar por ano
                      </h4>
                      <div className="space-y-2">
                        {resultado.facetas.anos.slice(0, 5).map(({ ano, count }) => (
                          <label
                            key={ano}
                            className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-1.5 rounded"
                          >
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={anoSelecionado === ano.toString()}
                                onCheckedChange={() => {
                                  setAnoSelecionado(
                                    anoSelecionado === ano.toString() ? 'all' : ano.toString()
                                  )
                                  setPagina(1)
                                }}
                              />
                              <span className="text-sm text-gray-700">{ano}</span>
                            </div>
                            <span className="text-xs text-gray-400">{count}</span>
                          </label>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Sugestoes */}
                {resultado.sugestoes && resultado.sugestoes.length > 0 && (
                  <Card className="mt-4">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-gray-900 mb-3">
                        Buscas relacionadas
                      </h4>
                      <div className="space-y-1">
                        {resultado.sugestoes.map((sugestao) => (
                          <button
                            key={sugestao}
                            onClick={() => {
                              setQuery(sugestao)
                              router.push(`/busca?q=${encodeURIComponent(sugestao)}`)
                            }}
                            className="block w-full text-left text-sm text-camara-primary hover:underline truncate"
                          >
                            {sugestao}
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function BuscaFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-camara-primary" />
        <p className="mt-2 text-sm text-gray-500">Carregando busca...</p>
      </div>
    </div>
  )
}

export default function BuscaPage() {
  return (
    <Suspense fallback={<BuscaFallback />}>
      <BuscaContent />
    </Suspense>
  )
}
