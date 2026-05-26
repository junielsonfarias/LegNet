import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { createLogger } from '@/lib/logging/logger'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Layers, ArrowLeft, Calendar, Building2, FileText, Download, ExternalLink } from 'lucide-react'

const log = createLogger('transparencia/atas-adesao-srp')

export const dynamic = 'force-dynamic'

interface DocumentoItem {
  nome: string
  url: string
}

interface AtaItem {
  id: string
  numero: string
  ano: number
  objeto: string
  orgaoGerenciador: string
  fornecedor: string
  cnpjFornecedor: string | null
  valorTotal: { toString(): string } | number | string
  vigenciaInicio: Date
  vigenciaFim: Date
  numeroAtaOriginal: string | null
  orgaoOrigem: string | null
  documentos: DocumentoItem[] | null
  arquivo: string | null
  dataPublicacao: Date | null
  situacao: string
}

function formatData(d: Date | null) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('pt-BR')
}

function formatValor(v: AtaItem['valorTotal']) {
  const n = typeof v === 'number' ? v : Number(v.toString())
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default async function AtasAdesaoSRPPage() {
  let atas: AtaItem[] = []
  try {
    const rows = await prisma.ataAdesaoSRP.findMany({
      orderBy: [{ ano: 'desc' }, { numero: 'desc' }],
      take: 500,
    })
    atas = rows.map((r) => ({
      ...r,
      documentos: Array.isArray(r.documentos) ? (r.documentos as unknown as DocumentoItem[]) : null,
    }))
  } catch (error) {
    log.error('Erro ao buscar atas de adesao SRP', error)
  }

  const totalValor = atas.reduce((acc, a) => acc + Number(a.valorTotal.toString()), 0)
  const anos = Array.from(new Set(atas.map((a) => a.ano))).sort((a, b) => b - a)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Link
          href="/transparencia"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar ao Portal da Transparencia
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Layers className="h-8 w-8 text-primary" />
            Atas de Adesao a Registro de Precos
          </h1>
          <p className="text-muted-foreground">
            Publicacao integral das adesoes a Atas de Registro de Precos (SRP)
            gerenciadas por outros orgaos publicos. Atende ao criterio 8.5 da
            Matriz PNTP 2026 e a Lei 14.133/2021.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Total de adesoes</p>
              <p className="text-2xl font-bold mt-1">{atas.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Anos cobertos</p>
              <p className="text-2xl font-bold mt-1">{anos.length}</p>
              {anos.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {anos[anos.length - 1]} - {anos[0]}
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Valor total</p>
              <p className="text-2xl font-bold mt-1">{formatValor(totalValor)}</p>
            </CardContent>
          </Card>
        </div>

        {atas.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                Nenhuma adesao a Registro de Precos publicada no momento.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Declaracao de nao ocorrencia: caso a Camara nao tenha realizado
                adesoes no exercicio, a informacao sera divulgada nesta secao,
                em conformidade com a Cartilha PNTP 2026.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {atas.map((a) => (
              <Card key={a.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <CardTitle className="text-base">
                      Adesao {a.numero}/{a.ano}
                    </CardTitle>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        a.situacao === 'VIGENTE'
                          ? 'bg-green-100 text-green-700'
                          : a.situacao === 'CANCELADA'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {a.situacao}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <p className="text-sm text-gray-700">{a.objeto}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Orgao gerenciador</p>
                        <p>{a.orgaoGerenciador}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Fornecedor</p>
                        <p>
                          {a.fornecedor}
                          {a.cnpjFornecedor && (
                            <span className="text-muted-foreground"> ({a.cnpjFornecedor})</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Vigencia</p>
                        <p>
                          {formatData(a.vigenciaInicio)} a {formatData(a.vigenciaFim)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Valor total</p>
                        <p className="font-medium">{formatValor(a.valorTotal)}</p>
                      </div>
                    </div>
                    {a.numeroAtaOriginal && (
                      <div className="flex items-start gap-2 md:col-span-2">
                        <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Ata original</p>
                          <p>
                            {a.numeroAtaOriginal}
                            {a.orgaoOrigem && ` (${a.orgaoOrigem})`}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    {a.arquivo && (
                      <a
                        href={a.arquivo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-camara-primary font-medium hover:underline"
                      >
                        <Download className="h-4 w-4" />
                        Baixar ata integral
                      </a>
                    )}
                    {a.documentos && a.documentos.length > 0 &&
                      a.documentos.map((d, idx) => (
                        <a
                          key={idx}
                          href={d.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-camara-primary font-medium hover:underline"
                        >
                          <ExternalLink className="h-4 w-4" />
                          {d.nome}
                        </a>
                      ))}
                    {!a.arquivo && (!a.documentos || a.documentos.length === 0) && (
                      <p className="text-xs text-muted-foreground">
                        Documentos ainda nao anexados.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
