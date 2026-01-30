'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Search,
  Calendar,
  Clock,
  Users,
  Download,
  Eye,
  ChevronDown,
  ChevronRight,
  Gavel,
  BookOpen,
  AlertCircle,
  CheckCircle,
  PlayCircle
} from 'lucide-react'

// Interfaces locais (originalmente de parlamentares-data)
interface PautaItem {
  id: string
  tipo: 'EXPEDIENTE' | 'ORDEM_DO_DIA'
  categoria: 'COMUNICACAO' | 'REQUERIMENTO' | 'INDICACAO' | 'PROJETO_LEI' | 'PROJETO_RESOLUCAO' | 'PROJETO_DECRETO' | 'VOTO_APLAUSO' | 'VOTO_PESAR' | 'OUTROS'
  numero?: string
  titulo: string
  descricao?: string
  autor?: string
  parlamentarId?: string
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA'
  status: 'PENDENTE' | 'APROVADO' | 'REJEITADO' | 'ADIADO'
  tempoEstimado?: number
  ordem: number
  votacao?: {
    aprovado: boolean
    votosFavoraveis: number
    votosContrarios: number
    abstencao: number
    resultado?: string
  }
  anexos?: {
    nome: string
    url: string
    tipo: string
  }[]
}

interface PautaSessao {
  id: string
  sessaoId: string
  data: string
  tipo: 'ORDINARIA' | 'EXTRAORDINARIA' | 'ESPECIAL' | 'SOLENE'
  status: 'RASCUNHO' | 'PUBLICADA' | 'APROVADA' | 'EM_ANDAMENTO' | 'CONCLUIDA'
  titulo: string
  descricao?: string
  expediente: PautaItem[]
  ordemDoDia: PautaItem[]
  observacoes?: string
  publicadaEm?: string
  aprovadaEm?: string
  criadaEm: string
  atualizadaEm: string
}

interface PautasStats {
  total: number
  publicadas: number
  rascunhos: number
  aprovadas: number
  ordinarias: number
  extraordinarias: number
}

