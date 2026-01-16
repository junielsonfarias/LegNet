'use client'

import { useState, useEffect } from 'react'
import { AdminBreadcrumbs } from '@/components/admin/admin-breadcrumbs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { 
  Save, 
  RefreshCw, 
  Plus, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  Settings, 
  Mail, 
  Calendar,
  Zap,
  Clock,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react'
import { automacaoService, RegraAutomacao, TemplateEmail, AgendamentoPauta } from '@/lib/automacao-service'

export default function AutomacaoPage() {
  const [regras, setRegras] = useState<RegraAutomacao[]>([])
  const [templates, setTemplates] = useState<TemplateEmail[]>([])
  const [agendamentos, setAgendamentos] = useState<AgendamentoPauta[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Estados para formulários
  const [novaRegra, setNovaRegra] = useState<Partial<RegraAutomacao>>({})
  const [novoTemplate, setNovoTemplate] = useState<Partial<TemplateEmail>>({})
  const [novoAgendamento, setNovoAgendamento] = useState<Partial<AgendamentoPauta>>({})

  // Estados para modais
  const [modalRegraOpen, setModalRegraOpen] = useState(false)
  const [modalTemplateOpen, setModalTemplateOpen] = useState(false)
  const [modalAgendamentoOpen, setModalAgendamentoOpen] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    try {
      setRegras(automacaoService.getAllRegras())
      setTemplates(automacaoService.getAllTemplatesEmail())
      setAgendamentos(automacaoService.getAllAgendamentosPauta())
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados de automação')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRegra = async () => {
    if (!novaRegra.nome || !novaRegra.tipo) {
      toast.error('Preencha os campos obrigatórios')
      return
    }

    setSaving(true)
    try {
      const regra = automacaoService.createRegra({
        nome: novaRegra.nome!,
        descricao: novaRegra.descricao || '',
        tipo: novaRegra.tipo!,
        ativa: novaRegra.ativa || true,
        condicoes: novaRegra.condicoes || [],
        acoes: novaRegra.acoes || [],
        prioridade: novaRegra.prioridade || 1
      })
      
      setRegras(automacaoService.getAllRegras())
      setNovaRegra({})
      setModalRegraOpen(false)
      toast.success('Regra criada com sucesso!')
    } catch (error) {
      console.error('Erro ao criar regra:', error)
      toast.error('Erro ao criar regra')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateTemplate = async () => {
    if (!novoTemplate.nome || !novoTemplate.assunto) {
      toast.error('Preencha os campos obrigatórios')
      return
    }

    setSaving(true)
    try {
      const template = automacaoService.createTemplateEmail({
        nome: novoTemplate.nome!,
        assunto: novoTemplate.assunto!,
        conteudo: novoTemplate.conteudo || '',
        variaveis: novoTemplate.variaveis || [],
        ativo: novoTemplate.ativo !== false
      })
      
      setTemplates(automacaoService.getAllTemplatesEmail())
      setNovoTemplate({})
      setModalTemplateOpen(false)
      toast.success('Template criado com sucesso!')
    } catch (error) {
      console.error('Erro ao criar template:', error)
      toast.error('Erro ao criar template')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateAgendamento = async () => {
    if (!novoAgendamento.nome || !novoAgendamento.tipo) {
      toast.error('Preencha os campos obrigatórios')
      return
    }

    setSaving(true)
    try {
      const agendamento = automacaoService.createAgendamentoPauta({
        nome: novoAgendamento.nome!,
        tipo: novoAgendamento.tipo!,
        configuracao: novoAgendamento.configuracao || {},
        ativo: novoAgendamento.ativo !== false,
        proximaExecucao: novoAgendamento.proximaExecucao || new Date()
      })
      
      setAgendamentos(automacaoService.getAllAgendamentosPauta())
      setNovoAgendamento({})
      setModalAgendamentoOpen(false)
      toast.success('Agendamento criado com sucesso!')
    } catch (error) {
      console.error('Erro ao criar agendamento:', error)
      toast.error('Erro ao criar agendamento')
    } finally {
      setSaving(false)
    }
  }

  const toggleRegra = async (id: string) => {
    try {
      const regra = automacaoService.getRegra(id)
      if (regra) {
        automacaoService.updateRegra(id, { ativa: !regra.ativa })
        setRegras(automacaoService.getAllRegras())
        toast.success(`Regra ${regra.ativa ? 'desativada' : 'ativada'} com sucesso!`)
      }
    } catch (error) {
      console.error('Erro ao alterar status da regra:', error)
      toast.error('Erro ao alterar status da regra')
    }
  }

  const deleteRegra = async (id: string) => {
    try {
      const deleted = automacaoService.deleteRegra(id)
      if (deleted) {
        setRegras(automacaoService.getAllRegras())
        toast.success('Regra deletada com sucesso!')
      }
    } catch (error) {
      console.error('Erro ao deletar regra:', error)
      toast.error('Erro ao deletar regra')
    }
  }

  const executarAgendamentos = async () => {
    try {
      automacaoService.executarAgendamentos()
      setAgendamentos(automacaoService.getAllAgendamentosPauta())
      toast.success('Agendamentos executados com sucesso!')
    } catch (error) {
      console.error('Erro ao executar agendamentos:', error)
      toast.error('Erro ao executar agendamentos')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Carregando dados de automação...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automação de Pautas e Tramitação</h1>
          <p className="text-muted-foreground">
            Configure regras automáticas para pautas, tramitação e notificações
          </p>
        </div>
        <AdminBreadcrumbs />
      </div>

      <Tabs defaultValue="regras" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="regras" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Regras de Automação
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Templates de Email
          </TabsTrigger>
          <TabsTrigger value="agendamentos" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Agendamentos
          </TabsTrigger>
        </TabsList>

        {/* Regras de Automação */}
        <TabsContent value="regras" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Regras de Automação
                  </CardTitle>
                  <CardDescription>
                    Configure regras automáticas para o sistema
                  </CardDescription>
                </div>
                <Dialog open={modalRegraOpen} onOpenChange={setModalRegraOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Nova Regra
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Nova Regra de Automação</DialogTitle>
                      <DialogDescription>
                        Configure uma nova regra automática para o sistema
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="nome">Nome da Regra</Label>
                          <Input
                            id="nome"
                            value={novaRegra.nome || ''}
                            onChange={(e) => setNovaRegra({ ...novaRegra, nome: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="tipo">Tipo</Label>
                          <Select
                            value={novaRegra.tipo || ''}
                            onValueChange={(value) => setNovaRegra({ ...novaRegra, tipo: value as any })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pauta">Pauta</SelectItem>
                              <SelectItem value="tramitacao">Tramitação</SelectItem>
                              <SelectItem value="notificacao">Notificação</SelectItem>
                              <SelectItem value="prazo">Prazo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="descricao">Descrição</Label>
                        <Textarea
                          id="descricao"
                          value={novaRegra.descricao || ''}
                          onChange={(e) => setNovaRegra({ ...novaRegra, descricao: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="prioridade">Prioridade</Label>
                          <Input
                            id="prioridade"
                            type="number"
                            min="1"
                            max="10"
                            value={novaRegra.prioridade || 1}
                            onChange={(e) => setNovaRegra({ ...novaRegra, prioridade: parseInt(e.target.value) })}
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={novaRegra.ativa !== false}
                            onCheckedChange={(checked) => setNovaRegra({ ...novaRegra, ativa: checked })}
                          />
                          <Label>Regra ativa</Label>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setModalRegraOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleCreateRegra} disabled={saving}>
                        {saving ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Criando...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Criar Regra
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {regras.map((regra) => (
                    <TableRow key={regra.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{regra.nome}</div>
                          <div className="text-sm text-muted-foreground">{regra.descricao}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{regra.tipo}</Badge>
                      </TableCell>
                      <TableCell>{regra.prioridade}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {regra.ativa ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-green-600">Ativa</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-600">Inativa</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleRegra(regra.id)}
                          >
                            {regra.ativa ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteRegra(regra.id)}
                          >
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

        {/* Templates de Email */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Templates de Email
                  </CardTitle>
                  <CardDescription>
                    Gerencie templates de email para notificações automáticas
                  </CardDescription>
                </div>
                <Dialog open={modalTemplateOpen} onOpenChange={setModalTemplateOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Novo Template
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Novo Template de Email</DialogTitle>
                      <DialogDescription>
                        Crie um novo template para notificações por email
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="nomeTemplate">Nome do Template</Label>
                        <Input
                          id="nomeTemplate"
                          value={novoTemplate.nome || ''}
                          onChange={(e) => setNovoTemplate({ ...novoTemplate, nome: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="assunto">Assunto</Label>
                        <Input
                          id="assunto"
                          value={novoTemplate.assunto || ''}
                          onChange={(e) => setNovoTemplate({ ...novoTemplate, assunto: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="conteudo">Conteúdo</Label>
                        <Textarea
                          id="conteudo"
                          rows={8}
                          value={novoTemplate.conteudo || ''}
                          onChange={(e) => setNovoTemplate({ ...novoTemplate, conteudo: e.target.value })}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={novoTemplate.ativo !== false}
                          onCheckedChange={(checked) => setNovoTemplate({ ...novoTemplate, ativo: checked })}
                        />
                        <Label>Template ativo</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setModalTemplateOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleCreateTemplate} disabled={saving}>
                        {saving ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Criando...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Criar Template
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Assunto</TableHead>
                    <TableHead>Variáveis</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.nome}</TableCell>
                      <TableCell>{template.assunto}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {template.variaveis.map((variavel, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {variavel}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {template.ativo ? (
                          <Badge variant="default">Ativo</Badge>
                        ) : (
                          <Badge variant="secondary">Inativo</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
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

        {/* Agendamentos */}
        <TabsContent value="agendamentos" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Agendamentos de Pauta
                  </CardTitle>
                  <CardDescription>
                    Configure agendamentos automáticos para criação de pautas
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={executarAgendamentos}>
                    <Zap className="mr-2 h-4 w-4" />
                    Executar Agora
                  </Button>
                  <Dialog open={modalAgendamentoOpen} onOpenChange={setModalAgendamentoOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Novo Agendamento
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Novo Agendamento</DialogTitle>
                        <DialogDescription>
                          Configure um novo agendamento automático
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="nomeAgendamento">Nome</Label>
                            <Input
                              id="nomeAgendamento"
                              value={novoAgendamento.nome || ''}
                              onChange={(e) => setNovoAgendamento({ ...novoAgendamento, nome: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="tipoAgendamento">Tipo</Label>
                            <Select
                              value={novoAgendamento.tipo || ''}
                              onValueChange={(value) => setNovoAgendamento({ ...novoAgendamento, tipo: value as any })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="periodica">Periódica</SelectItem>
                                <SelectItem value="evento">Evento</SelectItem>
                                <SelectItem value="proposicao">Proposição</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={novoAgendamento.ativo !== false}
                            onCheckedChange={(checked) => setNovoAgendamento({ ...novoAgendamento, ativo: checked })}
                          />
                          <Label>Agendamento ativo</Label>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setModalAgendamentoOpen(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleCreateAgendamento} disabled={saving}>
                          {saving ? (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                              Criando...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Criar Agendamento
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Próxima Execução</TableHead>
                    <TableHead>Última Execução</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agendamentos.map((agendamento) => (
                    <TableRow key={agendamento.id}>
                      <TableCell className="font-medium">{agendamento.nome}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{agendamento.tipo}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-500" />
                          {agendamento.proximaExecucao.toLocaleDateString('pt-BR')}
                        </div>
                      </TableCell>
                      <TableCell>
                        {agendamento.ultimaExecucao ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            {agendamento.ultimaExecucao.toLocaleDateString('pt-BR')}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Nunca</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {agendamento.ativo ? (
                          <Badge variant="default">Ativo</Badge>
                        ) : (
                          <Badge variant="secondary">Inativo</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
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
    </div>
  )
}