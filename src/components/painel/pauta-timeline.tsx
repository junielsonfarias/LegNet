'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  Minus,
  Vote,
  MessageCircle,
  BookOpen,
  Megaphone,
  Filter,
  ChevronRight
} from 'lucide-react'
import { getStatusItemStyle } from '@/lib/utils/accessibility-colors'

interface ItemPauta {
  id: string
  titulo: string
  secao: string
  ordem: number
  status: string
  tipoAcao?: string | null
  proposicao?: {
    id: string
    numero: number
    ano: number
    tipo: string
  } | null
}

interface PautaTimelineProps {
  /** Lista de itens da pauta */
  itens: ItemPauta[]
  /** Indice do item atualmente selecionado */
  itemAtualIndex: number
  /** Callback quando um item e clicado */
  onItemClick: (index: number) => void
  className?: string
}

type FiltroStatus = 'todos' | 'aprovados' | 'rejeitados' | 'pendentes' | 'outros'

/**
 * Timeline de navegacao da pauta
 *
 * Exibe todos os itens da pauta em uma lista vertical com filtros
 */
export function PautaTimeline({
  itens,
  itemAtualIndex,
  onItemClick,
  className
}: PautaTimelineProps) {
  const [filtro, setFiltro] = useState<FiltroStatus>('todos')

  // Filtrar itens
  const itensFiltrados = useMemo(() => {
    if (filtro === 'todos') return itens

    return itens.filter(item => {
      switch (filtro) {
        case 'aprovados':
          return item.status === 'APROVADO' || item.status === 'CONCLUIDO'
        case 'rejeitados':
          return item.status === 'REJEITADO'
        case 'pendentes':
          return item.status === 'PENDENTE' || item.status === 'EM_DISCUSSAO' || item.status === 'EM_VOTACAO'
        case 'outros':
          return ['ADIADO', 'RETIRADO', 'VISTA'].includes(item.status)
        default:
          return true
      }
    })
  }, [itens, filtro])

  // Obter icone do status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APROVADO':
      case 'CONCLUIDO':
        return CheckCircle
      case 'REJEITADO':
        return XCircle
      case 'EM_DISCUSSAO':
        return MessageCircle
      case 'EM_VOTACAO':
        return Vote
      case 'ADIADO':
        return Clock
      case 'RETIRADO':
        return Minus
      case 'VISTA':
        return Eye
      default:
        return Clock
    }
  }

  // Obter icone do tipo de acao
  const getTipoAcaoIcon = (tipoAcao: string | null | undefined) => {
    switch (tipoAcao) {
      case 'VOTACAO':
        return Vote
      case 'LEITURA':
        return BookOpen
      case 'DISCUSSAO':
        return MessageCircle
      case 'COMUNICACAO':
        return Megaphone
      default:
        return null
    }
  }

  // Contagem por filtro
  const contagens = useMemo(() => ({
    todos: itens.length,
    aprovados: itens.filter(i => i.status === 'APROVADO' || i.status === 'CONCLUIDO').length,
    rejeitados: itens.filter(i => i.status === 'REJEITADO').length,
    pendentes: itens.filter(i => ['PENDENTE', 'EM_DISCUSSAO', 'EM_VOTACAO'].includes(i.status)).length,
    outros: itens.filter(i => ['ADIADO', 'RETIRADO', 'VISTA'].includes(i.status)).length
  }), [itens])

  const filtros: Array<{ key: FiltroStatus; label: string; cor: string }> = [
    { key: 'todos', label: 'Todos', cor: 'bg-blue-500/20 text-blue-300 border-blue-400/30' },
    { key: 'aprovados', label: 'Aprovados', cor: 'bg-green-500/20 text-green-300 border-green-400/30' },
    { key: 'rejeitados', label: 'Rejeitados', cor: 'bg-red-500/20 text-red-300 border-red-400/30' },
    { key: 'pendentes', label: 'Pendentes', cor: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30' },
    { key: 'outros', label: 'Outros', cor: 'bg-gray-500/20 text-gray-300 border-gray-400/30' }
  ]

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Filtros */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Filter className="h-4 w-4 text-white/50" />
        {filtros.map(f => (
          <Button
            key={f.key}
            variant="ghost"
            size="sm"
            className={cn(
              'text-xs border transition-all',
              filtro === f.key ? f.cor : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
            )}
            onClick={() => setFiltro(f.key)}
          >
            {f.label}
            <Badge variant="outline" className="ml-1.5 h-5 px-1.5 text-[10px]">
              {contagens[f.key]}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Lista de itens */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-1 pr-3">
          {itensFiltrados.map((item, filteredIndex) => {
            // Encontrar indice original
            const originalIndex = itens.findIndex(i => i.id === item.id)
            const isAtual = originalIndex === itemAtualIndex
            const statusStyle = getStatusItemStyle(item.status)
            const StatusIcon = getStatusIcon(item.status)
            const TipoIcon = getTipoAcaoIcon(item.tipoAcao)

            return (
              <button
                key={item.id}
                onClick={() => onItemClick(originalIndex)}
                className={cn(
                  'w-full text-left p-3 rounded-lg border transition-all',
                  'hover:bg-white/10',
                  isAtual
                    ? 'bg-blue-500/20 border-blue-400/50 ring-1 ring-blue-400/30'
                    : 'bg-white/5 border-white/10'
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Indicador de status */}
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                      statusStyle.bgLight
                    )}
                  >
                    <StatusIcon className={cn('h-4 w-4', statusStyle.text)} />
                  </div>

                  {/* Conteudo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-white/50">#{item.ordem}</span>
                      {TipoIcon && (
                        <TipoIcon className="h-3 w-3 text-white/40" />
                      )}
                      <Badge
                        variant="outline"
                        className={cn('text-[10px] px-1.5 py-0', statusStyle.bgLight, statusStyle.text)}
                      >
                        {item.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-white truncate">
                      {item.proposicao
                        ? `${item.proposicao.tipo} ${item.proposicao.numero}/${item.proposicao.ano}`
                        : item.titulo}
                    </p>
                    <p className="text-xs text-white/50 truncate mt-0.5">
                      {item.secao.replace(/_/g, ' ')}
                    </p>
                  </div>

                  {/* Indicador de item atual */}
                  {isAtual && (
                    <ChevronRight className="h-5 w-5 text-blue-400 flex-shrink-0" />
                  )}
                </div>
              </button>
            )
          })}

          {itensFiltrados.length === 0 && (
            <div className="text-center py-8 text-white/50">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum item encontrado com este filtro</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PautaTimeline