export default function PautasSessoesPublicPage() {
  const [pautas, setPautas] = useState<PautaSessao[]>([])
  const [stats, setStats] = useState<PautasStats>({
    total: 0,
    publicadas: 0,
    rascunhos: 0,
    aprovadas: 0,
    ordinarias: 0,
    extraordinarias: 0
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterTipo, setFilterTipo] = useState('all')
  const [expandedPautas, setExpandedPautas] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // Carregar dados via API
  const carregarDados = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/publico/pautas-sessoes?publicadas=true')
      const result = await response.json()

      if (result.success && result.data) {
        setPautas(result.data.pautas || [])
        if (result.data.stats) {
          setStats(result.data.stats)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar pautas:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  // Filtrar pautas
  const filteredPautas = pautas.filter(pauta => {
    const matchesSearch = !searchTerm || 
      pauta.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pauta.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || pauta.status === filterStatus
    const matchesTipo = filterTipo === 'all' || pauta.tipo === filterTipo

    return matchesSearch && matchesStatus && matchesTipo
  })

  // Toggle expansão de pauta
  const toggleExpanded = (pautaId: string) => {
    setExpandedPautas(prev => 
      prev.includes(pautaId) 
        ? prev.filter(id => id !== pautaId)
        : [...prev, pautaId]
    )
  }

  // Função para obter cor do badge por status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLICADA': return 'bg-green-100 text-green-800'
      case 'APROVADA': return 'bg-blue-100 text-blue-800'
      case 'EM_ANDAMENTO': return 'bg-purple-100 text-purple-800'
      case 'CONCLUIDA': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Função para obter cor do badge por tipo
  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'ORDINARIA': return 'bg-blue-100 text-blue-800'
      case 'EXTRAORDINARIA': return 'bg-orange-100 text-orange-800'
      case 'ESPECIAL': return 'bg-purple-100 text-purple-800'
      case 'SOLENE': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Função para obter cor do badge por categoria
  const getCategoriaColor = (categoria: string) => {
    switch (categoria) {
      case 'PROJETO_LEI': return 'bg-blue-100 text-blue-800'
      case 'PROJETO_RESOLUCAO': return 'bg-green-100 text-green-800'
      case 'PROJETO_DECRETO': return 'bg-purple-100 text-purple-800'
      case 'REQUERIMENTO': return 'bg-orange-100 text-orange-800'
      case 'INDICACAO': return 'bg-yellow-100 text-yellow-800'
      case 'VOTO_APLAUSO': return 'bg-pink-100 text-pink-800'
      case 'VOTO_PESAR': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Função para obter label do status
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PUBLICADA': return 'Publicada'
      case 'APROVADA': return 'Aprovada'
      case 'EM_ANDAMENTO': return 'Em Andamento'
      case 'CONCLUIDA': return 'Concluída'
      default: return status
    }
  }

  // Função para obter label do tipo
  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'ORDINARIA': return 'Ordinária'
      case 'EXTRAORDINARIA': return 'Extraordinária'
      case 'ESPECIAL': return 'Especial'
      case 'SOLENE': return 'Solenne'
      default: return tipo
    }
  }

  // Função para obter label da categoria
  const getCategoriaLabel = (categoria: string) => {
    switch (categoria) {
      case 'COMUNICACAO': return 'Comunicação'
      case 'REQUERIMENTO': return 'Requerimento'
      case 'INDICACAO': return 'Indicação'
      case 'PROJETO_LEI': return 'Projeto de Lei'
      case 'PROJETO_RESOLUCAO': return 'Projeto de Resolução'
      case 'PROJETO_DECRETO': return 'Projeto de Decreto'
      case 'VOTO_APLAUSO': return 'Voto de Aplauso'
      case 'VOTO_PESAR': return 'Voto de Pesar'
      case 'OUTROS': return 'Outros'
      default: return categoria
    }
  }

  // Função para obter cor do badge por prioridade
  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'ALTA': return 'bg-red-100 text-red-800'
      case 'MEDIA': return 'bg-yellow-100 text-yellow-800'
      case 'BAIXA': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-camara-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando pautas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Pautas das Sessões Legislativas
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Acompanhe as pautas das sessões ordinárias, extraordinárias, especiais e solenes da Câmara Municipal.
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="camara-card">
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-camara-primary" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total de Pautas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="camara-card">
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Publicadas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.publicadas}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="camara-card">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Ordinárias</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.ordinarias}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="camara-card">
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Extraordinárias</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.extraordinarias}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="camara-card mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-camara-primary">Filtros de Busca</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Buscar</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="search"
                    placeholder="Buscar por título ou descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="PUBLICADA">Publicada</SelectItem>
                    <SelectItem value="APROVADA">Aprovada</SelectItem>
                    <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                    <SelectItem value="CONCLUIDA">Concluída</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tipo">Tipo</Label>
                <Select value={filterTipo} onValueChange={setFilterTipo}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Tipos</SelectItem>
                    <SelectItem value="ORDINARIA">Ordinária</SelectItem>
                    <SelectItem value="EXTRAORDINARIA">Extraordinária</SelectItem>
                    <SelectItem value="ESPECIAL">Especial</SelectItem>
                    <SelectItem value="SOLENE">Solenne</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('')
                    setFilterStatus('all')
                    setFilterTipo('all')
                  }}
                  className="w-full"
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Pautas */}
        <div className="space-y-6">
          {filteredPautas.map((pauta) => {
            const isExpanded = expandedPautas.includes(pauta.id)
            
            return (
              <Card key={pauta.id} className="camara-card">
                <CardContent className="p-6">
                  {/* Header da Pauta */}
                  <div 
                    className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 -m-2 rounded-lg transition-colors"
                    onClick={() => toggleExpanded(pauta.id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{pauta.titulo}</h3>
                        <Badge className={getStatusColor(pauta.status)}>
                          {getStatusLabel(pauta.status)}
                        </Badge>
                        <Badge className={getTipoColor(pauta.tipo)}>
                          {getTipoLabel(pauta.tipo)}
                        </Badge>
                      </div>

                      {pauta.descricao && (
                        <p className="text-gray-600 mb-3">{pauta.descricao}</p>
                      )}

                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(pauta.data).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-1" />
                          {pauta.expediente.length + pauta.ordemDoDia.length} itens na pauta
                        </div>
                        {pauta.publicadaEm && (
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            Publicada em {new Date(pauta.publicadaEm).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="ml-4">
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Conteúdo Expandido */}
                  {isExpanded && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      {/* Expediente */}
                      {pauta.expediente.length > 0 && (
                        <div className="mb-8">
                          <div className="flex items-center mb-4">
                            <BookOpen className="h-5 w-5 text-blue-600 mr-2" />
                            <h4 className="text-lg font-semibold text-gray-900">Expediente</h4>
                            <Badge variant="outline" className="ml-2">{pauta.expediente.length} itens</Badge>
                          </div>
                          <div className="space-y-4">
                            {pauta.expediente.map((item, index) => (
                              <div key={item.id} className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <span className="text-sm font-medium text-gray-600">
                                        {index + 1}.
                                      </span>
                                      {item.numero && (
                                        <Badge variant="outline" className="text-xs">
                                          {item.numero}
                                        </Badge>
                                      )}
                                      <Badge className={getCategoriaColor(item.categoria)}>
                                        {getCategoriaLabel(item.categoria)}
                                      </Badge>
                                      <Badge className={getPrioridadeColor(item.prioridade)}>
                                        {item.prioridade}
                                      </Badge>
                                    </div>
                                    <h5 className="font-medium text-gray-900 mb-1">{item.titulo}</h5>
                                    {item.descricao && (
                                      <p className="text-sm text-gray-600 mb-2">{item.descricao}</p>
                                    )}
                                    {item.autor && (
                                      <p className="text-sm text-gray-500">
                                        <strong>Autor:</strong> {item.autor}
                                      </p>
                                    )}
                                  </div>
                                  {item.tempoEstimado && (
                                    <div className="flex items-center text-sm text-gray-500 ml-4">
                                      <Clock className="h-4 w-4 mr-1" />
                                      {item.tempoEstimado} min
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Ordem do Dia */}
                      {pauta.ordemDoDia.length > 0 && (
                        <div className="mb-6">
                          <div className="flex items-center mb-4">
                            <Gavel className="h-5 w-5 text-purple-600 mr-2" />
                            <h4 className="text-lg font-semibold text-gray-900">Ordem do Dia</h4>
                            <Badge variant="outline" className="ml-2">{pauta.ordemDoDia.length} itens</Badge>
                          </div>
                          <div className="space-y-4">
                            {pauta.ordemDoDia.map((item, index) => (
                              <div key={item.id} className="bg-blue-50 p-4 rounded-lg">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <span className="text-sm font-medium text-gray-600">
                                        {index + 1}.
                                      </span>
                                      {item.numero && (
                                        <Badge variant="outline" className="text-xs">
                                          {item.numero}
                                        </Badge>
                                      )}
                                      <Badge className={getCategoriaColor(item.categoria)}>
                                        {getCategoriaLabel(item.categoria)}
                                      </Badge>
                                      <Badge className={getPrioridadeColor(item.prioridade)}>
                                        {item.prioridade}
                                      </Badge>
                                    </div>
                                    <h5 className="font-medium text-gray-900 mb-1">{item.titulo}</h5>
                                    {item.descricao && (
                                      <p className="text-sm text-gray-600 mb-2">{item.descricao}</p>
                                    )}
                                    {item.autor && (
                                      <p className="text-sm text-gray-500">
                                        <strong>Autor:</strong> {item.autor}
                                      </p>
                                    )}
                                  </div>
                                  {item.tempoEstimado && (
                                    <div className="flex items-center text-sm text-gray-500 ml-4">
                                      <Clock className="h-4 w-4 mr-1" />
                                      {item.tempoEstimado} min
                                    </div>
                                  )}
                                </div>

                                {/* Anexos */}
                                {item.anexos && item.anexos.length > 0 && (
                                  <div className="mt-3 pt-3 border-t border-blue-200">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Anexos:</p>
                                    <div className="space-y-1">
                                      {item.anexos.map((anexo, idx) => (
                                        <div key={idx} className="flex items-center text-sm text-blue-600">
                                          <Download className="h-4 w-4 mr-1" />
                                          <a 
                                            href={anexo.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="hover:underline"
                                          >
                                            {anexo.nome}
                                          </a>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Observações */}
                      {pauta.observacoes && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">Observações</h4>
                          <p className="text-gray-600 bg-yellow-50 p-4 rounded-lg">
                            {pauta.observacoes}
                          </p>
                        </div>
                      )}

                      {/* Ações */}
                      <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Baixar PDF
                        </Button>
                        <Button size="sm" className="bg-camara-primary hover:bg-camara-primary/90">
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Assistir Sessão
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredPautas.length === 0 && (
          <Card className="camara-card">
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma pauta encontrada</h3>
              <p className="text-gray-600">
                {searchTerm || filterStatus !== 'all' || filterTipo !== 'all'
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Não há pautas publicadas no momento.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
