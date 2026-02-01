'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  FileText,
  Clock,
  Vote,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Database,
  Palette,
  GitBranch
} from 'lucide-react'
import { toast } from 'sonner'
import { FluxoTramitacaoEditor } from '@/components/admin/fluxo-tramitacao-editor'

// Interface para o tipo de proposicao do banco
interface TipoProposicaoConfig {
  id: string
  codigo: string
  nome: string
  sigla: string
  descricao: string | null
  prazoLimite: number | null
  requerVotacao: boolean
  requerSancao: boolean
  numeracaoAnual: boolean
  prefixoNumeracao: string | null
  ativo: boolean
  ordem: number
  corBadge: string | null
  icone: string | null
  createdAt: string
  updatedAt: string
}

// Codigos sugeridos de tipos de proposicao (podem ser criados outros)
const CODIGOS_SUGERIDOS = [
  { value: 'PROJETO_LEI', label: 'Projeto de Lei', sigla: 'PL' },
  { value: 'PROJETO_RESOLUCAO', label: 'Projeto de Resolucao', sigla: 'PR' },
  { value: 'PROJETO_DECRETO', label: 'Projeto de Decreto Legislativo', sigla: 'PDL' },
  { value: 'INDICACAO', label: 'Indicacao', sigla: 'IND' },
  { value: 'REQUERIMENTO', label: 'Requerimento', sigla: 'REQ' },
  { value: 'MOCAO', label: 'Mocao', sigla: 'MOC' },
  { value: 'VOTO_PESAR', label: 'Voto de Pesar', sigla: 'VP' },
  { value: 'VOTO_APLAUSO', label: 'Voto de Aplauso', sigla: 'VA' }
]

