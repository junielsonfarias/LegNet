import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Scale, Users, FileText, CheckCircle, Shield, MessageSquare, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PapelVereadorPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Papel do Vereador
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Os vereadores são os representantes do povo na Câmara Municipal, 
            responsáveis por legislar e fiscalizar os atos do Poder Executivo.
          </p>
        </div>

        {/* O que é um Vereador */}
        <div className="mb-12">
          <Card className="camara-card">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-camara-primary flex items-center">
                <User className="h-6 w-6 mr-2" />
                O que é um Vereador?
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed mb-4">
                O vereador é o representante eleito pelo povo para exercer o mandato 
                legislativo no âmbito municipal. É o agente político que atua como 
                intermediário entre a população e o governo municipal, defendendo os 
                interesses da comunidade.
              </p>
              <p className="text-gray-700 leading-relaxed">
                O mandato do vereador tem duração de quatro anos e pode ser renovado 
                indefinidamente. Durante esse período, ele tem a responsabilidade de 
                legislar, fiscalizar e representar os cidadãos do município.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Funções do Vereador */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Principais Funções do Vereador
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="camara-card hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                  <Scale className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Legislar</h3>
                <p className="text-sm text-gray-600">
                  Propor, discutir e votar leis que atendam aos interesses da comunidade
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
                  Acompanhar e controlar os atos do Poder Executivo municipal
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
                  Defender os interesses e necessidades dos cidadãos do município
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
                      Proposições Legislativas
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>• Projetos de Lei</li>
                      <li>• Projetos de Resolução</li>
                      <li>• Projetos de Decreto Legislativo</li>
                      <li>• Indicações</li>
                      <li>• Requerimentos</li>
                      <li>• Moções</li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      Processo Legislativo
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>• Discussão e votação de matérias</li>
                      <li>• Participação em comissões</li>
                      <li>• Aprovação do orçamento</li>
                      <li>• Aprovação de contas</li>
                      <li>• Elaboração da Lei Orgânica</li>
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
                      Acompanhar a execução orçamentária e financeira do município, 
                      verificando se os recursos públicos estão sendo aplicados corretamente.
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
                    <h4 className="font-semibold text-gray-900">Controle Social</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Promover o controle social da administração pública, 
                      garantindo transparência e participação popular.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Direitos e Deveres */}
        <div className="mb-12">
          <Card className="camara-card">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-camara-primary">
                Direitos e Deveres do Vereador
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h4 className="font-semibold text-green-700">Direitos</h4>
                  <ul className="space-y-3 text-sm text-gray-700">
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Voto livre e secreto nas deliberações</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Subsídio e auxílios estabelecidos em lei</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Inviolabilidade por opiniões e votos</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Prerrogativas processuais</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Acesso a informações públicas</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                    <h4 className="font-semibold text-red-700">Deveres</h4>
                  <ul className="space-y-3 text-sm text-gray-700">
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Comparecer às sessões da Câmara</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Manter conduta compatível com o decoro</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Prestar contas de campanha eleitoral</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Respeitar o regimento interno</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Defender os interesses da comunidade</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cargos na Mesa Diretora */}
        <div className="mb-12">
          <Card className="camara-card">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-camara-primary">
                Cargos na Mesa Diretora
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <p className="text-gray-700 leading-relaxed">
                  Os vereadores podem ocupar cargos na Mesa Diretora da Câmara, 
                  que são eleitos pelos próprios parlamentares para um mandato de dois anos:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <h4 className="font-semibold text-blue-900 mb-2">Presidente</h4>
                    <p className="text-sm text-blue-700">
                      Dirige os trabalhos da Câmara e representa o Poder Legislativo
                    </p>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg text-center">
                    <h4 className="font-semibold text-green-900 mb-2">Vice-Presidente</h4>
                    <p className="text-sm text-green-700">
                      Substitui o Presidente em suas ausências e impedimentos
                    </p>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg text-center">
                    <h4 className="font-semibold text-purple-900 mb-2">1º Secretário</h4>
                    <p className="text-sm text-purple-700">
                      Responsável pela redação das atas e documentos oficiais
                    </p>
                  </div>

                  <div className="p-4 bg-orange-50 rounded-lg text-center">
                    <h4 className="font-semibold text-orange-900 mb-2">2º Secretário</h4>
                    <p className="text-sm text-orange-700">
                      Auxilia o 1º Secretário e substitui em suas ausências
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Como se Tornar Vereador */}
        <div className="text-center">
          <Card className="camara-card max-w-2xl mx-auto">
            <CardContent className="p-8">
              <User className="h-16 w-16 text-camara-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Como se Tornar Vereador
              </h3>
              <p className="text-gray-600 mb-6">
                Para se candidatar ao cargo de vereador, é necessário atender aos 
                requisitos estabelecidos na legislação eleitoral e municipal.
              </p>
              <Button size="lg" className="w-full md:w-auto">
                <FileText className="h-5 w-5 mr-2" />
                Ver Requisitos
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}