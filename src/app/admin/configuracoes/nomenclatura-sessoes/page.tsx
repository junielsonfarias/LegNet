'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Settings, 
  Save, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Edit, 
  Eye,
  Hash,
  Calendar,
  BookOpen,
  FileText
} from 'lucide-react'
import { nomenclaturaSessoesService } from '@/lib/nomenclatura-sessoes-service'
import { ConfiguracaoNomenclatura, TipoSessaoNomenclatura, ElementoTemplate } from '@/lib/types/nomenclatura-sessoes'
import { toast } from 'sonner'

export default function NomenclaturaSessoesPage() {
  const [configuracao, setConfiguracao] = useState<ConfiguracaoNomenclatura | null>(null)
  const [loading, setLoading] = useState(true)
  const [previewTitulo, setPreviewTitulo] = useState('')

  const gerarPreview = useCallback((config: ConfiguracaoNomenclatura) => {
    try {
      const titulo = nomenclaturaSessoesService.gerarTituloSessao(
        'ORDINARIA',
        '15',
        16,
        3
      )
      setPreviewTitulo(titulo)
    } catch (error) {
      setPreviewTitulo('Erro ao gerar preview')
    }
  }, [])

  const carregarConfiguracao = useCallback(() => {
    try {
      const config = nomenclaturaSessoesService.getConfiguracao()
      setConfiguracao(config)
      gerarPreview(config)
      setLoading(false)
    } catch (error) {
      console.error('Erro ao carregar configuração:', error)
      toast.error('Erro ao carregar configuração')
      setLoading(false)
    }
  }, [gerarPreview])

  useEffect(() => {
    carregarConfiguracao()
  }, [carregarConfiguracao])

  const salvarConfiguracao = useCallback(() => {
    if (!configuracao) return

    try {
      const validacao = nomenclaturaSessoesService.validarTemplate(configuracao.templateTitulo)
      if (!validacao.valido) {
        toast.error(`Template inválido: ${validacao.erros.join(', ')}`)
        return
      }

      nomenclaturaSessoesService.updateConfiguracao(configuracao)
      toast.success('Configuração salva com sucesso!')
      gerarPreview(configuracao)
    } catch (error) {
      console.error('Erro ao salvar configuração:', error)
      toast.error('Erro ao salvar configuração')
    }
  }, [configuracao, gerarPreview])

  const adicionarTipoSessao = () => {
    if (!configuracao) return

    const novoId = `tipo-${Date.now()}`
    const novoTipo: TipoSessaoNomenclatura = {
      id: novoId,
      tipo: 'ORDINARIA',
      nome: 'Novo Tipo',
      abreviatura: 'N.T.',
      prefixoNumeracao: 'Nov.',
      ordem: configuracao.configuracoes.tiposSessao.length + 1
    }

    setConfiguracao({
      ...configuracao,
      configuracoes: {
        ...configuracao.configuracoes,
        tiposSessao: [...configuracao.configuracoes.tiposSessao, novoTipo]
      }
    })
  }

  const atualizarTipoSessao = (id: string, campo: keyof TipoSessaoNomenclatura, valor: any) => {
    if (!configuracao) return

    setConfiguracao({
      ...configuracao,
      configuracoes: {
        ...configuracao.configuracoes,
        tiposSessao: configuracao.configuracoes.tiposSessao.map(tipo =>
          tipo.id === id ? { ...tipo, [campo]: valor } : tipo
        )
      }
    })
  }

  const removerTipoSessao = (id: string) => {
    if (!configuracao) return

    setConfiguracao({
      ...configuracao,
      configuracoes: {
        ...configuracao.configuracoes,
        tiposSessao: configuracao.configuracoes.tiposSessao.filter(tipo => tipo.id !== id)
      }
    })
  }

  const resetarNumeracao = () => {
    if (confirm('Tem certeza que deseja resetar toda a numeração? Esta ação não pode ser desfeita.')) {
      nomenclaturaSessoesService.resetarNumeracao()
      toast.success('Numeração resetada com sucesso!')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-camara-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando configurações...</p>
        </div>
      </div>
    )
  }

  if (!configuracao) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Erro ao carregar configurações</p>
        <Button onClick={carregarConfiguracao} className="mt-4">
          Tentar novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nomenclatura de Sessões</h1>
          <p className="text-gray-600 mt-2">
            Configure a nomenclatura e numeração das sessões legislativas
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={resetarNumeracao}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Resetar Numeração
          </Button>
          <Button onClick={salvarConfiguracao}>
            <Save className="h-4 w-4 mr-2" />
            Salvar Configuração
          </Button>
        </div>
      </div>

      {/* Preview */}
      <Card className="border-l-4 border-l-camara-primary">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Eye className="h-5 w-5 mr-2" />
            Preview do Título
          </CardTitle>
          <CardDescription>
            Como ficará o título de uma sessão com as configurações atuais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-lg font-medium text-gray-900">{previewTitulo}</p>
          </div>
        </CardContent>
      </Card>

      {/* Configurações */}
      <Tabs defaultValue="template" className="space-y-6">
        <TabsList>
          <TabsTrigger value="template">Template</TabsTrigger>
          <TabsTrigger value="tipos">Tipos de Sessão</TabsTrigger>
          <TabsTrigger value="numeracao">Numeração</TabsTrigger>
          <TabsTrigger value="periodos">Períodos</TabsTrigger>
        </TabsList>

        {/* Template */}
        <TabsContent value="template" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Template do Título
              </CardTitle>
              <CardDescription>
                Configure como será formatado o título das sessões legislativas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="template">Template</Label>
                <Textarea
                  id="template"
                  value={configuracao.templateTitulo}
                  onChange={(e) => setConfiguracao({
                    ...configuracao,
                    templateTitulo: e.target.value
                  })}
                  placeholder="Ex: {{numero_sessao}}ª {{tipo_sessao}} do {{periodo}} da Legislatura da {{legislatura}}ª Legislatura"
                  rows={3}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Use os placeholders disponíveis para criar o template
                </p>
              </div>

              <div>
                <Label>Placeholders Disponíveis</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {configuracao.configuracoes.elementosTemplate.map((elemento) => (
                    <div key={elemento.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                      <Badge variant="outline">{elemento.placeholder}</Badge>
                      <span className="text-sm text-gray-600">{elemento.nome}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tipos de Sessão */}
        <TabsContent value="tipos" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Tipos de Sessão
                  </CardTitle>
                  <CardDescription>
                    Configure os tipos de sessão e suas nomenclaturas
                  </CardDescription>
                </div>
                <Button onClick={adicionarTipoSessao}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Tipo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {configuracao.configuracoes.tiposSessao.map((tipo) => (
                  <div key={tipo.id} className="border rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <Label>Tipo</Label>
                        <Select
                          value={tipo.tipo}
                          onValueChange={(valor) => atualizarTipoSessao(tipo.id, 'tipo', valor)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ORDINARIA">Ordinária</SelectItem>
                            <SelectItem value="EXTRAORDINARIA">Extraordinária</SelectItem>
                            <SelectItem value="ESPECIAL">Especial</SelectItem>
                            <SelectItem value="SOLENE">Solene</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Nome</Label>
                        <Input
                          value={tipo.nome}
                          onChange={(e) => atualizarTipoSessao(tipo.id, 'nome', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Abreviatura</Label>
                        <Input
                          value={tipo.abreviatura}
                          onChange={(e) => atualizarTipoSessao(tipo.id, 'abreviatura', e.target.value)}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removerTipoSessao(tipo.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Numeração */}
        <TabsContent value="numeracao" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Hash className="h-5 w-5 mr-2" />
                Configurações de Numeração
              </CardTitle>
              <CardDescription>
                Configure como será feita a numeração sequencial das sessões
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Numeração Sequencial</Label>
                  <p className="text-sm text-gray-500">
                    Habilitar numeração automática sequencial
                  </p>
                </div>
                <Switch
                  checked={configuracao.configuracoes.numeracaoSequencial.habilitada}
                  onCheckedChange={(checked) => setConfiguracao({
                    ...configuracao,
                    configuracoes: {
                      ...configuracao.configuracoes,
                      numeracaoSequencial: {
                        ...configuracao.configuracoes.numeracaoSequencial,
                        habilitada: checked
                      }
                    }
                  })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Resetar por Ano</Label>
                  <p className="text-sm text-gray-500">
                    Reiniciar numeração a cada ano
                  </p>
                </div>
                <Switch
                  checked={configuracao.configuracoes.numeracaoSequencial.resetarPorAno}
                  onCheckedChange={(checked) => setConfiguracao({
                    ...configuracao,
                    configuracoes: {
                      ...configuracao.configuracoes,
                      numeracaoSequencial: {
                        ...configuracao.configuracoes.numeracaoSequencial,
                        resetarPorAno: checked
                      }
                    }
                  })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Resetar por Legislatura</Label>
                  <p className="text-sm text-gray-500">
                    Reiniciar numeração a cada legislatura
                  </p>
                </div>
                <Switch
                  checked={configuracao.configuracoes.numeracaoSequencial.resetarPorLegislatura}
                  onCheckedChange={(checked) => setConfiguracao({
                    ...configuracao,
                    configuracoes: {
                      ...configuracao.configuracoes,
                      numeracaoSequencial: {
                        ...configuracao.configuracoes.numeracaoSequencial,
                        resetarPorLegislatura: checked
                      }
                    }
                  })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Períodos */}
        <TabsContent value="periodos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                Períodos da Legislatura
              </CardTitle>
              <CardDescription>
                Configure os períodos da legislatura
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="quantidade-periodos">Quantidade de Períodos</Label>
                <Input
                  id="quantidade-periodos"
                  type="number"
                  value={configuracao.configuracoes.periodosLegislatura.quantidade}
                  onChange={(e) => setConfiguracao({
                    ...configuracao,
                    configuracoes: {
                      ...configuracao.configuracoes,
                      periodosLegislatura: {
                        ...configuracao.configuracoes.periodosLegislatura,
                        quantidade: parseInt(e.target.value) || 4
                      }
                    }
                  })}
                  min="1"
                  max="12"
                />
              </div>

              <div>
                <Label htmlFor="nomenclatura-periodo">Nomenclatura do Período</Label>
                <Input
                  id="nomenclatura-periodo"
                  value={configuracao.configuracoes.periodosLegislatura.nomenclatura}
                  onChange={(e) => setConfiguracao({
                    ...configuracao,
                    configuracoes: {
                      ...configuracao.configuracoes,
                      periodosLegislatura: {
                        ...configuracao.configuracoes.periodosLegislatura,
                        nomenclatura: e.target.value
                      }
                    }
                  })}
                  placeholder="Ex: Período, Sessão, Reunião"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
