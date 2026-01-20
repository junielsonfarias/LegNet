'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Search,
  FileText,
  User,
  Calendar,
  BookOpen,
  Newspaper,
  Users,
  Loader2,
  ArrowRight,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ResultadoBusca, TipoResultado } from '@/lib/services/busca-service'

interface CommandPaletteProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const tipoIcones: Record<TipoResultado, React.ReactNode> = {
  proposicao: <FileText className="h-4 w-4" />,
  parlamentar: <User className="h-4 w-4" />,
  sessao: <Calendar className="h-4 w-4" />,
  publicacao: <BookOpen className="h-4 w-4" />,
  noticia: <Newspaper className="h-4 w-4" />,
  comissao: <Users className="h-4 w-4" />,
}

const tipoLabels: Record<TipoResultado, string> = {
  proposicao: 'Proposicao',
  parlamentar: 'Parlamentar',
  sessao: 'Sessao',
  publicacao: 'Publicacao',
  noticia: 'Noticia',
  comissao: 'Comissao',
}

const tipoCores: Record<TipoResultado, string> = {
  proposicao: 'bg-blue-100 text-blue-700',
  parlamentar: 'bg-green-100 text-green-700',
  sessao: 'bg-purple-100 text-purple-700',
  publicacao: 'bg-orange-100 text-orange-700',
  noticia: 'bg-pink-100 text-pink-700',
  comissao: 'bg-yellow-100 text-yellow-700',
}

