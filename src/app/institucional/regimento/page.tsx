import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, BookOpen, Scale, Users, Calendar, CheckCircle, Clock, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function RegimentoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Regimento Interno
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            O Regimento Interno é o conjunto de normas que disciplina o funcionamento 
            interno da Câmara Municipal, estabelecendo procedimentos e regras de conduta.
          </p>
        </div>

        {/* O que é o Regimento Interno */}
        <div className="mb-12">
          <Card className="camara-card">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-camara-primary flex items-center">
                <BookOpen className="h-6 w-6 mr-2" />
                O que é o Regimento Interno?
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed mb-4">
                O Regimento Interno é um conjunto de normas que disciplina o funcionamento 
                interno da Câmara Municipal, estabelecendo procedimentos, regras de conduta 
                e organização dos trabalhos legislativos. É elaborado pela própria Câmara 
                e aprovado por maioria absoluta dos seus membros.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Ele complementa a Lei Orgânica do Município, detalhando aspectos práticos 
                do funcionamento da Câmara, como a realização das sessões, o processo 
                legislativo, a organização das comissões e os direitos e deveres dos vereadores.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Características do Regimento */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Características do Regimento Interno
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="camara-card hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                  <Scale className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Norma Interna</h3>
                <p className="text-sm text-gray-600">
                  Estabelece regras específicas para o funcionamento da Câmara Municipal
                </p>
              </CardContent>
            </Card>

            <Card className="camara-card hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Elaboração Própria</h3>
                <p className="text-sm text-gray-600">
                  É elaborado e aprovado pela própria Câmara Municipal
                </p>
              </CardContent>
            </Card>

            <Card className="camara-card hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
                  <Calendar className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Flexibilidade</h3>
                <p className="text-sm text-gray-600">
                  Pode ser modificado conforme as necessidades da Câmara
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Conteúdo do Regimento */}
        <div className="mb-12">
          <Card className="camara-card">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-camara-primary">
                Conteúdo do Regimento Interno
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 flex items-center">
                      <FileText className="h-5 w-5 text-blue-600 mr-2" />
                      Organização da Câmara
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>• Mesa Diretora e suas atribuições</li>
                      <li>• Comissões permanentes e temporárias</li>
                      <li>• Estrutura administrativa</li>
                      <li>• Funcionamento dos gabinetes</li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      Processo Legislativo
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>• Tramitação de proposições</li>
                      <li>• Procedimentos de votação</li>
                      <li>• Comissões de mérito</li>
                      <li>• Prazos e procedimentos</li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 flex items-center">
                      <Calendar className="h-5 w-5 text-purple-600 mr-2" />
                      Sessões Legislativas
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>• Tipos de sessões</li>
                      <li>• Convocação e quorum</li>
                      <li>• Ordem do dia</li>
                      <li>• Procedimentos de votação</li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 flex items-center">
                      <Users className="h-5 w-5 text-orange-600 mr-2" />
                      Direitos e Deveres
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>• Direitos dos vereadores</li>
                      <li>• Deveres e obrigações</li>
                      <li>• Prerrogativas parlamentares</li>
                      <li>• Sanções disciplinares</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sessões Legislativas */}
        <div className="mb-12">
          <Card className="camara-card border-l-4 border-l-camara-primary">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-camara-primary">
                Regulamentação das Sessões Legislativas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Sessões Ordinárias</h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>• Dias e horários fixos</li>
                      <li>• Quorum para funcionamento</li>
                      <li>• Ordem do dia</li>
                      <li>• Procedimentos de votação</li>
                      <li>• Registro de presença</li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Sessões Extraordinárias</h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>• Convocação especial</li>
                      <li>• Assuntos específicos</li>
                      <li>• Prazos de convocação</li>
                      <li>• Procedimentos especiais</li>
                      <li>• Limitações de matéria</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-semibold text-gray-900 mb-2">Quorum e Votação</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Quorum de Funcionamento:</span>
                      <p className="text-gray-600">Maioria absoluta dos vereadores</p>
                    </div>
                    <div>
                      <span className="font-medium">Quorum de Deliberação:</span>
                      <p className="text-gray-600">Maioria dos presentes</p>
                    </div>
                    <div>
                      <span className="font-medium">Votação Secreta:</span>
                      <p className="text-gray-600">Quando a lei ou regimento exigir</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Processo Legislativo */}
        <div className="mb-12">
          <Card className="camara-card">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-camara-primary">
                Processo Legislativo no Regimento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <p className="text-gray-700 leading-relaxed">
                  O Regimento Interno detalha todo o processo legislativo, desde a 
                  apresentação de proposições até sua promulgação:
                </p>

                <div className="space-y-4">
                  <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Apresentação</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Proposições são apresentadas pelos vereadores ou pelo Prefeito, 
                        seguindo os procedimentos estabelecidos no regimento.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Análise de Admissibilidade</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        A Mesa Diretora analisa se a proposição atende aos requisitos 
                        formais e de admissibilidade.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Comissões</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        As proposições são encaminhadas às comissões competentes para 
                        análise técnica e jurídica.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      4
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Discussão e Votação</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Após análise das comissões, a proposição é discutida e votada 
                        em plenário, seguindo os procedimentos estabelecidos.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      5
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Promulgação</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Aprovada, a proposição é encaminhada para promulgação pelo 
                        Prefeito e publicação no Diário Oficial.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comissões */}
        <div className="mb-12">
          <Card className="camara-card">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-camara-primary">
                Organização das Comissões
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <p className="text-gray-700 leading-relaxed">
                  O Regimento Interno estabelece a organização e funcionamento das comissões:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Comissões Permanentes</h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>• Comissão de Constituição e Justiça</li>
                      <li>• Comissão de Finanças e Orçamento</li>
                      <li>• Comissão de Obras e Serviços</li>
                      <li>• Comissão de Educação e Cultura</li>
                      <li>• Comissão de Saúde e Assistência</li>
                    </ul>
                    <p className="text-xs text-gray-500 mt-2">
                      Analisam proposições de acordo com sua competência temática
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Comissões Temporárias</h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>• Comissão Especial</li>
                      <li>• Comissão Parlamentar de Inquérito</li>
                      <li>• Comissão de Estudo</li>
                      <li>• Comissão Externa</li>
                    </ul>
                    <p className="text-xs text-gray-500 mt-2">
                      Criadas para assuntos específicos ou investigações
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-semibold text-gray-900 mb-2">Funcionamento das Comissões</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Composição:</span>
                      <p className="text-gray-600">Definida pelo regimento interno</p>
                    </div>
                    <div>
                      <span className="font-medium">Presidente:</span>
                      <p className="text-gray-600">Eleito pelos membros da comissão</p>
                    </div>
                    <div>
                      <span className="font-medium">Quorum:</span>
                      <p className="text-gray-600">Maioria dos membros</p>
                    </div>
                    <div>
                      <span className="font-medium">Deliberações:</span>
                      <p className="text-gray-600">Por maioria dos presentes</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Direitos e Deveres dos Vereadores */}
        <div className="mb-12">
          <Card className="camara-card">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-camara-primary">
                Direitos e Deveres dos Vereadores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="font-semibold text-green-700">Direitos</h4>
                  <ul className="space-y-3 text-sm text-gray-700">
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Participar das sessões e votações</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Integrar comissões</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Apresentar proposições</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Usar da palavra em plenário</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Inviolabilidade por opiniões</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-red-700">Deveres</h4>
                  <ul className="space-y-3 text-sm text-gray-700">
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Comparecer às sessões</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Participar das comissões</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Manter decoro parlamentar</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Respeitar o regimento</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Defender os interesses públicos</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Download do Regimento */}
        <div className="text-center">
          <Card className="camara-card max-w-2xl mx-auto">
            <CardContent className="p-8">
              <FileText className="h-16 w-16 text-camara-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Regimento Interno da Câmara Municipal
              </h3>
              <p className="text-gray-600 mb-6">
                Baixe o documento completo do Regimento Interno em formato PDF
              </p>
              <Button size="lg" className="w-full md:w-auto">
                <FileText className="h-5 w-5 mr-2" />
                Baixar Regimento Interno
              </Button>
              <p className="text-sm text-gray-500 mt-4">
                Última atualização: Janeiro de 2024
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}