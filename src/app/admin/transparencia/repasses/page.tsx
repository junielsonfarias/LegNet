'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Banknote, Plus, Loader2, Trash2, Save, X, Pencil } from 'lucide-react'
import { toast } from 'sonner'

interface Repasse {
  id: string
  orgaoOrigem: string
  programa: string | null
  acao: string | null
  valor: number
  data: string
  ano: number
  mes: number
  fonteRecurso: string | null
  observacoes: string | null
}

const EMPTY_FORM = {
  orgaoOrigem: '',
  programa: '',
  acao: '',
  valor: '',
  data: new Date().toISOString().split('T')[0],
  ano: new Date().getFullYear(),
  mes: new Date().getMonth() + 1,
  fonteRecurso: '',
  observacoes: ''
}

export default function AdminRepassesPage() {
  const [data, setData] = useState<Repasse[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/repasses?limit=100')
      const j = await r.json()
      setData(j?.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm({ ...EMPTY_FORM })
  }

  const handleEdit = (r: Repasse) => {
    setEditingId(r.id)
    setForm({
      orgaoOrigem: r.orgaoOrigem,
      programa: r.programa || '',
      acao: r.acao || '',
      valor: String(r.valor),
      data: r.data.split('T')[0],
      ano: r.ano,
      mes: r.mes,
      fonteRecurso: r.fonteRecurso || '',
      observacoes: r.observacoes || ''
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const url = editingId ? `/api/repasses/${editingId}` : '/api/repasses'
      const method = editingId ? 'PUT' : 'POST'
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgaoOrigem: form.orgaoOrigem,
          programa: form.programa || undefined,
          acao: form.acao || undefined,
          valor: Number(form.valor),
          data: form.data,
          ano: Number(form.ano),
          mes: Number(form.mes),
          fonteRecurso: form.fonteRecurso || undefined,
          observacoes: form.observacoes || undefined
        })
      })
      if (r.ok) {
        toast.success(editingId ? 'Repasse atualizado' : 'Repasse criado')
        closeForm()
        load()
      } else {
        toast.error('Erro ao salvar')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remover este repasse?')) return
    const r = await fetch(`/api/repasses/${id}`, { method: 'DELETE' })
    if (r.ok) { toast.success('Removido'); load() }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Banknote className="h-6 w-6" /> Repasses Recebidos
          </h1>
          <p className="text-sm text-muted-foreground">Recursos repassados de outros entes (Uniao, Estado, etc.)</p>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={showForm}>
          <Plus className="h-4 w-4 mr-1" /> Novo Repasse
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{editingId ? 'Editar repasse' : 'Novo repasse'}</CardTitle>
            <Button size="icon" variant="ghost" onClick={closeForm}><X className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <Label>Orgao de origem *</Label>
              <Input placeholder="Ex: Uniao - FUNDEB" value={form.orgaoOrigem} onChange={e => setForm({ ...form, orgaoOrigem: e.target.value })} />
            </div>
            <div>
              <Label>Valor *</Label>
              <Input type="number" step="0.01" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} />
            </div>
            <div>
              <Label>Programa</Label>
              <Input value={form.programa} onChange={e => setForm({ ...form, programa: e.target.value })} />
            </div>
            <div>
              <Label>Acao</Label>
              <Input value={form.acao} onChange={e => setForm({ ...form, acao: e.target.value })} />
            </div>
            <div>
              <Label>Fonte de recurso</Label>
              <Input value={form.fonteRecurso} onChange={e => setForm({ ...form, fonteRecurso: e.target.value })} />
            </div>
            <div>
              <Label>Data *</Label>
              <Input type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} />
            </div>
            <div>
              <Label>Ano *</Label>
              <Input type="number" value={form.ano} onChange={e => setForm({ ...form, ano: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Mes *</Label>
              <Input type="number" min={1} max={12} value={form.mes} onChange={e => setForm({ ...form, mes: Number(e.target.value) })} />
            </div>
            <div className="md:col-span-3">
              <Label>Observacoes</Label>
              <Input value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} />
            </div>
            <div className="md:col-span-3 flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                Salvar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : data.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">Nenhum repasse cadastrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-3 py-2">Data</th>
                    <th className="px-3 py-2">Orgao Origem</th>
                    <th className="px-3 py-2">Programa</th>
                    <th className="px-3 py-2 text-right">Valor</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(r => (
                    <tr key={r.id} className="border-t">
                      <td className="px-3 py-2">{new Date(r.data).toLocaleDateString('pt-BR')}</td>
                      <td className="px-3 py-2">{r.orgaoOrigem}</td>
                      <td className="px-3 py-2 text-xs">{r.programa || '-'}</td>
                      <td className="px-3 py-2 text-right">{Number(r.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(r)}><Pencil className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(r.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
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
