'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Plus,
  Edit,
  Trash2,
  Save,
  ArrowUp,
  ArrowDown,
  Clock,
  FileCheck,
  Flag,
  Loader2,
  AlertCircle,
  Lock,
  Zap,
  Building2,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { toast } from 'sonner'

// Tipos
interface TramitacaoUnidade {
  id: string
  nome: string
  sigla: string | null
  tipo: string
  ativo: boolean
}

interface FluxoEtapa {
  id: string
  fluxoId: string
  ordem: number
  nome: string
  descricao: string | null
  unidadeId: string | null
  prazoDiasNormal: number
  prazoDiasUrgencia: number | null
  requerParecer: boolean
  habilitaPauta: boolean
  ehEtapaFinal: boolean
  condicional: boolean
  tipoCondicao: string | null
  condicaoConfig: Record<string, unknown> | null
  unidade?: {
    id: string
    nome: string
    sigla: string | null
  } | null
}

interface Fluxo {
  id: string
  tipoProposicao: string
  nome: string
  descricao: string | null
  ativo: boolean
  etapas: FluxoEtapa[]
}

interface FluxoTramitacaoEditorProps {
  tipoProposicao: string
  nomeTipo?: string
  onSave?: () => void
}

// Tipos de condicao disponiveis
const TIPOS_CONDICAO = [
  { value: 'SEMPRE', label: 'Sempre (obrigatoria)', descricao: 'Etapa sempre executada' },
  { value: 'IMPACTO_FINANCEIRO', label: 'Impacto financeiro', descricao: 'Executar se proposicao tiver impacto financeiro' },
  { value: 'REGIME_URGENCIA', label: 'Regime de urgencia', descricao: 'Executar se proposicao estiver em regime de urgencia' },
  { value: 'REGIME_NORMAL', label: 'Regime normal', descricao: 'Executar apenas em regime normal (nao urgencia)' },
  { value: 'CAMPO_PERSONALIZADO', label: 'Condicao personalizada', descricao: 'Baseada em campo especifico' }
]

