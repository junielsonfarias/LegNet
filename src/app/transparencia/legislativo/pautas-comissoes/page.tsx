import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { createLogger } from '@/lib/logging/logger'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Briefcase, ArrowLeft, Calendar, FileText, Download, Clock, AlertCircle,
} from 'lucide-react'
import { TransparenciaPageWrapper } from '@/components/transparencia/transparencia-page-wrapper'

const log = createLogger('transparencia/legislativo/pautas-comissoes')

export const dynamic = 'force-dynamic'

interface PautaComissao {
  id: string
  numero: number
  ano: number
  data: Date
  horaInicio: Date | null
  local: string | null
  status: string
  pautaTexto: string | null
  arquivoPauta: string | null
  dataPublicacaoPauta: Date | null
  comissao: {
    id: string
    nome: string
    sigla: string | null
  }
}

function formatDataHora(d: Date | null) {
  if (!d) return '-'
  return new Date(d).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatData(d: Date | null) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('pt-BR')
}

export default async function PautasComissoesPage() {
  let reunioes: PautaComissao[] = []

  try {
    const rows = await prisma.reuniaoComissao.findMany({
      where: {
        OR: [
          { arquivoPauta: { not: null } },
          { pautaTexto: { not: null } },
          { dataPublicacaoPauta: { not: null } },
        ],
      },
      orderBy: [{ data: 'desc' }],
      take: 200,
      select: {
        id: true,
        numero: true,
        ano: true,
        data: true,
        horaInicio: true,
        local: true,
        status: true,
        pautaTexto: true,
        arquivoPauta: true,
        dataPublicacaoPauta: true,
        comissao: {
          select: { id: true, nome: true, sigla: true },
        },
      },
    })
    reunioes = rows
  } catch (error) {
    log.error('Erro ao buscar pautas de comissoes', error)
  }

  // Agrupa por comissao para uma navegacao mais facil
  const porComissao = reunioes.reduce<Record<string, { comissao: PautaComissao['comissao']; pautas: PautaComissao[] }>>(
    (acc, r) => {
      const key = r.comissao.id
      if (!acc[key]) acc[key] = { comissao: r.comissao, pautas: [] }
      acc[key].pautas.push(r)
      return acc
    },
    {},
  )

  const totalComissoes = Object.keys(porComissao).length

  return (
    <TransparenciaPageWrapper slug="pautas-comissoes" nome="Pautas das Comissoes">
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link
          href="/transparencia"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar ao Portal da Transparencia
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Briefcase className="h-8 w-8 text-primary" />
            Pautas das Comissoes
          </h1>
          <p className="text-muted-foreground">
            Materias a serem analisadas nas reunioes das Comissoes Permanentes,
            Temporarias, Especiais e CPIs. Atende ao criterio 20.5 da Matriz
            PNTP 2026 e ao Art. 7º, IV-VI da Lei 12.527/2011 (LAI).
          </p>
        </div>

        <Card className="border-l-4 border-l-camara-primary mb-6">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-camara-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-700">
              As pautas de reuniao das comissoes devem ser publicadas com
              antecedencia minima de <strong>48 horas</strong> (RN-122/PNTP).
              Para acessar pautas do Plenario, consulte{' '}
              <Link href="/legislativo/pautas-sessoes" className="text-camara-primary hover:underline">
                Pautas das Sessoes Plenarias
              </Link>.
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Reunioes publicadas</p>
              <p className="text-2xl font-bold mt-1">{reunioes.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Comissoes ativas</p>
              <p className="text-2xl font-bold mt-1">{totalComissoes}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Prazo legal</p>
              <p className="text-2xl font-bold mt-1">48h</p>
              <p className="text-xs text-muted-foreground mt-1">antes da reuniao</p>
            </CardContent>
          </Card>
        </div>

        {reunioes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                Nenhuma pauta de comissao publicada no momento.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Declaracao de nao ocorrencia: as comissoes serao reunidas
                conforme demanda. As pautas ficam disponiveis com 48h de
                antecedencia.
              </p>
              <Link
                href="/legislativo/comissoes"
                className="inline-block mt-4 text-sm text-camara-primary hover:underline"
              >
                Ver comissoes ativas &rarr;
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.values(porComissao).map(({ comissao, pautas }) => (
              <Card key={comissao.id}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    {comissao.sigla ? `${comissao.sigla} - ` : ''}
                    {comissao.nome}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {pautas.length} reuniao(oes) com pauta publicada
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pautas.map((p) => (
                      <div key={p.id} className="border rounded-lg p-3">
                        <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
                          <p className="font-medium text-sm">
                            Reuniao {p.numero}/{p.ano}
                          </p>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs ${
                              p.status === 'AGENDADA' || p.status === 'CONVOCADA'
                                ? 'bg-blue-100 text-blue-700'
                                : p.status === 'CONCLUIDA'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {p.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mb-2">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDataHora(p.data)}
                          </span>
                          {p.local && (
                            <span className="inline-flex items-center gap-1">
                              <Briefcase className="h-3 w-3" />
                              {p.local}
                            </span>
                          )}
                          {p.dataPublicacaoPauta && (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Publicada em {formatData(p.dataPublicacaoPauta)}
                            </span>
                          )}
                        </div>
                        {p.pautaTexto && (
                          <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2 line-clamp-4">
                            {p.pautaTexto}
                          </p>
                        )}
                        {p.arquivoPauta && (
                          <a
                            href={p.arquivoPauta}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm text-camara-primary font-medium hover:underline"
                          >
                            <FileText className="h-4 w-4" />
                            <Download className="h-3.5 w-3.5" />
                            Baixar pauta (PDF)
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
    </TransparenciaPageWrapper>
  )
}
