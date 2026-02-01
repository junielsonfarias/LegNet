'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
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
import {
  Mic,
  MicOff,
  Plus,
  Loader2,
  GripVertical,
  Clock,
  Trash2,
  Play,
  CheckCircle2,
  User,
  Timer,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Parlamentar {
  id: string
  nome: string
  apelido: string | null
  partido: string | null
}

interface Orador {
  id: string
  parlamentarId: string
  tipo: 'PEQUENO_EXPEDIENTE' | 'GRANDE_EXPEDIENTE' | 'EXPLICACAO_PESSOAL' | 'APARTES' | 'ORDEM' | 'LIDERANCA' | 'OUTROS'
  ordem: number
  tempoLimite: number | null
  tempoUsado: number | null
  assunto: string | null
  status: 'INSCRITO' | 'FALANDO' | 'CONCLUIDO' | 'CANCELADO'
  iniciadoEm: string | null
  finalizadoEm: string | null
  parlamentar: Parlamentar
}

interface OradoresData {
  oradores: Orador[]
  totaisPorTipo: Record<string, number>
}

interface OradoresSessaoEditorProps {
  sessaoId: string
  readOnly?: boolean
}

const TIPOS_ORADOR = [
  { value: 'PEQUENO_EXPEDIENTE', label: 'Pequeno Expediente', tempo: 5 },
  { value: 'GRANDE_EXPEDIENTE', label: 'Grande Expediente', tempo: 15 },
  { value: 'EXPLICACAO_PESSOAL', label: 'Explicação Pessoal', tempo: 3 },
  { value: 'APARTES', label: 'Apartes', tempo: 1 },
  { value: 'ORDEM', label: 'Questão de Ordem', tempo: 3 },
  { value: 'LIDERANCA', label: 'Liderança', tempo: 5 },
  { value: 'OUTROS', label: 'Outros', tempo: 5 }
]

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: any }> = {
  INSCRITO: { label: 'Inscrito', className: 'bg-blue-100 text-blue-700', icon: User },
  FALANDO: { label: 'Falando', className: 'bg-green-100 text-green-700', icon: Mic },
  CONCLUIDO: { label: 'Concluído', className: 'bg-gray-100 text-gray-700', icon: CheckCircle2 },
  CANCELADO: { label: 'Cancelado', className: 'bg-red-100 text-red-700', icon: MicOff }
}

