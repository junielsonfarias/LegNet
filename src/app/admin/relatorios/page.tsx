'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  BarChart3, 
  Download, 
  Calendar, 
  Users, 
  FileText, 
  TrendingUp,
  PieChart,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react'
import { useParlamentares } from '@/lib/hooks/use-parlamentares'
import { useSessoes } from '@/lib/hooks/use-sessoes'
import { useProposicoes } from '@/lib/hooks/use-proposicoes'
import { useComissoes } from '@/lib/hooks/use-comissoes'

export default function RelatoriosAdminPage() {
  const [filtroPeriodo, setFiltroPeriodo] = useState('2025')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [loading, setLoading] = useState(false)

  // Dados para os relatórios usando hooks
  const { parlamentares } = useParlamentares()
  const { sessoes } = useSessoes()
  const { proposicoes } = useProposicoes()
  const { comissoes } = useComissoes()

  const handleGerarRelatorio = async (tipo: string) => {
    setLoading(true)
    
    // Simular geração de relatório
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Aqui você implementaria a lógica real de geração de relatório
    console.log(`Gerando relatório: ${tipo}`)
    
    setLoading(false)
  }

  const getEstatisticasGerais = () => {
    const sessoesConcluidas = sessoes.filter(s => s.status === 'CONCLUIDA').length
    const proposicoesAprovadas = proposicoes.filter(p => p.status === 'APROVADA').length
    const comissoesAtivas = comissoes.filter(c => c.ativa).length
    const totalMembros = 0 // TODO: Calcular membros quando API incluir relacionamento

    return {
      sessoesConcluidas,
      proposicoesAprovadas,
      comissoesAtivas,
      totalMembros,
      totalParlamentares: parlamentares.length,
      totalSessoes: sessoes.length,
      totalProposicoes: proposicoes.length
    }
  }

  const stats = getEstatisticasGerais()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            Relatórios e Estatísticas
          </h1>
          <p className="text-gray-600 mt-1">
            Gere relatórios detalhados sobre a atividade legislativa
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros do Relatório</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="periodo">Período</Label>
              <Select value={filtroPeriodo} onValueChange={setFiltroPeriodo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="todos">Todos os anos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Relatório</Label>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="sessoes">Sessões</SelectItem>
                  <SelectItem value="proposicoes">Proposições</SelectItem>
                  <SelectItem value="comissoes">Comissões</SelectItem>
                  <SelectItem value="parlamentares">Parlamentares</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="formato">Formato</Label>
              <Select defaultValue="pdf">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Parlamentares</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalParlamentares}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sessões Realizadas</p>
                <p className="text-2xl font-bold text-green-600">{stats.sessoesConcluidas}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Proposições Aprovadas</p>
                <p className="text-2xl font-bold text-purple-600">{stats.proposicoesAprovadas}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Comissões Ativas</p>
                <p className="text-2xl font-bold text-orange-600">{stats.comissoesAtivas}</p>
              </div>
              <Activity className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Relatórios Disponíveis */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Relatório de Sessões */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Relatório de Sessões
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Relatório detalhado sobre as sessões legislativas, incluindo presença, proposições discutidas e estatísticas de participação.
            </p>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span>Total de sessões:</span>
                <span className="font-semibold">{stats.totalSessoes}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Sessões concluídas:</span>
                <span className="font-semibold text-green-600">{stats.sessoesConcluidas}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Sessões agendadas:</span>
                <span className="font-semibold text-blue-600">{sessoes.filter(s => s.status === 'AGENDADA').length}</span>
              </div>
            </div>
            <Button 
              className="w-full" 
              onClick={() => handleGerarRelatorio('sessoes')}
              disabled={loading}
            >
              <Download className="h-4 w-4 mr-2" />
              {loading ? 'Gerando...' : 'Gerar Relatório'}
            </Button>
          </CardContent>
        </Card>

        {/* Relatório de Proposições */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              Relatório de Proposições
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Análise completa das proposições legislativas, incluindo tipos, status, autores e estatísticas de aprovação.
            </p>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span>Total de proposições:</span>
                <span className="font-semibold">{stats.totalProposicoes}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Aprovadas:</span>
                <span className="font-semibold text-green-600">{stats.proposicoesAprovadas}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Em tramitação:</span>
                <span className="font-semibold text-yellow-600">{proposicoes.filter(p => p.status === 'EM_TRAMITACAO').length}</span>
              </div>
            </div>
            <Button 
              className="w-full" 
              onClick={() => handleGerarRelatorio('proposicoes')}
              disabled={loading}
            >
              <Download className="h-4 w-4 mr-2" />
              {loading ? 'Gerando...' : 'Gerar Relatório'}
            </Button>
          </CardContent>
        </Card>

        {/* Relatório de Parlamentares */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              Relatório de Parlamentares
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Relatório individual de cada parlamentar com estatísticas de participação, proposições e presença em sessões.
            </p>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span>Total de parlamentares:</span>
                <span className="font-semibold">{stats.totalParlamentares}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Mesa diretora:</span>
                <span className="font-semibold text-blue-600">{parlamentares.filter(p => p.cargo !== 'VEREADOR').length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Vereadores:</span>
                <span className="font-semibold text-green-600">{parlamentares.filter(p => p.cargo === 'VEREADOR').length}</span>
              </div>
            </div>
            <Button 
              className="w-full" 
              onClick={() => handleGerarRelatorio('parlamentares')}
              disabled={loading}
            >
              <Download className="h-4 w-4 mr-2" />
              {loading ? 'Gerando...' : 'Gerar Relatório'}
            </Button>
          </CardContent>
        </Card>

        {/* Relatório de Comissões */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-600" />
              Relatório de Comissões
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Relatório sobre as comissões da Câmara, incluindo membros, cargos e atividades desenvolvidas.
            </p>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span>Total de comissões:</span>
                <span className="font-semibold">{comissoes.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Comissões ativas:</span>
                <span className="font-semibold text-green-600">{stats.comissoesAtivas}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total de membros:</span>
                <span className="font-semibold text-blue-600">{stats.totalMembros}</span>
              </div>
            </div>
            <Button 
              className="w-full" 
              onClick={() => handleGerarRelatorio('comissoes')}
              disabled={loading}
            >
              <Download className="h-4 w-4 mr-2" />
              {loading ? 'Gerando...' : 'Gerar Relatório'}
            </Button>
          </CardContent>
        </Card>

        {/* Relatório de Performance */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
              Relatório de Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Análise de performance da Câmara com indicadores de produtividade e eficiência legislativa.
            </p>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span>Taxa de aprovação:</span>
                <span className="font-semibold text-green-600">
                  {stats.totalProposicoes > 0 ? Math.round((stats.proposicoesAprovadas / stats.totalProposicoes) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Média de sessões/mês:</span>
                <span className="font-semibold text-blue-600">
                  {Math.round(stats.sessoesConcluidas / 12)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Proposições/sessão:</span>
                <span className="font-semibold text-purple-600">
                  {stats.sessoesConcluidas > 0 ? Math.round(stats.totalProposicoes / stats.sessoesConcluidas) : 0}
                </span>
              </div>
            </div>
            <Button 
              className="w-full" 
              onClick={() => handleGerarRelatorio('performance')}
              disabled={loading}
            >
              <Download className="h-4 w-4 mr-2" />
              {loading ? 'Gerando...' : 'Gerar Relatório'}
            </Button>
          </CardContent>
        </Card>

        {/* Relatório Consolidado */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-red-600" />
              Relatório Consolidado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Relatório completo com todas as informações da Câmara Municipal em um único documento.
            </p>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span>Páginas estimadas:</span>
                <span className="font-semibold">25-30 páginas</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Inclui gráficos:</span>
                <span className="font-semibold text-green-600">Sim</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tempo de geração:</span>
                <span className="font-semibold text-blue-600">2-3 minutos</span>
              </div>
            </div>
            <Button 
              className="w-full" 
              onClick={() => handleGerarRelatorio('consolidado')}
              disabled={loading}
            >
              <Download className="h-4 w-4 mr-2" />
              {loading ? 'Gerando...' : 'Gerar Relatório'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Relatórios */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Relatórios Gerados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-semibold">Relatório de Sessões - Janeiro 2025</p>
                  <p className="text-sm text-gray-600">Gerado em 22/01/2025 às 14:30</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-1" />
                  Baixar
                </Button>
                <Button size="sm" variant="outline">
                  <BarChart3 className="h-4 w-4 mr-1" />
                  Visualizar
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-semibold">Relatório de Parlamentares - 2024</p>
                  <p className="text-sm text-gray-600">Gerado em 15/01/2025 às 10:15</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-1" />
                  Baixar
                </Button>
                <Button size="sm" variant="outline">
                  <BarChart3 className="h-4 w-4 mr-1" />
                  Visualizar
                </Button>
              </div>
            </div>

            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum outro relatório encontrado</p>
              <p className="text-sm">Os relatórios gerados aparecerão aqui</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
