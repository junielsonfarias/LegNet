'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Settings, 
  Play, 
  Pause, 
  RefreshCw, 
  FileText, 
  Zap, 
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  Plus,
  Edit,
  Trash2
} from 'lucide-react'
import {
  automacaoPautasService,
  TemplatePauta,
  RegraAutomatica,
  ExecucaoAutomatica
} from '@/lib/automacao-pautas-mock-service'
import { toast } from 'sonner'

interface AutomacaoPautasProps {
  onPautaGerada?: (pauta: any) => void
}

export default function AutomacaoPautas({ onPautaGerada }: AutomacaoPautasProps) {
  const [templates, setTemplates] = useState<TemplatePauta[]>([])
  const [regras, setRegras] = useState<RegraAutomatica[]>([])
  const [execucoes, setExecucoes] = useState<ExecucaoAutomatica[]>([])
  const [loading, setLoading] = useState(true)
  const [executando, setExecutando] = useState(false)

  // Carregar dados
  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      setTemplates(automacaoPautasService.getTemplates())
      setRegras(automacaoPautasService.getRegrasAutomaticas())
      setLoading(false)
    }, 500)
  }, [])

  // Handlers
  const handleExecutarRegra = async (regra: RegraAutomatica) => {
    setExecutando(true)
    try {
      // Simular execução da regra
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const execucao: ExecucaoAutomatica = {
        id: `exec-${Date.now()}`,
        regraId: regra.id,
        pautaId: 'pauta-exemplo',
        status: 'concluida',
        inicioExecucao: new Date().toISOString(),
        fimExecucao: new Date().toISOString(),
        resultado: { itensProcessados: Math.floor(Math.random() * 5) + 1 },
        erros: [],
        logs: [
          {
            timestamp: new Date().toISOString(),
            nivel: 'info',
            mensagem: regra.descricao,
            detalhes: { regra: regra.nome }
          }
        ]
      }

      setExecucoes(prev => [execucao, ...prev])
      toast.success(`Regra "${regra.nome}" executada com sucesso!`)
    } catch (error) {
      toast.error('Erro ao executar regra')
    } finally {
      setExecutando(false)
    }
  }

  const handleGerarPautaAutomatica = async (template: TemplatePauta) => {
    setExecutando(true)
    try {
      // Simular geração de pauta
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const pauta = automacaoPautasService.gerarPautaAutomatica(template.id, [])
      
      if (pauta && onPautaGerada) {
        onPautaGerada(pauta)
        toast.success(`Pauta gerada automaticamente usando template "${template.nome}"!`)
      } else {
        toast.error('Erro ao gerar pauta automaticamente')
      }
    } catch (error) {
      toast.error('Erro ao gerar pauta')
    } finally {
      setExecutando(false)
    }
  }

  const handleToggleRegra = (regra: RegraAutomatica) => {
    // Simular toggle de regra
    setRegras(prev => prev.map(r => 
      r.id === regra.id ? { ...r, ativa: !r.ativa } : r
    ))
    toast.success(`Regra "${regra.nome}" ${regra.ativa ? 'desativada' : 'ativada'}`)
  }

  // Funções auxiliares
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluida': return 'bg-green-100 text-green-800'
      case 'executando': return 'bg-blue-100 text-blue-800'
      case 'erro': return 'bg-red-100 text-red-800'
      case 'pendente': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'concluida': return <CheckCircle className="h-4 w-4" />
      case 'executando': return <RefreshCw className="h-4 w-4 animate-spin" />
      case 'erro': return <AlertCircle className="h-4 w-4" />
      case 'pendente': return <Clock className="h-4 w-4" />
      default: return <Info className="h-4 w-4" />
    }
  }

  const getNivelColor = (nivel: string) => {
    switch (nivel) {
      case 'info': return 'text-blue-600'
      case 'warning': return 'text-orange-600'
      case 'error': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-camara-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando automação...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Zap className="h-6 w-6 mr-2 text-yellow-600" />
            Automação de Pautas
          </h2>
          <p className="text-gray-600 mt-1">
            Configure templates e regras para automação de pautas legislativas
          </p>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="camara-card">
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Templates</p>
                <p className="text-2xl font-bold text-gray-900">{templates.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="camara-card">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Settings className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Regras Ativas</p>
                <p className="text-2xl font-bold text-gray-900">{regras.filter(r => r.ativa).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="camara-card">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Play className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Execuções Hoje</p>
                <p className="text-2xl font-bold text-gray-900">{execucoes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="camara-card">
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Taxa Sucesso</p>
                <p className="text-2xl font-bold text-gray-900">
                  {execucoes.length > 0 
                    ? Math.round((execucoes.filter(e => e.status === 'concluida').length / execucoes.length) * 100)
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Abas */}
      <Tabs defaultValue="templates" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="regras">Regras Automáticas</TabsTrigger>
          <TabsTrigger value="execucoes">Execuções</TabsTrigger>
        </TabsList>

        {/* Aba Templates */}
        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {templates.map((template) => (
              <Card key={template.id} className="camara-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      {template.nome}
                    </CardTitle>
                    <Badge variant="outline">
                      {template.tipo}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{template.descricao}</p>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Seções:</span>
                      <span className="font-medium">{template.secoes.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Numeração Automática:</span>
                      <Badge variant={template.configuracoes.numeracaoAutomatica ? "default" : "outline"}>
                        {template.configuracoes.numeracaoAutomatica ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Validação Automática:</span>
                      <Badge variant={template.configuracoes.validacaoAutomatica ? "default" : "outline"}>
                        {template.configuracoes.validacaoAutomatica ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleGerarPautaAutomatica(template)}
                      disabled={executando}
                      className="flex-1"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Gerar Pauta
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Aba Regras Automáticas */}
        <TabsContent value="regras" className="space-y-4">
          <div className="space-y-4">
            {regras.map((regra) => (
              <Card key={regra.id} className="camara-card">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{regra.nome}</h3>
                        <Badge variant={regra.ativa ? "default" : "outline"}>
                          {regra.ativa ? 'Ativa' : 'Inativa'}
                        </Badge>
                        <Badge variant="outline">
                          Prioridade {regra.prioridade}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 mb-3">{regra.descricao}</p>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {regra.execucao}
                        </div>
                        <div className="flex items-center">
                          <Settings className="h-4 w-4 mr-1" />
                          {regra.condicoes.length} condição(ões)
                        </div>
                        <div className="flex items-center">
                          <Zap className="h-4 w-4 mr-1" />
                          {regra.acoes.length} ação(ões)
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleToggleRegra(regra)}
                      >
                        {regra.ativa ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleExecutarRegra(regra)}
                        disabled={executando || !regra.ativa}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Aba Execuções */}
        <TabsContent value="execucoes" className="space-y-4">
          <div className="space-y-4">
            {execucoes.length === 0 ? (
              <Card className="camara-card">
                <CardContent className="p-12 text-center">
                  <Play className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhuma execução registrada
                  </h3>
                  <p className="text-gray-600">
                    Execute uma regra automática para ver os logs aqui.
                  </p>
                </CardContent>
              </Card>
            ) : (
              execucoes.map((execucao) => (
                <Card key={execucao.id} className="camara-card">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {regras.find(r => r.id === execucao.regraId)?.nome || 'Regra Desconhecida'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {new Date(execucao.inicioExecucao).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <Badge className={getStatusColor(execucao.status)}>
                        {getStatusIcon(execucao.status)}
                        <span className="ml-1">{execucao.status}</span>
                      </Badge>
                    </div>

                    {execucao.logs.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium text-gray-900 mb-2">Logs:</h4>
                        <div className="space-y-2">
                          {execucao.logs.map((log, index) => (
                            <div key={index} className="flex items-start space-x-2 text-sm">
                              <span className="text-gray-400">
                                {new Date(log.timestamp).toLocaleTimeString('pt-BR')}
                              </span>
                              <span className={getNivelColor(log.nivel)}>
                                [{log.nivel.toUpperCase()}]
                              </span>
                              <span className="text-gray-700">{log.mensagem}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {execucao.erros.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium text-red-700 mb-2">Erros:</h4>
                        <div className="space-y-1">
                          {execucao.erros.map((erro, index) => (
                            <p key={index} className="text-sm text-red-600">{erro}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
