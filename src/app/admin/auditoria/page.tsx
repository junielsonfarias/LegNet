'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminBreadcrumbs } from '@/components/admin/admin-breadcrumbs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toast } from 'sonner'
import { 
  RefreshCw, 
  Download, 
  Search, 
  Eye, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar as CalendarIcon,
  Filter,
  BarChart3,
  FileText,
  Clock,
  User,
  Activity
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { auditoriaService, EventoAuditoria, RelatorioAuditoria, EstatisticaAuditoria, FiltroAuditoria } from '@/lib/auditoria-service'

export default function AuditoriaPage() {
  const [eventos, setEventos] = useState<EventoAuditoria[]>([])
  const [relatorios, setRelatorios] = useState<RelatorioAuditoria[]>([])
  const [estatisticas, setEstatisticas] = useState<EstatisticaAuditoria | null>(null)
  const [loading, setLoading] = useState(true)
  const [eventoSelecionado, setEventoSelecionado] = useState<EventoAuditoria | null>(null)
  const [modalDetalhesOpen, setModalDetalhesOpen] = useState(false)

  // Filtros
  const [filtros, setFiltros] = useState<FiltroAuditoria>({})
  const [dataInicio, setDataInicio] = useState<Date>()
  const [dataFim, setDataFim] = useState<Date>()

  // Estados para relatórios
  const [novoRelatorio, setNovoRelatorio] = useState({
    nome: '',
    descricao: ''
  })

  const loadData = useCallback(() => {
    try {
      const eventosData = auditoriaService.getAllEventos()
      const relatoriosData = auditoriaService.getAllRelatorios()
      const estatisticasData = auditoriaService.gerarEstatisticas(filtros)
      
      setEventos(eventosData)
      setRelatorios(relatoriosData)
      setEstatisticas(estatisticasData)
    } catch (error) {
      console.error('Erro ao carregar dados de auditoria:', error)
      toast.error('Erro ao carregar dados de auditoria')
    } finally {
      setLoading(false)
    }
  }, [filtros])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (dataInicio || dataFim) {
      setFiltros(prev => ({
        ...prev,
        dataInicio,
        dataFim
      }))
    }
  }, [dataInicio, dataFim])

  const aplicarFiltros = () => {
    try {
      const eventosFiltrados = auditoriaService.getEventos(filtros)
      const estatisticasAtualizadas = auditoriaService.gerarEstatisticas(filtros)
      
      setEventos(eventosFiltrados)
      setEstatisticas(estatisticasAtualizadas)
    } catch (error) {
      console.error('Erro ao aplicar filtros:', error)
      toast.error('Erro ao aplicar filtros')
    }
  }

  const limparFiltros = () => {
    setFiltros({})
    setDataInicio(undefined)
    setDataFim(undefined)
  }

  const criarRelatorio = async () => {
    if (!novoRelatorio.nome || !novoRelatorio.descricao) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    try {
      const relatorio = auditoriaService.criarRelatorio(
        novoRelatorio.nome,
        novoRelatorio.descricao,
        filtros,
        'Administrador'
      )
      
      setRelatorios(auditoriaService.getAllRelatorios())
      setNovoRelatorio({ nome: '', descricao: '' })
      toast.success('Relatório criado com sucesso!')
    } catch (error) {
      console.error('Erro ao criar relatório:', error)
      toast.error('Erro ao criar relatório')
    }
  }

  const exportarEventos = (formato: 'json' | 'csv') => {
    try {
      const dados = auditoriaService.exportarEventos(filtros, formato)
      const blob = new Blob([dados], { 
        type: formato === 'csv' ? 'text/csv' : 'application/json' 
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `auditoria_${new Date().toISOString().split('T')[0]}.${formato}`
      link.click()
      URL.revokeObjectURL(url)
      toast.success(`Exportação ${formato.toUpperCase()} realizada com sucesso!`)
    } catch (error) {
      console.error('Erro ao exportar eventos:', error)
      toast.error('Erro ao exportar eventos')
    }
  }

  const verDetalhesEvento = (evento: EventoAuditoria) => {
    setEventoSelecionado(evento)
    setModalDetalhesOpen(true)
  }

  const detectarAtividadeSuspeita = () => {
    try {
      const atividadeSuspeita = auditoriaService.detectarAtividadeSuspeita()
      if (atividadeSuspeita.length > 0) {
        toast.warning(`${atividadeSuspeita.length} eventos suspeitos detectados!`)
        setEventos(atividadeSuspeita)
      } else {
        toast.success('Nenhuma atividade suspeita detectada')
      }
    } catch (error) {
      console.error('Erro ao detectar atividade suspeita:', error)
      toast.error('Erro ao detectar atividade suspeita')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Carregando dados de auditoria...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Auditoria do Sistema</h1>
          <p className="text-muted-foreground">
            Monitore e analise todas as atividades do sistema
          </p>
        </div>
        <AdminBreadcrumbs />
      </div>

      {/* Estatísticas Resumidas */}
      {estatisticas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estatisticas.totalEventos}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eventos com Erro</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{estatisticas.eventosComErro}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estatisticas.usuariosAtivos.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Período</CardTitle>
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                {format(estatisticas.periodo.inicio, 'dd/MM/yyyy', { locale: ptBR })} - 
                {format(estatisticas.periodo.fim, 'dd/MM/yyyy', { locale: ptBR })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="eventos" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="eventos" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Eventos
          </TabsTrigger>
          <TabsTrigger value="relatorios" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Relatórios
          </TabsTrigger>
          <TabsTrigger value="estatisticas" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Estatísticas
          </TabsTrigger>
        </TabsList>

        {/* Eventos de Auditoria */}
        <TabsContent value="eventos" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Eventos de Auditoria
                  </CardTitle>
                  <CardDescription>
                    Histórico de todas as ações realizadas no sistema
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={detectarAtividadeSuspeita}>
                    <Shield className="mr-2 h-4 w-4" />
                    Detectar Suspeitos
                  </Button>
                  <Button variant="outline" onClick={() => exportarEventos('csv')}>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar CSV
                  </Button>
                  <Button variant="outline" onClick={() => exportarEventos('json')}>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar JSON
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filtros */}
              <div className="mb-6 p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="h-4 w-4" />
                  <span className="font-medium">Filtros</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label>Data Início</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dataInicio ? format(dataInicio, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar data'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dataInicio}
                          onSelect={setDataInicio}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label>Data Fim</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dataFim ? format(dataFim, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar data'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dataFim}
                          onSelect={setDataFim}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label>Ação</Label>
                    <Select
                      value={filtros.acao || ''}
                      onValueChange={(value) => setFiltros(prev => ({ ...prev, acao: value || undefined }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todas as ações" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as ações</SelectItem>
                        <SelectItem value="LOGIN">Login</SelectItem>
                        <SelectItem value="LOGOUT">Logout</SelectItem>
                        <SelectItem value="CRIAR">Criar</SelectItem>
                        <SelectItem value="ATUALIZAR">Atualizar</SelectItem>
                        <SelectItem value="DELETAR">Deletar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Entidade</Label>
                    <Select
                      value={filtros.entidade || ''}
                      onValueChange={(value) => setFiltros(prev => ({ ...prev, entidade: value || undefined }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todas as entidades" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as entidades</SelectItem>
                        <SelectItem value="USUARIO">Usuário</SelectItem>
                        <SelectItem value="PROPOSICAO">Proposição</SelectItem>
                        <SelectItem value="NOTICIA">Notícia</SelectItem>
                        <SelectItem value="PUBLICACAO">Publicação</SelectItem>
                        <SelectItem value="LICITACAO">Licitação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Button onClick={aplicarFiltros}>
                    <Search className="mr-2 h-4 w-4" />
                    Aplicar Filtros
                  </Button>
                  <Button variant="outline" onClick={limparFiltros}>
                    Limpar Filtros
                  </Button>
                </div>
              </div>

              {/* Tabela de Eventos */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Entidade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eventos.map((evento) => (
                    <TableRow key={evento.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {format(evento.timestamp, 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {evento.usuarioNome}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{evento.acao}</Badge>
                      </TableCell>
                      <TableCell>{evento.entidade}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {evento.sucesso ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-green-600">Sucesso</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 text-red-500" />
                              <span className="text-red-600">Erro</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{evento.ip || '-'}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => verDetalhesEvento(evento)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Relatórios */}
        <TabsContent value="relatorios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Relatórios de Auditoria
              </CardTitle>
              <CardDescription>
                Gerencie relatórios personalizados de auditoria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Nome do relatório"
                    value={novoRelatorio.nome}
                    onChange={(e) => setNovoRelatorio(prev => ({ ...prev, nome: e.target.value }))}
                  />
                  <Input
                    placeholder="Descrição"
                    value={novoRelatorio.descricao}
                    onChange={(e) => setNovoRelatorio(prev => ({ ...prev, descricao: e.target.value }))}
                  />
                  <Button onClick={criarRelatorio}>
                    <FileText className="mr-2 h-4 w-4" />
                    Criar Relatório
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Gerado em</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {relatorios.map((relatorio) => (
                      <TableRow key={relatorio.id}>
                        <TableCell className="font-medium">{relatorio.nome}</TableCell>
                        <TableCell>{relatorio.descricao}</TableCell>
                        <TableCell>
                          {format(relatorio.geradoEm, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            relatorio.status === 'concluido' ? 'default' :
                            relatorio.status === 'processando' ? 'secondary' :
                            relatorio.status === 'erro' ? 'destructive' : 'outline'
                          }>
                            {relatorio.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Estatísticas */}
        <TabsContent value="estatisticas" className="space-y-4">
          {estatisticas && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Eventos por Ação</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(estatisticas.eventosPorAcao).map(([acao, count]) => (
                      <div key={acao} className="flex justify-between items-center">
                        <span>{acao}</span>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Eventos por Usuário</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(estatisticas.eventosPorUsuario).map(([usuario, count]) => (
                      <div key={usuario} className="flex justify-between items-center">
                        <span>{usuario}</span>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Eventos por Entidade</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(estatisticas.eventosPorEntidade).map(([entidade, count]) => (
                      <div key={entidade} className="flex justify-between items-center">
                        <span>{entidade}</span>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Usuários Ativos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {estatisticas.usuariosAtivos.map((usuario) => (
                      <div key={usuario} className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{usuario}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de Detalhes do Evento */}
      <Dialog open={modalDetalhesOpen} onOpenChange={setModalDetalhesOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Evento</DialogTitle>
            <DialogDescription>
              Informações completas sobre o evento de auditoria
            </DialogDescription>
          </DialogHeader>
          {eventoSelecionado && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>ID do Evento</Label>
                  <p className="text-sm font-mono">{eventoSelecionado.id}</p>
                </div>
                <div>
                  <Label>Data/Hora</Label>
                  <p className="text-sm">
                    {format(eventoSelecionado.timestamp, 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <Label>Usuário</Label>
                  <p className="text-sm">{eventoSelecionado.usuarioNome}</p>
                </div>
                <div>
                  <Label>Ação</Label>
                  <p className="text-sm">{eventoSelecionado.acao}</p>
                </div>
                <div>
                  <Label>Entidade</Label>
                  <p className="text-sm">{eventoSelecionado.entidade}</p>
                </div>
                <div>
                  <Label>ID da Entidade</Label>
                  <p className="text-sm font-mono">{eventoSelecionado.entidadeId}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="flex items-center gap-2">
                    {eventoSelecionado.sucesso ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-green-600">Sucesso</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-red-600">Erro</span>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <Label>IP</Label>
                  <p className="text-sm">{eventoSelecionado.ip || 'Não informado'}</p>
                </div>
              </div>

              {eventoSelecionado.erro && (
                <div>
                  <Label>Erro</Label>
                  <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    {eventoSelecionado.erro}
                  </p>
                </div>
              )}

              {eventoSelecionado.dadosAnteriores && (
                <div>
                  <Label>Dados Anteriores</Label>
                  <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
                    {JSON.stringify(eventoSelecionado.dadosAnteriores, null, 2)}
                  </pre>
                </div>
              )}

              {eventoSelecionado.dadosNovos && (
                <div>
                  <Label>Dados Novos</Label>
                  <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
                    {JSON.stringify(eventoSelecionado.dadosNovos, null, 2)}
                  </pre>
                </div>
              )}

              {eventoSelecionado.detalhes && (
                <div>
                  <Label>Detalhes</Label>
                  <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
                    {JSON.stringify(eventoSelecionado.detalhes, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
