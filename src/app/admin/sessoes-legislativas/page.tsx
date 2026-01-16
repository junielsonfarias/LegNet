'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Calendar, Clock, MapPin, Users, FileText, Plus, Search, Edit, Trash2, Eye, Monitor, Loader2, ChevronUp, ChevronDown, Layers, Lightbulb } from 'lucide-react'
import { useParlamentares } from '@/lib/hooks/use-parlamentares'
import { useSessoes } from '@/lib/hooks/use-sessoes'
import { useLegislaturas } from '@/lib/hooks/use-legislaturas'
import { usePeriodosLegislatura } from '@/lib/hooks/use-periodos-legislatura'
import { usePauta } from '@/lib/hooks/use-pauta'
import { useProposicoes } from '@/lib/hooks/use-proposicoes'
import { useSessaoTemplates } from '@/lib/hooks/use-sessao-templates'
import type { PautaSugestaoApi } from '@/lib/api/pauta-api'
import { cn } from '@/lib/utils'
import type { PautaItemApi } from '@/lib/api/pauta-api'
import { toast } from 'sonner'

const PAUTA_SECOES = [
  { value: 'EXPEDIENTE', label: 'Expediente' },
  { value: 'ORDEM_DO_DIA', label: 'Ordem do Dia' },
  { value: 'COMUNICACOES', label: 'Comunicações' },
  { value: 'HONRAS', label: 'Homenagens e Honras' },
  { value: 'OUTROS', label: 'Outros Assuntos' }
]

const PAUTA_ITEM_STATUS_OPTIONS = [
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'EM_DISCUSSAO', label: 'Em Discussão' },
  { value: 'APROVADO', label: 'Aprovado' },
  { value: 'REJEITADO', label: 'Rejeitado' },
  { value: 'RETIRADO', label: 'Retirado' },
  { value: 'ADIADO', label: 'Adiado' }
]

const PAUTA_STATUS_LABELS: Record<string, string> = {
  PENDENTE: 'Pendente',
  EM_DISCUSSAO: 'Em discussão',
  APROVADO: 'Aprovado',
  REJEITADO: 'Rejeitado',
  RETIRADO: 'Retirado',
  ADIADO: 'Adiado'
}

const STATUS_BADGES: Record<string, string> = {
  PENDENTE: 'bg-yellow-100 text-yellow-800',
  EM_DISCUSSAO: 'bg-blue-100 text-blue-800',
  APROVADO: 'bg-green-100 text-green-800',
  REJEITADO: 'bg-red-100 text-red-800',
  RETIRADO: 'bg-gray-100 text-gray-600',
  ADIADO: 'bg-purple-100 text-purple-800',
  DEFAULT: 'bg-gray-100 text-gray-600'
}

