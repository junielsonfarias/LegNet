import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, ArrowLeft, Scale, Clock, MessageSquare, FileSearch } from 'lucide-react'
import { DocumentosOficiais } from '@/components/transparencia/documentos-oficiais'
import { TransparenciaPageWrapper } from '@/components/transparencia/transparencia-page-wrapper'

export const revalidate = 3600 // QW-4: ISR 1h - regulamentacao da ouvidoria

const baseLegal = [
  {
    titulo: 'Lei nº 13.460/2017',
    descricao:
      'Codigo de Defesa dos Direitos do Usuario dos Servicos Publicos. Disciplina a participacao, protecao e defesa dos direitos do usuario dos servicos publicos da administracao publica.',
  },
  {
    titulo: 'Lei nº 12.527/2011 (LAI)',
    descricao:
      'Lei de Acesso a Informacao. Garante a qualquer cidadao o direito de solicitar e receber informacoes publicas dos orgaos e entidades.',
  },
  {
    titulo: 'Lei nº 13.709/2018 (LGPD)',
    descricao:
      'Lei Geral de Protecao de Dados Pessoais. Os dados pessoais do manifestante sao tratados de forma sigilosa e utilizados exclusivamente para o atendimento da manifestacao.',
  },
]

const prazos = [
  { tipo: 'Elogio', prazo: '15 dias' },
  { tipo: 'Reclamacao, Sugestao, Solicitacao, Denuncia', prazo: '30 dias' },
]

const tiposManifestacao = [
  { tipo: 'Reclamacao', descricao: 'Demonstracao de insatisfacao relativa a servico publico.' },
  { tipo: 'Sugestao', descricao: 'Proposta de aprimoramento de servicos prestados pela Camara.' },
  { tipo: 'Elogio', descricao: 'Reconhecimento ou satisfacao sobre servico ou atendimento.' },
  { tipo: 'Denuncia', descricao: 'Comunicacao de irregularidade ou ato ilicito.' },
  { tipo: 'Solicitacao', descricao: 'Pedido de adocao de providencia ou de prestacao de servico.' },
]

export default async function RegulamentacaoOuvidoriaPage() {
  return (
    <TransparenciaPageWrapper slug="regulamentacao-ouvidoria" nome="Regulamentacao da Ouvidoria">
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
            <BookOpen className="h-8 w-8 text-primary" />
            Regulamentacao da Ouvidoria
          </h1>
          <p className="text-muted-foreground">
            Base legal, prazos e diretrizes que regem o funcionamento da Ouvidoria
            da Camara Municipal.
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Scale className="h-5 w-5 text-primary" />
                Base Legal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {baseLegal.map((item) => (
                  <li key={item.titulo} className="border-l-4 border-l-camara-primary pl-4">
                    <p className="font-semibold">{item.titulo}</p>
                    <p className="text-sm text-muted-foreground">{item.descricao}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="h-5 w-5 text-primary" />
                Tipos de Manifestacao
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tiposManifestacao.map((t) => (
                  <div key={t.tipo} className="border rounded-md p-3">
                    <p className="font-medium">{t.tipo}</p>
                    <p className="text-sm text-muted-foreground">{t.descricao}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-primary" />
                Prazos de Resposta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-3 py-2 font-semibold text-muted-foreground">Tipo de Manifestacao</th>
                    <th className="px-3 py-2 font-semibold text-muted-foreground">Prazo</th>
                  </tr>
                </thead>
                <tbody>
                  {prazos.map((p) => (
                    <tr key={p.tipo} className="border-t">
                      <td className="px-3 py-2">{p.tipo}</td>
                      <td className="px-3 py-2 font-medium">{p.prazo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-muted-foreground mt-3">
                Os prazos podem ser prorrogados de forma justificada, conforme previsto
                na Lei nº 13.460/2017.
              </p>
            </CardContent>
          </Card>

          <DocumentosOficiais
            tipo="REGULAMENTO_OUVIDORIA"
            titulo="Regulamento da Ouvidoria"
          />

          <Card className="border-l-4 border-l-camara-primary">
            <CardContent className="p-5">
              <h2 className="font-semibold flex items-center gap-2 mb-2">
                <FileSearch className="h-5 w-5 text-camara-primary" />
                Como utilizar a Ouvidoria
              </h2>
              <p className="text-sm text-gray-700 mb-3">
                As manifestacoes podem ser registradas de forma identificada ou anonima.
                Ao registrar, o cidadao recebe um numero de protocolo para acompanhar o
                andamento.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/institucional/ouvidoria"
                  className="inline-flex items-center text-sm text-camara-primary font-medium hover:underline"
                >
                  Registrar manifestacao
                </Link>
                <span className="text-muted-foreground">&middot;</span>
                <Link
                  href="/institucional/ouvidoria/acompanhar"
                  className="inline-flex items-center text-sm text-camara-primary font-medium hover:underline"
                >
                  Consultar por protocolo
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </TransparenciaPageWrapper>
  )
}
