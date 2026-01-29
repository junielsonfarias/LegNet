'use client'

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
  Download,
  RefreshCw,
  Activity
} from 'lucide-react'
import { useDashboardStats } from '@/lib/hooks/use-dashboard'

export default function DashboardPage() {
  const { stats, loading, refetch } = useDashboardStats()

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
        <Button onClick={refetch} variant="outline" className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar Novamente
        </Button>
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
            Visão geral do sistema legislativo - {stats.instituicao.nome}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={refetch} variant="outline" size="sm">
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
                {stats.sessoes.agendadas} agendadas
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
                {stats.proposicoes.emTramitacao} em tramitação
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
                  {stats.sessoes.agendadas}
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
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Pendentes</span>
                </div>
                <Badge className={getStatusColor('agendada')}>
                  {stats.proposicoes.pendentes}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm">Rejeitadas</span>
                </div>
                <Badge className={getStatusColor('rejeitada')}>
                  {stats.proposicoes.rejeitadas}
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
              <div className="text-2xl font-bold text-blue-600">{stats.sistema.usuarios}</div>
              <p className="text-sm text-gray-600">Usuários Cadastrados</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.sistema.logsHoje}</div>
              <p className="text-sm text-gray-600">Logs Hoje</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.hoje.votacoes}</div>
              <p className="text-sm text-gray-600">Votações Hoje</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legislatura Atual */}
      {stats.instituicao.legislatura && (
        <Card>
          <CardHeader>
            <CardTitle>Legislatura Atual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold">
                  {stats.instituicao.legislatura.numero}ª Legislatura ({stats.instituicao.legislatura.descricao})
                </p>
                {stats.instituicao.legislatura.periodoAtual && (
                  <p className="text-sm text-gray-600">
                    {stats.instituicao.legislatura.periodoAtual.descricao}
                  </p>
                )}
              </div>
              <Badge className="bg-green-100 text-green-800">Ativa</Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
