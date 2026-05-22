'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Banknote, Plus, Loader2, Trash2, Save, X, Pencil } from 'lucide-react'
import { toast } from 'sonner'

interface RestoPagar {
  id: string
  ano: number
  credor: string
  cnpjCpf: string | null
  numeroEmpenho: string | null
  descricao: string | null
  tipo: string
  valorInscrito: number
  valorPago: number
  valorCancelado: number
  observacoes: string | null
}

const TIPOS = ['PROCESSADO', 'NAO_PROCESSADO'] as const
const tipoLabels: Record<string, string> = {
  PROCESSADO: 'Processado',
  NAO_PROCESSADO: 'Nao Processado'
}

const EMPTY_FORM = {
  ano: new Date().getFullYear(),
  credor: '',
  cnpjCpf: '',
  numeroEmpenho: '',
  descricao: '',
  tipo: 'PROCESSADO' as (typeof TIPOS)[number],
  valorInscrito: '',
  valorPago: '',
  valorCancelado: '',
  observacoes: ''
}

const formatBRL = (v: number) =>
  Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function AdminRestosPagarPage() {
  const [data, setData] = useState<RestoPagar[]>([])
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
      const r = await fetch('/api/restos-pagar?limit=500')
      const j = await r.json()
      setData(j?.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleEdit = (r: RestoPagar) => {
    setEditingId(r.id)
    setForm({
      ano: r.ano,
      credor: r.credor,
      cnpjCpf: r.cnpjCpf || '',
      numeroEmpenho: r.numeroEmpenho || '',
      descricao: r.descricao || '',
      tipo: (r.tipo as (typeof TIPOS)[number]) || 'PROCESSADO',
      valorInscrito: String(r.valorInscrito),
      valorPago: String(r.valorPago),
      valorCancelado: String(r.valorCancelado),
      observacoes: r.observacoes || ''
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.credor.trim()) {
      toast.error('Informe o credor')
      return
    }
    if (!form.valorInscrito || Number(form.valorInscrito) < 0) {
      toast.error('Informe o valor inscrito')
      return
    }
    setSaving(true)
    try {
      const url = editingId ? `/api/restos-pagar/${editingId}` : '/api/restos-pagar'
      const method = editingId ? 'PUT' : 'POST'
      const payload = {
        ano: Number(form.ano),
        credor: form.credor.trim(),
        cnpjCpf: form.cnpjCpf.trim() || null,
        numeroEmpenho: form.numeroEmpenho.trim() || null,
        descricao: form.descricao.trim() || null,
        tipo: form.tipo,
        valorInscrito: Number(form.valorInscrito),
        valorPago: form.valorPago ? Number(form.valorPago) : 0,
        valorCancelado: form.valorCancelado ? Number(form.valorCancelado) : 0,
        observacoes: form.observacoes.trim() || null
      }
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (r.ok) {
        toast.success(editingId ? 'Resto a pagar atualizado' : 'Resto a pagar criado')
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
    const r = await fetch(`/api/restos-pagar/${id}`, { method: 'DELETE' })
    if (r.ok) {
      toast.success('Removido')
      load()
    } else {
      toast.error('Erro ao remover')
    }
  }

  const saldo = (r: RestoPagar) =>
    Number(r.valorInscrito) - Number(r.valorPago) - Number(r.valorCancelado)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Banknote className="h-6 w-6" /> Restos a Pagar
          </h1>
          <p className="text-sm text-muted-foreground">
            Despesas empenhadas e nao pagas, inscritas em restos a pagar
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={showForm}>
          <Plus className="h-4 w-4 mr-1" /> Novo Registro
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              {editingId ? 'Editar registro' : 'Novo registro'}
            </CardTitle>
            <Button size="icon" variant="ghost" onClick={closeForm}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <Label>Ano *</Label>
                <Input
                  type="number"
                  value={form.ano}
                  onChange={e => setForm({ ...form, ano: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Tipo *</Label>
                <select
                  className="w-full mt-1.5 px-3 py-2 border rounded-md text-sm"
                  value={form.tipo}
                  onChange={e => setForm({ ...form, tipo: e.target.value as typeof form.tipo })}
                >
                  {TIPOS.map(t => (
                    <option key={t} value={t}>{tipoLabels[t]}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Numero do Empenho</Label>
                <Input
                  value={form.numeroEmpenho}
                  onChange={e => setForm({ ...form, numeroEmpenho: e.target.value })}
                  placeholder="Opcional"
                />
              </div>
              <div>
                <Label>CNPJ / CPF do credor</Label>
                <Input
                  value={form.cnpjCpf}
                  onChange={e => setForm({ ...form, cnpjCpf: e.target.value })}
                  placeholder="Opcional"
                />
              </div>
            </div>

            <div>
              <Label>Credor *</Label>
              <Input
                value={form.credor}
                onChange={e => setForm({ ...form, credor: e.target.value })}
                placeholder="Nome / razao social do credor"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label>Valor Inscrito (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.valorInscrito}
                  onChange={e => setForm({ ...form, valorInscrito: e.target.value })}
                />
              </div>
              <div>
                <Label>Valor Pago (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.valorPago}
                  onChange={e => setForm({ ...form, valorPago: e.target.value })}
                  placeholder="0,00"
                />
              </div>
              <div>
                <Label>Valor Cancelado (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.valorCancelado}
                  onChange={e => setForm({ ...form, valorCancelado: e.target.value })}
                  placeholder="0,00"
                />
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
            <p className="text-center py-12 text-muted-foreground">
              Nenhum resto a pagar cadastrado.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-3 py-2">Ano</th>
                    <th className="px-3 py-2">Credor</th>
                    <th className="px-3 py-2">Tipo</th>
                    <th className="px-3 py-2 text-right">Inscrito</th>
                    <th className="px-3 py-2 text-right">Pago</th>
                    <th className="px-3 py-2 text-right">Saldo</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(r => (
                    <tr key={r.id} className="border-t">
                      <td className="px-3 py-2">{r.ano}</td>
                      <td className="px-3 py-2 font-medium">{r.credor}</td>
                      <td className="px-3 py-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">
                          {tipoLabels[r.tipo] || r.tipo}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">{formatBRL(r.valorInscrito)}</td>
                      <td className="px-3 py-2 text-right">{formatBRL(r.valorPago)}</td>
                      <td className="px-3 py-2 text-right font-medium">{formatBRL(saldo(r))}</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(r)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(r.id)}
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
