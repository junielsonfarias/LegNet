'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  User, 
  Calendar, 
  FileText, 
  Users, 
  TrendingUp, 
  Award,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  Download,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Activity,
  Target,
  Star
} from 'lucide-react'
import { parlamentarAvancadoService } from '@/lib/parlamentar-avancado-service'
import { parlamentaresService } from '@/lib/parlamentares-data'
import { ParlamentarCompleto } from '@/lib/types/parlamentar-avancado'
import { toast } from 'sonner'

interface PerfilCompletoPageProps {
  params: {
    slug: string
  }
}

export default function PerfilCompletoPage({ params }: PerfilCompletoPageProps) {
  const [parlamentar, setParlamentar] = useState<ParlamentarCompleto | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  const carregarParlamentar = useCallback(async () => {
    try {
      setLoading(true)
      const parlamentarEncontrado = parlamentaresService.getBySlug(params.slug)
      if (parlamentarEncontrado) {
        const parlamentarCompleto = parlamentarAvancadoService.getParlamentarCompleto(parlamentarEncontrado.id)
        setParlamentar(parlamentarCompleto || null)
      }
    } catch (error) {
      console.error('Erro ao carregar parlamentar:', error)
      toast.error('Erro ao carregar dados do parlamentar')
    } finally {
      setLoading(false)
    }
  }, [params.slug])

  useEffect(() => {
    carregarParlamentar()
  }, [carregarParlamentar])

  const gerarRelatorio = async () => {
    if (!parlamentar) return

    try {
      const relatorio = parlamentarAvancadoService.gerarRelatorioParlamentar(parlamentar.id, 'anual')
      toast.success('Relatório gerado com sucesso!')
      console.log('Relatório:', relatorio)
    } catch (error) {
      console.error('Erro ao gerar relatório:', error)
      toast.error('Erro ao gerar relatório')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'agendada': return 'bg-blue-100 text-blue-800'
      case 'realizada': return 'bg-green-100 text-green-800'
      case 'cancelada': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'sessao': return 'bg-purple-100 text-purple-800'
      case 'comissao': return 'bg-blue-100 text-blue-800'
      case 'evento': return 'bg-green-100 text-green-800'
      case 'reuniao': return 'bg-yellow-100 text-yellow-800'
      case 'audiencia': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-camara-primary"></div>
      </div>
    )
  }

  if (!parlamentar) {
    return (
      <div className="text-center py-8">
        <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Parlamentar não encontrado</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-camara-primary rounded-full flex items-center justify-center text-white text-xl font-bold">
            {parlamentar.nome.charAt(0)}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{parlamentar.nome}</h1>
            <p className="text-gray-600">{parlamentar.cargo} • {parlamentar.partido}</p>
            <p className="text-sm text-gray-500">Legislatura {parlamentar.legislatura}</p>
          </div>
        </div>
        <Button onClick={gerarRelatorio}>
          <Download className="h-4 w-4 mr-2" />
          Gerar Relatório
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proposições</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{parlamentar.proposicoes.apresentadas}</div>
            <p className="text-xs text-muted-foreground">
              {parlamentar.proposicoes.aprovadas} aprovadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Presença</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{parlamentar.presenca.percentual}%</div>
            <p className="text-xs text-muted-foreground">
              {parlamentar.presenca.presenciadas}/{parlamentar.presenca.totalSessoes} sessões
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comissões</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{parlamentar.participacaoComissoes.totalComissoes}</div>
            <p className="text-xs text-muted-foreground">
              {parlamentar.participacaoComissoes.presidencias} presidências
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Experiência</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{parlamentar.estatisticas.anosExperiencia}</div>
            <p className="text-xs text-muted-foreground">
              {parlamentar.estatisticas.mandatos} mandatos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
          <TabsTrigger value="producao">Produção</TabsTrigger>
          <TabsTrigger value="comissoes">Comissões</TabsTrigger>
          <TabsTrigger value="agenda">Agenda</TabsTrigger>
        </TabsList>

        {/* Aba Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Informações Pessoais */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Informações Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{parlamentar.email || 'N/A'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{parlamentar.telefone || 'N/A'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Gabinete {parlamentar.gabinete || 'N/A'}</span>
                </div>
                {parlamentar.redesSociais && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Redes Sociais</h4>
                    <div className="flex space-x-2">
                      {parlamentar.redesSociais.facebook && (
                        <a href={parlamentar.redesSociais.facebook} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Facebook
                          </Button>
                        </a>
                      )}
                      {parlamentar.redesSociais.instagram && (
                        <a href={parlamentar.redesSociais.instagram} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Instagram
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Estatísticas de Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Performance Legislativa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Taxa de Aprovação</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${parlamentar.estatisticas.produtividade.taxaAprovacao}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{parlamentar.estatisticas.produtividade.taxaAprovacao}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Participação em Debates</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${parlamentar.estatisticas.participacao.participacaoDebates}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{parlamentar.estatisticas.participacao.participacaoDebates}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Índice de Influência</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full" 
                        style={{ width: `${(parlamentar.estatisticas.influencia.indiceInfluencia / 10) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{parlamentar.estatisticas.influencia.indiceInfluencia}/10</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Biografia */}
          {parlamentar.biografia && (
            <Card>
              <CardHeader>
                <CardTitle>Biografia</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{parlamentar.biografia}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Aba Histórico */}
        <TabsContent value="historico" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Histórico Legislativo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {parlamentar.historicoLegislativo.map((historico) => (
                  <div key={historico.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{historico.cargo} - {historico.periodo}</h3>
                      <p className="text-sm text-gray-600">{historico.partido}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(historico.dataInicio).toLocaleDateString()} - 
                        {historico.dataFim ? new Date(historico.dataFim).toLocaleDateString() : 'Atual'}
                      </p>
                    </div>
                    <Badge variant={historico.ativo ? "default" : "secondary"}>
                      {historico.ativo ? 'Ativo' : 'Concluído'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Produção */}
        <TabsContent value="producao" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Produção Legislativa 2024
              </CardTitle>
            </CardHeader>
            <CardContent>
              {parlamentar.producaoLegislativa.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{parlamentar.producaoLegislativa[0].proposicoes.projetosLei}</div>
                      <p className="text-sm text-gray-600">Projetos de Lei</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{parlamentar.producaoLegislativa[0].proposicoes.projetosResolucao}</div>
                      <p className="text-sm text-gray-600">Projetos de Resolução</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{parlamentar.producaoLegislativa[0].proposicoes.indicacoes}</div>
                      <p className="text-sm text-gray-600">Indicações</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{parlamentar.producaoLegislativa[0].proposicoes.requerimentos}</div>
                      <p className="text-sm text-gray-600">Requerimentos</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Nenhuma produção legislativa registrada</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Comissões */}
        <TabsContent value="comissoes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Participação em Comissões
              </CardTitle>
            </CardHeader>
            <CardContent>
              {parlamentar.comissoes.length > 0 ? (
                <div className="space-y-3">
                  {parlamentar.comissoes.map((comissao) => (
                    <div key={comissao.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">Comissão {comissao.comissaoId}</h3>
                        <p className="text-sm text-gray-600">Cargo: {comissao.cargo.replace('_', ' ')}</p>
                        <p className="text-xs text-gray-500">
                          Desde {new Date(comissao.dataInicio).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={comissao.ativo ? "default" : "secondary"}>
                        {comissao.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Nenhuma participação em comissões registrada</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Agenda */}
        <TabsContent value="agenda" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Agenda Legislativa
              </CardTitle>
            </CardHeader>
            <CardContent>
              {parlamentar.agenda.length > 0 ? (
                <div className="space-y-3">
                  {parlamentar.agenda.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <Clock className="h-4 w-4 text-gray-500" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{item.titulo}</h3>
                          <p className="text-sm text-gray-600">{item.descricao}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(item.data).toLocaleDateString()} às {item.hora} - {item.local}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getTipoColor(item.tipo)}>
                          {item.tipo.toUpperCase()}
                        </Badge>
                        <Badge className={getStatusColor(item.status)}>
                          {item.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Nenhum item na agenda</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
