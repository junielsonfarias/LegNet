'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Plus, Edit, Trash2, BookOpen, Loader2, Clock, GripVertical } from 'lucide-react'
import { toast } from 'sonner'

interface TipoExpediente {
  id: string
  nome: string
  descricao: string | null
  ordem: number
  tempoMaximo: number | null
  ativo: boolean
  createdAt: string
  updatedAt: string
  _count?: {
    expedientes: number
  }
}

interface FormData {
  nome: string
  descricao: string
  ordem: number
  tempoMaximo: number | null
  ativo: boolean
}

export default function TiposExpedientePage() {
  const [tipos, setTipos] = useState<TipoExpediente[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTipo, setEditingTipo] = useState<TipoExpediente | null>(null)
  const [formData, setFormData] = useState<FormData>({
    nome: '',
    descricao: '',
    ordem: 0,
    tempoMaximo: null,
    ativo: true
  })

  const loadTipos = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/tipos-expediente?includeInactive=true')
      const data = await response.json()

      if (data.success) {
        setTipos(data.data || [])
      } else {
        toast.error(data.message || 'Erro ao carregar tipos de expediente')
      }
    } catch (error) {
      console.error('Erro ao carregar tipos:', error)
      toast.error('Erro ao carregar tipos de expediente')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTipos()
  }, [loadTipos])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nome.trim()) {
      toast.error('Nome é obrigatório')
      return
    }

    try {
      setSaving(true)

      const url = editingTipo
        ? `/api/tipos-expediente/${editingTipo.id}`
        : '/api/tipos-expediente'

      const method = editingTipo ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: formData.nome.trim(),
          descricao: formData.descricao.trim() || undefined,
          ordem: formData.ordem,
          tempoMaximo: formData.tempoMaximo || null,
          ativo: formData.ativo
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(editingTipo
          ? 'Tipo de expediente atualizado com sucesso!'
          : 'Tipo de expediente criado com sucesso!'
        )
        loadTipos()
        handleClose()
      } else {
        toast.error(data.message || 'Erro ao salvar tipo de expediente')
      }
    } catch (error) {
      console.error('Erro ao salvar tipo de expediente:', error)
      toast.error('Erro ao salvar tipo de expediente')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (tipo: TipoExpediente) => {
    setEditingTipo(tipo)
    setFormData({
      nome: tipo.nome,
      descricao: tipo.descricao || '',
      ordem: tipo.ordem,
      tempoMaximo: tipo.tempoMaximo,
      ativo: tipo.ativo
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este tipo de expediente?')) {
      return
    }

    try {
      const response = await fetch(`/api/tipos-expediente/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message || 'Tipo de expediente excluído com sucesso!')
        loadTipos()
      } else {
        toast.error(data.message || 'Erro ao excluir tipo de expediente')
      }
    } catch (error) {
      console.error('Erro ao excluir tipo de expediente:', error)
      toast.error('Erro ao excluir tipo de expediente')
    }
  }

  const handleToggleAtivo = async (tipo: TipoExpediente) => {
    try {
      const response = await fetch(`/api/tipos-expediente/${tipo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !tipo.ativo })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(tipo.ativo ? 'Tipo desativado' : 'Tipo ativado')
        loadTipos()
      } else {
        toast.error(data.message || 'Erro ao atualizar status')
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast.error('Erro ao atualizar status')
    }
  }

  const handleClose = () => {
    setIsModalOpen(false)
    setEditingTipo(null)
    setFormData({
      nome: '',
      descricao: '',
      ordem: 0,
      tempoMaximo: null,
      ativo: true
    })
  }

  const handleNew = () => {
    // Set default order to be after the last one
    const maxOrdem = tipos.reduce((max, t) => Math.max(max, t.ordem), 0)
    setFormData({
      nome: '',
      descricao: '',
      ordem: maxOrdem + 1,
      tempoMaximo: null,
      ativo: true
    })
    setIsModalOpen(true)
  }

  const formatTempo = (minutos: number | null) => {
    if (!minutos) return 'Sem limite'
    if (minutos < 60) return `${minutos} min`
    const horas = Math.floor(minutos / 60)
    const mins = minutos % 60
    return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-500">Carregando...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tipos de Expediente</h1>
          <p className="text-gray-600">
            Configure os tipos de expediente que podem ser utilizados nas sessoes
          </p>
        </div>
        <Button onClick={handleNew} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Tipo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Tipos Cadastrados ({tipos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tipos.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Nenhum tipo de expediente cadastrado.</p>
                <p className="text-sm mt-1">
                  Cadastre tipos como: Pequeno Expediente, Grande Expediente, Comunicacoes, etc.
                </p>
                <Button onClick={handleNew} variant="link" className="mt-2">
                  Criar primeiro tipo
                </Button>
              </div>
            ) : (
              tipos.map((tipo) => (
                <div
                  key={tipo.id}
                  className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
                    !tipo.ativo ? 'opacity-60 bg-gray-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="text-gray-400 cursor-grab">
                      <GripVertical className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-lg">{tipo.nome}</h3>
                        <Badge variant="outline" className="text-xs">
                          Ordem: {tipo.ordem}
                        </Badge>
                        {tipo.tempoMaximo && (
                          <Badge variant="secondary" className="text-xs flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTempo(tipo.tempoMaximo)}
                          </Badge>
                        )}
                        {!tipo.ativo && (
                          <Badge variant="destructive" className="text-xs">
                            Inativo
                          </Badge>
                        )}
                      </div>
                      {tipo.descricao && (
                        <p className="text-sm text-gray-600">{tipo.descricao}</p>
                      )}
                      {tipo._count && tipo._count.expedientes > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Usado em {tipo._count.expedientes} sessao(oes)
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Switch
                      checked={tipo.ativo}
                      onCheckedChange={() => handleToggleAtivo(tipo)}
                      title={tipo.ativo ? 'Desativar' : 'Ativar'}
                    />
                    <Button variant="outline" size="sm" onClick={() => handleEdit(tipo)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(tipo.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dicas */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-blue-900 mb-2">Tipos de expediente comuns:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Pequeno Expediente</strong>: Tempo para leitura de documentos e correspondencias (5-10 min)</li>
            <li>• <strong>Grande Expediente</strong>: Tempo para discursos dos parlamentares (15-20 min)</li>
            <li>• <strong>Comunicacoes</strong>: Informes e comunicados oficiais</li>
            <li>• <strong>Explicacao Pessoal</strong>: Tempo para parlamentar explicar posicionamento (3-5 min)</li>
            <li>• <strong>Homenagens</strong>: Tempo dedicado a homenagens e mocoes</li>
          </ul>
        </CardContent>
      </Card>

      {/* Modal de Cadastro/Edição */}
      <Dialog open={isModalOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTipo ? 'Editar Tipo de Expediente' : 'Novo Tipo de Expediente'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Grande Expediente"
                required
              />
            </div>

            <div>
              <Label htmlFor="descricao">Descricao</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descreva o tipo de expediente..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ordem">Ordem de Exibicao</Label>
                <Input
                  id="ordem"
                  type="number"
                  min="0"
                  value={formData.ordem}
                  onChange={(e) => setFormData({
                    ...formData,
                    ordem: parseInt(e.target.value) || 0
                  })}
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Define a ordem de exibicao na sessao
                </p>
              </div>
              <div>
                <Label htmlFor="tempoMaximo">Tempo Maximo (minutos)</Label>
                <Input
                  id="tempoMaximo"
                  type="number"
                  min="0"
                  value={formData.tempoMaximo || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    tempoMaximo: e.target.value ? parseInt(e.target.value) : null
                  })}
                  placeholder="Sem limite"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Deixe vazio para sem limite de tempo
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
              />
              <Label htmlFor="ativo">Ativo</Label>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={handleClose} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingTipo ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
