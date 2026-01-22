'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Search,
  X,
  FileText,
  User,
  Calendar,
  BookOpen,
  Newspaper,
  Users,
  Loader2,
  ArrowRight,
  Clock
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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
  relevancia: number
  metadata?: Record<string, unknown>
}

interface AdminSearchProps {
  className?: string
}

// Paginas estaticas para busca local
const paginasEstaticas = [
  { titulo: 'Dashboard', descricao: 'Visao geral do sistema', href: '/admin', tipo: 'page' },
  { titulo: 'Parlamentares', descricao: 'Gerenciar vereadores', href: '/admin/parlamentares', tipo: 'page' },
  { titulo: 'Sessoes Legislativas', descricao: 'Gerenciar sessoes', href: '/admin/sessoes-legislativas', tipo: 'page' },
  { titulo: 'Proposicoes', descricao: 'Gerenciar proposicoes', href: '/admin/proposicoes', tipo: 'page' },
  { titulo: 'Painel Eletronico', descricao: 'Controle de sessoes', href: '/admin/painel-eletronico', tipo: 'page' },
  { titulo: 'Pautas das Sessoes', descricao: 'Gerenciar pautas', href: '/admin/pautas-sessoes', tipo: 'page' },
  { titulo: 'Comissoes', descricao: 'Gerenciar comissoes', href: '/admin/comissoes', tipo: 'page' },
  { titulo: 'Tramitacoes', descricao: 'Acompanhar tramitacoes', href: '/admin/tramitacoes', tipo: 'page' },
  { titulo: 'Noticias', descricao: 'Gerenciar noticias', href: '/admin/noticias', tipo: 'page' },
  { titulo: 'Transparencia', descricao: 'Dados de transparencia', href: '/admin/transparencia', tipo: 'page' },
  { titulo: 'Relatorios', descricao: 'Gerar relatorios', href: '/admin/relatorios', tipo: 'page' },
  { titulo: 'Analytics', descricao: 'Dashboard de metricas', href: '/admin/analytics', tipo: 'page' },
  { titulo: 'Configuracoes', descricao: 'Configuracoes do sistema', href: '/admin/configuracoes', tipo: 'page' },
  { titulo: 'Usuarios', descricao: 'Gerenciar usuarios', href: '/admin/usuarios', tipo: 'page' },
  { titulo: 'Protocolo', descricao: 'Protocolo administrativo', href: '/admin/protocolo', tipo: 'page' },
  { titulo: 'Normas Juridicas', descricao: 'Gerenciar normas', href: '/admin/normas', tipo: 'page' },
]

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
    proposicao: 'bg-blue-100 text-blue-700',
    parlamentar: 'bg-violet-100 text-violet-700',
    sessao: 'bg-green-100 text-green-700',
    publicacao: 'bg-amber-100 text-amber-700',
    noticia: 'bg-cyan-100 text-cyan-700',
    comissao: 'bg-rose-100 text-rose-700',
  }
  return colors[tipo] || 'bg-gray-100 text-gray-700'
}

