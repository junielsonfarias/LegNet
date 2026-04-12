'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { HardHat, Plus, Loader2, Trash2, Save, X, Pencil } from 'lucide-react'
import { toast } from 'sonner'

interface Obra {
  id: string
  descricao: string
  endereco: string | null
  bairro: string | null
  cidade: string | null
  valorEstimado: number | null
  valorContratado: number | null
  valorExecutado: number | null
  dataInicio: string | null
  dataPrevistaFim: string | null
  dataConclusao: string | null
  percentualExecucao: number | null
  situacao: string
  motivoParalisacao: string | null
  observacoes: string | null
}

const SITUACOES = ['PLANEJADA', 'EM_ANDAMENTO', 'PARALISADA', 'CONCLUIDA', 'CANCELADA'] as const

const EMPTY_FORM = {
  descricao: '',
  endereco: '',
  bairro: '',
  cidade: '',
  valorEstimado: '',
  valorContratado: '',
  valorExecutado: '',
  dataInicio: '',
  dataPrevistaFim: '',
  dataConclusao: '',
  percentualExecucao: '0',
  situacao: 'PLANEJADA' as (typeof SITUACOES)[number],
  motivoParalisacao: '',
  observacoes: ''
}

export default function AdminObrasPage() {
  const [data, setData] = useState<Obra[]>([])
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

  const handleEdit = (o: Obra) => {
    setEditingId(o.id)
    setForm({
      descricao: o.descricao,
      endereco: o.endereco || '',
      bairro: o.bairro || '',
      cidade: o.cidade || '',
      valorEstimado: o.valorEstimado != null ? String(o.valorEstimado) : '',
      valorContratado: o.valorContratado != null ? String(o.valorContratado) : '',
      valorExecutado: o.valorExecutado != null ? String(o.valorExecutado) : '',
      dataInicio: o.dataInicio ? o.dataInicio.split('T')[0] : '',
      dataPrevistaFim: o.dataPrevistaFim ? o.dataPrevistaFim.split('T')[0] : '',
      dataConclusao: o.dataConclusao ? o.dataConclusao.split('T')[0] : '',
      percentualExecucao: o.percentualExecucao != null ? String(o.percentualExecucao) : '0',
      situacao: o.situacao as (typeof SITUACOES)[number],
      motivoParalisacao: o.motivoParalisacao || '',
      observacoes: o.observacoes || ''
    })
    setShowForm(true)
  }

  const load = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/obras?limit=100')
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
      const url = editingId ? `/api/obras/${editingId}` : '/api/obras'
      const method = editingId ? 'PUT' : 'POST'
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          descricao: form.descricao,
          endereco: form.endereco || undefined,
          bairro: form.bairro || undefined,
          cidade: form.cidade || undefined,
          valorEstimado: form.valorEstimado ? Number(form.valorEstimado) : undefined,
          valorContratado: form.valorContratado ? Number(form.valorContratado) : undefined,
          valorExecutado: form.valorExecutado ? Number(form.valorExecutado) : undefined,
          dataInicio: form.dataInicio || undefined,
          dataPrevistaFim: form.dataPrevistaFim || undefined,
          dataConclusao: form.dataConclusao || undefined,
          percentualExecucao: form.percentualExecucao ? Number(form.percentualExecucao) : undefined,
          situacao: form.situacao,
          motivoParalisacao: form.motivoParalisacao || undefined,
          observacoes: form.observacoes || undefined
        })
      })
      if (r.ok) {
        toast.success(editingId ? 'Obra atualizada' : 'Obra criada')
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
    if (!confirm('Remover esta obra?')) return
    const r = await fetch(`/api/obras/${id}`, { method: 'DELETE' })
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
            <HardHat className="h-6 w-6" /> Obras Publicas
          </h1>
          <p className="text-sm text-muted-foreground">Gerenciar obras planejadas, em andamento e paralisadas</p>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={showForm}>
          <Plus className="h-4 w-4 mr-1" /> Nova Obra
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{editingId ? 'Editar obra' : 'Nova obra'}</CardTitle>
            <Button size="icon" variant="ghost" onClick={closeForm}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-3">
              <Label>Descricao *</Label>
              <Input value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>Endereco</Label>
              <Input value={form.endereco} onChange={e => setForm({ ...form, endereco: e.target.value })} />
            </div>
            <div>
              <Label>Bairro</Label>
              <Input value={form.bairro} onChange={e => setForm({ ...form, bairro: e.target.value })} />
            </div>
            <div>
              <Label>Valor estimado</Label>
              <Input type="number" step="0.01" value={form.valorEstimado} onChange={e => setForm({ ...form, valorEstimado: e.target.value })} />
            </div>
            <div>
              <Label>Valor contratado</Label>
              <Input type="number" step="0.01" value={form.valorContratado} onChange={e => setForm({ ...form, valorContratado: e.target.value })} />
            </div>
            <div>
              <Label>Valor executado</Label>
              <Input type="number" step="0.01" value={form.valorExecutado} onChange={e => setForm({ ...form, valorExecutado: e.target.value })} />
            </div>
            <div>
              <Label>Inicio</Label>
              <Input type="date" value={form.dataInicio} onChange={e => setForm({ ...form, dataInicio: e.target.value })} />
            </div>
            <div>
              <Label>Previsao fim</Label>
              <Input type="date" value={form.dataPrevistaFim} onChange={e => setForm({ ...form, dataPrevistaFim: e.target.value })} />
            </div>
            <div>
              <Label>Conclusao</Label>
              <Input type="date" value={form.dataConclusao} onChange={e => setForm({ ...form, dataConclusao: e.target.value })} />
            </div>
            <div>
              <Label>% Execucao</Label>
              <Input type="number" min={0} max={100} value={form.percentualExecucao} onChange={e => setForm({ ...form, percentualExecucao: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>Situacao *</Label>
              <select
                className="w-full mt-1.5 px-3 py-2 border rounded-md text-sm"
                value={form.situacao}
                onChange={e => setForm({ ...form, situacao: e.target.value as typeof form.situacao })}
              >
                {SITUACOES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {form.situacao === 'PARALISADA' && (
              <div className="md:col-span-3">
                <Label>Motivo da paralisacao</Label>
                <Textarea rows={2} value={form.motivoParalisacao} onChange={e => setForm({ ...form, motivoParalisacao: e.target.value })} />
              </div>
            )}
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
            <p className="text-center py-12 text-muted-foreground">Nenhuma obra cadastrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-3 py-2">Descricao</th>
                    <th className="px-3 py-2">Endereco</th>
                    <th className="px-3 py-2 text-right">Contratado</th>
                    <th className="px-3 py-2">% Exec</th>
                    <th className="px-3 py-2">Situacao</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(o => (
                    <tr key={o.id} className="border-t">
                      <td className="px-3 py-2">{o.descricao}</td>
                      <td className="px-3 py-2 text-xs">{o.endereco || '-'}{o.bairro ? `, ${o.bairro}` : ''}</td>
                      <td className="px-3 py-2 text-right">{o.valorContratado ? Number(o.valorContratado).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</td>
                      <td className="px-3 py-2">{o.percentualExecucao ?? 0}%</td>
                      <td className="px-3 py-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">{o.situacao}</span>
                      </td>
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