export default function SessoesLegislativasPage() {
  const router = useRouter()
  
  // Usar hooks para carregar dados
  const { parlamentares } = useParlamentares()
  const { sessoes: sessoesApi, loading: loadingSessoes, create, update: updateSessao, remove: removeSessao, refetch: refetchSessoes } = useSessoes()
  const { legislaturas } = useLegislaturas({ ativa: true })
  const legislaturaAtiva = legislaturas.find(l => l.ativa) || legislaturas[0]
  const { periodos } = usePeriodosLegislatura(legislaturaAtiva?.id)
  const { proposicoes } = useProposicoes()
  const [sessoes, setSessoes] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isPautaModalOpen, setIsPautaModalOpen] = useState(false)
  const [editingSessao, setEditingSessao] = useState<any | null>(null)
  const [viewingSessao, setViewingSessao] = useState<any | null>(null)
  const [selectedSessaoForPauta, setSelectedSessaoForPauta] = useState<any | null>(null)
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const [sessaoTemplateTarget, setSessaoTemplateTarget] = useState<any | null>(null)
  const [templateMode, setTemplateMode] = useState<'REPLACE' | 'APPEND'>('REPLACE')
  const [templateSearch, setTemplateSearch] = useState('')
  const [templateApplyingId, setTemplateApplyingId] = useState<string | null>(null)
  const [suggestionApplyingId, setSuggestionApplyingId] = useState<string | null>(null)
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)
  const [draggedSection, setDraggedSection] = useState<string | null>(null)
  const [dropTargetSection, setDropTargetSection] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('TODOS')
  const [tipoFilter, setTipoFilter] = useState('TODOS')
  const [formData, setFormData] = useState<{
    numero: string
    tipo: 'ORDINARIA' | 'EXTRAORDINARIA' | 'SOLENE' | 'ESPECIAL'
    data: string
    horario: string
    local: string
    descricao: string
    finalizada: boolean
    status: 'AGENDADA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA'
  }>({
    numero: '',
    tipo: 'ORDINARIA',
    data: '',
    horario: '14:00',
    local: 'Plenário da Câmara Municipal',
    descricao: '',
    finalizada: false,
    status: 'AGENDADA'
  })
  const [newPautaItem, setNewPautaItem] = useState({
    secao: 'EXPEDIENTE',
    titulo: '',
    descricao: '',
    tempoEstimado: '',
    proposicaoId: ''
  })

  const { templates: templatesSessao, loading: loadingTemplates } = useSessaoTemplates({ ativo: true })

  const {
  pauta: pautaSessao,
  loading: loadingPauta,
  refreshing: refreshingPauta,
    refetch: refetchPauta,
  addItem: addPautaItem,
  updateItem: updatePautaItem,
    removeItem: removePautaItem,
    applyTemplate: applyTemplateToPauta,
    suggestions: pautaSugestoes,
    loadingSuggestions,
    refetchSuggestions,
    addSuggestionAsItem
} = usePauta(selectedSessaoForPauta?.id)

  // Sincronizar sessoes da API com estado local
  useEffect(() => {
    if (sessoesApi && Array.isArray(sessoesApi)) {
      setSessoes(sessoesApi.map(s => {
        return {
          ...s,
          // Campos para compatibilidade com código existente
          titulo: `${s.numero}ª Sessão ${s.tipo}`,
          dataHora: s.data || new Date().toISOString(),
          pautaSessao: s.pautaSessao || null
        }
      }))
    } else {
      setSessoes([])
    }
  }, [sessoesApi])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validação de campos obrigatórios
    if (!formData.data || !formData.local) {
      toast.error('Por favor, preencha todos os campos obrigatórios (Data e Local)')
      return
    }
    
    // Combinar data e horário
    const dataHora = `${formData.data}T${formData.horario}:00`
    const dataSessao = new Date(dataHora)
    
    // Validação de data: se não for finalizada, deve ser futura
    if (!formData.finalizada) {
      const agora = new Date()
      if (dataSessao <= agora) {
        toast.error('A data e hora da sessão deve ser futura para sessões não finalizadas')
        return
      }
    }
    
    try {
      if (editingSessao) {
        // Edição - usar API
        const updated = await updateSessao(editingSessao.id, {
          numero: formData.numero ? parseInt(formData.numero) : undefined,
          tipo: formData.tipo,
          data: dataHora,
          horario: formData.horario,
          local: formData.local,
          status: formData.status,
          descricao: formData.descricao || undefined,
          finalizada: formData.finalizada
        })
        
        if (updated) {
          toast.success('Sessão atualizada com sucesso!')
        } else {
          toast.error('Erro ao atualizar sessão')
          return
        }
      } else {
        // Criação - usar API
        // O número será calculado automaticamente pela API se não fornecido
        console.log('📤 Criando sessão:', {
          tipo: formData.tipo,
          data: dataHora,
          horario: formData.horario,
          local: formData.local,
          finalizada: formData.finalizada
        })
        
        const novaSessao = await create({
          numero: formData.numero ? parseInt(formData.numero) : undefined, // Será calculado automaticamente
          tipo: formData.tipo,
          data: dataHora,
          horario: formData.horario,
          local: formData.local,
          status: formData.finalizada ? 'CONCLUIDA' : 'AGENDADA',
          descricao: formData.descricao || undefined,
          finalizada: formData.finalizada
        })
        
        if (novaSessao) {
          console.log('✅ Sessão criada com sucesso:', novaSessao.id)
          toast.success(
            `Sessão ${novaSessao.numero}ª ${formData.tipo} criada com sucesso!${
              novaSessao.legislatura ? ` (Legislatura ${novaSessao.legislatura.numero}ª)` : ''
            }${
              novaSessao.periodo ? ` - Período ${novaSessao.periodo.numero}º` : ''
            }`
          )
        } else {
          console.error('❌ create retornou null')
          toast.error('Erro ao criar sessão')
          return
        }
      }

      handleClose()
    } catch (error) {
      console.error('❌ Erro ao salvar sessão:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro ao salvar a sessão. Tente novamente.'
      toast.error(errorMessage)
    }
  }

  const handleEdit = (sessao: any) => {
    setEditingSessao(sessao)
    const dataHora = sessao.data ? new Date(sessao.data) : new Date()
    const dataFormatada = dataHora.toISOString().split('T')[0]
    const horarioFormatado = sessao.horario || dataHora.toTimeString().slice(0, 5)
    
    setFormData({
      numero: sessao.numero?.toString() || '',
      tipo: sessao.tipo as any,
      data: dataFormatada,
      horario: horarioFormatado,
      local: sessao.local || 'Plenário da Câmara Municipal',
      descricao: sessao.descricao || '',
      finalizada: sessao.finalizada || false,
      status: sessao.status || 'AGENDADA'
    })
    setIsModalOpen(true)
  }

  const handleView = (sessao: any) => {
    setViewingSessao(sessao)
    setIsViewModalOpen(true)
  }

  const handleClose = () => {
    setIsModalOpen(false)
    setEditingSessao(null)
    setFormData({
      numero: '',
      tipo: 'ORDINARIA',
      data: '',
      horario: '14:00',
      local: 'Plenário da Câmara Municipal',
      descricao: '',
      finalizada: false,
      status: 'AGENDADA'
    })
  }

  const handleCloseView = () => {
    setIsViewModalOpen(false)
    setViewingSessao(null)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta sessão?')) {
      try {
        // Usar o hook para excluir via API
        const sucesso = await removeSessao(id)
        if (sucesso) {
          toast.success('Sessão excluída com sucesso!')
        } else {
          toast.error('Erro ao excluir a sessão')
        }
      } catch (error) {
        console.error('Erro ao excluir sessão:', error)
        toast.error('Erro ao excluir a sessão. Tente novamente.')
      }
    }
  }

  const handleManagePauta = (sessao: any) => {
    setSelectedSessaoForPauta(sessao)
    setIsPautaModalOpen(true)
  }

  const handleClosePauta = () => {
    setIsPautaModalOpen(false)
    setSelectedSessaoForPauta(null)
    setNewPautaItem(prev => ({ ...prev, titulo: '', descricao: '', tempoEstimado: '', proposicaoId: '' }))
  }

  const groupedSections = useMemo(() => {
    if (!pautaSessao) return []
    return PAUTA_SECOES.map(section => ({
      ...section,
      items: pautaSessao.itens
        .filter(item => item.secao === section.value)
        .sort((a, b) => a.ordem - b.ordem)
    }))
  }, [pautaSessao])

  const filteredTemplatesSessao = useMemo(() => {
    const term = templateSearch.trim().toLowerCase()
    return templatesSessao
      .filter(template => {
        if (!sessaoTemplateTarget) return true
        return template.tipo === sessaoTemplateTarget.tipo
      })
      .filter(template => {
        if (term === '') return true
        const nomeMatch = template.nome.toLowerCase().includes(term)
        const descricaoMatch = (template.descricao || '').toLowerCase().includes(term)
        return nomeMatch || descricaoMatch
      })
  }, [templatesSessao, templateSearch, sessaoTemplateTarget])

  const handleAddPautaItem = async () => {
    if (!selectedSessaoForPauta) return
    if (!newPautaItem.titulo.trim()) {
      toast.error('Informe o título do item da pauta')
      return
    }

    await addPautaItem({
      secao: newPautaItem.secao,
      titulo: newPautaItem.titulo.trim(),
      descricao: newPautaItem.descricao.trim() ? newPautaItem.descricao.trim() : undefined,
      tempoEstimado: newPautaItem.tempoEstimado ? Number(newPautaItem.tempoEstimado) : undefined,
      proposicaoId: newPautaItem.proposicaoId || undefined
    })

    setNewPautaItem(prev => ({
      ...prev,
      titulo: '',
      descricao: '',
      tempoEstimado: '',
      proposicaoId: ''
    }))

    await refetchPauta()
  }

  const handleStatusChange = async (itemId: string, status: string) => {
    await updatePautaItem(itemId, { status })
    await refetchPauta()
  }

  const handleMoveItem = async (item: PautaItemApi, direction: 'up' | 'down', totalInSection: number) => {
    const newOrder = direction === 'up' ? item.ordem - 1 : item.ordem + 1
    if (newOrder < 1 || newOrder > totalInSection) return
    await updatePautaItem(item.id, { ordem: newOrder })
    await refetchPauta()
  }

  const handleRemoveItem = async (itemId: string) => {
    await removePautaItem(itemId)
    await refetchPauta()
  }

  const handleOpenTemplateModal = (sessao: any) => {
    setSelectedSessaoForPauta(sessao)
    setSessaoTemplateTarget(sessao)
    setTemplateMode('REPLACE')
    setTemplateSearch('')
    setIsTemplateModalOpen(true)
  }

  const handleCloseTemplateModal = () => {
    setIsTemplateModalOpen(false)
    setSessaoTemplateTarget(null)
    setTemplateApplyingId(null)
    setSelectedSessaoForPauta(null)
  }

  const handleApplyTemplate = async (templateId: string) => {
    if (!sessaoTemplateTarget) {
      toast.error('Selecione uma sessão para aplicar o template')
      return
    }

    try {
      setTemplateApplyingId(templateId)
      await applyTemplateToPauta(templateId, templateMode)
      await refetchPauta()
      await refetchSessoes()
      handleCloseTemplateModal()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao aplicar template'
      toast.error(message)
    } finally {
      setTemplateApplyingId(null)
    }
  }

  const handleAddSuggestion = async (suggestion: PautaSugestaoApi) => {
    try {
      setSuggestionApplyingId(suggestion.id)
      await addSuggestionAsItem(suggestion)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao adicionar sugestão à pauta'
      toast.error(message)
    } finally {
      setSuggestionApplyingId(null)
    }
  }

  const handleDragStart = (item: PautaItemApi) => {
    setDraggedItemId(item.id)
    setDraggedSection(item.secao)
  }

  const handleDragEnd = () => {
    setDraggedItemId(null)
    setDraggedSection(null)
    setDropTargetSection(null)
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const handleDragOverSection = useCallback((sectionValue: string) => {
    if (!draggedItemId) return
    setDropTargetSection(sectionValue)
  }, [draggedItemId])

  const handleDragLeaveSection = () => {
    setDropTargetSection(null)
  }

  const reorderSection = async (
    sectionValue: string,
    orderedItems: Array<{ id: string; updateSection: boolean }>
  ) => {
    for (let index = 0; index < orderedItems.length; index += 1) {
      const { id, updateSection } = orderedItems[index]
      await updatePautaItem(id, {
        ordem: index + 1,
        ...(updateSection ? { secao: sectionValue } : {})
      })
    }
  }

  const handleDropOnItem = async (target: PautaItemApi, sectionValue: string) => {
    if (!draggedItemId || !pautaSessao) return

    const draggedItem = pautaSessao.itens.find(item => item.id === draggedItemId)
    if (!draggedItem) return

    const sameSection = draggedItem.secao === sectionValue
    const currentItems = pautaSessao.itens

    const targetSectionItems: PautaItemApi[] = currentItems
      .filter(item => item.secao === sectionValue && item.id !== draggedItemId)
      .sort((a, b) => a.ordem - b.ordem)

    const targetIndex = targetSectionItems.findIndex(item => item.id === target.id)
    targetSectionItems.splice(targetIndex, 0, { ...draggedItem, secao: sectionValue })

    if (!sameSection) {
      const previousSectionItems = currentItems
        .filter(item => item.secao === draggedItem.secao && item.id !== draggedItemId)
        .sort((a, b) => a.ordem - b.ordem)

      for (let index = 0; index < previousSectionItems.length; index += 1) {
        const id = previousSectionItems[index].id
        await updatePautaItem(id, { ordem: index + 1 })
      }
    }

    await reorderSection(
      sectionValue,
      targetSectionItems.map(item => ({
        id: item.id,
        updateSection: !sameSection && item.id === draggedItemId
      }))
    )
    handleDragEnd()
    setDropTargetSection(null)
  }

  const handleDropOnSectionEnd = async (sectionValue: string) => {
    if (!draggedItemId || !pautaSessao) return
    const draggedItem = pautaSessao.itens.find(item => item.id === draggedItemId)
    if (!draggedItem) return

    const sectionItems: PautaItemApi[] = pautaSessao.itens
      .filter(item => item.secao === sectionValue && item.id !== draggedItemId)
      .sort((a, b) => a.ordem - b.ordem)

    sectionItems.push({ ...draggedItem, secao: sectionValue })

    if (draggedItem.secao !== sectionValue) {
      const previousSectionItems = pautaSessao.itens
        .filter(item => item.secao === draggedItem.secao && item.id !== draggedItemId)
        .sort((a, b) => a.ordem - b.ordem)

      for (let index = 0; index < previousSectionItems.length; index += 1) {
        const id = previousSectionItems[index].id
        await updatePautaItem(id, { ordem: index + 1 })
      }
    }

    await reorderSection(
      sectionValue,
      sectionItems.map(item => ({
        id: item.id,
        updateSection: item.id === draggedItemId && draggedItem.secao !== sectionValue
      }))
    )
    handleDragEnd()
    setDropTargetSection(null)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      AGENDADA: { color: 'bg-blue-100 text-blue-800', label: 'Agendada' },
      EM_ANDAMENTO: { color: 'bg-yellow-100 text-yellow-800', label: 'Em Andamento' },
      CONCLUIDA: { color: 'bg-green-100 text-green-800', label: 'Concluída' },
      CANCELADA: { color: 'bg-red-100 text-red-800', label: 'Cancelada' },
      SUSPENSA: { color: 'bg-gray-100 text-gray-800', label: 'Suspensa' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.AGENDADA
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const getTipoBadge = (tipo: string) => {
    const tipoConfig = {
      ORDINARIA: { color: 'bg-green-100 text-green-800', label: 'Ordinária' },
      EXTRAORDINARIA: { color: 'bg-orange-100 text-orange-800', label: 'Extraordinária' },
      ESPECIAL: { color: 'bg-purple-100 text-purple-800', label: 'Especial' },
      SOLENE: { color: 'bg-blue-100 text-blue-800', label: 'Solenne' }
    }
    
    const config = tipoConfig[tipo as keyof typeof tipoConfig] || tipoConfig.ORDINARIA
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const filteredSessoes = (sessoes || []).filter(sessao => {
    if (!sessao) return false
    
    const matchesSearch = searchTerm === '' || 
      (sessao.titulo && typeof sessao.titulo === 'string' && sessao.titulo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (sessao.numero && sessao.numero.toString().toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === 'TODOS' || sessao.status === statusFilter
    const matchesTipo = tipoFilter === 'TODOS' || sessao.tipo === tipoFilter
    
    return matchesSearch && matchesStatus && matchesTipo
  })

  const getParlamentarNome = (id: string) => {
    const parlamentar = parlamentares.find(p => p.id === id)
    return parlamentar ? parlamentar.nome : 'Não encontrado'
  }

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime)
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sessões Legislativas</h1>
          <p className="text-gray-600">Gerencie as sessões legislativas da Câmara</p>
        </div>
        <Button 
          onClick={() => {
            if (!loadingSessoes && parlamentares.length > 0) {
              setIsModalOpen(true)
            } else {
              toast.error('Aguarde o carregamento dos dados ou cadastre parlamentares primeiro')
            }
          }} 
          className="flex items-center gap-2"
          disabled={loadingSessoes}
        >
          <Plus className="h-4 w-4" />
          Nova Sessão
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Buscar por título ou número..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <select 
                id="status"
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="TODOS">Todos</option>
                <option value="AGENDADA">Agendada</option>
                <option value="EM_ANDAMENTO">Em Andamento</option>
                <option value="CONCLUIDA">Concluída</option>
                <option value="CANCELADA">Cancelada</option>
                <option value="SUSPENSA">Suspensa</option>
              </select>
            </div>
            <div>
              <Label htmlFor="tipo">Tipo</Label>
              <select 
                id="tipo"
                value={tipoFilter} 
                onChange={(e) => setTipoFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="TODOS">Todos</option>
                <option value="ORDINARIA">Ordinária</option>
                <option value="EXTRAORDINARIA">Extraordinária</option>
                <option value="ESPECIAL">Especial</option>
                <option value="SOLENE">Solenne</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('TODOS')
                  setTipoFilter('TODOS')
                }}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Sessões */}
      {loadingSessoes ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">Carregando dados...</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredSessoes.map((sessao) => (
            <Card key={sessao.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {sessao.numero}ª Sessão {sessao.tipo}
                      {getStatusBadge(sessao.status)}
                      {getTipoBadge(sessao.tipo)}
                      {sessao.finalizada && (
                        <Badge className="bg-gray-100 text-gray-800">Finalizada</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {sessao.legislatura && (
                        <span className="mr-2">
                          Legislatura {sessao.legislatura.numero}ª ({sessao.legislatura.anoInicio}/{sessao.legislatura.anoFim})
                        </span>
                      )}
                      {sessao.periodo && (
                        <span className="mr-2">
                          - Período {sessao.periodo.numero}º
                        </span>
                      )}
                      {sessao.descricao && <span>{sessao.descricao}</span>}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => router.push(`/admin/painel-eletronico/${sessao.id}`)}
                      title="Abrir Painel Eletrônico"
                      className="bg-blue-50 hover:bg-blue-100 border-blue-200"
                    >
                      <Monitor className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenTemplateModal(sessao)}
                      title="Aplicar template de sessão"
                    >
                      <Layers className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleView(sessao)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleManagePauta(sessao)}>
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(sessao)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(sessao.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      {sessao.data ? new Date(sessao.data).toLocaleDateString('pt-BR') : 'N/A'}
                      {sessao.horario && ` às ${sessao.horario}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{sessao.local || 'Não informado'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      {sessao.horario || 'Não informado'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      {sessao.pautaSessao
                        ? `${sessao.pautaSessao.itens.length} ${sessao.pautaSessao.itens.length === 1 ? 'item' : 'itens'} na pauta${sessao.pautaSessao.tempoTotalEstimado ? ` • ${sessao.pautaSessao.tempoTotalEstimado} min` : ''}`
                        : 'Pauta não criada'}
                      {sessao.ata && ' • Ata disponível'}
                    </span>
                  </div>
                  {sessao.tempoInicio && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        Iniciada: {new Date(sessao.tempoInicio).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredSessoes.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">Nenhuma sessão encontrada</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Modal de Cadastro/Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {editingSessao ? 'Editar Sessão' : 'Nova Sessão Legislativa'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Informações da Legislatura e Período (somente leitura) */}
                {legislaturaAtiva && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-blue-700 font-semibold">Legislatura Atual</Label>
                        <p className="text-blue-900">
                          {legislaturaAtiva.numero}ª Legislatura ({legislaturaAtiva.anoInicio}/{legislaturaAtiva.anoFim})
                        </p>
                      </div>
                      {periodos && periodos.length > 0 && (
                        <div>
                          <Label className="text-blue-700 font-semibold">Período Atual</Label>
                          <p className="text-blue-900">
                            {periodos.find(p => {
                              const hoje = new Date()
                              const inicio = new Date(p.dataInicio)
                              const fim = p.dataFim ? new Date(p.dataFim) : null
                              return inicio <= hoje && (!fim || fim >= hoje)
                            })?.numero || periodos[0]?.numero || 'N/A'}º Período
                          </p>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-blue-600 mt-2">
                      A legislatura e período serão identificados automaticamente pela data da sessão
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tipo">Tipo de Sessão *</Label>
                    <select 
                      id="tipo"
                      value={formData.tipo} 
                      onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="ORDINARIA">Ordinária</option>
                      <option value="EXTRAORDINARIA">Extraordinária</option>
                      <option value="ESPECIAL">Especial</option>
                      <option value="SOLENE">Solenne</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="numero">Número da Sessão</Label>
                    <Input
                      id="numero"
                      type="number"
                      min="1"
                      value={formData.numero}
                      onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                      placeholder="Deixe em branco para calcular automaticamente"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.tipo === 'ORDINARIA' 
                        ? 'Será calculado automaticamente baseado na sequência de sessões ordinárias'
                        : 'Será calculado automaticamente se não informado'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="data">Data da Sessão *</Label>
                    <Input
                      id="data"
                      type="date"
                      value={formData.data}
                      onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="horario">Horário *</Label>
                    <Input
                      id="horario"
                      type="time"
                      value={formData.horario}
                      onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="local">Local *</Label>
                  <Input
                    id="local"
                    value={formData.local}
                    onChange={(e) => setFormData({ ...formData, local: e.target.value })}
                    placeholder="Ex: Plenário da Câmara Municipal"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Descrição da sessão..."
                    rows={3}
                  />
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <input
                      type="checkbox"
                      id="finalizada"
                      checked={formData.finalizada}
                      onChange={(e) => {
                        const finalizada = e.target.checked
                        setFormData({ 
                          ...formData, 
                          finalizada,
                          status: finalizada ? 'CONCLUIDA' : 'AGENDADA'
                        })
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Label htmlFor="finalizada" className="font-semibold">
                      Sessão já finalizada (para inclusão de dados pretéritos)
                    </Label>
                  </div>
                  {formData.finalizada && (
                    <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                      <p className="text-sm text-yellow-800">
                        <strong>Atenção:</strong> Ao marcar esta opção, você poderá inserir uma sessão com data anterior à data atual. 
                        A pauta será gerada automaticamente e, se a sessão estiver concluída, a ata será gerada automaticamente.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={handleClose}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingSessao ? 'Atualizar' : 'Criar'} Sessão
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Visualização Detalhada */}
      {isViewModalOpen && viewingSessao && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Detalhes da Sessão Legislativa</CardTitle>
                <Button variant="outline" onClick={handleCloseView}>
                  Fechar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Informações Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Número da Sessão</Label>
                  <p className="text-lg font-semibold">{viewingSessao.numero}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Título</Label>
                  <p className="text-lg font-semibold">{viewingSessao.titulo}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Tipo</Label>
                  <div className="mt-1">{getTipoBadge(viewingSessao.tipo)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <div className="mt-1">{getStatusBadge(viewingSessao.status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Data e Hora</Label>
                  <p className="text-lg">{formatDateTime(viewingSessao.dataHora)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Local</Label>
                  <p className="text-lg">{viewingSessao.local}</p>
                </div>
              </div>

              {/* Informações da Legislatura e Período */}
              {viewingSessao.legislatura && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Legislatura e Período</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Legislatura</Label>
                      <p className="text-lg">
                        {viewingSessao.legislatura.numero}ª ({viewingSessao.legislatura.anoInicio}/{viewingSessao.legislatura.anoFim})
                      </p>
                    </div>
                    {viewingSessao.periodo && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Período</Label>
                        <p className="text-lg">{viewingSessao.periodo.numero}º Período</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Pauta */}
              {viewingSessao.pauta && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Pauta da Sessão</h3>
                  {typeof viewingSessao.pauta === 'object' && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Expediente</Label>
                          <p className="text-lg">
                            {viewingSessao.pauta.expediente?.length || 0} itens
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Ordem do Dia</Label>
                          <p className="text-lg">
                            {viewingSessao.pauta.ordemDoDia?.length || 0} itens
                          </p>
                        </div>
                      </div>
                      {viewingSessao.pauta.observacoes && (
                        <div className="mt-3">
                          <Label className="text-sm font-medium text-gray-500">Observações</Label>
                          <p className="text-lg">{viewingSessao.pauta.observacoes}</p>
                        </div>
                      )}
                    </>
                  )}
                  {typeof viewingSessao.pauta === 'string' && (
                    <p className="text-gray-600">Pauta disponível (formato JSON)</p>
                  )}
                </div>
              )}

              {/* Descrição */}
              {viewingSessao.descricao && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Descrição</h3>
                  <p className="text-gray-700">{viewingSessao.descricao}</p>
                </div>
              )}

              {/* Ações */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={handleCloseView}>
                  Fechar
                </Button>
                <Button onClick={() => {
                  handleCloseView()
                  handleEdit(viewingSessao)
                }}>
                  Editar Sessão
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Aplicação de Template */}
      {isTemplateModalOpen && sessaoTemplateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-col gap-1 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold">
                  Aplicar template à pauta
                </CardTitle>
                <Button variant="outline" size="sm" onClick={handleCloseTemplateModal}>
                  Fechar
                </Button>
              </div>
              <CardDescription>
                Sessão {sessaoTemplateTarget.numero}ª {sessaoTemplateTarget.tipo} •{' '}
                {sessaoTemplateTarget.data ? new Date(sessaoTemplateTarget.data).toLocaleDateString('pt-BR') : 'Data não definida'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="flex flex-col gap-2 md:flex-row md:items-center">
                  <div>
                    <Label htmlFor="template-mode">Modo de aplicação</Label>
                    <select
                      id="template-mode"
                      value={templateMode}
                      onChange={(event) => setTemplateMode(event.target.value as 'REPLACE' | 'APPEND')}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 md:w-56"
                    >
                      <option value="REPLACE">Substituir itens existentes</option>
                      <option value="APPEND">Manter itens e adicionar ao final</option>
                    </select>
                  </div>
                  <p className="text-sm text-gray-500 md:pl-4">
                    Somente templates do tipo {sessaoTemplateTarget.tipo.toLowerCase()} serão exibidos.
                  </p>
                </div>
                <div className="w-full md:w-64">
                  <Label htmlFor="template-search">Buscar template</Label>
                  <Input
                    id="template-search"
                    placeholder="Buscar por nome ou descrição..."
                    value={templateSearch}
                    onChange={(event) => setTemplateSearch(event.target.value)}
                  />
                </div>
              </div>

              {loadingTemplates ? (
                <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-gray-200 p-6 text-sm text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando templates ativos...
                </div>
              ) : filteredTemplatesSessao.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-sm text-gray-600">
                  Nenhum template disponível para sessões {sessaoTemplateTarget.tipo.toLowerCase()} com os critérios informados.
                </div>
              ) : (
                <div className="grid gap-3">
                  {filteredTemplatesSessao.map((template) => (
                    <div key={template.id} className="rounded-lg border border-gray-200 p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-semibold text-gray-800">{template.nome}</h3>
                            <Badge className="bg-blue-50 text-blue-700">{template.itens.length} itens</Badge>
                            {template.duracaoEstimativa ? (
                              <Badge className="bg-purple-50 text-purple-700">
                                ≈ {template.duracaoEstimativa} min
                              </Badge>
                            ) : null}
                          </div>
                          {template.descricao && (
                            <p className="mt-1 max-w-3xl text-sm text-gray-600">{template.descricao}</p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => handleApplyTemplate(template.id)}
                          disabled={templateApplyingId === template.id}
                          className="flex items-center gap-2"
                        >
                          {templateApplyingId === template.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Layers className="h-4 w-4" />
                          )}
                          Aplicar template
                        </Button>
                      </div>
                      <div className="mt-3 grid gap-2 md:grid-cols-2">
                        {template.itens.slice(0, 4).map((item) => (
                          <div key={item.id} className="rounded-md border border-dashed border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-700">{item.titulo}</span>
                              <span className="text-xs uppercase text-gray-500">{item.secao.replace('_', ' ')}</span>
                            </div>
                            {item.descricao ? (
                              <p className="mt-1 text-xs text-gray-500">{item.descricao}</p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Gerenciamento de Pauta */}
      {isPautaModalOpen && selectedSessaoForPauta && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Gerenciar Pauta - {selectedSessaoForPauta.numero}</CardTitle>
                <Button variant="outline" onClick={handleClosePauta}>
                  Fechar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingPauta ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-600">
                  <Loader2 className="h-6 w-6 animate-spin mb-2" />
                  Carregando pauta da sessão...
                </div>
              ) : !pautaSessao ? (
                <div className="text-center py-10">
                  <p className="text-gray-500 mb-4">Nenhuma pauta encontrada para esta sessão.</p>
                  <p className="text-sm text-gray-400 mb-6">
                    Uma pauta inicial é gerada automaticamente quando a sessão é criada. Você pode adicionar itens manualmente abaixo.
                  </p>
                  <Button variant="outline" onClick={() => refetchPauta()}>
                    Atualizar Pauta
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Status</Label>
                      <p className="text-lg font-semibold">{pautaSessao.status}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Tempo Estimado</Label>
                      <p className="text-lg font-semibold">{pautaSessao.tempoTotalEstimado} min</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Total de Itens</Label>
                      <p className="text-lg font-semibold">{pautaSessao.itens.length}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Última atualização</Label>
                      <p className="text-lg font-semibold">{new Date(pautaSessao.updatedAt).toLocaleString('pt-BR')}</p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-2 text-blue-900">
                        <Lightbulb className="h-5 w-5" />
                        <div>
                          <h3 className="text-base font-semibold">Sugestões inteligentes</h3>
                          <p className="text-sm text-blue-800">
                            Proposições disponíveis para esta sessão. Adicione com um clique para compor a pauta.
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetchSuggestions()}
                        className="border-blue-200 text-blue-800 hover:bg-blue-100"
                      >
                        Atualizar sugestões
                      </Button>
                    </div>

                    {loadingSuggestions ? (
                      <div className="mt-4 flex items-center justify-center gap-2 rounded-md border border-dashed border-blue-200 bg-white/70 p-4 text-sm text-blue-800">
                        <Loader2 className="h-4 w-4 animate-spin" /> Buscando proposições recomendadas...
                      </div>
                    ) : pautaSugestoes.length === 0 ? (
                      <div className="mt-4 rounded-md border border-dashed border-blue-200 bg-white/70 p-4 text-sm text-blue-800">
                        Nenhuma sugestão disponível para esta sessão agora. Clique em &quot;Atualizar sugestões&quot; para verificar novamente.
                      </div>
                    ) : (
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {pautaSugestoes.map((sugestao) => (
                          <div key={sugestao.id} className="rounded-lg border border-blue-200 bg-white/80 p-4 shadow-sm">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm uppercase text-blue-700">{sugestao.secao.replace('_', ' ')}</p>
                                <h4 className="text-base font-semibold text-gray-900">{sugestao.titulo}</h4>
                              </div>
                              <Badge className="bg-blue-100 text-blue-800">{sugestao.prioridade}</Badge>
                            </div>
                            {sugestao.descricao ? (
                              <p className="mt-2 text-sm text-gray-600 line-clamp-3">{sugestao.descricao}</p>
                            ) : null}
                            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                              {sugestao.proposicao ? (
                                <span>
                                  Nº {sugestao.proposicao.numero}/{sugestao.proposicao.ano}
                                </span>
                              ) : null}
                              {sugestao.tempoEstimado ? (
                                <span>{sugestao.tempoEstimado} min</span>
                              ) : null}
                              {sugestao.proposicao?.autor ? (
                                <span>
                                  Autor: {sugestao.proposicao.autor.nome}
                                </span>
                              ) : null}
                            </div>
                            <div className="mt-4 flex items-center justify-between">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddSuggestion(sugestao)}
                                disabled={suggestionApplyingId === sugestao.id}
                                className="border-blue-200 text-blue-800 hover:bg-blue-100"
                              >
                                {suggestionApplyingId === sugestao.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Plus className="h-4 w-4 mr-1" />
                                )}
                                Adicionar à pauta
                              </Button>
                              {sugestao.proposicao ? (
                                <span className="text-xs text-blue-700">
                                  {sugestao.proposicao.tipo.replace('_', ' ')} • {sugestao.proposicao.status}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Adicionar item à pauta</h3>
                        <p className="text-sm text-gray-500">Preencha os campos abaixo para adicionar um novo item.</p>
                      </div>
                      {refreshingPauta && (
                        <span className="flex items-center text-xs text-gray-500">
                          <Loader2 className="h-4 w-4 animate-spin mr-1" /> Atualizando
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div className="space-y-2">
                        <Label>Seção</Label>
                        <select
                          value={newPautaItem.secao}
                          onChange={(event) => setNewPautaItem(prev => ({ ...prev, secao: event.target.value }))}
                          className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:border-camara-primary focus:outline-none"
                        >
                          {PAUTA_SECOES.map(secao => (
                            <option key={secao.value} value={secao.value}>{secao.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Título *</Label>
                        <Input
                          value={newPautaItem.titulo}
                          onChange={(event) => setNewPautaItem(prev => ({ ...prev, titulo: event.target.value }))}
                          placeholder="Título do item"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Tempo Estimado (min)</Label>
                        <Input
                          type="number"
                          min={0}
                          value={newPautaItem.tempoEstimado}
                          onChange={(event) => setNewPautaItem(prev => ({ ...prev, tempoEstimado: event.target.value }))}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Proposição</Label>
                        <select
                          value={newPautaItem.proposicaoId}
                          onChange={(event) => setNewPautaItem(prev => ({ ...prev, proposicaoId: event.target.value }))}
                          className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:border-camara-primary focus:outline-none"
                        >
                          <option value="">Sem proposição vinculada</option>
                          {proposicoes.map(proposicao => (
                            <option key={proposicao.id} value={proposicao.id}>
                              {proposicao.numero}/{proposicao.ano} - {proposicao.titulo}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição</Label>
                      <Textarea
                        value={newPautaItem.descricao}
                        onChange={(event) => setNewPautaItem(prev => ({ ...prev, descricao: event.target.value }))}
                        rows={3}
                        placeholder="Detalhes adicionais sobre o item da pauta"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setNewPautaItem({ ...newPautaItem, titulo: '', descricao: '', tempoEstimado: '', proposicaoId: '' })}
                      >
                        Limpar
                      </Button>
                      <Button type="button" onClick={handleAddPautaItem}>
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Item
                      </Button>
                    </div>
                  </div>

                  {groupedSections.map(section => (
                    <div key={section.value} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          {section.value === 'EXPEDIENTE' && <Clock className="h-5 w-5" />}
                          {section.value === 'ORDEM_DO_DIA' && <FileText className="h-5 w-5" />}
                          {section.label}
                          <Badge variant="outline">{section.items.length}</Badge>
                        </h3>
                      </div>

                      {section.items.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500">
                          Nenhum item cadastrado nesta seção.
                        </div>
                      ) : (
                        <div className="space-y-3" onDragOver={(event) => handleDragOver(event)}>
                          {section.items.map(item => (
                            <Card
                              key={item.id}
                              draggable
                              onDragStart={() => handleDragStart(item)}
                              onDragEnd={handleDragEnd}
                              onDragOver={(event) => {
                                handleDragOver(event)
                                handleDragOverSection(section.value)
                              }}
                              onDragLeave={handleDragLeaveSection}
                              onDrop={(event) => {
                                event.preventDefault()
                                handleDropOnItem(item, section.value)
                              }}
                              className={cn(
                                'p-4 border transition-colors duration-200 cursor-move',
                                draggedItemId === item.id
                                  ? 'border-blue-400 bg-blue-50 shadow-sm'
                                  : dropTargetSection === section.value
                                    ? 'border-blue-200 bg-blue-50/60'
                                    : 'border-gray-200'
                              )}
                              aria-grabbed={draggedItemId === item.id}
                              tabIndex={0}
                            >
                              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                <div className="flex-1 space-y-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="outline">#{item.ordem}</Badge>
                                    <Badge className={STATUS_BADGES[item.status] || STATUS_BADGES.DEFAULT}>{PAUTA_STATUS_LABELS[item.status] || item.status}</Badge>
                                    {item.tempoEstimado ? (
                                      <Badge variant="secondary">{item.tempoEstimado} min</Badge>
                                    ) : null}
                                    {item.proposicao && (
                                      <Badge variant="outline">{item.proposicao.numero}/{item.proposicao.ano}</Badge>
                                    )}
                                  </div>
                                  <h4 className="font-semibold text-gray-900 text-base">{item.titulo}</h4>
                                  {item.descricao && (
                                    <p className="text-sm text-gray-600">{item.descricao}</p>
                                  )}
                                  {item.proposicao && (
                                    <p className="text-xs text-gray-500">
                                      {item.proposicao.titulo}
                                    </p>
                                  )}
                                </div>
                                <div className="flex flex-col md:items-end gap-2">
                                  <select
                                    value={item.status}
                                    onChange={(event) => handleStatusChange(item.id, event.target.value)}
                                    className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs focus:border-camara-primary focus:outline-none"
                                  >
                                    {PAUTA_ITEM_STATUS_OPTIONS.map(option => (
                                      <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                  </select>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => handleMoveItem(item, 'up', section.items.length)}
                                      disabled={item.ordem === 1}
                                    >
                                      <ChevronUp className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => handleMoveItem(item, 'down', section.items.length)}
                                      disabled={item.ordem === section.items.length}
                                    >
                                      <ChevronDown className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8 text-red-600"
                                      onClick={() => handleRemoveItem(item.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </Card>
                          ))}
                          <div
                            className={cn(
                              'flex items-center justify-center rounded-lg border border-dashed border-transparent py-2 text-xs text-gray-500 transition-colors duration-200',
                              dropTargetSection === section.value && draggedItemId
                                ? 'border-blue-300 bg-blue-50 text-blue-700'
                                : 'border-gray-200/50'
                            )}
                            onDragOver={(event) => {
                              handleDragOver(event)
                              handleDragOverSection(section.value)
                            }}
                            onDragLeave={handleDragLeaveSection}
                            onDrop={(event) => {
                              event.preventDefault()
                              handleDropOnSectionEnd(section.value)
                            }}
                          >
                            Solte aqui para posicionar ao final da seção
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}