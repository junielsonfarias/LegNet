'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Database, Plus, Loader2, Trash2, Save, X, Pencil } from 'lucide-react'
import { toast } from 'sonner'

interface Fornecedor {
  id: string
  nome: string
  cnpjCpf: string | null
  tipoPessoa: string
  ramoAtividade: string | null
  municipio: string | null
  uf: string | null
  telefone: string | null
  email: string | null
  situacao: string
  observacoes: string | null
}

const SITUACOES = ['ATIVO', 'INATIVO', 'SUSPENSO'] as const
const TIPOS_PESSOA = ['PJ', 'PF'] as const

const EMPTY_FORM = {
  nome: '',
  cnpjCpf: '',
  tipoPessoa: 'PJ' as (typeof TIPOS_PESSOA)[number],
  ramoAtividade: '',
  municipio: '',
  uf: '',
  telefone: '',
  email: '',
  situacao: 'ATIVO' as (typeof SITUACOES)[number],
  observacoes: ''
}

const situacaoBadge: Record<string, string> = {
  ATIVO: 'bg-green-100 text-green-800',
  INATIVO: 'bg-gray-100 text-gray-800',
  SUSPENSO: 'bg-red-100 text-red-800'
}

export default function AdminFornecedoresPage() {
  const [data, setData] = useState<Fornecedor[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [busca, setBusca] = useState('')

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm({ ...EMPTY_FORM })
  }

  const load = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/fornecedores?limit=1000')
      const j = await r.json()
      setData(j?.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleEdit = (f: Fornecedor) => {
    setEditingId(f.id)
    setForm({
      nome: f.nome,
      cnpjCpf: f.cnpjCpf || '',
      tipoPessoa: (f.tipoPessoa as (typeof TIPOS_PESSOA)[number]) || 'PJ',
      ramoAtividade: f.ramoAtividade || '',
      municipio: f.municipio || '',
      uf: f.uf || '',
      telefone: f.telefone || '',
      email: f.email || '',
      situacao: (f.situacao as (typeof SITUACOES)[number]) || 'ATIVO',
      observacoes: f.observacoes || ''
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.nome.trim()) {
      toast.error('Informe o nome')
      return
    }
    setSaving(true)
    try {
      const url = editingId ? `/api/fornecedores/${editingId}` : '/api/fornecedores'
      const method = editingId ? 'PUT' : 'POST'
      const payload = {
        nome: form.nome.trim(),
        cnpjCpf: form.cnpjCpf.trim() || null,
        tipoPessoa: form.tipoPessoa,
        ramoAtividade: form.ramoAtividade.trim() || null,
        municipio: form.municipio.trim() || null,
        uf: form.uf.trim().toUpperCase() || null,
        telefone: form.telefone.trim() || null,
        email: form.email.trim() || null,
        situacao: form.situacao,
        observacoes: form.observacoes.trim() || null
      }
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (r.ok) {
        toast.success(editingId ? 'Fornecedor atualizado' : 'Fornecedor criado')
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
    if (!confirm('Remover este fornecedor?')) return
    const r = await fetch(`/api/fornecedores/${id}`, { method: 'DELETE' })
    if (r.ok) {
      toast.success('Removido')
      load()
    } else {
      toast.error('Erro ao remover')
    }
  }

  const filtrados = data.filter(f =>
    !busca.trim() || f.nome.toLowerCase().includes(busca.trim().toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6" /> Cadastro de Fornecedores
          </h1>
          <p className="text-sm text-muted-foreground">
            Fornecedores e prestadores habilitados a contratar com a Camara
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={showForm}>
          <Plus className="h-4 w-4 mr-1" /> Novo Fornecedor
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              {editingId ? 'Editar fornecedor' : 'Novo fornecedor'}
            </CardTitle>
            <Button size="icon" variant="ghost" onClick={closeForm}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Nome / Razao Social *</Label>
                <Input
                  value={form.nome}
                  onChange={e => setForm({ ...form, nome: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Tipo</Label>
                  <select
                    className="w-full mt-1.5 px-3 py-2 border rounded-md text-sm"
                    value={form.tipoPessoa}
                    onChange={e => setForm({ ...form, tipoPessoa: e.target.value as typeof form.tipoPessoa })}
                  >
                    <option value="PJ">Pessoa Juridica</option>
                    <option value="PF">Pessoa Fisica</option>
                  </select>
                </div>
                <div>
                  <Label>{form.tipoPessoa === 'PF' ? 'CPF' : 'CNPJ'}</Label>
                  <Input
                    value={form.cnpjCpf}
                    onChange={e => setForm({ ...form, cnpjCpf: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Ramo de Atividade</Label>
                <Input
                  value={form.ramoAtividade}
                  onChange={e => setForm({ ...form, ramoAtividade: e.target.value })}
                  placeholder="Opcional"
                />
              </div>
              <div>
                <Label>Situacao</Label>
                <select
                  className="w-full mt-1.5 px-3 py-2 border rounded-md text-sm"
                  value={form.situacao}
                  onChange={e => setForm({ ...form, situacao: e.target.value as typeof form.situacao })}
                >
                  {SITUACOES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2">
                <Label>Municipio</Label>
                <Input
                  value={form.municipio}
                  onChange={e => setForm({ ...form, municipio: e.target.value })}
                  placeholder="Opcional"
                />
              </div>
              <div>
                <Label>UF</Label>
                <Input
                  maxLength={2}
                  value={form.uf}
                  onChange={e => setForm({ ...form, uf: e.target.value })}
                  placeholder="PA"
                />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input
                  value={form.telefone}
                  onChange={e => setForm({ ...form, telefone: e.target.value })}
                  placeholder="Opcional"
                />
              </div>
            </div>

            <div>
              <Label>E-mail</Label>
              <Input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
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
        <CardContent className="pt-6 space-y-4">
          <Input
            placeholder="Buscar por nome..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="max-w-sm"
          />
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtrados.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">
              Nenhum fornecedor encontrado.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-3 py-2">Nome</th>
                    <th className="px-3 py-2">CNPJ/CPF</th>
                    <th className="px-3 py-2">Ramo</th>
                    <th className="px-3 py-2">Municipio/UF</th>
                    <th className="px-3 py-2 text-center">Situacao</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map(f => (
                    <tr key={f.id} className="border-t">
                      <td className="px-3 py-2 font-medium">{f.nome}</td>
                      <td className="px-3 py-2">{f.cnpjCpf || '-'}</td>
                      <td className="px-3 py-2 text-muted-foreground">{f.ramoAtividade || '-'}</td>
                      <td className="px-3 py-2">
                        {[f.municipio, f.uf].filter(Boolean).join(' / ') || '-'}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${situacaoBadge[f.situacao] || 'bg-gray-100'}`}>
                          {f.situacao}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(f)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(f.id)}
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
