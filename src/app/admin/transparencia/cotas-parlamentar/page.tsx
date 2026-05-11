'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Wallet, Plus, Loader2, Trash2, Save, X, Pencil,
  Upload, FileText, ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'
import { RedirectConfig } from '@/components/admin/redirect-config'

interface Documento {
  nome: string
  url: string
}

interface Cota {
  id: string
  mes: number | null
  ano: number
  parlamentarId: string | null
  nomeParlamentar: string | null
  observacao: string
  documentos: Documento[] | null
  valor: number | null
  tipo: string
}

interface Parlamentar {
  id: string
  nomeParlamentar?: string
  nomeCompleto?: string
  nome?: string
}

const TIPOS = ['DECLARACAO', 'GASTO'] as const
const MESES = [
  { value: 0, label: 'Ano Inteiro' },
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Marco' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' }
]

const EMPTY_FORM = {
  mes: 0, // 0 = Ano Inteiro
  ano: new Date().getFullYear(),
  parlamentarId: '',
  nomeParlamentar: '',
  observacao: '',
  documentos: [] as Documento[],
  valor: '',
  tipo: 'DECLARACAO' as (typeof TIPOS)[number]
}

const mesLabel = (m: number | null) =>
  m == null ? 'Ano Inteiro' : MESES.find(x => x.value === m)?.label || String(m)

