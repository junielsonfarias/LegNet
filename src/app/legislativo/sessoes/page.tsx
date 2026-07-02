/* eslint-disable react-hooks/rules-of-hooks */
'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Calendar, CalendarDays, List, Clock, Users, FileText, Play, CheckCircle, XCircle, AlertCircle, Search, Filter, X, Download, Loader2, RefreshCw } from 'lucide-react'
import { CalendarioSessoes } from '@/components/legislativo/calendario-sessoes'
import Link from 'next/link'
import { useConfiguracaoInstitucional } from '@/lib/hooks/use-configuracao-institucional'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { useBreadcrumbs } from '@/lib/hooks/use-breadcrumbs'
import { toast } from 'sonner'
import { createLogger } from '@/lib/logging/logger'

const log = createLogger('legislativo/sessoes')

// Interface para sessão da API pública
interface SessaoPublica {
  id: string
  numero: number
  tipo: string
  data: string
  horario: string | null
  local: string | null
  status: string
  descricao: string | null
  ata: string | null
  arquivoAta: string | null
  urlAudio: string | null
  urlVideo: string | null
  urlTransmissao: string | null
  presentes: number
  total_proposicoes: number
  legislatura: {
    numero: number
    anoInicio: number
    anoFim: number
  } | null
}

export default function SessoesPage() {
  const { configuracao } = useConfiguracaoInstitucional()
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'lista' | 'calendario'>('lista')
  const [tipoFilter, setTipoFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [anoFilter, setAnoFilter] = useState<number | null>(null)
  const [anoPadraoAplicado, setAnoPadraoAplicado] = useState(false)
  const [sessoes, setSessoes] = useState<SessaoPublica[]>([])
  const [loading, setLoading] = useState(true)

  const breadcrumbs = useBreadcrumbs()

  // Função para carregar dados da API pública (sem autenticação)
  const fetchSessoes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dados-abertos/sessoes?limit=500')
      if (!response.ok) throw new Error('Erro ao carregar dados')
      const result = await response.json()

      if (result.dados) {
        setSessoes(result.dados)
      } else {
        log.warn('Formato de resposta inesperado', { action: 'carregar-sessoes' })
        setSessoes([])
      }
    } catch (error) {
      log.error('Erro ao carregar sessões', error)
      toast.error('Erro ao carregar sessões')
      setSessoes([])
    } finally {
      setLoading(false)
    }
  }

  // Carregar dados da API ao montar componente
  useEffect(() => {
    fetchSessoes()
  }, [])

  // Estatísticas calculadas
  const sessoesRealizadas = sessoes.filter(s => s.status === 'CONCLUIDA')
  const totalPresencas = sessoesRealizadas.reduce((acc, s) => acc + (s.presentes || 0), 0)
  const estatisticas = {
    total: sessoes.length,
    realizadas: sessoesRealizadas.length,
    agendadas: sessoes.filter(s => s.status === 'AGENDADA').length,
    canceladas: sessoes.filter(s => s.status === 'CANCELADA').length,
    totalProposicoes: sessoes.reduce((acc, s) => acc + (s.total_proposicoes || 0), 0),
    mediaPresenca: sessoesRealizadas.length > 0 ? Math.round(totalPresencas / sessoesRealizadas.length) : 0
  }

  // Tipos únicos
  const tipos = Array.from(new Set(sessoes.map(s => s.tipo)))
  
  // Anos únicos
  const anos = Array.from(new Set(sessoes.map(s => new Date(s.data).getFullYear()))).sort((a, b) => b - a)

  // Padrão: aplica o ano atual (ou o mais recente com dados) uma única vez.
  useEffect(() => {
    if (anoPadraoAplicado || anos.length === 0) return
    const anoAtual = new Date().getFullYear()
    setAnoFilter(anos.includes(anoAtual) ? anoAtual : anos[0])
    setAnoPadraoAplicado(true)
  }, [anos, anoPadraoAplicado])

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const filteredSessoes = useMemo(() => {
    const filtered = sessoes.filter(sessao => {
      const numeroStr = sessao.numero.toString()
      const matchesSearch = !searchTerm || 
                         numeroStr.includes(searchTerm) ||
                         sessao.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (sessao.descricao && sessao.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesTipo = !tipoFilter || sessao.tipo === tipoFilter
      const matchesStatus = !statusFilter || sessao.status === statusFilter
      const matchesAno = !anoFilter || new Date(sessao.data).getFullYear() === anoFilter

      return matchesSearch && matchesTipo && matchesStatus && matchesAno
    })
    
    return filtered
  }, [sessoes, searchTerm, tipoFilter, statusFilter, anoFilter])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONCLUIDA':
        return <Badge className="bg-green-100 text-green-800 flex items-center">
          <CheckCircle className="h-3 w-3 mr-1" />
          Concluída
        </Badge>
      case 'AGENDADA':
        return <Badge className="bg-camara-primary/10 text-camara-primary flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          Agendada
        </Badge>
      case 'EM_ANDAMENTO':
        return <Badge className="bg-yellow-100 text-yellow-800 flex items-center">
          <Play className="h-3 w-3 mr-1" />
          Em Andamento
        </Badge>
      case 'CANCELADA':
        return <Badge className="bg-red-100 text-red-800 flex items-center">
          <XCircle className="h-3 w-3 mr-1" />
          Cancelada
        </Badge>
      case 'Suspensa':
        return <Badge className="bg-yellow-100 text-yellow-800 flex items-center">
          <AlertCircle className="h-3 w-3 mr-1" />
          Suspensa
        </Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  const getTipoBadge = (tipo: string) => {
    const tipoColors: Record<string, string> = {
      'ORDINARIA': 'bg-camara-primary/10 text-camara-primary',
      'EXTRAORDINARIA': 'bg-purple-100 text-purple-800',
      'ESPECIAL': 'bg-orange-100 text-orange-800',
      'SOLENE': 'bg-indigo-100 text-indigo-800'
    }
    const tipoLabels: Record<string, string> = {
      'ORDINARIA': 'Ordinária',
      'EXTRAORDINARIA': 'Extraordinária',
      'ESPECIAL': 'Especial',
      'SOLENE': 'Solene'
    }
    return <Badge className={tipoColors[tipo] || 'bg-gray-100 text-gray-800'}>{tipoLabels[tipo] || tipo}</Badge>
  }

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      'ORDINARIA': 'Ordinária',
      'EXTRAORDINARIA': 'Extraordinária',
      'ESPECIAL': 'Especial',
      'SOLENE': 'Solene'
    }
    return labels[tipo] || tipo
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        {/* Breadcrumbs */}
        <div className="mb-6">
          <Breadcrumb items={breadcrumbs} />
        </div>
        
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Sessões Legislativas
          </h1>
          <p className="text-base md:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
            Acompanhe todas as sessões da {configuracao?.nomeCasa || 'Câmara Municipal'}.
          </p>
          {/* Toggle Lista/Calendário */}
          <div className="flex items-center justify-center gap-1 mt-4 bg-gray-100 rounded-xl p-1 w-fit mx-auto">
            <button
              onClick={() => setViewMode('lista')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'lista' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <List className="h-4 w-4" />Lista
            </button>
            <button
              onClick={() => setViewMode('calendario')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'calendario' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <CalendarDays className="h-4 w-4" />Calendário
            </button>
          </div>
          <p className="hidden">
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-12">
          <Card className="camara-card text-center">
            <CardContent className="p-4 sm:p-6">
              <Calendar className="h-12 w-12 text-camara-primary mx-auto mb-3" />
              <div className="text-3xl font-bold text-camara-primary mb-2">{estatisticas.total}</div>
              <div className="text-sm text-gray-600">Total de Sessões</div>
            </CardContent>
          </Card>

          <Card className="camara-card text-center">
            <CardContent className="p-4 sm:p-6">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-green-600 mb-2">{estatisticas.realizadas}</div>
              <div className="text-sm text-gray-600">Realizadas</div>
            </CardContent>
          </Card>

          <Card className="camara-card text-center">
            <CardContent className="p-4 sm:p-6">
              <Clock className="h-12 w-12 text-camara-primary mx-auto mb-3" />
              <div className="text-3xl font-bold text-camara-primary mb-2">{estatisticas.agendadas}</div>
              <div className="text-sm text-gray-600">Agendadas</div>
            </CardContent>
          </Card>

          <Card className="camara-card text-center">
            <CardContent className="p-4 sm:p-6">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-red-500 mb-2">{estatisticas.canceladas}</div>
              <div className="text-sm text-gray-600">Canceladas</div>
            </CardContent>
          </Card>
        </div>

        {/* View Calendário */}
        {viewMode === 'calendario' && (
          <Card className="mb-8">
            <CardContent className="p-4 sm:p-6">
              <CalendarioSessoes sessoes={sessoes} />
            </CardContent>
          </Card>
        )}

        {/* Filtros e Busca */}
        <div className={`mb-8 ${viewMode !== 'lista' ? 'hidden' : ''}`}>
          <Card className="camara-card">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4">
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Buscar sessões por número, tipo ou resumo..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={fetchSessoes}
                      disabled={loading}
                      title="Recarregar sessões"
                    >
                      <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant={!tipoFilter && !statusFilter && !anoFilter ? "default" : "outline"} 
                    size="sm"
                    onClick={() => {
                      setTipoFilter(null)
                      setStatusFilter(null)
                      setAnoFilter(null)
                    }}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Todas
                  </Button>
                  
                  <div className="w-px h-6 bg-gray-300 mx-1"></div>
                  
                  {tipos.map(tipo => (
                    <Button 
                      key={tipo}
                      variant={tipoFilter === tipo ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setTipoFilter(tipoFilter === tipo ? null : tipo)}
                    >
                      {tipo}
                    </Button>
                  ))}
                  
                  <div className="w-px h-6 bg-gray-300 mx-1"></div>
                  
                  <Button
                    variant={statusFilter === 'CONCLUIDA' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(statusFilter === 'CONCLUIDA' ? null : 'CONCLUIDA')}
                  >
                    Realizadas
                  </Button>
                  <Button
                    variant={statusFilter === 'AGENDADA' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(statusFilter === 'AGENDADA' ? null : 'AGENDADA')}
                  >
                    Agendadas
                  </Button>
                  
                  <div className="w-px h-6 bg-gray-300 mx-1"></div>
                  
                  {anos.map(ano => (
                    <Button 
                      key={ano}
                      variant={anoFilter === ano ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setAnoFilter(anoFilter === ano ? null : ano)}
                    >
                      {ano}
                    </Button>
                  ))}
                  
                  {(tipoFilter || statusFilter || anoFilter || searchTerm) && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setTipoFilter(null)
                        setStatusFilter(null)
                        setAnoFilter(null)
                        setSearchTerm('')
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Limpar Filtros
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className={`mb-4 text-sm text-gray-600 ${viewMode !== 'lista' ? 'hidden' : ''}`}>
          Encontradas {filteredSessoes.length} sessão(ões)
        </div>

        {/* Lista de Sessões */}
        {viewMode !== 'lista' ? null : loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-camara-primary" />
            <span className="ml-2 text-gray-600">Carregando sessões...</span>
          </div>
        ) : filteredSessoes.length === 0 ? (
          <Card className="camara-card">
            <CardContent className="p-12 text-center">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhuma sessão encontrada
              </h3>
              <p className="text-gray-600">
                Tente ajustar os filtros ou realizar uma nova busca
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredSessoes.map((sessao) => (
              <Card key={sessao.id} className="camara-card hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <CardTitle className="text-xl font-semibold text-gray-900">
                          {sessao.numero}ª Sessão {getTipoLabel(sessao.tipo)}
                        </CardTitle>
                        {getStatusBadge(sessao.status)}
                        {getTipoBadge(sessao.tipo)}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(sessao.data.substring(0, 10) + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </div>
                        {sessao.horario && (
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {sessao.horario}
                          </div>
                        )}
                      </div>
                      {sessao.descricao && (
                        <p className="text-gray-700">
                          {sessao.descricao}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-2">
                      {sessao.arquivoAta && (
                        <Button asChild variant="outline" size="sm">
                          <a href={sessao.arquivoAta} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-2" />
                            Ata
                          </a>
                        </Button>
                      )}
                      {sessao.urlVideo && (
                        <Button asChild variant="outline" size="sm">
                          <a href={sessao.urlVideo} target="_blank" rel="noopener noreferrer">
                            <Play className="h-4 w-4 mr-2" />
                            Video
                          </a>
                        </Button>
                      )}
                      {sessao.urlAudio && (
                        <Button asChild variant="outline" size="sm">
                          <a href={sessao.urlAudio} target="_blank" rel="noopener noreferrer">
                            <Play className="h-4 w-4 mr-2" />
                            Audio
                          </a>
                        </Button>
                      )}
                      {sessao.urlTransmissao && sessao.status === 'EM_ANDAMENTO' && (
                        <Button asChild size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                          <a href={sessao.urlTransmissao} target="_blank" rel="noopener noreferrer">
                            <Play className="h-4 w-4 mr-2" />
                            Ao Vivo
                          </a>
                        </Button>
                      )}
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/legislativo/sessoes/${sessao.id}`}>
                          <FileText className="h-4 w-4 mr-2" />
                          Detalhes
                        </Link>
                      </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Informações Importantes */}
        <div className="mt-12">
          <Card className="camara-card">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-camara-primary">
                Sobre as Sessões Legislativas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Tipos de Sessão</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• <strong>Ordinária:</strong> Sessões regulares para votação de matérias</li>
                    <li>• <strong>Extraordinária:</strong> Sessões especiais para assuntos urgentes</li>
                    <li>• <strong>Especial:</strong> Sessões para discussão de temas específicos</li>
                    <li>• <strong>Solene:</strong> Sessões cerimoniais e homenagens</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Como Consultar</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• Use os filtros para encontrar sessões específicas</li>
                    <li>• Clique em &quot;Ver Detalhes&quot; para mais informações</li>
                    <li>• Baixe as atas para consulta completa</li>
                    <li>• Acompanhe a presença dos vereadores</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}