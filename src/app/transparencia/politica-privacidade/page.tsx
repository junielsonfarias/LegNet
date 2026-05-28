import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ShieldCheck, ArrowLeft, Lock, UserCheck, FileText, AlertCircle, ExternalLink,
} from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { createLogger } from '@/lib/logging/logger'
import { DocumentosOficiais } from '@/components/transparencia/documentos-oficiais'
import { TransparenciaPageWrapper } from '@/components/transparencia/transparencia-page-wrapper'

const log = createLogger('transparencia/politica-privacidade')

export const revalidate = 3600 // QW-4: ISR 1h - documento institucional muda raramente

const CHAVES_DPO = [
  'lgpd_encarregado_nome',
  'lgpd_encarregado_email',
  'lgpd_encarregado_telefone',
  'lgpd_encarregado_setor',
]

const principios = [
  {
    titulo: 'Finalidade',
    texto: 'Tratamos dados pessoais apenas para finalidades especificas, legitimas e explicitamente informadas ao titular.',
  },
  {
    titulo: 'Adequacao e necessidade',
    texto: 'Limitamos o tratamento ao minimo necessario para cumprir a finalidade legal ou institucional declarada.',
  },
  {
    titulo: 'Livre acesso',
    texto: 'Asseguramos ao titular consulta facilitada e gratuita sobre o tratamento e a integralidade de seus dados pessoais.',
  },
  {
    titulo: 'Qualidade dos dados',
    texto: 'Mantemos os dados exatos, claros, relevantes e atualizados, conforme a necessidade e a periodicidade do tratamento.',
  },
  {
    titulo: 'Transparencia',
    texto: 'Garantimos informacoes claras, precisas e facilmente acessiveis sobre a realizacao do tratamento e os agentes envolvidos.',
  },
  {
    titulo: 'Seguranca',
    texto: 'Utilizamos medidas tecnicas e administrativas para proteger os dados de acessos nao autorizados, destruicao, perda ou difusao indevida.',
  },
  {
    titulo: 'Prevencao',
    texto: 'Adotamos medidas para prevenir a ocorrencia de danos em virtude do tratamento de dados pessoais.',
  },
  {
    titulo: 'Nao discriminacao',
    texto: 'Vedamos o tratamento de dados pessoais para fins discriminatorios, ilicitos ou abusivos.',
  },
  {
    titulo: 'Responsabilizacao e prestacao de contas',
    texto: 'Demonstramos a adocao de medidas eficazes e capazes de comprovar o cumprimento das normas de protecao de dados pessoais.',
  },
]

const direitosTitular = [
  'Confirmacao da existencia de tratamento',
  'Acesso aos dados pessoais tratados',
  'Correcao de dados incompletos, inexatos ou desatualizados',
  'Anonimizacao, bloqueio ou eliminacao de dados desnecessarios, excessivos ou tratados em desconformidade',
  'Portabilidade dos dados a outro fornecedor de servico ou produto',
  'Eliminacao dos dados pessoais tratados com base em consentimento',
  'Informacao sobre entidades publicas e privadas com as quais os dados foram compartilhados',
  'Informacao sobre a possibilidade de nao fornecer consentimento e suas consequencias',
  'Revogacao do consentimento',
]

const dadosColetados = [
  {
    categoria: 'Cidadao em geral',
    exemplos: 'Visitas ao portal, preenchimento de formularios de Ouvidoria, e-SIC, participacao em consultas publicas e inscricoes em audiencias.',
  },
  {
    categoria: 'Parlamentares e servidores',
    exemplos: 'Dados funcionais, cadastrais e biograficos divulgados em atendimento ao principio constitucional da publicidade.',
  },
  {
    categoria: 'Fornecedores e prestadores',
    exemplos: 'Dados cadastrais necessarios a celebracao de contratos, convenios e ao cumprimento da Lei 14.133/2021.',
  },
]

