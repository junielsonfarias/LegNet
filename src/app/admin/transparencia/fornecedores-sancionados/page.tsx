'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Shield, ShieldX, Plus, Loader2, Trash2, Save, X, Pencil } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { toast } from 'sonner'
import { RedirectConfig } from '@/components/admin/redirect-config'

interface Sancionado {
  id: string
  nome: string
  cnpjCpf: string
  tipoSancao: string
  motivo: string
  numeroProcesso: string | null
  orgaoSancionador: string
  dataInicio: string
  dataFim: string | null
  ativo: boolean
  fundamentoLegal: string | null
}

const TIPOS = [
  { value: 'ADVERTENCIA', label: 'Advertencia' },
  { value: 'MULTA', label: 'Multa' },
  { value: 'SUSPENSAO_TEMPORARIA', label: 'Suspensao temporaria' },
  { value: 'IMPEDIMENTO', label: 'Impedimento' },
  { value: 'DECLARACAO_INIDONEIDADE', label: 'Declaracao de inidoneidade' }
] as const

const EMPTY_FORM = {
  nome: '',
  cnpjCpf: '',
  tipoSancao: 'ADVERTENCIA' as (typeof TIPOS)[number]['value'],
  motivo: '',
  numeroProcesso: '',
  orgaoSancionador: '',
  dataInicio: new Date().toISOString().split('T')[0],
  dataFim: '',
  ativo: true,
  fundamentoLegal: '',
  observacoes: ''
}

export default function AdminFornecedoresSancionadosPage() {
  const [data, setData] = useState<Sancionado[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/fornecedores-sancionados?limit=100')
      const j = await r.json()
      setData(j?.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const closeForm = () => { setShowForm(false); setEditingId(null); setForm({ ...EMPTY_FORM }) }

  const handleEdit = async (s: Sancionado) => {
    setEditingId(s.id)
    const r = await fetch(`/api/fornecedores-sancionados/${s.id}`)
    const j = await r.json()
    const full = j?.data || s
    setForm({
      nome: full.nome,
      cnpjCpf: full.cnpjCpf,
      tipoSancao: full.tipoSancao,
      motivo: full.motivo,
      numeroProcesso: full.numeroProcesso || '',
      orgaoSancionador: full.orgaoSancionador,
      dataInicio: full.dataInicio.split('T')[0],
      dataFim: full.dataFim ? full.dataFim.split('T')[0] : '',
      ativo: full.ativo,
      fundamentoLegal: full.fundamentoLegal || '',
      observacoes: full.observacoes || ''
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const url = editingId ? `/api/fornecedores-sancionados/${editingId}` : '/api/fornecedores-sancionados'
      const method = editingId ? 'PUT' : 'POST'
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: form.nome,
          cnpjCpf: form.cnpjCpf,
          tipoSancao: form.tipoSancao,
          motivo: form.motivo,
          numeroProcesso: form.numeroProcesso || undefined,
          orgaoSancionador: form.orgaoSancionador,
          dataInicio: form.dataInicio,
          dataFim: form.dataFim || undefined,
          ativo: form.ativo,
          fundamentoLegal: form.fundamentoLegal || undefined,
          observacoes: form.observacoes || undefined
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
    const r = await fetch(`/api/fornecedores-sancionados/${id}`, { method: 'DELETE' })
    if (r.ok) { toast.success('Removido'); load() }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" /> Fornecedores Sancionados
          </h1>
          <p className="text-sm text-muted-foreground">Empresas e pessoas com sancoes administrativas</p>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={showForm}>
          <Plus className="h-4 w-4 mr-1" /> Nova Sancao
        </Button>
      </div>

      <RedirectConfig slug="fornecedores-sancionados" label="Fornecedores Sancionados" />

      {showForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{editingId ? 'Editar sancao' : 'Nova sancao'}</CardTitle>
            <Button size="icon" variant="ghost" onClick={closeForm}><X className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <Label>Nome / Razao Social *</Label>
              <Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div>
              <Label>CNPJ/CPF *</Label>
              <Input value={form.cnpjCpf} onChange={e => setForm({ ...form, cnpjCpf: e.target.value })} />
            </div>
            <div>
              <Label>Tipo de sancao *</Label>
              <select className="w-full mt-1.5 px-3 py-2 border rounded-md text-sm" value={form.tipoSancao} onChange={e => setForm({ ...form, tipoSancao: e.target.value as typeof form.tipoSancao })}>
                {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <Label>Orgao sancionador *</Label>
              <Input placeholder="TCM, CGU, etc" value={form.orgaoSancionador} onChange={e => setForm({ ...form, orgaoSancionador: e.target.value })} />
            </div>
            <div>
              <Label>Numero do processo</Label>
              <Input value={form.numeroProcesso} onChange={e => setForm({ ...form, numeroProcesso: e.target.value })} />
            </div>
            <div className="md:col-span-3">
              <Label>Motivo *</Label>
              <Textarea rows={2} value={form.motivo} onChange={e => setForm({ ...form, motivo: e.target.value })} />
            </div>
            <div>
              <Label>Data inicio *</Label>
              <Input type="date" value={form.dataInicio} onChange={e => setForm({ ...form, dataInicio: e.target.value })} />
            </div>
            <div>
              <Label>Data fim (opcional)</Label>
              <Input type="date" value={form.dataFim} onChange={e => setForm({ ...form, dataFim: e.target.value })} />
            </div>
            <div className="flex items-end gap-3">
              <Switch id="ativo-snc" checked={form.ativo} onCheckedChange={c => setForm({ ...form, ativo: c })} />
              <Label htmlFor="ativo-snc" className="cursor-pointer text-xs">Sancao ativa</Label>
            </div>
            <div className="md:col-span-3">
              <Label>Fundamento legal</Label>
              <Input placeholder="Lei 8.666/93 art. 87" value={form.fundamentoLegal} onChange={e => setForm({ ...form, fundamentoLegal: e.target.value })} />
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
            <EmptyState
              as="plain"
              icon={ShieldX}
              title="Nenhuma sanção cadastrada"
              description="Cadastre fornecedores sancionados administrativamente conforme Lei 8.666/93 e Lei 14.133/21."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-3 py-2">Nome</th>
                    <th className="px-3 py-2">CNPJ/CPF</th>
                    <th className="px-3 py-2">Sancao</th>
                    <th className="px-3 py-2">Orgao</th>
                    <th className="px-3 py-2">Periodo</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(s => (
                    <tr key={s.id} className="border-t">
                      <td className="px-3 py-2 font-medium">{s.nome}</td>
                      <td className="px-3 py-2 font-mono text-xs">{s.cnpjCpf}</td>
                      <td className="px-3 py-2 text-xs">{TIPOS.find(t => t.value === s.tipoSancao)?.label}</td>
                      <td className="px-3 py-2">{s.orgaoSancionador}</td>
                      <td className="px-3 py-2 text-xs">
                        {new Date(s.dataInicio).toLocaleDateString('pt-BR')}
                        {s.dataFim ? ` - ${new Date(s.dataFim).toLocaleDateString('pt-BR')}` : ' - indeterminado'}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${s.ativo ? 'bg-red-100 text-red-700' : 'bg-gray-100'}`}>
                          {s.ativo ? 'Ativa' : 'Encerrada'}
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
