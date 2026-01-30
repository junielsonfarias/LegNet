'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useSessoesState } from './_hooks/use-sessoes-state'
import {
  SessoesFilters,
  SessaoCard,
  SessaoFormModal,
  SessaoViewModal,
  PautaEditorModal,
  TemplateApplyModal
} from './_components'

export default function SessoesLegislativasPage() {
  const state = useSessoesState()

  const {
    // Dados
    filteredSessoes,
    parlamentares,
    proposicoes,
    filteredTemplatesSessao,
    pautaSessao,
    pautaSugestoes,
    groupedSections,

    // Loading
    loadingSessoes,
    loadingPauta,
    loadingTemplates,
    loadingSuggestions,
    templateApplyingId,
    suggestionApplyingId,

    // Modais
    isModalOpen,
    isViewModalOpen,
    isPautaModalOpen,
    isTemplateModalOpen,

    // Sessões
    editingSessao,
    viewingSessao,
    selectedSessaoForPauta,

    // Template
    templateMode,
    templateSearch,

    // Drag
    draggedItemId,
    dropTargetSection,

    // Filtros
    searchTerm,
    statusFilter,
    tipoFilter,

    // Formulários
    formData,
    newPautaItem,

    // Handlers
    handleSubmit,
    handleEdit,
    handleView,
    handleClose,
    handleCloseView,
    handleDelete,
    handleManagePauta,
    handleClosePauta,
    handleAddPautaItem,
    handleStatusChange,
    handleMoveItem,
    handleRemoveItem,
    handleOpenTemplateModal,
    handleCloseTemplateModal,
    handleApplyTemplate,
    handleAddSuggestion,
    handleDragStart,
    handleDragEnd,
    handleDragOverSection,
    handleDragLeaveSection,
    handleDropOnItem,
    handleDropOnSectionEnd,
    clearFilters,
    refetchPauta,

    // Setters
    setIsModalOpen,
    setFormData,
    setNewPautaItem,
    setSearchTerm,
    setStatusFilter,
    setTipoFilter,
    setTemplateMode,
    setTemplateSearch
  } = state

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
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
      <SessoesFilters
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        tipoFilter={tipoFilter}
        onSearchChange={setSearchTerm}
        onStatusChange={setStatusFilter}
        onTipoChange={setTipoFilter}
        onClearFilters={clearFilters}
      />

      {/* Lista de Sessões */}
      {loadingSessoes ? (
        <Card>
          <CardContent className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-gray-500">Carregando dados...</p>
          </CardContent>
        </Card>
      ) : filteredSessoes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhuma sessão encontrada</h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'TODOS' || tipoFilter !== 'TODOS'
                ? 'Tente ajustar os filtros de busca'
                : 'Clique em "Nova Sessão" para criar a primeira'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredSessoes.map((sessao) => (
            <SessaoCard
              key={sessao.id}
              sessao={sessao}
              onEdit={handleEdit}
              onView={handleView}
              onDelete={handleDelete}
              onManagePauta={handleManagePauta}
              onOpenTemplateModal={handleOpenTemplateModal}
            />
          ))}
        </div>
      )}

      {/* Modal de Criação/Edição de Sessão */}
      <SessaoFormModal
        isOpen={isModalOpen}
        editingSessao={editingSessao}
        formData={formData}
        onClose={handleClose}
        onSubmit={handleSubmit}
        onFormDataChange={setFormData}
      />

      {/* Modal de Visualização */}
      <SessaoViewModal
        isOpen={isViewModalOpen}
        sessao={viewingSessao}
        onClose={handleCloseView}
      />

      {/* Modal de Pauta */}
      <PautaEditorModal
        isOpen={isPautaModalOpen}
        sessao={selectedSessaoForPauta}
        pautaSessao={pautaSessao}
        sugestoes={pautaSugestoes}
        proposicoes={proposicoes}
        newPautaItem={newPautaItem}
        loadingPauta={loadingPauta}
        loadingSuggestions={loadingSuggestions}
        suggestionApplyingId={suggestionApplyingId}
        draggedItemId={draggedItemId}
        dropTargetSection={dropTargetSection}
        groupedSections={groupedSections}
        onClose={handleClosePauta}
        onAddItem={handleAddPautaItem}
        onStatusChange={handleStatusChange}
        onMoveItem={handleMoveItem}
        onRemoveItem={handleRemoveItem}
        onAddSuggestion={handleAddSuggestion}
        onNewPautaItemChange={setNewPautaItem}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOverSection={handleDragOverSection}
        onDragLeaveSection={handleDragLeaveSection}
        onDropOnItem={handleDropOnItem}
        onDropOnSectionEnd={handleDropOnSectionEnd}
      />

      {/* Modal de Templates */}
      <TemplateApplyModal
        isOpen={isTemplateModalOpen}
        templates={filteredTemplatesSessao}
        loadingTemplates={loadingTemplates}
        templateApplyingId={templateApplyingId}
        templateSearch={templateSearch}
        templateMode={templateMode}
        onClose={handleCloseTemplateModal}
        onApply={handleApplyTemplate}
        onSearchChange={setTemplateSearch}
        onModeChange={setTemplateMode}
      />
    </div>
  )
}
