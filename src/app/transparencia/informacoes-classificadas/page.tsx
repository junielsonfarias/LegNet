import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { createLogger } from '@/lib/logging/logger'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Lock, ArrowLeft, ShieldCheck, FileLock2 } from 'lucide-react'

const log = createLogger('transparencia/informacoes-classificadas')

export const dynamic = 'force-dynamic'

interface DocClassificado {
  id: string
  titulo: string
  categoria: string | null
  grau: string
  fundamentoLegal: string | null
  dataClassificacao: Date
  prazoAnos: number
  dataDesclassificacao: Date | null
  autoridade: string | null
}

const grauBadge: Record<string, string> = {
  RESERVADA: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
  SECRETA: 'bg-orange-100 text-orange-800 hover:bg-orange-100',
  ULTRASSECRETA: 'bg-red-100 text-red-800 hover:bg-red-100',
}

const formatarData = (data: Date | null) =>
  data ? new Date(data).toLocaleDateString('pt-BR') : '-'

function TabelaClassificados({ itens }: { itens: DocClassificado[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Assunto</th>
            <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Grau</th>
            <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Fundamento Legal</th>
            <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Classificacao</th>
            <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Desclassificacao prevista</th>
          </tr>
        </thead>
        <tbody>
          {itens.map((d) => (
            <tr key={d.id} className="border-t hover:bg-gray-50/50">
              <td className="px-4 py-3 max-w-md">
                <span className="font-medium">{d.titulo}</span>
                {d.categoria && (
                  <span className="block text-xs text-muted-foreground">{d.categoria}</span>
                )}
              </td>
              <td className="px-4 py-3">
                <Badge className={grauBadge[d.grau] || 'bg-gray-100 text-gray-800'}>{d.grau}</Badge>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{d.fundamentoLegal || '-'}</td>
              <td className="px-4 py-3 whitespace-nowrap">{formatarData(d.dataClassificacao)}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                {formatarData(d.dataDesclassificacao)}
                <span className="block text-xs text-muted-foreground">
                  prazo: {d.prazoAnos} ano(s)
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default async function InformacoesClassificadasPage() {
  let classificados: DocClassificado[] = []
  let desclassificados: DocClassificado[] = []

  try {
    const dozeMesesAtras = new Date()
    dozeMesesAtras.setMonth(dozeMesesAtras.getMonth() - 12)

    const [c, d] = await Promise.all([
      prisma.documentoClassificado.findMany({
        where: { situacao: 'CLASSIFICADA' },
        orderBy: [{ grau: 'asc' }, { dataClassificacao: 'desc' }],
      }),
      prisma.documentoClassificado.findMany({
        where: {
          situacao: 'DESCLASSIFICADA',
          dataDesclassificacao: { gte: dozeMesesAtras },
        },
        orderBy: { dataDesclassificacao: 'desc' },
      }),
    ])
    classificados = c
    desclassificados = d
  } catch (error) {
    log.error('Erro ao buscar documentos classificados', error)
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

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Lock className="h-8 w-8 text-primary" />
            Informacoes Classificadas
          </h1>
          <p className="text-muted-foreground">
            Rol das informacoes classificadas e desclassificadas, em cumprimento ao
            Art. 30 da Lei de Acesso a Informacao (Lei nº 12.527/2011).
          </p>
        </div>

        <Card className="mb-6 border-l-4 border-l-camara-primary">
          <CardContent className="p-4 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-camara-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-700">
              Esta pagina apresenta apenas o <strong>assunto generico</strong> e os
              metadados dos documentos. O conteudo classificado nao e divulgado
              enquanto vigente o prazo de sigilo. Os graus seguem a Lei nº 12.527/2011:
              reservada (5 anos), secreta (15 anos) e ultrassecreta (25 anos).
            </p>
          </CardContent>
        </Card>

        {/* Rol de documentos classificados */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileLock2 className="h-5 w-5 text-primary" />
              Documentos Classificados em Grau de Sigilo
            </CardTitle>
          </CardHeader>
          <CardContent className={classificados.length > 0 ? 'p-0' : ''}>
            {classificados.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Nao ha documentos classificados em grau de sigilo no ambito da
                Camara Municipal.
              </p>
            ) : (
              <TabelaClassificados itens={classificados} />
            )}
          </CardContent>
        </Card>

        {/* Rol de documentos desclassificados (ultimos 12 meses) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lock className="h-5 w-5 text-primary" />
              Documentos Desclassificados nos Ultimos 12 Meses
            </CardTitle>
          </CardHeader>
          <CardContent className={desclassificados.length > 0 ? 'p-0' : ''}>
            {desclassificados.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Nao houve desclassificacao de documentos nos ultimos 12 meses.
              </p>
            ) : (
              <TabelaClassificados itens={desclassificados} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
