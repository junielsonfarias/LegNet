'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu'
import {
  Play,
  Pause,
  Vote,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  BookOpen,
  LogOut,
  Eye,
  MoreVertical
} from 'lucide-react'
import type { PautaItemApi } from '@/lib/api/pauta-api'
import {
  ITEM_RESULTADOS,
  TIPO_ACAO_OPTIONS,
  getItemStatusBadge,
  getTipoAcaoBadge,
  getTipoAcaoLabel,
  formatTempoLabel
} from '../types'

interface Presenca {
  parlamentar: {
    id: string
    nome: string
    apelido?: string | null
  }
  presente: boolean
}

interface PautaItemProps {
  item: PautaItemApi
  isAtual: boolean
  sessaoEmAndamento: boolean
  executando: boolean
  presencas?: Presenca[]
  onIniciar: () => void
  onPausar: () => void
  onRetomar: () => void
  onVotacao: () => void
  onFinalizar: (resultado: 'CONCLUIDO' | 'APROVADO' | 'REJEITADO' | 'RETIRADO' | 'ADIADO') => void
  onVista: (parlamentarId: string) => void
  onRetomarVista: () => void
  onSubir: () => void
  onDescer: () => void
  onAtualizarTipoAcao: (tipoAcao: 'LEITURA' | 'DISCUSSAO' | 'VOTACAO' | 'COMUNICADO' | 'HOMENAGEM') => void
  onRetirar: () => void
}

