'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ClipboardList, Plus, Loader2, Trash2, Save, X, Pencil } from 'lucide-react'
import { toast } from 'sonner'

interface ProgramaAcao {
  id: string
  codigo: string
  nome: string
  descricao: string | null
  tipo: string
  ano: number
  valorPrevisto: number | null
  valorExecutado: number | null
  unidadeResponsavel: string | null
  metaFisica: string | null
  ativo: boolean
}

const TIPOS = ['PROGRAMA', 'ACAO'] as const

const EMPTY_FORM = {
  codigo: '',
  nome: '',
  descricao: '',
  tipo: 'PROGRAMA' as (typeof TIPOS)[number],
  ano: new Date().getFullYear(),
  valorPrevisto: '',
  valorExecutado: '',
  unidadeResponsavel: '',
  metaFisica: '',
  ativo: true
}

export default function AdminProgramasAcoesPage() {
  const [data, setData] = useState<ProgramaAcao[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/programas-acoes?limit=100')
      const j = await r.json()
      setData(j?.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const closeForm = () => { setShowForm(false); setEditingId(null); setForm({ ...EMPTY_FORM }) }

  const handleEdit = (p: ProgramaAcao) => {
    setEditingId(p.id)
    setForm({
      codigo: p.codigo,
      nome: p.nome,
      descricao: p.descricao || '',
      tipo: p.tipo as (typeof TIPOS)[number],
      ano: p.ano,
      valorPrevisto: p.valorPrevisto != null ? String(p.valorPrevisto) : '',
      valorExecutado: p.valorExecutado != null ? String(p.valorExecutado) : '',
      unidadeResponsavel: p.unidadeResponsavel || '',
      metaFisica: p.metaFisica || '',
      ativo: p.ativo
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const url = editingId ? `/api/programas-acoes/${editingId}` : '/api/programas-acoes'
      const method = editingId ? 'PUT' : 'POST'
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo: form.codigo,
          nome: form.nome,
          descricao: form.descricao || undefined,
          tipo: form.tipo,
          ano: Number(form.ano),
          valorPrevisto: form.valorPrevisto ? Number(form.valorPrevisto) : undefined,
          valorExecutado: form.valorExecutado ? Number(form.valorExecutado) : undefined,
          unidadeResponsavel: form.unidadeResponsavel || undefined,
          metaFisica: form.metaFisica || undefined,
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
    const r = await fetch(`/api/programas-acoes/${id}`, { method: 'DELETE' })
    if (r.ok) { toast.success('Removido'); load() }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="h-6 w-6" /> Programas e Acoes
          </h1>
          <p className="text-sm text-muted-foreground">Programas e acoes do orcamento publico</p>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={showForm}>
          <Plus className="h-4 w-4 mr-1" /> Novo
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{editingId ? 'Editar' : 'Novo programa/acao'}</CardTitle>
            <Button size="icon" variant="ghost" onClick={closeForm}><X className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label>Codigo *</Label>
              <Input value={form.codigo} onChange={e => setForm({ ...form, codigo: e.target.value })} />
            </div>
            <div>
              <Label>Tipo *</Label>
              <select className="w-full mt-1.5 px-3 py-2 border rounded-md text-sm" value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value as typeof form.tipo })}>
                {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <Label>Ano *</Label>
              <Input type="number" value={form.ano} onChange={e => setForm({ ...form, ano: Number(e.target.value) })} />
            </div>
            <div className="md:col-span-3">
              <Label>Nome *</Label>
              <Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div className="md:col-span-3">
              <Label>Descricao</Label>
              <Textarea rows={2} value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
            </div>
            <div>
              <Label>Valor previsto</Label>
              <Input type="number" step="0.01" value={form.valorPrevisto} onChange={e => setForm({ ...form, valorPrevisto: e.target.value })} />
            </div>
            <div>
              <Label>Valor executado</Label>
              <Input type="number" step="0.01" value={form.valorExecutado} onChange={e => setForm({ ...form, valorExecutado: e.target.value })} />
            </div>
            <div>
              <Label>Unidade responsavel</Label>
              <Input value={form.unidadeResponsavel} onChange={e => setForm({ ...form, unidadeResponsavel: e.target.value })} />
            </div>
            <div className="md:col-span-3">
              <Label>Meta fisica</Label>
              <Input placeholder="Ex: Atender 1000 cidadaos" value={form.metaFisica} onChange={e => setForm({ ...form, metaFisica: e.target.value })} />
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
            <p className="text-center py-12 text-muted-foreground">Nenhum programa cadastrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-3 py-2">Codigo</th>
                    <th className="px-3 py-2">Nome</th>
                    <th className="px-3 py-2">Tipo</th>
                    <th className="px-3 py-2">Ano</th>
                    <th className="px-3 py-2 text-right">Previsto</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(p => (
                    <tr key={p.id} className="border-t">
                      <td className="px-3 py-2 font-mono text-xs">{p.codigo}</td>
                      <td className="px-3 py-2">{p.nome}</td>
                      <td className="px-3 py-2"><span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">{p.tipo}</span></td>
                      <td className="px-3 py-2">{p.ano}</td>
                      <td className="px-3 py-2 text-right">{p.valorPrevisto != null ? Number(p.valorPrevisto).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(p)}><Pencil className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(p.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
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
