'use client'

import { useState, useEffect, useMemo } from 'react'
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
  X,
  Search
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
  PAUTA_SECOES as PAUTA_SECOES_FALLBACK,
  PAUTA_ITEM_STATUS_OPTIONS,
  STATUS_BADGES
} from '../_types'

interface ProposicaoSimples {
  id: string
  numero: string
  ano: number
  titulo: string
  tipo?: string
  ementa?: string
  status?: string
  autor?: { id?: string; nome: string; apelido?: string | null; partido?: string | null } | null
}

const TIPO_LABELS: Record<string, string> = {
  'PROJETO_LEI': 'PL', 'PROJETO_RESOLUCAO': 'PR', 'PROJETO_DECRETO': 'PD',
  'INDICACAO': 'IND', 'REQUERIMENTO': 'REQ', 'MOCAO': 'MOC',
  'VOTO_PESAR': 'VP', 'VOTO_APLAUSO': 'VA'
}

function MateriasSearchSection({
  proposicoes, sugestoes, suggestionApplyingId, newPautaItem, secoes,
  sessaoId, onNewPautaItemChange, onAddItem, onAddSuggestion, onBulkAdded
}: {
  proposicoes: ProposicaoSimples[]
  sugestoes: PautaSugestaoApi[]
  suggestionApplyingId: string | null
  newPautaItem: NovoPautaItem
  secoes: Array<{ value: string; label: string }>
  sessaoId?: string
  onNewPautaItemChange: (item: NovoPautaItem) => void
  onAddItem: () => void
  onAddSuggestion: (sugestao: PautaSugestaoApi) => void
  onBulkAdded?: () => void
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [tipoFilter, setTipoFilter] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)

  const allMaterias = useMemo(() => {
    const sugestaoIds = new Set(sugestoes.map(s => s.proposicao?.id).filter(Boolean))
    return [
      ...sugestoes.map(s => ({
        ...s.proposicao,
        id: s.proposicao?.id || s.id,
        numero: s.proposicao?.numero || '',
        ano: s.proposicao?.ano || 0,
        titulo: s.titulo || s.proposicao?.titulo || '',
        tipo: s.proposicao?.tipo,
        _sugestao: s
      })),
      ...proposicoes
        .filter(p => !sugestaoIds.has(p.id))
        .map(p => ({ ...p, _sugestao: null as PautaSugestaoApi | null }))
    ]
  }, [proposicoes, sugestoes])

  const tipos = useMemo(() => {
    const set = new Set(allMaterias.map(m => m.tipo).filter(Boolean))
    return Array.from(set) as string[]
  }, [allMaterias])

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return allMaterias.filter(m => {
      const matchSearch = !searchTerm ||
        (m.titulo || '').toLowerCase().includes(term) ||
        (m.numero || '').includes(searchTerm) ||
        ((m as any).ementa || '').toLowerCase().includes(term) ||
        ((m as any).autor?.nome || '').toLowerCase().includes(term) ||
        ((m as any).autor?.apelido || '').toLowerCase().includes(term)
      const matchTipo = !tipoFilter || m.tipo === tipoFilter
      return matchSearch && matchTipo
    })
  }, [allMaterias, searchTerm, tipoFilter])

  const handleAddMateria = (materia: typeof allMaterias[0]) => {
    if (materia._sugestao) {
      onAddSuggestion(materia._sugestao)
    } else {
      const sigla = TIPO_LABELS[materia.tipo || ''] || materia.tipo || ''
      onNewPautaItemChange({
        ...newPautaItem,
        titulo: `${sigla} ${materia.numero}/${materia.ano} - ${materia.titulo}`,
        proposicaoId: materia.id
      })
      onAddItem()
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map(m => m.id)))
    }
  }

  const handleBulkAdd = async () => {
    if (!sessaoId || selectedIds.size === 0) return
    setBulkLoading(true)
    try {
      const res = await fetch(`/api/sessoes/${sessaoId}/pauta/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposicaoIds: Array.from(selectedIds), secao: newPautaItem.secao })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        const { adicionados, jaExistentes } = data.data
        const msg = `${adicionados} adicionada(s)${jaExistentes > 0 ? `, ${jaExistentes} ja na pauta` : ''}`
        alert(msg)
        setSelectedIds(new Set())
        onBulkAdded?.()
      } else {
        alert(data.error || 'Erro ao adicionar em lote')
      }
    } catch {
      alert('Erro ao adicionar em lote')
    } finally {
      setBulkLoading(false)
    }
  }

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <h4 className="font-semibold flex items-center gap-2">
        <Search className="h-4 w-4" />
        Matérias Disponíveis para Pauta
        <Badge variant="outline" className="ml-auto">{filtered.length} encontradas</Badge>
      </h4>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por titulo, numero, ementa ou autor..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={tipoFilter}
          onChange={(e) => setTipoFilter(e.target.value)}
          className="px-3 py-2 border rounded-md text-sm"
        >
          <option value="">Todos os tipos</option>
          {tipos.map(t => (
            <option key={t} value={t}>{TIPO_LABELS[t] || t.replace(/_/g, ' ')}</option>
          ))}
        </select>
        {(searchTerm || tipoFilter) && (
          <Button variant="ghost" size="sm" onClick={() => { setSearchTerm(''); setTipoFilter('') }}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {/* Barra de seleção em lote */}
      {sessaoId && (
        <div className="flex items-center gap-2 text-sm">
          <button
            type="button"
            onClick={toggleSelectAll}
            className="text-blue-600 hover:underline text-xs"
          >
            {selectedIds.size === filtered.length ? 'Desmarcar todas' : 'Selecionar todas'}
          </button>
          {selectedIds.size > 0 && (
            <>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">{selectedIds.size} selecionada(s)</span>
              <Button
                size="sm"
                onClick={handleBulkAdd}
                disabled={bulkLoading}
                className="ml-auto"
              >
                {bulkLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Plus className="h-3 w-3 mr-1" />
                )}
                Adicionar {selectedIds.size} à Pauta
              </Button>
            </>
          )}
        </div>
      )}
      <div className="max-h-64 overflow-y-auto space-y-1">
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">Nenhuma matéria encontrada</p>
        ) : (
          filtered.map(materia => (
            <div key={materia.id} className="flex items-center gap-3 p-2.5 rounded-lg border bg-white hover:bg-blue-50 transition-colors">
              {/* Checkbox de seleção */}
              {sessaoId && (
                <input
                  type="checkbox"
                  checked={selectedIds.has(materia.id)}
                  onChange={() => toggleSelect(materia.id)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  {materia.tipo && (
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {TIPO_LABELS[materia.tipo] || materia.tipo}
                    </Badge>
                  )}
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {materia.numero}/{materia.ano}
                  </span>
                  {materia._sugestao && (
                    <Badge className="bg-yellow-100 text-yellow-700 text-[10px] shrink-0">Sugerida</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-700 truncate">{materia.titulo}</p>
                {materia.autor && (
                  <p className="text-xs text-gray-500">
                    {materia.autor.apelido || materia.autor.nome}
                    {materia.autor.partido && ` (${materia.autor.partido})`}
                  </p>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAddMateria(materia)}
                disabled={suggestionApplyingId === materia._sugestao?.id}
                className="shrink-0"
              >
                {suggestionApplyingId === materia._sugestao?.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Plus className="h-3 w-3" />
                )}
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  )
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
  const [tiposExpediente, setTiposExpediente] = useState<Array<{ value: string; label: string }>>([])

  useEffect(() => {
    fetch('/api/tipos-expediente?ativo=true')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setTiposExpediente(data.data.map((t: any) => ({ value: t.id, label: t.nome })))
        }
      })
      .catch(() => {})
  }, [])

  const PAUTA_SECOES = tiposExpediente.length > 0 ? tiposExpediente : PAUTA_SECOES_FALLBACK

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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
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
              <div>
                <Label>Ação</Label>
                <select
                  value={newPautaItem.tipoAcao}
                  onChange={(e) => onNewPautaItemChange({ ...newPautaItem, tipoAcao: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                >
                  <option value="">Automática</option>
                  <option value="LEITURA">Leitura</option>
                  <option value="DISCUSSAO">Discussão</option>
                  <option value="VOTACAO">Votação</option>
                  <option value="LEITURA_VOTACAO">Leitura e Votação</option>
                  <option value="DISCUSSAO_VOTACAO">Discussão e Votação</option>
                  <option value="COMUNICADO">Comunicado</option>
                  <option value="HOMENAGEM">Homenagem</option>
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
              <div className="flex items-end gap-2">
                <Input
                  type="number"
                  value={newPautaItem.tempoEstimado}
                  onChange={(e) => onNewPautaItemChange({ ...newPautaItem, tempoEstimado: e.target.value })}
                  placeholder="Min"
                  className="w-20"
                />
                <Button onClick={onAddItem} className="flex-1">
                  <Plus className="h-4 w-4 mr-1" /> Adicionar
                </Button>
              </div>
            </div>
          </div>

          {/* Busca de Matérias para inclusão na pauta */}
          <MateriasSearchSection
            proposicoes={proposicoes}
            sugestoes={sugestoes}
            suggestionApplyingId={suggestionApplyingId}
            newPautaItem={newPautaItem}
            secoes={PAUTA_SECOES}
            sessaoId={sessao?.id}
            onNewPautaItemChange={onNewPautaItemChange}
            onAddItem={onAddItem}
            onAddSuggestion={onAddSuggestion}
            onBulkAdded={() => { /* refetch pauta handled by parent */ }}
          />

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
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="font-medium truncate">{item.titulo}</p>
                              {item.tipoAcao && (() => {
                                const acao = item.tipoAcao as string
                                const labels: Record<string, string> = {
                                  LEITURA: 'Leitura', VOTACAO: 'Votação', DISCUSSAO: 'Discussão',
                                  LEITURA_VOTACAO: 'Leitura e Votação', DISCUSSAO_VOTACAO: 'Discussão e Votação',
                                  COMUNICADO: 'Comunicado', HOMENAGEM: 'Homenagem'
                                }
                                const colors: Record<string, string> = {
                                  LEITURA: 'border-blue-300 text-blue-700', LEITURA_VOTACAO: 'border-blue-300 text-blue-700',
                                  VOTACAO: 'border-green-300 text-green-700',
                                  DISCUSSAO: 'border-yellow-300 text-yellow-700', DISCUSSAO_VOTACAO: 'border-yellow-300 text-yellow-700',
                                  COMUNICADO: 'border-gray-300 text-gray-700', HOMENAGEM: 'border-purple-300 text-purple-700'
                                }
                                return (
                                  <Badge variant="outline" className={cn('text-[10px] shrink-0', colors[acao] || '')}>
                                    {labels[acao] || acao}
                                  </Badge>
                                )
                              })()}
                            </div>
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
