'use client'

import { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ClipboardList,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Loader2,
  FileText,
  GripVertical,
  Search,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Clock,
  BookOpen,
  Gavel,
  MessageSquare,
  Award,
  MoreHorizontal,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { usePauta } from '@/lib/hooks/use-pauta'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { PautaItemApi, PautaSugestaoApi } from '@/lib/api/pauta-api'

interface PautaEditorProps {
  sessaoId: string
  readOnly?: boolean
  onClose?: () => void
}

const SECOES = [
  { value: 'EXPEDIENTE', label: 'Expediente', icon: BookOpen, color: 'bg-blue-100 text-blue-700' },
  { value: 'ORDEM_DO_DIA', label: 'Ordem do Dia', icon: Gavel, color: 'bg-purple-100 text-purple-700' },
  { value: 'COMUNICACOES', label: 'Comunicações', icon: MessageSquare, color: 'bg-green-100 text-green-700' },
  { value: 'HONRAS', label: 'Honras', icon: Award, color: 'bg-amber-100 text-amber-700' },
  { value: 'OUTROS', label: 'Outros', icon: MoreHorizontal, color: 'bg-gray-100 text-gray-700' }
]

const TIPOS_ACAO = [
  { value: 'LEITURA', label: 'Leitura' },
  { value: 'DISCUSSAO', label: 'Discussão' },
  { value: 'VOTACAO', label: 'Votação' },
  { value: 'COMUNICADO', label: 'Comunicado' },
  { value: 'HOMENAGEM', label: 'Homenagem' }
]

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  'PENDENTE': { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Pendente' },
  'EM_DISCUSSAO': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Em Discussão' },
  'EM_VOTACAO': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Em Votação' },
  'APROVADO': { bg: 'bg-green-100', text: 'text-green-700', label: 'Aprovado' },
  'REJEITADO': { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejeitado' },
  'ADIADO': { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Adiado' },
  'RETIRADO': { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Retirado' },
  'CONCLUIDO': { bg: 'bg-green-100', text: 'text-green-700', label: 'Concluído' },
  'VISTA': { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Vista' }
}

interface ItemFormData {
  id?: string
  secao: string
  titulo: string
  descricao: string
  proposicaoId?: string
  tempoEstimado?: number
  tipoAcao: string
}

const defaultFormData: ItemFormData = {
  secao: 'ORDEM_DO_DIA',
  titulo: '',
  descricao: '',
  tipoAcao: 'VOTACAO',
  tempoEstimado: 15
}

export function PautaEditor({ sessaoId, readOnly = false, onClose }: PautaEditorProps) {
  const {
    pauta,
    loading,
    refreshing,
    refetch,
    addItem,
    updateItem,
    removeItem,
    suggestions,
    loadingSuggestions,
    addSuggestionAsItem
  } = usePauta(sessaoId)

  const [editingItem, setEditingItem] = useState<PautaItemApi | null>(null)
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [formData, setFormData] = useState<ItemFormData>(defaultFormData)
  const [saving, setSaving] = useState(false)
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<PautaItemApi | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['ORDEM_DO_DIA', 'EXPEDIENTE']))

  // Agrupar itens por seção
  const itensPorSecao = pauta?.itens?.reduce((acc, item) => {
    const secao = item.secao || 'OUTROS'
    if (!acc[secao]) acc[secao] = []
    acc[secao].push(item)
    return acc
  }, {} as Record<string, PautaItemApi[]>) || {}

  // Garantir que suggestions seja um array antes de filtrar
  const suggestionsArray = Array.isArray(suggestions) ? suggestions : []

  // Filtrar sugestões
  const filteredSuggestions = suggestionsArray.filter(s =>
    !searchTerm ||
    s.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.proposicao?.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleSection = (secao: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(secao)) {
      newExpanded.delete(secao)
    } else {
      newExpanded.add(secao)
    }
    setExpandedSections(newExpanded)
  }

  const handleEditItem = (item: PautaItemApi) => {
    setEditingItem(item)
    setFormData({
      id: item.id,
      secao: item.secao,
      titulo: item.titulo,
      descricao: item.descricao || '',
      proposicaoId: item.proposicaoId || undefined,
      tempoEstimado: item.tempoEstimado || 15,
      tipoAcao: item.tipoAcao || 'VOTACAO'
    })
    setIsAddingItem(false)
  }

  const handleAddItem = (secao?: string) => {
    setEditingItem(null)
    setFormData({
      ...defaultFormData,
      secao: secao || 'ORDEM_DO_DIA'
    })
    setIsAddingItem(true)
  }

  const handleCancelEdit = () => {
    setEditingItem(null)
    setIsAddingItem(false)
    setFormData(defaultFormData)
  }

  const handleSaveItem = async () => {
    if (!formData.titulo.trim()) {
      toast.error('O título é obrigatório')
      return
    }

    if (formData.titulo.length > 500) {
      toast.error('O título deve ter no máximo 500 caracteres')
      return
    }

    if (formData.tempoEstimado !== undefined && formData.tempoEstimado < 0) {
      toast.error('O tempo estimado não pode ser negativo')
      return
    }

    if (!formData.secao) {
      toast.error('Selecione uma seção')
      return
    }

    setSaving(true)
    try {
      if (editingItem) {
        await updateItem(editingItem.id, {
          secao: formData.secao as any,
          titulo: formData.titulo,
          descricao: formData.descricao || undefined,
          tempoEstimado: formData.tempoEstimado,
          tipoAcao: formData.tipoAcao as any
        })
      } else {
        await addItem({
          secao: formData.secao,
          titulo: formData.titulo,
          descricao: formData.descricao || undefined,
          tempoEstimado: formData.tempoEstimado,
          tipoAcao: formData.tipoAcao as any,
          proposicaoId: formData.proposicaoId
        })
      }
      handleCancelEdit()
    } catch (error) {
      console.error('Erro ao salvar item:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar item da pauta')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteItem = (item: PautaItemApi) => {
    setItemToDelete(item)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    if (!itemToDelete) return

    setDeletingItemId(itemToDelete.id)
    try {
      await removeItem(itemToDelete.id)
      setShowDeleteConfirm(false)
      setItemToDelete(null)
    } catch (error) {
      console.error('Erro ao remover item:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao remover item da pauta')
    } finally {
      setDeletingItemId(null)
    }
  }

  const handleAddSuggestion = async (suggestion: PautaSugestaoApi) => {
    await addSuggestionAsItem(suggestion)
    setShowSuggestions(false)
  }

  const getSecaoConfig = (secao: string) => {
    return SECOES.find(s => s.value === secao) || SECOES[4]
  }

  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG['PENDENTE']
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Carregando pauta...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header com ações */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-purple-600" />
          <h3 className="font-semibold text-lg">Editar Pauta da Sessão</h3>
          {pauta && (
            <Badge variant="outline" className="ml-2">
              {pauta.itens?.length || 0} {(pauta.itens?.length || 0) === 1 ? 'item' : 'itens'}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!readOnly && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSuggestions(true)}
                disabled={suggestionsArray.length === 0}
              >
                <Search className="h-4 w-4 mr-1" />
                Proposições ({suggestionsArray.length})
              </Button>
              <Button
                size="sm"
                onClick={() => handleAddItem()}
              >
                <Plus className="h-4 w-4 mr-1" />
                Novo Item
              </Button>
            </>
          )}
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Form de edição/adição inline */}
      {(isAddingItem || editingItem) && (
        <Card className="border-2 border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {editingItem ? 'Editar Item' : 'Novo Item da Pauta'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Seção *</Label>
                <Select
                  value={formData.secao}
                  onValueChange={(value) => setFormData({ ...formData, secao: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SECOES.map(secao => (
                      <SelectItem key={secao.value} value={secao.value}>
                        <div className="flex items-center gap-2">
                          <secao.icon className="h-4 w-4" />
                          {secao.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tipo de Ação</Label>
                <Select
                  value={formData.tipoAcao}
                  onValueChange={(value) => setFormData({ ...formData, tipoAcao: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_ACAO.map(tipo => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tempo Estimado (min)</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.tempoEstimado || ''}
                  onChange={(e) => setFormData({ ...formData, tempoEstimado: parseInt(e.target.value) || undefined })}
                />
              </div>
            </div>

            <div>
              <Label>Título *</Label>
              <Input
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Ex: Leitura de correspondências"
              />
            </div>

            <div>
              <Label>Descrição</Label>
              <Textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descrição adicional do item..."
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={handleCancelEdit} disabled={saving}>
                <X className="h-4 w-4 mr-1" />
                Cancelar
              </Button>
              <Button onClick={handleSaveItem} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                {editingItem ? 'Salvar Alterações' : 'Adicionar Item'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de itens por seção */}
      {pauta?.itens && pauta.itens.length > 0 ? (
        <div className="space-y-3">
          {SECOES.map(secao => {
            const itens = itensPorSecao[secao.value] || []
            if (itens.length === 0) return null

            const isExpanded = expandedSections.has(secao.value)
            const SecaoIcon = secao.icon

            return (
              <Card key={secao.value} className="overflow-hidden">
                <div
                  className={cn(
                    'flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50',
                    secao.color.split(' ')[0]
                  )}
                  onClick={() => toggleSection(secao.value)}
                >
                  <div className="flex items-center gap-2">
                    <SecaoIcon className="h-4 w-4" />
                    <span className="font-medium">{secao.label}</span>
                    <Badge variant="secondary" className="text-xs">
                      {itens.length}
                    </Badge>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>

                {isExpanded && (
                  <CardContent className="pt-0 pb-2">
                    <div className="space-y-2">
                      {itens.map((item, index) => {
                        const statusConfig = getStatusConfig(item.status)
                        const isBeingDeleted = deletingItemId === item.id

                        return (
                          <div
                            key={item.id}
                            className={cn(
                              'flex items-start gap-3 p-3 rounded-lg border bg-white hover:bg-gray-50 transition-colors',
                              editingItem?.id === item.id && 'border-blue-300 bg-blue-50'
                            )}
                          >
                            <div className="flex items-center gap-2 text-gray-400 pt-1">
                              <GripVertical className="h-4 w-4" />
                              <span className="text-xs font-medium w-5">{index + 1}.</span>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 truncate">
                                    {item.titulo}
                                  </p>
                                  {item.proposicao && (
                                    <p className="text-sm text-gray-600 mt-0.5">
                                      <FileText className="h-3 w-3 inline mr-1" />
                                      {item.proposicao.tipo} {item.proposicao.numero}/{item.proposicao.ano}
                                      {item.proposicao.ementa && (
                                        <span className="text-gray-400 ml-1">
                                          - {item.proposicao.ementa.substring(0, 50)}...
                                        </span>
                                      )}
                                    </p>
                                  )}
                                  {item.descricao && !item.proposicao && (
                                    <p className="text-sm text-gray-500 mt-0.5 truncate">
                                      {item.descricao}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 mt-2">
                                    <Badge className={cn(statusConfig.bg, statusConfig.text, 'text-xs')}>
                                      {statusConfig.label}
                                    </Badge>
                                    {item.tipoAcao && (
                                      <Badge variant="outline" className="text-xs">
                                        {TIPOS_ACAO.find(t => t.value === item.tipoAcao)?.label || item.tipoAcao}
                                      </Badge>
                                    )}
                                    {item.tempoEstimado && (
                                      <span className="text-xs text-gray-400 flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {item.tempoEstimado}min
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {!readOnly && (
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleEditItem(item)
                                      }}
                                      disabled={isBeingDeleted}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDeleteItem(item)
                                      }}
                                      disabled={isBeingDeleted}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      {isBeingDeleted ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Trash2 className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}

                      {!readOnly && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-gray-500 hover:text-gray-700"
                          onClick={() => handleAddItem(secao.value)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Adicionar item em {secao.label}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <ClipboardList className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Nenhum item na pauta</p>
            {!readOnly && (
              <Button
                variant="link"
                className="mt-2"
                onClick={() => handleAddItem()}
              >
                Adicionar primeiro item
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog para selecionar proposições */}
      <Dialog open={showSuggestions} onOpenChange={setShowSuggestions}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Adicionar Proposição à Pauta
            </DialogTitle>
            <DialogDescription>
              Selecione uma proposição disponível para incluir na pauta da sessão
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar proposições..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2">
              {loadingSuggestions ? (
                <div className="flex items-center justify-center py-8 text-gray-500">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span>Carregando proposições...</span>
                </div>
              ) : filteredSuggestions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>Nenhuma proposição disponível</p>
                  <p className="text-sm">Todas as proposições já foram adicionadas à pauta</p>
                </div>
              ) : (
                filteredSuggestions.map(suggestion => (
                  <div
                    key={suggestion.id}
                    className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleAddSuggestion(suggestion)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">
                            {suggestion.titulo}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {getSecaoConfig(suggestion.secao).label}
                          </Badge>
                        </div>
                        {suggestion.proposicao && (
                          <p className="text-sm text-gray-600">
                            {suggestion.proposicao.tipo} {suggestion.proposicao.numero}/{suggestion.proposicao.ano}
                            {suggestion.proposicao.titulo && (
                              <span className="text-gray-400 block mt-0.5">
                                {suggestion.proposicao.titulo.substring(0, 100)}...
                              </span>
                            )}
                          </p>
                        )}
                        {suggestion.descricao && (
                          <p className="text-sm text-gray-500">{suggestion.descricao}</p>
                        )}
                      </div>
                      <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSuggestions(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover este item da pauta?
            </DialogDescription>
          </DialogHeader>

          {itemToDelete && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium">{itemToDelete.titulo}</p>
              {itemToDelete.proposicao && (
                <p className="text-sm text-gray-600 mt-1">
                  {itemToDelete.proposicao.tipo} {itemToDelete.proposicao.numero}/{itemToDelete.proposicao.ano}
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteConfirm(false)
                setItemToDelete(null)
              }}
              disabled={!!deletingItemId}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={!!deletingItemId}
            >
              {deletingItemId ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-1" />
              )}
              Remover Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
