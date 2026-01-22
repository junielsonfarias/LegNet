'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Calendar,
  Vote,
  Award,
  Clock,
  RefreshCw,
  Download,
  BarChart3,
  PieChartIcon,
  Activity,
  Target,
  Loader2
} from 'lucide-react'

interface DashboardData {
  periodo: {
    inicio: string
    fim: string
    nome?: string
  }
  proposicoes: {
    total: number
    porTipo: Record<string, number>
    porStatus: Record<string, number>
    porAutor: Array<{ autorId: string; nome: string; quantidade: number }>
    porMes: Array<{ mes: string; quantidade: number }>
    taxaAprovacao: number
    tempoMedioTramitacao: number
  }
  sessoes: {
    total: number
    porTipo: Record<string, number>
    porStatus: Record<string, number>
    porMes: Array<{ mes: string; quantidade: number }>
    duracaoMedia: number
    presencaMedia: number
  }
  votacoes: {
    total: number
    aprovadas: number
    rejeitadas: number
    empates: number
    participacaoMedia: number
    porMes: Array<{ mes: string; aprovadas: number; rejeitadas: number }>
  }
  destaques: {
    proposicoesMaisVotadas: Array<{ id: string; numero: string; votos: number }>
    parlamentaresMaisAtivos: Array<{ id: string; nome: string; proposicoes: number }>
    sessoesComMaisItens: Array<{ id: string; data: string; itens: number }>
  }
  comparativo?: {
    periodoAnterior: { inicio: string; fim: string }
    variacaoProposicoes: number
    variacaoSessoes: number
    variacaoAprovacoes: number
  }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B6B']

const TIPO_LABELS: Record<string, string> = {
  PROJETO_LEI: 'Projeto de Lei',
  PROJETO_RESOLUCAO: 'Projeto de Resolucao',
  PROJETO_DECRETO: 'Projeto de Decreto',
  INDICACAO: 'Indicacao',
  REQUERIMENTO: 'Requerimento',
  MOCAO: 'Mocao',
  ORDINARIA: 'Ordinaria',
  EXTRAORDINARIA: 'Extraordinaria',
  SOLENE: 'Solene',
  ESPECIAL: 'Especial'
}

const STATUS_LABELS: Record<string, string> = {
  APRESENTADA: 'Apresentada',
  EM_TRAMITACAO: 'Em Tramitacao',
  APROVADA: 'Aprovada',
  REJEITADA: 'Rejeitada',
  ARQUIVADA: 'Arquivada',
  AGENDADA: 'Agendada',
  EM_ANDAMENTO: 'Em Andamento',
  CONCLUIDA: 'Concluida',
  CANCELADA: 'Cancelada'
}

export default function AnalyticsPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [periodo, setPeriodo] = useState<'mes' | 'ano'>('ano')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/analytics?tipo=${periodo}&comparativo=true`)
      const result = await response.json()
      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error || 'Erro ao carregar dados')
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }, [periodo])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const formatVariacao = (valor: number) => {
    const formatted = valor.toFixed(1)
    if (valor > 0) return `+${formatted}%`
    return `${formatted}%`
  }

  const getVariacaoColor = (valor: number) => {
    if (valor > 0) return 'text-green-600'
    if (valor < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const prepareChartData = (obj: Record<string, number>, labels: Record<string, string>) => {
    return Object.entries(obj).map(([key, value]) => ({
      name: labels[key] || key,
      value
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error || 'Dados nao disponiveis'}</p>
        <Button onClick={fetchData} variant="outline" className="mt-4">
          Tentar novamente
        </Button>
      </div>
    )
  }

  const proposicoesPorTipo = prepareChartData(data.proposicoes.porTipo, TIPO_LABELS)
  const proposicoesPorStatus = prepareChartData(data.proposicoes.porStatus, STATUS_LABELS)
  const sessoesPorTipo = prepareChartData(data.sessoes.porTipo, TIPO_LABELS)
  const sessoesPorStatus = prepareChartData(data.sessoes.porStatus, STATUS_LABELS)

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Analytics</h1>
          <p className="text-gray-600">
            Metricas e indicadores de desempenho legislativo
            {data.periodo.nome && <span className="ml-2 font-medium">- {data.periodo.nome}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={periodo} onValueChange={(v) => setPeriodo(v as 'mes' | 'ano')}>
            <TabsList>
              <TabsTrigger value="mes">Mes Atual</TabsTrigger>
              <TabsTrigger value="ano">Ano Atual</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Proposicoes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proposicoes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.proposicoes.total}</div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">
                Taxa de aprovacao: {data.proposicoes.taxaAprovacao}%
              </p>
              {data.comparativo && (
                <span className={`text-xs ${getVariacaoColor(data.comparativo.variacaoProposicoes)}`}>
                  {formatVariacao(data.comparativo.variacaoProposicoes)}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sessoes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessoes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.sessoes.total}</div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">
                Presenca media: {data.sessoes.presencaMedia}%
              </p>
              {data.comparativo && (
                <span className={`text-xs ${getVariacaoColor(data.comparativo.variacaoSessoes)}`}>
                  {formatVariacao(data.comparativo.variacaoSessoes)}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Votacoes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Votacoes</CardTitle>
            <Vote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.votacoes.total}</div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">
                {data.votacoes.aprovadas} aprovadas | {data.votacoes.rejeitadas} rejeitadas
              </p>
              {data.comparativo && (
                <span className={`text-xs ${getVariacaoColor(data.comparativo.variacaoAprovacoes)}`}>
                  {formatVariacao(data.comparativo.variacaoAprovacoes)}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tempo Medio */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Medio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.proposicoes.tempoMedioTramitacao} dias</div>
            <p className="text-xs text-muted-foreground mt-1">
              Tramitacao de proposicoes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graficos Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Proposicoes por Tipo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Proposicoes por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {proposicoesPorTipo.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={proposicoesPorTipo}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {proposicoesPorTipo.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                Sem dados para exibir
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status das Proposicoes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Status das Proposicoes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {proposicoesPorStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={proposicoesPorStatus}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={12} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8">
                    {proposicoesPorStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                Sem dados para exibir
              </div>
            )}
          </CardContent>
        </Card>

        {/* Evolucao Mensal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Evolucao Mensal de Proposicoes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.proposicoes.porMes.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.proposicoes.porMes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="quantidade" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                Sem dados para exibir
              </div>
            )}
          </CardContent>
        </Card>

        {/* Aprovacoes vs Rejeicoes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Aprovacoes vs Rejeicoes por Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.votacoes.porMes.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.votacoes.porMes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="aprovadas" fill="#00C49F" name="Aprovadas" />
                  <Bar dataKey="rejeitadas" fill="#FF8042" name="Rejeitadas" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                Sem dados para exibir
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Parlamentares mais ativos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              Parlamentares Mais Ativos
            </CardTitle>
            <CardDescription>Por numero de proposicoes apresentadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.destaques.parlamentaresMaisAtivos.length > 0 ? (
                data.destaques.parlamentaresMaisAtivos.map((p, index) => (
                  <div key={p.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`
                        w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                        ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                          index === 1 ? 'bg-gray-100 text-gray-700' :
                          index === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-50 text-gray-500'}
                      `}>
                        {index + 1}
                      </span>
                      <span className="font-medium text-sm">{p.nome}</span>
                    </div>
                    <Badge variant="secondary">{p.proposicoes}</Badge>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">Sem dados</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sessoes com mais itens */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              Sessoes com Mais Itens
            </CardTitle>
            <CardDescription>Sessoes com maior pauta</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.destaques.sessoesComMaisItens.length > 0 ? (
                data.destaques.sessoesComMaisItens.map((s, index) => (
                  <div key={s.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <span className="font-medium text-sm">{s.data}</span>
                    </div>
                    <Badge variant="secondary">{s.itens} itens</Badge>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">Sem dados</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Indicadores de Desempenho */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Indicadores de Desempenho
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Taxa de Aprovacao</span>
                  <span className="font-medium">{data.proposicoes.taxaAprovacao}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${Math.min(data.proposicoes.taxaAprovacao, 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Presenca Media</span>
                  <span className="font-medium">{data.sessoes.presencaMedia}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${Math.min(data.sessoes.presencaMedia, 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Participacao em Votacoes</span>
                  <span className="font-medium">{data.votacoes.participacaoMedia}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full"
                    style={{ width: `${Math.min(data.votacoes.participacaoMedia, 100)}%` }}
                  />
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="flex justify-between text-sm">
                  <span>Duracao Media de Sessao</span>
                  <span className="font-medium">{data.sessoes.duracaoMedia} min</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tipos de Sessao */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sessoes por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            {sessoesPorTipo.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={sessoesPorTipo}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {sessoesPorTipo.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-500">
                Sem dados para exibir
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sessoes por Status</CardTitle>
          </CardHeader>
          <CardContent>
            {sessoesPorStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={sessoesPorStatus} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#82ca9d">
                    {sessoesPorStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-500">
                Sem dados para exibir
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
