import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { FileText, Search, Calendar, Download, Eye, Filter, BookOpen } from 'lucide-react'
import Link from 'next/link'

export default function LeisPage() {
  const leis = [
    {
      id: 1,
      numero: '156',
      ano: 2025,
      titulo: 'Dispõe sobre o Plano Diretor Municipal de Mojuí dos Campos',
      ementa: 'Institui o Plano Diretor Municipal, estabelecendo diretrizes para o desenvolvimento urbano e territorial do município, em conformidade com o Estatuto da Cidade.',
      data: '2025-07-15',
      status: 'VIGENTE',
      autor: 'Pantoja do Cartório',
      sessao: '15ª Sessão Ordinária',
      arquivo: 'lei-156-2025.pdf'
    },
    {
      id: 2,
      numero: '155',
      ano: 2025,
      titulo: 'Institui o Fundo Municipal de Cultura',
      ementa: 'Cria o Fundo Municipal de Cultura, destinado ao financiamento de projetos culturais e artísticos no município.',
      data: '2025-07-05',
      status: 'VIGENTE',
      autor: 'Wallace Lalá',
      sessao: '14ª Sessão Ordinária',
      arquivo: 'lei-155-2025.pdf'
    },
    {
      id: 3,
      numero: '154',
      ano: 2025,
      titulo: 'Dispõe sobre a Política Municipal de Meio Ambiente',
      ementa: 'Estabelece diretrizes para a política municipal de meio ambiente e desenvolvimento sustentável.',
      data: '2025-06-28',
      status: 'VIGENTE',
      autor: 'Enfermeiro Frank',
      sessao: '13ª Sessão Ordinária',
      arquivo: 'lei-154-2025.pdf'
    },
    {
      id: 4,
      numero: '153',
      ano: 2025,
      titulo: 'Institui o Programa Municipal de Apoio à Agricultura Familiar',
      ementa: 'Cria programa municipal de apoio técnico e financeiro aos agricultores familiares do município.',
      data: '2025-06-20',
      status: 'VIGENTE',
      autor: 'Joilson da Santa Júlia',
      sessao: '12ª Sessão Ordinária',
      arquivo: 'lei-153-2025.pdf'
    },
    {
      id: 5,
      numero: '152',
      ano: 2025,
      titulo: 'Dispõe sobre a Política Municipal de Educação',
      ementa: 'Estabelece diretrizes para a política municipal de educação, em consonância com a legislação federal.',
      data: '2025-06-10',
      status: 'VIGENTE',
      autor: 'Everaldo Camilo',
      sessao: '11ª Sessão Ordinária',
      arquivo: 'lei-152-2025.pdf'
    },
    {
      id: 6,
      numero: '151',
      ano: 2025,
      titulo: 'Institui o Sistema Municipal de Transporte Público',
      ementa: 'Cria o sistema municipal de transporte público coletivo, estabelecendo normas e diretrizes para sua operação.',
      data: '2025-05-30',
      status: 'VIGENTE',
      autor: 'Diego do Zé Neto',
      sessao: '10ª Sessão Ordinária',
      arquivo: 'lei-151-2025.pdf'
    },
    {
      id: 7,
      numero: '150',
      ano: 2025,
      titulo: 'Dispõe sobre a Política Municipal de Saúde',
      ementa: 'Estabelece diretrizes para a política municipal de saúde, em conformidade com o SUS.',
      data: '2025-05-20',
      status: 'VIGENTE',
      autor: 'Enfermeiro Frank',
      sessao: '9ª Sessão Ordinária',
      arquivo: 'lei-150-2025.pdf'
    },
    {
      id: 8,
      numero: '149',
      ano: 2025,
      titulo: 'Institui o Programa Municipal de Habitação de Interesse Social',
      ementa: 'Cria programa municipal de habitação de interesse social para famílias de baixa renda.',
      data: '2025-05-10',
      status: 'VIGENTE',
      autor: 'Arnaldo Galvão',
      sessao: '8ª Sessão Ordinária',
      arquivo: 'lei-149-2025.pdf'
    }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VIGENTE':
        return <Badge className="bg-green-100 text-green-800">Vigente</Badge>
      case 'REVOGADA':
        return <Badge className="bg-red-100 text-red-800">Revogada</Badge>
      case 'SUSPENSA':
        return <Badge className="bg-yellow-100 text-yellow-800">Suspensa</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Leis Municipais
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Consulte todas as leis aprovadas pela Câmara Municipal de Mojuí dos Campos. 
            Aqui você encontra o texto completo das leis, suas alterações e histórico legislativo.
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="camara-card text-center">
            <CardContent className="p-6">
              <BookOpen className="h-12 w-12 text-camara-primary mx-auto mb-3" />
              <div className="text-3xl font-bold text-camara-primary mb-2">156</div>
              <div className="text-sm text-gray-600">Leis Aprovadas</div>
            </CardContent>
          </Card>
          
          <Card className="camara-card text-center">
            <CardContent className="p-6">
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">✓</span>
              </div>
              <div className="text-3xl font-bold text-green-600 mb-2">142</div>
              <div className="text-sm text-gray-600">Vigentes</div>
            </CardContent>
          </Card>
          
          <Card className="camara-card text-center">
            <CardContent className="p-6">
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">✗</span>
              </div>
              <div className="text-3xl font-bold text-red-600 mb-2">14</div>
              <div className="text-sm text-gray-600">Revogadas</div>
            </CardContent>
          </Card>
          
          <Card className="camara-card text-center">
            <CardContent className="p-6">
              <Calendar className="h-12 w-12 text-camara-accent mx-auto mb-3" />
              <div className="text-3xl font-bold text-camara-accent mb-2">8</div>
              <div className="text-sm text-gray-600">Este Ano</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e Busca */}
        <div className="mb-8">
          <Card className="camara-card">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar leis por número, título ou ementa..."
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Todas
                  </Button>
                  <Button variant="outline" size="sm">Vigentes</Button>
                  <Button variant="outline" size="sm">Revogadas</Button>
                  <Button variant="outline" size="sm">2025</Button>
                  <Button variant="outline" size="sm">2024</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Leis */}
        <div className="space-y-6">
          {leis.map((lei) => (
            <Card key={lei.id} className="camara-card hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <CardTitle className="text-xl font-semibold text-gray-900">
                        Lei nº {lei.numero}/{lei.ano}
                      </CardTitle>
                      {getStatusBadge(lei.status)}
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">
                      {lei.titulo}
                    </h2>
                    <p className="text-gray-700 mb-4">
                      {lei.ementa}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Informações</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-600">Data:</span>
                          <span className="font-medium">
                            {new Date(lei.data).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-600">Autor:</span>
                          <span className="font-medium">{lei.autor}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <BookOpen className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-600">Sessão:</span>
                          <span className="font-medium">{lei.sessao}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Status</h3>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-sm text-green-800">
                          Esta lei está em vigor e deve ser cumprida por todos os órgãos 
                          e entidades do município.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Ações</h3>
                      <div className="space-y-2">
                        <Button asChild variant="outline" size="sm" className="w-full">
                          <Link href={`/transparencia/leis/${lei.numero}-${lei.ano}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Texto Completo
                          </Link>
                        </Button>
                        
                        <Button asChild variant="outline" size="sm" className="w-full">
                          <Link href={`/transparencia/leis/${lei.numero}-${lei.ano}/historico`}>
                            <FileText className="h-4 w-4 mr-2" />
                            Histórico Legislativo
                          </Link>
                        </Button>
                        
                        <Button asChild variant="outline" size="sm" className="w-full">
                          <Link href={`/transparencia/leis/${lei.numero}-${lei.ano}/alteracoes`}>
                            <BookOpen className="h-4 w-4 mr-2" />
                            Alterações
                          </Link>
                        </Button>
                        
                        <Button asChild variant="outline" size="sm" className="w-full">
                          <Link href={`/transparencia/leis/${lei.numero}-${lei.ano}/download`}>
                            <Download className="h-4 w-4 mr-2" />
                            Download PDF
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Paginação */}
        <div className="mt-12 text-center">
          <div className="flex justify-center space-x-2">
            <Button variant="outline" size="sm" disabled>Anterior</Button>
            <Button variant="outline" size="sm" className="bg-camara-primary text-white">1</Button>
            <Button variant="outline" size="sm">2</Button>
            <Button variant="outline" size="sm">3</Button>
            <Button variant="outline" size="sm">Próximo</Button>
          </div>
        </div>

        {/* Informações Legais */}
        <div className="mt-12">
          <Card className="camara-card">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-camara-primary">
                Informações Importantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Sobre as Leis Municipais</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• As leis municipais são normas jurídicas de caráter geral e abstrato</li>
                    <li>• São aprovadas pela Câmara Municipal e sancionadas pelo Prefeito</li>
                    <li>• Têm força obrigatória em todo o território municipal</li>
                    <li>• Devem ser publicadas no Diário Oficial do Município</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Como Consultar</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• Use a busca para encontrar leis específicas</li>
                    <li>• Filtre por ano, status ou autor</li>
                    <li>• Baixe o PDF para consulta offline</li>
                    <li>• Consulte o histórico para ver alterações</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ações */}
        <div className="text-center mt-12 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="camara-button">
              <Link href="/transparencia/decretos">
                <FileText className="h-5 w-5 mr-2" />
                Ver Decretos
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-camara-primary text-camara-primary hover:bg-camara-primary hover:text-white">
              <Link href="/transparencia/portarias">
                <BookOpen className="h-5 w-5 mr-2" />
                Ver Portarias
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
