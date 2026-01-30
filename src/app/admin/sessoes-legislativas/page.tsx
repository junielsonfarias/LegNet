'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Plus,
  FileText,
  Loader2,
  ChevronUp,
  ChevronDown,
  Layers,
  Lightbulb,
  Trash2,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useSessoesState } from './_hooks/use-sessoes-state'
import { SessoesFilters, SessaoCard } from './_components'
import {
  PAUTA_SECOES,
  PAUTA_ITEM_STATUS_OPTIONS,
  STATUS_BADGES,
  PAUTA_STATUS_LABELS,
  formatDateTime
} from './_types'

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
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>{editingSessao ? 'Editar Sessão' : 'Nova Sessão'}</CardTitle>
              <CardDescription>
                {editingSessao ? 'Atualize os dados da sessão' : 'Preencha os dados para criar uma nova sessão'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="numero">Número (opcional)</Label>
                    <Input
                      id="numero"
                      type="number"
                      value={formData.numero}
                      onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                      placeholder="Gerado automaticamente"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tipo">Tipo</Label>
                    <select
                      id="tipo"
                      value={formData.tipo}
                      onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="ORDINARIA">Ordinária</option>
                      <option value="EXTRAORDINARIA">Extraordinária</option>
                      <option value="ESPECIAL">Especial</option>
                      <option value="SOLENE">Solene</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="data">Data</Label>
                    <Input
                      id="data"
                      type="date"
                      value={formData.data}
                      onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="horario">Horário</Label>
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
                  <Label htmlFor="local">Local</Label>
                  <Input
                    id="local"
                    value={formData.local}
                    onChange={(e) => setFormData({ ...formData, local: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="descricao">Descrição (opcional)</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="finalizada"
                    checked={formData.finalizada}
                    onChange={(e) => setFormData({ ...formData, finalizada: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="finalizada">Sessão já realizada (dados históricos)</Label>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
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

      {/* Modal de Visualização */}
      {isViewModalOpen && viewingSessao && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{viewingSessao.numero}ª Sessão {viewingSessao.tipo}</CardTitle>
                  <CardDescription>{formatDateTime(viewingSessao.data)}</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={handleCloseView}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Local</p>
                  <p className="font-medium">{viewingSessao.local || 'Não definido'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge>{viewingSessao.status}</Badge>
                </div>
              </div>
              {viewingSessao.descricao && (
                <div>
                  <p className="text-sm text-gray-500">Descrição</p>
                  <p>{viewingSessao.descricao}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Pauta */}
      {isPautaModalOpen && selectedSessaoForPauta && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Pauta da {selectedSessaoForPauta.numero}ª Sessão</CardTitle>
                  <CardDescription>Gerencie os itens da pauta</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={handleClosePauta}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Adicionar novo item */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <h4 className="font-semibold">Adicionar Item à Pauta</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label>Seção</Label>
                    <select
                      value={newPautaItem.secao}
                      onChange={(e) => setNewPautaItem({ ...newPautaItem, secao: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      {PAUTA_SECOES.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <Label>Título</Label>
                    <Input
                      value={newPautaItem.titulo}
                      onChange={(e) => setNewPautaItem({ ...newPautaItem, titulo: e.target.value })}
                      placeholder="Título do item"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleAddPautaItem} className="w-full">
                      <Plus className="h-4 w-4 mr-2" /> Adicionar
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Proposição (opcional)</Label>
                    <select
                      value={newPautaItem.proposicaoId}
                      onChange={(e) => setNewPautaItem({ ...newPautaItem, proposicaoId: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="">Nenhuma</option>
                      {proposicoes.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.numero}/{p.ano} - {p.titulo}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Tempo Estimado (min)</Label>
                    <Input
                      type="number"
                      value={newPautaItem.tempoEstimado}
                      onChange={(e) => setNewPautaItem({ ...newPautaItem, tempoEstimado: e.target.value })}
                      placeholder="Ex: 10"
                    />
                  </div>
                </div>
              </div>

              {/* Sugestões */}
              {pautaSugestoes && pautaSugestoes.length > 0 && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-semibold flex items-center gap-2 mb-3">
                    <Lightbulb className="h-4 w-4" />
                    Sugestões de Itens
                  </h4>
                  <div className="space-y-2">
                    {pautaSugestoes.slice(0, 5).map(sugestao => (
                      <div key={sugestao.id} className="flex items-center justify-between bg-white p-2 rounded border">
                        <div>
                          <p className="font-medium text-sm">{sugestao.titulo}</p>
                          <p className="text-xs text-gray-500">{sugestao.proposicao?.numero}/{sugestao.proposicao?.ano}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddSuggestion(sugestao)}
                          disabled={suggestionApplyingId === sugestao.id}
                        >
                          {suggestionApplyingId === sugestao.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Plus className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lista de itens por seção */}
              {loadingPauta ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                </div>
              ) : (
                <div className="space-y-4">
                  {groupedSections.map(section => (
                    <div
                      key={section.value}
                      className={cn(
                        'border rounded-lg p-4',
                        dropTargetSection === section.value && 'border-blue-500 bg-blue-50'
                      )}
                      onDragOver={(e) => {
                        e.preventDefault()
                        handleDragOverSection(section.value)
                      }}
                      onDragLeave={handleDragLeaveSection}
                      onDrop={() => handleDropOnSectionEnd(section.value)}
                    >
                      <h5 className="font-semibold mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {section.label}
                        <Badge variant="outline">{section.items.length}</Badge>
                      </h5>
                      {section.items.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">
                          Nenhum item nesta seção
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {section.items.map((item, idx) => (
                            <div
                              key={item.id}
                              draggable
                              onDragStart={() => handleDragStart(item)}
                              onDragEnd={handleDragEnd}
                              onDrop={() => handleDropOnItem(item, section.value)}
                              onDragOver={(e) => e.preventDefault()}
                              className={cn(
                                'flex items-center justify-between bg-white p-3 rounded border cursor-move',
                                draggedItemId === item.id && 'opacity-50'
                              )}
                            >
                              <div className="flex-1">
                                <p className="font-medium">{item.titulo}</p>
                                {item.proposicao && (
                                  <p className="text-xs text-gray-500">
                                    {item.proposicao.numero}/{item.proposicao.ano}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <select
                                  value={item.status}
                                  onChange={(e) => handleStatusChange(item.id, e.target.value)}
                                  className={cn(
                                    'text-xs px-2 py-1 rounded border',
                                    STATUS_BADGES[item.status] || STATUS_BADGES.DEFAULT
                                  )}
                                >
                                  {PAUTA_ITEM_STATUS_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                  ))}
                                </select>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleMoveItem(item, 'up', section.items.length)}
                                  disabled={idx === 0}
                                >
                                  <ChevronUp className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleMoveItem(item, 'down', section.items.length)}
                                  disabled={idx === section.items.length - 1}
                                >
                                  <ChevronDown className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleRemoveItem(item.id)}
                                  className="text-red-500"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
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

      {/* Modal de Templates */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    Aplicar Template de Pauta
                  </CardTitle>
                  <CardDescription>Selecione um template para aplicar à sessão</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={handleCloseTemplateModal}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Buscar template..."
                    value={templateSearch}
                    onChange={(e) => setTemplateSearch(e.target.value)}
                  />
                </div>
                <select
                  value={templateMode}
                  onChange={(e) => setTemplateMode(e.target.value as any)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="REPLACE">Substituir pauta</option>
                  <option value="APPEND">Adicionar à pauta</option>
                </select>
              </div>

              {loadingTemplates ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                </div>
              ) : filteredTemplatesSessao.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Nenhum template encontrado</p>
              ) : (
                <div className="space-y-3">
                  {filteredTemplatesSessao.map(template => (
                    <div key={template.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{template.nome}</h4>
                          {template.descricao && (
                            <p className="text-sm text-gray-500">{template.descricao}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {template.itens?.length || 0} itens
                          </p>
                        </div>
                        <Button
                          onClick={() => handleApplyTemplate(template.id)}
                          disabled={templateApplyingId === template.id}
                        >
                          {templateApplyingId === template.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
                          Aplicar
                        </Button>
                      </div>
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
