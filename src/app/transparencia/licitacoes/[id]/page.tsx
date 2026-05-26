import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  FileText, ArrowLeft, Calendar, DollarSign, Building2, Download, ExternalLink,
  ClipboardList, Briefcase, AlertCircle,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

interface DocItem {
  nome: string
  url: string
  tipo?: string
}

function formatData(d: Date | null) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('pt-BR')
}

function formatValor(v: unknown) {
  if (v === null || v === undefined) return '-'
  const n = Number(v.toString())
  if (!Number.isFinite(n)) return '-'
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default async function LicitacaoDetalhePage({ params }: PageProps) {
  const { id } = await params
  const licit = await prisma.licitacao.findUnique({
    where: { id },
    include: { documentos: true },
  })
  if (!licit) notFound()

  const faseInterna: DocItem[] = Array.isArray(licit.documentosFaseInterna)
    ? (licit.documentosFaseInterna as unknown as DocItem[])
    : []
  const faseExterna: DocItem[] = Array.isArray(licit.documentosFaseExterna)
    ? (licit.documentosFaseExterna as unknown as DocItem[])
    : []

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link
          href="/transparencia/licitacoes"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar para Licitacoes
        </Link>

        <div className="mb-6">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-1 flex items-center gap-3">
                <FileText className="h-7 w-7 text-primary" />
                Licitacao {licit.numero}/{licit.ano}
              </h1>
              <p className="text-sm text-muted-foreground">
                {licit.modalidade.replace(/_/g, ' ')} - {licit.tipo.replace(/_/g, ' ')}
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
              {licit.situacao.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Resumo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Objeto</p>
                <p className="text-sm">{licit.objeto}</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Data de abertura</p>
                    <p>{formatData(licit.dataAbertura)} {licit.horaAbertura || ''}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Valor estimado</p>
                    <p>{formatValor(licit.valorEstimado)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Valor homologado</p>
                    <p>{formatValor(licit.valorHomologado)}</p>
                  </div>
                </div>
                {licit.dataPublicacao && (
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Data de publicacao</p>
                      <p>{formatData(licit.dataPublicacao)}</p>
                    </div>
                  </div>
                )}
                {licit.unidadeGestora && (
                  <div className="flex items-start gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Unidade gestora</p>
                      <p>{licit.unidadeGestora}</p>
                    </div>
                  </div>
                )}
              </div>
              {licit.linkEdital && (
                <a
                  href={licit.linkEdital}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-camara-primary font-medium hover:underline"
                >
                  <Download className="h-4 w-4" />
                  Baixar edital
                </a>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                Fase Interna
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Documentos de planejamento, parecer juridico, termo de referencia, edital
                e demais atos preparatorios.
              </p>
            </CardHeader>
            <CardContent>
              {faseInterna.length === 0 ? (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Nenhum documento da fase interna publicado.
                </p>
              ) : (
                <ul className="space-y-2">
                  {faseInterna.map((d, idx) => (
                    <li key={idx} className="flex items-start gap-2 border rounded-md p-3">
                      <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{d.nome}</p>
                        {d.tipo && <p className="text-xs text-muted-foreground">{d.tipo}</p>}
                      </div>
                      <a
                        href={d.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-camara-primary hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Abrir
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                Fase Externa
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Atas de julgamento, propostas, recursos, adjudicacao, homologacao e
                publicacoes de resultado.
              </p>
            </CardHeader>
            <CardContent>
              {faseExterna.length === 0 ? (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Nenhum documento da fase externa publicado.
                </p>
              ) : (
                <ul className="space-y-2">
                  {faseExterna.map((d, idx) => (
                    <li key={idx} className="flex items-start gap-2 border rounded-md p-3">
                      <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{d.nome}</p>
                        {d.tipo && <p className="text-xs text-muted-foreground">{d.tipo}</p>}
                      </div>
                      <a
                        href={d.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-camara-primary hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Abrir
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {licit.documentos && licit.documentos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Anexos diversos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {licit.documentos.map((d) => (
                    <li key={d.id} className="flex items-start gap-2 border rounded-md p-3">
                      <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{d.titulo}</p>
                        {d.tipo && <p className="text-xs text-muted-foreground">{d.tipo}</p>}
                      </div>
                      <a
                        href={d.arquivo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-camara-primary hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Abrir
                      </a>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {licit.observacoes && (
            <Card>
              <CardContent className="p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                  Observacoes
                </p>
                <p className="text-sm whitespace-pre-wrap">{licit.observacoes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