export default function AdminCotasParlamentarPage() {
  const [data, setData] = useState<Cota[]>([])
  const [parlamentares, setParlamentares] = useState<Parlamentar[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm({ ...EMPTY_FORM })
  }

  const load = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/cotas-parlamentar?limit=200')
      const j = await r.json()
      setData(j?.data || [])
    } finally {
      setLoading(false)
    }
  }

  const loadParlamentares = async () => {
    try {
      const r = await fetch('/api/parlamentares')
      const j = await r.json()
      const list = j?.data || (Array.isArray(j) ? j : [])
      setParlamentares(list)
    } catch {
      // silencioso
    }
  }

  useEffect(() => {
    load()
    loadParlamentares()
  }, [])

  const handleEdit = (c: Cota) => {
    setEditingId(c.id)
    setForm({
      mes: c.mes ?? 0,
      ano: c.ano,
      parlamentarId: c.parlamentarId || '',
      nomeParlamentar: c.nomeParlamentar || '',
      observacao: c.observacao,
      documentos: Array.isArray(c.documentos) ? c.documentos : [],
      valor: c.valor != null ? String(c.valor) : '',
      tipo: (c.tipo as (typeof TIPOS)[number]) || 'DECLARACAO'
    })
    setShowForm(true)
  }

  const handleFileUpload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande (max 10MB)')
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'cotas-parlamentar')
      const r = await fetch('/api/upload', { method: 'POST', body: fd })
      const j = await r.json()
      if (j?.success && j?.url) {
        setForm(f => ({
          ...f,
          documentos: [...f.documentos, { nome: file.name, url: j.url }]
        }))
        toast.success('Arquivo enviado')
      } else {
        toast.error(j?.error || 'Erro no upload')
      }
    } catch {
      toast.error('Erro ao enviar arquivo')
    } finally {
      setUploading(false)
    }
  }

  const handleAddLinkExterno = () => {
    const nome = window.prompt('Nome do documento:')
    if (!nome) return
    const url = window.prompt('URL do documento (https://...):')
    if (!url) return
    try {
      new URL(url)
    } catch {
      toast.error('URL invalida')
      return
    }
    setForm(f => ({ ...f, documentos: [...f.documentos, { nome, url }] }))
  }

  const handleRemoveDocumento = (idx: number) => {
    setForm(f => ({
      ...f,
      documentos: f.documentos.filter((_, i) => i !== idx)
    }))
  }

  const handleSave = async () => {
    if (!form.observacao.trim()) {
      toast.error('Informe a observacao')
      return
    }
    if (!form.ano) {
      toast.error('Informe o ano')
      return
    }

    setSaving(true)
    try {
      const url = editingId ? `/api/cotas-parlamentar/${editingId}` : '/api/cotas-parlamentar'
      const method = editingId ? 'PUT' : 'POST'

      const parlamentar = parlamentares.find(p => p.id === form.parlamentarId)
      const nomeParlamentar = form.nomeParlamentar
        || parlamentar?.nomeParlamentar
        || parlamentar?.nomeCompleto
        || parlamentar?.nome
        || null

      const payload = {
        mes: form.mes === 0 ? null : form.mes,
        ano: Number(form.ano),
        parlamentarId: form.parlamentarId || null,
        nomeParlamentar,
        observacao: form.observacao,
        documentos: form.documentos.length > 0 ? form.documentos : null,
        valor: form.valor ? Number(form.valor) : null,
        tipo: form.tipo
      }

      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (r.ok) {
        toast.success(editingId ? 'Cota atualizada' : 'Cota criada')
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
    const r = await fetch(`/api/cotas-parlamentar/${id}`, { method: 'DELETE' })
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
            <Wallet className="h-6 w-6" /> Cotas para Exercicio da Atividade Parlamentar
          </h1>
          <p className="text-sm text-muted-foreground">
            Declaracoes anuais e lancamentos mensais de cotas/verbas indenizatorias
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={showForm}>
          <Plus className="h-4 w-4 mr-1" /> Novo Lancamento
        </Button>
      </div>

      <RedirectConfig slug="cotas-parlamentar" label="Cotas para Exercicio da Atividade Parlamentar" />

      {showForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              {editingId ? 'Editar lancamento' : 'Novo lancamento'}
            </CardTitle>
            <Button size="icon" variant="ghost" onClick={closeForm}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <Label>Tipo *</Label>
                <select
                  className="w-full mt-1.5 px-3 py-2 border rounded-md text-sm"
                  value={form.tipo}
                  onChange={e => setForm({ ...form, tipo: e.target.value as typeof form.tipo })}
                >
                  <option value="DECLARACAO">Declaracao (sem gasto)</option>
                  <option value="GASTO">Gasto / Despesa</option>
                </select>
              </div>
              <div>
                <Label>Mes</Label>
                <select
                  className="w-full mt-1.5 px-3 py-2 border rounded-md text-sm"
                  value={form.mes}
                  onChange={e => setForm({ ...form, mes: Number(e.target.value) })}
                >
                  {MESES.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Ano *</Label>
                <Input
                  type="number"
                  value={form.ano}
                  onChange={e => setForm({ ...form, ano: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.valor}
                  onChange={e => setForm({ ...form, valor: e.target.value })}
                  placeholder="Opcional"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Parlamentar</Label>
                <select
                  className="w-full mt-1.5 px-3 py-2 border rounded-md text-sm"
                  value={form.parlamentarId}
                  onChange={e => {
                    const pid = e.target.value
                    const p = parlamentares.find(x => x.id === pid)
                    setForm({
                      ...form,
                      parlamentarId: pid,
                      nomeParlamentar: p?.nomeParlamentar || p?.nomeCompleto || p?.nome || ''
                    })
                  }}
                >
                  <option value="">— (Camara como um todo) —</option>
                  {parlamentares.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nomeParlamentar || p.nomeCompleto || p.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Nome do parlamentar (sobrescreve)</Label>
                <Input
                  value={form.nomeParlamentar}
                  onChange={e => setForm({ ...form, nomeParlamentar: e.target.value })}
                  placeholder="Deixe vazio para usar o nome do cadastro"
                />
              </div>
            </div>

            <div>
              <Label>Observacao *</Label>
              <Textarea
                rows={3}
                value={form.observacao}
                onChange={e => setForm({ ...form, observacao: e.target.value })}
                placeholder='Ex.: Declaracao: Nao houve Cotas para Exercicio da Atividade Parlamentar ou Verba Indenizatoria em 2025.'
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Documento(s)</Label>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={handleAddLinkExterno}>
                    <ExternalLink className="h-3.5 w-3.5 mr-1" /> Link externo
                  </Button>
                  <label className="cursor-pointer">
                    <Button type="button" variant="outline" size="sm" disabled={uploading} asChild>
                      <span>
                        {uploading ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                        ) : (
                          <Upload className="h-3.5 w-3.5 mr-1" />
                        )}
                        Upload
                      </span>
                    </Button>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.zip"
                      onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload(file)
                        e.target.value = ''
                      }}
                    />
                  </label>
                </div>
              </div>
              {form.documentos.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhum documento anexado.</p>
              ) : (
                <ul className="space-y-1">
                  {form.documentos.map((d, i) => (
                    <li key={i} className="flex items-center justify-between text-sm border rounded-md px-2 py-1.5">
                      <span className="flex items-center gap-2 truncate">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <a href={d.url} target="_blank" rel="noopener noreferrer"
                          className="text-blue-600 hover:underline truncate">{d.nome}</a>
                      </span>
                      <Button size="icon" variant="ghost" className="h-7 w-7"
                        onClick={() => handleRemoveDocumento(i)}>
                        <X className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
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
              Nenhum lancamento cadastrado.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-3 py-2">Mes</th>
                    <th className="px-3 py-2">Ano</th>
                    <th className="px-3 py-2">Parlamentar</th>
                    <th className="px-3 py-2">Tipo</th>
                    <th className="px-3 py-2">Observacao</th>
                    <th className="px-3 py-2 text-center">Docs</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(c => {
                    const docs = Array.isArray(c.documentos) ? c.documentos : []
                    return (
                      <tr key={c.id} className="border-t">
                        <td className="px-3 py-2 italic text-muted-foreground">{mesLabel(c.mes)}</td>
                        <td className="px-3 py-2">{c.ano}</td>
                        <td className="px-3 py-2">{c.nomeParlamentar || '-'}</td>
                        <td className="px-3 py-2">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">
                            {c.tipo}
                          </span>
                        </td>
                        <td className="px-3 py-2 max-w-md">
                          <span className="line-clamp-2 text-xs">{c.observacao}</span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          {docs.length > 0 ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                              {docs.length}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => handleEdit(c)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => handleDelete(c.id)}
                              className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