export function CommandPalette({ open: controlledOpen, onOpenChange }: CommandPaletteProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [resultados, setResultados] = useState<ResultadoBusca[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setIsOpen = onOpenChange || setInternalOpen

  // Carregar buscas recentes do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches')
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  // Atalho de teclado Ctrl+K ou Cmd+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || e.key === '/') {
        e.preventDefault()
        setIsOpen(true)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [setIsOpen])

  // Buscar resultados com debounce
  useEffect(() => {
    if (query.length < 2) {
      setResultados([])
      return
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/busca?q=${encodeURIComponent(query)}&rapida=true&limite=8`)
        const data = await res.json()
        setResultados(data.resultados || [])
        setSelectedIndex(0)
      } catch (error) {
        console.error('Erro na busca:', error)
        setResultados([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query])

  const saveRecentSearch = useCallback((term: string) => {
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('recentSearches', JSON.stringify(updated))
  }, [recentSearches])

  const navigateTo = useCallback((resultado: ResultadoBusca) => {
    saveRecentSearch(query)
    setIsOpen(false)
    setQuery('')
    router.push(resultado.url)
  }, [query, router, saveRecentSearch, setIsOpen])

  const goToSearchPage = useCallback(() => {
    if (query.trim()) {
      saveRecentSearch(query)
      setIsOpen(false)
      router.push(`/busca?q=${encodeURIComponent(query)}`)
      setQuery('')
    }
  }, [query, router, saveRecentSearch, setIsOpen])

  // Navegacao com teclado
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const items = query.length >= 2 ? resultados : recentSearches

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(i => (i < items.length - 1 ? i + 1 : 0))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(i => (i > 0 ? i - 1 : items.length - 1))
        break
      case 'Enter':
        e.preventDefault()
        if (query.length >= 2 && resultados[selectedIndex]) {
          navigateTo(resultados[selectedIndex])
        } else if (query.length >= 2) {
          goToSearchPage()
        } else if (recentSearches[selectedIndex]) {
          setQuery(recentSearches[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        break
    }
  }, [query, resultados, selectedIndex, recentSearches, setIsOpen, navigateTo, goToSearchPage])

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem('recentSearches')
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="overflow-hidden p-0 shadow-lg max-w-2xl">
        <DialogTitle className="sr-only">Busca global</DialogTitle>

        {/* Input de busca */}
        <div className="flex items-center border-b px-4 py-3">
          <Search className="mr-3 h-5 w-5 shrink-0 text-gray-400" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar proposicoes, parlamentares, sessoes..."
            className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base placeholder:text-gray-400"
            autoFocus
          />
          {loading && <Loader2 className="h-5 w-5 animate-spin text-gray-400" />}
          <kbd className="ml-3 pointer-events-none inline-flex h-6 select-none items-center gap-1 rounded border bg-gray-100 px-2 font-mono text-xs text-gray-600">
            ESC
          </kbd>
        </div>

        {/* Resultados */}
        <div className="max-h-[400px] overflow-y-auto p-2">
          {/* Buscas recentes quando nao ha query */}
          {query.length < 2 && recentSearches.length > 0 && (
            <div className="mb-2">
              <div className="flex items-center justify-between px-2 py-1.5">
                <span className="text-xs font-medium text-gray-500">Buscas recentes</span>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Limpar
                </button>
              </div>
              {recentSearches.map((term, index) => (
                <button
                  key={term}
                  onClick={() => setQuery(term)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm',
                    selectedIndex === index
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span>{term}</span>
                </button>
              ))}
            </div>
          )}

          {/* Resultados da busca */}
          {query.length >= 2 && (
            <>
              {resultados.length > 0 ? (
                <div>
                  <div className="px-2 py-1.5">
                    <span className="text-xs font-medium text-gray-500">
                      {resultados.length} resultado{resultados.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {resultados.map((resultado, index) => (
                    <button
                      key={`${resultado.tipo}-${resultado.id}`}
                      onClick={() => navigateTo(resultado)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left',
                        selectedIndex === index
                          ? 'bg-camara-primary text-white'
                          : 'text-gray-700 hover:bg-gray-50'
                      )}
                    >
                      <div className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg',
                        selectedIndex === index
                          ? 'bg-white/20'
                          : tipoCores[resultado.tipo]
                      )}>
                        {tipoIcones[resultado.tipo]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{resultado.titulo}</div>
                        <div className={cn(
                          'text-xs truncate',
                          selectedIndex === index ? 'text-white/70' : 'text-gray-500'
                        )}>
                          {resultado.descricao}
                        </div>
                      </div>
                      <span className={cn(
                        'text-xs px-2 py-0.5 rounded',
                        selectedIndex === index
                          ? 'bg-white/20'
                          : 'bg-gray-100 text-gray-600'
                      )}>
                        {tipoLabels[resultado.tipo]}
                      </span>
                      <ArrowRight className={cn(
                        'h-4 w-4',
                        selectedIndex === index ? 'text-white' : 'text-gray-400'
                      )} />
                    </button>
                  ))}

                  {/* Link para ver todos os resultados */}
                  <button
                    onClick={goToSearchPage}
                    className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-3 mt-2 text-sm text-camara-primary hover:bg-camara-primary/5 border border-dashed border-gray-200"
                  >
                    <Search className="h-4 w-4" />
                    Ver todos os resultados para &ldquo;{query}&rdquo;
                  </button>
                </div>
              ) : !loading ? (
                <div className="py-8 text-center">
                  <Search className="mx-auto h-10 w-10 text-gray-300" />
                  <p className="mt-2 text-sm text-gray-500">
                    Nenhum resultado encontrado para &ldquo;{query}&rdquo;
                  </p>
                  <button
                    onClick={goToSearchPage}
                    className="mt-3 text-sm text-camara-primary hover:underline"
                  >
                    Buscar com mais opcoes
                  </button>
                </div>
              ) : null}
            </>
          )}

          {/* Dicas quando vazio */}
          {query.length < 2 && recentSearches.length === 0 && (
            <div className="py-8 text-center">
              <Search className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">
                Digite para buscar em todo o sistema
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {['Projeto de Lei', 'Sessao Ordinaria', 'Vereador'].map(sugestao => (
                  <button
                    key={sugestao}
                    onClick={() => setQuery(sugestao)}
                    className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600 hover:bg-gray-200"
                  >
                    {sugestao}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer com atalhos */}
        <div className="flex items-center justify-between border-t bg-gray-50 px-4 py-2 text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-white px-1.5 py-0.5">↑↓</kbd>
              navegar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-white px-1.5 py-0.5">Enter</kbd>
              selecionar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-white px-1.5 py-0.5">Esc</kbd>
              fechar
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="rounded border bg-white px-1.5 py-0.5">Ctrl</kbd>
            <kbd className="rounded border bg-white px-1.5 py-0.5">K</kbd>
            abrir busca
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Componente de botao para abrir a busca
export function SearchButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors',
          className
        )}
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Buscar...</span>
        <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-gray-100 px-1.5 font-mono text-[10px] text-gray-600">
          Ctrl K
        </kbd>
      </button>
      <CommandPalette open={open} onOpenChange={setOpen} />
    </>
  )
}
