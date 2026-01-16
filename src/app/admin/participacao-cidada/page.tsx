'use client'

import { useState, useEffect } from 'react'
import { AdminBreadcrumbs } from '@/components/admin/admin-breadcrumbs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { 
  Lightbulb, 
  Vote, 
  FileText, 
  MessageSquare, 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  TrendingUp,
  Users,
  BarChart3,
  MessageCircle,
  ThumbsUp,
  Calendar,
  User,
  Mail,
  Phone,
  MapPin
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { participacaoCidadaService, SugestaoCidada, ConsultaPublica, Peticao } from '@/lib/participacao-cidada-service'

export default function AdminParticipacaoCidadaPage() {
  const [sugestoes, setSugestoes] = useState<SugestaoCidada[]>([])
  const [consultas, setConsultas] = useState<ConsultaPublica[]>([])
  const [peticoes, setPeticoes] = useState<Peticao[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Estados para modais
  const [modalRespostaOpen, setModalRespostaOpen] = useState(false)
  const [sugestaoSelecionada, setSugestaoSelecionada] = useState<SugestaoCidada | null>(null)
  const [respostaOficial, setRespostaOficial] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    try {
      setSugestoes(participacaoCidadaService.getAllSugestoes())
      setConsultas(participacaoCidadaService.getAllConsultas())
      setPeticoes(participacaoCidadaService.getAllPeticoes())
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados de participação cidadã')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatusSugestao = (id: string, status: SugestaoCidada['status']) => {
    try {
      const sugestao = participacaoCidadaService.updateSugestao(id, { status })
      if (sugestao) {
        setSugestoes(participacaoCidadaService.getAllSugestoes())
        toast.success(`Status da sugestão alterado para ${status}`)
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast.error('Erro ao atualizar status da sugestão')
    }
  }

  const handleResponderSugestao = async () => {
    if (!sugestaoSelecionada || !respostaOficial.trim()) {
      toast.error('Preencha a resposta oficial')
      return
    }

    try {
      const sugestao = participacaoCidadaService.updateSugestao(sugestaoSelecionada.id, {
        respostaOficial,
        dataResposta: new Date(),
        status: 'em_analise'
      })

      if (sugestao) {
        setSugestoes(participacaoCidadaService.getAllSugestoes())
        setRespostaOficial('')
        setModalRespostaOpen(false)
        setSugestaoSelecionada(null)
        toast.success('Resposta oficial enviada com sucesso!')
      }
    } catch (error) {
      console.error('Erro ao responder sugestão:', error)
      toast.error('Erro ao enviar resposta oficial')
    }
  }

  const handleFinalizarConsulta = (id: string) => {
    try {
      const consulta = participacaoCidadaService.getConsulta(id)
      if (consulta) {
        const totalVotos = consulta.opcoes.reduce((acc, opcao) => acc + opcao.votos, 0)
        const distribuicaoVotos: Record<string, number> = {}
        const percentuais: Record<string, number> = {}

        consulta.opcoes.forEach(opcao => {
          distribuicaoVotos[opcao.texto] = opcao.votos
          percentuais[opcao.texto] = totalVotos > 0 ? (opcao.votos / totalVotos) * 100 : 0
        })

        const resultado = {
          totalVotos,
          distribuicaoVotos,
          percentuais,
          analise: 'Consulta finalizada automaticamente pelo sistema',
          recomendacoes: ['Analisar resultados', 'Considerar opinião dos cidadãos']
        }

        participacaoCidadaService.finalizarConsulta(id, resultado)
        setConsultas(participacaoCidadaService.getAllConsultas())
        toast.success('Consulta finalizada com sucesso!')
      }
    } catch (error) {
      console.error('Erro ao finalizar consulta:', error)
      toast.error('Erro ao finalizar consulta')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pendente: { variant: 'secondary' as const, icon: Clock, text: 'Pendente' },
      em_analise: { variant: 'default' as const, icon: Activity, text: 'Em Análise' },
      aceita: { variant: 'default' as const, icon: CheckCircle, text: 'Aceita' },
      rejeitada: { variant: 'destructive' as const, icon: XCircle, text: 'Rejeitada' },
      implementada: { variant: 'default' as const, icon: CheckCircle, text: 'Implementada' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pendente
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    )
  }

  const getPrioridadeBadge = (prioridade: string) => {
    const prioridadeConfig = {
      baixa: { variant: 'outline' as const, text: 'Baixa' },
      media: { variant: 'secondary' as const, text: 'Média' },
      alta: { variant: 'default' as const, text: 'Alta' },
      critica: { variant: 'destructive' as const, text: 'Crítica' }
    }

    const config = prioridadeConfig[prioridade as keyof typeof prioridadeConfig] || prioridadeConfig.media

    return (
      <Badge variant={config.variant}>
        {config.text}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Carregando dados de participação cidadã...</p>
        </div>
      </div>
    )
  }

  const estatisticas = participacaoCidadaService.getEstatisticas()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Participação Cidadã</h1>
          <p className="text-muted-foreground">
            Gerencie sugestões, consultas públicas e petições dos cidadãos
          </p>
        </div>
        <AdminBreadcrumbs />
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Sugestões</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.totalSugestoes}</div>
            <p className="text-xs text-muted-foreground">
              {estatisticas.sugestoesPorStatus.em_analise || 0} em análise
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consultas Ativas</CardTitle>
            <Vote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.consultasAtivas}</div>
            <p className="text-xs text-muted-foreground">
              {estatisticas.totalConsultas} total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Petições Ativas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.peticoesAtivas}</div>
            <p className="text-xs text-muted-foreground">
              {estatisticas.totalPeticoes} total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participantes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.totalParticipantes}</div>
            <p className="text-xs text-muted-foreground">
              Cidadãos engajados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Pesquisa */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar sugestões, consultas e petições..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs defaultValue="sugestoes" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sugestoes" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Sugestões ({estatisticas.totalSugestoes})
          </TabsTrigger>
          <TabsTrigger value="consultas" className="flex items-center gap-2">
            <Vote className="h-4 w-4" />
            Consultas ({estatisticas.totalConsultas})
          </TabsTrigger>
          <TabsTrigger value="peticoes" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Petições ({estatisticas.totalPeticoes})
          </TabsTrigger>
        </TabsList>

        {/* Sugestões Cidadãs */}
        <TabsContent value="sugestoes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Sugestões Cidadãs
              </CardTitle>
              <CardDescription>
                Gerencie as sugestões enviadas pelos cidadãos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Autor</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Votos</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sugestoes.map((sugestao) => (
                    <TableRow key={sugestao.id}>
                      <TableCell>
                        <div className="font-medium">{sugestao.titulo}</div>
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {sugestao.descricao}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{sugestao.autor.nome}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {sugestao.autor.email}
                          </div>
                          {sugestao.autor.telefone && (
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {sugestao.autor.telefone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{sugestao.categoria}</Badge>
                      </TableCell>
                      <TableCell>{getPrioridadeBadge(sugestao.prioridade)}</TableCell>
                      <TableCell>{getStatusBadge(sugestao.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                          {sugestao.votos}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(sugestao.dataCriacao, 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Select
                            value={sugestao.status}
                            onValueChange={(value: any) => handleUpdateStatusSugestao(sugestao.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pendente">Pendente</SelectItem>
                              <SelectItem value="em_analise">Em Análise</SelectItem>
                              <SelectItem value="aceita">Aceita</SelectItem>
                              <SelectItem value="rejeitada">Rejeitada</SelectItem>
                              <SelectItem value="implementada">Implementada</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSugestaoSelecionada(sugestao)
                              setModalRespostaOpen(true)
                            }}
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Consultas Públicas */}
        <TabsContent value="consultas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Vote className="h-5 w-5" />
                Consultas Públicas
              </CardTitle>
              <CardDescription>
                Gerencie as consultas públicas e seus resultados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {consultas.map((consulta) => (
                  <Card key={consulta.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>{consulta.titulo}</CardTitle>
                          <CardDescription>{consulta.descricao}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={consulta.status === 'ativa' ? 'default' : 'secondary'}>
                            {consulta.status}
                          </Badge>
                          {consulta.status === 'ativa' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleFinalizarConsulta(consulta.id)}
                            >
                              Finalizar
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(consulta.dataInicio, 'dd/MM/yyyy', { locale: ptBR })} - 
                            {format(consulta.dataFim, 'dd/MM/yyyy', { locale: ptBR })}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {consulta.participantes} participantes
                          </div>
                          <div className="flex items-center gap-1">
                            <BarChart3 className="h-4 w-4" />
                            {consulta.tipo}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Resultados:</Label>
                          <div className="grid grid-cols-2 gap-2">
                            {consulta.opcoes.map((opcao) => {
                              const percentual = consulta.participantes > 0 
                                ? ((opcao.votos / consulta.participantes) * 100).toFixed(1)
                                : '0.0'
                              
                              return (
                                <div key={opcao.id} className="space-y-1">
                                  <div className="flex justify-between text-sm">
                                    <span>{opcao.texto}</span>
                                    <span>{opcao.votos} votos ({percentual}%)</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-blue-600 h-2 rounded-full" 
                                      style={{ width: `${percentual}%` }}
                                    ></div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        {consulta.resultado && (
                          <div className="mt-4 p-4 bg-muted rounded-lg">
                            <h4 className="font-medium mb-2">Resultado Final:</h4>
                            <p className="text-sm text-muted-foreground">
                              {consulta.resultado.analise}
                            </p>
                            {consulta.resultado.recomendacoes && (
                              <div className="mt-2">
                                <h5 className="font-medium text-sm">Recomendações:</h5>
                                <ul className="text-sm text-muted-foreground list-disc list-inside">
                                  {consulta.resultado.recomendacoes.map((rec, index) => (
                                    <li key={index}>{rec}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}

                        {consulta.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {consulta.tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Petições */}
        <TabsContent value="peticoes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Petições
              </CardTitle>
              <CardDescription>
                Gerencie as petições criadas pelos cidadãos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Autor</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assinaturas</TableHead>
                    <TableHead>Progresso</TableHead>
                    <TableHead>Data Fim</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {peticoes.map((peticao) => (
                    <TableRow key={peticao.id}>
                      <TableCell>
                        <div className="font-medium">{peticao.titulo}</div>
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {peticao.objetivo}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{peticao.autor.nome}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {peticao.autor.email}
                          </div>
                          {peticao.autor.telefone && (
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {peticao.autor.telefone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{peticao.categoria}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={peticao.status === 'ativa' ? 'default' : 'secondary'}>
                          {peticao.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          {peticao.assinaturas.length}/{peticao.metaAssinaturas}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ 
                              width: `${Math.min((peticao.assinaturas.length / peticao.metaAssinaturas) * 100, 100)}%` 
                            }}
                          ></div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(peticao.dataFim, 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Resposta */}
      <Dialog open={modalRespostaOpen} onOpenChange={setModalRespostaOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Responder Sugestão</DialogTitle>
            <DialogDescription>
              Envie uma resposta oficial para a sugestão do cidadão
            </DialogDescription>
          </DialogHeader>
          {sugestaoSelecionada && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">{sugestaoSelecionada.titulo}</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  {sugestaoSelecionada.descricao}
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {sugestaoSelecionada.autor.nome}
                  </div>
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {sugestaoSelecionada.autor.email}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(sugestaoSelecionada.dataCriacao, 'dd/MM/yyyy', { locale: ptBR })}
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="resposta">Resposta Oficial</Label>
                <Textarea
                  id="resposta"
                  rows={6}
                  value={respostaOficial}
                  onChange={(e) => setRespostaOficial(e.target.value)}
                  placeholder="Digite a resposta oficial para esta sugestão..."
                />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModalRespostaOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleResponderSugestao}>
              Enviar Resposta
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
