'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Monitor,
  Clock,
  Calendar,
  ExternalLink,
  Share2,
  Tv
} from 'lucide-react'
import type { PainelHeaderProps } from '../_types'
import { formatarTempo, getStatusColor } from '../_types'

export function PainelHeader({
  sessao,
  tempoSessao,
  cronometroAtivo,
  transmissaoAtiva,
  onAbrirPainelPublico,
  onIniciarTransmissao,
  onPararTransmissao
}: PainelHeaderProps) {
  if (!sessao) {
    return (
      <Card className="border-l-4 border-l-gray-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-6 w-6" />
            Painel Eletrônico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Selecione uma sessão para começar</p>
        </CardContent>
      </Card>
    )
  }

  const statusColor = sessao.status === 'em_andamento' ? 'border-l-green-500' :
                      sessao.status === 'agendada' ? 'border-l-blue-500' :
                      sessao.status === 'concluida' ? 'border-l-gray-500' : 'border-l-red-500'

  return (
    <Card className={`border-l-4 ${statusColor}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-6 w-6" />
            {sessao.numeroSessao} - Sessão {sessao.tipo.charAt(0).toUpperCase() + sessao.tipo.slice(1)}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(sessao.status)}>
              {sessao.status === 'em_andamento' ? 'Em Andamento' :
               sessao.status === 'agendada' ? 'Agendada' :
               sessao.status === 'concluida' ? 'Concluída' : 'Cancelada'}
            </Badge>
            {cronometroAtivo && (
              <Badge variant="outline" className="font-mono">
                <Clock className="h-3 w-3 mr-1" />
                {formatarTempo(tempoSessao)}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Aviso para sessão agendada */}
        {sessao.status === 'agendada' && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Sessão agendada.</strong> Clique em &quot;Iniciar Sessão&quot; no painel de controles acima para começar.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Informações da Sessão */}
          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>{sessao.data.toLocaleDateString('pt-BR')}</span>
              <span className="mx-2">•</span>
              <span>{sessao.horarioInicio}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              <strong>Local:</strong> {sessao.local}
            </div>
            <div className="text-sm text-muted-foreground">
              <strong>Presidente:</strong>{' '}
              {sessao.presidente && sessao.presidente !== 'Não definido' ? (
                sessao.presidente
              ) : (
                <span className="italic text-amber-600">A definir</span>
              )}
            </div>
          </div>

          {/* Estatísticas */}
          <div className="flex items-center justify-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {sessao.estatisticas.presentes}
              </div>
              <div className="text-xs text-muted-foreground">Presentes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {sessao.estatisticas.ausentes}
              </div>
              <div className="text-xs text-muted-foreground">Ausentes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {!isNaN(sessao.estatisticas.percentualPresenca) ? sessao.estatisticas.percentualPresenca : 0}%
              </div>
              <div className="text-xs text-muted-foreground">Quórum</div>
            </div>
          </div>

          {/* Ações Rápidas */}
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onAbrirPainelPublico}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Painel Público
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`/painel-tv/${sessao.id}`, '_blank')}
            >
              <Tv className="h-4 w-4 mr-2" />
              Painel TV
            </Button>
            {!transmissaoAtiva ? (
              <Button
                size="sm"
                onClick={onIniciarTransmissao}
                className="bg-red-600 hover:bg-red-700"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Iniciar Live
              </Button>
            ) : (
              <Button
                size="sm"
                variant="destructive"
                onClick={onPararTransmissao}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Parar Live
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
