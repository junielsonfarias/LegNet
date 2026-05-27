import Link from 'next/link'
import { ouvidoriaService } from '@/lib/services/ouvidoria-service'
import { createLogger } from '@/lib/logging/logger'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, ArrowLeft, MessageSquare, Clock, CheckCircle2 } from 'lucide-react'
import { TransparenciaPageWrapper } from '@/components/transparencia/transparencia-page-wrapper'

const log = createLogger('transparencia/ouvidoria-estatisticas')

export const dynamic = 'force-dynamic'

const tipoLabels: Record<string, string> = {
  RECLAMACAO: 'Reclamacao',
  SUGESTAO: 'Sugestao',
  ELOGIO: 'Elogio',
  DENUNCIA: 'Denuncia',
  SOLICITACAO: 'Solicitacao',
  INFORMACAO: 'Informacao',
}

const statusLabels: Record<string, string> = {
  REGISTRADA: 'Registrada',
  EM_ANALISE: 'Em Analise',
  ENCAMINHADA: 'Encaminhada',
  RESPONDIDA: 'Respondida',
  CONCLUIDA: 'Concluida',
  ARQUIVADA: 'Arquivada',
}

interface Estatisticas {
  total: number
  porTipo: { tipo: string; quantidade: number }[]
  porStatus: { status: string; quantidade: number }[]
  tempoMedioRespostaDias: number
}

const EMPTY: Estatisticas = { total: 0, porTipo: [], porStatus: [], tempoMedioRespostaDias: 0 }

function Distribuicao({
  titulo,
  itens,
  total,
  labels,
}: {
  titulo: string
  itens: { chave: string; quantidade: number }[]
  total: number
  labels: Record<string, string>
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        {itens.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem dados disponiveis.</p>
        ) : (
          <ul className="space-y-3">
            {itens.map((i) => {
              const pct = total > 0 ? Math.round((i.quantidade / total) * 100) : 0
              return (
                <li key={i.chave}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>{labels[i.chave] || i.chave}</span>
                    <span className="text-muted-foreground">
                      {i.quantidade} ({pct}%)
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
      </CardContent>
    </Card>
  )
}

export default async function EstatisticasOuvidoriaPage() {
  let estatisticas: Estatisticas = EMPTY

  try {
    estatisticas = await ouvidoriaService.estatisticas()
  } catch (error) {
    log.error('Erro ao calcular estatisticas da ouvidoria', error)
  }

  const respondidas = estatisticas.porStatus
    .filter((s) => s.status === 'RESPONDIDA' || s.status === 'CONCLUIDA')
    .reduce((acc, s) => acc + s.quantidade, 0)

  return (
    <TransparenciaPageWrapper slug="relatorios-ouvidoria" nome="Relatorios da Ouvidoria">
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
            Relatorios Estatisticos da Ouvidoria
          </h1>
          <p className="text-muted-foreground">
            Indicadores agregados das manifestacoes recebidas pela Ouvidoria.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Manifestacoes</p>
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
                  <p className="text-sm text-muted-foreground">Respondidas / Concluidas</p>
                  <p className="text-2xl font-bold">{respondidas}</p>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Distribuicao
            titulo="Por Tipo de Manifestacao"
            itens={estatisticas.porTipo.map((t) => ({ chave: t.tipo, quantidade: t.quantidade }))}
            total={estatisticas.total}
            labels={tipoLabels}
          />
          <Distribuicao
            titulo="Por Situacao"
            itens={estatisticas.porStatus.map((s) => ({ chave: s.status, quantidade: s.quantidade }))}
            total={estatisticas.total}
            labels={statusLabels}
          />
        </div>
      </div>
    </div>
    </TransparenciaPageWrapper>
  )
}
