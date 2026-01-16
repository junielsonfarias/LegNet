'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Search, 
  Calendar,
  MapPin,
  Clock,
  User,
  Building,
  FileText,
  Link,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Download,
  ChevronDown,
  ChevronRight,
  ExternalLink
} from 'lucide-react'
import { 
  audienciasPublicasService,
  AudienciaPublica,
  ParticipanteAudiencia
} from '@/lib/parlamentares-data'

export default function AudienciasPublicasPublicPage() {
  const [audiencias, setAudiencias] = useState<AudienciaPublica[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterTipo, setFilterTipo] = useState('all')
  const [expandedAudiencias, setExpandedAudiencias] = useState<string[]>([])

  // Carregar dados
  useEffect(() => {
    setAudiencias(audienciasPublicasService.getAll())
  }, [])

  // Filtrar audiências
  const filteredAudiencias = audiencias.filter(audiencia => {
    const matchesSearch = !searchTerm || 
      audiencia.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      audiencia.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      audiencia.objetivo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      audiencia.responsavel.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || audiencia.status === filterStatus
    const matchesTipo = filterTipo === 'all' || audiencia.tipo === filterTipo

    return matchesSearch && matchesStatus && matchesTipo
  })

  // Toggle expansão de audiência
  const toggleExpanded = (audienciaId: string) => {
    setExpandedAudiencias(prev => 
      prev.includes(audienciaId) 
        ? prev.filter(id => id !== audienciaId)
        : [...prev, audienciaId]
    )
  }

  // Função para obter cor do badge por status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AGENDADA': return 'bg-blue-100 text-blue-800'
      case 'EM_ANDAMENTO': return 'bg-yellow-100 text-yellow-800'
      case 'CONCLUIDA': return 'bg-green-100 text-green-800'
      case 'CANCELADA': return 'bg-red-100 text-red-800'
      case 'ADIADA': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Função para obter cor do badge por tipo
  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'ORDINARIA': return 'bg-blue-100 text-blue-800'
      case 'EXTRAORDINARIA': return 'bg-orange-100 text-orange-800'
      case 'ESPECIAL': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Função para obter cor do badge por tipo de participante
  const getParticipanteColor = (tipo: string) => {
    switch (tipo) {
      case 'PARLAMENTAR': return 'bg-blue-100 text-blue-800'
      case 'CONVIDADO': return 'bg-green-100 text-green-800'
      case 'CIDADAO': return 'bg-purple-100 text-purple-800'
      case 'ORGAO_PUBLICO': return 'bg-orange-100 text-orange-800'
      case 'ENTIDADE': return 'bg-pink-100 text-pink-800'
      case 'ESPECIALISTA': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Função para obter label do status
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'AGENDADA': return 'Agendada'
      case 'EM_ANDAMENTO': return 'Em Andamento'
      case 'CONCLUIDA': return 'Concluída'
      case 'CANCELADA': return 'Cancelada'
      case 'ADIADA': return 'Adiada'
      default: return status
    }
  }

  // Função para obter label do tipo
  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'ORDINARIA': return 'Ordinária'
      case 'EXTRAORDINARIA': return 'Extraordinária'
      case 'ESPECIAL': return 'Especial'
      default: return tipo
    }
  }

  // Função para obter label do tipo de participante
  const getParticipanteLabel = (tipo: string) => {
    switch (tipo) {
      case 'PARLAMENTAR': return 'Parlamentar'
      case 'CONVIDADO': return 'Convidado'
      case 'CIDADAO': return 'Cidadão'
      case 'ORGAO_PUBLICO': return 'Órgão Público'
      case 'ENTIDADE': return 'Entidade'
      case 'ESPECIALISTA': return 'Especialista'
      default: return tipo
    }
  }

  // Estatísticas
  const stats = audienciasPublicasService.getStats()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Audiências Públicas
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Participe das audiências públicas da Câmara Municipal e contribua para a construção de políticas públicas democráticas.
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="camara-card">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-camara-primary" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total de Audiências</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="camara-card">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Agendadas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.agendadas}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="camara-card">
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Concluídas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.concluidas}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="camara-card">
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Especiais</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.especiais}</p>
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
                    placeholder="Buscar por título, descrição ou responsável..."
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
                    <SelectItem value="AGENDADA">Agendada</SelectItem>
                    <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                    <SelectItem value="CONCLUIDA">Concluída</SelectItem>
                    <SelectItem value="CANCELADA">Cancelada</SelectItem>
                    <SelectItem value="ADIADA">Adiada</SelectItem>
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

        {/* Lista de Audiências */}
        <div className="space-y-6">
          {filteredAudiencias.map((audiencia) => {
            const isExpanded = expandedAudiencias.includes(audiencia.id)
            
            return (
              <Card key={audiencia.id} className="camara-card">
                <CardContent className="p-6">
                  {/* Header da Audiência */}
                  <div 
                    className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 -m-2 rounded-lg transition-colors"
                    onClick={() => toggleExpanded(audiencia.id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{audiencia.titulo}</h3>
                        <Badge className={getStatusColor(audiencia.status)}>
                          {getStatusLabel(audiencia.status)}
                        </Badge>
                        <Badge className={getTipoColor(audiencia.tipo)}>
                          {getTipoLabel(audiencia.tipo)}
                        </Badge>
                      </div>

                      <p className="text-gray-600 mb-3">{audiencia.descricao}</p>

                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(audiencia.dataHora).toLocaleDateString('pt-BR')} às{' '}
                          {new Date(audiencia.dataHora).toLocaleTimeString('pt-BR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {audiencia.local}
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {audiencia.participantes.length} participantes
                        </div>
                        {audiencia.participantes.filter(p => p.confirmado).length > 0 && (
                          <div className="flex items-center">
                            <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                            {audiencia.participantes.filter(p => p.confirmado).length} confirmados
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
                      {/* Informações Detalhadas */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-3">Informações da Audiência</h4>
                          <div className="space-y-3">
                            <div>
                              <span className="font-medium text-gray-700">Responsável:</span>
                              <p className="text-gray-600">{audiencia.responsavel}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Local:</span>
                              <p className="text-gray-600">{audiencia.local}</p>
                              {audiencia.endereco && (
                                <p className="text-sm text-gray-500">{audiencia.endereco}</p>
                              )}
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Data e Horário:</span>
                              <p className="text-gray-600">
                                {new Date(audiencia.dataHora).toLocaleDateString('pt-BR', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                              <p className="text-gray-600">
                                {new Date(audiencia.dataHora).toLocaleTimeString('pt-BR', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-3">Objetivos e Público</h4>
                          <div className="space-y-3">
                            <div>
                              <span className="font-medium text-gray-700">Objetivo:</span>
                              <p className="text-gray-600">{audiencia.objetivo}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Público-Alvo:</span>
                              <p className="text-gray-600">{audiencia.publicoAlvo}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Participantes */}
                      {audiencia.participantes.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-lg font-semibold text-gray-900 mb-4">Participantes</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {audiencia.participantes.map((participante) => (
                              <div key={participante.id} className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <h5 className="font-medium text-gray-900">{participante.nome}</h5>
                                      <Badge className={getParticipanteColor(participante.tipo)}>
                                        {getParticipanteLabel(participante.tipo)}
                                      </Badge>
                                    </div>
                                    {participante.cargo && (
                                      <p className="text-sm text-gray-600 mb-1">{participante.cargo}</p>
                                    )}
                                    {participante.instituicao && (
                                      <p className="text-sm text-gray-500">{participante.instituicao}</p>
                                    )}
                                  </div>
                                  <div className="ml-2">
                                    {participante.confirmado ? (
                                      <CheckCircle className="h-5 w-5 text-green-600" />
                                    ) : (
                                      <XCircle className="h-5 w-5 text-gray-400" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Documentos */}
                      {audiencia.documentos && audiencia.documentos.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-lg font-semibold text-gray-900 mb-4">Documentos</h4>
                          <div className="space-y-2">
                            {audiencia.documentos.map((documento, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                <div className="flex items-center">
                                  <FileText className="h-5 w-5 text-blue-600 mr-3" />
                                  <div>
                                    <p className="font-medium text-gray-900">{documento.nome}</p>
                                    <p className="text-sm text-gray-600">
                                      {documento.tipo} • {new Date(documento.data).toLocaleDateString('pt-BR')}
                                    </p>
                                  </div>
                                </div>
                                <Button variant="outline" size="sm">
                                  <Download className="h-4 w-4 mr-1" />
                                  Baixar
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Links */}
                      {audiencia.links && audiencia.links.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-lg font-semibold text-gray-900 mb-4">Links Relacionados</h4>
                          <div className="space-y-2">
                            {audiencia.links.map((link, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                <div className="flex items-center">
                                  <Link className="h-5 w-5 text-green-600 mr-3" />
                                  <div>
                                    <p className="font-medium text-gray-900">{link.nome}</p>
                                    <p className="text-sm text-gray-600">
                                      {link.tipo === 'TRANSMISSAO' ? 'Transmissão ao vivo' : 
                                       link.tipo === 'DOCUMENTO' ? 'Documento' : 'Outros'}
                                    </p>
                                  </div>
                                </div>
                                <Button variant="outline" size="sm" asChild>
                                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4 mr-1" />
                                    Acessar
                                  </a>
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Observações */}
                      {audiencia.observacoes && (
                        <div className="mb-6">
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">Observações</h4>
                          <p className="text-gray-600 bg-yellow-50 p-4 rounded-lg">
                            {audiencia.observacoes}
                          </p>
                        </div>
                      )}

                      {/* Ações */}
                      <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Baixar Documentos
                        </Button>
                        {audiencia.status === 'AGENDADA' && (
                          <Button size="sm" className="bg-camara-primary hover:bg-camara-primary/90">
                            <Users className="h-4 w-4 mr-2" />
                            Participar
                          </Button>
                        )}
                        {audiencia.links?.some(link => link.tipo === 'TRANSMISSAO') && (
                          <Button size="sm" className="bg-red-600 hover:bg-red-700">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Assistir ao Vivo
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredAudiencias.length === 0 && (
          <Card className="camara-card">
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma audiência encontrada</h3>
              <p className="text-gray-600">
                {searchTerm || filterStatus !== 'all' || filterTipo !== 'all'
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Não há audiências públicas no momento.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
