'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Play,
  Square,
  Download,
  RefreshCw,
  Wifi,
  WifiOff,
  Volume2,
  VolumeX,
  Camera,
  CameraOff
} from 'lucide-react'
import type { PainelControlesProps } from '../_types'
import { getStatusColor } from '../_types'

export function PainelControles({
  sessao,
  sessoesDisponiveis,
  sessaoSelecionada,
  autoRefresh,
  audioAtivo,
  videoAtivo,
  loading,
  onSessaoChange,
  onAutoRefreshChange,
  onIniciarSessao,
  onFinalizarSessao,
  onGerarRelatorio,
  onToggleAudio,
  onToggleVideo,
  onCarregarDados
}: PainelControlesProps) {
  const sessaoEmAndamento = sessao?.status === 'em_andamento'
  const sessaoAgendada = sessao?.status === 'agendada'

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Seletor de Sessão */}
          <div className="flex-1 min-w-[200px]">
            <Select value={sessaoSelecionada} onValueChange={onSessaoChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma sessão" />
              </SelectTrigger>
              <SelectContent>
                {sessoesDisponiveis.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.numero}ª {s.tipo} - {new Date(s.data).toLocaleDateString('pt-BR')}
                    {s.status === 'EM_ANDAMENTO' && (
                      <Badge className="ml-2 bg-green-100 text-green-800">Em Andamento</Badge>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status da Sessão */}
          {sessao && (
            <Badge className={getStatusColor(sessao.status)}>
              {sessao.status === 'em_andamento' ? 'Em Andamento' :
               sessao.status === 'agendada' ? 'Agendada' :
               sessao.status === 'concluida' ? 'Concluída' : 'Cancelada'}
            </Badge>
          )}

          {/* Controles de Sessão */}
          <div className="flex items-center gap-2">
            {sessaoAgendada && (
              <Button
                onClick={() => {
                  if (sessao) {
                    onIniciarSessao(sessao.id, sessao.numeroSessao, sessao.data)
                  }
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <Play className="h-4 w-4 mr-2" />
                Iniciar Sessão
              </Button>
            )}

            {sessaoEmAndamento && (
              <Button
                onClick={onFinalizarSessao}
                variant="destructive"
              >
                <Square className="h-4 w-4 mr-2" />
                Finalizar Sessão
              </Button>
            )}

            {(sessao?.status === 'concluida' || sessao?.status === 'cancelada') && (
              <span className="text-sm text-muted-foreground italic">
                Sessão {sessao.status === 'concluida' ? 'concluída' : 'cancelada'}
              </span>
            )}
          </div>

          {/* Controles de Mídia */}
          <div className="flex items-center gap-2 border-l pl-4">
            <Button
              variant="outline"
              size="icon"
              onClick={onToggleAudio}
              title={audioAtivo ? 'Desativar Áudio' : 'Ativar Áudio'}
            >
              {audioAtivo ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={onToggleVideo}
              title={videoAtivo ? 'Desativar Vídeo' : 'Ativar Vídeo'}
            >
              {videoAtivo ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
            </Button>
          </div>

          {/* Controles Gerais */}
          <div className="flex items-center gap-2 border-l pl-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onAutoRefreshChange(!autoRefresh)}
              title={autoRefresh ? 'Desativar Auto-Refresh' : 'Ativar Auto-Refresh'}
            >
              {autoRefresh ? <Wifi className="h-4 w-4 text-green-600" /> : <WifiOff className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={onCarregarDados}
              disabled={loading}
              title="Atualizar Dados"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={onGerarRelatorio}
              disabled={!sessao}
              title="Gerar Relatório"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
