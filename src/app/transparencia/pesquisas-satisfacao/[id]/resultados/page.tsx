import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, ArrowLeft, Star, MessageSquare } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { pesquisaSatisfacaoService } from '@/lib/services/pesquisa-satisfacao-service'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ResultadosPage({ params }: PageProps) {
  const { id } = await params
  const pesquisa = await prisma.pesquisaSatisfacao.findUnique({ where: { id } })
  if (!pesquisa) notFound()
  if (!pesquisa.publicaResultados) notFound()

  const resultado = await pesquisaSatisfacaoService.resultado(id)
  if (!resultado) notFound()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Link
          href={`/transparencia/pesquisas-satisfacao/${id}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar a pesquisa
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            Resultados da Pesquisa
          </h1>
          <p className="text-muted-foreground">{resultado.pesquisa.titulo}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Total de respostas: <strong>{resultado.totalRespostas}</strong>
          </p>
        </div>

        {resultado.totalRespostas === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Nenhuma resposta registrada ainda.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {resultado.agregados.map((ag, idx) => (
              <Card key={ag.perguntaId}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    {idx + 1}. {ag.label}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {ag.totalRespostas} resposta(s)
                  </p>
                </CardHeader>
                <CardContent>
                  {ag.tipo === 'ESCALA_1_5' && ag.distribuicao && (
                    <div>
                      <div className="flex items-baseline gap-2 mb-3">
                        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                        <span className="text-2xl font-bold">{ag.media?.toFixed(2) ?? '-'}</span>
                        <span className="text-sm text-muted-foreground">de 5</span>
                      </div>
                      <div className="space-y-1.5">
                        {[5, 4, 3, 2, 1].map((n) => {
                          const count = ag.distribuicao?.[String(n)] || 0
                          const pct = ag.totalRespostas > 0 ? (count / ag.totalRespostas) * 100 : 0
                          return (
                            <div key={n} className="flex items-center gap-2 text-xs">
                              <span className="w-4 text-right">{n}</span>
                              <div className="flex-1 h-4 rounded bg-gray-100 overflow-hidden">
                                <div
                                  className="h-full bg-camara-primary"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="w-16 text-right text-muted-foreground">
                                {count} ({pct.toFixed(0)}%)
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {ag.tipo === 'SIM_NAO' && ag.distribuicao && (
                    <div className="space-y-1.5">
                      {(['SIM', 'NAO'] as const).map((k) => {
                        const count = ag.distribuicao?.[k] || 0
                        const pct = ag.totalRespostas > 0 ? (count / ag.totalRespostas) * 100 : 0
                        return (
                          <div key={k} className="flex items-center gap-2 text-sm">
                            <span className="w-12">{k === 'SIM' ? 'Sim' : 'Nao'}</span>
                            <div className="flex-1 h-5 rounded bg-gray-100 overflow-hidden">
                              <div
                                className={`h-full ${k === 'SIM' ? 'bg-green-500' : 'bg-red-500'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="w-20 text-right text-muted-foreground">
                              {count} ({pct.toFixed(0)}%)
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {ag.tipo === 'MULTIPLA_ESCOLHA' && ag.distribuicao && (
                    <div className="space-y-1.5">
                      {Object.entries(ag.distribuicao).map(([opt, count]) => {
                        const pct = ag.totalRespostas > 0 ? (count / ag.totalRespostas) * 100 : 0
                        return (
                          <div key={opt} className="flex items-center gap-2 text-sm">
                            <span className="w-32 truncate" title={opt}>{opt}</span>
                            <div className="flex-1 h-5 rounded bg-gray-100 overflow-hidden">
                              <div
                                className="h-full bg-camara-primary"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="w-20 text-right text-muted-foreground">
                              {count} ({pct.toFixed(0)}%)
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {ag.tipo === 'TEXTO' && ag.amostraTextos && (
                    <div className="space-y-2">
                      {ag.amostraTextos.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Nenhuma resposta textual registrada.
                        </p>
                      ) : (
                        ag.amostraTextos.map((t, i) => (
                          <div key={i} className="flex gap-2 text-sm">
                            <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <p className="text-gray-700">{t}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center mt-6">
          Todos os dados sao apresentados de forma agregada e anonimizada (LGPD).
        </p>
      </div>
    </div>
  )
}
