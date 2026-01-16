import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Download, Eye, Users, Calendar } from 'lucide-react'
import Link from 'next/link'

export function TransparencySection() {
  const transparencyItems = [
    {
      icon: FileText,
      title: 'Leis Municipais',
      description: 'Acesse todas as leis aprovadas pela Câmara Municipal',
      count: '156',
      href: '/transparencia/leis',
      color: 'text-blue-600'
    },
    {
      icon: Download,
      title: 'Decretos',
      description: 'Consulte os decretos municipais em vigor',
      count: '89',
      href: '/transparencia/decretos',
      color: 'text-green-600'
    },
    {
      icon: Eye,
      title: 'Gestão Fiscal',
      description: 'Acompanhe a execução orçamentária e financeira',
      count: '100%',
      href: '/transparencia/gestao-fiscal',
      color: 'text-purple-600'
    },
  ]

  const recentPublications = [
    {
      title: 'Lei nº 156/2025 - Dispõe sobre o Plano Diretor Municipal',
      type: 'Lei',
      date: '2025-07-15',
      href: '/transparencia/leis/156-2025'
    },
    {
      title: 'Decreto nº 89/2025 - Regulamenta a Lei de Zoneamento',
      type: 'Decreto',
      date: '2025-07-10',
      href: '/transparencia/decretos/89-2025'
    },
    {
      title: 'Portaria nº 45/2025 - Estabelece normas para licitações',
      type: 'Portaria',
      date: '2025-07-08',
      href: '/transparencia/portarias/45-2025'
    }
  ]

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Transparência e Acesso à Informação
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            A Câmara Municipal de Mojuí dos Campos garante total transparência 
            em suas ações, cumprindo a Lei de Acesso à Informação
          </p>
        </div>

        {/* Cards de transparência */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {transparencyItems.map((item, index) => (
            <Card key={index} className="camara-card hover:scale-105 transition-transform duration-200">
              <CardHeader className="text-center pb-3">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <item.icon className={`h-6 w-6 ${item.color}`} />
                </div>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  {item.title}
                </CardTitle>
                <p className="text-sm text-gray-600">
                  {item.description}
                </p>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-2xl font-bold text-camara-primary mb-3">
                  {item.count}
                </div>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href={item.href}>
                    Acessar
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Publicações recentes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="camara-card">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center">
                <FileText className="h-5 w-5 mr-2 text-camara-primary" />
                Publicações Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentPublications.map((pub, index) => (
                  <div key={index} className="border-l-4 border-camara-primary pl-4 py-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-sm mb-1">
                          {pub.title}
                        </h4>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span className="bg-camara-primary text-white px-2 py-1 rounded">
                            {pub.type}
                          </span>
                          <span>{new Date(pub.date).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={pub.href}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/transparencia/publicacoes">
                    Ver Todas as Publicações
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="camara-card">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center">
                <Users className="h-5 w-5 mr-2 text-camara-primary" />
                Informações da Legislatura
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-semibold text-gray-900">Legislatura Atual</h4>
                    <p className="text-sm text-gray-600">2025/2028</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-camara-primary">11</div>
                    <div className="text-xs text-gray-600">Vereadores</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-semibold text-gray-900">Sessões Realizadas</h4>
                    <p className="text-sm text-gray-600">Este ano</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-camara-secondary">27</div>
                    <div className="text-xs text-gray-600">Sessões</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-semibold text-gray-900">Matérias Processadas</h4>
                    <p className="text-sm text-gray-600">Total acumulado</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-camara-accent">294</div>
                    <div className="text-xs text-gray-600">Matérias</div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/legislativo/sessoes">
                    <Calendar className="h-4 w-4 mr-2" />
                    Ver Calendário de Sessões
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
