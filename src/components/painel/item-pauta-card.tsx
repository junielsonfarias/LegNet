'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  getStatusItemStyle,
  getTipoAcaoStyle,
  type StatusItem,
  type TipoAcao
} from '@/lib/utils/accessibility-colors'
import {
  Play,
  Pause,
  Square,
  Vote,
  RotateCcw,
  Clock,
  CheckCircle,
  XCircle,
  MinusCircle,
  MessageCircle,
  BookOpen,
  Megaphone,
  Eye,
  AlertTriangle,
  Award
} from 'lucide-react'

interface Proposicao {
  id: string
  numero: number | string
  ano: number
  tipo: string
  ementa?: string | null
}

export interface ItemPauta {
  id: string
  titulo: string
  descricao?: string | null
  secao: string
  ordem: number
  status: string
  tipoAcao?: string | null
  tempoEstimado?: number | null
  tempoAcumulado?: number | null
  tempoReal?: number | null
  iniciadoEm?: string | null
  finalizadoEm?: string | null
  proposicao?: Proposicao | null
}

interface ItemPautaCardProps {
  item: ItemPauta
  /** Se este item esta sendo executado no momento */
  emExecucao?: boolean
  /** Se as acoes estao habilitadas */
  acoesHabilitadas?: boolean
  /** Callback para iniciar item */
  onIniciar?: () => void
  /** Callback para pausar item */
  onPausar?: () => void
  /** Callback para retomar item */
  onRetomar?: () => void
  /** Callback para iniciar votacao */
  onVotacao?: () => void
  /** Callback para finalizar item */
  onFinalizar?: () => void
  /** Se uma acao esta em execucao (loading) */
  executando?: boolean
  className?: string
}

/**
 * Formatar minutos para exibicao
 */
function formatarMinutos(segundos: number | null | undefined): string {
  if (!segundos) return '0 min'
  const minutos = Math.floor(segundos / 60)
  return `${minutos} min`
}

/**
 * Obter icone para tipo de acao
 */
function getIconeTipoAcao(tipoAcao: string | null | undefined) {
  switch (tipoAcao) {
    case 'VOTACAO':
      return Vote
    case 'LEITURA':
      return BookOpen
    case 'DISCUSSAO':
      return MessageCircle
    case 'COMUNICACAO':
    case 'COMUNICADO':
      return Megaphone
    case 'HOMENAGEM':
      return Award
    default:
      return MessageCircle
  }
}

/**
 * Verifica se o item e informativo (nao precisa de votacao)
 */
function isItemInformativo(tipoAcao: string | null | undefined): boolean {
  return tipoAcao === 'LEITURA' || tipoAcao === 'COMUNICADO' || tipoAcao === 'COMUNICACAO' || tipoAcao === 'HOMENAGEM'
}

/**
 * Obter icone para status
 */
function getIconeStatus(status: string) {
  switch (status) {
    case 'APROVADO':
    case 'CONCLUIDO':
      return CheckCircle
    case 'REJEITADO':
      return XCircle
    case 'ADIADO':
      return Clock
    case 'RETIRADO':
      return MinusCircle
    case 'VISTA':
      return Eye
    case 'EM_VOTACAO':
      return Vote
    case 'EM_DISCUSSAO':
      return MessageCircle
    default:
      return Clock
  }
}

/**
 * Card unificado de item da pauta
 *
 * Features:
 * - Indicacao visual clara do item em execucao (borda pulsante, fundo destacado)
 * - Icones junto com cores para acessibilidade
 * - Botoes de acao contextuais
 * - Informacoes de tempo
 */
