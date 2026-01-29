/**
 * Quick Search - Busca Rapida com Autocomplete
 * Campo de busca inline com sugestoes dinamicas
 * Conformidade: WCAG 2.1 AA
 */

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Search,
  X,
  FileText,
  Users,
  Calendar,
  Newspaper,
  Scale,
  ArrowRight,
  Clock,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAnnounce } from '@/components/ui/skip-link'

// =============================================================================
// TIPOS
// =============================================================================

interface SearchResult {
  id: string
  title: string
  description?: string
  href: string
  category: 'projetos' | 'leis' | 'sessoes' | 'parlamentares' | 'noticias'
  date?: string
}

interface SearchCategory {
  key: string
  label: string
  icon: typeof FileText
}

const categories: SearchCategory[] = [
  { key: 'projetos', label: 'Projetos de Lei', icon: FileText },
  { key: 'leis', label: 'Leis e Decretos', icon: Scale },
  { key: 'sessoes', label: 'Sessoes', icon: Calendar },
  { key: 'parlamentares', label: 'Parlamentares', icon: Users },
  { key: 'noticias', label: 'Noticias', icon: Newspaper },
]

const categoryIcons: Record<string, typeof FileText> = {
  projetos: FileText,
  leis: Scale,
  sessoes: Calendar,
  parlamentares: Users,
  noticias: Newspaper,
}

// =============================================================================
// PLACEHOLDER DINAMICO
// =============================================================================

const placeholders = [
  'Buscar projeto de lei...',
  'Buscar vereador...',
  'Buscar sessao...',
  'Buscar lei ou decreto...',
  'Buscar noticia...',
]

function useDynamicPlaceholder() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % placeholders.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return placeholders[index]
}

// =============================================================================
// COMPONENTE: QuickSearch
// =============================================================================

interface QuickSearchProps {
  className?: string
  variant?: 'inline' | 'expanded'
  onSearch?: (query: string) => void
}

