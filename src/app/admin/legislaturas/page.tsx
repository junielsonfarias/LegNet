'use client'

import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useLegislaturasAdmin } from './hooks/useLegislaturasAdmin'
import {
  LegislaturasStats,
  LegislaturasFilter,
  LegislaturasTable,
  LegislaturaFormModal,
  LegislaturaViewModal
} from './components'

export default function LegislaturasAdminPage() {
  const {
    legislaturas,
    filteredLegislaturas,
    loading,
    searchTerm,
    showForm,
    editingId,
    viewingLegislatura,
    loadingDetalhes,
    formData,
    periodos,
    loadingSave,
    setSearchTerm,
    setShowForm,
    setFormData,
    setViewingLegislatura,
    handleSubmit,
    handleEdit,
    handleDelete,
    handleView,
    resetForm,
    adicionarPeriodo,
    removerPeriodo,
    atualizarPeriodo,
    adicionarCargo,
    removerCargo,
    atualizarCargo
  } = useLegislaturasAdmin()

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Legislaturas</h1>
          <p className="text-gray-600 mt-2">
            Cadastre e gerencie as legislaturas da Camara Municipal
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nova Legislatura
        </Button>
      </div>

      {/* Estatisticas */}
      <LegislaturasStats
        total={legislaturas.length}
        ativas={legislaturas.filter(l => l.ativa).length}
        inativas={legislaturas.filter(l => !l.ativa).length}
        filtradas={filteredLegislaturas.length}
      />

      {/* Filtros */}
      <LegislaturasFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {/* Lista de Legislaturas */}
      <LegislaturasTable
        legislaturas={filteredLegislaturas}
        loading={loading}
        loadingDetalhes={loadingDetalhes}
        searchTerm={searchTerm}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Modal de Formulario */}
      <LegislaturaFormModal
        open={showForm}
        editingId={editingId}
        formData={formData}
        periodos={periodos}
        loadingSave={loadingSave}
        onClose={() => {
          setShowForm(false)
          resetForm()
        }}
        onSubmit={handleSubmit}
        onFormChange={setFormData}
        onAdicionarPeriodo={adicionarPeriodo}
        onRemoverPeriodo={removerPeriodo}
        onAtualizarPeriodo={atualizarPeriodo}
        onAdicionarCargo={adicionarCargo}
        onRemoverCargo={removerCargo}
        onAtualizarCargo={atualizarCargo}
      />

      {/* Modal de Visualizacao */}
      <LegislaturaViewModal
        legislatura={viewingLegislatura}
        onClose={() => setViewingLegislatura(null)}
        onEdit={handleEdit}
      />
    </div>
  )
}
