'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Search, Loader2, CheckCircle, FileText, AlertTriangle } from 'lucide-react'

interface ProposicaoElegivel {
  id: string
  numero: string
  ano: number
  tipo: string
  titulo: string
  ementa: string
  etapaAtual?: string
}

interface ProposicaoSelectorProps {
  onSelect: (proposicao: ProposicaoElegivel) => void
}

const TIPO_LABELS: Record<string, string> = {
  'PROJETO_LEI': 'PL',
  'PROJETO_RESOLUCAO': 'PR',
  'PROJETO_DECRETO': 'PD',
  'INDICACAO': 'IND',
  'REQUERIMENTO': 'REQ',
  'MOCAO': 'MOC',
  'VOTO_PESAR': 'VP',
  'VOTO_APLAUSO': 'VA'
}

export function ProposicaoSelector({ onSelect }: ProposicaoSelectorProps) {
  const [proposicoes, setProposicoes] = useState<ProposicaoElegivel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const loadProposicoes = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/proposicoes/elegiveis-pauta')
      const data = await response.json()

      if (data.success) {
        setProposicoes(data.data)
      } else {
        setError(data.error || 'Erro ao carregar proposicoes')
      }
    } catch (err) {
      console.error('Erro ao carregar proposicoes:', err)
      setError('Erro ao carregar proposicoes elegiveis')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProposicoes()
  }, [loadProposicoes])

  const filteredProposicoes = proposicoes.filter(p => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      p.numero.toLowerCase().includes(search) ||
      p.titulo.toLowerCase().includes(search) ||
      p.ementa.toLowerCase().includes(search) ||
      (TIPO_LABELS[p.tipo] || p.tipo).toLowerCase().includes(search)
    )
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-600">{error}</p>
        <Button variant="outline" onClick={loadProposicoes} className="mt-4">
          Tentar novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar por numero, titulo ou tipo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Info */}
      <div className="text-sm text-gray-500 flex items-center gap-2">
        <CheckCircle className="h-4 w-4 text-green-500" />
        <span>
          {filteredProposicoes.length} proposicoes elegiveis para inclusao na pauta
        </span>
      </div>

      {/* Lista */}
      {filteredProposicoes.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchTerm
              ? 'Nenhuma proposicao encontrada com esse termo'
              : 'Nenhuma proposicao elegivel para pauta no momento'}
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Proposicoes precisam estar na etapa "Encaminhado para Plenario"
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {filteredProposicoes.map((prop) => (
            <div
              key={prop.id}
              className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => onSelect(prop)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {TIPO_LABELS[prop.tipo] || prop.tipo}
                    </Badge>
                    <span className="font-medium">
                      {prop.numero}/{prop.ano}
                    </span>
                  </div>
                  <h4 className="font-medium text-gray-900 truncate">
                    {prop.titulo}
                  </h4>
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {prop.ementa}
                  </p>
                  {prop.etapaAtual && (
                    <div className="mt-1">
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        {prop.etapaAtual}
                      </Badge>
                    </div>
                  )}
                </div>
                <Button size="sm" variant="outline">
                  Adicionar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
