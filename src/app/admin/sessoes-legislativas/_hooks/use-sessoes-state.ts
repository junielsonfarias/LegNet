'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParlamentares } from '@/lib/hooks/use-parlamentares'
import { useSessoes } from '@/lib/hooks/use-sessoes'
import { useLegislaturas } from '@/lib/hooks/use-legislaturas'
import { usePeriodosLegislatura } from '@/lib/hooks/use-periodos-legislatura'
import { usePauta } from '@/lib/hooks/use-pauta'
import { useProposicoes } from '@/lib/hooks/use-proposicoes'
import { useSessaoTemplates } from '@/lib/hooks/use-sessao-templates'
import { toast } from 'sonner'
import {
  type SessaoFormData,
  type NovoPautaItem,
  type SessaoLocal,
  type PautaItemApi,
  type PautaSugestaoApi,
  type TemplateMode,
  PAUTA_SECOES,
  getFormDataInicial,
  getNovoPautaItemInicial
} from '../_types'

export function useSessoesState() {
  // Hooks externos
  const { parlamentares } = useParlamentares()
  const {
    sessoes: sessoesApi,
    loading: loadingSessoes,
    create,
    update: updateSessao,
    remove: removeSessao,
    refetch: refetchSessoes
  } = useSessoes()
  const { legislaturas } = useLegislaturas({ ativa: true })
  const legislaturaAtiva = legislaturas.find(l => l.ativa) || legislaturas[0]
  const { periodos } = usePeriodosLegislatura(legislaturaAtiva?.id)
  // Filtrar apenas proposições aguardando inclusão em pauta
  const { proposicoes } = useProposicoes({ status: 'AGUARDANDO_PAUTA' })
  const { templates: templatesSessao, loading: loadingTemplates } = useSessaoTemplates({ ativo: true })

  // Estado local de sessões (any[] para flexibilidade com tipos da API)
  const [sessoes, setSessoes] = useState<any[]>([])

  // Modais
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isPautaModalOpen, setIsPautaModalOpen] = useState(false)
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)

  // Sessão em edição/visualização
  const [editingSessao, setEditingSessao] = useState<SessaoLocal | null>(null)
  const [viewingSessao, setViewingSessao] = useState<SessaoLocal | null>(null)
  const [selectedSessaoForPauta, setSelectedSessaoForPauta] = useState<SessaoLocal | null>(null)
  const [sessaoTemplateTarget, setSessaoTemplateTarget] = useState<SessaoLocal | null>(null)

  // Template
  const [templateMode, setTemplateMode] = useState<TemplateMode>('REPLACE')
  const [templateSearch, setTemplateSearch] = useState('')
  const [templateApplyingId, setTemplateApplyingId] = useState<string | null>(null)
  const [suggestionApplyingId, setSuggestionApplyingId] = useState<string | null>(null)

  // Drag and drop
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)
  const [draggedSection, setDraggedSection] = useState<string | null>(null)
  const [dropTargetSection, setDropTargetSection] = useState<string | null>(null)

  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('TODOS')
  const [tipoFilter, setTipoFilter] = useState('TODOS')

  // Formulários
  const [formData, setFormData] = useState<SessaoFormData>(getFormDataInicial())
  const [newPautaItem, setNewPautaItem] = useState<NovoPautaItem>(getNovoPautaItemInicial())

  // Hook de pauta
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

  // Sincronizar sessões da API com estado local
  useEffect(() => {
    if (sessoesApi && Array.isArray(sessoesApi)) {
      setSessoes(sessoesApi.map(s => ({
        ...s,
        titulo: `${s.numero}ª Sessão ${s.tipo}`,
        dataHora: s.data || new Date().toISOString(),
        pautaSessao: s.pautaSessao || null
      })))
    } else {
      setSessoes([])
    }
  }, [sessoesApi])

  // Computed values
  const filteredSessoes = useMemo(() => {
    return (sessoes || []).filter(sessao => {
      if (!sessao) return false
      const matchesSearch = searchTerm === '' ||
        (sessao.titulo?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (sessao.numero?.toString().includes(searchTerm.toLowerCase()))
      const matchesStatus = statusFilter === 'TODOS' || sessao.status === statusFilter
      const matchesTipo = tipoFilter === 'TODOS' || sessao.tipo === tipoFilter
      return matchesSearch && matchesStatus && matchesTipo
    })
  }, [sessoes, searchTerm, statusFilter, tipoFilter])

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

  // Handlers de Sessão
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.data || !formData.local) {
      toast.error('Por favor, preencha todos os campos obrigatórios (Data e Local)')
      return
    }

    const dataHora = `${formData.data}T${formData.horario}:00`
    const dataSessao = new Date(dataHora)

    if (!formData.finalizada) {
      const agora = new Date()
      if (dataSessao <= agora) {
        toast.error('A data e hora da sessão deve ser futura para sessões não finalizadas')
        return
      }
    }

    try {
      if (editingSessao) {
        const updated = await updateSessao(editingSessao.id, {
          numero: formData.numero ? parseInt(formData.numero) : undefined,
          tipo: formData.tipo,
          data: dataHora,
          horario: formData.horario,
          local: formData.local,
          status: formData.status as any,
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
        const novaSessao = await create({
          numero: formData.numero ? parseInt(formData.numero) : undefined,
          tipo: formData.tipo,
          data: dataHora,
          horario: formData.horario,
          local: formData.local,
          status: formData.finalizada ? 'CONCLUIDA' : 'AGENDADA',
          descricao: formData.descricao || undefined,
          finalizada: formData.finalizada
        })

        if (novaSessao) {
          toast.success(
            `Sessão ${novaSessao.numero}ª ${formData.tipo} criada com sucesso!${
              novaSessao.legislatura ? ` (Legislatura ${novaSessao.legislatura.numero}ª)` : ''
            }`
          )
        } else {
          toast.error('Erro ao criar sessão')
          return
        }
      }

      handleClose()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao salvar a sessão.'
      toast.error(errorMessage)
    }
    // Note: handleClose is defined after this useCallback but is stable (empty deps)
  }, [formData, editingSessao, create, updateSessao]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleEdit = useCallback((sessao: SessaoLocal) => {
    setEditingSessao(sessao)
    const dataHora = sessao.data ? new Date(sessao.data) : new Date()
    const dataFormatada = dataHora.toISOString().split('T')[0]
    const horarioFormatado = sessao.horario || dataHora.toTimeString().slice(0, 5)

    setFormData({
      numero: sessao.numero?.toString() || '',
      tipo: sessao.tipo,
      data: dataFormatada,
      horario: horarioFormatado,
      local: sessao.local || 'Plenário da Câmara Municipal',
      descricao: sessao.descricao || '',
      finalizada: sessao.finalizada || false,
      status: sessao.status || 'AGENDADA'
    })
    setIsModalOpen(true)
  }, [])

  const handleView = useCallback((sessao: SessaoLocal) => {
    setViewingSessao(sessao)
    setIsViewModalOpen(true)
  }, [])

  const handleClose = useCallback(() => {
    setIsModalOpen(false)
    setEditingSessao(null)
    setFormData(getFormDataInicial())
  }, [])

  const handleCloseView = useCallback(() => {
    setIsViewModalOpen(false)
    setViewingSessao(null)
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta sessão?')) {
      try {
        const sucesso = await removeSessao(id)
        if (sucesso) {
          toast.success('Sessão excluída com sucesso!')
        } else {
          toast.error('Erro ao excluir a sessão')
        }
      } catch (error) {
        toast.error('Erro ao excluir a sessão. Tente novamente.')
      }
    }
  }, [removeSessao])

  // Handlers de Pauta
  const handleManagePauta = useCallback((sessao: SessaoLocal) => {
    setSelectedSessaoForPauta(sessao)
    setIsPautaModalOpen(true)
  }, [])

  const handleClosePauta = useCallback(() => {
    setIsPautaModalOpen(false)
    setSelectedSessaoForPauta(null)
    setNewPautaItem(getNovoPautaItemInicial())
  }, [])

  const handleAddPautaItem = useCallback(async () => {
    if (!selectedSessaoForPauta) return
    if (!newPautaItem.titulo.trim()) {
      toast.error('Informe o título do item da pauta')
      return
    }

    await addPautaItem({
      secao: newPautaItem.secao,
      titulo: newPautaItem.titulo.trim(),
      descricao: newPautaItem.descricao.trim() || undefined,
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
  }, [selectedSessaoForPauta, newPautaItem, addPautaItem, refetchPauta])

  const handleStatusChange = useCallback(async (itemId: string, status: string) => {
    await updatePautaItem(itemId, { status })
    await refetchPauta()
  }, [updatePautaItem, refetchPauta])

  const handleMoveItem = useCallback(async (item: PautaItemApi, direction: 'up' | 'down', totalInSection: number) => {
    const newOrder = direction === 'up' ? item.ordem - 1 : item.ordem + 1
    if (newOrder < 1 || newOrder > totalInSection) return
    await updatePautaItem(item.id, { ordem: newOrder })
    await refetchPauta()
  }, [updatePautaItem, refetchPauta])

  const handleRemoveItem = useCallback(async (itemId: string) => {
    await removePautaItem(itemId)
    await refetchPauta()
  }, [removePautaItem, refetchPauta])

  // Handlers de Template
  const handleOpenTemplateModal = useCallback((sessao: SessaoLocal) => {
    setSelectedSessaoForPauta(sessao)
    setSessaoTemplateTarget(sessao)
    setTemplateMode('REPLACE')
    setTemplateSearch('')
    setIsTemplateModalOpen(true)
  }, [])

  const handleCloseTemplateModal = useCallback(() => {
    setIsTemplateModalOpen(false)
    setSessaoTemplateTarget(null)
    setTemplateApplyingId(null)
    setSelectedSessaoForPauta(null)
  }, [])

  const handleApplyTemplate = useCallback(async (templateId: string) => {
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
  }, [sessaoTemplateTarget, templateMode, applyTemplateToPauta, refetchPauta, refetchSessoes, handleCloseTemplateModal])

  const handleAddSuggestion = useCallback(async (suggestion: PautaSugestaoApi) => {
    try {
      setSuggestionApplyingId(suggestion.id)
      await addSuggestionAsItem(suggestion)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao adicionar sugestão à pauta'
      toast.error(message)
    } finally {
      setSuggestionApplyingId(null)
    }
  }, [addSuggestionAsItem])

  // Handlers de Drag and Drop
  const handleDragStart = useCallback((item: PautaItemApi) => {
    setDraggedItemId(item.id)
    setDraggedSection(item.secao)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggedItemId(null)
    setDraggedSection(null)
    setDropTargetSection(null)
  }, [])

  const handleDragOverSection = useCallback((sectionValue: string) => {
    if (!draggedItemId) return
    setDropTargetSection(sectionValue)
  }, [draggedItemId])

  const handleDragLeaveSection = useCallback(() => {
    setDropTargetSection(null)
  }, [])

  const reorderSection = useCallback(async (
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
  }, [updatePautaItem])

  const handleDropOnItem = useCallback(async (target: PautaItemApi, sectionValue: string) => {
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
  }, [draggedItemId, pautaSessao, updatePautaItem, reorderSection, handleDragEnd])

  const handleDropOnSectionEnd = useCallback(async (sectionValue: string) => {
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
  }, [draggedItemId, pautaSessao, updatePautaItem, reorderSection, handleDragEnd])

  // Helper
  const getParlamentarNome = useCallback((id: string) => {
    const parlamentar = parlamentares.find(p => p.id === id)
    return parlamentar ? parlamentar.nome : 'Não encontrado'
  }, [parlamentares])

  const clearFilters = useCallback(() => {
    setSearchTerm('')
    setStatusFilter('TODOS')
    setTipoFilter('TODOS')
  }, [])

  return {
    // Dados
    sessoes,
    filteredSessoes,
    parlamentares,
    proposicoes,
    templatesSessao,
    filteredTemplatesSessao,
    pautaSessao,
    pautaSugestoes,
    groupedSections,
    legislaturaAtiva,
    periodos,

    // Loading states
    loadingSessoes,
    loadingPauta,
    refreshingPauta,
    loadingTemplates,
    loadingSuggestions,

    // Modais
    isModalOpen,
    isViewModalOpen,
    isPautaModalOpen,
    isTemplateModalOpen,

    // Sessões em edição
    editingSessao,
    viewingSessao,
    selectedSessaoForPauta,
    sessaoTemplateTarget,

    // Template state
    templateMode,
    templateSearch,
    templateApplyingId,
    suggestionApplyingId,

    // Drag state
    draggedItemId,
    draggedSection,
    dropTargetSection,

    // Filtros
    searchTerm,
    statusFilter,
    tipoFilter,

    // Formulários
    formData,
    newPautaItem,

    // Handlers Sessão
    handleSubmit,
    handleEdit,
    handleView,
    handleClose,
    handleCloseView,
    handleDelete,

    // Handlers Pauta
    handleManagePauta,
    handleClosePauta,
    handleAddPautaItem,
    handleStatusChange,
    handleMoveItem,
    handleRemoveItem,
    refetchPauta,

    // Handlers Template
    handleOpenTemplateModal,
    handleCloseTemplateModal,
    handleApplyTemplate,
    handleAddSuggestion,

    // Handlers Drag
    handleDragStart,
    handleDragEnd,
    handleDragOverSection,
    handleDragLeaveSection,
    handleDropOnItem,
    handleDropOnSectionEnd,

    // Helpers
    getParlamentarNome,
    clearFilters,

    // Setters
    setIsModalOpen,
    setFormData,
    setNewPautaItem,
    setSearchTerm,
    setStatusFilter,
    setTipoFilter,
    setTemplateMode,
    setTemplateSearch
  }
}
