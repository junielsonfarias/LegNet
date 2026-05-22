'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { HelpCircle, Plus, Loader2, Trash2, Save, X, Pencil } from 'lucide-react'
import { toast } from 'sonner'

interface Pergunta {
  id: string
  pergunta: string
  resposta: string
  categoria: string | null
  ordem: number
  ativo: boolean
}

const EMPTY_FORM = {
  pergunta: '',
  resposta: '',
  categoria: '',
  ordem: 0,
  ativo: true
}

export default function AdminFaqPage() {
  const [data, setData] = useState<Pergunta[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm({ ...EMPTY_FORM })
  }

  const load = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/faq?limit=500')
      const j = await r.json()
      setData(j?.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleEdit = (p: Pergunta) => {
    setEditingId(p.id)
    setForm({
      pergunta: p.pergunta,
      resposta: p.resposta,
      categoria: p.categoria || '',
      ordem: p.ordem,
      ativo: p.ativo
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.pergunta.trim() || !form.resposta.trim()) {
      toast.error('Preencha pergunta e resposta')
      return
    }
    setSaving(true)
    try {
      const url = editingId ? `/api/faq/${editingId}` : '/api/faq'
      const method = editingId ? 'PUT' : 'POST'
      const payload = {
        pergunta: form.pergunta.trim(),
        resposta: form.resposta.trim(),
        categoria: form.categoria.trim() || null,
        ordem: Number(form.ordem),
        ativo: form.ativo
      }
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (r.ok) {
        toast.success(editingId ? 'Pergunta atualizada' : 'Pergunta criada')
        closeForm()
        load()
      } else {
        const e = await r.json().catch(() => ({}))
        toast.error(e?.message || 'Erro ao salvar')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remover esta pergunta?')) return
    const r = await fetch(`/api/faq/${id}`, { method: 'DELETE' })
    if (r.ok) {
      toast.success('Removida')
      load()
    } else {
      toast.error('Erro ao remover')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <HelpCircle className="h-6 w-6" /> Perguntas Frequentes (FAQ)
          </h1>
          <p className="text-sm text-muted-foreground">
            Duvidas comuns dos cidadaos sobre a Camara e o portal
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={showForm}>
          <Plus className="h-4 w-4 mr-1" /> Nova Pergunta
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              {editingId ? 'Editar pergunta' : 'Nova pergunta'}
            </CardTitle>
            <Button size="icon" variant="ghost" onClick={closeForm}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Pergunta *</Label>
              <Textarea
                rows={2}
                value={form.pergunta}
                onChange={e => setForm({ ...form, pergunta: e.target.value })}
              />
            </div>
            <div>
              <Label>Resposta *</Label>
              <Textarea
                rows={4}
                value={form.resposta}
                onChange={e => setForm({ ...form, resposta: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label>Categoria</Label>
                <Input
                  value={form.categoria}
                  onChange={e => setForm({ ...form, categoria: e.target.value })}
                  placeholder="Opcional"
                />
              </div>
              <div>
                <Label>Ordem</Label>
                <Input
                  type="number"
                  value={form.ordem}
                  onChange={e => setForm({ ...form, ordem: Number(e.target.value) })}
                />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.ativo}
                    onChange={e => setForm({ ...form, ativo: e.target.checked })}
                  />
                  Visivel no portal
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeForm}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                {editingId ? 'Atualizar' : 'Salvar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : data.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">
              Nenhuma pergunta cadastrada.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-3 py-2 w-16">Ordem</th>
                    <th className="px-3 py-2">Pergunta</th>
                    <th className="px-3 py-2">Categoria</th>
                    <th className="px-3 py-2 text-center">Visivel</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(p => (
                    <tr key={p.id} className="border-t">
                      <td className="px-3 py-2 text-muted-foreground">{p.ordem}</td>
                      <td className="px-3 py-2 max-w-md">
                        <span className="line-clamp-2">{p.pergunta}</span>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{p.categoria || '-'}</td>
                      <td className="px-3 py-2 text-center">
                        {p.ativo ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">Sim</span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">Nao</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(p)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(p.id)}
                            className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
