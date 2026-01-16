'use client'

import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SearchResult {
  title: string
  description: string
  href: string
  type: 'page' | 'data' | 'action'
}

interface AdminSearchProps {
  className?: string
}

const searchResults: SearchResult[] = [
  // Páginas principais
  { title: 'Dashboard', description: 'Visão geral do sistema', href: '/admin', type: 'page' },
  { title: 'Parlamentares', description: 'Gerenciar vereadores', href: '/admin/parlamentares', type: 'page' },
  { title: 'Sessões Legislativas', description: 'Gerenciar sessões', href: '/admin/sessoes-legislativas', type: 'page' },
  { title: 'Proposições', description: 'Gerenciar proposições', href: '/admin/proposicoes', type: 'page' },
  { title: 'Painel Eletrônico', description: 'Controle de sessões', href: '/admin/painel-eletronico', type: 'page' },
  { title: 'Pautas das Sessões', description: 'Gerenciar pautas', href: '/admin/pautas-sessoes', type: 'page' },
  { title: 'Notícias', description: 'Gerenciar notícias', href: '/admin/noticias', type: 'page' },
  { title: 'Licitações', description: 'Gerenciar licitações', href: '/admin/licitacoes', type: 'page' },
  { title: 'Gestão Fiscal', description: 'Controle financeiro', href: '/admin/gestao-fiscal', type: 'page' },
  { title: 'Configurações', description: 'Configurações do sistema', href: '/admin/configuracoes', type: 'page' },
  
  // Ações comuns
  { title: 'Novo Parlamentar', description: 'Cadastrar novo vereador', href: '/admin/parlamentares', type: 'action' },
  { title: 'Nova Sessão', description: 'Criar nova sessão', href: '/admin/sessoes-legislativas', type: 'action' },
  { title: 'Nova Proposição', description: 'Criar nova proposição', href: '/admin/proposicoes', type: 'action' },
  { title: 'Nova Pauta', description: 'Criar nova pauta', href: '/admin/pautas-sessoes', type: 'action' },
  { title: 'Nova Notícia', description: 'Publicar nova notícia', href: '/admin/noticias', type: 'action' },
]

export function AdminSearch({ className }: AdminSearchProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery)
    
    if (searchQuery.length < 2) {
      setResults([])
      setIsOpen(false)
      return
    }

    const filtered = searchResults.filter(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    )

    setResults(filtered)
    setIsOpen(filtered.length > 0)
  }

  const handleResultClick = () => {
    setIsOpen(false)
    setQuery('')
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'page':
        return '📄'
      case 'action':
        return '⚡'
      default:
        return '📊'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'page':
        return 'text-blue-600'
      case 'action':
        return 'text-green-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
        <Input
          id="admin-search"
          type="text"
          placeholder="Buscar páginas, ações..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          className="pl-10 pr-10 w-80"
          aria-label="Buscar no painel administrativo"
          aria-describedby="search-results"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery('')
              setResults([])
              setIsOpen(false)
            }}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            aria-label="Limpar busca"
            title="Limpar busca"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div 
          id="search-results"
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
          role="listbox"
          aria-label="Resultados da busca"
        >
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 px-3 py-2 border-b border-gray-100">
              Resultados ({results.length})
            </div>
            {results.map((result, index) => (
              <a
                key={index}
                href={result.href}
                onClick={handleResultClick}
                className="flex items-center space-x-3 px-3 py-3 hover:bg-gray-50 rounded-md transition-colors"
                role="option"
                aria-label={`${result.title} - ${result.description}`}
                aria-selected="false"
              >
                <span className="text-lg" aria-hidden="true">{getTypeIcon(result.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {result.title}
                    </p>
                    <span className={cn('text-xs font-medium', getTypeColor(result.type))}>
                      {result.type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {result.description}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Overlay para fechar quando clicar fora */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
