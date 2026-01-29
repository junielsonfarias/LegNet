'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  GitBranch,
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Circle,
  ArrowDown,
  Loader2,
  RefreshCw,
  Settings
} from 'lucide-react'
import { toast } from 'sonner'

// Tipos
interface FluxoEtapa {
  id: string
  ordem: number
  nome: string
  descricao?: string | null
  unidadeId?: string | null
  unidade?: { id: string; nome: string; sigla: string | null } | null
  prazoDiasNormal: number
  prazoDiasUrgencia?: number | null
  requerParecer: boolean
  habilitaPauta: boolean
  ehEtapaFinal: boolean
}

interface Fluxo {
  id: string
  tipoProposicao: string
  nome: string
  descricao?: string | null
  ativo: boolean
  etapas: FluxoEtapa[]
}

interface Unidade {
  id: string
  nome: string
  sigla: string | null
}

const TIPO_PROPOSICAO_LABELS: Record<string, string> = {
  'PROJETO_LEI': 'Projeto de Lei (PL)',
  'PROJETO_RESOLUCAO': 'Projeto de Resolucao (PR)',
  'PROJETO_DECRETO': 'Projeto de Decreto (PD)',
  'INDICACAO': 'Indicacao (IND)',
  'REQUERIMENTO': 'Requerimento (REQ)',
  'MOCAO': 'Mocao (MOC)',
  'VOTO_PESAR': 'Voto de Pesar (VP)',
  'VOTO_APLAUSO': 'Voto de Aplauso (VA)'
}

