import Link from 'next/link'
import { esicService } from '@/lib/services/esic-service'
import { createLogger } from '@/lib/logging/logger'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, ArrowLeft, FileSearch, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { TransparenciaPageWrapper } from '@/components/transparencia/transparencia-page-wrapper'

const log = createLogger('transparencia/esic-estatisticas')

export const dynamic = 'force-dynamic'

const statusLabels: Record<string, string> = {
  ABERTO: 'Aberto',
  EM_ANALISE: 'Em Analise',
  PRORROGADO: 'Prorrogado',
  RESPONDIDO: 'Respondido',
  NEGADO: 'Negado',
  RECURSO: 'Em Recurso',
  RECURSO_PRIMEIRA_INSTANCIA: 'Recurso 1ª Instancia',
  RECURSO_SEGUNDA_INSTANCIA: 'Recurso 2ª Instancia',
}

interface Estatisticas {
  total: number
  porStatus: { status: string; quantidade: number }[]
  tempoMedioRespostaDias: number
  vencidas: number
}

const EMPTY: Estatisticas = { total: 0, porStatus: [], tempoMedioRespostaDias: 0, vencidas: 0 }

export default async function EstatisticasESICPage() {
  let estatisticas: Estatisticas = EMPTY

  try {
    estatisticas = await esicService.estatisticas()
  } catch (error) {
    log.error('Erro ao calcular estatisticas do e-SIC', error)
  }

  const countDe = (status: string) =>
    estatisticas.porStatus.find((s) => s.status === status)?.quantidade ?? 0

  const atendidos = countDe('RESPONDIDO')
  const indeferidos = countDe('NEGADO')

  return (
    <TransparenciaPageWrapper slug="estatisticas-esic" nome="Estatisticas do e-SIC">
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Link
          href="/transparencia"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar ao Portal da Transparencia
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            Relatorio Estatistico do e-SIC
          </h1>
          <p className="text-muted-foreground">
            Indicadores dos pedidos de acesso a informacao (LAI, Lei nº 12.527/2011 —
            Art. 30, inciso III).
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <FileSearch className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pedidos Recebidos</p>
                  <p className="text-2xl font-bold">{estatisticas.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Atendidos</p>
                  <p className="text-2xl font-bold">{atendidos}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Indeferidos</p>
                  <p className="text-2xl font-bold">{indeferidos}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tempo Medio de Resposta</p>
                  <p className="text-2xl font-bold">
                    {estatisticas.tempoMedioRespostaDias}{' '}
                    <span className="text-base font-normal text-muted-foreground">dias</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuicao por Situacao</CardTitle>
          </CardHeader>
          <CardContent>
            {estatisticas.porStatus.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados disponiveis.</p>
            ) : (
              <ul className="space-y-3">
                {estatisticas.porStatus.map((s) => {
                  const pct =
                    estatisticas.total > 0
                      ? Math.round((s.quantidade / estatisticas.total) * 100)
                      : 0
                  return (
                    <li key={s.status}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>{statusLabels[s.status] || s.status}</span>
                        <span className="text-muted-foreground">
                          {s.quantidade} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-camara-primary"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
            {estatisticas.vencidas > 0 && (
              <p className="text-sm text-red-600 mt-4">
                {estatisticas.vencidas} solicitacao(oes) em andamento com prazo de
                resposta vencido.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    </TransparenciaPageWrapper>
  )
}
