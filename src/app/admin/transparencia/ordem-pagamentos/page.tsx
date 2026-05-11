'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Clock, Plus, Loader2, Trash2, Save, X, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { RedirectConfig } from '@/components/admin/redirect-config'

interface Ordem {
  id: string
  numero: string
  ano: number
  mes: number
  data: string
  credor: string
  cnpjCpf: string
  valor: number
  dataVencimento: string | null
  dataPagamento: string | null
  ordemCronologica: number | null
  fonteRecurso: string | null
}

const EMPTY_FORM = {
  numero: '',
  data: new Date().toISOString().split('T')[0],
  credor: '',
  cnpjCpf: '',
  valor: '',
  dataVencimento: '',
  dataPagamento: '',
  ordemCronologica: '',
  fonteRecurso: '',
  ano: new Date().getFullYear(),
  mes: new Date().getMonth() + 1
}

export default function AdminOrdemPagamentosPage() {
  const [data, setData] = useState<Ordem[]>([])
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

  const handleEdit = (o: Ordem) => {
    setEditingId(o.id)
    setForm({
      numero: o.numero,
      data: o.data.split('T')[0],
      credor: o.credor,
      cnpjCpf: o.cnpjCpf,
      valor: String(o.valor),
      dataVencimento: o.dataVencimento ? o.dataVencimento.split('T')[0] : '',
      dataPagamento: o.dataPagamento ? o.dataPagamento.split('T')[0] : '',
      ordemCronologica: o.ordemCronologica != null ? String(o.ordemCronologica) : '',
      fonteRecurso: o.fonteRecurso || '',
      ano: o.ano,
      mes: o.mes
    })
    setShowForm(true)
  }

  const load = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/ordem-pagamentos?limit=200')
      const j = await r.json()
      setData(j?.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const url = editingId ? `/api/ordem-pagamentos/${editingId}` : '/api/ordem-pagamentos'
      const method = editingId ? 'PUT' : 'POST'
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numero: form.numero,
          data: form.data,
          credor: form.credor,
          cnpjCpf: form.cnpjCpf,
          valor: Number(form.valor),
          dataVencimento: form.dataVencimento || undefined,
          dataPagamento: form.dataPagamento || undefined,
          ordemCronologica: form.ordemCronologica ? Number(form.ordemCronologica) : undefined,
          fonteRecurso: form.fonteRecurso || undefined,
          ano: Number(form.ano),
          mes: Number(form.mes)
        })
      })
      if (r.ok) {
        toast.success(editingId ? 'Ordem atualizada' : 'Ordem criada')
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
    if (!confirm('Remover esta ordem?')) return
    const r = await fetch(`/api/ordem-pagamentos/${id}`, { method: 'DELETE' })
    if (r.ok) {
      toast.success('Removida')
      load()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="h-6 w-6" /> Ordem Cronologica de Pagamentos
          </h1>
          <p className="text-sm text-muted-foreground">Fila de pagamentos a fornecedores (LRF)</p>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={showForm}>
          <Plus className="h-4 w-4 mr-1" /> Nova Ordem
        </Button>
      </div>

      <RedirectConfig slug="ordem-pagamentos" label="Ordem Cronologica de Pagamentos" />

      {showForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{editingId ? 'Editar ordem' : 'Nova ordem de pagamento'}</CardTitle>
            <Button size="icon" variant="ghost" onClick={closeForm}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label>Numero *</Label>
              <Input value={form.numero} onChange={e => setForm({ ...form, numero: e.target.value })} />
            </div>
            <div>
              <Label>Data *</Label>
              <Input type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} />
            </div>
            <div>
              <Label>Ordem (fila)</Label>
              <Input type="number" value={form.ordemCronologica} onChange={e => setForm({ ...form, ordemCronologica: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>Credor *</Label>
              <Input value={form.credor} onChange={e => setForm({ ...form, credor: e.target.value })} />
            </div>
            <div>
              <Label>CNPJ/CPF *</Label>
              <Input value={form.cnpjCpf} onChange={e => setForm({ ...form, cnpjCpf: e.target.value })} />
            </div>
            <div>
              <Label>Valor *</Label>
              <Input type="number" step="0.01" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} />
            </div>
            <div>
              <Label>Vencimento</Label>
              <Input type="date" value={form.dataVencimento} onChange={e => setForm({ ...form, dataVencimento: e.target.value })} />
            </div>
            <div>
              <Label>Pagamento</Label>
              <Input type="date" value={form.dataPagamento} onChange={e => setForm({ ...form, dataPagamento: e.target.value })} />
            </div>
            <div>
              <Label>Fonte de recurso</Label>
              <Input value={form.fonteRecurso} onChange={e => setForm({ ...form, fonteRecurso: e.target.value })} />
            </div>
            <div>
              <Label>Ano *</Label>
              <Input type="number" value={form.ano} onChange={e => setForm({ ...form, ano: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Mes *</Label>
              <Input type="number" min={1} max={12} value={form.mes} onChange={e => setForm({ ...form, mes: Number(e.target.value) })} />
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
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : data.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">Nenhuma ordem cadastrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-3 py-2">Ordem</th>
                    <th className="px-3 py-2">Numero</th>
                    <th className="px-3 py-2">Credor</th>
                    <th className="px-3 py-2 text-right">Valor</th>
                    <th className="px-3 py-2">Fonte</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(o => (
                    <tr key={o.id} className="border-t">
                      <td className="px-3 py-2 font-bold">{o.ordemCronologica ?? '-'}</td>
                      <td className="px-3 py-2 font-mono text-xs">{o.numero}</td>
                      <td className="px-3 py-2">{o.credor}</td>
                      <td className="px-3 py-2 text-right">{Number(o.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                      <td className="px-3 py-2 text-xs">{o.fonteRecurso || '-'}</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(o)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(o.id)} className="text-destructive">
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
