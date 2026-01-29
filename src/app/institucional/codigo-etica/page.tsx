'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Users, Scale, Heart, Eye, CheckCircle } from 'lucide-react'
import { useConfiguracaoInstitucional } from '@/lib/hooks/use-configuracao-institucional'

export default function CodigoEticaPage() {
  const { configuracao } = useConfiguracaoInstitucional()
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Código de Ética
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Princípios éticos e valores que norteiam a conduta dos vereadores e servidores 
            da {configuracao?.nomeCasa || 'Câmara Municipal'}.
          </p>
        </div>

        {/* Introdução */}
        <div className="mb-12">
          <Card className="camara-card">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-camara-primary flex items-center">
                <Shield className="h-6 w-6 mr-2" />
                Introdução
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed mb-4">
                O Código de Ética da {configuracao?.nomeCasa || 'Câmara Municipal'} estabelece os princípios 
                e valores que devem orientar a conduta de todos os vereadores e servidores desta 
                Casa Legislativa, garantindo a transparência, a integridade e o compromisso com 
                o interesse público.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Este documento reflete nosso compromisso com a ética, a moralidade e o respeito 
                aos valores democráticos, servindo como guia para todas as nossas ações e decisões.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Princípios Fundamentais */}
        <div className="mb-12">
          <Card className="camara-card">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-camara-primary">
                Princípios Fundamentais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Scale className="h-12 w-12 text-camara-primary mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">Legalidade</h3>
                  <p className="text-sm text-gray-600">
                    Respeitar e cumprir todas as leis e normas vigentes
                  </p>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Eye className="h-12 w-12 text-camara-accent mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">Transparência</h3>
                  <p className="text-sm text-gray-600">
                    Agir com clareza e abertura em todas as ações
                  </p>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Heart className="h-12 w-12 text-camara-secondary mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">Integridade</h3>
                  <p className="text-sm text-gray-600">
                    Manter conduta íntegra e honesta em todas as situações
                  </p>
                </div>
                
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <Users className="h-12 w-12 text-camara-gold mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">Imparcialidade</h3>
                  <p className="text-sm text-gray-600">
                    Decidir sem favorecimentos ou discriminações
                  </p>
                </div>
                
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <Shield className="h-12 w-12 text-camara-primary mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">Responsabilidade</h3>
                  <p className="text-sm text-gray-600">
                    Assumir as consequências de suas ações e decisões
                  </p>
                </div>
                
                <div className="text-center p-4 bg-indigo-50 rounded-lg">
                  <CheckCircle className="h-12 w-12 text-camara-accent mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">Eficiência</h3>
                  <p className="text-sm text-gray-600">
                    Buscar sempre a melhor qualidade nos serviços prestados
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Deveres dos Vereadores */}
        <div className="mb-12">
          <Card className="camara-card">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-camara-primary">
                Deveres dos Vereadores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-l-4 border-camara-primary pl-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Representação Popular</h3>
                  <p className="text-gray-700">
                    Representar fielmente os interesses da população, ouvindo suas demandas 
                    e trabalhando para o bem comum.
                  </p>
                </div>
                
                <div className="border-l-4 border-camara-secondary pl-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Participação nas Sessões</h3>
                  <p className="text-gray-700">
                    Participar regularmente das sessões legislativas, comissões e demais 
                    atividades da Casa.
                  </p>
                </div>
                
                <div className="border-l-4 border-camara-accent pl-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Fiscalização</h3>
                  <p className="text-gray-700">
                    Fiscalizar a administração municipal, garantindo o uso correto dos 
                    recursos públicos.
                  </p>
                </div>
                
                <div className="border-l-4 border-camara-gold pl-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Elaboração de Leis</h3>
                  <p className="text-gray-700">
                    Propor e debater leis que atendam às necessidades da comunidade 
                    e promovam o desenvolvimento local.
                  </p>
                </div>
                
                <div className="border-l-4 border-camara-primary pl-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Transparência</h3>
                  <p className="text-gray-700">
                    Manter transparência em suas ações, prestar contas à população 
                    e divulgar suas atividades.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Deveres dos Servidores */}
        <div className="mb-12">
          <Card className="camara-card">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-camara-primary">
                Deveres dos Servidores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Atendimento ao Público</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Atender com cortesia e respeito</li>
                    <li>• Prestar informações claras e precisas</li>
                    <li>• Manter sigilo quando necessário</li>
                    <li>• Ser pontual e eficiente</li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Conduta Profissional</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Cumprir horários e prazos</li>
                    <li>• Manter atualização profissional</li>
                    <li>• Preservar o patrimônio público</li>
                    <li>• Evitar conflitos de interesse</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Proibições */}
        <div className="mb-12">
          <Card className="camara-card">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-camara-primary">
                Condutas Proibidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Para Vereadores</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Aceitar presentes ou vantagens indevidas</li>
                    <li>• Usar cargo para benefício próprio</li>
                    <li>• Discriminar ou perseguir pessoas</li>
                    <li>• Divulgar informações sigilosas</li>
                    <li>• Ausentar-se sem justificativa</li>
                    <li>• Praticar atos de corrupção</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Para Servidores</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Usar cargo para fins particulares</li>
                    <li>• Aceitar subornos ou propinas</li>
                    <li>• Negligenciar suas obrigações</li>
                    <li>• Faltar sem justificativa</li>
                    <li>• Divulgar informações confidenciais</li>
                    <li>• Praticar assédio moral ou sexual</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sanções */}
        <div className="mb-12">
          <Card className="camara-card">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-camara-primary">
                Sanções e Penalidades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Advertência</h3>
                  <p className="text-gray-700">
                    Para infrações leves, com caráter educativo e preventivo.
                  </p>
                </div>
                
                <div className="bg-orange-50 border-l-4 border-orange-400 p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Suspensão</h3>
                  <p className="text-gray-700">
                    Para infrações de média gravidade, com afastamento temporário das funções.
                  </p>
                </div>
                
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Demissão/Cassção</h3>
                  <p className="text-gray-700">
                    Para infrações graves, com perda definitiva do cargo ou mandato.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comissão de Ética */}
        <div className="mb-12">
          <Card className="camara-card">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-camara-primary">
                Comissão de Ética
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  A Comissão de Ética é responsável por receber, analisar e julgar denúncias 
                  de violação ao Código de Ética, garantindo o cumprimento dos princípios 
                  estabelecidos neste documento.
                </p>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Como Denunciar</h3>
                  <p className="text-gray-700">
                    Denúncias podem ser feitas através da Ouvidoria da Câmara, 
                    por escrito ou através dos canais oficiais de comunicação.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Compromisso */}
        <div className="text-center">
          <Card className="camara-card max-w-4xl mx-auto">
            <CardContent className="p-8">
              <Shield className="h-16 w-16 text-camara-primary mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                Nosso Compromisso
              </h3>
              <p className="text-lg text-gray-700 leading-relaxed">
                A {configuracao?.nomeCasa || 'Câmara Municipal'} compromete-se a cumprir rigorosamente 
                este Código de Ética, promovendo uma cultura de integridade, transparência 
                e responsabilidade em todas as suas ações, sempre em benefício da população 
                e do desenvolvimento do município.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
