import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Target, ArrowLeft, Compass, Eye, ListChecks, Calendar, Scale,
} from 'lucide-react'
import { DocumentosOficiais } from '@/components/transparencia/documentos-oficiais'
import { TransparenciaPageWrapper } from '@/components/transparencia/transparencia-page-wrapper'
import { LinksRelacionados } from '@/components/transparencia/links-relacionados'

export const dynamic = 'force-dynamic'

const elementos = [
  {
    titulo: 'Identidade Estrategica',
    descricao: 'Missao, visao e valores institucionais que orientam a atuacao da Camara perante a sociedade.',
  },
  {
    titulo: 'Diagnostico Situacional',
    descricao: 'Analise interna (forcas e fraquezas) e externa (oportunidades e ameacas) — base para decisoes.',
  },
  {
    titulo: 'Objetivos Estrategicos',
    descricao: 'Resultados de longo prazo que a Camara busca alcancar, alinhados a Lei Organica e a LDO/LOA.',
  },
  {
    titulo: 'Indicadores de Desempenho',
    descricao: 'Metricas mensuraveis para acompanhar o progresso em direcao aos objetivos.',
  },
  {
    titulo: 'Metas e Iniciativas',
    descricao: 'Acoes especificas com prazos definidos para concretizar os objetivos estrategicos.',
  },
  {
    titulo: 'Cronograma de Revisao',
    descricao: 'Frequencia de revisoes periodicas (recomendada anual) para ajustes de rota.',
  },
]

const beneficios = [
  'Direciona recursos publicos para o que realmente importa ao cidadao',
  'Promove governanca, transparencia e accountability',
  'Permite ao cidadao acompanhar metas e cobrar resultados',
  'Cumpre boa pratica recomendada pela cartilha PNTP 2026 (criterio 11.7)',
]

export default function PlanoEstrategicoPage() {
  return (
    <TransparenciaPageWrapper slug="plano-estrategico" nome="Planejamento Estrategico">
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
            <Target className="h-8 w-8 text-primary" />
            Planejamento Estrategico Institucional
          </h1>
          <p className="text-muted-foreground">
            Documento que orienta a atuacao da Camara Municipal a medio e longo
            prazo, em conformidade com o criterio 11.7 da Matriz PNTP 2026.
          </p>
        </div>

        <div className="space-y-6">
          <Card className="border-l-4 border-l-camara-primary">
            <CardContent className="p-5 flex items-start gap-3">
              <Compass className="h-5 w-5 text-camara-primary mt-0.5 flex-shrink-0" />
              <div>
                <h2 className="font-semibold mb-1">O que e o Planejamento Estrategico?</h2>
                <p className="text-sm text-gray-700">
                  E o instrumento de governanca que define a direcao da
                  instituicao, articulando missao, visao, valores, objetivos,
                  metas e indicadores. Permite que servidores e cidadaos saibam
                  para onde a Camara esta indo e como pretende chegar la.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ListChecks className="h-5 w-5 text-primary" />
                Elementos do Plano
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {elementos.map((e) => (
                  <div key={e.titulo}>
                    <p className="text-sm font-medium text-gray-900">{e.titulo}</p>
                    <p className="text-sm text-gray-700">{e.descricao}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Eye className="h-5 w-5 text-primary" />
                Beneficios para o Cidadao
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
                <Calendar className="h-5 w-5 text-primary" />
                Vinculacao com instrumentos orcamentarios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 mb-2">
                O Planejamento Estrategico se conecta com os instrumentos
                obrigatorios de planejamento orcamentario:
              </p>
              <ul className="space-y-1 text-sm text-gray-700">
                <li><strong>PPA:</strong> Plano Plurianual (4 anos)</li>
                <li><strong>LDO:</strong> Lei de Diretrizes Orcamentarias (anual)</li>
                <li><strong>LOA:</strong> Lei Orcamentaria Anual</li>
                <li><strong>PCA:</strong> Plano de Contratacoes Anual</li>
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
                <li><strong>Art. 37 da CF</strong> - principios da Administracao Publica</li>
                <li><strong>Lei Organica Municipal</strong> - atribuicoes da Camara</li>
                <li><strong>Cartilha PNTP 2026</strong> - criterio 11.7 (Recomendada)</li>
                <li><strong>Resolucao do CNJ nº 198/2014</strong> - planejamento estrategico (referencia)</li>
              </ul>
            </CardContent>
          </Card>

          <DocumentosOficiais
            tipo="PLANEJAMENTO_ESTRATEGICO"
            titulo="Documentos do Planejamento Estrategico"
          />

          <LinksRelacionados slug="plano-estrategico" />
        </div>
      </div>
    </div>
    </TransparenciaPageWrapper>
  )
}
