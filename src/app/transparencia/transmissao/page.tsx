import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Radio, ArrowLeft, Info, ExternalLink } from 'lucide-react'
import { TransmissaoAoVivo } from '@/components/transparencia/transmissao-ao-vivo'
import { TransparenciaPageWrapper } from '@/components/transparencia/transparencia-page-wrapper'
import { getTransmissaoConfig } from '@/lib/services/transmissao-service'

export const dynamic = 'force-dynamic'

export default async function TransmissaoPage() {
  const cfg = await getTransmissaoConfig()
  const ativa = cfg.ativa && (cfg.url || cfg.embedHtml)

  return (
    <TransparenciaPageWrapper slug="transmissao" nome="Transmissao das Sessoes">
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
            <Radio className="h-8 w-8 text-primary" />
            Transmissao das Sessoes
          </h1>
          <p className="text-muted-foreground">
            Acompanhe ao vivo as sessoes plenarias, audiencias publicas e demais
            atividades da Camara Municipal, em atendimento ao criterio 20.9 do
            PNTP 2026 e ao Art. 9º, II, da Lei nº 12.527/2011 (LAI).
          </p>
        </div>

        {ativa ? (
          <Card className="mb-6">
            <CardContent className="p-4 md:p-6">
              <TransmissaoAoVivo variant="full" />
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6 border-l-4 border-l-amber-500">
            <CardContent className="p-5 flex items-start gap-3">
              <Info className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h2 className="font-semibold mb-1">Nenhuma transmissao ativa no momento</h2>
                <p className="text-sm text-gray-700">
                  As sessoes da Camara sao transmitidas ao vivo durante os
                  horarios oficiais de funcionamento legislativo. Quando houver
                  uma sessao em andamento, o player aparecera nesta pagina e no
                  Portal da Transparencia. Consulte tambem o{' '}
                  <Link href="/calendario" className="text-camara-primary hover:underline">
                    Calendario de Sessoes
                  </Link>{' '}
                  para saber as proximas datas.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ExternalLink className="h-5 w-5 text-primary" />
                Sessoes anteriores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 mb-3">
                As gravacoes das sessoes ja realizadas ficam disponiveis no
                canal oficial da Camara e podem ser consultadas pela pauta da
                sessao correspondente.
              </p>
              <Link
                href="/legislativo/sessoes"
                className="inline-flex items-center gap-1.5 text-sm text-camara-primary font-medium hover:underline"
              >
                Ver sessoes realizadas
                <ExternalLink className="h-4 w-4" />
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Sobre a transmissao
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700">
                A transmissao das sessoes da Camara atende ao principio
                constitucional da publicidade (Art. 37, CF) e aos arts. 7º e 8º
                da LAI. A captacao de audio e video pode ser realizada por
                meios proprios ou em parceria com canais publicos de
                comunicacao.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </TransparenciaPageWrapper>
  )
}
