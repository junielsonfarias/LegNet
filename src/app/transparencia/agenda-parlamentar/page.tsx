import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { createLogger } from '@/lib/logging/logger'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, ArrowLeft, MapPin, User } from 'lucide-react'

const log = createLogger('transparencia/agenda-parlamentar')

export const dynamic = 'force-dynamic'

interface Compromisso {
  id: string
  parlamentarNome: string | null
  titulo: string
  descricao: string | null
  local: string | null
  dataInicio: Date
  dataFim: Date | null
  tipo: string
}

const tipoLabels: Record<string, string> = {
  COMPROMISSO: 'Compromisso',
  REUNIAO: 'Reuniao',
  EVENTO: 'Evento',
  VIAGEM: 'Viagem',
  AUDIENCIA: 'Audiencia',
}

const formatarDataHora = (data: Date) =>
  new Date(data).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

function ListaCompromissos({ itens }: { itens: Compromisso[] }) {
  return (
    <div className="space-y-3">
      {itens.map((c) => (
        <div key={c.id} className="border rounded-lg p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="font-semibold">{c.titulo}</h3>
            <Badge variant="outline">{tipoLabels[c.tipo] || c.tipo}</Badge>
          </div>
          {c.descricao && (
            <p className="text-sm text-muted-foreground mt-1">{c.descricao}</p>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              {formatarDataHora(c.dataInicio)}
              {c.dataFim && <> &ndash; {formatarDataHora(c.dataFim)}</>}
            </span>
            {c.parlamentarNome && (
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                {c.parlamentarNome}
              </span>
            )}
            {c.local && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {c.local}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default async function AgendaParlamentarPage() {
  let proximos: Compromisso[] = []
  let realizados: Compromisso[] = []

  try {
    const agora = new Date()
    const [p, r] = await Promise.all([
      prisma.agendaParlamentar.findMany({
        where: { dataInicio: { gte: agora } },
        orderBy: { dataInicio: 'asc' },
      }),
      prisma.agendaParlamentar.findMany({
        where: { dataInicio: { lt: agora } },
        orderBy: { dataInicio: 'desc' },
        take: 50,
      }),
    ])
    proximos = p
    realizados = r
  } catch (error) {
    log.error('Erro ao buscar agenda parlamentar', error)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Link
          href="/transparencia"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar ao Portal da Transparencia
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <CalendarDays className="h-8 w-8 text-primary" />
            Agenda Externa dos Parlamentares
          </h1>
          <p className="text-muted-foreground">
            Compromissos, reunioes e eventos externos dos vereadores da Camara
            Municipal.
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Proximos Compromissos</CardTitle>
          </CardHeader>
          <CardContent>
            {proximos.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nao ha compromissos agendados.
              </p>
            ) : (
              <ListaCompromissos itens={proximos} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Compromissos Realizados</CardTitle>
          </CardHeader>
          <CardContent>
            {realizados.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum compromisso realizado registrado.
              </p>
            ) : (
              <ListaCompromissos itens={realizados} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
