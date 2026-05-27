import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ClipboardList, ArrowLeft, Calendar, FileSpreadsheet, Target, Scale, ExternalLink,
} from 'lucide-react'
import { DocumentosOficiais } from '@/components/transparencia/documentos-oficiais'
import { TransparenciaPageWrapper } from '@/components/transparencia/transparencia-page-wrapper'

export const dynamic = 'force-dynamic'

const conteudoPca = [
  'Demanda de contratacoes do exercicio (bens, servicos, obras)',
  'Especificacoes tecnicas e quantitativos estimados',
  'Pesquisa preliminar de mercado (referencia de precos)',
  'Indicacao de fontes de recursos previstos',
  'Cronograma de execucao das contratacoes',
  'Vinculacao com o planejamento estrategico e a LDO/LOA',
]

const beneficios = [
  'Reduz aquisicoes emergenciais e improvisos',
  'Aumenta a economia de escala em pregoes anuais',
  'Permite controle social sobre demandas planejadas',
  'Cumpre a Lei 14.133/2021 (Art. 12, § 1º)',
]

export default function PlanoContratacoesAnualPage() {
  return (
    <TransparenciaPageWrapper slug="plano-contratacoes-anual" nome="Plano Anual de Contratacoes">
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
            <ClipboardList className="h-8 w-8 text-primary" />
            Plano de Contratacoes Anual (PCA)
          </h1>
          <p className="text-muted-foreground">
            Instrumento de planejamento previsto na Lei 14.133/2021 (Art. 12, § 1º)
            que documenta as contratacoes previstas para o exercicio. Atende ao
            criterio 8.6 da Matriz PNTP 2026 e ao Decreto Federal 10.947/2022.
          </p>
        </div>

        <div className="space-y-6">
          <Card className="border-l-4 border-l-camara-primary">
            <CardContent className="p-5 flex items-start gap-3">
              <Target className="h-5 w-5 text-camara-primary mt-0.5 flex-shrink-0" />
              <div>
                <h2 className="font-semibold mb-1">O que e o PCA?</h2>
                <p className="text-sm text-gray-700">
                  O Plano de Contratacoes Anual e o documento que registra,
                  para o ano seguinte, todas as contratacoes que a Camara
                  pretende realizar (bens, servicos, obras), com base na demanda
                  identificada pelas unidades. Deve ser elaborado ate o ultimo
                  dia util do primeiro quadrimestre e revisado conforme a
                  necessidade.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                Conteudo minimo do PCA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {conteudoPca.map((c) => (
                  <li key={c} className="text-sm text-gray-700 flex gap-2">
                    <span className="text-camara-primary">&bull;</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-primary" />
                Beneficios para o cidadao
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {beneficios.map((b) => (
                  <li key={b} className="text-sm text-gray-700 flex gap-2">
                    <span className="text-camara-primary">&bull;</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Scale className="h-5 w-5 text-primary" />
                Base Legal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-gray-700">
                <li><strong>Lei nº 14.133/2021</strong> - Art. 12, § 1º (PCA obrigatorio)</li>
                <li><strong>Decreto Federal nº 10.947/2022</strong> - regulamenta o PCA na Uniao</li>
                <li><strong>IN SEGES/ME nº 1/2019</strong> e ajustes</li>
                <li><strong>Cartilha PNTP 2026</strong> - criterio 8.6 (Recomendada)</li>
              </ul>
            </CardContent>
          </Card>

          <DocumentosOficiais
            tipo="PLANO_ANUAL_CONTRATACOES"
            titulo="Planos Publicados"
          />

          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-5">
              <h2 className="font-semibold mb-2">Acesso a outros documentos</h2>
              <p className="text-sm text-gray-700 mb-2">
                Consulte tambem os documentos relacionados:
              </p>
              <ul className="space-y-1 text-sm">
                <li>
                  <Link href="/transparencia/licitacoes" className="text-camara-primary hover:underline inline-flex items-center gap-1">
                    Licitacoes em andamento <ExternalLink className="h-3 w-3" />
                  </Link>
                </li>
                <li>
                  <Link href="/transparencia/contratos" className="text-camara-primary hover:underline inline-flex items-center gap-1">
                    Contratos vigentes <ExternalLink className="h-3 w-3" />
                  </Link>
                </li>
                <li>
                  <Link href="/transparencia/atas-adesao-srp" className="text-camara-primary hover:underline inline-flex items-center gap-1">
                    Atas de Adesao a SRP <ExternalLink className="h-3 w-3" />
                  </Link>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </TransparenciaPageWrapper>
  )
}
