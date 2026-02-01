'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import {
  BookOpen,
  Loader2,
  Save,
  FileText,
  AlertCircle,
  CheckCircle2,
  Trash2
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface TipoExpediente {
  id: string
  nome: string
  descricao: string | null
  ordem: number
  tempoMaximo: number | null
  ativo: boolean
}

interface Expediente {
  id: string
  tipoExpedienteId: string
  conteudo: string
  ordem: number
  tipoExpediente: TipoExpediente
}

interface ExpedientesPorTipo {
  tipo: TipoExpediente
  expediente: Expediente | null
}

interface ExpedientesData {
  expedientes: Expediente[]
  tiposExpediente: TipoExpediente[]
  expedientesPorTipo: ExpedientesPorTipo[]
}

interface ExpedientesSessaoEditorProps {
  sessaoId: string
  readOnly?: boolean
}

export function ExpedientesSessaoEditor({ sessaoId, readOnly = false }: ExpedientesSessaoEditorProps) {
  const [data, setData] = useState<ExpedientesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState<Record<string, string>>({})
  const [unsavedChanges, setUnsavedChanges] = useState<Set<string>>(new Set())
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; tipoId: string; expedienteId: string; nome: string }>({
    open: false,
    tipoId: '',
    expedienteId: '',
    nome: ''
  })

  const fetchExpedientes = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/sessoes/${sessaoId}/expedientes`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Erro ao carregar expedientes')
      }

      setData(result.data)

      // Initialize editing content
      const initial: Record<string, string> = {}
      result.data.expedientesPorTipo.forEach((item: ExpedientesPorTipo) => {
        initial[item.tipo.id] = item.expediente?.conteudo || ''
      })
      setEditingContent(initial)
      setUnsavedChanges(new Set())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [sessaoId])

  useEffect(() => {
    fetchExpedientes()
  }, [fetchExpedientes])

  const handleContentChange = (tipoId: string, content: string) => {
    setEditingContent(prev => ({ ...prev, [tipoId]: content }))

    // Check if content differs from saved
    const expediente = data?.expedientesPorTipo.find(e => e.tipo.id === tipoId)?.expediente
    const savedContent = expediente?.conteudo || ''

    setUnsavedChanges(prev => {
      const next = new Set(prev)
      if (content !== savedContent) {
        next.add(tipoId)
      } else {
        next.delete(tipoId)
      }
      return next
    })
  }

  const handleSave = async (tipoId: string) => {
    const content = editingContent[tipoId]
    if (content === undefined) return

    try {
      setSavingId(tipoId)
      const response = await fetch(`/api/sessoes/${sessaoId}/expedientes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipoExpedienteId: tipoId,
          conteudo: content
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Erro ao salvar expediente')
      }

      // Update local data
      setData(prev => {
        if (!prev) return prev
        return {
          ...prev,
          expedientesPorTipo: prev.expedientesPorTipo.map(item =>
            item.tipo.id === tipoId
              ? { ...item, expediente: result.data }
              : item
          )
        }
      })

      setUnsavedChanges(prev => {
        const next = new Set(prev)
        next.delete(tipoId)
        return next
      })
    } catch (err) {
      console.error('Erro ao salvar expediente:', err)
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar expediente')
    } finally {
      setSavingId(null)
    }
  }

  const openDeleteConfirm = (tipoId: string, expedienteId: string, nome: string) => {
    setDeleteConfirm({ open: true, tipoId, expedienteId, nome })
  }

  const handleDelete = async () => {
    if (!deleteConfirm.expedienteId) return

    try {
      setSavingId(deleteConfirm.tipoId)
      const response = await fetch(`/api/sessoes/${sessaoId}/expedientes/${deleteConfirm.expedienteId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.message || 'Erro ao remover expediente')
      }

      // Update local data
      setData(prev => {
        if (!prev) return prev
        return {
          ...prev,
          expedientesPorTipo: prev.expedientesPorTipo.map(item =>
            item.tipo.id === deleteConfirm.tipoId
              ? { ...item, expediente: null }
              : item
          )
        }
      })

      setEditingContent(prev => ({ ...prev, [deleteConfirm.tipoId]: '' }))
      setUnsavedChanges(prev => {
        const next = new Set(prev)
        next.delete(deleteConfirm.tipoId)
        return next
      })
      toast.success('Expediente removido')
      setDeleteConfirm({ open: false, tipoId: '', expedienteId: '', nome: '' })
    } catch (err) {
      console.error('Erro ao remover expediente:', err)
      toast.error(err instanceof Error ? err.message : 'Erro ao remover expediente')
    } finally {
      setSavingId(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-2 py-8 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Carregando expedientes...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-red-600">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>{error}</p>
            <Button variant="outline" size="sm" onClick={fetchExpedientes} className="mt-2">
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const expedientesPorTipo = data?.expedientesPorTipo || []
  const totalComConteudo = expedientesPorTipo.filter(e => e.expediente?.conteudo).length

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Expedientes
          </CardTitle>
          <Badge variant="secondary">
            {totalComConteudo} / {expedientesPorTipo.length} preenchidos
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {expedientesPorTipo.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-10 w-10 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Nenhum tipo de expediente configurado</p>
            <p className="text-xs mt-1">
              Configure em Configurações → Tipos de Expediente
            </p>
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {expedientesPorTipo.map(({ tipo, expediente }) => {
              const hasContent = !!expediente?.conteudo
              const hasChanges = unsavedChanges.has(tipo.id)
              const isSaving = savingId === tipo.id

              return (
                <AccordionItem key={tipo.id} value={tipo.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 text-left">
                      <span className="font-medium">{tipo.nome}</span>
                      {hasContent && (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      )}
                      {hasChanges && (
                        <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-300">
                          Não salvo
                        </Badge>
                      )}
                      {tipo.tempoMaximo && (
                        <span className="text-xs text-gray-500">
                          ({tipo.tempoMaximo} min)
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-2">
                      {tipo.descricao && (
                        <p className="text-sm text-gray-500 italic">
                          {tipo.descricao}
                        </p>
                      )}

                      {readOnly ? (
                        <div className={cn(
                          'p-3 rounded-lg border bg-gray-50 min-h-[100px]',
                          !expediente?.conteudo && 'text-gray-400 italic'
                        )}>
                          {expediente?.conteudo || 'Sem conteúdo'}
                        </div>
                      ) : (
                        <>
                          <Textarea
                            value={editingContent[tipo.id] || ''}
                            onChange={(e) => handleContentChange(tipo.id, e.target.value)}
                            placeholder={`Digite o conteúdo do ${tipo.nome.toLowerCase()}...`}
                            rows={6}
                            className="resize-y"
                          />

                          <div className="flex items-center justify-between">
                            <div className="text-xs text-gray-500">
                              {editingContent[tipo.id]?.length || 0} caracteres
                            </div>
                            <div className="flex gap-2">
                              {expediente && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openDeleteConfirm(tipo.id, expediente.id, tipo.nome)}
                                  disabled={isSaving}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  aria-label={`Limpar conteúdo de ${tipo.nome}`}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Limpar
                                </Button>
                              )}
                              <Button
                                size="sm"
                                onClick={() => handleSave(tipo.id)}
                                disabled={isSaving || !editingContent[tipo.id]?.trim()}
                              >
                                {isSaving ? (
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                ) : (
                                  <Save className="h-4 w-4 mr-1" />
                                )}
                                Salvar
                              </Button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        )}
      </CardContent>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteConfirm.open} onOpenChange={(open) => !savingId && setDeleteConfirm(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar expediente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja limpar o conteúdo de <strong>{deleteConfirm.nome}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!savingId}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={!!savingId}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {savingId && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Limpar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