export default function TiposProposicoesPage() {
  const [tipos, setTipos] = useState<TipoProposicaoConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTipo, setEditingTipo] = useState<TipoProposicaoConfig | null>(null)
  const [codigosUsados, setCodigosUsados] = useState<string[]>([])
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false)
  const [activeTab, setActiveTab] = useState('dados')
  const [formData, setFormData] = useState({
    codigo: '',
    nome: '',
    sigla: '',
    descricao: '',
    prazoLimite: 0,
    requerVotacao: true,
    requerSancao: false,
    numeracaoAnual: true,
    prefixoNumeracao: '',
    ativo: true,
    ordem: 0,
    corBadge: '#3B82F6',
    icone: 'FileText'
  })

  const loadTipos = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/tipos-proposicao')
      const result = await response.json()

      if (result.success) {
        setTipos(result.data)
        setCodigosUsados(result.data.map((t: TipoProposicaoConfig) => t.codigo))
      } else {
        toast.error('Erro ao carregar tipos de proposicao')
      }
    } catch (error) {
      console.error('Erro ao carregar tipos:', error)
      toast.error('Erro ao carregar tipos de proposicao')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTipos()
  }, [loadTipos])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setSaving(true)

      if (editingTipo) {
        // Atualizar tipo existente
        const response = await fetch(`/api/tipos-proposicao/${editingTipo.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome: formData.nome,
            sigla: formData.sigla,
            descricao: formData.descricao || null,
            prazoLimite: formData.prazoLimite || null,
            requerVotacao: formData.requerVotacao,
            requerSancao: formData.requerSancao,
            numeracaoAnual: formData.numeracaoAnual,
            prefixoNumeracao: formData.prefixoNumeracao || null,
            ativo: formData.ativo,
            ordem: formData.ordem,
            corBadge: formData.corBadge || null,
            icone: formData.icone || null
          })
        })

        const result = await response.json()

        if (result.success) {
          toast.success('Tipo de proposicao atualizado com sucesso!')
          loadTipos()
          handleClose()
        } else {
          toast.error(result.error || 'Erro ao atualizar tipo de proposicao')
        }
      } else {
        // Criar novo tipo
        const response = await fetch('/api/tipos-proposicao', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            codigo: formData.codigo,
            nome: formData.nome,
            sigla: formData.sigla,
            descricao: formData.descricao || null,
            prazoLimite: formData.prazoLimite || null,
            requerVotacao: formData.requerVotacao,
            requerSancao: formData.requerSancao,
            numeracaoAnual: formData.numeracaoAnual,
            prefixoNumeracao: formData.prefixoNumeracao || null,
            ativo: formData.ativo,
            ordem: formData.ordem,
            corBadge: formData.corBadge || null,
            icone: formData.icone || null
          })
        })

        const result = await response.json()

        if (result.success) {
          toast.success('Tipo de proposicao criado com sucesso!')
          loadTipos()
          handleClose()
        } else {
          toast.error(result.error || 'Erro ao criar tipo de proposicao')
        }
      }
    } catch (error) {
      console.error('Erro ao salvar tipo:', error)
      toast.error('Erro ao salvar tipo de proposicao')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (tipo: TipoProposicaoConfig) => {
    setEditingTipo(tipo)
    setFormData({
      codigo: tipo.codigo,
      nome: tipo.nome,
      sigla: tipo.sigla,
      descricao: tipo.descricao || '',
      prazoLimite: tipo.prazoLimite || 0,
      requerVotacao: tipo.requerVotacao,
      requerSancao: tipo.requerSancao,
      numeracaoAnual: tipo.numeracaoAnual,
      prefixoNumeracao: tipo.prefixoNumeracao || '',
      ativo: tipo.ativo,
      ordem: tipo.ordem,
      corBadge: tipo.corBadge || '#3B82F6',
      icone: tipo.icone || 'FileText'
    })
    setActiveTab('dados')
    setIsModalOpen(true)
  }

  const handleDelete = async (tipo: TipoProposicaoConfig) => {
    if (!confirm(`Tem certeza que deseja excluir o tipo "${tipo.nome}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/tipos-proposicao/${tipo.id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Tipo de proposicao excluido com sucesso!')
        loadTipos()
      } else {
        toast.error(result.error || 'Erro ao excluir tipo de proposicao')
      }
    } catch (error) {
      console.error('Erro ao excluir tipo:', error)
      toast.error('Erro ao excluir tipo de proposicao')
    }
  }

  const handlePopularTipos = async () => {
    if (!confirm('Deseja popular os tipos de proposicao com os dados padrao? Isso ira criar ou atualizar todos os 8 tipos.')) {
      return
    }

    try {
      setSaving(true)
      const response = await fetch('/api/tipos-proposicao/seed', {
        method: 'POST'
      })

      const result = await response.json()

      if (result.success) {
        toast.success(result.message)
        loadTipos()
      } else {
        toast.error(result.error || 'Erro ao popular tipos')
      }
    } catch (error) {
      console.error('Erro ao popular tipos:', error)
      toast.error('Erro ao popular tipos de proposicao')
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    setIsModalOpen(false)
    setEditingTipo(null)
    setActiveTab('dados')
    setFormData({
      codigo: '',
      nome: '',
      sigla: '',
      descricao: '',
      prazoLimite: 0,
      requerVotacao: true,
      requerSancao: false,
      numeracaoAnual: true,
      prefixoNumeracao: '',
      ativo: true,
      ordem: 0,
      corBadge: '#3B82F6',
      icone: 'FileText'
    })
  }

  const getStatusBadge = (ativo: boolean) => {
    return ativo ? (
      <Badge className="bg-green-100 text-green-800">Ativo</Badge>
    ) : (
      <Badge variant="secondary">Inativo</Badge>
    )
  }

  const getRequerimentoBadge = (requer: boolean) => {
    return requer ? (
      <Badge className="bg-blue-100 text-blue-800">Sim</Badge>
    ) : (
      <Badge variant="outline">Nao</Badge>
    )
  }

  // Codigos sugeridos nao usados ainda
  const sugestoesDisponiveis = CODIGOS_SUGERIDOS.filter(c => !codigosUsados.includes(c.value))

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tipos de Proposicoes</h1>
          <p className="text-gray-600">Configure os tipos de proposicoes legislativas e seus fluxos de tramitacao</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handlePopularTipos}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Database className="h-4 w-4 mr-2" />
            )}
            Popular Padrao
          </Button>
          <Button
            variant="outline"
            onClick={loadTipos}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Novo Tipo
          </Button>
        </div>
      </div>

      {/* Aviso se nao ha tipos */}
      {!loading && tipos.length === 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-800">Nenhum tipo configurado</h3>
                <p className="text-yellow-700 text-sm mt-1">
                  Clique em &quot;Popular Padrao&quot; para criar os 8 tipos de proposicao com configuracoes recomendadas.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info sobre tipos personalizados */}
      {!loading && tipos.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <FileText className="h-6 w-6 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-800">{tipos.length} tipos configurados</h3>
                <p className="text-blue-700 text-sm mt-1">
                  Voce pode criar tipos personalizados alem dos 8 tipos padrao. Use o botao &quot;Novo Tipo&quot; para adicionar.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      )}

      {/* Lista de Tipos */}
      {!loading && tipos.length > 0 && (
        <div className="grid gap-4">
          {tipos.map((tipo) => (
            <Card key={tipo.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: tipo.corBadge || '#3B82F6' }}
                    >
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {tipo.nome}
                        <span className="text-sm font-normal text-gray-500">({tipo.sigla})</span>
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {tipo.descricao || 'Sem descricao'}
                      </CardDescription>
                      <Badge variant="outline" className="mt-2 text-xs">
                        {tipo.codigo}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(tipo.ativo)}
                    <Button variant="outline" size="sm" onClick={() => handleEdit(tipo)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(tipo)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>
                      <strong>Prazo:</strong> {tipo.prazoLimite || 'N/A'} dias
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Vote className="h-4 w-4 text-gray-500" />
                    <span>
                      <strong>Votacao:</strong> {getRequerimentoBadge(tipo.requerVotacao)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-gray-500" />
                    <span>
                      <strong>Sancao:</strong> {getRequerimentoBadge(tipo.requerSancao)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span>
                      <strong>Prefixo:</strong> {tipo.prefixoNumeracao || tipo.sigla}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-gray-500" />
                    <span>
                      <strong>Ordem:</strong> {tipo.ordem}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Cadastro/Edicao com Tabs */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <CardHeader className="flex-shrink-0">
              <div className="flex justify-between items-center">
                <CardTitle>
                  {editingTipo ? `Editar: ${editingTipo.nome}` : 'Novo Tipo de Proposicao'}
                </CardTitle>
                <Button variant="outline" size="sm" onClick={handleClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                <div className="px-6 border-b">
                  <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="dados" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Dados Basicos
                    </TabsTrigger>
                    <TabsTrigger
                      value="fluxo"
                      className="flex items-center gap-2"
                      disabled={!editingTipo}
                    >
                      <GitBranch className="h-4 w-4" />
                      Fluxo de Tramitacao
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  {/* Tab Dados Basicos */}
                  <TabsContent value="dados" className="mt-0 space-y-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Codigo (apenas para criacao) */}
                      {!editingTipo && (
                        <div className="space-y-2">
                          <Label htmlFor="codigo">Codigo do Tipo *</Label>
                          <div className="relative">
                            <Input
                              id="codigo"
                              value={formData.codigo}
                              onChange={(e) => {
                                const valor = e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '')
                                setFormData({ ...formData, codigo: valor })
                              }}
                              onFocus={() => setMostrarSugestoes(true)}
                              onBlur={() => setTimeout(() => setMostrarSugestoes(false), 200)}
                              placeholder="Ex: PROJETO_LEI, HOMENAGEM_ESPECIAL"
                              required
                            />
                            {/* Dropdown de sugestoes */}
                            {mostrarSugestoes && sugestoesDisponiveis.length > 0 && !formData.codigo && (
                              <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                                <div className="p-2 text-xs text-gray-500 border-b">Sugestoes (clique para usar):</div>
                                {sugestoesDisponiveis.map((sugestao) => (
                                  <button
                                    key={sugestao.value}
                                    type="button"
                                    className="w-full px-3 py-2 text-left hover:bg-gray-100 text-sm"
                                    onClick={() => {
                                      setFormData({
                                        ...formData,
                                        codigo: sugestao.value,
                                        nome: sugestao.label,
                                        sigla: sugestao.sigla,
                                        prefixoNumeracao: sugestao.sigla
                                      })
                                      setMostrarSugestoes(false)
                                    }}
                                  >
                                    <span className="font-medium">{sugestao.value}</span>
                                    <span className="text-gray-500 ml-2">- {sugestao.label}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            Use letras maiusculas, numeros e underscore. Ex: PROJETO_LEI, HOMENAGEM_ESPECIAL
                          </p>
                          {codigosUsados.includes(formData.codigo) && formData.codigo && (
                            <p className="text-sm text-red-600">
                              Este codigo ja esta em uso.
                            </p>
                          )}
                        </div>
                      )}

                      {/* Nome e Sigla */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="nome">Nome *</Label>
                          <Input
                            id="nome"
                            value={formData.nome}
                            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                            placeholder="Ex: Projeto de Lei"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="sigla">Sigla *</Label>
                          <Input
                            id="sigla"
                            value={formData.sigla}
                            onChange={(e) => setFormData({ ...formData, sigla: e.target.value.toUpperCase() })}
                            placeholder="Ex: PL"
                            maxLength={10}
                            required
                          />
                        </div>
                      </div>

                      {/* Descricao */}
                      <div>
                        <Label htmlFor="descricao">Descricao</Label>
                        <Textarea
                          id="descricao"
                          value={formData.descricao}
                          onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                          placeholder="Descricao do tipo de proposicao"
                          rows={3}
                        />
                      </div>

                      {/* Prazo, Prefixo e Ordem */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="prazoLimite">Prazo Limite (dias)</Label>
                          <Input
                            id="prazoLimite"
                            type="number"
                            value={formData.prazoLimite}
                            onChange={(e) => setFormData({ ...formData, prazoLimite: parseInt(e.target.value) || 0 })}
                            placeholder="0 para sem prazo"
                            min={0}
                          />
                        </div>
                        <div>
                          <Label htmlFor="prefixoNumeracao">Prefixo Numeracao</Label>
                          <Input
                            id="prefixoNumeracao"
                            value={formData.prefixoNumeracao}
                            onChange={(e) => setFormData({ ...formData, prefixoNumeracao: e.target.value.toUpperCase() })}
                            placeholder="Ex: PL"
                            maxLength={10}
                          />
                        </div>
                        <div>
                          <Label htmlFor="ordem">Ordem de Exibicao</Label>
                          <Input
                            id="ordem"
                            type="number"
                            value={formData.ordem}
                            onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) || 0 })}
                            placeholder="0"
                            min={0}
                          />
                        </div>
                      </div>

                      {/* Cor do Badge */}
                      <div>
                        <Label htmlFor="corBadge" className="flex items-center gap-2">
                          <Palette className="h-4 w-4" />
                          Cor do Badge
                        </Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            id="corBadge"
                            type="color"
                            value={formData.corBadge}
                            onChange={(e) => setFormData({ ...formData, corBadge: e.target.value })}
                            className="w-16 h-10 p-1"
                          />
                          <Input
                            value={formData.corBadge}
                            onChange={(e) => setFormData({ ...formData, corBadge: e.target.value })}
                            placeholder="#3B82F6"
                            maxLength={7}
                            className="w-28"
                          />
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                            style={{ backgroundColor: formData.corBadge }}
                          >
                            <FileText className="h-5 w-5" />
                          </div>
                        </div>
                      </div>

                      {/* Switches */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="requerVotacao"
                            checked={formData.requerVotacao}
                            onCheckedChange={(checked) => setFormData({ ...formData, requerVotacao: checked })}
                          />
                          <Label htmlFor="requerVotacao" className="text-sm">Requer Votacao</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="requerSancao"
                            checked={formData.requerSancao}
                            onCheckedChange={(checked) => setFormData({ ...formData, requerSancao: checked })}
                          />
                          <Label htmlFor="requerSancao" className="text-sm">Requer Sancao</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="numeracaoAnual"
                            checked={formData.numeracaoAnual}
                            onCheckedChange={(checked) => setFormData({ ...formData, numeracaoAnual: checked })}
                          />
                          <Label htmlFor="numeracaoAnual" className="text-sm">Num. Anual</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="ativo"
                            checked={formData.ativo}
                            onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                          />
                          <Label htmlFor="ativo" className="text-sm">Ativo</Label>
                        </div>
                      </div>

                      {/* Botoes */}
                      <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={handleClose}>
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          disabled={saving || (!editingTipo && (!formData.codigo || codigosUsados.includes(formData.codigo)))}
                        >
                          {saving ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          {editingTipo ? 'Atualizar' : 'Criar'}
                        </Button>
                      </div>
                    </form>
                  </TabsContent>

                  {/* Tab Fluxo de Tramitacao */}
                  <TabsContent value="fluxo" className="mt-0">
                    {editingTipo ? (
                      <FluxoTramitacaoEditor
                        tipoProposicao={editingTipo.codigo}
                        nomeTipo={editingTipo.nome}
                      />
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <GitBranch className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>Salve o tipo de proposicao primeiro para configurar o fluxo de tramitacao.</p>
                      </div>
                    )}
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