export function QuickSearch({
  className,
  variant = 'inline',
  onSearch
}: QuickSearchProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const placeholder = useDynamicPlaceholder()
  const { announce } = useAnnounce()

  // Carregar buscas recentes do localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('recent-searches')
      if (stored) {
        setRecentSearches(JSON.parse(stored).slice(0, 5))
      }
    } catch {
      // Ignora erros
    }
  }, [])

  // Salvar busca recente
  const saveRecentSearch = useCallback((search: string) => {
    if (!search.trim()) return

    const updated = [search, ...recentSearches.filter(s => s !== search)].slice(0, 5)
    setRecentSearches(updated)
    try {
      localStorage.setItem('recent-searches', JSON.stringify(updated))
    } catch {
      // Ignora erros
    }
  }, [recentSearches])

  // Buscar resultados (mock - substituir por API real)
  const searchResults = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults([])
      return
    }

    setIsLoading(true)

    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 300))

    // Mock results - substituir por chamada de API real
    const mockResults: SearchResult[] = [
      {
        id: '1',
        title: `Projeto de Lei ${searchQuery.toUpperCase()}`,
        description: 'Projeto relacionado a busca',
        href: `/legislativo/proposicoes?q=${encodeURIComponent(searchQuery)}`,
        category: 'projetos',
        date: '2024-01-15'
      },
      {
        id: '2',
        title: `Lei Municipal sobre ${searchQuery}`,
        href: `/transparencia/leis?q=${encodeURIComponent(searchQuery)}`,
        category: 'leis',
      },
      {
        id: '3',
        title: `Sessao Ordinaria - ${searchQuery}`,
        href: `/legislativo/sessoes?q=${encodeURIComponent(searchQuery)}`,
        category: 'sessoes',
        date: '2024-01-10'
      },
    ]

    setResults(mockResults)
    setIsLoading(false)
    announce(`${mockResults.length} resultados encontrados`)
  }, [announce])

  // Debounce da busca
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) {
        searchResults(query)
      } else {
        setResults([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, searchResults])

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Navegacao por teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = results.length + (recentSearches.length > 0 && !query ? recentSearches.length : 0)

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % totalItems)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + totalItems) % totalItems)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && results[selectedIndex]) {
          router.push(results[selectedIndex].href)
          saveRecentSearch(query)
          setIsOpen(false)
        } else if (query.trim()) {
          handleSubmit()
        }
        break
      case 'Escape':
        setIsOpen(false)
        inputRef.current?.blur()
        break
    }
  }

  const handleSubmit = () => {
    if (query.trim()) {
      saveRecentSearch(query)
      onSearch?.(query)
      router.push(`/busca?q=${encodeURIComponent(query)}`)
      setIsOpen(false)
    }
  }

  const clearQuery = () => {
    setQuery('')
    setResults([])
    inputRef.current?.focus()
  }

  return (
    <div
      ref={dropdownRef}
      className={cn('relative', className)}
      role="search"
    >
      {/* Campo de busca */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
          aria-hidden="true"
        />
        <Input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            'pl-10 pr-10',
            variant === 'expanded' ? 'h-12 text-base' : 'h-10',
            'focus:ring-2 focus:ring-camara-primary focus:border-camara-primary'
          )}
          aria-label="Campo de busca"
          aria-autocomplete="list"
          aria-controls="search-results"
          aria-expanded={isOpen}
          role="combobox"
        />
        {query && (
          <button
            onClick={clearQuery}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
            aria-label="Limpar busca"
          >
            <X className="h-4 w-4 text-gray-400" aria-hidden="true" />
          </button>
        )}
        {isLoading && (
          <Loader2
            className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin"
            aria-hidden="true"
          />
        )}
      </div>

      {/* Dropdown de resultados */}
      {isOpen && (
        <div
          id="search-results"
          className={cn(
            'absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200',
            'max-h-[70vh] overflow-y-auto z-50',
            'transition-all duration-200 ease-in-out'
          )}
          role="listbox"
          aria-label="Resultados da busca"
        >
          {/* Buscas recentes (quando campo vazio) */}
          {!query && recentSearches.length > 0 && (
            <div className="p-3 border-b border-gray-100">
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-2">
                <Clock className="h-3 w-3" aria-hidden="true" />
                Buscas Recentes
              </h3>
              <ul>
                {recentSearches.map((search, index) => (
                  <li key={search}>
                    <button
                      onClick={() => {
                        setQuery(search)
                        searchResults(search)
                      }}
                      className={cn(
                        'w-full text-left px-3 py-2 text-sm rounded-md',
                        'hover:bg-gray-50 focus:bg-gray-50 focus:outline-none',
                        selectedIndex === index && 'bg-gray-50'
                      )}
                      role="option"
                      aria-selected={selectedIndex === index}
                    >
                      {search}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Resultados da busca */}
          {query && results.length > 0 && (
            <div className="p-2">
              <ul>
                {results.map((result, index) => {
                  const Icon = categoryIcons[result.category] || FileText
                  return (
                    <li key={result.id}>
                      <Link
                        href={result.href}
                        onClick={() => {
                          saveRecentSearch(query)
                          setIsOpen(false)
                        }}
                        className={cn(
                          'flex items-start gap-3 px-3 py-3 rounded-md',
                          'hover:bg-gray-50 focus:bg-gray-50 focus:outline-none',
                          'transition-colors duration-150',
                          selectedIndex === index && 'bg-gray-50'
                        )}
                        role="option"
                        aria-selected={selectedIndex === index}
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <Icon className="h-4 w-4 text-gray-600" aria-hidden="true" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {result.title}
                          </p>
                          {result.description && (
                            <p className="text-xs text-gray-500 truncate">
                              {result.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                              {categories.find(c => c.key === result.category)?.label}
                            </span>
                            {result.date && (
                              <span className="text-xs text-gray-400">
                                {new Date(result.date).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" aria-hidden="true" />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {/* Nenhum resultado */}
          {query && query.length >= 2 && !isLoading && results.length === 0 && (
            <div className="p-6 text-center">
              <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" aria-hidden="true" />
              <p className="text-sm text-gray-500">
                Nenhum resultado encontrado para &ldquo;{query}&rdquo;
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Tente termos diferentes ou mais especificos
              </p>
            </div>
          )}

          {/* Ver todos os resultados */}
          {query && results.length > 0 && (
            <div className="p-3 border-t border-gray-100">
              <Button
                variant="ghost"
                className="w-full justify-center text-camara-primary hover:text-camara-primary/80"
                onClick={handleSubmit}
              >
                Ver todos os resultados para &ldquo;{query}&rdquo;
                <ArrowRight className="h-4 w-4 ml-2" aria-hidden="true" />
              </Button>
            </div>
          )}

          {/* Categorias de busca */}
          {!query && (
            <div className="p-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                Buscar por Categoria
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((category) => (
                  <Link
                    key={category.key}
                    href={`/busca?categoria=${category.key}`}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-md text-sm',
                      'text-gray-600 hover:bg-gray-50 hover:text-camara-primary',
                      'focus:outline-none focus:bg-gray-50 focus:text-camara-primary',
                      'transition-colors duration-150'
                    )}
                  >
                    <category.icon className="h-4 w-4" aria-hidden="true" />
                    {category.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

export type { SearchResult, SearchCategory, QuickSearchProps }