export default async function PoliticaPrivacidadePage() {
  const mapaDpo: Record<string, string> = {}

  try {
    const rows = await prisma.configuracao.findMany({
      where: { chave: { in: CHAVES_DPO } },
      select: { chave: true, valor: true },
    })
    rows.forEach((r) => {
      mapaDpo[r.chave] = r.valor
    })
  } catch (error) {
    log.error('Erro ao buscar dados do DPO', error)
  }

  const dpoNome = mapaDpo['lgpd_encarregado_nome']?.trim() || ''
  const dpoEmail = mapaDpo['lgpd_encarregado_email']?.trim() || ''
  const dpoSetor = mapaDpo['lgpd_encarregado_setor']?.trim() || ''
  const dpoTelefone = mapaDpo['lgpd_encarregado_telefone']?.trim() || ''
  const dpoDesignado = dpoNome.length > 0

  return (
    <TransparenciaPageWrapper slug="politica-privacidade" nome="Politica de Privacidade">
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
            <ShieldCheck className="h-8 w-8 text-primary" />
            Politica de Privacidade e Protecao de Dados
          </h1>
          <p className="text-muted-foreground">
            Diretrizes adotadas pela Camara Municipal no tratamento de dados
            pessoais, em conformidade com a Lei Geral de Protecao de Dados
            (Lei nº 13.709/2018 - LGPD) e a Lei de Acesso a Informacao
            (Lei nº 12.527/2011 - LAI).
          </p>
        </div>

        <div className="space-y-6">
          <Card className="border-l-4 border-l-camara-primary">
            <CardContent className="p-5 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-camara-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-700">
                Esta Politica aplica-se a todo tratamento de dados pessoais
                realizado pela Camara Municipal, seja no portal institucional,
                em servicos digitais ou em atendimentos presenciais. O cidadao
                pode, a qualquer tempo, exercer seus direitos previstos na LGPD.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lock className="h-5 w-5 text-primary" />
                Principios do Tratamento (Art. 6 da LGPD)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {principios.map((p) => (
                  <li key={p.titulo} className="text-sm">
                    <strong className="text-gray-900">{p.titulo}:</strong>{' '}
                    <span className="text-gray-700">{p.texto}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" />
                Dados Coletados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-3 py-2 font-semibold text-muted-foreground">Categoria</th>
                    <th className="px-3 py-2 font-semibold text-muted-foreground">Exemplos</th>
                  </tr>
                </thead>
                <tbody>
                  {dadosColetados.map((d) => (
                    <tr key={d.categoria} className="border-t">
                      <td className="px-3 py-2 font-medium align-top whitespace-nowrap">{d.categoria}</td>
                      <td className="px-3 py-2 text-gray-700">{d.exemplos}</td>
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
                Direitos do Titular (Art. 18 da LGPD)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {direitosTitular.map((d) => (
                  <li key={d} className="text-sm text-gray-700 flex gap-2">
                    <span className="text-camara-primary">&bull;</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground mt-4">
                Para exercer qualquer direito, contate o Encarregado pelo
                Tratamento de Dados (DPO) ou utilize o e-SIC.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Encarregado pelo Tratamento de Dados (DPO)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!dpoDesignado ? (
                <p className="text-sm text-muted-foreground">
                  Encarregado nao designado/divulgado. Para exercer direitos
                  previstos na LGPD, utilize os canais oficiais (Ouvidoria,
                  e-SIC ou atendimento presencial).
                </p>
              ) : (
                <div className="space-y-1 text-sm">
                  <p><strong>Nome:</strong> {dpoNome}</p>
                  {dpoSetor && <p><strong>Setor:</strong> {dpoSetor}</p>}
                  {dpoEmail && <p><strong>E-mail:</strong> {dpoEmail}</p>}
                  {dpoTelefone && <p><strong>Telefone:</strong> {dpoTelefone}</p>}
                </div>
              )}
              <Link
                href="/transparencia/encarregado-dados"
                className="inline-flex items-center gap-1.5 text-sm text-camara-primary font-medium hover:underline mt-3"
              >
                <ExternalLink className="h-4 w-4" />
                Ver pagina completa do DPO
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" />
                Base Legal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-gray-700">
                <li><strong>Lei nº 13.709/2018</strong> - Lei Geral de Protecao de Dados (LGPD)</li>
                <li><strong>Lei nº 12.527/2011</strong> - Lei de Acesso a Informacao (LAI)</li>
                <li><strong>Lei nº 14.129/2021</strong> - Governo Digital</li>
                <li><strong>Art. 5º, X, XII e XXXIII</strong> da Constituicao Federal</li>
              </ul>
            </CardContent>
          </Card>

          <DocumentosOficiais
            tipo="POLITICA_PRIVACIDADE"
            titulo="Documento Oficial da Politica de Privacidade"
          />

          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-5">
              <h2 className="font-semibold mb-2">Atualizacoes desta Politica</h2>
              <p className="text-sm text-gray-700">
                Esta Politica pode ser atualizada a qualquer momento para refletir
                mudancas regulamentares, tecnologicas ou organizacionais. Recomendamos
                a consulta periodica desta pagina. A versao oficial vigente,
                quando publicada como documento, encontra-se na secao
                &ldquo;Documento Oficial&rdquo; acima.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </TransparenciaPageWrapper>
  )
}
