'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plane, DollarSign, Plus, Loader2, Trash2, Save, X, Pencil } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { toast } from 'sonner'

interface ValorDiaria {
  id: string
  categoria: string
  abrangencia: string
  descricao: string | null
  valor: number
  ano: number
  ativo: boolean
  observacoes: string | null
}

const ABRANGENCIAS = ['MUNICIPAL', 'ESTADUAL', 'NACIONAL', 'INTERNACIONAL'] as const

const EMPTY_FORM = {
  categoria: '',
  abrangencia: 'ESTADUAL' as (typeof ABRANGENCIAS)[number],
  descricao: '',
  valor: '',
  ano: new Date().getFullYear(),
  ativo: true,
  observacoes: ''
}

export default function AdminValoresDiariaPage() {
  const [data, setData] = useState<ValorDiaria[]>([])
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
      const r = await fetch('/api/valores-diaria?limit=500')
      const j = await r.json()
      setData(j?.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleEdit = (v: ValorDiaria) => {
    setEditingId(v.id)
    setForm({
      categoria: v.categoria,
      abrangencia: (v.abrangencia as (typeof ABRANGENCIAS)[number]) || 'ESTADUAL',
      descricao: v.descricao || '',
      valor: String(v.valor),
      ano: v.ano,
      ativo: v.ativo,
      observacoes: v.observacoes || ''
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.categoria.trim()) {
      toast.error('Informe a categoria')
      return
    }
    if (!form.valor || Number(form.valor) <= 0) {
      toast.error('Informe um valor valido')
      return
    }
    setSaving(true)
    try {
      const url = editingId ? `/api/valores-diaria/${editingId}` : '/api/valores-diaria'
      const method = editingId ? 'PUT' : 'POST'
      const payload = {
        categoria: form.categoria.trim(),
        abrangencia: form.abrangencia,
        descricao: form.descricao.trim() || null,
        valor: Number(form.valor),
        ano: Number(form.ano),
        ativo: form.ativo,
        observacoes: form.observacoes.trim() || null
      }
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (r.ok) {
        toast.success(editingId ? 'Valor atualizado' : 'Valor criado')
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
    if (!confirm('Remover este registro?')) return
    const r = await fetch(`/api/valores-diaria/${id}`, { method: 'DELETE' })
    if (r.ok) {
      toast.success('Removido')
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
            <Plane className="h-6 w-6" /> Tabela de Valores das Diarias
          </h1>
          <p className="text-sm text-muted-foreground">
            Valores de diaria por categoria e abrangencia (referencia para concessao)
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={showForm}>
          <Plus className="h-4 w-4 mr-1" /> Novo Valor
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              {editingId ? 'Editar valor' : 'Novo valor'}
            </CardTitle>
            <Button size="icon" variant="ghost" onClick={closeForm}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Categoria *</Label>
                <Input
                  value={form.categoria}
                  onChange={e => setForm({ ...form, categoria: e.target.value })}
                  placeholder="Ex.: Vereador, Servidor de nivel superior"
                />
              </div>
              <div>
                <Label>Abrangencia *</Label>
                <select
                  className="w-full mt-1.5 px-3 py-2 border rounded-md text-sm"
                  value={form.abrangencia}
                  onChange={e => setForm({ ...form, abrangencia: e.target.value as typeof form.abrangencia })}
                >
                  {ABRANGENCIAS.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label>Valor (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.valor}
                  onChange={e => setForm({ ...form, valor: e.target.value })}
                />
              </div>
              <div>
                <Label>Ano *</Label>
                <Input
                  type="number"
                  value={form.ano}
                  onChange={e => setForm({ ...form, ano: Number(e.target.value) })}
                />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.ativo}
                    onChange={e => setForm({ ...form, ativo: e.target.checked })}
                  />
                  Vigente
                </label>
              </div>
            </div>

            <div>
              <Label>Descricao</Label>
              <Input
                value={form.descricao}
                onChange={e => setForm({ ...form, descricao: e.target.value })}
                placeholder="Opcional"
              />
            </div>

            <div>
              <Label>Observacoes</Label>
              <Textarea
                rows={2}
                value={form.observacoes}
                onChange={e => setForm({ ...form, observacoes: e.target.value })}
                placeholder="Opcional"
              />
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
            <EmptyState
              as="plain"
              icon={DollarSign}
              title="Nenhum valor cadastrado"
              description="Cadastre os valores de diárias por categoria (dentro do Estado, fora do Estado, fora do país)."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-3 py-2">Categoria</th>
                    <th className="px-3 py-2">Abrangencia</th>
                    <th className="px-3 py-2 text-right">Valor</th>
                    <th className="px-3 py-2">Ano</th>
                    <th className="px-3 py-2 text-center">Vigente</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(v => (
                    <tr key={v.id} className="border-t">
                      <td className="px-3 py-2">{v.categoria}</td>
                      <td className="px-3 py-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">
                          {v.abrangencia}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        {Number(v.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                      <td className="px-3 py-2">{v.ano}</td>
                      <td className="px-3 py-2 text-center">
                        {v.ativo ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">Sim</span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">Nao</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(v)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(v.id)}
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
