'use client'

import { useState, useEffect, useCallback } from 'react'
import { audienciasPublicasService } from '@/lib/parlamentares-data'
import type {
  AudienciaPublica,
  ParticipanteAudiencia,
  ParlamentarApi,
  AudienciaFormData,
  ParticipanteFormData
} from '../types'
import { INITIAL_FORM_DATA, INITIAL_PARTICIPANTE_FORM } from '../types'

export function useAudienciasAdmin() {
  const [audiencias, setAudiencias] = useState<AudienciaPublica[]>([])
  const [parlamentares, setParlamentares] = useState<ParlamentarApi[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterTipo, setFilterTipo] = useState('all')
  const [filterDataInicio, setFilterDataInicio] = useState('')
  const [filterDataFim, setFilterDataFim] = useState('')
  const [formData, setFormData] = useState<AudienciaFormData>(INITIAL_FORM_DATA)
  const [participanteForm, setParticipanteForm] = useState<ParticipanteFormData>(INITIAL_PARTICIPANTE_FORM)

  // Carregar dados
  useEffect(() => {
    setAudiencias(audienciasPublicasService.getAll())

    const carregarParlamentares = async () => {
      try {
        const response = await fetch('/api/parlamentares?ativo=true')
        const data = await response.json()
        if (data.success && data.data) {
          setParlamentares(data.data)
        }
      } catch (error) {
        console.error('Erro ao carregar parlamentares:', error)
      }
    }
    carregarParlamentares()
  }, [])

  // Filtrar audiencias
  const filteredAudiencias = useCallback(() => {
    return audiencias.filter(audiencia => {
      const matchesSearch = !searchTerm ||
        audiencia.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        audiencia.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        audiencia.objetivo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        audiencia.responsavel.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = filterStatus === 'all' || audiencia.status === filterStatus
      const matchesTipo = filterTipo === 'all' || audiencia.tipo === filterTipo
      const matchesDataInicio = !filterDataInicio || audiencia.dataHora >= filterDataInicio
      const matchesDataFim = !filterDataFim || audiencia.dataHora <= filterDataFim

      return matchesSearch && matchesStatus && matchesTipo && matchesDataInicio && matchesDataFim
    })
  }, [audiencias, searchTerm, filterStatus, filterTipo, filterDataInicio, filterDataFim])

  // Manipular formulario
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleParticipanteChange = (field: string, value: any) => {
    setParticipanteForm(prev => ({ ...prev, [field]: value }))
  }

  const handleAddParticipante = () => {
    if (participanteForm.nome.trim()) {
      const novoParticipante: ParticipanteAudiencia = {
        id: Date.now().toString(),
        ...participanteForm
      }
      setFormData(prev => ({
        ...prev,
        participantes: [...(prev.participantes || []), novoParticipante]
      }))
      setParticipanteForm(INITIAL_PARTICIPANTE_FORM)
    }
  }

  const handleRemoveParticipante = (participanteId: string) => {
    setFormData(prev => ({
      ...prev,
      participantes: (prev.participantes || []).filter(p => p.id !== participanteId)
    }))
  }

  const handleSubmit = () => {
    if (editingId) {
      audienciasPublicasService.update(editingId, formData)
    } else {
      const audienciaCompleta = {
        titulo: formData.titulo || '',
        descricao: formData.descricao || '',
        tipo: formData.tipo || 'ORDINARIA',
        status: formData.status || 'AGENDADA',
        dataHora: formData.dataHora || '',
        local: formData.local || '',
        endereco: formData.endereco || '',
        responsavel: formData.responsavel || '',
        parlamentarId: formData.parlamentarId || '',
        comissaoId: formData.comissaoId || '',
        objetivo: formData.objetivo || '',
        publicoAlvo: formData.publicoAlvo || '',
        observacoes: formData.observacoes || '',
        participantes: formData.participantes || [],
        materiaLegislativaId: formData.materiaLegislativaId || '',
        transmissaoAoVivo: formData.transmissaoAoVivo || INITIAL_FORM_DATA.transmissaoAoVivo,
        inscricoesPublicas: formData.inscricoesPublicas || INITIAL_FORM_DATA.inscricoesPublicas,
        publicacaoPublica: formData.publicacaoPublica || INITIAL_FORM_DATA.publicacaoPublica,
        cronograma: formData.cronograma || INITIAL_FORM_DATA.cronograma
      }
      audienciasPublicasService.add(audienciaCompleta as any)
    }
    setAudiencias(audienciasPublicasService.getAll())
    handleClose()
  }

  const handleEdit = (audiencia: AudienciaPublica) => {
    setFormData({
      titulo: audiencia.titulo,
      descricao: audiencia.descricao,
      tipo: audiencia.tipo,
      status: audiencia.status,
      dataHora: audiencia.dataHora,
      local: audiencia.local,
      endereco: audiencia.endereco || '',
      responsavel: audiencia.responsavel,
      parlamentarId: audiencia.parlamentarId || '',
      comissaoId: audiencia.comissaoId || '',
      objetivo: audiencia.objetivo,
      publicoAlvo: audiencia.publicoAlvo,
      observacoes: audiencia.observacoes || '',
      participantes: audiencia.participantes,
      materiaLegislativaId: audiencia.materiaLegislativaId || '',
      transmissaoAoVivo: audiencia.transmissaoAoVivo || INITIAL_FORM_DATA.transmissaoAoVivo,
      inscricoesPublicas: audiencia.inscricoesPublicas || INITIAL_FORM_DATA.inscricoesPublicas,
      publicacaoPublica: audiencia.publicacaoPublica || INITIAL_FORM_DATA.publicacaoPublica,
      cronograma: audiencia.cronograma || INITIAL_FORM_DATA.cronograma
    })
    setEditingId(audiencia.id)
    setShowForm(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta audiencia?')) {
      audienciasPublicasService.remove(id)
      setAudiencias(audienciasPublicasService.getAll())
    }
  }

  const handleClose = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData(INITIAL_FORM_DATA)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setFilterStatus('all')
    setFilterTipo('all')
    setFilterDataInicio('')
    setFilterDataFim('')
  }

  const stats = audienciasPublicasService.getStats()

  return {
    // Data
    audiencias,
    parlamentares,
    filteredAudiencias,
    stats,
    showForm,
    editingId,
    formData,
    participanteForm,

    // Filters
    searchTerm,
    filterStatus,
    filterTipo,
    filterDataInicio,
    filterDataFim,

    // Actions
    setSearchTerm,
    setFilterStatus,
    setFilterTipo,
    setFilterDataInicio,
    setFilterDataFim,
    setShowForm,
    clearFilters,
    handleInputChange,
    handleParticipanteChange,
    handleAddParticipante,
    handleRemoveParticipante,
    handleSubmit,
    handleEdit,
    handleDelete,
    handleClose
  }
}
