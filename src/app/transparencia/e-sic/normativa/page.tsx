import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Scale, ArrowLeft, Clock, AlertCircle, ListChecks, UserCheck, ExternalLink,
} from 'lucide-react'
import { DocumentosOficiais } from '@/components/transparencia/documentos-oficiais'
import { TransparenciaPageWrapper } from '@/components/transparencia/transparencia-page-wrapper'

export const revalidate = 3600 // QW-4: ISR 1h - normativa legal (LAI)

const prazos = [
  {
    fase: 'Resposta inicial',
    prazo: '20 dias uteis',
    base: 'LAI Art. 11, § 1º',
    descricao: 'O orgao deve responder ao pedido em ate 20 dias uteis a partir do protocolo.',
  },
  {
    fase: 'Prorrogacao (excepcional)',
    prazo: '+ 10 dias uteis',
    base: 'LAI Art. 11, § 2º',
    descricao: 'Mediante justificativa expressa, comunicada ao requerente antes do termo do prazo original.',
  },
  {
    fase: 'Recurso de 1ª instancia',
    prazo: '10 dias uteis para interpor',
    base: 'LAI Art. 15',
    descricao: 'Apos resposta negativa ou silencio, o requerente pode recorrer a autoridade hierarquicamente superior.',
  },
  {
    fase: 'Decisao do recurso de 1ª instancia',
    prazo: '5 dias uteis',
    base: 'LAI Art. 15, paragrafo unico',
    descricao: 'A autoridade superior decide o recurso em ate 5 dias uteis.',
  },
  {
    fase: 'Recurso de 2ª instancia',
    prazo: '10 dias uteis para interpor',
    base: 'LAI Art. 16 (aplicacao subsidiaria municipal)',
    descricao: 'Se negado em 1ª instancia, novo recurso a autoridade maxima do orgao.',
  },
]

const procedimentos = [
  {
    titulo: '1. Como pedir informacao',
    texto:
      'Acesse a pagina /institucional/e-sic e preencha o formulario com seus dados, o assunto e o detalhamento do que voce deseja saber. Voce recebera um numero de protocolo para acompanhamento.',
  },
  {
    titulo: '2. Acompanhamento',
    texto:
      'Acompanhe o status do pedido em /institucional/ouvidoria/acompanhar usando o protocolo e o CPF cadastrado.',
  },
  {
    titulo: '3. Resposta',
    texto:
      'A Camara respondera no prazo legal. Em caso de resposta parcial ou negativa, o cidadao pode interpor recurso.',
  },
  {
    titulo: '4. Recursos',
    texto:
      'O recurso de 1ª instancia e analisado pela autoridade hierarquicamente superior. O recurso de 2ª instancia, pela autoridade maxima da Camara.',
  },
]

export default function NormativaESICPage() {
  return (
    <TransparenciaPageWrapper slug="marco-normativo-lai" nome="Marco Normativo da LAI">
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Link
          href="/institucional/e-sic"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar ao e-SIC
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Scale className="h-8 w-8 text-primary" />
            Marco Normativo da LAI e Prazos
          </h1>
          <p className="text-muted-foreground">
            Regulamentacao local da Lei de Acesso a Informacao (Lei nº 12.527/2011),
            prazos de resposta e procedimento de recurso. Atende aos criterios
            12.5 e 12.6 da Matriz PNTP 2026.
          </p>
        </div>

        <div className="space-y-6">
          <Card className="border-l-4 border-l-camara-primary">
            <CardContent className="p-5 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-camara-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-700">
                O acesso a informacao publica e um direito fundamental do cidadao
                (Art. 5º, XXXIII da CF). A Camara Municipal segue a LAI federal e
                a regulamentacao municipal aplicavel.
              </p>
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
                    <th className="px-3 py-2 font-semibold text-muted-foreground">Fase</th>
                    <th className="px-3 py-2 font-semibold text-muted-foreground">Prazo</th>
                    <th className="px-3 py-2 font-semibold text-muted-foreground">Base legal</th>
                  </tr>
                </thead>
                <tbody>
                  {prazos.map((p) => (
                    <tr key={p.fase} className="border-t align-top">
                      <td className="px-3 py-2">
                        <p className="font-medium">{p.fase}</p>
                        <p className="text-xs text-muted-foreground">{p.descricao}</p>
                      </td>
                      <td className="px-3 py-2 font-medium whitespace-nowrap">{p.prazo}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">{p.base}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserCheck className="h-5 w-5 text-primary" />
                Autoridades Competentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>
                  <strong>Pedido inicial (e-SIC):</strong> Setor de Servico de
                  Informacao ao Cidadao, vinculado a Procuradoria/Diretoria
                  Administrativa.
                </li>
                <li>
                  <strong>Recurso de 1ª instancia:</strong> Diretor-Geral ou
                  autoridade hierarquicamente superior ao setor responsavel.
                </li>
                <li>
                  <strong>Recurso de 2ª instancia:</strong> Mesa Diretora ou
                  Presidente da Camara Municipal.
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ListChecks className="h-5 w-5 text-primary" />
                Procedimento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {procedimentos.map((p) => (
                  <div key={p.titulo}>
                    <p className="font-medium text-sm">{p.titulo}</p>
                    <p className="text-sm text-gray-700">{p.texto}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <DocumentosOficiais
            tipo="REGULAMENTO_LAI"
            titulo="Regulamento Municipal da LAI"
          />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ExternalLink className="h-5 w-5 text-primary" />
                Veja tambem
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm">
                <li>
                  <Link href="/institucional/e-sic" className="text-camara-primary hover:underline">
                    Fazer um pedido de informacao (e-SIC)
                  </Link>
                </li>
                <li>
                  <Link href="/transparencia/e-sic/estatisticas" className="text-camara-primary hover:underline">
                    Estatisticas do e-SIC
                  </Link>
                </li>
                <li>
                  <Link href="/transparencia/informacoes-classificadas" className="text-camara-primary hover:underline">
                    Rol de Informacoes Classificadas (LAI Art. 30)
                  </Link>
                </li>
                <li>
                  <Link href="/transparencia/encarregado-dados" className="text-camara-primary hover:underline">
                    Encarregado de Dados (DPO)
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
