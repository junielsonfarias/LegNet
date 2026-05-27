import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { createLogger } from '@/lib/logging/logger'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, ArrowLeft, ShieldCheck, Search } from 'lucide-react'
import { TransparenciaPageWrapper } from '@/components/transparencia/transparencia-page-wrapper'

const log = createLogger('transparencia/ouvidoria-manifestacoes')

export const dynamic = 'force-dynamic'

interface ManifestacaoPublica {
  id: string
  protocolo: string
  ano: number
  tipo: string
  assunto: string
  status: string
  setor: string | null
  createdAt: Date
  dataResposta: Date | null
}

const tipoLabels: Record<string, string> = {
  RECLAMACAO: 'Reclamacao',
  SUGESTAO: 'Sugestao',
  ELOGIO: 'Elogio',
  DENUNCIA: 'Denuncia',
  SOLICITACAO: 'Solicitacao',
  INFORMACAO: 'Informacao',
}

const statusConfig: Record<string, { label: string; className: string }> = {
  REGISTRADA: { label: 'Registrada', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
  EM_ANALISE: { label: 'Em Analise', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' },
  ENCAMINHADA: { label: 'Encaminhada', className: 'bg-orange-100 text-orange-800 hover:bg-orange-100' },
  RESPONDIDA: { label: 'Respondida', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
  CONCLUIDA: { label: 'Concluida', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
  ARQUIVADA: { label: 'Arquivada', className: 'bg-gray-100 text-gray-800 hover:bg-gray-100' },
}

const formatarData = (data: Date | null) =>
  data ? new Date(data).toLocaleDateString('pt-BR') : '-'

export default async function ManifestacoesOuvidoriaPage() {
  let manifestacoes: ManifestacaoPublica[] = []

  try {
    manifestacoes = await prisma.manifestacaoOuvidoria.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        protocolo: true,
        ano: true,
        tipo: true,
        assunto: true,
        status: true,
        setor: true,
        createdAt: true,
        dataResposta: true,
      },
    })
  } catch (error) {
    log.error('Erro ao buscar manifestacoes da ouvidoria', error)
  }

  return (
    <TransparenciaPageWrapper slug="manifestacoes-realizadas" nome="Manifestacoes Realizadas">
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
            <MessageSquare className="h-8 w-8 text-primary" />
            Manifestacoes Realizadas
          </h1>
          <p className="text-muted-foreground">
            Relacao das manifestacoes registradas na Ouvidoria da Camara Municipal.
          </p>
        </div>

        <Card className="mb-6 border-l-4 border-l-camara-primary">
          <CardContent className="p-4 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-camara-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-700">
              Em atencao a Lei Geral de Protecao de Dados (LGPD), esta listagem nao
              exibe dados pessoais do manifestante, e o assunto das manifestacoes do
              tipo denuncia e mantido reservado. Para consultar o andamento de uma
              manifestacao especifica, utilize a{' '}
              <Link
                href="/institucional/ouvidoria/acompanhar"
                className="text-camara-primary font-medium hover:underline inline-flex items-center gap-1"
              >
                <Search className="h-3.5 w-3.5" />
                consulta por protocolo
              </Link>
              .
            </p>
          </CardContent>
        </Card>

        {manifestacoes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Nenhuma manifestacao registrada.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Protocolo</th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Tipo</th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Assunto</th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Setor</th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Registro</th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Resposta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {manifestacoes.map((m) => {
                      const cfg = statusConfig[m.status] || statusConfig.REGISTRADA
                      return (
                        <tr key={m.id} className="border-t hover:bg-gray-50/50">
                          <td className="px-4 py-3 font-medium text-camara-primary whitespace-nowrap">
                            {m.protocolo}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline">{tipoLabels[m.tipo] || m.tipo}</Badge>
                          </td>
                          <td className="px-4 py-3 max-w-md">
                            {m.tipo === 'DENUNCIA' ? (
                              <span className="italic text-muted-foreground">
                                Assunto reservado
                              </span>
                            ) : (
                              <span className="line-clamp-2">{m.assunto}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{m.setor || '-'}</td>
                          <td className="px-4 py-3">
                            <Badge className={cfg.className}>{cfg.label}</Badge>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">{formatarData(m.createdAt)}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{formatarData(m.dataResposta)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
    </TransparenciaPageWrapper>
  )
}