export function AdminSearch({ className }: AdminSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resultadosAPI, setResultadosAPI] = useState<ResultadoBusca[]>([])
  const [resultadosPaginas, setResultadosPaginas] = useState<typeof paginasEstaticas>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const debouncedQuery = useDebounce(query, 300)

  // Buscar na API
  const buscarAPI = useCallback(async (termo: string) => {
    if (termo.length < 2) {
      setResultadosAPI([])
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams({
        q: termo,
        rapida: 'true',
        limite: '6',
      })

      const response = await fetch(`/api/busca?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setResultadosAPI(data.resultados || [])
      }
    } catch {
      setResultadosAPI([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Buscar em paginas estaticas
  const buscarPaginas = useCallback((termo: string) => {
    if (termo.length < 2) {
      setResultadosPaginas([])
      return
    }

    const termoLower = termo.toLowerCase()
    const filtered = paginasEstaticas.filter(
      p => p.titulo.toLowerCase().includes(termoLower) ||
           p.descricao.toLowerCase().includes(termoLower)
    ).slice(0, 4)

    setResultadosPaginas(filtered)
  }, [])

  // Efeito para buscar quando query muda
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      buscarAPI(debouncedQuery)
      buscarPaginas(debouncedQuery)
      setIsOpen(true)
    } else {
      setResultadosAPI([])
      setResultadosPaginas([])
      setIsOpen(false)
    }
  }, [debouncedQuery, buscarAPI, buscarPaginas])

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Atalho de teclado (Ctrl+K ou Cmd+K)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault()
        inputRef.current?.focus()
      }
      if (event.key === 'Escape') {
        setIsOpen(false)
        inputRef.current?.blur()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleResultClick = (url: string) => {
    setIsOpen(false)
    setQuery('')
    router.push(url)
  }

  const handleVerTodos = () => {
    setIsOpen(false)
    router.push(`/admin/busca?q=${encodeURIComponent(query)}`)
  }

  const limpar = () => {
    setQuery('')
    setResultadosAPI([])
    setResultadosPaginas([])
    setIsOpen(false)
  }

  const temResultados = resultadosAPI.length > 0 || resultadosPaginas.length > 0

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Buscar... (Ctrl+K)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          className="pl-10 pr-10 w-80"
          aria-label="Buscar no sistema"
        />
        {loading ? (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
        ) : query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={limpar}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            aria-label="Limpar busca"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-[480px] overflow-hidden">
          {!temResultados && !loading && query.length >= 2 && (
            <div className="p-6 text-center text-gray-500">
              <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Nenhum resultado encontrado para &quot;{query}&quot;</p>
            </div>
          )}

          {loading && (
            <div className="p-6 text-center">
              <Loader2 className="h-6 w-6 mx-auto mb-2 text-gray-400 animate-spin" />
              <p className="text-sm text-gray-500">Buscando...</p>
            </div>
          )}

          {temResultados && !loading && (
            <div className="overflow-y-auto max-h-[400px]">
              {/* Resultados da API (dados reais) */}
              {resultadosAPI.length > 0 && (
                <div className="p-2">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                    Dados do Sistema
                  </div>
                  {resultadosAPI.map((result) => {
                    const Icon = getTipoIcon(result.tipo)
                    return (
                      <button
                        key={`${result.tipo}-${result.id}`}
                        onClick={() => handleResultClick(result.url)}
                        className="w-full flex items-start gap-3 px-3 py-3 hover:bg-gray-50 rounded-md transition-colors text-left"
                      >
                        <div className={cn(
                          'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
                          getTipoColor(result.tipo)
                        )}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {result.titulo}
                            </p>
                            <span className={cn(
                              'text-[10px] font-medium px-1.5 py-0.5 rounded',
                              getTipoColor(result.tipo)
                            )}>
                              {getTipoLabel(result.tipo)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {result.descricao}
                          </p>
                          {result.data && (
                            <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-400">
                              <Clock className="h-3 w-3" />
                              {new Date(result.data).toLocaleDateString('pt-BR')}
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Paginas do sistema */}
              {resultadosPaginas.length > 0 && (
                <div className="p-2 border-t border-gray-100">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Paginas
                  </div>
                  {resultadosPaginas.map((pagina, index) => (
                    <Link
                      key={index}
                      href={pagina.href}
                      onClick={() => {
                        setIsOpen(false)
                        setQuery('')
                      }}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-md transition-colors"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {pagina.titulo}
                        </p>
                        <p className="text-xs text-gray-500">
                          {pagina.descricao}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer com link para busca avancada */}
          {query.length >= 2 && (
            <div className="p-2 border-t border-gray-100 bg-gray-50">
              <button
                onClick={handleVerTodos}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              >
                <span>Ver todos os resultados para &quot;{query}&quot;</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
