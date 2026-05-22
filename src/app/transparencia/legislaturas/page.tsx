import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { createLogger } from '@/lib/logging/logger'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, ArrowLeft, Users, Gavel, Clock } from 'lucide-react'

const log = createLogger('transparencia/legislaturas')

export const dynamic = 'force-dynamic'

interface PeriodoView {
  id: string
  numero: number
  dataInicio: Date
  dataFim: Date | null
  descricao: string | null
}

interface LegislaturaView {
  id: string
  numero: number
  anoInicio: number
  anoFim: number
  ativa: boolean
  descricao: string | null
  periodos: PeriodoView[]
  _count: { sessoes: number; mandatos: number }
}

const formatarData = (data: Date | null) =>
  data ? new Date(data).toLocaleDateString('pt-BR') : '-'

export default async function LegislaturasPage() {
  let legislaturas: LegislaturaView[] = []

  try {
    legislaturas = await prisma.legislatura.findMany({
      orderBy: { numero: 'desc' },
      include: {
        periodos: { orderBy: { numero: 'asc' } },
        _count: { select: { sessoes: true, mandatos: true } },
      },
    })
  } catch (error) {
    log.error('Erro ao buscar legislaturas', error)
  }

  return (
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
            <Calendar className="h-8 w-8 text-primary" />
            Legislaturas
          </h1>
          <p className="text-muted-foreground">
            Historico das legislaturas da Camara Municipal, com seus periodos,
            sessoes realizadas e mandatos.
          </p>
        </div>

        {legislaturas.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Nenhuma legislatura cadastrada.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {legislaturas.map((leg) => (
              <Card key={leg.id} className={leg.ativa ? 'border-l-4 border-l-camara-primary' : ''}>
                <CardHeader>
                  <CardTitle className="flex flex-wrap items-center gap-3">
                    <span className="text-xl">
                      {leg.numero}ª Legislatura
                    </span>
                    <span className="text-muted-foreground font-normal">
                      {leg.anoInicio} &ndash; {leg.anoFim}
                    </span>
                    {leg.ativa && (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        Em exercicio
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {leg.descricao && (
                    <p className="text-sm text-muted-foreground mb-4">{leg.descricao}</p>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Gavel className="h-4 w-4 text-muted-foreground" />
                      <span>{leg._count.sessoes} sessoes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{leg._count.mandatos} mandatos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{leg.periodos.length} periodo(s)</span>
                    </div>
                  </div>

                  {leg.periodos.length > 0 && (
                    <div className="border-t pt-3">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">
                        PERIODOS LEGISLATIVOS
                      </p>
                      <ul className="space-y-1.5">
                        {leg.periodos.map((p) => (
                          <li key={p.id} className="text-sm flex flex-wrap items-center gap-2">
                            <Badge variant="outline">{p.numero}º periodo</Badge>
                            <span className="text-muted-foreground">
                              {formatarData(p.dataInicio)} a {formatarData(p.dataFim)}
                            </span>
                            {p.descricao && (
                              <span className="text-muted-foreground">&mdash; {p.descricao}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
