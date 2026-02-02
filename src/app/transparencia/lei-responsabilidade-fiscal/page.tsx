import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DollarSign,
  FileText,
  Calendar,
  Eye,
  Download,
  ArrowLeft,
  CheckCircle,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react'
import Link from 'next/link'
import { transparenciaService } from '@/lib/transparencia-dados-service'

// Mantido como Server Component - import do service é aceitável no servidor
// A migração completa para Prisma será feita quando o modelo de dados for definido

export default function LeiResponsabilidadeFiscalPage() {
  const { data } = transparenciaService.getAll()
  
  // Filtrar apenas itens da Lei de Responsabilidade Fiscal
  const lrfItems = data.filter(item => item.categoria === 'lei-de-responsabilidade-fiscal')

  const getItemIcon = (subcategoria: string) => {
    const icons: Record<string, any> = {
      'loa': DollarSign,
      'ldo': TrendingUp,
      'ppa': BarChart3,
      'rgf': PieChart
    }
    return icons[subcategoria] || FileText
  }

  const getItemColor = (subcategoria: string) => {
    const colors: Record<string, string> = {
      'loa': 'bg-green-100 text-green-800 border-green-200',
      'ldo': 'bg-blue-100 text-blue-800 border-blue-200',
      'ppa': 'bg-purple-100 text-purple-800 border-purple-200',
      'rgf': 'bg-orange-100 text-orange-800 border-orange-200'
    }
    return colors[subcategoria] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getItemDescription = (subcategoria: string) => {
    const descriptions: Record<string, string> = {
      'loa': 'Lei que estima as receitas e fixa as despesas do município para o ano',
      'ldo': 'Lei que estabelece as metas e prioridades da administração pública',
      'ppa': 'Planejamento de médio prazo do governo, com diretrizes, objetivos e metas',
      'rgf': 'Demonstrativo da gestão fiscal do município, conforme a LRF'
    }
    return descriptions[subcategoria] || 'Documento da Lei de Responsabilidade Fiscal'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-camara-primary to-green-600 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center mb-6">
            <Link href="/transparencia" className="flex items-center text-white/80 hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Voltar ao Portal da Transparência
            </Link>
          </div>
          
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Lei de Responsabilidade Fiscal
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Instrumentos de Planejamento e Gestão Fiscal
            </p>
            <p className="text-lg opacity-80">
              §2º. Das publicações vinculadas aos instrumentos de planejamento e gestão fiscal, junto ao portal da transparência
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="camara-card border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Documentos</p>
                  <p className="text-3xl font-bold text-gray-900">{lrfItems.length}</p>
                </div>
                <FileText className="h-12 w-12 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="camara-card border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Publicados</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {lrfItems.filter(item => item.status === 'publicado').length}
                  </p>
                </div>
                <CheckCircle className="h-12 w-12 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="camara-card border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Última Atualização</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {new Date().toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <Calendar className="h-12 w-12 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="camara-card border-l-4 border-l-orange-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Exercício Atual</p>
                  <p className="text-3xl font-bold text-gray-900">2024</p>
                </div>
                <Activity className="h-12 w-12 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Documentos LRF */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Documentos da Lei de Responsabilidade Fiscal
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {lrfItems.map((item) => {
              const Icon = getItemIcon(item.subcategoria)
              const colorClass = getItemColor(item.subcategoria)
              const description = getItemDescription(item.subcategoria)
              
              return (
                <Card key={item.id} className="camara-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-4">
                      <div className={`p-4 rounded-lg ${colorClass}`}>
                        <Icon className="h-8 w-8" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl font-semibold text-gray-900 group-hover:text-camara-primary transition-colors">
                          {item.titulo}
                        </CardTitle>
                        <p className="text-sm text-gray-600">
                          {item.tipo}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-gray-600 text-sm mb-4">
                      {description}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(item.dataPublicacao).toLocaleDateString('pt-BR')}
                      </span>
                      <Badge className="bg-green-100 text-green-800 border-0">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {item.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button size="sm" className="flex-1 group-hover:bg-camara-primary group-hover:text-white transition-colors">
                        <Eye className="h-4 w-4 mr-2" />
                        Visualizar
                      </Button>
                      <Button size="sm" variant="outline" className="group-hover:border-camara-primary group-hover:text-camara-primary transition-colors">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Informações sobre LRF */}
        <Card className="camara-card border-l-4 border-l-camara-primary">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-camara-primary flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Sobre a Lei de Responsabilidade Fiscal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">O que é a LRF?</h4>
                <p className="text-gray-600 text-sm mb-4">
                  A Lei de Responsabilidade Fiscal (Lei Complementar nº 101/2000) estabelece normas de finanças públicas 
                  voltadas para a responsabilidade na gestão fiscal, com o objetivo de garantir o equilíbrio das contas públicas 
                  e a transparência na administração financeira.
                </p>
                
                <h4 className="font-semibold text-gray-900 mb-4">Principais Objetivos:</h4>
                <ul className="text-gray-600 text-sm space-y-2">
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Controle da dívida pública</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Limitação de gastos com pessoal</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Planejamento orçamentário</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Transparência na gestão fiscal</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Instrumentos de Planejamento:</h4>
                
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h5 className="font-semibold text-green-800 mb-2 flex items-center">
                      <DollarSign className="h-4 w-4 mr-2" />
                      LOA - Lei Orçamentária Anual
                    </h5>
                    <p className="text-green-700 text-sm">
                      Estima as receitas e fixa as despesas do município para o exercício financeiro.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h5 className="font-semibold text-blue-800 mb-2 flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      LDO - Lei de Diretrizes Orçamentárias
                    </h5>
                    <p className="text-blue-700 text-sm">
                      Estabelece as metas e prioridades da administração pública para o exercício seguinte.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h5 className="font-semibold text-purple-800 mb-2 flex items-center">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      PPA - Plano Plurianual
                    </h5>
                    <p className="text-purple-700 text-sm">
                      Planejamento de médio prazo com diretrizes, objetivos e metas para 4 anos.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <h5 className="font-semibold text-orange-800 mb-2 flex items-center">
                      <PieChart className="h-4 w-4 mr-2" />
                      RGF - Relatório de Gestão Fiscal
                    </h5>
                    <p className="text-orange-700 text-sm">
                      Demonstrativo da gestão fiscal do município, conforme a LRF.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Links Rápidos */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Acesso Rápido aos Documentos
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {lrfItems.map((item) => {
              const Icon = getItemIcon(item.subcategoria)
              const colorClass = getItemColor(item.subcategoria)
              
              return (
                <Card key={item.id} className="camara-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <div className={`p-4 rounded-lg ${colorClass} mx-auto mb-4 w-fit group-hover:scale-110 transition-transform`}>
                      <Icon className="h-8 w-8" />
                    </div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-camara-primary transition-colors mb-2">
                      {item.titulo}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {getItemDescription(item.subcategoria)}
                    </p>
                    <Button size="sm" className="w-full group-hover:bg-camara-primary group-hover:text-white transition-colors">
                      <Eye className="h-4 w-4 mr-2" />
                      Visualizar
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
