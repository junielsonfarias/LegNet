'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  Calendar,
  MapPin,
  User,
  CheckCircle,
  Edit,
  Trash2,
  Eye
} from 'lucide-react'
import type { AudienciaPublica } from '../types'
import { getStatusColor, getTipoColor, getStatusLabel, getTipoLabel } from '../types'

interface AudienciaCardProps {
  audiencia: AudienciaPublica
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}

export function AudienciaCard({ audiencia, onView, onEdit, onDelete }: AudienciaCardProps) {
  return (
    <Card className="camara-card">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2 flex-wrap gap-y-2">
              <h3 className="text-xl font-semibold text-gray-900">{audiencia.titulo}</h3>
              <Badge className={getStatusColor(audiencia.status)}>
                {getStatusLabel(audiencia.status)}
              </Badge>
              <Badge className={getTipoColor(audiencia.tipo)}>
                {getTipoLabel(audiencia.tipo)}
              </Badge>
              <Badge variant="secondary">{audiencia.numero}</Badge>
              {audiencia.materiaLegislativaId && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Vinculada
                </Badge>
              )}
              {audiencia.transmissaoAoVivo?.ativa && (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  Ao Vivo
                </Badge>
              )}
              {audiencia.inscricoesPublicas?.ativa && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Inscricoes Abertas
                </Badge>
              )}
            </div>

            <p className="text-gray-600 mb-4">{audiencia.descricao}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                {new Date(audiencia.dataHora).toLocaleDateString('pt-BR')} as{' '}
                {new Date(audiencia.dataHora).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                {audiencia.local}
              </div>
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                {audiencia.responsavel}
              </div>
            </div>

            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                {audiencia.participantes.length} participantes
              </div>
              {audiencia.participantes.filter(p => p.confirmado).length > 0 && (
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                  {audiencia.participantes.filter(p => p.confirmado).length} confirmados
                </div>
              )}
            </div>

            {/* Informacoes Adicionais */}
            <div className="space-y-2 text-sm">
              {audiencia.materiaLegislativaId && (
                <div className="text-blue-600">
                  <strong>Vinculada a:</strong> Proposicao {audiencia.materiaLegislativaId}
                </div>
              )}
              {audiencia.transmissaoAoVivo?.ativa && audiencia.transmissaoAoVivo.url && (
                <div className="text-red-600">
                  <strong>Transmissao:</strong> {audiencia.transmissaoAoVivo.plataforma}
                </div>
              )}
              {audiencia.inscricoesPublicas?.ativa && (
                <div className="text-green-600">
                  <strong>Inscricoes:</strong> {audiencia.inscricoesPublicas.totalInscritos} inscritos
                  {audiencia.inscricoesPublicas.dataLimite && (
                    <span> - Limite: {new Date(audiencia.inscricoesPublicas.dataLimite).toLocaleDateString('pt-BR')}</span>
                  )}
                </div>
              )}
              {audiencia.documentos && audiencia.documentos.length > 0 && (
                <div className="text-gray-600">
                  <strong>Documentos:</strong> {audiencia.documentos.length} anexo(s)
                </div>
              )}
              {audiencia.cronograma && (
                <div className="text-gray-600">
                  <strong>Cronograma:</strong> {audiencia.cronograma.blocos?.length || 0} blocos programados
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 ml-4">
            <Button variant="outline" size="sm" onClick={onView}>
              <Eye className="h-4 w-4 mr-1" />
              Ver
            </Button>
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-1" />
              Editar
            </Button>
            <Button variant="outline" size="sm" onClick={onDelete}>
              <Trash2 className="h-4 w-4 mr-1" />
              Excluir
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
