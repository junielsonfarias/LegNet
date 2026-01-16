'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Activity, 
  Server, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Zap,
  Database,
  Globe,
  HardDrive,
  MemoryStick,
  Bell
} from 'lucide-react'
import { 
  apiMonitor, 
  runAllHealthChecks, 
  getAlerts,
  ApiMetrics,
  HealthCheck,
  SystemHealth
} from '@/lib/monitoring/api-monitor'

export default function MonitoramentoPage() {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [metrics, setMetrics] = useState<ApiMetrics[]>([])
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([])
  const [alerts, setAlerts] = useState<Array<{
    type: 'error' | 'warning' | 'info'
    message: string
    timestamp: Date
  }>>([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const refreshData = async () => {
    setLoading(true)
    
    try {
      // Executar health checks
      const healthResults = await runAllHealthChecks()
      setHealthChecks(healthResults)
      
      // Obter métricas
      const apiMetrics = apiMonitor.getMetrics()
      setMetrics(apiMetrics)
      
      // Obter health do sistema
      const systemHealthData = apiMonitor.getSystemHealth()
      setSystemHealth(systemHealthData)
      
      // Obter alertas
      const systemAlerts = getAlerts()
      setAlerts(systemAlerts)
      
    } catch (error) {
      console.error('Erro ao atualizar dados de monitoramento:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshData()
    
    if (autoRefresh) {
      const interval = setInterval(refreshData, 30000) // 30 segundos
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100'
      case 'degraded': return 'text-yellow-600 bg-yellow-100'
      case 'down': return 'text-red-600 bg-red-100'
      case 'unhealthy': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />
      case 'degraded': return <AlertTriangle className="h-4 w-4" />
      case 'down': case 'unhealthy': return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'info': return <CheckCircle className="h-4 w-4 text-blue-600" />
      default: return <Bell className="h-4 w-4" />
    }
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'error': return 'border-red-200 bg-red-50'
      case 'warning': return 'border-yellow-200 bg-yellow-50'
      case 'info': return 'border-blue-200 bg-blue-50'
      default: return 'border-gray-200 bg-gray-50'
    }
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${Math.round(ms / 1000)}s`
    if (ms < 3600000) return `${Math.round(ms / 60000)}min`
    return `${Math.round(ms / 3600000)}h`
  }

  const formatUptime = (ms: number) => {
    const days = Math.floor(ms / (24 * 60 * 60 * 1000))
    const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000))
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const summary = apiMonitor.getSummary()

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Activity className="h-8 w-8 text-blue-600" />
          Monitoramento do Sistema
        </h1>
        <p className="text-gray-600">
          Acompanhe a saúde e performance das APIs e serviços do sistema.
        </p>
      </div>

      {/* Controles */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button 
            onClick={refreshData} 
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Atualizar
          </Button>
          
          <Button
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="flex items-center gap-2"
          >
            <Zap className="h-4 w-4" />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
        </div>

        <Badge 
          className={`px-3 py-1 ${getStatusColor(systemHealth?.overall || 'unknown')}`}
        >
          <div className="flex items-center gap-2">
            {getStatusIcon(systemHealth?.overall || 'unknown')}
            {systemHealth?.overall?.toUpperCase() || 'UNKNOWN'}
          </div>
        </Badge>
      </div>

      {/* Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Requisições</p>
                <p className="text-2xl font-bold">{summary.totalRequests.toLocaleString()}</p>
              </div>
              <Server className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Taxa de Sucesso</p>
                <p className="text-2xl font-bold text-green-600">
                  {summary.successRate}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tempo Médio</p>
                <p className="text-2xl font-bold">{summary.averageResponseTime}ms</p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Uptime</p>
                <p className="text-2xl font-bold">{formatUptime(summary.uptime * 1000)}</p>
              </div>
              <Activity className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Health Checks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Status dos Serviços
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {healthChecks.map((check) => (
                <div key={check.name} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(check.status)}
                    <div>
                      <p className="font-medium">{check.name}</p>
                      <p className="text-sm text-gray-600">
                        {formatDuration(check.responseTime)}
                      </p>
                    </div>
                  </div>
                  <Badge className={`px-2 py-1 ${getStatusColor(check.status)}`}>
                    {check.status.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alertas Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.slice(0, 5).map((alert, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-lg border ${getAlertColor(alert.type)}`}
                >
                  <div className="flex items-start gap-3">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{alert.message}</p>
                      <p className="text-xs text-gray-600">
                        {alert.timestamp.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {alerts.length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  Nenhum alerta ativo
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métricas das APIs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Métricas das APIs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Endpoint</th>
                  <th className="text-left p-3 font-medium">Método</th>
                  <th className="text-left p-3 font-medium">Requisições</th>
                  <th className="text-left p-3 font-medium">Taxa de Sucesso</th>
                  <th className="text-left p-3 font-medium">Tempo Médio</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Última Requisição</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((metric, index) => {
                  const successRate = (metric.successfulRequests / metric.totalRequests) * 100
                  return (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-mono text-sm">{metric.endpoint}</td>
                      <td className="p-3">
                        <Badge variant="outline">{metric.method}</Badge>
                      </td>
                      <td className="p-3">{metric.totalRequests.toLocaleString()}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Progress value={successRate} className="w-20 h-2" />
                          <span className="text-sm">{Math.round(successRate)}%</span>
                        </div>
                      </td>
                      <td className="p-3">{Math.round(metric.averageResponseTime)}ms</td>
                      <td className="p-3">
                        <Badge className={`px-2 py-1 ${getStatusColor(metric.status)}`}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(metric.status)}
                            {metric.status.toUpperCase()}
                          </div>
                        </Badge>
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {metric.lastRequest?.toLocaleString() || 'N/A'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {metrics.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                Nenhuma métrica disponível
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Informações do Sistema */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Banco de Dados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                <Badge className="bg-green-100 text-green-800">Conectado</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Conexões:</span>
                <span className="text-sm">5/20</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Tempo de resposta:</span>
                <span className="text-sm">12ms</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Serviços Externos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">API Externa 1:</span>
                <Badge className="bg-green-100 text-green-800">Online</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">API Externa 2:</span>
                <Badge className="bg-green-100 text-green-800">Online</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">CDN:</span>
                <Badge className="bg-green-100 text-green-800">Online</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Recursos do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">CPU:</span>
                <span className="text-sm">15%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Memória:</span>
                <span className="text-sm">2.1GB / 8GB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Disco:</span>
                <span className="text-sm">45GB / 100GB</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
