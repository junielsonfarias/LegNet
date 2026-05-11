'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CreditCard, Plus, Loader2, Trash2, Save, X, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { RedirectConfig } from '@/components/admin/redirect-config'

interface Lancamento {
  id: string
  portador: string
  estabelecimento: string
  dataCompra: string
  valor: number
  descricao: string
  numeroFatura: string | null
  ano: number
  mes: number
  cnpjCpfPortador: string | null
  cnpjEstabelecimento: string | null
}

const EMPTY_FORM = {
  portador: '',
  cnpjCpfPortador: '',
  estabelecimento: '',
  cnpjEstabelecimento: '',
  dataCompra: new Date().toISOString().split('T')[0],
  valor: '',
  descricao: '',
  numeroFatura: '',
  ano: new Date().getFullYear(),
  mes: new Date().getMonth() + 1
}

export default function AdminCartoesPage() {
  const [data, setData] = useState<Lancamento[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/cartoes-corporativos?limit=100')
      const j = await r.json()
      setData(j?.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const closeForm = () => { setShowForm(false); setEditingId(null); setForm({ ...EMPTY_FORM }) }

  const handleEdit = (l: Lancamento) => {
    setEditingId(l.id)
    setForm({
      portador: l.portador,
      cnpjCpfPortador: l.cnpjCpfPortador || '',
      estabelecimento: l.estabelecimento,
      cnpjEstabelecimento: l.cnpjEstabelecimento || '',
      dataCompra: l.dataCompra.split('T')[0],
      valor: String(l.valor),
      descricao: l.descricao,
      numeroFatura: l.numeroFatura || '',
      ano: l.ano,
      mes: l.mes
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const url = editingId ? `/api/cartoes-corporativos/${editingId}` : '/api/cartoes-corporativos'
      const method = editingId ? 'PUT' : 'POST'
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portador: form.portador,
          cnpjCpfPortador: form.cnpjCpfPortador || undefined,
          estabelecimento: form.estabelecimento,
          cnpjEstabelecimento: form.cnpjEstabelecimento || undefined,
          dataCompra: form.dataCompra,
          valor: Number(form.valor),
          descricao: form.descricao,
          numeroFatura: form.numeroFatura || undefined,
          ano: Number(form.ano),
          mes: Number(form.mes)
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
    if (!confirm('Remover este lancamento?')) return
    const r = await fetch(`/api/cartoes-corporativos/${id}`, { method: 'DELETE' })
    if (r.ok) { toast.success('Removido'); load() }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6" /> Cartao Corporativo
          </h1>
          <p className="text-sm text-muted-foreground">Gastos com cartao de credito corporativo</p>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={showForm}>
          <Plus className="h-4 w-4 mr-1" /> Novo Lancamento
        </Button>
      </div>

      <RedirectConfig slug="cartao-credito" label="Cartao Corporativo" />

      {showForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{editingId ? 'Editar lancamento' : 'Novo lancamento'}</CardTitle>
            <Button size="icon" variant="ghost" onClick={closeForm}><X className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label>Portador *</Label>
              <Input value={form.portador} onChange={e => setForm({ ...form, portador: e.target.value })} />
            </div>
            <div>
              <Label>CPF do portador</Label>
              <Input value={form.cnpjCpfPortador} onChange={e => setForm({ ...form, cnpjCpfPortador: e.target.value })} />
            </div>
            <div>
              <Label>Data da compra *</Label>
              <Input type="date" value={form.dataCompra} onChange={e => setForm({ ...form, dataCompra: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>Estabelecimento *</Label>
              <Input value={form.estabelecimento} onChange={e => setForm({ ...form, estabelecimento: e.target.value })} />
            </div>
            <div>
              <Label>CNPJ estabelecimento</Label>
              <Input value={form.cnpjEstabelecimento} onChange={e => setForm({ ...form, cnpjEstabelecimento: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>Descricao *</Label>
              <Input value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
            </div>
            <div>
              <Label>Valor *</Label>
              <Input type="number" step="0.01" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} />
            </div>
            <div>
              <Label>Numero fatura</Label>
              <Input value={form.numeroFatura} onChange={e => setForm({ ...form, numeroFatura: e.target.value })} />
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
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : data.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">Nenhum lancamento cadastrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-3 py-2">Data</th>
                    <th className="px-3 py-2">Portador</th>
                    <th className="px-3 py-2">Estabelecimento</th>
                    <th className="px-3 py-2">Descricao</th>
                    <th className="px-3 py-2 text-right">Valor</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(l => (
                    <tr key={l.id} className="border-t">
                      <td className="px-3 py-2">{new Date(l.dataCompra).toLocaleDateString('pt-BR')}</td>
                      <td className="px-3 py-2">{l.portador}</td>
                      <td className="px-3 py-2">{l.estabelecimento}</td>
                      <td className="px-3 py-2 text-xs">{l.descricao}</td>
                      <td className="px-3 py-2 text-right">{Number(l.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(l)}><Pencil className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(l.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
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
