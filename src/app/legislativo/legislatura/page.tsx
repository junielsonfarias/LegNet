'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Users, FileText, CheckCircle, Clock, Building, Award, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useConfiguracaoInstitucional } from '@/lib/hooks/use-configuracao-institucional'

export default function LegislaturaPage() {
  const { configuracao } = useConfiguracaoInstitucional()
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Legislatura Atual
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Conheça a composição da atual legislatura da {configuracao?.nomeCasa || 'Câmara Municipal'},
            seus representantes e principais realizações.
          </p>
        </div>

        {/* Informações da Legislatura */}
        <div className="mb-12">
          <Card className="camara-card">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-camara-primary flex items-center">
                <Calendar className="h-6 w-6 mr-2" />
                Legislatura 2021-2024
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed mb-4">
                A atual legislatura da {configuracao?.nomeCasa || 'Câmara Municipal'} teve início 
                em 1º de janeiro de 2021 e se estende até 31 de dezembro de 2024. 
                Esta é a 17ª legislatura desde a criação do município.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Durante este período, os vereadores eleitos trabalham em prol do 
                desenvolvimento municipal, elaborando leis, fiscalizando a administração 
                pública e representando os interesses da população.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Estatísticas da Legislatura */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Estatísticas da Legislatura
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="camara-card hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-3xl font-bold text-blue-600 mb-2">11</h3>
                <p className="text-sm text-gray-600">Vereadores Eleitos</p>
              </CardContent>
            </Card>

            <Card className="camara-card hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                  <FileText className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-3xl font-bold text-green-600 mb-2">247</h3>
                <p className="text-sm text-gray-600">Leis Aprovadas</p>
              </CardContent>
            </Card>

            <Card className="camara-card hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
                  <Calendar className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-3xl font-bold text-purple-600 mb-2">156</h3>
                <p className="text-sm text-gray-600">Sessões Realizadas</p>
              </CardContent>
            </Card>

            <Card className="camara-card hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-100 flex items-center justify-center">
                  <BarChart3 className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-3xl font-bold text-orange-600 mb-2">89%</h3>
                <p className="text-sm text-gray-600">Presença Média</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Mesa Diretora */}
        <div className="mb-12">
          <Card className="camara-card">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-camara-primary">
                Mesa Diretora da Legislatura
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <p className="text-gray-700 leading-relaxed">
                  A Mesa Diretora é composta por vereadores eleitos pelos seus pares 
                  para um mandato de dois anos, responsáveis por dirigir os trabalhos da Câmara:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center p-6 bg-blue-50 rounded-lg">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-600 flex items-center justify-center">
                      <Award className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="font-semibold text-blue-900 mb-2">Presidente</h4>
                    <p className="text-blue-700 font-medium mb-1">Pantoja do Cartório</p>
                    <p className="text-sm text-blue-600">2023-2024</p>
                  </div>

                  <div className="text-center p-6 bg-green-50 rounded-lg">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-600 flex items-center justify-center">
                      <Users className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="font-semibold text-green-900 mb-2">Vice-Presidente</h4>
                    <p className="text-green-700 font-medium mb-1">Maria das Graças</p>
                    <p className="text-sm text-green-600">2023-2024</p>
                  </div>

                  <div className="text-center p-6 bg-purple-50 rounded-lg">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-600 flex items-center justify-center">
                      <FileText className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="font-semibold text-purple-900 mb-2">1º Secretário</h4>
                    <p className="text-purple-700 font-medium mb-1">José da Silva</p>
                    <p className="text-sm text-purple-600">2023-2024</p>
                  </div>

                  <div className="text-center p-6 bg-orange-50 rounded-lg">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-600 flex items-center justify-center">
                      <Building className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="font-semibold text-orange-900 mb-2">2º Secretário</h4>
                    <p className="text-orange-700 font-medium mb-1">Ana Paula</p>
                    <p className="text-sm text-orange-600">2023-2024</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Composição Partidária */}
        <div className="mb-12">
          <Card className="camara-card">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-camara-primary">
                Composição Partidária
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <p className="text-gray-700 leading-relaxed">
                  A atual legislatura é composta por vereadores de diferentes partidos políticos:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 bg-red-50 rounded-lg">
                    <h4 className="font-semibold text-red-900 mb-2">Partido dos Trabalhadores (PT)</h4>
                    <p className="text-2xl font-bold text-red-600">3</p>
                    <p className="text-sm text-red-700">vereadores</p>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Partido Social Democrático (PSD)</h4>
                    <p className="text-2xl font-bold text-blue-600">2</p>
                    <p className="text-sm text-blue-700">vereadores</p>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">Partido Verde (PV)</h4>
                    <p className="text-2xl font-bold text-green-600">2</p>
                    <p className="text-sm text-green-700">vereadores</p>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-semibold text-purple-900 mb-2">Partido Liberal (PL)</h4>
                    <p className="text-2xl font-bold text-purple-600">2</p>
                    <p className="text-sm text-purple-700">vereadores</p>
                  </div>

                  <div className="p-4 bg-orange-50 rounded-lg">
                    <h4 className="font-semibold text-orange-900 mb-2">Partido Republicano (PR)</h4>
                    <p className="text-2xl font-bold text-orange-600">1</p>
                    <p className="text-sm text-orange-700">vereador</p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Outros</h4>
                    <p className="text-2xl font-bold text-gray-600">1</p>
                    <p className="text-sm text-gray-700">vereador</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Principais Realizações */}
        <div className="mb-12">
          <Card className="camara-card border-l-4 border-l-camara-primary">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-camara-primary">
                Principais Realizações da Legislatura
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Lei do Orçamento Participativo</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Implementação do orçamento participativo, permitindo maior envolvimento 
                      da população nas decisões orçamentárias do município.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Código de Proteção Animal</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Criação de legislação específica para proteção e bem-estar dos animais 
                      no município, estabelecendo políticas públicas de controle populacional.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Lei de Incentivo à Cultura</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Estabelecimento de mecanismos de fomento à cultura local, incluindo 
                      incentivos fiscais e editais públicos para projetos culturais.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Plano Municipal de Saneamento</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Aprovação do Plano Municipal de Saneamento Básico, estabelecendo 
                      diretrizes para o desenvolvimento sustentável do município.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Transparência Digital</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Implementação de sistema de transparência digital, garantindo 
                      acesso público às informações sobre a gestão municipal.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comissões Permanentes */}
        <div className="mb-12">
          <Card className="camara-card">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-camara-primary">
                Comissões Permanentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <p className="text-gray-700 leading-relaxed">
                  As comissões permanentes são órgãos técnicos da Câmara responsáveis 
                  pela análise prévia das proposições legislativas:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">Comissão de Constituição e Justiça</h4>
                      <p className="text-sm text-gray-600 mb-2">Presidente: Diego do Zé Neto</p>
                      <p className="text-xs text-gray-500">Analisa a constitucionalidade e legalidade das proposições</p>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">Comissão de Finanças</h4>
                      <p className="text-sm text-gray-600 mb-2">Presidente: Pantoja do Cartório</p>
                      <p className="text-xs text-gray-500">Analisa matérias de natureza financeira e orçamentária</p>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">Comissão de Obras e Serviços</h4>
                      <p className="text-sm text-gray-600 mb-2">Presidente: Maria das Graças</p>
                      <p className="text-xs text-gray-500">Analisa questões relacionadas à infraestrutura urbana</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">Comissão de Educação</h4>
                      <p className="text-sm text-gray-600 mb-2">Presidente: Ana Paula</p>
                      <p className="text-xs text-gray-500">Analisa questões educacionais e culturais</p>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">Comissão de Saúde</h4>
                      <p className="text-sm text-gray-600 mb-2">Presidente: José da Silva</p>
                      <p className="text-xs text-gray-500">Analisa questões de saúde pública e assistência social</p>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">Comissão de Meio Ambiente</h4>
                      <p className="text-sm text-gray-600 mb-2">Presidente: Carlos Santos</p>
                      <p className="text-xs text-gray-500">Analisa questões ambientais e de sustentabilidade</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cronograma da Legislatura */}
        <div className="mb-12">
          <Card className="camara-card">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-camara-primary">
                Cronograma da Legislatura
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Período Legislativo 2021-2022</h4>
                    <div className="space-y-2 text-sm text-gray-700">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-blue-600 mr-2" />
                        <span>Início: Janeiro de 2021</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                        <span>89 sessões realizadas</span>
                      </div>
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 text-purple-600 mr-2" />
                        <span>127 leis aprovadas</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Período Legislativo 2023-2024</h4>
                    <div className="space-y-2 text-sm text-gray-700">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-blue-600 mr-2" />
                        <span>Início: Janeiro de 2023</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                        <span>67 sessões realizadas</span>
                      </div>
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 text-purple-600 mr-2" />
                        <span>120 leis aprovadas</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-semibold text-gray-900 mb-2">Próximos Eventos</h5>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-center justify-between">
                      <span>Reunião da Mesa Diretora</span>
                      <span className="text-blue-600 font-medium">15/01/2024</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Sessão Ordinária</span>
                      <span className="text-blue-600 font-medium">20/01/2024</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Audiência Pública - Orçamento 2024</span>
                      <span className="text-blue-600 font-medium">25/01/2024</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Acesso às Informações */}
        <div className="text-center">
          <Card className="camara-card max-w-2xl mx-auto">
            <CardContent className="p-8">
              <Building className="h-16 w-16 text-camara-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Acesse Mais Informações
              </h3>
              <p className="text-gray-600 mb-6">
                Explore as atividades legislativas, proposições em tramitação e 
                histórico completo da legislatura.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg">
                  <Users className="h-5 w-5 mr-2" />
                  Ver Vereadores
                </Button>
                <Button size="lg" variant="outline">
                  <FileText className="h-5 w-5 mr-2" />
                  Proposições
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}