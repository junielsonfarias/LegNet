import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building, Scale, Users, FileText, CheckCircle, Shield, Eye, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PapelCamaraPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Papel da Câmara Municipal
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A Câmara Municipal é o Poder Legislativo do município, responsável por 
            legislar e fiscalizar os atos do Poder Executivo, representando os interesses da população.
          </p>
        </div>

        {/* O que é a Câmara Municipal */}
        <div className="mb-12">
          <Card className="camara-card">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-camara-primary flex items-center">
                <Building className="h-6 w-6 mr-2" />
                O que é a Câmara Municipal?
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed mb-4">
                A Câmara Municipal é o Poder Legislativo do município, composta pelos 
                vereadores eleitos pelo povo para representar os interesses da comunidade. 
                É um dos três poderes da República, ao lado do Executivo e do Judiciário.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Sua principal função é legislar, ou seja, criar, modificar e revogar leis 
                que regem a vida municipal, além de fiscalizar os atos do Poder Executivo, 
                garantindo que os recursos públicos sejam utilizados de forma adequada e 
                em benefício da população.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Funções da Câmara */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Principais Funções da Câmara Municipal
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="camara-card hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                  <Scale className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Legislar</h3>
                <p className="text-sm text-gray-600">
                  Elaborar, discutir e aprovar leis que atendam às necessidades da comunidade municipal
                </p>
              </CardContent>
            </Card>

            <Card className="camara-card hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                  <Eye className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Fiscalizar</h3>
                <p className="text-sm text-gray-600">
                  Controlar e acompanhar a execução orçamentária e administrativa do município
                </p>
              </CardContent>
            </Card>

            <Card className="camara-card hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Representar</h3>
                <p className="text-sm text-gray-600">
                  Representar os interesses e anseios da população nas decisões municipais
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Atribuições Legislativas */}
        <div className="mb-12">
          <Card className="camara-card">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-camara-primary">
                Atribuições Legislativas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 flex items-center">
                      <FileText className="h-5 w-5 text-blue-600 mr-2" />
                      Elaboração de Leis
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>• Lei Orgânica do Município</li>
                      <li>• Código Tributário Municipal</li>
                      <li>• Plano Diretor Urbano</li>
                      <li>• Código de Obras e Edificações</li>
                      <li>• Lei de Zoneamento</li>
                      <li>• Estatuto dos Servidores</li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      Processo Legislativo
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>• Discussão e votação de proposições</li>
                      <li>• Aprovação do orçamento anual</li>
                      <li>• Aprovação do Plano Plurianual</li>
                      <li>• Aprovação da Lei de Diretrizes Orçamentárias</li>
                      <li>• Emendas à Lei Orgânica</li>
                      <li>• Criação de distritos</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Atribuições Fiscalizatórias */}
        <div className="mb-12">
          <Card className="camara-card border-l-4 border-l-camara-primary">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-camara-primary">
                Atribuições Fiscalizatórias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <Shield className="h-6 w-6 text-blue-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Fiscalização Financeira</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Acompanhar a execução orçamentária, verificando se os recursos 
                      públicos estão sendo aplicados conforme a lei e em benefício da população.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <Eye className="h-6 w-6 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Controle Administrativo</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Fiscalizar a administração municipal, verificando a legalidade, 
                      legitimidade e economicidade dos atos administrativos.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-purple-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Prestação de Contas</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Apreciar e julgar as contas prestadas pelo Prefeito e demais 
                      agentes da administração municipal.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <Users className="h-6 w-6 text-orange-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Comissões Parlamentares</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Criar comissões para investigar fatos específicos e fiscalizar 
                      órgãos e entidades da administração municipal.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Estrutura da Câmara */}
        <div className="mb-12">
          <Card className="camara-card">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-camara-primary">
                Estrutura da Câmara Municipal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <p className="text-gray-700 leading-relaxed">
                  A Câmara Municipal é composta por vereadores eleitos pelo povo e organizada 
                  da seguinte forma:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Mesa Diretora</h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>• Presidente</li>
                      <li>• Vice-Presidente</li>
                      <li>• 1º Secretário</li>
                      <li>• 2º Secretário</li>
                    </ul>
                    <p className="text-xs text-gray-500 mt-2">
                      Eleitos pelos vereadores para mandato de 2 anos
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Comissões Permanentes</h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>• Comissão de Constituição e Justiça</li>
                      <li>• Comissão de Finanças</li>
                      <li>• Comissão de Obras e Serviços</li>
                      <li>• Comissão de Educação e Cultura</li>
                      <li>• Comissão de Saúde e Assistência</li>
                    </ul>
                    <p className="text-xs text-gray-500 mt-2">
                      Analisam proposições antes da votação em plenário
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
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sessões Legislativas */}
        <div className="mb-12">
          <Card className="camara-card">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-camara-primary">
                Sessões Legislativas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <p className="text-gray-700 leading-relaxed">
                  As sessões legislativas são as reuniões onde os vereadores se reúnem 
                  para discutir e votar as matérias em tramitação:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <h4 className="font-semibold text-blue-900 mb-2">Sessão Ordinária</h4>
                    <p className="text-sm text-blue-700">
                      Realizadas em dias e horários fixos, conforme o regimento interno
                    </p>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg text-center">
                    <h4 className="font-semibold text-green-900 mb-2">Sessão Extraordinária</h4>
                    <p className="text-sm text-green-700">
                      Convocadas para assuntos urgentes ou específicos
                    </p>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg text-center">
                    <h4 className="font-semibold text-purple-900 mb-2">Sessão Solene</h4>
                    <p className="text-sm text-purple-700">
                      Realizadas em datas especiais e eventos comemorativos
                    </p>
                  </div>

                  <div className="p-4 bg-orange-50 rounded-lg text-center">
                    <h4 className="font-semibold text-orange-900 mb-2">Sessão Especial</h4>
                    <p className="text-sm text-orange-700">
                      Convocadas para assuntos específicos ou homenagens
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transparência e Controle Social */}
        <div className="mb-12">
          <Card className="camara-card">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-camara-primary">
                Transparência e Controle Social
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <p className="text-gray-700 leading-relaxed">
                  A Câmara Municipal promove a transparência e o controle social através de:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 flex items-center">
                      <Eye className="h-5 w-5 text-blue-600 mr-2" />
                      Transparência Ativa
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>• Portal da Transparência</li>
                      <li>• Sessões públicas transmitidas</li>
                      <li>• Publicação de atos e deliberações</li>
                      <li>• Relatórios de gestão</li>
                      <li>• Prestação de contas</li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 flex items-center">
                      <Users className="h-5 w-5 text-green-600 mr-2" />
                      Participação Popular
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>• Audiências públicas</li>
                      <li>• Consultas populares</li>
                      <li>• Recebimento de sugestões</li>
                      <li>• Ouvidoria parlamentar</li>
                      <li>• Comissões com participação popular</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Importância da Câmara */}
        <div className="text-center">
          <Card className="camara-card max-w-2xl mx-auto">
            <CardContent className="p-8">
              <Building className="h-16 w-16 text-camara-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                A Importância da Câmara Municipal
              </h3>
              <p className="text-gray-600 mb-6">
                A Câmara Municipal é fundamental para a democracia local, garantindo que 
                as decisões sejam tomadas em benefício da população e que os recursos 
                públicos sejam utilizados de forma transparente e eficiente.
              </p>
              <Button size="lg" className="w-full md:w-auto">
                <FileText className="h-5 w-5 mr-2" />
                Conheça Nossos Vereadores
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}