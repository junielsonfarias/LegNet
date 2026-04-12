'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Globe, Plus, Loader2, Trash2, Save, X, Pencil, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

interface Servico {
  id: string
  nome: string
  descricao: string | null
  url: string
  categoria: string | null
  publicoAlvo: string | null
  ordem: number
  ativo: boolean
}

const EMPTY_FORM = {
  nome: '',
  descricao: '',
  url: '',
  categoria: '',
  icone: '',
  publicoAlvo: '',
  requisitos: '',
  ordem: 0,
  ativo: true
}

export default function AdminServicosOnlinePage() {
  const [data, setData] = useState<Servico[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/servicos-online?limit=200')
      const j = await r.json()
      setData(j?.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const closeForm = () => { setShowForm(false); setEditingId(null); setForm({ ...EMPTY_FORM }) }

  const handleEdit = async (s: Servico) => {
    setEditingId(s.id)
    const r = await fetch(`/api/servicos-online/${s.id}`)
    const j = await r.json()
    const full = j?.data || s
    setForm({
      nome: full.nome,
      descricao: full.descricao || '',
      url: full.url,
      categoria: full.categoria || '',
      icone: full.icone || '',
      publicoAlvo: full.publicoAlvo || '',
      requisitos: full.requisitos || '',
      ordem: full.ordem,
      ativo: full.ativo
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const url = editingId ? `/api/servicos-online/${editingId}` : '/api/servicos-online'
      const method = editingId ? 'PUT' : 'POST'
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: form.nome,
          descricao: form.descricao || undefined,
          url: form.url,
          categoria: form.categoria || undefined,
          icone: form.icone || undefined,
          publicoAlvo: form.publicoAlvo || undefined,
          requisitos: form.requisitos || undefined,
          ordem: Number(form.ordem),
          ativo: form.ativo
        })
      })
      if (r.ok) {
        toast.success(editingId ? 'Atualizado' : 'Criado')
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
    if (!confirm('Remover?')) return
    const r = await fetch(`/api/servicos-online/${id}`, { method: 'DELETE' })
    if (r.ok) { toast.success('Removido'); load() }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="h-6 w-6" /> Servicos Online
          </h1>
          <p className="text-sm text-muted-foreground">Carta de servicos digitais oferecidos ao cidadao</p>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={showForm}>
          <Plus className="h-4 w-4 mr-1" /> Novo Servico
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{editingId ? 'Editar servico' : 'Novo servico online'}</CardTitle>
            <Button size="icon" variant="ghost" onClick={closeForm}><X className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <Label>Nome *</Label>
              <Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div>
              <Label>Categoria</Label>
              <Input placeholder="Ex: Cidadao, Empresa" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} />
            </div>
            <div className="md:col-span-3">
              <Label>URL *</Label>
              <Input type="url" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />
            </div>
            <div className="md:col-span-3">
              <Label>Descricao</Label>
              <Textarea rows={2} value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
            </div>
            <div>
              <Label>Publico-alvo</Label>
              <Input value={form.publicoAlvo} onChange={e => setForm({ ...form, publicoAlvo: e.target.value })} />
            </div>
            <div>
              <Label>Icone (Lucide name)</Label>
              <Input placeholder="Globe" value={form.icone} onChange={e => setForm({ ...form, icone: e.target.value })} />
            </div>
            <div>
              <Label>Ordem</Label>
              <Input type="number" value={form.ordem} onChange={e => setForm({ ...form, ordem: Number(e.target.value) })} />
            </div>
            <div className="md:col-span-3">
              <Label>Requisitos</Label>
              <Textarea rows={2} value={form.requisitos} onChange={e => setForm({ ...form, requisitos: e.target.value })} />
            </div>
            <div className="md:col-span-3 flex items-center gap-3">
              <Switch id="ativo-srv" checked={form.ativo} onCheckedChange={c => setForm({ ...form, ativo: c })} />
              <Label htmlFor="ativo-srv" className="cursor-pointer">Servico ativo</Label>
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
            <p className="text-center py-12 text-muted-foreground">Nenhum servico cadastrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-3 py-2">Ordem</th>
                    <th className="px-3 py-2">Nome</th>
                    <th className="px-3 py-2">Categoria</th>
                    <th className="px-3 py-2">URL</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(s => (
                    <tr key={s.id} className="border-t">
                      <td className="px-3 py-2">{s.ordem}</td>
                      <td className="px-3 py-2 font-medium">{s.nome}</td>
                      <td className="px-3 py-2 text-xs">{s.categoria || '-'}</td>
                      <td className="px-3 py-2">
                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center text-xs">
                          {s.url.length > 40 ? s.url.slice(0, 40) + '...' : s.url} <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${s.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
                          {s.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(s)}><Pencil className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(s.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
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
