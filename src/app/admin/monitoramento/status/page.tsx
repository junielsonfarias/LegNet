'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Activity, RefreshCw, Zap } from 'lucide-react'

import { AdminBreadcrumbs } from '@/components/admin/admin-breadcrumbs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { monitoringApi } from '@/lib/api/monitoring-api'

interface StatusData {
  status: string
  timestamp: string
}

export default function MonitoramentoStatusPage() {
  const [data, setData] = useState<StatusData | null>(null)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const loadStatus = async () => {
    try {
      setLoading(true)
      const response = await monitoringApi.getStatus()
      setData(response.data ?? response)
    } catch (error: any) {
      toast.error(error?.message ?? 'Falha ao obter status de monitoramento.')
    } finally {
      setLoading(false)
    }
  }

  const handleSyncMetrics = async () => {
    try {
      setSyncing(true)
      await monitoringApi.syncMetrics()
      toast.success('Sincronização executada com sucesso.')
    } catch (error: any) {
      toast.error(error?.message ?? 'Não foi possível sincronizar métricas.')
    } finally {
      setSyncing(false)
    }
  }

  useEffect(() => {
    loadStatus()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <AdminBreadcrumbs />
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Zap className="h-8 w-8 text-camara-primary" aria-hidden="true" />
              Health Check &amp; Métricas
            </h1>
            <p className="mt-2 text-gray-600 max-w-2xl">
              Consulta rápida ao status do backend e gatilho para sincronização de métricas/logs estruturados.
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-camara-primary" aria-hidden="true" />
            Status atual
          </CardTitle>
          <CardDescription>
            Último heartbeat registrado pelo endpoint `/api/monitoramento`.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            {loading ? (
              <div className="flex items-center gap-2 text-gray-500">
                <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
                Carregando status...
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  {data?.status === 'ok' ? (
                    <span className="text-emerald-600">Sistema operacional</span>
                  ) : (
                    <span className="text-orange-600">Status desconhecido</span>
                  )}
                </p>
                <p className="text-sm text-gray-600">
                  Última atualização: {data?.timestamp ? new Date(data.timestamp).toLocaleString('pt-BR') : '—'}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={loadStatus}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} aria-hidden="true" />
              Atualizar status
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleSyncMetrics}
              disabled={syncing}
              className="flex items-center gap-2"
            >
              {syncing ? (
                <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Zap className="h-4 w-4" aria-hidden="true" />
              )}
              Sincronizar métricas
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

