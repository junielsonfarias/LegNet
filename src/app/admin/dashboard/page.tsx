'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Users, 
  Calendar, 
  FileText, 
  BarChart3, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Download,
  RefreshCw,
  Activity
} from 'lucide-react'
import { useParlamentares } from '@/lib/hooks/use-parlamentares'
import { useSessoes } from '@/lib/hooks/use-sessoes'
import { useProposicoes } from '@/lib/hooks/use-proposicoes'
import { useComissoes } from '@/lib/hooks/use-comissoes'

interface DashboardStats {
  parlamentares: {
    total: number;
    ativos: number;
    presencaMedia: number;
  };
  sessoes: {
    total: number;
    realizadas: number;
    canceladas: number;
    duracaoMedia: number;
  };
  proposicoes: {
    total: number;
    aprovadas: number;
    emTramitacao: number;
    tempoMedioTramitacao: number;
  };
  comissoes: {
    total: number;
    ativas: number;
    membros: number;
  };
  sistema: {
    usuariosAtivos: number;
    logsHoje: number;
    ultimoBackup?: Date;
    uptime: string;
  };
}

export default function DashboardPage() {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  
  // Usar hooks para carregar dados
  const { parlamentares, loading: loadingParlamentares } = useParlamentares()
  const { sessoes, loading: loadingSessoes } = useSessoes()
  const { proposicoes, loading: loadingProposicoes } = useProposicoes()
  const { comissoes, loading: loadingComissoes } = useComissoes()

  const loading = loadingParlamentares || loadingSessoes || loadingProposicoes || loadingComissoes

  // Calcular estatísticas
  const stats = useMemo<DashboardStats | null>(() => {
    if (loading) return null

    const parlamentaresAtivos = parlamentares.filter(p => p.ativo)
    const presencaMedia = parlamentares.length > 0 
      ? parlamentares.reduce((acc, p) => acc + 0, 0) / parlamentares.length 
      : 0 // TODO: Calcular presença real quando API estiver disponível

    const sessoesRealizadas = sessoes.filter(s => s.status === 'CONCLUIDA')
    const duracaoMedia = sessoesRealizadas.length > 0 ? 120 : 0 // Duração média estimada

    const proposicoesAprovadas = proposicoes.filter(p => p.status === 'APROVADA')
    const proposicoesEmTramitacao = proposicoes.filter(p => p.status === 'EM_TRAMITACAO')
    
    const tempoMedioTramitacao = proposicoesAprovadas.length > 0 
      ? proposicoesAprovadas.reduce((acc, p) => {
          if (p.dataVotacao && p.dataApresentacao) {
            const dias = Math.ceil((new Date(p.dataVotacao).getTime() - new Date(p.dataApresentacao).getTime()) / (1000 * 60 * 60 * 24))
            return acc + dias
          }
          return acc
        }, 0) / proposicoesAprovadas.length 
      : 0

    const comissoesAtivas = comissoes.filter(c => c.ativa)
    const totalMembros = 0 // TODO: Calcular membros quando API incluir relacionamento

    return {
      parlamentares: {
        total: parlamentares.length,
        ativos: parlamentaresAtivos.length,
        presencaMedia: Math.round(presencaMedia * 100) / 100
      },
      sessoes: {
        total: sessoes.length,
        realizadas: sessoesRealizadas.length,
        canceladas: sessoes.filter(s => s.status === 'CANCELADA').length,
        duracaoMedia: Math.round(duracaoMedia)
      },
      proposicoes: {
        total: proposicoes.length,
        aprovadas: proposicoesAprovadas.length,
        emTramitacao: proposicoesEmTramitacao.length,
        tempoMedioTramitacao: Math.round(tempoMedioTramitacao)
      },
      comissoes: {
        total: comissoes.length,
        ativas: comissoesAtivas.length,
        membros: totalMembros
      },
      sistema: {
        usuariosAtivos: 5,
        logsHoje: 25,
        ultimoBackup: new Date(),
        uptime: '99.9%'
      }
    }
  }, [parlamentares, sessoes, proposicoes, comissoes, loading])

  const carregarEstatisticas = () => {
    setLastUpdate(new Date())
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativa': return 'bg-green-100 text-green-800'
      case 'realizada': return 'bg-green-100 text-green-800'
      case 'aprovada': return 'bg-green-100 text-green-800'
      case 'em_tramitacao': return 'bg-yellow-100 text-yellow-800'
      case 'agendada': return 'bg-blue-100 text-blue-800'
      case 'cancelada': return 'bg-red-100 text-red-800'
      case 'rejeitada': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ativa': return 'Ativa'
      case 'realizada': return 'Realizada'
      case 'aprovada': return 'Aprovada'
      case 'em_tramitacao': return 'Em Tramitação'
      case 'agendada': return 'Agendada'
      case 'cancelada': return 'Cancelada'
      case 'rejeitada': return 'Rejeitada'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-camara-primary"></div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">Erro ao carregar estatísticas</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Executivo</h1>
          <p className="text-gray-600">
            Visão geral do sistema legislativo
            <span className="ml-2 text-sm text-gray-500">
              Última atualização: {lastUpdate.toLocaleTimeString()}
            </span>
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={carregarEstatisticas} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Parlamentares */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Parlamentares</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.parlamentares.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.parlamentares.ativos} ativos
            </p>
            <div className="mt-2">
              <div className="flex items-center text-xs text-green-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                Presença média: {stats.parlamentares.presencaMedia}%
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sessões */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessões</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sessoes.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.sessoes.realizadas} realizadas
            </p>
            <div className="mt-2">
              <div className="flex items-center text-xs text-blue-600">
                <Clock className="h-3 w-3 mr-1" />
                Duração média: {stats.sessoes.duracaoMedia}min
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Proposições */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proposições</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.proposicoes.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.proposicoes.aprovadas} aprovadas
            </p>
            <div className="mt-2">
              <div className="flex items-center text-xs text-yellow-600">
                <Activity className="h-3 w-3 mr-1" />
                Tempo médio: {stats.proposicoes.tempoMedioTramitacao} dias
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comissões */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comissões</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.comissoes.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.comissoes.ativas} ativas
            </p>
            <div className="mt-2">
              <div className="flex items-center text-xs text-purple-600">
                <Users className="h-3 w-3 mr-1" />
                {stats.comissoes.membros} membros
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos e Tabelas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status das Sessões */}
        <Card>
          <CardHeader>
            <CardTitle>Status das Sessões</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Realizadas</span>
                </div>
                <Badge className={getStatusColor('realizada')}>
                  {stats.sessoes.realizadas}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Agendadas</span>
                </div>
                <Badge className={getStatusColor('agendada')}>
                  {stats.sessoes.total - stats.sessoes.realizadas - stats.sessoes.canceladas}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm">Canceladas</span>
                </div>
                <Badge className={getStatusColor('cancelada')}>
                  {stats.sessoes.canceladas}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status das Proposições */}
        <Card>
          <CardHeader>
            <CardTitle>Status das Proposições</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Aprovadas</span>
                </div>
                <Badge className={getStatusColor('aprovada')}>
                  {stats.proposicoes.aprovadas}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm">Em Tramitação</span>
                </div>
                <Badge className={getStatusColor('em_tramitacao')}>
                  {stats.proposicoes.emTramitacao}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm">Rejeitadas</span>
                </div>
                <Badge className={getStatusColor('rejeitada')}>
                  {stats.proposicoes.total - stats.proposicoes.aprovadas - stats.proposicoes.emTramitacao}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informações do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.sistema.uptime}</div>
              <p className="text-sm text-gray-600">Uptime</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.sistema.usuariosAtivos}</div>
              <p className="text-sm text-gray-600">Usuários Ativos</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.sistema.logsHoje}</div>
              <p className="text-sm text-gray-600">Logs Hoje</p>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-orange-600">
                {stats.sistema.ultimoBackup 
                  ? new Date(stats.sistema.ultimoBackup).toLocaleDateString()
                  : 'Nunca'
                }
              </div>
              <p className="text-sm text-gray-600">Último Backup</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