export default function FluxosTramitacaoPage() {
  const [fluxos, setFluxos] = useState<Fluxo[]>([])
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedFluxo, setExpandedFluxo] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEtapa, setEditingEtapa] = useState<FluxoEtapa | null>(null)
  const [editingFluxoId, setEditingFluxoId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    unidadeId: '',
    prazoDiasNormal: 15,
    prazoDiasUrgencia: null as number | null,
    requerParecer: false,
    habilitaPauta: false,
    ehEtapaFinal: false
  })

  const loadFluxos = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/configuracoes/fluxos-tramitacao')
      const data = await response.json()
      if (data.success) {
        setFluxos(data.data)
      } else {
        toast.error('Erro ao carregar fluxos')
      }
    } catch (error) {
      console.error('Erro ao carregar fluxos:', error)
      toast.error('Erro ao carregar fluxos')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadUnidades = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/tramitacao/unidades')
      const data = await response.json()
      if (data.success) {
        setUnidades(data.data)
      }
    } catch (error) {
      console.error('Erro ao carregar unidades:', error)
    }
  }, [])

  useEffect(() => {
    loadFluxos()
    loadUnidades()
  }, [loadFluxos, loadUnidades])

  const criarFluxosPadrao = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/configuracoes/fluxos-tramitacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ criarPadrao: true })
      })
      const data = await response.json()
      if (data.success) {
        setFluxos(data.data)
        toast.success('Fluxos padrao criados com sucesso!')
      } else {
        toast.error(data.error || 'Erro ao criar fluxos padrao')
      }
    } catch (error) {
      console.error('Erro ao criar fluxos padrao:', error)
      toast.error('Erro ao criar fluxos padrao')
    } finally {
      setLoading(false)
    }
  }

  const toggleFluxoAtivo = async (fluxo: Fluxo) => {
    try {
      const response = await fetch('/api/admin/configuracoes/fluxos-tramitacao', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: fluxo.id, ativo: !fluxo.ativo })
      })
      const data = await response.json()
      if (data.success) {
        setFluxos(prev => prev.map(f => f.id === fluxo.id ? { ...f, ativo: !f.ativo } : f))
        toast.success(`Fluxo ${fluxo.ativo ? 'desativado' : 'ativado'} com sucesso!`)
      } else {
        toast.error(data.error || 'Erro ao atualizar fluxo')
      }
    } catch (error) {
      console.error('Erro ao atualizar fluxo:', error)
      toast.error('Erro ao atualizar fluxo')
    }
  }

  const handleAddEtapa = (fluxoId: string) => {
    setEditingFluxoId(fluxoId)
    setEditingEtapa(null)
    setFormData({
      nome: '',
      descricao: '',
      unidadeId: '',
      prazoDiasNormal: 15,
      prazoDiasUrgencia: null,
      requerParecer: false,
      habilitaPauta: false,
      ehEtapaFinal: false
    })
    setIsModalOpen(true)
  }

  const handleEditEtapa = (fluxoId: string, etapa: FluxoEtapa) => {
    setEditingFluxoId(fluxoId)
    setEditingEtapa(etapa)
    setFormData({
      nome: etapa.nome,
      descricao: etapa.descricao || '',
      unidadeId: etapa.unidadeId || '',
      prazoDiasNormal: etapa.prazoDiasNormal,
      prazoDiasUrgencia: etapa.prazoDiasUrgencia ?? null,
      requerParecer: etapa.requerParecer,
      habilitaPauta: etapa.habilitaPauta,
      ehEtapaFinal: etapa.ehEtapaFinal
    })
    setIsModalOpen(true)
  }

  const handleDeleteEtapa = async (fluxoId: string, etapaId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta etapa?')) return

    try {
      const response = await fetch(
        `/api/admin/configuracoes/fluxos-tramitacao/${fluxoId}/etapas?id=${etapaId}`,
        { method: 'DELETE' }
      )
      const data = await response.json()
      if (data.success) {
        toast.success('Etapa excluida com sucesso!')
        loadFluxos()
      } else {
        toast.error(data.error || 'Erro ao excluir etapa')
      }
    } catch (error) {
      console.error('Erro ao excluir etapa:', error)
      toast.error('Erro ao excluir etapa')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingFluxoId) return

    try {
      const url = `/api/admin/configuracoes/fluxos-tramitacao/${editingFluxoId}/etapas`
      const method = editingEtapa ? 'PUT' : 'POST'
      const body = editingEtapa
        ? { ...formData, id: editingEtapa.id, unidadeId: formData.unidadeId || null }
        : { ...formData, unidadeId: formData.unidadeId || undefined }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()
      if (data.success) {
        toast.success(`Etapa ${editingEtapa ? 'atualizada' : 'adicionada'} com sucesso!`)
        handleClose()
        loadFluxos()
      } else {
        toast.error(data.error || 'Erro ao salvar etapa')
      }
    } catch (error) {
      console.error('Erro ao salvar etapa:', error)
      toast.error('Erro ao salvar etapa')
    }
  }

  const handleClose = () => {
    setIsModalOpen(false)
    setEditingEtapa(null)
    setEditingFluxoId(null)
    setFormData({
      nome: '',
      descricao: '',
      unidadeId: '',
      prazoDiasNormal: 15,
      prazoDiasUrgencia: null,
      requerParecer: false,
      habilitaPauta: false,
      ehEtapaFinal: false
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <GitBranch className="h-8 w-8 text-blue-600" />
            Fluxos de Tramitacao
          </h1>
          <p className="text-gray-600">
            Configure o fluxo de tramitacao para cada tipo de proposicao
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadFluxos} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
          {fluxos.length === 0 && (
            <Button onClick={criarFluxosPadrao} className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Criar Fluxos Padrao
            </Button>
          )}
        </div>
      </div>

      {fluxos.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <GitBranch className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Nenhum fluxo configurado
            </h3>
            <p className="text-gray-500 mb-4">
              Clique no botao acima para criar os fluxos padrao para cada tipo de proposicao.
            </p>
            <Button onClick={criarFluxosPadrao}>
              <Settings className="h-4 w-4 mr-2" />
              Criar Fluxos Padrao
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {fluxos.map((fluxo) => (
            <Card key={fluxo.id} className={!fluxo.ativo ? 'opacity-60' : ''}>
              <CardHeader className="cursor-pointer" onClick={() => setExpandedFluxo(
                expandedFluxo === fluxo.id ? null : fluxo.id
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {expandedFluxo === fluxo.id ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                    <div>
                      <CardTitle className="text-lg">
                        {TIPO_PROPOSICAO_LABELS[fluxo.tipoProposicao] || fluxo.tipoProposicao}
                      </CardTitle>
                      <CardDescription>{fluxo.nome}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                    <Badge variant={fluxo.ativo ? 'default' : 'secondary'}>
                      {fluxo.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <Badge variant="outline">{fluxo.etapas.length} etapas</Badge>
                    <Switch
                      checked={fluxo.ativo}
                      onCheckedChange={() => toggleFluxoAtivo(fluxo)}
                    />
                  </div>
                </div>
              </CardHeader>

              {expandedFluxo === fluxo.id && (
                <CardContent className="pt-0">
                  {fluxo.descricao && (
                    <p className="text-sm text-gray-600 mb-4">{fluxo.descricao}</p>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-700">Etapas do Fluxo</h4>
                      <Button
                        size="sm"
                        onClick={() => handleAddEtapa(fluxo.id)}
                        className="flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        Adicionar Etapa
                      </Button>
                    </div>

                    {fluxo.etapas.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        Nenhuma etapa configurada
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {fluxo.etapas.map((etapa, index) => (
                          <div key={etapa.id}>
                            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                              <div className="flex flex-col items-center">
                                {etapa.habilitaPauta ? (
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                ) : (
                                  <Circle className="h-5 w-5 text-gray-300" />
                                )}
                                {index < fluxo.etapas.length - 1 && (
                                  <div className="h-8 w-0.5 bg-gray-200 my-1" />
                                )}
                              </div>

                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium">{etapa.ordem}. {etapa.nome}</span>
                                  {etapa.habilitaPauta && (
                                    <Badge className="bg-green-100 text-green-800 text-xs">
                                      Habilita Pauta
                                    </Badge>
                                  )}
                                  {etapa.requerParecer && (
                                    <Badge variant="outline" className="text-xs">
                                      Requer Parecer
                                    </Badge>
                                  )}
                                  {etapa.ehEtapaFinal && (
                                    <Badge className="bg-blue-100 text-blue-800 text-xs">
                                      Final
                                    </Badge>
                                  )}
                                </div>
                                {etapa.descricao && (
                                  <p className="text-sm text-gray-600">{etapa.descricao}</p>
                                )}
                                <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                                  {etapa.unidade && (
                                    <span>Destino: {etapa.unidade.sigla || etapa.unidade.nome}</span>
                                  )}
                                  <span>Prazo: {etapa.prazoDiasNormal} dias</span>
                                  {etapa.prazoDiasUrgencia && (
                                    <span>Urgencia: {etapa.prazoDiasUrgencia} dias</span>
                                  )}
                                </div>
                              </div>

                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditEtapa(fluxo.id, etapa)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600"
                                  onClick={() => handleDeleteEtapa(fluxo.id, etapa.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Etapa */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {editingEtapa ? 'Editar Etapa' : 'Nova Etapa'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome da Etapa *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Analise na CLJ"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="descricao">Descricao</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Descricao da etapa..."
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="unidadeId">Unidade de Destino</Label>
                  <select
                    id="unidadeId"
                    value={formData.unidadeId}
                    onChange={(e) => setFormData({ ...formData, unidadeId: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Selecione uma unidade</option>
                    {unidades.map((unidade) => (
                      <option key={unidade.id} value={unidade.id}>
                        {unidade.sigla ? `${unidade.sigla} - ${unidade.nome}` : unidade.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="prazoDiasNormal">Prazo Normal (dias)</Label>
                    <Input
                      id="prazoDiasNormal"
                      type="number"
                      min="0"
                      value={formData.prazoDiasNormal}
                      onChange={(e) => setFormData({
                        ...formData,
                        prazoDiasNormal: parseInt(e.target.value) || 0
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="prazoDiasUrgencia">Prazo Urgencia (dias)</Label>
                    <Input
                      id="prazoDiasUrgencia"
                      type="number"
                      min="0"
                      value={formData.prazoDiasUrgencia ?? ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        prazoDiasUrgencia: e.target.value ? parseInt(e.target.value) : null
                      })}
                      placeholder="Opcional"
                    />
                  </div>
                </div>

                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Requer Parecer</Label>
                      <p className="text-xs text-gray-500">
                        A proposicao precisa de parecer nesta etapa
                      </p>
                    </div>
                    <Switch
                      checked={formData.requerParecer}
                      onCheckedChange={(checked) => setFormData({ ...formData, requerParecer: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-green-700">Habilita Inclusao na Pauta</Label>
                      <p className="text-xs text-gray-500">
                        Proposicao nesta etapa pode ser adicionada a pauta
                      </p>
                    </div>
                    <Switch
                      checked={formData.habilitaPauta}
                      onCheckedChange={(checked) => setFormData({ ...formData, habilitaPauta: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Etapa Final</Label>
                      <p className="text-xs text-gray-500">
                        Marca esta como ultima etapa do fluxo
                      </p>
                    </div>
                    <Switch
                      checked={formData.ehEtapaFinal}
                      onCheckedChange={(checked) => setFormData({ ...formData, ehEtapaFinal: checked })}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={handleClose}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingEtapa ? 'Atualizar' : 'Adicionar'} Etapa
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
