'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, MapPin, Users, FileText, Edit, Trash2, Eye, Monitor, Layers } from 'lucide-react'
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
}

export function SessaoCard({
  sessao,
  onEdit,
  onView,
  onDelete,
  onManagePauta,
  onOpenTemplateModal
}: SessaoCardProps) {
  const router = useRouter()

  const statusConfig = SESSAO_STATUS_CONFIG[sessao.status] || SESSAO_STATUS_CONFIG.AGENDADA
  const tipoConfig = SESSAO_TIPO_CONFIG[sessao.tipo] || SESSAO_TIPO_CONFIG.ORDINARIA

  const handleOpenPanel = () => {
    const slug = gerarSlugSessao(sessao.numero, new Date(sessao.data))
    router.push(`/admin/painel-eletronico/${slug}`)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              {sessao.numero}ª Sessão {sessao.tipo}
              <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
              <Badge className={tipoConfig.color}>{tipoConfig.label}</Badge>
              {sessao.finalizada && (
                <Badge className="bg-gray-100 text-gray-800">Finalizada</Badge>
              )}
            </CardTitle>
            <CardDescription className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDateTime(sessao.data)}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {sessao.local || 'Local não definido'}
              </span>
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView(sessao)}
              title="Visualizar"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(sessao)}
              title="Editar"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onManagePauta(sessao)}
              title="Gerenciar Pauta"
            >
              <FileText className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenTemplateModal(sessao)}
              title="Aplicar Template"
            >
              <Layers className="h-4 w-4" />
            </Button>
            {sessao.status === 'AGENDADA' || sessao.status === 'EM_ANDAMENTO' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenPanel}
                title="Painel Eletrônico"
              >
                <Monitor className="h-4 w-4" />
              </Button>
            ) : null}
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(sessao.id)}
              title="Excluir"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500" />
            <span className="text-sm">
              Presidente: {sessao.presidente?.nome || 'Não definido'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-500" />
            <span className="text-sm">
              {sessao.pautaSessao?.itens?.length || 0} itens na pauta
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-sm">
              {sessao.presencas?.length || 0} presenças registradas
            </span>
          </div>
        </div>
        {sessao.descricao && (
          <p className="text-sm text-gray-600 mt-4">{sessao.descricao}</p>
        )}
      </CardContent>
    </Card>
  )
}
