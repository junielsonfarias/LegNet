'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Plus } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { useAudienciasAdmin } from './hooks/useAudienciasAdmin'
import {
  AudienciasStats,
  AudienciasFilter,
  AudienciaCard,
  AudienciaForm
} from './components'
import { RedirectConfig } from '@/components/admin/redirect-config'

export default function AudienciasPublicasAdminPage() {
  const {
    parlamentares,
    filteredAudiencias,
    stats,
    showForm,
    editingId,
    formData,
    participanteForm,
    searchTerm,
    filterStatus,
    filterTipo,
    filterDataInicio,
    filterDataFim,
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
  } = useAudienciasAdmin()

  const audienciasFiltradas = filteredAudiencias()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Audiencias Publicas</h1>
          <p className="text-gray-600">Gerencie as audiencias publicas da Camara</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-camara-primary hover:bg-camara-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Nova Audiencia
        </Button>
      </div>

      <RedirectConfig slug="portal-da-transparencia" label="Audiências Públicas" />

      {/* Estatisticas */}
      <AudienciasStats
        total={stats.total}
        agendadas={stats.agendadas}
        concluidas={stats.concluidas}
        especiais={stats.especiais}
      />

      {/* Filtros */}
      <AudienciasFilter
        searchTerm={searchTerm}
        filterStatus={filterStatus}
        filterTipo={filterTipo}
        filterDataInicio={filterDataInicio}
        filterDataFim={filterDataFim}
        onSearchChange={setSearchTerm}
        onStatusChange={setFilterStatus}
        onTipoChange={setFilterTipo}
        onDataInicioChange={setFilterDataInicio}
        onDataFimChange={setFilterDataFim}
        onClear={clearFilters}
      />

      {/* Formulario */}
      {showForm && (
        <AudienciaForm
          editingId={editingId}
          formData={formData}
          participanteForm={participanteForm}
          parlamentares={parlamentares}
          onClose={handleClose}
          onSubmit={handleSubmit}
          onInputChange={handleInputChange}
          onParticipanteChange={handleParticipanteChange}
          onAddParticipante={handleAddParticipante}
          onRemoveParticipante={handleRemoveParticipante}
        />
      )}

      {/* Lista de Audiencias */}
      <div className="grid grid-cols-1 gap-6">
        {audienciasFiltradas.map((audiencia) => (
          <AudienciaCard
            key={audiencia.id}
            audiencia={audiencia}
            onView={() => {}}
            onEdit={() => handleEdit(audiencia)}
            onDelete={() => handleDelete(audiencia.id)}
          />
        ))}
      </div>

      {audienciasFiltradas.length === 0 && (
        <EmptyState
          icon={Users}
          title="Nenhuma audiência encontrada"
          description={searchTerm || filterStatus !== 'all' || filterTipo !== 'all'
            ? 'Tente ajustar os filtros de busca.'
            : 'Não há audiências cadastradas. Use o botão acima para criar a primeira.'}
        />
      )}
    </div>
  )
}
