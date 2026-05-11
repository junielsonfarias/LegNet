'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Receipt, Plus, Loader2, Trash2, Save, X, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { RedirectConfig } from '@/components/admin/redirect-config'

interface NotaFiscal {
  id: string
  numero: string
  serie: string | null
  fornecedor: string
  cnpjCpf: string
  dataEmissao: string
  dataLiquidacao: string | null
  valor: number
  situacao: string
  ano: number
  mes: number
}

const SITUACOES = ['EMITIDA', 'LIQUIDADA', 'PAGA', 'CANCELADA'] as const
const EMPTY_FORM = {
  numero: '',
  serie: '',
  fornecedor: '',
  cnpjCpf: '',
  dataEmissao: new Date().toISOString().split('T')[0],
  dataLiquidacao: '',
  valor: '',
  situacao: 'EMITIDA' as (typeof SITUACOES)[number],
  ano: new Date().getFullYear(),
  mes: new Date().getMonth() + 1
}

export default function AdminNotasFiscaisPage() {
  const [data, setData] = useState<NotaFiscal[]>([])
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

  const handleEdit = (n: NotaFiscal) => {
    setEditingId(n.id)
    setForm({
      numero: n.numero,
      serie: n.serie || '',
      fornecedor: n.fornecedor,
      cnpjCpf: n.cnpjCpf,
      dataEmissao: n.dataEmissao.split('T')[0],
      dataLiquidacao: n.dataLiquidacao ? n.dataLiquidacao.split('T')[0] : '',
      valor: String(n.valor),
      situacao: n.situacao as (typeof SITUACOES)[number],
      ano: n.ano,
      mes: n.mes
    })
    setShowForm(true)
  }

  const load = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/notas-fiscais?limit=100')
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
      const url = editingId ? `/api/notas-fiscais/${editingId}` : '/api/notas-fiscais'
      const method = editingId ? 'PUT' : 'POST'
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          serie: form.serie || undefined,
          dataLiquidacao: form.dataLiquidacao || undefined,
          valor: Number(form.valor),
          ano: Number(form.ano),
          mes: Number(form.mes)
        })
      })
      if (r.ok) {
        toast.success(editingId ? 'Nota fiscal atualizada' : 'Nota fiscal criada')
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
    if (!confirm('Remover esta nota fiscal?')) return
    const r = await fetch(`/api/notas-fiscais/${id}`, { method: 'DELETE' })
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
            <Receipt className="h-6 w-6" /> Notas Fiscais
          </h1>
          <p className="text-sm text-muted-foreground">Documentos fiscais emitidos por fornecedores</p>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={showForm}>
          <Plus className="h-4 w-4 mr-1" /> Nova Nota
        </Button>
      </div>

      <RedirectConfig slug="notas-fiscais" label="Notas Fiscais" />

      {showForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{editingId ? 'Editar nota fiscal' : 'Nova nota fiscal'}</CardTitle>
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
              <Label>Serie</Label>
              <Input value={form.serie} onChange={e => setForm({ ...form, serie: e.target.value })} />
            </div>
            <div>
              <Label>Situacao</Label>
              <select
                className="w-full mt-1.5 px-3 py-2 border rounded-md text-sm"
                value={form.situacao}
                onChange={e => setForm({ ...form, situacao: e.target.value as typeof form.situacao })}
              >
                {SITUACOES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <Label>Fornecedor *</Label>
              <Input value={form.fornecedor} onChange={e => setForm({ ...form, fornecedor: e.target.value })} />
            </div>
            <div>
              <Label>CNPJ/CPF *</Label>
              <Input value={form.cnpjCpf} onChange={e => setForm({ ...form, cnpjCpf: e.target.value })} />
            </div>
            <div>
              <Label>Data Emissao *</Label>
              <Input type="date" value={form.dataEmissao} onChange={e => setForm({ ...form, dataEmissao: e.target.value })} />
            </div>
            <div>
              <Label>Data Liquidacao</Label>
              <Input type="date" value={form.dataLiquidacao} onChange={e => setForm({ ...form, dataLiquidacao: e.target.value })} />
            </div>
            <div>
              <Label>Valor *</Label>
              <Input type="number" step="0.01" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} />
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
            <p className="text-center py-12 text-muted-foreground">Nenhuma nota cadastrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-3 py-2">Numero</th>
                    <th className="px-3 py-2">Fornecedor</th>
                    <th className="px-3 py-2">Emissao</th>
                    <th className="px-3 py-2 text-right">Valor</th>
                    <th className="px-3 py-2">Situacao</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(n => (
                    <tr key={n.id} className="border-t">
                      <td className="px-3 py-2 font-mono text-xs">{n.numero}{n.serie ? `-${n.serie}` : ''}</td>
                      <td className="px-3 py-2">{n.fornecedor}</td>
                      <td className="px-3 py-2">{new Date(n.dataEmissao).toLocaleDateString('pt-BR')}</td>
                      <td className="px-3 py-2 text-right">{Number(n.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                      <td className="px-3 py-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">{n.situacao}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(n)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(n.id)} className="text-destructive">
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
