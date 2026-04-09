'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Mail, Plus, Search, Edit, Trash2, Loader2,
  Calendar, User, FileText, CheckCircle, XCircle, ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'

interface Oficio {
  id: string
  numero: string
  data: string
  remetente: string
  assunto: string
  arquivo: string | null
  observacoes: string | null
  lido: boolean
  createdAt: string
}

export default function OficiosPage() {
  const [oficios, setOficios] = useState<Oficio[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    numero: '',
    data: new Date().toISOString().split('T')[0],
    remetente: '',
    assunto: '',
    arquivo: '',
    observacoes: ''
  })

  const fetchOficios = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/oficios?limit=100')
      const result = await res.json()
      if (result.success) {
        setOficios(result.data || [])
      }
    } catch {
      toast.error('Erro ao carregar ofícios')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchOficios() }, [fetchOficios])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.numero.trim() || !formData.remetente.trim() || !formData.assunto.trim()) {
      toast.error('Preencha os campos obrigatórios')
      return
    }

    setSaving(true)
    try {
      const url = editingId ? `/api/oficios/${editingId}` : '/api/oficios'
      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          arquivo: formData.arquivo || undefined,
          observacoes: formData.observacoes || undefined
        })
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Erro ao salvar ofício')
        return
      }
      const result = await res.json()
      if (result.success) {
        toast.success(editingId ? 'Ofício atualizado' : 'Ofício cadastrado')
        resetForm()
        fetchOficios()
      } else {
        toast.error(result.error || 'Erro ao salvar')
      }
    } catch {
      toast.error('Erro ao salvar ofício')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (oficio: Oficio) => {
    setFormData({
      numero: oficio.numero,
      data: oficio.data.substring(0, 10),
      remetente: oficio.remetente,
      assunto: oficio.assunto,
      arquivo: oficio.arquivo || '',
      observacoes: oficio.observacoes || ''
    })
    setEditingId(oficio.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este ofício?')) return
    try {
      const res = await fetch(`/api/oficios/${id}`, { method: 'DELETE' })
      const result = await res.json()
      if (result.success) {
        toast.success('Ofício removido')
        fetchOficios()
      } else {
        toast.error(result.error || 'Erro ao remover')
      }
    } catch {
      toast.error('Erro ao remover ofício')
    }
  }

  const handleToggleLido = async (oficio: Oficio) => {
    try {
      const res = await fetch(`/api/oficios/${oficio.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lido: !oficio.lido })
      })
      const result = await res.json()
      if (result.success) {
        toast.success(oficio.lido ? 'Marcado como não lido' : 'Marcado como lido')
        fetchOficios()
      } else {
        toast.error(result.error || 'Erro ao atualizar status')
      }
    } catch {
      toast.error('Erro ao atualizar status')
    }
  }

  const resetForm = () => {
    setFormData({ numero: '', data: new Date().toISOString().split('T')[0], remetente: '', assunto: '', arquivo: '', observacoes: '' })
    setEditingId(null)
    setShowForm(false)
  }

  const filtered = oficios.filter(o => {
    const term = searchTerm.toLowerCase()
    return !term ||
      o.numero.toLowerCase().includes(term) ||
      o.remetente.toLowerCase().includes(term) ||
      o.assunto.toLowerCase().includes(term)
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Mail className="h-7 w-7 text-blue-600" />
            Ofícios Recebidos
          </h1>
          <p className="text-gray-600 mt-1">Cadastre e gerencie os ofícios recebidos pela Câmara</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Ofício
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{oficios.length}</div>
            <p className="text-sm text-gray-600">Total de Ofícios</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{oficios.filter(o => o.lido).length}</div>
            <p className="text-sm text-gray-600">Lidos em Sessão</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">{oficios.filter(o => !o.lido).length}</div>
            <p className="text-sm text-gray-600">Pendentes de Leitura</p>
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por número, remetente ou assunto..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Formulário */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Editar Ofício' : 'Novo Ofício'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numero">Número *</Label>
                  <Input
                    id="numero"
                    value={formData.numero}
                    onChange={e => setFormData({ ...formData, numero: e.target.value })}
                    placeholder="001/2026"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data">Data *</Label>
                  <Input
                    id="data"
                    type="date"
                    value={formData.data}
                    onChange={e => setFormData({ ...formData, data: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="remetente">Remetente *</Label>
                  <Input
                    id="remetente"
                    value={formData.remetente}
                    onChange={e => setFormData({ ...formData, remetente: e.target.value })}
                    placeholder="Gabinete do Prefeito"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assunto">Assunto *</Label>
                <Textarea
                  id="assunto"
                  value={formData.assunto}
                  onChange={e => setFormData({ ...formData, assunto: e.target.value })}
                  placeholder="Descrição do assunto do ofício..."
                  rows={3}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="arquivo">URL do Arquivo (PDF)</Label>
                  <Input
                    id="arquivo"
                    type="url"
                    value={formData.arquivo}
                    onChange={e => setFormData({ ...formData, arquivo: e.target.value })}
                    placeholder="https://exemplo.com/oficio.pdf"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Input
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
                    placeholder="Observações adicionais..."
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingId ? 'Salvar Alterações' : 'Cadastrar Ofício'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum ofício encontrado</h3>
            <p className="text-gray-600">{searchTerm ? 'Tente ajustar a busca.' : 'Cadastre o primeiro ofício.'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(oficio => (
            <Card key={oficio.id} className="hover:shadow-md transition-shadow">
              <CardContent className="py-4 px-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="bg-blue-100 p-2 rounded-lg shrink-0">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">Ofício nº {oficio.numero}</h3>
                        <Badge className={oficio.lido ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                          {oficio.lido ? 'Lido' : 'Pendente'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-1">{oficio.assunto}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {oficio.remetente}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(oficio.data.substring(0, 10) + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {oficio.arquivo && (
                      <Button asChild size="sm" variant="ghost">
                        <a href={oficio.arquivo} target="_blank" rel="noopener noreferrer" title="Ver documento">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => handleToggleLido(oficio)} title={oficio.lido ? 'Marcar como não lido' : 'Marcar como lido'}>
                      {oficio.lido ? <XCircle className="h-4 w-4 text-orange-500" /> : <CheckCircle className="h-4 w-4 text-green-500" />}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(oficio)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDelete(oficio.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
