'use client'

import { useMemo } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Workflow,
  RefreshCw,
  Clock,
  TrendingUp,
  Building2,
  GitBranch
} from 'lucide-react'

import { useTramitacaoDashboard } from '@/lib/hooks/use-tramitacoes'
import { formatDateOnly } from '@/lib/utils/date'

const formatDate = (value?: string | null) => {
  if (!value) return '—'
  try {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  } catch (error) {
    console.error('Erro ao formatar data:', error)
    return '—'
  }
}

const formatDiasRestantes = (dias: number | null | undefined) => {
  if (dias === null || dias === undefined) return '—'
  if (dias === 0) return 'Vence hoje'
  if (dias < 0) return `${Math.abs(dias)} dia(s) vencido(s)`
  return `${dias} dia(s)`
}

export default function TramitationDashboardPage() {
  const { dashboard, loading, error, refetch } = useTramitacaoDashboard()

  const resumoCards = useMemo(() => {
    if (!dashboard) return []
    return [
      { label: 'Total', value: dashboard.resumo.total, color: 'text-blue-600' },
      { label: 'Em andamento', value: dashboard.resumo.emAndamento, color: 'text-indigo-600' },
      { label: 'Concluídas', value: dashboard.resumo.concluidas, color: 'text-emerald-600' },
      { label: 'Canceladas', value: dashboard.resumo.canceladas, color: 'text-red-600' },
      { label: 'Vencidas', value: dashboard.resumo.vencidas, color: 'text-orange-600' },
      {
        label: 'Tempo médio (dias)',
        value: dashboard.resumo.tempoMedioConclusao ?? '—',
        color: 'text-purple-600'
      }
    ]
  }, [dashboard])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Workflow className="h-8 w-8 text-camara-primary" />
            Dashboard de tramitação
          </h1>
          <p className="text-gray-600 mt-1">
            Monitoramento em tempo real dos fluxos de tramitação legislativa.
          </p>
        </div>
        <Button variant="outline" onClick={refetch}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {error && (
        <Card>
          <CardContent className="py-3 text-red-600 text-sm">
            {error}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading && resumoCards.length === 0 ? (
          Array.from({ length: 6 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-6 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-100 rounded w-1/3" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          resumoCards.map(card => (
            <Card key={card.label}>
              <CardContent className="pt-6">
                <div className={`text-2xl font-bold ${card.color}`}>
                  {card.value}
                </div>
                <p className="text-sm text-gray-600">{card.label}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Clock className="h-5 w-5 text-camara-primary" />
              Próximos vencimentos
            </CardTitle>
            <span className="text-sm text-gray-500">
              {dashboard?.proximosVencimentos.length ?? 0} registros
            </span>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="animate-pulse h-14 bg-gray-100 rounded-md" />
              ))
            ) : dashboard && dashboard.proximosVencimentos.length > 0 ? (
              dashboard.proximosVencimentos.map(item => (
                <div key={item.id} className="border border-gray-200 rounded-md p-3 text-sm text-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <div className="font-semibold text-gray-900 flex items-center gap-2">
                      {item.proposicaoId}
                      <Badge variant={item.diasRestantes !== null && item.diasRestantes <= 0 ? 'destructive' : 'secondary'}>
                        {formatDiasRestantes(item.diasRestantes)}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500 flex flex-wrap gap-3">
                      {item.tipoTramitacao && <span>{item.tipoTramitacao}</span>}
                      {item.unidade && <span>{item.unidade}</span>}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Prazo: {formatDate(item.prazoVencimento)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500 py-6 text-center">
                Nenhuma tramitação com vencimento próximo.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <TrendingUp className="h-5 w-5 text-camara-primary" />
              Distribuição por tipo
            </CardTitle>
            <span className="text-sm text-gray-500">
              {dashboard?.porTipo.length ?? 0} tipos
            </span>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="animate-pulse h-12 bg-gray-100 rounded-md" />
              ))
            ) : dashboard && dashboard.porTipo.length > 0 ? (
              dashboard.porTipo.map(item => (
                <div key={item.tipoTramitacaoId} className="border border-gray-200 rounded-md p-3 text-sm text-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-gray-900">{item.tipoTramitacaoNome}</div>
                    <div className="text-xs text-gray-500">{item.total} total</div>
                  </div>
                  <div className="flex gap-3 text-xs text-gray-500 mt-1">
                    <span>Em andamento: {item.emAndamento}</span>
                    <span>Concluídas: {item.concluidas}</span>
                    <span>Canceladas: {item.canceladas}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500 py-6 text-center">
                Nenhum dado disponível para os tipos de tramitação.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Building2 className="h-5 w-5 text-camara-primary" />
            Distribuição por unidade responsável
          </CardTitle>
          <span className="text-sm text-gray-500">
            {dashboard?.porUnidade.length ?? 0} unidades
          </span>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="animate-pulse h-12 bg-gray-100 rounded-md" />
            ))
          ) : dashboard && dashboard.porUnidade.length > 0 ? (
            dashboard.porUnidade.map(item => (
              <div key={item.unidadeId} className="border border-gray-200 rounded-md p-3 text-sm text-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <div className="font-semibold text-gray-900 flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-camara-primary" />
                    {item.unidadeNome}
                  </div>
                  <div className="text-xs text-gray-500">
                    Total: {item.total}
                  </div>
                </div>
                <div className="text-xs text-gray-500 flex flex-wrap gap-3">
                  <span>Em andamento: {item.emAndamento}</span>
                  <span>Concluídas: {item.concluidas}</span>
                  <span>Canceladas: {item.canceladas}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500 py-6 text-center">
              Nenhuma unidade registrada no momento.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


