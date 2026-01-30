'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  FileText,
  Loader2,
  ChevronUp,
  ChevronDown,
  Lightbulb,
  Trash2,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  SessaoLocal,
  NovoPautaItem,
  PautaItemApi,
  PautaSugestaoApi,
  SecaoPauta,
  StatusPautaItem
} from '../_types'
import {
  PAUTA_SECOES,
  PAUTA_ITEM_STATUS_OPTIONS,
  STATUS_BADGES
} from '../_types'

interface ProposicaoSimples {
  id: string
  numero: string
  ano: number
  titulo: string
}

interface GroupedSection {
  value: SecaoPauta
  label: string
  items: PautaItemApi[]
}

interface PautaSessaoApi {
  id: string
  sessaoId: string
  itens?: PautaItemApi[]
  itemAtual?: PautaItemApi | null
}

interface PautaEditorModalProps {
  isOpen: boolean
  sessao: SessaoLocal | null
  pautaSessao: PautaSessaoApi | null
  sugestoes: PautaSugestaoApi[]
  proposicoes: ProposicaoSimples[]
  newPautaItem: NovoPautaItem
  loadingPauta: boolean
  loadingSuggestions: boolean
  suggestionApplyingId: string | null
  draggedItemId: string | null
  dropTargetSection: string | null
  groupedSections: GroupedSection[]
  onClose: () => void
  onAddItem: () => void
  onStatusChange: (itemId: string, status: string) => void
  onMoveItem: (item: PautaItemApi, direction: 'up' | 'down', totalItems: number) => void
  onRemoveItem: (itemId: string) => void
  onAddSuggestion: (sugestao: PautaSugestaoApi) => void
  onNewPautaItemChange: (item: NovoPautaItem) => void
  onDragStart: (item: PautaItemApi) => void
  onDragEnd: () => void
  onDragOverSection: (secao: string) => void
  onDragLeaveSection: () => void
  onDropOnItem: (item: PautaItemApi, secao: string) => void
  onDropOnSectionEnd: (secao: string) => void
}

export function PautaEditorModal({
  isOpen,
  sessao,
  pautaSessao,
  sugestoes,
  proposicoes,
  newPautaItem,
  loadingPauta,
  loadingSuggestions,
  suggestionApplyingId,
  draggedItemId,
  dropTargetSection,
  groupedSections,
  onClose,
  onAddItem,
  onStatusChange,
  onMoveItem,
  onRemoveItem,
  onAddSuggestion,
  onNewPautaItemChange,
  onDragStart,
  onDragEnd,
  onDragOverSection,
  onDragLeaveSection,
  onDropOnItem,
  onDropOnSectionEnd
}: PautaEditorModalProps) {
  if (!isOpen || !sessao) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Pauta da {sessao.numero}ª Sessão</CardTitle>
              <CardDescription>Gerencie os itens da pauta</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
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
                  onChange={(e) => onNewPautaItemChange({ ...newPautaItem, secao: e.target.value })}
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
                  onChange={(e) => onNewPautaItemChange({ ...newPautaItem, titulo: e.target.value })}
                  placeholder="Título do item"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={onAddItem} className="w-full">
                  <Plus className="h-4 w-4 mr-2" /> Adicionar
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Proposição (opcional)</Label>
                <select
                  value={newPautaItem.proposicaoId}
                  onChange={(e) => onNewPautaItemChange({ ...newPautaItem, proposicaoId: e.target.value })}
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
                  onChange={(e) => onNewPautaItemChange({ ...newPautaItem, tempoEstimado: e.target.value })}
                  placeholder="Ex: 10"
                />
              </div>
            </div>
          </div>

          {/* Sugestões */}
          {sugestoes && sugestoes.length > 0 && (
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-semibold flex items-center gap-2 mb-3">
                <Lightbulb className="h-4 w-4" />
                Sugestões de Itens
              </h4>
              <div className="space-y-2">
                {sugestoes.slice(0, 5).map(sugestao => (
                  <div key={sugestao.id} className="flex items-center justify-between bg-white p-2 rounded border">
                    <div>
                      <p className="font-medium text-sm">{sugestao.titulo}</p>
                      <p className="text-xs text-gray-500">{sugestao.proposicao?.numero}/{sugestao.proposicao?.ano}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onAddSuggestion(sugestao)}
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
                    onDragOverSection(section.value)
                  }}
                  onDragLeave={onDragLeaveSection}
                  onDrop={() => onDropOnSectionEnd(section.value)}
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
                          onDragStart={() => onDragStart(item)}
                          onDragEnd={onDragEnd}
                          onDrop={() => onDropOnItem(item, section.value)}
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
                              onChange={(e) => onStatusChange(item.id, e.target.value)}
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
                              onClick={() => onMoveItem(item, 'up', section.items.length)}
                              disabled={idx === 0}
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => onMoveItem(item, 'down', section.items.length)}
                              disabled={idx === section.items.length - 1}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => onRemoveItem(item.id)}
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
  )
}
