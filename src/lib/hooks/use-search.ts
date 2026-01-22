'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useDebounce } from './use-debounce'

export type TipoResultado =
  | 'proposicao'
  | 'parlamentar'
  | 'sessao'
  | 'publicacao'
  | 'noticia'
  | 'comissao'

export interface ResultadoBusca {
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

export interface FacetasTipo {
  tipo: TipoResultado
  count: number
}

export interface FacetasAno {
  ano: number
  count: number
}

export interface ResultadoPaginado {
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

export interface FiltrosBusca {
  tipos?: TipoResultado[]
  dataInicio?: string
  dataFim?: string
  autorId?: string
  status?: string
  limite?: number
  pagina?: number
}

interface UseSearchOptions {
  debounceMs?: number
  minChars?: number
  autoSearch?: boolean
}

interface UseSearchReturn {
  query: string
  setQuery: (query: string) => void
  results: ResultadoBusca[]
  total: number
  pagina: number
  totalPaginas: number
  facetas: ResultadoPaginado['facetas']
  sugestoes: string[]
  loading: boolean
  error: string | null
  tempoMs: number
  filtros: FiltrosBusca
  setFiltros: (filtros: FiltrosBusca) => void
  search: (termo?: string) => Promise<void>
  searchRapida: (termo: string) => Promise<ResultadoBusca[]>
  limpar: () => void
  proximaPagina: () => void
  paginaAnterior: () => void
  irParaPagina: (pagina: number) => void
}

export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const {
    debounceMs = 300,
    minChars = 2,
    autoSearch = true,
  } = options

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ResultadoBusca[]>([])
  const [total, setTotal] = useState(0)
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(0)
  const [facetas, setFacetas] = useState<ResultadoPaginado['facetas']>({ tipos: [], anos: [] })
  const [sugestoes, setSugestoes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tempoMs, setTempoMs] = useState(0)
  const [filtros, setFiltros] = useState<FiltrosBusca>({})

  const debouncedQuery = useDebounce(query, debounceMs)
  const abortControllerRef = useRef<AbortController | null>(null)

  const search = useCallback(async (termo?: string) => {
    const termoBusca = termo ?? query

    if (termoBusca.length < minChars) {
      setResults([])
      setTotal(0)
      setTotalPaginas(0)
      setFacetas({ tipos: [], anos: [] })
      setSugestoes([])
      return
    }

    // Cancelar requisição anterior
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        q: termoBusca,
        limite: String(filtros.limite || 20),
        pagina: String(filtros.pagina || pagina),
      })

      if (filtros.tipos && filtros.tipos.length > 0) {
        params.set('tipos', filtros.tipos.join(','))
      }
      if (filtros.dataInicio) {
        params.set('dataInicio', filtros.dataInicio)
      }
      if (filtros.dataFim) {
        params.set('dataFim', filtros.dataFim)
      }
      if (filtros.autorId) {
        params.set('autorId', filtros.autorId)
      }
      if (filtros.status) {
        params.set('status', filtros.status)
      }

      const response = await fetch(`/api/busca?${params.toString()}`, {
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error('Erro ao buscar resultados')
      }

      const data: ResultadoPaginado = await response.json()

      setResults(data.resultados)
      setTotal(data.total)
      setPagina(data.pagina)
      setTotalPaginas(data.totalPaginas)
      setFacetas(data.facetas)
      setSugestoes(data.sugestoes)
      setTempoMs(data.tempoMs)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [query, filtros, pagina, minChars])

  const searchRapida = useCallback(async (termo: string): Promise<ResultadoBusca[]> => {
    if (termo.length < minChars) {
      return []
    }

    try {
      const params = new URLSearchParams({
        q: termo,
        rapida: 'true',
        limite: '8',
      })

      const response = await fetch(`/api/busca?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Erro ao buscar')
      }

      const data: ResultadoPaginado = await response.json()
      return data.resultados
    } catch {
      return []
    }
  }, [minChars])

  const limpar = useCallback(() => {
    setQuery('')
    setResults([])
    setTotal(0)
    setPagina(1)
    setTotalPaginas(0)
    setFacetas({ tipos: [], anos: [] })
    setSugestoes([])
    setError(null)
    setFiltros({})
  }, [])

  const proximaPagina = useCallback(() => {
    if (pagina < totalPaginas) {
      setPagina(p => p + 1)
    }
  }, [pagina, totalPaginas])

  const paginaAnterior = useCallback(() => {
    if (pagina > 1) {
      setPagina(p => p - 1)
    }
  }, [pagina])

  const irParaPagina = useCallback((novaPagina: number) => {
    if (novaPagina >= 1 && novaPagina <= totalPaginas) {
      setPagina(novaPagina)
    }
  }, [totalPaginas])

  // Auto-search quando query ou filtros mudam
  useEffect(() => {
    if (autoSearch && debouncedQuery.length >= minChars) {
      search(debouncedQuery)
    }
  }, [debouncedQuery, filtros, autoSearch, minChars, search])

  // Re-buscar quando a página muda
  useEffect(() => {
    if (query.length >= minChars && pagina > 1) {
      search()
    }
  }, [pagina, query, minChars, search])

  // Cleanup
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    query,
    setQuery,
    results,
    total,
    pagina,
    totalPaginas,
    facetas,
    sugestoes,
    loading,
    error,
    tempoMs,
    filtros,
    setFiltros,
    search,
    searchRapida,
    limpar,
    proximaPagina,
    paginaAnterior,
    irParaPagina,
  }
}

// Labels e icones
export function getTipoLabel(tipo: TipoResultado): string {
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

export function getTipoColor(tipo: TipoResultado): string {
  const colors: Record<TipoResultado, string> = {
    proposicao: 'bg-blue-100 text-blue-700',
    parlamentar: 'bg-violet-100 text-violet-700',
    sessao: 'bg-green-100 text-green-700',
    publicacao: 'bg-amber-100 text-amber-700',
    noticia: 'bg-cyan-100 text-cyan-700',
    comissao: 'bg-rose-100 text-rose-700',
  }
  return colors[tipo] || 'bg-gray-100 text-gray-700'
}
