import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building, Users, Calendar, FileText, Shield, Heart } from 'lucide-react'

export default function SobrePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Sobre a Câmara Municipal
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Conheça a história, missão e valores da Câmara Municipal de Mojuí dos Campos, 
            instituição dedicada ao exercício do Poder Legislativo e à representação do povo.
          </p>
        </div>

        {/* História */}
        <div className="mb-12">
          <Card className="camara-card">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-camara-primary flex items-center">
                <Building className="h-6 w-6 mr-2" />
                Nossa História
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed mb-4">
                A Câmara Municipal de Mojuí dos Campos foi criada com o objetivo de exercer o Poder Legislativo 
                no município, representando os interesses da população e promovendo o desenvolvimento local 
                através da elaboração de leis e do controle da administração municipal.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Instalada em [ano de instalação], nossa Casa Legislativa tem como missão principal representar 
                o povo de Mojuí dos Campos, elaborando leis que atendam às necessidades da comunidade e 
                fiscalizando a aplicação dos recursos públicos.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Ao longo dos anos, a Câmara tem se consolidado como uma instituição democrática e transparente, 
                sempre em busca do bem-estar coletivo e do desenvolvimento sustentável do município.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Missão, Visão e Valores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="camara-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-camara-primary flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Missão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                Representar o povo de Mojuí dos Campos, elaborando leis que promovam o desenvolvimento 
                social, econômico e cultural do município, sempre com transparência e responsabilidade.
              </p>
            </CardContent>
          </Card>

          <Card className="camara-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-camara-primary flex items-center">
                <Heart className="h-5 w-5 mr-2" />
                Visão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                Ser reconhecida como uma Casa Legislativa moderna, eficiente e transparente, 
                que contribui efetivamente para o desenvolvimento sustentável de Mojuí dos Campos.
              </p>
            </CardContent>
          </Card>

          <Card className="camara-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-camara-primary flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Valores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-gray-700 space-y-2">
                <li>• Transparência</li>
                <li>• Democracia</li>
                <li>• Ética</li>
                <li>• Responsabilidade</li>
                <li>• Compromisso com o povo</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Estrutura Organizacional */}
        <div className="mb-12">
          <Card className="camara-card">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-camara-primary">
                Estrutura Organizacional
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Mesa Diretora</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-camara-gold rounded-full"></div>
                      <span className="text-gray-700">Presidente: Pantoja do Cartório</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-camara-primary rounded-full"></div>
                      <span className="text-gray-700">Vice-presidente: Diego do Zé Neto</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-camara-secondary rounded-full"></div>
                      <span className="text-gray-700">1º Secretário: Mickael Aguiar</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-camara-accent rounded-full"></div>
                      <span className="text-gray-700">2º Secretário: Jesa do Palhalzinho</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Composição</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Users className="h-5 w-5 text-camara-primary" />
                      <span className="text-gray-700">11 Vereadores eleitos</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-camara-primary" />
                      <span className="text-gray-700">Legislatura 2025/2028</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-camara-primary" />
                      <span className="text-gray-700">Comissões permanentes</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Atribuições */}
        <div className="mb-12">
          <Card className="camara-card">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-camara-primary">
                Principais Atribuições
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Função Legislativa</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Elaborar e aprovar leis municipais</li>
                    <li>• Aprovar o orçamento anual</li>
                    <li>• Criar, alterar e extinguir tributos</li>
                    <li>• Autorizar empréstimos e operações de crédito</li>
                    <li>• Dispor sobre organização administrativa</li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Função Fiscalizadora</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Fiscalizar a administração municipal</li>
                    <li>• Controlar a execução orçamentária</li>
                    <li>• Apreciar as contas do Prefeito</li>
                    <li>• Realizar audiências públicas</li>
                    <li>• Solicitar informações e documentos</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Informações de Contato */}
        <div className="mb-12">
          <Card className="camara-card">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-camara-primary">
                Informações de Contato
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Endereço</h3>
                  <p className="text-gray-700">
                    Rua Deputado José Macêdo, S/Nº - Centro<br />
                    68.129-000 - Mojuí dos Campos/PA
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contato</h3>
                  <div className="space-y-2 text-gray-700">
                    <p><strong>Telefone:</strong> (93) 9.9138-8426</p>
                    <p><strong>Email:</strong> camaramojui@gmail.com</p>
                    <p><strong>Horário:</strong> De 08:00h às 14:00h, Segunda à Sexta</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CNPJ e Dados Legais */}
        <div className="text-center">
          <Card className="camara-card max-w-2xl mx-auto">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Dados Legais</h3>
              <div className="space-y-2 text-gray-700">
                <p><strong>CNPJ:</strong> 17.434.855/0001-23</p>
                <p><strong>Legislatura:</strong> 2025/2028</p>
                <p><strong>Presidente:</strong> Pantoja do Cartório</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
