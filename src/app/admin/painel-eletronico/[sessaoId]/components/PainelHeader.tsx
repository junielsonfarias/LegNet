'use client'

import Link from 'next/link'
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
  Square,
  Clock,
  FileText,
  Calendar,
  ArrowLeft,
  Timer,
  Monitor,
  RefreshCw,
  Tv,
  ExternalLink,
  ChevronDown,
  Pencil
} from 'lucide-react'
import type { SessaoApi } from '@/lib/api/sessoes-api'
import type { PautaItemApi } from '@/lib/api/pauta-api'
import { formatSeconds, getSessaoStatusBadge, getSessaoStatusLabel, getTipoSessaoLabel } from '../types'
import { gerarSlugSessao } from '@/lib/utils/sessoes-utils'

interface PainelHeaderProps {
  sessao: SessaoApi
  currentItem: PautaItemApi | null
  cronometroSessao: number
  cronometroItem: number
  executando: boolean
  nomeCasa?: string
  onRefresh: () => void
  onIniciarSessao: () => void
  onFinalizarSessao: () => void
  onCancelarSessao: () => void
  onAlterarStatus: (status: 'AGENDADA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA') => void
}

export function PainelHeader({
  sessao,
  currentItem,
  cronometroSessao,
  cronometroItem,
  executando,
  nomeCasa,
  onRefresh,
  onIniciarSessao,
  onFinalizarSessao,
  onCancelarSessao,
  onAlterarStatus
}: PainelHeaderProps) {
  const dataSessao = sessao.data ? new Date(sessao.data) : null
  const dataFormatada = dataSessao
    ? dataSessao.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })
    : 'Data nao informada'

  return (
    <div className="border-b border-slate-700 bg-slate-800 px-6 py-4">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-700">
              <Link href="/admin/sessoes-legislativas">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Link>
            </Button>
            <div>
              <h1 className="flex items-center gap-3 text-2xl font-bold text-white">
                <Monitor className="h-7 w-7 text-blue-400" />
                {sessao.numero}a Sessao {getTipoSessaoLabel(sessao.tipo)}
              </h1>
              <p className="mt-1 text-slate-400">
                {nomeCasa || 'Camara Municipal'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {/* Informacoes da Sessao inline */}
            <div className="hidden lg:flex items-center gap-6 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-500" />
                <span>{dataFormatada}</span>
              </div>
              {sessao.horario && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-500" />
                  <span>{sessao.horario}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-500" />
                <span>{sessao.pautaSessao?.itens.length ?? 0} itens na pauta</span>
              </div>
            </div>

            {/* Dropdown para alterar status da sessao */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`${getSessaoStatusBadge(sessao.status)} hover:opacity-80 flex items-center gap-1`}
                  disabled={executando}
                >
                  {getSessaoStatusLabel(sessao.status)}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => onAlterarStatus('AGENDADA')}
                  disabled={sessao.status === 'AGENDADA'}
                  className="flex items-center gap-2"
                >
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  Agendada
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onAlterarStatus('EM_ANDAMENTO')}
                  disabled={sessao.status === 'EM_ANDAMENTO'}
                  className="flex items-center gap-2"
                >
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  Em andamento
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onAlterarStatus('CONCLUIDA')}
                  disabled={sessao.status === 'CONCLUIDA'}
                  className="flex items-center gap-2"
                >
                  <div className="w-2 h-2 rounded-full bg-gray-500" />
                  Concluida
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onAlterarStatus('CANCELADA')}
                  disabled={sessao.status === 'CANCELADA'}
                  className="flex items-center gap-2 text-red-400 focus:text-red-400"
                >
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  Cancelada
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Botoes de acesso aos paineis externos */}
            <div className="flex items-center gap-2 border-l border-slate-600 pl-4">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                <a
                  href={`/painel-publico?sessaoId=${gerarSlugSessao(sessao.numero, sessao.data)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Monitor className="mr-2 h-4 w-4" />
                  Painel Publico
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-blue-600 bg-blue-600/20 text-blue-300 hover:bg-blue-600 hover:text-white"
              >
                <a
                  href={`/painel-tv/${gerarSlugSessao(sessao.numero, sessao.data)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Tv className="mr-2 h-4 w-4" />
                  Painel TV
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className={
                  sessao.status === 'CONCLUIDA'
                    ? "border-amber-500 bg-amber-500/30 text-amber-200 hover:bg-amber-500 hover:text-white animate-pulse"
                    : "border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                }
              >
                <a
                  href={`/painel-operador/${gerarSlugSessao(sessao.numero, sessao.data)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  {sessao.status === 'CONCLUIDA' ? 'Editar Dados' : 'Painel Operador'}
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </Button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-white hover:bg-slate-700"
              onClick={onRefresh}
              aria-label="Atualizar painel"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Cronometro e controles da sessao */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-blue-400" />
              <span className="text-2xl font-mono font-bold text-blue-400">{formatSeconds(cronometroSessao)}</span>
            </div>
            {currentItem && (
              <div className="flex items-center gap-2 border-l border-slate-600 pl-6">
                <span className="text-sm text-slate-400">Item atual:</span>
                <span className="font-medium text-white">{currentItem.titulo}</span>
                <Badge variant="outline" className="ml-2 border-slate-500 text-slate-300">
                  {formatSeconds(cronometroItem)}
                </Badge>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {sessao.status === 'AGENDADA' && (
              <Button
                onClick={onIniciarSessao}
                disabled={executando}
                className="bg-green-600 hover:bg-green-700"
              >
                <Play className="mr-2 h-4 w-4" /> Iniciar sessao
              </Button>
            )}
            {sessao.status === 'EM_ANDAMENTO' && (
              <>
                <Button
                  onClick={onFinalizarSessao}
                  disabled={executando}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Square className="mr-2 h-4 w-4" /> Finalizar sessao
                </Button>
                <Button
                  onClick={onCancelarSessao}
                  disabled={executando}
                  variant="outline"
                  className="border-red-400 text-red-400 hover:bg-red-950"
                >
                  Cancelar
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
