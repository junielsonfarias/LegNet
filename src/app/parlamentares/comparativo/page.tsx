'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Award,
  FileText,
  CheckCircle,
  Calendar,
  Target,
  Download,
  RefreshCw
} from 'lucide-react'
import { parlamentarAvancadoService } from '@/lib/parlamentar-avancado-service'
import { parlamentaresService } from '@/lib/parlamentares-data'
import { ComparativoParlamentares } from '@/lib/types/parlamentar-avancado'
import { toast } from 'sonner'

export default function ComparativoPage() {
  const [comparativo, setComparativo] = useState<ComparativoParlamentares | null>(null)
  const [loading, setLoading] = useState(true)
  const [filtroPartido, setFiltroPartido] = useState<string>('all')
  const [filtroMetrica, setFiltroMetrica] = useState<string>('pontuacao')

  useEffect(() => {
    carregarComparativo()
  }, [])

  const carregarComparativo = async () => {
    try {
      setLoading(true)
      const dados = parlamentarAvancadoService.gerarComparativoParlamentares()
      setComparativo(dados)
    } catch (error) {
      console.error('Erro ao carregar comparativo:', error)
      toast.error('Erro ao carregar dados do comparativo')
    } finally {
      setLoading(false)
    }
  }

  const exportarComparativo = async () => {
    if (!comparativo) return

    try {
      // Simular exportação
      toast.success('Comparativo exportado com sucesso!')
      console.log('Comparativo para exportação:', comparativo)
    } catch (error) {
      console.error('Erro ao exportar comparativo:', error)
      toast.error('Erro ao exportar comparativo')
    }
  }

  const getRankingColor = (ranking: number) => {
    switch (ranking) {
      case 1: return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 2: return 'bg-gray-100 text-gray-800 border-gray-300'
      case 3: return 'bg-orange-100 text-orange-800 border-orange-300'
      default: return 'bg-blue-100 text-blue-800 border-blue-300'
    }
  }

  const getRankingIcon = (ranking: number) => {
    switch (ranking) {
      case 1: return <Award className="h-4 w-4 text-yellow-600" />
      case 2: return <Award className="h-4 w-4 text-gray-600" />
      case 3: return <Award className="h-4 w-4 text-orange-600" />
      default: return <Target className="h-4 w-4 text-blue-600" />
    }
  }

  const parlamentaresFiltrados = comparativo?.parlamentares.filter(p => {
    if (filtroPartido === 'all') return true
    return p.partido === filtroPartido
  }) || []

  const parlamentaresOrdenados = [...parlamentaresFiltrados].sort((a, b) => {
    switch (filtroMetrica) {
      case 'pontuacao': return b.pontuacao - a.pontuacao
      case 'proposicoes': return b.dados.proposicoes - a.dados.proposicoes
      case 'aprovacoes': return b.dados.aprovacoes - a.dados.aprovacoes
      case 'presenca': return b.dados.presenca - a.dados.presenca
      case 'participacao': return b.dados.participacao - a.dados.participacao
      default: return b.pontuacao - a.pontuacao
    }
  })

  const partidosUnicos = Array.from(new Set(comparativo?.parlamentares.map(p => p.partido) || []))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-camara-primary"></div>
      </div>
    )
  }

  if (!comparativo) {
    return (
      <div className="text-center py-8">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Erro ao carregar comparativo</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Comparativo de Parlamentares</h1>
          <p className="text-gray-600">
            Ranking e comparação de performance legislativa
            <span className="ml-2 text-sm text-gray-500">
              Período: {new Date(comparativo.periodo.inicio).toLocaleDateString()} - {new Date(comparativo.periodo.fim).toLocaleDateString()}
            </span>
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={carregarComparativo} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={exportarComparativo} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Métricas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Média de Proposições</p>
                <p className="text-2xl font-bold">{Math.round(comparativo.metricas.mediaProposicoes)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Média de Aprovações</p>
                <p className="text-2xl font-bold">{Math.round(comparativo.metricas.mediaAprovacoes)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Média de Presença</p>
                <p className="text-2xl font-bold">{Math.round(comparativo.metricas.mediaPresenca)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Média de Participação</p>
                <p className="text-2xl font-bold">{Math.round(comparativo.metricas.mediaParticipacao)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Filtrar por Partido</label>
              <Select value={filtroPartido} onValueChange={setFiltroPartido}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Partidos</SelectItem>
                  {partidosUnicos.map((partido) => (
                    <SelectItem key={partido} value={partido}>{partido}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Ordenar por</label>
              <Select value={filtroMetrica} onValueChange={setFiltroMetrica}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pontuacao">Pontuação Geral</SelectItem>
                  <SelectItem value="proposicoes">Proposições</SelectItem>
                  <SelectItem value="aprovacoes">Aprovações</SelectItem>
                  <SelectItem value="presenca">Presença</SelectItem>
                  <SelectItem value="participacao">Participação</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ranking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Ranking de Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {parlamentaresOrdenados.map((parlamentar, index) => (
              <div key={parlamentar.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${getRankingColor(parlamentar.ranking)}`}>
                      {getRankingIcon(parlamentar.ranking)}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{parlamentar.nome}</h3>
                    <p className="text-gray-600">{parlamentar.partido}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-camara-primary">{parlamentar.pontuacao}</div>
                    <p className="text-xs text-gray-500">Pontos</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold text-blue-600">{parlamentar.dados.proposicoes}</div>
                      <p className="text-xs text-gray-500">Proposições</p>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-green-600">{parlamentar.dados.aprovacoes}</div>
                      <p className="text-xs text-gray-500">Aprovações</p>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-purple-600">{parlamentar.dados.presenca}%</div>
                      <p className="text-xs text-gray-500">Presença</p>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-orange-600">{parlamentar.dados.participacao}%</div>
                      <p className="text-xs text-gray-500">Participação</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top 3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {parlamentaresOrdenados.slice(0, 3).map((parlamentar, index) => (
          <Card key={parlamentar.id} className={index === 0 ? 'ring-2 ring-yellow-400' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  {getRankingIcon(parlamentar.ranking)}
                  <span className="ml-2">#{parlamentar.ranking}</span>
                </div>
                <Badge className={getRankingColor(parlamentar.ranking)}>
                  {index === 0 ? '🥇 1º Lugar' : index === 1 ? '🥈 2º Lugar' : '🥉 3º Lugar'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">{parlamentar.nome}</h3>
                <p className="text-gray-600 mb-4">{parlamentar.partido}</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Proposições:</span>
                    <span className="font-semibold">{parlamentar.dados.proposicoes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Aprovações:</span>
                    <span className="font-semibold">{parlamentar.dados.aprovacoes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Presença:</span>
                    <span className="font-semibold">{parlamentar.dados.presenca}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Participação:</span>
                    <span className="font-semibold">{parlamentar.dados.participacao}%</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Pontuação:</span>
                      <span className="text-lg font-bold text-camara-primary">{parlamentar.pontuacao}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
