'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { 
  Lightbulb, 
  Vote, 
  FileText, 
  MessageSquare, 
  Plus, 
  Search, 
  Eye, 
  ThumbsUp,
  MessageCircle,
  Calendar,
  User,
  TrendingUp,
  Users,
  Activity,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { participacaoCidadaService, SugestaoCidada, ConsultaPublica, Peticao } from '@/lib/participacao-cidada-service'

export default function ParticipacaoCidadaPage() {
  const [sugestoes, setSugestoes] = useState<SugestaoCidada[]>([])
  const [consultas, setConsultas] = useState<ConsultaPublica[]>([])
  const [peticoes, setPeticoes] = useState<Peticao[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Estados para modais
  const [modalSugestaoOpen, setModalSugestaoOpen] = useState(false)
  const [modalConsultaOpen, setModalConsultaOpen] = useState(false)
  const [modalPeticaoOpen, setModalPeticaoOpen] = useState(false)

  // Estados para formulários
  const [novaSugestao, setNovaSugestao] = useState({
    titulo: '',
    descricao: '',
    categoria: '',
    autor: {
      nome: '',
      email: '',
      telefone: ''
    }
  })

  const [novaConsulta, setNovaConsulta] = useState({
    titulo: '',
    descricao: '',
    tipo: 'pesquisa' as const,
    dataInicio: '',
    dataFim: '',
    opcoes: [{ texto: '' }],
    tags: '',
    moderador: 'Administrador'
  })

  const [novaPeticao, setNovaPeticao] = useState({
    titulo: '',
    descricao: '',
    objetivo: '',
    metaAssinaturas: 100,
    categoria: '',
    autor: {
      nome: '',
      email: '',
      telefone: ''
    },
    dataFim: ''
  })

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

  const handleCreateSugestao = async () => {
    if (!novaSugestao.titulo || !novaSugestao.descricao || !novaSugestao.categoria) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    try {
      participacaoCidadaService.createSugestao({
        titulo: novaSugestao.titulo,
        descricao: novaSugestao.descricao,
        categoria: novaSugestao.categoria,
        autor: novaSugestao.autor,
        status: 'pendente',
        prioridade: 'media'
      })
      
      setSugestoes(participacaoCidadaService.getAllSugestoes())
      setNovaSugestao({
        titulo: '',
        descricao: '',
        categoria: '',
        autor: { nome: '', email: '', telefone: '' }
      })
      setModalSugestaoOpen(false)
      toast.success('Sugestão enviada com sucesso!')
    } catch (error) {
      console.error('Erro ao criar sugestão:', error)
      toast.error('Erro ao enviar sugestão')
    }
  }

  const handleCreateConsulta = async () => {
    if (!novaConsulta.titulo || !novaConsulta.descricao) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    try {
      participacaoCidadaService.createConsulta({
        titulo: novaConsulta.titulo,
        descricao: novaConsulta.descricao,
        tipo: novaConsulta.tipo,
        status: 'ativa',
        dataInicio: new Date(novaConsulta.dataInicio),
        dataFim: new Date(novaConsulta.dataFim),
        opcoes: novaConsulta.opcoes.filter(o => o.texto.trim() !== '').map((o, index) => ({
          id: (index + 1).toString(),
          texto: o.texto,
          votos: 0
        })),
        moderador: novaConsulta.moderador,
        tags: novaConsulta.tags.split(',').map(t => t.trim()).filter(t => t !== ''),
        publico: true
      })
      
      setConsultas(participacaoCidadaService.getAllConsultas())
      setNovaConsulta({
        titulo: '',
        descricao: '',
        tipo: 'pesquisa',
        dataInicio: '',
        dataFim: '',
        opcoes: [{ texto: '' }],
        tags: '',
        moderador: 'Administrador'
      })
      setModalConsultaOpen(false)
      toast.success('Consulta pública criada com sucesso!')
    } catch (error) {
      console.error('Erro ao criar consulta:', error)
      toast.error('Erro ao criar consulta pública')
    }
  }

  const handleCreatePeticao = async () => {
    if (!novaPeticao.titulo || !novaPeticao.descricao || !novaPeticao.objetivo) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    try {
      participacaoCidadaService.createPeticao({
        titulo: novaPeticao.titulo,
        descricao: novaPeticao.descricao,
        objetivo: novaPeticao.objetivo,
        metaAssinaturas: novaPeticao.metaAssinaturas,
        status: 'ativa',
        categoria: novaPeticao.categoria,
        autor: novaPeticao.autor,
        dataFim: new Date(novaPeticao.dataFim),
        aprovada: true
      })
      
      setPeticoes(participacaoCidadaService.getAllPeticoes())
      setNovaPeticao({
        titulo: '',
        descricao: '',
        objetivo: '',
        metaAssinaturas: 100,
        categoria: '',
        autor: { nome: '', email: '', telefone: '' },
        dataFim: ''
      })
      setModalPeticaoOpen(false)
      toast.success('Petição criada com sucesso!')
    } catch (error) {
      console.error('Erro ao criar petição:', error)
      toast.error('Erro ao criar petição')
    }
  }

  const handleVotarSugestao = (id: string) => {
    try {
      const sucesso = participacaoCidadaService.votarSugestao(id)
      if (sucesso) {
        setSugestoes(participacaoCidadaService.getAllSugestoes())
        toast.success('Voto registrado com sucesso!')
      }
    } catch (error) {
      console.error('Erro ao votar:', error)
      toast.error('Erro ao registrar voto')
    }
  }

  const handleVotarConsulta = (consultaId: string, opcaoId: string) => {
    try {
      const sucesso = participacaoCidadaService.votarConsulta(consultaId, opcaoId)
      if (sucesso) {
        setConsultas(participacaoCidadaService.getAllConsultas())
        toast.success('Voto registrado com sucesso!')
      }
    } catch (error) {
      console.error('Erro ao votar:', error)
      toast.error('Erro ao registrar voto')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pendente: { variant: 'secondary' as const, icon: Clock, text: 'Pendente' },
      em_analise: { variant: 'default' as const, icon: Activity, text: 'Em Análise' },
      aceita: { variant: 'default' as const, icon: CheckCircle, text: 'Aceita' },
      rejeitada: { variant: 'destructive' as const, icon: AlertCircle, text: 'Rejeitada' },
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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-center mb-4">Participação Cidadã</h1>
        <p className="text-xl text-center text-muted-foreground">
          Sua voz importa! Participe das decisões da Câmara Municipal
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sugestões</CardTitle>
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
              Participe agora!
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
              Assine e apoie!
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
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar sugestões, consultas e petições..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs defaultValue="sugestoes" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sugestoes" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Sugestões
          </TabsTrigger>
          <TabsTrigger value="consultas" className="flex items-center gap-2">
            <Vote className="h-4 w-4" />
            Consultas Públicas
          </TabsTrigger>
          <TabsTrigger value="peticoes" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Petições
          </TabsTrigger>
        </TabsList>

        {/* Sugestões Cidadãs */}
        <TabsContent value="sugestoes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Sugestões Cidadãs
                  </CardTitle>
                  <CardDescription>
                    Envie suas sugestões e ideias para melhorar nossa cidade
                  </CardDescription>
                </div>
                <Dialog open={modalSugestaoOpen} onOpenChange={setModalSugestaoOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Nova Sugestão
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Nova Sugestão</DialogTitle>
                      <DialogDescription>
                        Compartilhe sua ideia para melhorar nossa cidade
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="titulo">Título da Sugestão</Label>
                        <Input
                          id="titulo"
                          value={novaSugestao.titulo}
                          onChange={(e) => setNovaSugestao(prev => ({ ...prev, titulo: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="categoria">Categoria</Label>
                        <Select
                          value={novaSugestao.categoria}
                          onValueChange={(value) => setNovaSugestao(prev => ({ ...prev, categoria: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Infraestrutura">Infraestrutura</SelectItem>
                            <SelectItem value="Mobilidade">Mobilidade</SelectItem>
                            <SelectItem value="Saúde">Saúde</SelectItem>
                            <SelectItem value="Educação">Educação</SelectItem>
                            <SelectItem value="Meio Ambiente">Meio Ambiente</SelectItem>
                            <SelectItem value="Segurança">Segurança</SelectItem>
                            <SelectItem value="Cultura">Cultura</SelectItem>
                            <SelectItem value="Esporte">Esporte</SelectItem>
                            <SelectItem value="Outros">Outros</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="descricao">Descrição</Label>
                        <Textarea
                          id="descricao"
                          rows={4}
                          value={novaSugestao.descricao}
                          onChange={(e) => setNovaSugestao(prev => ({ ...prev, descricao: e.target.value }))}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="nome">Seu Nome</Label>
                          <Input
                            id="nome"
                            value={novaSugestao.autor.nome}
                            onChange={(e) => setNovaSugestao(prev => ({ 
                              ...prev, 
                              autor: { ...prev.autor, nome: e.target.value } 
                            }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">E-mail</Label>
                          <Input
                            id="email"
                            type="email"
                            value={novaSugestao.autor.email}
                            onChange={(e) => setNovaSugestao(prev => ({ 
                              ...prev, 
                              autor: { ...prev.autor, email: e.target.value } 
                            }))}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="telefone">Telefone (opcional)</Label>
                        <Input
                          id="telefone"
                          value={novaSugestao.autor.telefone}
                          onChange={(e) => setNovaSugestao(prev => ({ 
                              ...prev, 
                              autor: { ...prev.autor, telefone: e.target.value } 
                            }))}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setModalSugestaoOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleCreateSugestao}>
                        Enviar Sugestão
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Autor</TableHead>
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
                        <Badge variant="outline">{sugestao.categoria}</Badge>
                      </TableCell>
                      <TableCell>{sugestao.autor.nome}</TableCell>
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
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleVotarSugestao(sugestao.id)}
                          >
                            <ThumbsUp className="h-4 w-4" />
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Vote className="h-5 w-5" />
                    Consultas Públicas
                  </CardTitle>
                  <CardDescription>
                    Participe das consultas e ajude a definir as prioridades
                  </CardDescription>
                </div>
                <Dialog open={modalConsultaOpen} onOpenChange={setModalConsultaOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Nova Consulta
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Nova Consulta Pública</DialogTitle>
                      <DialogDescription>
                        Crie uma nova consulta para ouvir a opinião dos cidadãos
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="tituloConsulta">Título</Label>
                        <Input
                          id="tituloConsulta"
                          value={novaConsulta.titulo}
                          onChange={(e) => setNovaConsulta(prev => ({ ...prev, titulo: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="descricaoConsulta">Descrição</Label>
                        <Textarea
                          id="descricaoConsulta"
                          rows={3}
                          value={novaConsulta.descricao}
                          onChange={(e) => setNovaConsulta(prev => ({ ...prev, descricao: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="tipoConsulta">Tipo</Label>
                        <Select
                          value={novaConsulta.tipo}
                          onValueChange={(value: any) => setNovaConsulta(prev => ({ ...prev, tipo: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pesquisa">Pesquisa</SelectItem>
                            <SelectItem value="enquete">Enquete</SelectItem>
                            <SelectItem value="debate">Debate</SelectItem>
                            <SelectItem value="consulta">Consulta</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="dataInicio">Data Início</Label>
                          <Input
                            id="dataInicio"
                            type="date"
                            value={novaConsulta.dataInicio}
                            onChange={(e) => setNovaConsulta(prev => ({ ...prev, dataInicio: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="dataFim">Data Fim</Label>
                          <Input
                            id="dataFim"
                            type="date"
                            value={novaConsulta.dataFim}
                            onChange={(e) => setNovaConsulta(prev => ({ ...prev, dataFim: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Opções de Resposta</Label>
                        {novaConsulta.opcoes.map((opcao, index) => (
                          <div key={index} className="flex gap-2 mb-2">
                            <Input
                              placeholder={`Opção ${index + 1}`}
                              value={opcao.texto}
                              onChange={(e) => {
                                const novasOpcoes = [...novaConsulta.opcoes]
                                novasOpcoes[index].texto = e.target.value
                                setNovaConsulta(prev => ({ ...prev, opcoes: novasOpcoes }))
                              }}
                            />
                            {novaConsulta.opcoes.length > 1 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const novasOpcoes = novaConsulta.opcoes.filter((_, i) => i !== index)
                                  setNovaConsulta(prev => ({ ...prev, opcoes: novasOpcoes }))
                                }}
                              >
                                Remover
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setNovaConsulta(prev => ({ 
                            ...prev, 
                            opcoes: [...prev.opcoes, { texto: '' }] 
                          }))}
                        >
                          Adicionar Opção
                        </Button>
                      </div>
                      <div>
                        <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                        <Input
                          id="tags"
                          placeholder="orçamento, 2025, prioridades"
                          value={novaConsulta.tags}
                          onChange={(e) => setNovaConsulta(prev => ({ ...prev, tags: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setModalConsultaOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleCreateConsulta}>
                        Criar Consulta
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
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
                        <Badge variant={consulta.status === 'ativa' ? 'default' : 'secondary'}>
                          {consulta.status}
                        </Badge>
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
                        </div>
                        
                        {consulta.status === 'ativa' && (
                          <div className="space-y-2">
                            <Label>Suas opções:</Label>
                            <div className="grid grid-cols-2 gap-2">
                              {consulta.opcoes.map((opcao) => (
                                <Button
                                  key={opcao.id}
                                  variant="outline"
                                  onClick={() => handleVotarConsulta(consulta.id, opcao.id)}
                                  className="justify-start"
                                >
                                  {opcao.texto} ({opcao.votos} votos)
                                </Button>
                              ))}
                            </div>
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Petições
                  </CardTitle>
                  <CardDescription>
                    Apoie causas importantes para nossa comunidade
                  </CardDescription>
                </div>
                <Dialog open={modalPeticaoOpen} onOpenChange={setModalPeticaoOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Nova Petição
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Nova Petição</DialogTitle>
                      <DialogDescription>
                        Crie uma petição para mobilizar apoio da comunidade
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="tituloPeticao">Título</Label>
                        <Input
                          id="tituloPeticao"
                          value={novaPeticao.titulo}
                          onChange={(e) => setNovaPeticao(prev => ({ ...prev, titulo: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="objetivo">Objetivo</Label>
                        <Input
                          id="objetivo"
                          value={novaPeticao.objetivo}
                          onChange={(e) => setNovaPeticao(prev => ({ ...prev, objetivo: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="descricaoPeticao">Descrição</Label>
                        <Textarea
                          id="descricaoPeticao"
                          rows={4}
                          value={novaPeticao.descricao}
                          onChange={(e) => setNovaPeticao(prev => ({ ...prev, descricao: e.target.value }))}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="categoriaPeticao">Categoria</Label>
                          <Select
                            value={novaPeticao.categoria}
                            onValueChange={(value) => setNovaPeticao(prev => ({ ...prev, categoria: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma categoria" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Infraestrutura">Infraestrutura</SelectItem>
                              <SelectItem value="Mobilidade">Mobilidade</SelectItem>
                              <SelectItem value="Saúde">Saúde</SelectItem>
                              <SelectItem value="Educação">Educação</SelectItem>
                              <SelectItem value="Meio Ambiente">Meio Ambiente</SelectItem>
                              <SelectItem value="Segurança">Segurança</SelectItem>
                              <SelectItem value="Cultura">Cultura</SelectItem>
                              <SelectItem value="Esporte">Esporte</SelectItem>
                              <SelectItem value="Outros">Outros</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="metaAssinaturas">Meta de Assinaturas</Label>
                          <Input
                            id="metaAssinaturas"
                            type="number"
                            min="10"
                            value={novaPeticao.metaAssinaturas}
                            onChange={(e) => setNovaPeticao(prev => ({ 
                              ...prev, 
                              metaAssinaturas: parseInt(e.target.value) 
                            }))}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="nomeAutor">Seu Nome</Label>
                          <Input
                            id="nomeAutor"
                            value={novaPeticao.autor.nome}
                            onChange={(e) => setNovaPeticao(prev => ({ 
                              ...prev, 
                              autor: { ...prev.autor, nome: e.target.value } 
                            }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="emailAutor">E-mail</Label>
                          <Input
                            id="emailAutor"
                            type="email"
                            value={novaPeticao.autor.email}
                            onChange={(e) => setNovaPeticao(prev => ({ 
                              ...prev, 
                              autor: { ...prev.autor, email: e.target.value } 
                            }))}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="dataFimPeticao">Data de Encerramento</Label>
                        <Input
                          id="dataFimPeticao"
                          type="date"
                          value={novaPeticao.dataFim}
                          onChange={(e) => setNovaPeticao(prev => ({ ...prev, dataFim: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setModalPeticaoOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleCreatePeticao}>
                        Criar Petição
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {peticoes.map((peticao) => (
                  <Card key={peticao.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>{peticao.titulo}</CardTitle>
                          <CardDescription>{peticao.objetivo}</CardDescription>
                        </div>
                        <Badge variant={peticao.status === 'ativa' ? 'default' : 'secondary'}>
                          {peticao.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">{peticao.descricao}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Encerra em {format(peticao.dataFim, 'dd/MM/yyyy', { locale: ptBR })}
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            Por {peticao.autor.nome}
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            {peticao.assinaturas.length}/{peticao.metaAssinaturas} assinaturas
                          </div>
                        </div>

                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ 
                              width: `${Math.min((peticao.assinaturas.length / peticao.metaAssinaturas) * 100, 100)}%` 
                            }}
                          ></div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button size="sm">
                            Assinar Petição
                          </Button>
                          <Button variant="outline" size="sm">
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalhes
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}