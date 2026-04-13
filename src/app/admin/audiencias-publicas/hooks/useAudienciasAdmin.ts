'use client'

import { createLogger } from '@/lib/logging/logger'
const log = createLogger('admin/audiencias-publicas/hooks/useAudienciasAdmin')

import { useState, useEffect, useCallback } from 'react'
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

  // Carregar dados via API admin (lista completa, nao filtrada por publicacaoPublica)
  const carregarAudiencias = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/audiencias-publicas')
      const data = await response.json()
      if (data.success && Array.isArray(data.data)) {
        setAudiencias(data.data)
      }
    } catch (error) {
      log.error('Erro ao carregar audiencias', error)
    }
  }, [])

  useEffect(() => {
    carregarAudiencias()

    const carregarParlamentares = async () => {
      try {
        const response = await fetch('/api/parlamentares?ativo=true')
        const data = await response.json()
        if (data.success && data.data) {
          setParlamentares(data.data)
        }
      } catch (error) {
        log.error('Erro ao carregar parlamentares', error)
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

  const handleSubmit = async () => {
    try {
      const url = editingId
        ? `/api/admin/audiencias-publicas/${editingId}`
        : '/api/admin/audiencias-publicas'
      const method = editingId ? 'PUT' : 'POST'
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data?.error?.message || 'Erro ao salvar audiencia')
      }
      await carregarAudiencias()
      handleClose()
    } catch (error) {
      log.error('Erro ao salvar audiencia', error)
    }
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

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta audiencia?')) return
    try {
      const response = await fetch(`/api/admin/audiencias-publicas/${id}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data?.error?.message || 'Erro ao excluir')
      }
      await carregarAudiencias()
    } catch (error) {
      log.error('Erro ao excluir audiencia', error)
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

  const stats = {
    total: audiencias.length,
    agendadas: audiencias.filter(a => a.status === 'AGENDADA').length,
    concluidas: audiencias.filter(a => a.status === 'CONCLUIDA').length,
    canceladas: audiencias.filter(a => a.status === 'CANCELADA').length,
    especiais: audiencias.filter(a => a.tipo === 'ESPECIAL').length
  }

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
