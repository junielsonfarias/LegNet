import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, Phone, Mail, MapPin, Clock, Shield, FileText, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function OuvidoriaPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Ouvidoria
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Canal de comunicação direta entre você e a Câmara Municipal. 
            Registre suas sugestões, reclamações, elogios ou denúncias.
          </p>
        </div>

        {/* O que é a Ouvidoria */}
        <div className="mb-12">
          <Card className="camara-card">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-camara-primary flex items-center">
                <MessageSquare className="h-6 w-6 mr-2" />
                O que é a Ouvidoria?
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed mb-4">
                A Ouvidoria da Câmara Municipal é um canal de comunicação direto entre 
                os cidadãos e a administração legislativa. Sua função principal é receber, 
                registrar e encaminhar manifestações, garantindo uma resposta adequada e 
                dentro dos prazos estabelecidos.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Através da Ouvidoria, você pode apresentar reclamações, sugestões, elogios, 
                denúncias e solicitar informações sobre os serviços prestados pela Câmara 
                Municipal.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tipos de Manifestação */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Tipos de Manifestação
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="camara-card hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Reclamação</h3>
                <p className="text-sm text-gray-600">
                  Relate problemas ou irregularidades nos serviços prestados
                </p>
              </CardContent>
            </Card>

            <Card className="camara-card hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                  <MessageSquare className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Sugestão</h3>
                <p className="text-sm text-gray-600">
                  Proponha melhorias para os serviços e processos
                </p>
              </CardContent>
            </Card>

            <Card className="camara-card hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Shield className="h-8 w-8 text-yellow-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Denúncia</h3>
                <p className="text-sm text-gray-600">
                  Informe irregularidades ou atos ilícitos (pode ser anônima)
                </p>
              </CardContent>
            </Card>

            <Card className="camara-card hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Elogio</h3>
                <p className="text-sm text-gray-600">
                  Reconheça bons serviços e atendimentos recebidos
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Formulário de Contato */}
        <div className="mb-12">
          <Card className="camara-card">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-camara-primary">
                Registre sua Manifestação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="nome">Nome Completo *</Label>
                    <Input 
                      id="nome" 
                      placeholder="Digite seu nome completo"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">E-mail *</Label>
                    <Input 
                      id="email" 
                      type="email"
                      placeholder="seu@email.com"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input 
                      id="telefone" 
                      placeholder="(00) 00000-0000"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="tipo">Tipo de Manifestação *</Label>
                    <Select>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="reclamacao">Reclamação</SelectItem>
                        <SelectItem value="sugestao">Sugestão</SelectItem>
                        <SelectItem value="denuncia">Denúncia</SelectItem>
                        <SelectItem value="elogio">Elogio</SelectItem>
                        <SelectItem value="informacao">Solicitação de Informação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="assunto">Assunto *</Label>
                  <Input 
                    id="assunto" 
                    placeholder="Resumo do assunto"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="mensagem">Mensagem *</Label>
                  <Textarea 
                    id="mensagem" 
                    placeholder="Descreva detalhadamente sua manifestação..."
                    rows={6}
                    className="mt-1"
                  />
                </div>

                <div className="flex items-start space-x-2">
                  <input 
                    type="checkbox" 
                    id="anonimo" 
                    className="mt-1"
                  />
                  <Label htmlFor="anonimo" className="text-sm text-gray-600">
                    Desejo manter minha identidade anônima
                  </Label>
                </div>

                <div className="flex items-start space-x-2">
                  <input 
                    type="checkbox" 
                    id="termos" 
                    className="mt-1"
                  />
                  <Label htmlFor="termos" className="text-sm text-gray-600">
                    Li e concordo com os termos de uso da Ouvidoria *
                  </Label>
                </div>

                <Button size="lg" className="w-full md:w-auto">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Enviar Manifestação
                </Button>

                <p className="text-sm text-gray-500 mt-4">
                  * Campos obrigatórios
                </p>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Informações de Contato */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Outros Canais de Atendimento
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="camara-card">
              <CardContent className="p-6 text-center">
                <Phone className="h-10 w-10 text-camara-primary mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Telefone</h3>
                <p className="text-gray-600">(93) 3000-0000</p>
                <p className="text-sm text-gray-500 mt-1">Seg-Sex, 8h-14h</p>
              </CardContent>
            </Card>

            <Card className="camara-card">
              <CardContent className="p-6 text-center">
                <Mail className="h-10 w-10 text-camara-primary mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">E-mail</h3>
                <p className="text-gray-600 text-sm break-all">
                  ouvidoria@camaramojui.pa.gov.br
                </p>
                <p className="text-sm text-gray-500 mt-1">Resposta em 48h</p>
              </CardContent>
            </Card>

            <Card className="camara-card">
              <CardContent className="p-6 text-center">
                <MapPin className="h-10 w-10 text-camara-primary mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Presencial</h3>
                <p className="text-gray-600 text-sm">
                  Av. Principal, 123<br />
                  Centro - Mojuí dos Campos
                </p>
              </CardContent>
            </Card>

            <Card className="camara-card">
              <CardContent className="p-6 text-center">
                <Clock className="h-10 w-10 text-camara-primary mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Horário</h3>
                <p className="text-gray-600">
                  Segunda a Sexta<br />
                  8:00 às 14:00
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Prazos de Resposta */}
        <div>
          <Card className="camara-card border-l-4 border-l-camara-primary">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-camara-primary">
                Prazos de Resposta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-semibold text-gray-900">Reclamação</h4>
                    <p className="text-sm text-gray-600">
                      Análise e posicionamento oficial
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-camara-primary">15</p>
                    <p className="text-sm text-gray-600">dias úteis</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-semibold text-gray-900">Denúncia</h4>
                    <p className="text-sm text-gray-600">
                      Investigação e providências
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-camara-primary">30</p>
                    <p className="text-sm text-gray-600">dias úteis</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-semibold text-gray-900">Sugestão/Elogio</h4>
                    <p className="text-sm text-gray-600">
                      Confirmação de recebimento
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-camara-primary">5</p>
                    <p className="text-sm text-gray-600">dias úteis</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-semibold text-gray-900">Informação</h4>
                    <p className="text-sm text-gray-600">
                      Resposta completa
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-camara-primary">10</p>
                    <p className="text-sm text-gray-600">dias úteis</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

