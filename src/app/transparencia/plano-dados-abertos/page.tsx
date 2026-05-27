import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Database, ArrowLeft, Target, RefreshCw, FileJson, Scale, ExternalLink,
} from 'lucide-react'
import { DocumentosOficiais } from '@/components/transparencia/documentos-oficiais'
import { TransparenciaPageWrapper } from '@/components/transparencia/transparencia-page-wrapper'

export const dynamic = 'force-dynamic'

const principios = [
  'Publicidade como regra: os dados sao abertos por padrao, salvo sigilo legal.',
  'Formatos abertos e legiveis por maquina, sem restricao de uso.',
  'Dados primarios, com o maior nivel de detalhamento possivel.',
  'Atualizacao tempestiva, conforme os prazos do PNTP e da LAI.',
  'Disponibilidade permanente e gratuita, sem necessidade de cadastro.',
]

const periodicidades = [
  { dado: 'Votacoes e presencas em sessoes', prazo: 'Ate 30 dias apos a sessao' },
  { dado: 'Proposicoes legislativas', prazo: 'Ate 48 horas apos o protocolo' },
  { dado: 'Despesas e empenhos', prazo: 'Mensal (ate 30 dias)' },
  { dado: 'Contratos', prazo: 'Ate 24 horas apos a assinatura' },
  { dado: 'Servidores, licitacoes e demais conjuntos', prazo: 'Atualizacao continua' },
]

export default async function PlanoDadosAbertosPage() {
  return (
    <TransparenciaPageWrapper slug="plano-dados-abertos" nome="Plano de Dados Abertos">
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
            <Database className="h-8 w-8 text-primary" />
            Plano de Dados Abertos
          </h1>
          <p className="text-muted-foreground">
            Diretrizes para a abertura, publicacao e atualizacao dos dados da
            Camara Municipal, em conformidade com a Lei de Acesso a Informacao
            (Lei nº 12.527/2011) e o Programa Nacional de Transparencia Publica.
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-primary" />
                Objetivo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700">
                Promover a abertura de dados publicos da Camara Municipal de forma
                organizada, padronizada e periodica, ampliando a transparencia, o
                controle social e a reutilizacao das informacoes pela sociedade.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Scale className="h-5 w-5 text-primary" />
                Principios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {principios.map((p) => (
                  <li key={p} className="text-sm text-gray-700 flex gap-2">
                    <span className="text-camara-primary">&bull;</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileJson className="h-5 w-5 text-primary" />
                Catalogo de Dados e Formatos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-700">
                Os conjuntos de dados sao disponibilizados via API publica nos
                formatos <strong>JSON</strong> e <strong>CSV</strong>, sob a licenca
                <strong> Creative Commons CC-BY 4.0</strong> (uso livre com atribuicao).
              </p>
              <Link
                href="/transparencia/dados-abertos"
                className="inline-flex items-center gap-1.5 text-sm text-camara-primary font-medium hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                Acessar o catalogo de dados abertos
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <RefreshCw className="h-5 w-5 text-primary" />
                Periodicidade de Atualizacao
              </CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-3 py-2 font-semibold text-muted-foreground">Conjunto de dados</th>
                    <th className="px-3 py-2 font-semibold text-muted-foreground">Prazo de atualizacao</th>
                  </tr>
                </thead>
                <tbody>
                  {periodicidades.map((p) => (
                    <tr key={p.dado} className="border-t">
                      <td className="px-3 py-2">{p.dado}</td>
                      <td className="px-3 py-2 font-medium">{p.prazo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-camara-primary">
            <CardContent className="p-5">
              <h2 className="font-semibold mb-2">Governanca</h2>
              <p className="text-sm text-gray-700">
                A gestao do Plano de Dados Abertos e de responsabilidade da
                administracao da Camara Municipal, que revisa periodicamente os
                conjuntos publicados e incorpora novas bases conforme a demanda
                social e a evolucao da legislacao.
              </p>
            </CardContent>
          </Card>

          <DocumentosOficiais
            tipo="PLANO_DADOS_ABERTOS"
            titulo="Documento Oficial do Plano de Dados Abertos"
          />
        </div>
      </div>
    </div>
    </TransparenciaPageWrapper>
  )
}