export function PautaItem({
  item,
  isAtual,
  sessaoEmAndamento,
  executando,
  presencas,
  onIniciar,
  onPausar,
  onRetomar,
  onVotacao,
  onFinalizar,
  onVista,
  onRetomarVista,
  onSubir,
  onDescer,
  onAtualizarTipoAcao,
  onRetirar
}: PautaItemProps) {
  const isEmLeitura = item.status === 'EM_DISCUSSAO' && item.tipoAcao === 'LEITURA'

  return (
    <div
      className={`flex flex-col gap-3 rounded-lg border p-4 transition ${
        isEmLeitura
          ? 'border-sky-500 bg-sky-900/30 shadow-lg shadow-sky-500/20'
          : isAtual
            ? 'border-blue-500 bg-blue-900/30 shadow-lg'
            : 'border-slate-600 bg-slate-700/50'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {/* Indicador EM LEITURA em destaque */}
          {isEmLeitura && (
            <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-sky-600/30 border border-sky-400/50 rounded-md animate-pulse">
              <BookOpen className="h-4 w-4 text-sky-300" />
              <span className="text-sm font-semibold text-sky-200">EM LEITURA</span>
            </div>
          )}
          <div className="flex items-center gap-3 flex-wrap">
            <Badge className={getItemStatusBadge(item.status)}>{item.status.replace(/_/g, ' ')}</Badge>
            {item.tipoAcao && (
              <Badge variant="outline" className={getTipoAcaoBadge(item.tipoAcao)}>
                {getTipoAcaoLabel(item.tipoAcao)}
              </Badge>
            )}
            {/* Badge de Turno */}
            {item.turnoFinal && item.turnoFinal > 1 && (
              <Badge
                variant="outline"
                className={
                  item.intersticio
                    ? 'border-yellow-400 bg-yellow-50 text-yellow-700'
                    : item.resultadoTurno2
                      ? 'border-green-400 bg-green-50 text-green-700'
                      : 'border-purple-400 bg-purple-50 text-purple-700'
                }
              >
                {item.intersticio
                  ? 'Aguardando 2 Turno'
                  : item.resultadoTurno2
                    ? '2 Turnos Concluidos'
                    : `${item.turnoAtual || 1}/${item.turnoFinal} Turno`}
              </Badge>
            )}
            <span className="text-xs text-slate-400">Ordem {item.ordem}</span>
          </div>
          <h3 className="mt-2 text-base font-semibold text-white">{item.titulo}</h3>
          {item.descricao && (
            <p className="mt-1 text-sm text-slate-300">{item.descricao}</p>
          )}
          <p className="mt-2 text-xs text-slate-400">{formatTempoLabel(item)}</p>
        </div>

        {sessaoEmAndamento && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Botoes de reordenacao e edicao de momento para itens pendentes */}
            {item.status === 'PENDENTE' && (
              <>
                {/* Dropdown para alterar Momento (tipoAcao) */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={executando}
                      className="border-sky-500 text-sky-400 hover:bg-sky-900/30"
                      title="Alterar momento da materia"
                    >
                      <BookOpen className="mr-1 h-4 w-4" /> Momento
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-slate-800 border-slate-600">
                    {TIPO_ACAO_OPTIONS.map(opt => (
                      <DropdownMenuItem
                        key={opt.value}
                        onClick={() => onAtualizarTipoAcao(opt.value)}
                        className={`text-slate-200 hover:bg-slate-700 ${item.tipoAcao === opt.value ? 'bg-sky-900/50' : ''}`}
                      >
                        <span className="mr-2">{opt.icon}</span>
                        {opt.label}
                        {item.tipoAcao === opt.value && <CheckCircle className="ml-auto h-4 w-4 text-sky-400" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={executando}
                  onClick={onSubir}
                  title="Mover para cima"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={executando}
                  onClick={onDescer}
                  title="Mover para baixo"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </>
            )}

            {/* Botao de Iniciar - diferenciado para LEITURA */}
            {['PENDENTE', 'ADIADO'].includes(item.status) && item.tipoAcao === 'LEITURA' && (
              <Button
                size="sm"
                disabled={executando}
                onClick={onIniciar}
                className="bg-sky-600 hover:bg-sky-700"
              >
                <BookOpen className="mr-2 h-4 w-4" /> Iniciar Leitura
              </Button>
            )}
            {['PENDENTE', 'ADIADO'].includes(item.status) && item.tipoAcao !== 'LEITURA' && (
              <Button
                size="sm"
                disabled={executando}
                onClick={onIniciar}
              >
                <Play className="mr-2 h-4 w-4" /> Iniciar
              </Button>
            )}

            {/* Retomar item de Vista */}
            {item.status === 'VISTA' && (
              <Button
                size="sm"
                disabled={executando}
                onClick={onRetomarVista}
                className="bg-violet-600 hover:bg-violet-700"
              >
                <RotateCcw className="mr-2 h-4 w-4" /> Retomar Vista
              </Button>
            )}

            {item.status === 'EM_DISCUSSAO' && item.iniciadoEm && (
              <Button
                size="sm"
                variant="outline"
                disabled={executando}
                onClick={onPausar}
              >
                <Pause className="mr-2 h-4 w-4" /> Pausar
              </Button>
            )}

            {item.status === 'EM_DISCUSSAO' && !item.iniciadoEm && (
              <Button
                size="sm"
                disabled={executando}
                onClick={onRetomar}
              >
                <Play className="mr-2 h-4 w-4" /> Retomar
              </Button>
            )}

            {item.status === 'EM_DISCUSSAO' && item.tipoAcao === 'LEITURA' && (
              <Button
                size="sm"
                disabled={executando}
                onClick={() => onFinalizar('CONCLUIDO')}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle className="mr-2 h-4 w-4" /> Materia Lida
              </Button>
            )}

            {item.status === 'EM_DISCUSSAO' && item.tipoAcao !== 'LEITURA' && (
              <Button
                size="sm"
                variant="outline"
                disabled={executando}
                onClick={onVotacao}
              >
                <Vote className="mr-2 h-4 w-4" /> Iniciar votacao
              </Button>
            )}

            {/* Botao de Pedir Vista */}
            {['EM_DISCUSSAO', 'EM_VOTACAO'].includes(item.status) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" disabled={executando} className="border-violet-500 text-violet-400 hover:bg-violet-900/30">
                    <Eye className="mr-2 h-4 w-4" /> Vista
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-slate-800 border-slate-600">
                  {presencas?.filter(p => p.presente).map(presenca => (
                    <DropdownMenuItem
                      key={presenca.parlamentar.id}
                      onClick={() => onVista(presenca.parlamentar.id)}
                      className="text-slate-200 hover:bg-slate-700"
                    >
                      {presenca.parlamentar.apelido || presenca.parlamentar.nome}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {['EM_DISCUSSAO', 'EM_VOTACAO'].includes(item.status) && (
              <>
                {/* Botao separado para Retirar de Pauta */}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={executando}
                  onClick={onRetirar}
                  className="border-yellow-500 text-yellow-400 hover:bg-yellow-900/30"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Retirar
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="secondary" disabled={executando} className="bg-slate-600 text-white hover:bg-slate-500">
                      <MoreVertical className="mr-2 h-4 w-4" /> Encerrar
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-slate-800 border-slate-600">
                    {ITEM_RESULTADOS.filter(r => r.value !== 'RETIRADO').map(result => (
                      <DropdownMenuItem
                        key={result.value}
                        onClick={() => onFinalizar(result.value)}
                        className="text-slate-200 hover:bg-slate-700"
                      >
                        {result.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        )}
      </div>

      {item.status !== 'PENDENTE' && (
        <div className="text-xs text-slate-400">
          {item.iniciadoEm && (
            <span className="mr-4">
              Inicio: {new Date(item.iniciadoEm).toLocaleTimeString('pt-BR')}
            </span>
          )}
          {item.finalizadoEm && (
            <span>
              Encerrado: {new Date(item.finalizadoEm).toLocaleTimeString('pt-BR')}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