export function OradoresSessaoEditor({ sessaoId, readOnly = false }: OradoresSessaoEditorProps) {
  const [data, setData] = useState<OradoresData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [parlamentares, setParlamentares] = useState<Parlamentar[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedTipo, setSelectedTipo] = useState<string>('PEQUENO_EXPEDIENTE')
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; oradorId: string | null; nome: string }>({
    open: false,
    oradorId: null,
    nome: ''
  })
  const [deleting, setDeleting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    parlamentarId: '',
    tipo: 'PEQUENO_EXPEDIENTE',
    tempoLimite: 5,
    assunto: ''
  })

  const fetchOradores = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/sessoes/${sessaoId}/oradores`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Erro ao carregar oradores')
      }

      setData(result.data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [sessaoId])

  const fetchParlamentares = useCallback(async () => {
    try {
      const response = await fetch('/api/parlamentares?ativo=true&mandatoAtivo=true')
      const result = await response.json()
      if (response.ok) {
        setParlamentares(result.data || result)
      }
    } catch (err) {
      console.error('Erro ao carregar parlamentares:', err)
    }
  }, [])

  useEffect(() => {
    fetchOradores()
    fetchParlamentares()
  }, [fetchOradores, fetchParlamentares])

  const handleAddOrador = async () => {
    if (!formData.parlamentarId) return

    try {
      setSaving(true)
      const response = await fetch(`/api/sessoes/${sessaoId}/oradores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parlamentarId: formData.parlamentarId,
          tipo: formData.tipo,
          tempoLimite: formData.tempoLimite,
          assunto: formData.assunto || undefined
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Erro ao inscrever orador')
      }

      setShowAddDialog(false)
      setFormData({
        parlamentarId: '',
        tipo: 'PEQUENO_EXPEDIENTE',
        tempoLimite: 5,
        assunto: ''
      })
      fetchOradores()
    } catch (err) {
      console.error('Erro ao inscrever orador:', err)
      toast.error(err instanceof Error ? err.message : 'Erro ao inscrever orador')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateStatus = async (oradorId: string, status: string) => {
    try {
      const response = await fetch(`/api/sessoes/${sessaoId}/oradores/${oradorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.message || 'Erro ao atualizar status')
      }

      fetchOradores()
    } catch (err) {
      console.error('Erro ao atualizar status:', err)
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar status')
    }
  }

  const handleRemoveOrador = async () => {
    if (!deleteConfirm.oradorId) return

    try {
      setDeleting(true)
      const response = await fetch(`/api/sessoes/${sessaoId}/oradores/${deleteConfirm.oradorId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.message || 'Erro ao remover orador')
      }

      toast.success('Orador removido com sucesso')
      setDeleteConfirm({ open: false, oradorId: null, nome: '' })
      fetchOradores()
    } catch (err) {
      console.error('Erro ao remover orador:', err)
      toast.error(err instanceof Error ? err.message : 'Erro ao remover orador')
    } finally {
      setDeleting(false)
    }
  }

  const openDeleteConfirm = (orador: Orador) => {
    setDeleteConfirm({
      open: true,
      oradorId: orador.id,
      nome: orador.parlamentar.apelido || orador.parlamentar.nome
    })
  }

  const formatTempo = (segundos: number | null) => {
    if (!segundos) return '--:--'
    const min = Math.floor(segundos / 60)
    const seg = segundos % 60
    return `${min}:${seg.toString().padStart(2, '0')}`
  }

  // Get oradores filtered by selected tipo
  const oradoresFiltrados = data?.oradores.filter(o => o.tipo === selectedTipo) || []

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-2 py-8 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Carregando oradores...</span>
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
            <Button variant="outline" size="sm" onClick={fetchOradores} className="mt-2">
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Oradores
            </CardTitle>
            {!readOnly && (
              <Button size="sm" onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Inscrever
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Tipo selector */}
          <div className="mb-4">
            <Select value={selectedTipo} onValueChange={setSelectedTipo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_ORADOR.map(tipo => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    {tipo.label}
                    {data?.totaisPorTipo[tipo.value] ? (
                      <span className="ml-2 text-gray-500">
                        ({data.totaisPorTipo[tipo.value]})
                      </span>
                    ) : null}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lista de oradores */}
          {oradoresFiltrados.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MicOff className="h-10 w-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Nenhum orador inscrito</p>
              {!readOnly && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, tipo: selectedTipo }))
                    setShowAddDialog(true)
                  }}
                >
                  Inscrever orador
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {oradoresFiltrados.map((orador, idx) => {
                const statusConfig = STATUS_CONFIG[orador.status]
                const StatusIcon = statusConfig.icon

                return (
                  <div
                    key={orador.id}
                    className={cn(
                      'p-3 rounded-lg border transition-colors',
                      orador.status === 'FALANDO' && 'bg-green-50 border-green-300',
                      orador.status === 'INSCRITO' && 'bg-white hover:bg-gray-50',
                      orador.status === 'CONCLUIDO' && 'bg-gray-50 border-gray-200',
                      orador.status === 'CANCELADO' && 'bg-red-50 border-red-200 opacity-60'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {!readOnly && orador.status === 'INSCRITO' && (
                        <GripVertical className="h-5 w-5 text-gray-400 cursor-grab mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-400">
                            {idx + 1}.
                          </span>
                          <span className="font-medium text-gray-900">
                            {orador.parlamentar.apelido || orador.parlamentar.nome}
                          </span>
                          {orador.parlamentar.partido && (
                            <span className="text-xs text-gray-500">
                              ({orador.parlamentar.partido})
                            </span>
                          )}
                        </div>
                        {orador.assunto && (
                          <p className="text-sm text-gray-600 mt-1">{orador.assunto}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Timer className="h-3 w-3" />
                            Limite: {formatTempo((orador.tempoLimite || 0) * 60)}
                          </span>
                          {orador.tempoUsado && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Usado: {formatTempo(orador.tempoUsado)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={cn(statusConfig.className, 'text-xs')}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                        {!readOnly && (
                          <div className="flex gap-1">
                            {orador.status === 'INSCRITO' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-100"
                                onClick={() => handleUpdateStatus(orador.id, 'FALANDO')}
                                title="Iniciar discurso"
                                aria-label="Iniciar discurso"
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            )}
                            {orador.status === 'FALANDO' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                                onClick={() => handleUpdateStatus(orador.id, 'CONCLUIDO')}
                                title="Concluir discurso"
                                aria-label="Concluir discurso"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                            )}
                            {orador.status === 'INSCRITO' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
                                onClick={() => openDeleteConfirm(orador)}
                                title="Remover orador"
                                aria-label="Remover orador"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para adicionar orador */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inscrever Orador</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Parlamentar</Label>
              <Select
                value={formData.parlamentarId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, parlamentarId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o parlamentar" />
                </SelectTrigger>
                <SelectContent>
                  {parlamentares.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.apelido || p.nome}
                      {p.partido && ` (${p.partido})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value) => {
                  const tipoConfig = TIPOS_ORADOR.find(t => t.value === value)
                  setFormData(prev => ({
                    ...prev,
                    tipo: value,
                    tempoLimite: tipoConfig?.tempo || 5
                  }))
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_ORADOR.map(tipo => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label} ({tipo.tempo} min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tempo Limite (minutos)</Label>
              <Input
                type="number"
                min={1}
                max={60}
                value={formData.tempoLimite}
                onChange={(e) => setFormData(prev => ({ ...prev, tempoLimite: parseInt(e.target.value) || 5 }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Assunto (opcional)</Label>
              <Textarea
                value={formData.assunto}
                onChange={(e) => setFormData(prev => ({ ...prev, assunto: e.target.value }))}
                placeholder="Tema do discurso..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddOrador} disabled={saving || !formData.parlamentarId}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Inscrever
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteConfirm.open} onOpenChange={(open) => !deleting && setDeleteConfirm(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover orador</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{deleteConfirm.nome}</strong> da lista de oradores?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveOrador}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