export function ItemPautaCard({
  item,
  emExecucao = false,
  acoesHabilitadas = true,
  onIniciar,
  onPausar,
  onRetomar,
  onVotacao,
  onFinalizar,
  executando = false,
  className
}: ItemPautaCardProps) {
  const statusStyle = getStatusItemStyle(item.status)
  const tipoAcaoStyle = item.tipoAcao ? getTipoAcaoStyle(item.tipoAcao) : null
  const IconeTipoAcao = getIconeTipoAcao(item.tipoAcao)
  const IconeStatus = getIconeStatus(item.status)

  // Classes para item em execucao
  const execucaoClasses = emExecucao
    ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900 animate-pulse-soft'
    : ''

  // Verificar se pode retomar (pausado ou adiado)
  const podeRetomar = item.status === 'ADIADO' ||
    (item.iniciadoEm === null && item.tempoAcumulado && item.tempoAcumulado > 0)

  return (
    <div
      className={cn(
        'relative p-4 rounded-lg border transition-all duration-300',
        emExecucao
          ? 'bg-blue-900/40 border-blue-500 shadow-lg shadow-blue-500/20'
          : 'bg-slate-700/50 border-slate-600 hover:border-slate-500',
        execucaoClasses,
        className
      )}
    >
      {/* Indicador lateral para item em execucao */}
      {emExecucao && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-lg" />
      )}

      {/* Banner de item em execucao */}
      {emExecucao && (
        <div className="absolute -top-3 left-4 px-3 py-1 bg-blue-600 text-blue-100 text-xs font-bold rounded-full uppercase tracking-wider shadow-lg animate-bounce-soft">
          Em Execucao
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 pt-1">
          {/* Badges de status e tipo */}
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <Badge
              className={cn(
                'flex items-center gap-1',
                statusStyle.bg,
                statusStyle.text
              )}
            >
              <IconeStatus className="h-3 w-3" />
              {item.status.replace(/_/g, ' ')}
            </Badge>

            {tipoAcaoStyle && (
              <Badge
                variant="outline"
                className={cn(
                  'flex items-center gap-1',
                  tipoAcaoStyle.bgLight,
                  tipoAcaoStyle.text,
                  tipoAcaoStyle.border
                )}
              >
                <IconeTipoAcao className="h-3 w-3" />
                {tipoAcaoStyle.label}
              </Badge>
            )}

            <span className="text-xs text-slate-500">Ordem {item.ordem}</span>
          </div>

          {/* Titulo */}
          <h4 className="font-semibold text-white">
            {item.proposicao
              ? `${item.proposicao.tipo.replace('_', ' ')} ${item.proposicao.numero}/${item.proposicao.ano}`
              : item.titulo}
          </h4>

          {/* Descricao/Ementa */}
          <p className="text-sm text-slate-400 mt-1 line-clamp-2">
            {item.proposicao?.ementa || item.descricao || item.titulo}
          </p>

          {/* Informacoes de tempo */}
          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Est: {item.tempoEstimado || 0} min
            </span>
            <span>
              Real: {formatarMinutos(item.tempoReal || item.tempoAcumulado)}
            </span>
            {item.finalizadoEm && (
              <span>
                Encerrado: {new Date(item.finalizadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>

        {/* Botoes de acao */}
        {acoesHabilitadas && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Iniciar item pendente */}
            {item.status === 'PENDENTE' && onIniciar && (
              <Button
                size="sm"
                variant="ghost"
                className="text-green-400 hover:text-green-300 hover:bg-green-900/30"
                onClick={onIniciar}
                disabled={executando}
                title="Iniciar item"
              >
                <Play className="h-4 w-4" />
              </Button>
            )}

            {/* Acoes para item em discussao */}
            {item.status === 'EM_DISCUSSAO' && (
              <>
                {onPausar && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/30"
                    onClick={onPausar}
                    disabled={executando}
                    title="Pausar"
                  >
                    <Pause className="h-4 w-4" />
                  </Button>
                )}
                {/* Botao de votacao - apenas para itens que precisam de votacao (VOTACAO ou DISCUSSAO) */}
                {!isItemInformativo(item.tipoAcao) && onVotacao && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-purple-400 hover:text-purple-300 hover:bg-purple-900/30"
                    onClick={onVotacao}
                    disabled={executando}
                    title="Iniciar Votação"
                  >
                    <Vote className="h-4 w-4" />
                  </Button>
                )}
                {onFinalizar && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/30"
                    onClick={onFinalizar}
                    disabled={executando}
                    title="Finalizar"
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                )}
              </>
            )}

            {/* Acoes para item em votacao */}
            {item.status === 'EM_VOTACAO' && onFinalizar && (
              <Button
                size="sm"
                variant="ghost"
                className="text-red-400 hover:text-red-300 hover:bg-red-900/30"
                onClick={onFinalizar}
                disabled={executando}
                title="Finalizar Votação"
              >
                <Square className="h-4 w-4" />
              </Button>
            )}

            {/* Retomar item pausado/adiado */}
            {podeRetomar && onRetomar && (
              <Button
                size="sm"
                variant="ghost"
                className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/30"
                onClick={onRetomar}
                disabled={executando}
                title="Retomar"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * CSS animations para adicionar ao globals.css ou tailwind.config.js:
 *
 * @keyframes pulse-soft {
 *   0%, 100% { opacity: 1; }
 *   50% { opacity: 0.9; }
 * }
 *
 * @keyframes bounce-soft {
 *   0%, 100% { transform: translateY(0); }
 *   50% { transform: translateY(-2px); }
 * }
 *
 * .animate-pulse-soft {
 *   animation: pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
 * }
 *
 * .animate-bounce-soft {
 *   animation: bounce-soft 2s ease-in-out infinite;
 * }
 */

export default ItemPautaCard
