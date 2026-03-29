'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Calendar, Clock, MapPin, Users, FileText, Edit, Trash2,
  Eye, Monitor, Layers, Play, ChevronRight, ExternalLink,
  ClipboardList
} from 'lucide-react'
import { gerarSlugSessao } from '@/lib/utils/sessoes-utils'
import {
  type SessaoLocal,
  SESSAO_STATUS_CONFIG,
  SESSAO_TIPO_CONFIG,
  formatDateTime
} from '../_types'

interface SessaoCardProps {
  sessao: SessaoLocal
  onEdit: (sessao: SessaoLocal) => void
  onView: (sessao: SessaoLocal) => void
  onDelete: (id: string) => void
  onManagePauta: (sessao: SessaoLocal) => void
  onOpenTemplateModal: (sessao: SessaoLocal) => void
  userRole?: string
}

export function SessaoCard({
  sessao,
  onEdit,
  onView,
  onDelete,
  onManagePauta,
  onOpenTemplateModal,
  userRole
}: SessaoCardProps) {
  const isOperador = userRole === 'OPERADOR'
  const canDelete = !isOperador

  const statusConfig = SESSAO_STATUS_CONFIG[sessao.status] || SESSAO_STATUS_CONFIG.AGENDADA
  const tipoConfig = SESSAO_TIPO_CONFIG[sessao.tipo] || SESSAO_TIPO_CONFIG.ORDINARIA

  const slug = gerarSlugSessao(sessao.numero, new Date(sessao.data))
  const totalItens = sessao.pautaSessao?.itens?.length || 0
  const totalPresencas = sessao.presencas?.length || 0
  const isAtiva = sessao.status === 'EM_ANDAMENTO' || sessao.status === 'SUSPENSA'
  const isAgendada = sessao.status === 'AGENDADA'
  const isFinalizada = sessao.status === 'CONCLUIDA' || sessao.status === 'CANCELADA'

  return (
    <Card className={`transition-all hover:shadow-md ${isAtiva ? 'ring-2 ring-emerald-400 shadow-emerald-100' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          {/* Info principal */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-bold text-lg text-gray-900">
                {sessao.numero}ª Sessao {tipoConfig.label}
              </h3>
              <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
              {sessao.finalizada && (
                <Badge variant="outline" className="text-gray-500">Finalizada</Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDateTime(sessao.data)}
              </span>
              {sessao.horarioInicio && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {sessao.horarioInicio}
                </span>
              )}
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {sessao.local || 'Local nao definido'}
              </span>
            </div>
          </div>

          {/* Botão principal (destaque) - abre em nova guia */}
          {isAtiva && (
            <a
              href={`/painel-operador/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-md shadow-sm transition-colors shrink-0"
            >
              <Monitor className="h-4 w-4" />
              Operar Sessao
              <ExternalLink className="h-3.5 w-3.5 ml-1 opacity-70" />
            </a>
          )}
          {isAgendada && (
            <a
              href={`/painel-operador/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 border border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-sm font-semibold rounded-md transition-colors shrink-0"
            >
              <Play className="h-4 w-4" />
              Iniciar Sessao
              <ExternalLink className="h-3.5 w-3.5 ml-1 opacity-50" />
            </a>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Stats compactos */}
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-gray-600">
            <Users className="h-4 w-4 text-gray-400" />
            <span>{sessao.presidente?.apelido || sessao.presidente?.nome || 'Presidente nao definido'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ClipboardList className="h-4 w-4 text-gray-400" />
            <span className={totalItens > 0 ? 'text-gray-600' : 'text-orange-600 font-medium'}>
              {totalItens > 0 ? `${totalItens} itens na pauta` : 'Pauta vazia'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600">
            <Users className="h-4 w-4 text-gray-400" />
            <span>{totalPresencas} presencas</span>
          </div>
        </div>

        {sessao.descricao && (
          <p className="text-sm text-gray-500 line-clamp-1">{sessao.descricao}</p>
        )}

        {/* Barra de ações */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
          <Button variant="ghost" size="sm" onClick={() => onView(sessao)} className="text-gray-600 hover:text-gray-900">
            <Eye className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">Detalhes</span>
          </Button>

          {!isFinalizada && (
            <Button variant="ghost" size="sm" onClick={() => onEdit(sessao)} className="text-gray-600 hover:text-gray-900">
              <Edit className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Editar</span>
            </Button>
          )}

          <Button variant="ghost" size="sm" onClick={() => onManagePauta(sessao)} className="text-blue-600 hover:text-blue-800 hover:bg-blue-50">
            <FileText className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">{totalItens > 0 ? 'Editar Pauta' : 'Criar Pauta'}</span>
          </Button>

          {!isFinalizada && (
            <Button variant="ghost" size="sm" onClick={() => onOpenTemplateModal(sessao)} className="text-gray-600 hover:text-gray-900">
              <Layers className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Template</span>
            </Button>
          )}

          {isFinalizada && (
            <a
              href={`/painel-operador/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-colors"
            >
              <Monitor className="h-4 w-4" />
              <span className="hidden sm:inline">Ver Painel</span>
            </a>
          )}

          <a
            href={`/painel-publico?sessaoId=${sessao.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Publico</span>
          </a>

          {canDelete && !isAtiva && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(sessao.id)}
              className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-auto"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Excluir</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
