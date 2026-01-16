import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield, FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react'

export default function ESicPage() {
  const servicos = [
    {
      icon: FileText,
      title: 'Solicitação de Informação',
      description: 'Solicite informações públicas através do Sistema E-SIC',
      href: '#solicitar',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      icon: Clock,
      title: 'Acompanhar Pedido',
      description: 'Consulte o status de suas solicitações',
      href: '#acompanhar',
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      icon: CheckCircle,
      title: 'Recursos',
      description: 'Interponha recursos em caso de negativa',
      href: '#recursos',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ]

  const perguntasFrequentes = [
    {
      pergunta: 'O que é o E-SIC?',
      resposta: 'O E-SIC (Sistema Eletrônico do Serviço de Informação ao Cidadão) é uma ferramenta que permite ao cidadão solicitar informações públicas de forma online, conforme previsto na Lei de Acesso à Informação (Lei nº 12.527/2011).'
    },
    {
      pergunta: 'Quem pode utilizar o E-SIC?',
      resposta: 'Qualquer pessoa, física ou jurídica, pode utilizar o sistema para solicitar informações públicas, sem necessidade de justificativa do pedido.'
    },
    {
      pergunta: 'Qual o prazo para resposta?',
      resposta: 'O órgão tem até 20 dias para responder à solicitação, podendo ser prorrogado por mais 10 dias mediante justificativa.'
    },
    {
      pergunta: 'É necessário pagar alguma taxa?',
      resposta: 'Não. O acesso às informações públicas é gratuito, exceto quando houver necessidade de reprodução de documentos.'
    },
    {
      pergunta: 'Posso solicitar qualquer informação?',
      resposta: 'Sim, desde que seja uma informação pública. Algumas informações podem ter restrições de acesso por questões de segurança nacional, sigilo fiscal, etc.'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-16 w-16 text-camara-primary" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            E-SIC - Sistema Eletrônico de Informação ao Cidadão
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Exercite seu direito de acesso à informação pública de forma rápida, 
            transparente e eficiente através do nosso sistema online.
          </p>
        </div>

        {/* Destaque da Lei de Acesso à Informação */}
        <div className="mb-12">
          <Card className="camara-card bg-gradient-to-r from-camara-primary to-camara-secondary text-white">
            <CardContent className="p-8">
              <div className="flex items-center space-x-4">
                <Shield className="h-16 w-16 text-white" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    Lei de Acesso à Informação
                  </h2>
                  <p className="text-lg opacity-90">
                    A Lei nº 12.527/2011 garante o direito fundamental de acesso às informações públicas, 
                    promovendo a transparência e o controle social.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Serviços Disponíveis */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Serviços Disponíveis
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {servicos.map((servico, index) => {
              const Icon = servico.icon
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <div className={`w-16 h-16 ${servico.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
                      <Icon className={`h-8 w-8 ${servico.color}`} />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {servico.title}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {servico.description}
                    </p>
                    <Button className="w-full">
                      Acessar
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Formulário de Solicitação */}
        <div className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Solicitar Informação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome Completo *</Label>
                    <Input id="nome" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail *</Label>
                    <Input id="email" type="email" required />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input id="cpf" placeholder="000.000.000-00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input id="telefone" placeholder="(00) 00000-0000" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assunto">Assunto *</Label>
                  <Input id="assunto" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição da Solicitação *</Label>
                  <textarea
                    id="descricao"
                    className="w-full p-3 border border-gray-300 rounded-md h-32 resize-none"
                    placeholder="Descreva detalhadamente a informação que deseja solicitar..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orgao">Órgão/Entidade</Label>
                  <select
                    id="orgao"
                    className="w-full p-3 border border-gray-300 rounded-md"
                  >
                    <option value="">Selecione o órgão</option>
                    <option value="camara">Câmara Municipal</option>
                    <option value="prefeitura">Prefeitura Municipal</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input type="checkbox" id="termos" required />
                  <Label htmlFor="termos" className="text-sm">
                    Declaro que li e aceito os termos de uso do E-SIC
                  </Label>
                </div>

                <Button type="submit" className="w-full">
                  Enviar Solicitação
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Perguntas Frequentes */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Perguntas Frequentes
          </h2>
          <div className="space-y-4">
            {perguntasFrequentes.map((item, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-camara-primary" />
                    {item.pergunta}
                  </h3>
                  <p className="text-gray-700">
                    {item.resposta}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Informações de Contato */}
        <div className="mb-12">
          <Card className="camara-card bg-gradient-to-r from-camara-primary to-camara-secondary text-white">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4">
                Precisa de Ajuda?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Contato E-SIC</h3>
                  <p className="opacity-90 mb-2">
                    <strong>E-mail:</strong> esic@camaramojui.com
                  </p>
                  <p className="opacity-90 mb-2">
                    <strong>Telefone:</strong> (93) 99999-9999
                  </p>
                  <p className="opacity-90">
                    <strong>Horário:</strong> Segunda a Sexta, 8h às 17h
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Ouvidoria</h3>
                  <p className="opacity-90 mb-2">
                    <strong>E-mail:</strong> ouvidoria@camaramojui.com
                  </p>
                  <p className="opacity-90 mb-2">
                    <strong>Telefone:</strong> (93) 99999-8888
                  </p>
                  <p className="opacity-90">
                    <strong>Horário:</strong> Segunda a Sexta, 8h às 17h
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
