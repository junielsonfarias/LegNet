'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit, Trash2, Eye, ArrowRight, Calendar, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  type ProposicaoApi,
  type TipoProposicaoConfig,
  STATUS_COLORS,
  getTipoSigla,
  getTipoBadgeStyle,
  formatarStatus
} from '../_types'
import { gerarSlugProposicao } from '@/lib/utils/proposicao-slug'

interface ProposicaoCardProps {
  proposicao: ProposicaoApi
  tiposProposicao: TipoProposicaoConfig[]
  parlamentares: { id: string; nome: string }[]
  statusDetalhado: { status: string; unidadeAtual: string | null } | null
  onEdit: (proposicao: ProposicaoApi) => void
  onDelete: (id: string) => void
  onTramitar: (proposicao: ProposicaoApi) => void
}

export function ProposicaoCard({
  proposicao,
  tiposProposicao,
  parlamentares,
  statusDetalhado,
  onEdit,
  onDelete,
  onTramitar
}: ProposicaoCardProps) {
  const router = useRouter()

  const autor = proposicao.autor?.nome || parlamentares.find(p => p.id === proposicao.autorId)?.nome || 'Autor não encontrado'
  const tipoSigla = getTipoSigla(proposicao.tipo, tiposProposicao)
  const { style: tipoBadgeStyle, className: tipoBadgeClass } = getTipoBadgeStyle(proposicao.tipo, tiposProposicao)
  const statusColor = STATUS_COLORS[proposicao.status] || 'bg-gray-100 text-gray-800 border-gray-200'

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Informações Principais */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {/* Badge do Tipo */}
            <Badge
              className={`text-xs font-semibold ${tipoBadgeClass}`}
              style={tipoBadgeStyle}
            >
              {tipoSigla} {proposicao.numero}/{proposicao.ano}
            </Badge>
            {/* Status */}
            <Badge className={`${statusColor} border`}>
              {formatarStatus(proposicao.status)}
            </Badge>
            {/* Status de tramitação */}
            {statusDetalhado && (
              <Badge variant="outline" className="text-xs">
                {statusDetalhado.unidadeAtual || 'Em tramitação'}
              </Badge>
            )}
          </div>

          {/* Título */}
          <h3 className="font-semibold text-gray-900 truncate mb-1">
            {proposicao.titulo}
          </h3>

          {/* Ementa */}
          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
            {proposicao.ementa}
          </p>

          {/* Metadados */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{autor}</span>
            </div>
            {proposicao.dataApresentacao && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>
                  {new Date(proposicao.dataApresentacao).toLocaleDateString('pt-BR')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              const slug = proposicao.slug || gerarSlugProposicao(proposicao.tipo, proposicao.numero, proposicao.ano)
              router.push(`/admin/proposicoes/${slug}`)
            }}
            title="Visualizar"
          >
            <Eye className="h-4 w-4 text-gray-500" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(proposicao)}
            title="Editar"
          >
            <Edit className="h-4 w-4 text-blue-500" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onTramitar(proposicao)}
            title="Tramitar"
          >
            <ArrowRight className="h-4 w-4 text-green-500" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(proposicao.id)}
            title="Excluir"
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>
    </div>
  )
}
