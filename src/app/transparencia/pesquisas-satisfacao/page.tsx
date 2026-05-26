import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  CheckCircle2, ArrowLeft, ClipboardList, BarChart3, Calendar, ExternalLink,
} from 'lucide-react'
import { pesquisaSatisfacaoService } from '@/lib/services/pesquisa-satisfacao-service'

export const dynamic = 'force-dynamic'

function formatData(d: Date | null) {
  if (!d) return null
  return new Date(d).toLocaleDateString('pt-BR')
}

export default async function PesquisasSatisfacaoPage() {
  const pesquisas = await pesquisaSatisfacaoService.list()
  const agora = new Date()
  const ativas = pesquisas.filter(
    (p) =>
      p.ativa &&
      new Date(p.periodoInicio) <= agora &&
      (!p.periodoFim || new Date(p.periodoFim) >= agora)
  )
  const encerradas = pesquisas.filter((p) => !ativas.includes(p))

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link
          href="/transparencia"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar ao Portal da Transparencia
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-primary" />
            Pesquisas de Satisfacao
          </h1>
          <p className="text-muted-foreground">
            Avalie os servicos da Camara Municipal e acompanhe os resultados.
            Sua participacao e anonima e ajuda a melhorar o atendimento ao
            cidadao (PNTP 2026 - criterio 15.6, Lei nº 13.460/2017).
          </p>
        </div>

        {pesquisas.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                Nenhuma pesquisa de satisfacao publicada no momento. Volte em breve.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {ativas.length > 0 && (
              <section aria-labelledby="ativas">
                <h2 id="ativas" className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="relative inline-flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-600" />
                  </span>
                  Pesquisas em andamento ({ativas.length})
                </h2>
                <div className="grid gap-3">
                  {ativas.map((p) => (
                    <Card key={p.id} className="border-l-4 border-l-green-500">
                      <CardHeader>
                        <CardTitle className="text-base">{p.titulo}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {p.descricao && (
                          <p className="text-sm text-gray-700 mb-3">{p.descricao}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Inicio: {formatData(p.periodoInicio)}
                          </span>
                          {p.periodoFim && (
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Fim: {formatData(p.periodoFim)}
                            </span>
                          )}
                          <span>{p.totalRespostas} resposta(s)</span>
                        </div>
                        <div className="flex gap-2">
                          <Link
                            href={`/transparencia/pesquisas-satisfacao/${p.id}`}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-camara-primary text-white px-3 py-2 text-sm font-medium hover:opacity-90 transition"
                          >
                            <ClipboardList className="h-4 w-4" />
                            Responder
                          </Link>
                          {p.publicaResultados && (
                            <Link
                              href={`/transparencia/pesquisas-satisfacao/${p.id}/resultados`}
                              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50 transition"
                            >
                              <BarChart3 className="h-4 w-4" />
                              Ver resultados
                            </Link>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {encerradas.length > 0 && (
              <section aria-labelledby="encerradas">
                <h2 id="encerradas" className="text-lg font-semibold mb-3">
                  Pesquisas encerradas ({encerradas.length})
                </h2>
                <div className="grid gap-3">
                  {encerradas.map((p) => (
                    <Card key={p.id} className="opacity-90">
                      <CardHeader>
                        <CardTitle className="text-base">{p.titulo}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {p.descricao && (
                          <p className="text-sm text-gray-700 mb-3">{p.descricao}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3">
                          {p.periodoFim && (
                            <span>Encerrada em {formatData(p.periodoFim)}</span>
                          )}
                          <span>{p.totalRespostas} resposta(s)</span>
                        </div>
                        {p.publicaResultados && (
                          <Link
                            href={`/transparencia/pesquisas-satisfacao/${p.id}/resultados`}
                            className="inline-flex items-center gap-1.5 text-sm text-camara-primary font-medium hover:underline"
                          >
                            <BarChart3 className="h-4 w-4" />
                            Ver resultados
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
