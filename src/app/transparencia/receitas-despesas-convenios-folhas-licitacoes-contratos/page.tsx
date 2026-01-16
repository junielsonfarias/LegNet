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
  Activity,
  Users,
  Building,
  Receipt,
  FileCheck,
  Clock,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'
import { transparenciaService } from '@/lib/transparencia-service'

export default function ReceitasDespesasConveniosFolhasLicitacoesContratosPage() {
  const { data } = transparenciaService.getAll()
  
  // Filtrar apenas itens da categoria
  const categoriaItems = data.filter(item => item.categoria === 'receitas-despesas-convenios-folhas-licitacoes-contratos')

  const getItemIcon = (subcategoria: string) => {
    const icons: Record<string, any> = {
      'receitas': DollarSign,
      'despesas': TrendingUp,
      'licitacoes': FileCheck,
      'contratos': FileText,
      'convenios': Building,
      'pessoal-folha': Users,
      'cargos-e-funcoes': Users,
      'diarias': Receipt,
      'balancete-financeiro': BarChart3,
      'notas-fiscais': Receipt,
      'estagiarios': Users,
      'terceirizados': Users,
      'plano-de-contratacao': FileText,
      'inidoneas-suspensas': AlertTriangle,
      'cronograma-de-pagamentos': Calendar,
      'contas-de-governo': PieChart,
      'contas-de-gestao': PieChart,
      'balanco-geral': BarChart3
    }
    return icons[subcategoria] || FileText
  }

  const getItemColor = (subcategoria: string) => {
    const colors: Record<string, string> = {
      'receitas': 'bg-green-100 text-green-800 border-green-200',
      'despesas': 'bg-red-100 text-red-800 border-red-200',
      'licitacoes': 'bg-blue-100 text-blue-800 border-blue-200',
      'contratos': 'bg-purple-100 text-purple-800 border-purple-200',
      'convenios': 'bg-orange-100 text-orange-800 border-orange-200',
      'pessoal-folha': 'bg-pink-100 text-pink-800 border-pink-200',
      'cargos-e-funcoes': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'diarias': 'bg-teal-100 text-teal-800 border-teal-200',
      'balancete-financeiro': 'bg-cyan-100 text-cyan-800 border-cyan-200',
      'notas-fiscais': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'estagiarios': 'bg-lime-100 text-lime-800 border-lime-200',
      'terceirizados': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'plano-de-contratacao': 'bg-rose-100 text-rose-800 border-rose-200',
      'inidoneas-suspensas': 'bg-red-100 text-red-800 border-red-200',
      'cronograma-de-pagamentos': 'bg-violet-100 text-violet-800 border-violet-200',
      'contas-de-governo': 'bg-slate-100 text-slate-800 border-slate-200',
      'contas-de-gestao': 'bg-stone-100 text-stone-800 border-stone-200',
      'balanco-geral': 'bg-zinc-100 text-zinc-800 border-zinc-200'
    }
    return colors[subcategoria] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getItemDescription = (subcategoria: string) => {
    const descriptions: Record<string, string> = {
      'receitas': 'Detalhamento das receitas do município por exercício',
      'despesas': 'Detalhamento das despesas do município por exercício',
      'licitacoes': 'Informações sobre os processos licitatórios da Câmara',
      'contratos': 'Detalhes dos contratos firmados pela Câmara',
      'convenios': 'Informações sobre convênios e parcerias',
      'pessoal-folha': 'Informações sobre a folha de pagamento dos servidores da Câmara',
      'cargos-e-funcoes': 'Estrutura de cargos e funções da Câmara',
      'diarias': 'Informações sobre o pagamento de diárias a servidores',
      'balancete-financeiro': 'Demonstrativo contábil mensal da Câmara',
      'notas-fiscais': 'Registro das notas fiscais emitidas e recebidas',
      'estagiarios': 'Informações sobre estagiários da Câmara',
      'terceirizados': 'Informações sobre serviços terceirizados',
      'plano-de-contratacao': 'Planejamento das contratações da Câmara',
      'inidoneas-suspensas': 'Lista de empresas inidôneas ou suspensas de contratar com a administração pública',
      'cronograma-de-pagamentos': 'Calendário de pagamentos da Câmara',
      'contas-de-governo': 'Prestação de contas anual do governo municipal',
      'contas-de-gestao': 'Prestação de contas dos gestores da Câmara',
      'balanco-geral': 'Demonstrativo contábil anual da Câmara'
    }
    return descriptions[subcategoria] || 'Documento de transparência da Câmara'
  }

  // Agrupar itens por subcategoria
  const groupedItems = categoriaItems.reduce((acc, item) => {
    if (!acc[item.subcategoria]) {
      acc[item.subcategoria] = []
    }
    acc[item.subcategoria].push(item)
    return acc
  }, {} as Record<string, any[]>)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-camara-primary to-purple-600 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center mb-6">
            <Link href="/transparencia" className="flex items-center text-white/80 hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Voltar ao Portal da Transparência
            </Link>
          </div>
          
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Receitas, Despesas, Convênios, Folhas, Licitações e Contratos
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Acompanhamento de Receitas e Despesas
            </p>
            <p className="text-lg opacity-80">
              §3º. Das publicações vinculadas ao acompanhamento de receitas e despesas, junto ao portal da transparência
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
                  <p className="text-3xl font-bold text-gray-900">{categoriaItems.length}</p>
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
                    {categoriaItems.filter(item => item.status === 'publicado').length}
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
                  <p className="text-sm font-medium text-gray-600">Categorias</p>
                  <p className="text-3xl font-bold text-gray-900">{Object.keys(groupedItems).length}</p>
                </div>
                <BarChart3 className="h-12 w-12 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="camara-card border-l-4 border-l-orange-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Última Atualização</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {new Date().toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <Calendar className="h-12 w-12 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Documentos por Categoria */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Documentos por Categoria
          </h2>
          
          <div className="space-y-8">
            {Object.entries(groupedItems).map(([subcategoria, items]) => {
              const Icon = getItemIcon(subcategoria)
              const colorClass = getItemColor(subcategoria)
              const description = getItemDescription(subcategoria)
              
              return (
                <Card key={subcategoria} className="camara-card">
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <div className={`p-4 rounded-lg ${colorClass}`}>
                        <Icon className="h-8 w-8" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-semibold text-gray-900">
                          {subcategoria.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </CardTitle>
                        <p className="text-gray-600 text-sm">
                          {description}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {items.map((item) => (
                        <Card key={item.id} className="border border-gray-200 hover:shadow-md transition-all duration-300 group">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-gray-900 group-hover:text-camara-primary transition-colors line-clamp-2">
                                {item.titulo}
                              </h4>
                              <Badge className="bg-green-100 text-green-800 border-0">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                {item.status}
                              </Badge>
                            </div>
                            
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                              {item.descricao}
                            </p>
                            
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                              <span className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {new Date(item.dataPublicacao).toLocaleDateString('pt-BR')}
                              </span>
                              <span className="flex items-center">
                                <FileText className="h-3 w-3 mr-1" />
                                {item.tipo}
                              </span>
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
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Resumo Financeiro */}
        <Card className="camara-card border-l-4 border-l-camara-primary">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-camara-primary flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Resumo Financeiro da Câmara Municipal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
                  Receitas
                </h4>
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="font-medium text-green-800">Receitas até 2022</p>
                    <p className="text-green-700 text-sm">Detalhamento das receitas do município até o ano de 2022</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="font-medium text-green-800">Receitas 2023</p>
                    <p className="text-green-700 text-sm">Detalhamento das receitas do município para o ano de 2023</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-red-500" />
                  Despesas
                </h4>
                <div className="space-y-3">
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="font-medium text-red-800">Despesas até 2022</p>
                    <p className="text-red-700 text-sm">Detalhamento das despesas do município até o ano de 2022</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="font-medium text-red-800">Despesas 2023</p>
                    <p className="text-red-700 text-sm">Detalhamento das despesas do município para o ano de 2023</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <FileCheck className="h-5 w-5 mr-2 text-blue-500" />
                  Contratações
                </h4>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="font-medium text-blue-800">Licitações</p>
                    <p className="text-blue-700 text-sm">Informações sobre os processos licitatórios da Câmara</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="font-medium text-blue-800">Contratos</p>
                    <p className="text-blue-700 text-sm">Detalhes dos contratos firmados pela Câmara</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="font-medium text-blue-800">Convênios</p>
                    <p className="text-blue-700 text-sm">Informações sobre convênios e parcerias</p>
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
            {Object.entries(groupedItems).slice(0, 8).map(([subcategoria, items]) => {
              const Icon = getItemIcon(subcategoria)
              const colorClass = getItemColor(subcategoria)
              const item = items[0] // Pegar o primeiro item da subcategoria
              
              return (
                <Card key={subcategoria} className="camara-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <div className={`p-4 rounded-lg ${colorClass} mx-auto mb-4 w-fit group-hover:scale-110 transition-transform`}>
                      <Icon className="h-8 w-8" />
                    </div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-camara-primary transition-colors mb-2">
                      {subcategoria.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {items.length} documento{items.length > 1 ? 's' : ''}
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