export function FluxoTramitacaoEditor({ tipoProposicao, nomeTipo, onSave }: FluxoTramitacaoEditorProps) {
  const [fluxo, setFluxo] = useState<Fluxo | null>(null)
  const [unidades, setUnidades] = useState<TramitacaoUnidade[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEtapa, setEditingEtapa] = useState<FluxoEtapa | null>(null)
  const [expandedInfo, setExpandedInfo] = useState(false)

  // Form state para etapa
  const [etapaForm, setEtapaForm] = useState({
    nome: '',
    descricao: '',
    unidadeId: 'none',
    prazoDiasNormal: 15,
    prazoDiasUrgencia: 5,
    requerParecer: false,
    habilitaPauta: false,
    ehEtapaFinal: false,
    condicional: false,
    tipoCondicao: 'SEMPRE',
    condicaoConfig: {} as Record<string, unknown>
  })

  // Carregar fluxo e unidades
  const loadData = useCallback(async () => {
    try {
      setLoading(true)

      // Carregar unidades
      const unidadesRes = await fetch('/api/admin/configuracoes/unidades-tramitacao')
      const unidadesData = await unidadesRes.json()
      if (unidadesData.success) {
        setUnidades(unidadesData.data.filter((u: TramitacaoUnidade) => u.ativo))
      }

      // Carregar fluxo para o tipo de proposicao
      const fluxoRes = await fetch(`/api/admin/configuracoes/fluxos-tramitacao?tipoProposicao=${tipoProposicao}`)
      const fluxoData = await fluxoRes.json()

      if (fluxoData.success && fluxoData.data) {
        setFluxo(fluxoData.data)
      } else {
        // Fluxo nao existe - sera criado ao adicionar primeira etapa
        setFluxo(null)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados do fluxo')
    } finally {
      setLoading(false)
    }
  }, [tipoProposicao])

  useEffect(() => {
    if (tipoProposicao) {
      loadData()
    }
  }, [tipoProposicao, loadData])

  // Criar fluxo se nao existir
  const criarFluxo = async (): Promise<string | null> => {
    try {
      const response = await fetch('/api/admin/configuracoes/fluxos-tramitacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipoProposicao,
          nome: `Fluxo ${nomeTipo || tipoProposicao}`,
          descricao: `Fluxo de tramitacao para ${nomeTipo || tipoProposicao}`,
          ativo: true
        })
      })

      const result = await response.json()

      if (result.success) {
        setFluxo(result.data)
        return result.data.id
      } else {
        throw new Error(result.error || 'Erro ao criar fluxo')
      }
    } catch (error) {
      console.error('Erro ao criar fluxo:', error)
      toast.error('Erro ao criar fluxo de tramitacao')
      return null
    }
  }

  // Abrir modal para nova etapa
  const handleNovaEtapa = () => {
    setEditingEtapa(null)
    setEtapaForm({
      nome: '',
      descricao: '',
      unidadeId: 'none',
      prazoDiasNormal: 15,
      prazoDiasUrgencia: 5,
      requerParecer: false,
      habilitaPauta: false,
      ehEtapaFinal: false,
      condicional: false,
      tipoCondicao: 'SEMPRE',
      condicaoConfig: {}
    })
    setIsModalOpen(true)
  }

  // Abrir modal para editar etapa
  const handleEditarEtapa = (etapa: FluxoEtapa) => {
    setEditingEtapa(etapa)
    setEtapaForm({
      nome: etapa.nome,
      descricao: etapa.descricao || '',
      unidadeId: etapa.unidadeId || 'none',
      prazoDiasNormal: etapa.prazoDiasNormal,
      prazoDiasUrgencia: etapa.prazoDiasUrgencia || 5,
      requerParecer: etapa.requerParecer,
      habilitaPauta: etapa.habilitaPauta,
      ehEtapaFinal: etapa.ehEtapaFinal,
      condicional: etapa.condicional,
      tipoCondicao: etapa.tipoCondicao || 'SEMPRE',
      condicaoConfig: etapa.condicaoConfig || {}
    })
    setIsModalOpen(true)
  }

  // Salvar etapa
  const handleSalvarEtapa = async () => {
    if (!etapaForm.nome.trim()) {
      toast.error('Nome da etapa e obrigatorio')
      return
    }

    try {
      setSaving(true)

      // Se nao tem fluxo, criar primeiro
      let fluxoId: string | undefined = fluxo?.id
      if (!fluxoId) {
        const novoFluxoId = await criarFluxo()
        if (!novoFluxoId) return
        fluxoId = novoFluxoId
      }

      const dados = {
        nome: etapaForm.nome,
        descricao: etapaForm.descricao || undefined,
        unidadeId: etapaForm.unidadeId && etapaForm.unidadeId !== 'none' ? etapaForm.unidadeId : undefined,
        prazoDiasNormal: etapaForm.prazoDiasNormal,
        prazoDiasUrgencia: etapaForm.prazoDiasUrgencia || undefined,
        requerParecer: etapaForm.requerParecer,
        habilitaPauta: etapaForm.habilitaPauta,
        ehEtapaFinal: etapaForm.ehEtapaFinal,
        condicional: etapaForm.condicional,
        tipoCondicao: etapaForm.condicional ? etapaForm.tipoCondicao : undefined,
        condicaoConfig: etapaForm.condicional && etapaForm.tipoCondicao === 'CAMPO_PERSONALIZADO'
          ? etapaForm.condicaoConfig
          : undefined
      }

      if (editingEtapa) {
        // Atualizar etapa existente
        const response = await fetch(`/api/admin/configuracoes/fluxos-tramitacao/${fluxoId}/etapas`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingEtapa.id, ...dados })
        })

        const result = await response.json()
        if (result.success) {
          toast.success('Etapa atualizada com sucesso')
        } else {
          throw new Error(result.error || 'Erro ao atualizar etapa')
        }
      } else {
        // Criar nova etapa
        const response = await fetch(`/api/admin/configuracoes/fluxos-tramitacao/${fluxoId}/etapas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dados)
        })

        const result = await response.json()
        if (result.success) {
          toast.success('Etapa adicionada com sucesso')
        } else {
          throw new Error(result.error || 'Erro ao adicionar etapa')
        }
      }

      setIsModalOpen(false)
      loadData()
      onSave?.()
    } catch (error) {
      console.error('Erro ao salvar etapa:', error)
      toast.error('Erro ao salvar etapa')
    } finally {
      setSaving(false)
    }
  }

  // Remover etapa
  const handleRemoverEtapa = async (etapa: FluxoEtapa) => {
    if (!confirm(`Tem certeza que deseja remover a etapa "${etapa.nome}"?`)) {
      return
    }

    try {
      setSaving(true)
      const response = await fetch(
        `/api/admin/configuracoes/fluxos-tramitacao/${etapa.fluxoId}/etapas?id=${etapa.id}`,
        { method: 'DELETE' }
      )

      const result = await response.json()
      if (result.success) {
        toast.success('Etapa removida com sucesso')
        loadData()
        onSave?.()
      } else {
        throw new Error(result.error || 'Erro ao remover etapa')
      }
    } catch (error) {
      console.error('Erro ao remover etapa:', error)
      toast.error('Erro ao remover etapa')
    } finally {
      setSaving(false)
    }
  }

  // Mover etapa (reordenar)
  const handleMoverEtapa = async (etapa: FluxoEtapa, direcao: 'up' | 'down') => {
    if (!fluxo) return

    const etapas = [...fluxo.etapas].sort((a, b) => a.ordem - b.ordem)
    const index = etapas.findIndex(e => e.id === etapa.id)

    if (direcao === 'up' && index === 0) return
    if (direcao === 'down' && index === etapas.length - 1) return

    // Trocar posicoes
    const novoIndex = direcao === 'up' ? index - 1 : index + 1
    const temp = etapas[index]
    etapas[index] = etapas[novoIndex]
    etapas[novoIndex] = temp

    // Nova ordem de IDs
    const novaOrdem = etapas.map(e => e.id)

    try {
      setSaving(true)
      const response = await fetch(`/api/admin/configuracoes/fluxos-tramitacao/${fluxo.id}/etapas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reordenar: true, novaOrdem })
      })

      const result = await response.json()
      if (result.success) {
        toast.success('Etapas reordenadas')
        loadData()
        onSave?.()
      } else {
        throw new Error(result.error || 'Erro ao reordenar etapas')
      }
    } catch (error) {
      console.error('Erro ao reordenar:', error)
      toast.error('Erro ao reordenar etapas')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  const etapas = fluxo?.etapas?.sort((a, b) => a.ordem - b.ordem) || []

  return (
    <div className="space-y-4">
      {/* Cabecalho com info */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Fluxo de Tramitacao</h3>
          <p className="text-sm text-gray-500">
            Configure as etapas de tramitacao para este tipo de proposicao
          </p>
        </div>
        <Button onClick={handleNovaEtapa} disabled={saving} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Adicionar Etapa
        </Button>
      </div>

      {/* Info expandivel */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="py-3 cursor-pointer" onClick={() => setExpandedInfo(!expandedInfo)}>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Como funciona o fluxo</span>
            {expandedInfo ? <ChevronDown className="h-4 w-4 text-blue-600 ml-auto" /> : <ChevronRight className="h-4 w-4 text-blue-600 ml-auto" />}
          </div>
        </CardHeader>
        {expandedInfo && (
          <CardContent className="pt-0 text-sm text-blue-700 space-y-2">
            <p>O fluxo define as etapas de tramitacao que uma proposicao deve seguir, desde sua criacao ate a votacao ou arquivamento.</p>
            <ul className="list-disc pl-4 space-y-1">
              <li><strong>Etapas obrigatorias:</strong> Todas as proposicoes passam por elas</li>
              <li><strong>Etapas condicionais:</strong> Sao puladas se a condicao nao for atendida (ex: analise financeira so para proposicoes com impacto orcamentario)</li>
              <li><strong>Habilita pauta:</strong> Marca a etapa em que a proposicao pode ser incluida na pauta de sessao</li>
              <li><strong>Etapa final:</strong> Indica o fim do fluxo de tramitacao</li>
            </ul>
          </CardContent>
        )}
      </Card>

      {/* Lista de etapas */}
      {etapas.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <div className="flex flex-col items-center gap-2">
              <FileCheck className="h-12 w-12 text-gray-300" />
              <p className="text-gray-500">Nenhuma etapa configurada</p>
              <p className="text-sm text-gray-400">
                Clique em &quot;Adicionar Etapa&quot; para configurar o fluxo de tramitacao
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {etapas.map((etapa, index) => (
            <Card key={etapa.id} className={`${etapa.condicional ? 'border-l-4 border-l-amber-400' : ''}`}>
              <CardContent className="py-3">
                <div className="flex items-start gap-3">
                  {/* Numero da etapa */}
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      etapa.ehEtapaFinal
                        ? 'bg-green-100 text-green-700'
                        : etapa.habilitaPauta
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                    }`}>
                      {index + 1}
                    </div>
                    {index < etapas.length - 1 && (
                      <div className="w-0.5 h-6 bg-gray-200 mt-1" />
                    )}
                  </div>

                  {/* Conteudo da etapa */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{etapa.nome}</span>
                          {etapa.condicional && (
                            <Badge variant="outline" className="text-amber-600 border-amber-400">
                              <Zap className="h-3 w-3 mr-1" />
                              Condicional
                            </Badge>
                          )}
                          {etapa.ehEtapaFinal && (
                            <Badge className="bg-green-100 text-green-700">
                              <Flag className="h-3 w-3 mr-1" />
                              Final
                            </Badge>
                          )}
                          {etapa.habilitaPauta && !etapa.ehEtapaFinal && (
                            <Badge className="bg-blue-100 text-blue-700">
                              Habilita Pauta
                            </Badge>
                          )}
                        </div>

                        {/* Info da etapa */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                          {etapa.unidade && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {etapa.unidade.sigla || etapa.unidade.nome}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {etapa.prazoDiasNormal} dias
                            {etapa.prazoDiasUrgencia && ` (${etapa.prazoDiasUrgencia}d urgencia)`}
                          </span>
                          {etapa.requerParecer && (
                            <span className="flex items-center gap-1">
                              <FileCheck className="h-3 w-3" />
                              Requer parecer
                            </span>
                          )}
                          {!etapa.condicional && (
                            <span className="flex items-center gap-1 text-gray-400">
                              <Lock className="h-3 w-3" />
                              Obrigatoria
                            </span>
                          )}
                        </div>

                        {/* Descricao da condicao */}
                        {etapa.condicional && etapa.tipoCondicao && (
                          <p className="text-xs text-amber-600 mt-1">
                            Condicao: {TIPOS_CONDICAO.find(t => t.value === etapa.tipoCondicao)?.label || etapa.tipoCondicao}
                          </p>
                        )}
                      </div>

                      {/* Acoes */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoverEtapa(etapa, 'up')}
                          disabled={index === 0 || saving}
                          className="h-8 w-8 p-0"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoverEtapa(etapa, 'down')}
                          disabled={index === etapas.length - 1 || saving}
                          className="h-8 w-8 p-0"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditarEtapa(etapa)}
                          disabled={saving}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoverEtapa(etapa)}
                          disabled={saving}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de etapa */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEtapa ? 'Editar Etapa' : 'Nova Etapa'}
            </DialogTitle>
            <DialogDescription>
              Configure os detalhes da etapa de tramitacao
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Nome */}
            <div>
              <Label htmlFor="nome">Nome da Etapa *</Label>
              <Input
                id="nome"
                value={etapaForm.nome}
                onChange={(e) => setEtapaForm({ ...etapaForm, nome: e.target.value })}
                placeholder="Ex: Analise na Comissao de Justica"
              />
            </div>

            {/* Descricao */}
            <div>
              <Label htmlFor="descricao">Descricao</Label>
              <Textarea
                id="descricao"
                value={etapaForm.descricao}
                onChange={(e) => setEtapaForm({ ...etapaForm, descricao: e.target.value })}
                placeholder="Descricao detalhada da etapa"
                rows={2}
              />
            </div>

            {/* Orgao */}
            <div>
              <Label htmlFor="unidadeId">Orgao Responsavel</Label>
              <Select
                value={etapaForm.unidadeId}
                onValueChange={(value) => setEtapaForm({ ...etapaForm, unidadeId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o orgao" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {unidades
                    .filter((unidade) => unidade.id && unidade.id.trim() !== '')
                    .map((unidade) => (
                      <SelectItem key={unidade.id} value={unidade.id}>
                        {unidade.sigla ? `${unidade.sigla} - ${unidade.nome}` : unidade.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Prazos */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="prazoDiasNormal">Prazo Normal (dias)</Label>
                <Input
                  id="prazoDiasNormal"
                  type="number"
                  min={0}
                  value={etapaForm.prazoDiasNormal}
                  onChange={(e) => setEtapaForm({ ...etapaForm, prazoDiasNormal: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="prazoDiasUrgencia">Prazo Urgencia (dias)</Label>
                <Input
                  id="prazoDiasUrgencia"
                  type="number"
                  min={0}
                  value={etapaForm.prazoDiasUrgencia}
                  onChange={(e) => setEtapaForm({ ...etapaForm, prazoDiasUrgencia: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            {/* Separador de condicao */}
            <div className="border-t pt-4">
              <div className="flex items-center space-x-2 mb-4">
                <Switch
                  id="condicional"
                  checked={etapaForm.condicional}
                  onCheckedChange={(checked) => setEtapaForm({ ...etapaForm, condicional: checked })}
                />
                <Label htmlFor="condicional" className="font-medium">
                  Etapa condicional (pode ser pulada)
                </Label>
              </div>

              {etapaForm.condicional && (
                <div className="pl-6 space-y-3">
                  <div>
                    <Label htmlFor="tipoCondicao">Quando executar esta etapa</Label>
                    <Select
                      value={etapaForm.tipoCondicao}
                      onValueChange={(value) => setEtapaForm({ ...etapaForm, tipoCondicao: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS_CONDICAO.filter(t => t.value !== 'SEMPRE').map((tipo) => (
                          <SelectItem key={tipo.value} value={tipo.value}>
                            <div>
                              <span>{tipo.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      {TIPOS_CONDICAO.find(t => t.value === etapaForm.tipoCondicao)?.descricao}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Opcoes */}
            <div className="border-t pt-4 space-y-3">
              <Label className="font-medium">Opcoes</Label>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requerParecer"
                  checked={etapaForm.requerParecer}
                  onCheckedChange={(checked) => setEtapaForm({ ...etapaForm, requerParecer: checked === true })}
                />
                <Label htmlFor="requerParecer" className="text-sm">
                  Requer parecer antes de avancar
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="habilitaPauta"
                  checked={etapaForm.habilitaPauta}
                  onCheckedChange={(checked) => setEtapaForm({ ...etapaForm, habilitaPauta: checked === true })}
                />
                <Label htmlFor="habilitaPauta" className="text-sm">
                  Habilita inclusao na pauta de sessao
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ehEtapaFinal"
                  checked={etapaForm.ehEtapaFinal}
                  onCheckedChange={(checked) => setEtapaForm({ ...etapaForm, ehEtapaFinal: checked === true })}
                />
                <Label htmlFor="ehEtapaFinal" className="text-sm">
                  E a etapa final do fluxo
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSalvarEtapa} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {editingEtapa ? 'Atualizar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
