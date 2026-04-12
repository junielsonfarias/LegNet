'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Truck, Plus, Loader2, Trash2, Save, X, Pencil } from 'lucide-react'
import { toast } from 'sonner'

interface Veiculo {
  id: string
  placa: string
  marca: string
  modelo: string
  anoFabricacao: number
  anoModelo: number
  chassi: string | null
  renavam: string | null
  cor: string | null
  combustivel: string | null
  dataAquisicao: string
  valorAquisicao: number
  responsavel: string | null
  lotacao: string | null
  situacao: string
}

const SITUACOES = ['ATIVO', 'INATIVO', 'ALIENADO', 'EM_MANUTENCAO', 'SINISTRADO'] as const

const EMPTY_FORM = {
  placa: '',
  marca: '',
  modelo: '',
  anoFabricacao: new Date().getFullYear(),
  anoModelo: new Date().getFullYear(),
  chassi: '',
  renavam: '',
  cor: '',
  combustivel: '',
  dataAquisicao: new Date().toISOString().split('T')[0],
  valorAquisicao: '',
  responsavel: '',
  lotacao: '',
  situacao: 'ATIVO' as (typeof SITUACOES)[number]
}

export default function AdminVeiculosPage() {
  const [data, setData] = useState<Veiculo[]>([])
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

  const handleEdit = (v: Veiculo) => {
    setEditingId(v.id)
    setForm({
      placa: v.placa,
      marca: v.marca,
      modelo: v.modelo,
      anoFabricacao: v.anoFabricacao,
      anoModelo: v.anoModelo,
      chassi: v.chassi || '',
      renavam: v.renavam || '',
      cor: v.cor || '',
      combustivel: v.combustivel || '',
      dataAquisicao: v.dataAquisicao.split('T')[0],
      valorAquisicao: String(v.valorAquisicao),
      responsavel: v.responsavel || '',
      lotacao: v.lotacao || '',
      situacao: v.situacao as (typeof SITUACOES)[number]
    })
    setShowForm(true)
  }

  const load = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/veiculos?limit=100')
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
      const url = editingId ? `/api/veiculos/${editingId}` : '/api/veiculos'
      const method = editingId ? 'PUT' : 'POST'
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          anoFabricacao: Number(form.anoFabricacao),
          anoModelo: Number(form.anoModelo),
          valorAquisicao: Number(form.valorAquisicao),
          chassi: form.chassi || undefined,
          renavam: form.renavam || undefined,
          cor: form.cor || undefined,
          combustivel: form.combustivel || undefined,
          responsavel: form.responsavel || undefined,
          lotacao: form.lotacao || undefined
        })
      })
      if (r.ok) {
        toast.success(editingId ? 'Veiculo atualizado' : 'Veiculo criado')
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
    if (!confirm('Remover este veiculo?')) return
    const r = await fetch(`/api/veiculos/${id}`, { method: 'DELETE' })
    if (r.ok) {
      toast.success('Removido')
      load()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="h-6 w-6" /> Veiculos
          </h1>
          <p className="text-sm text-muted-foreground">Frota oficial da Camara</p>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={showForm}>
          <Plus className="h-4 w-4 mr-1" /> Novo Veiculo
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{editingId ? 'Editar veiculo' : 'Novo veiculo'}</CardTitle>
            <Button size="icon" variant="ghost" onClick={closeForm}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label>Placa *</Label>
              <Input value={form.placa} onChange={e => setForm({ ...form, placa: e.target.value.toUpperCase() })} />
            </div>
            <div>
              <Label>Marca *</Label>
              <Input value={form.marca} onChange={e => setForm({ ...form, marca: e.target.value })} />
            </div>
            <div>
              <Label>Modelo *</Label>
              <Input value={form.modelo} onChange={e => setForm({ ...form, modelo: e.target.value })} />
            </div>
            <div>
              <Label>Ano fabricacao *</Label>
              <Input type="number" value={form.anoFabricacao} onChange={e => setForm({ ...form, anoFabricacao: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Ano modelo *</Label>
              <Input type="number" value={form.anoModelo} onChange={e => setForm({ ...form, anoModelo: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Cor</Label>
              <Input value={form.cor} onChange={e => setForm({ ...form, cor: e.target.value })} />
            </div>
            <div>
              <Label>Chassi</Label>
              <Input value={form.chassi} onChange={e => setForm({ ...form, chassi: e.target.value })} />
            </div>
            <div>
              <Label>RENAVAM</Label>
              <Input value={form.renavam} onChange={e => setForm({ ...form, renavam: e.target.value })} />
            </div>
            <div>
              <Label>Combustivel</Label>
              <Input value={form.combustivel} onChange={e => setForm({ ...form, combustivel: e.target.value })} />
            </div>
            <div>
              <Label>Data aquisicao *</Label>
              <Input type="date" value={form.dataAquisicao} onChange={e => setForm({ ...form, dataAquisicao: e.target.value })} />
            </div>
            <div>
              <Label>Valor aquisicao *</Label>
              <Input type="number" step="0.01" value={form.valorAquisicao} onChange={e => setForm({ ...form, valorAquisicao: e.target.value })} />
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
            <div>
              <Label>Lotacao</Label>
              <Input value={form.lotacao} onChange={e => setForm({ ...form, lotacao: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>Responsavel</Label>
              <Input value={form.responsavel} onChange={e => setForm({ ...form, responsavel: e.target.value })} />
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
            <p className="text-center py-12 text-muted-foreground">Nenhum veiculo cadastrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-3 py-2">Placa</th>
                    <th className="px-3 py-2">Marca / Modelo</th>
                    <th className="px-3 py-2">Ano</th>
                    <th className="px-3 py-2">Lotacao</th>
                    <th className="px-3 py-2">Situacao</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(v => (
                    <tr key={v.id} className="border-t">
                      <td className="px-3 py-2 font-mono">{v.placa}</td>
                      <td className="px-3 py-2">{v.marca} {v.modelo}</td>
                      <td className="px-3 py-2">{v.anoFabricacao}/{v.anoModelo}</td>
                      <td className="px-3 py-2">{v.lotacao || '-'}</td>
                      <td className="px-3 py-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">{v.situacao}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(v)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(v.id)} className="text-destructive">
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
