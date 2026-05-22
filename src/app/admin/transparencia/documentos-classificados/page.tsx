'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Lock, Plus, Loader2, Trash2, Save, X, Pencil } from 'lucide-react'
import { toast } from 'sonner'

interface DocumentoClassificado {
  id: string
  titulo: string
  categoria: string | null
  grau: string
  fundamentoLegal: string | null
  dataClassificacao: string
  prazoAnos: number
  dataDesclassificacao: string | null
  situacao: string
  autoridade: string | null
  observacoes: string | null
}

const GRAUS = ['RESERVADA', 'SECRETA', 'ULTRASSECRETA'] as const
const SITUACOES = ['CLASSIFICADA', 'DESCLASSIFICADA'] as const

// Prazos legais padrao por grau (LAI Art. 24)
const PRAZO_POR_GRAU: Record<string, number> = {
  RESERVADA: 5,
  SECRETA: 15,
  ULTRASSECRETA: 25
}

const grauBadge: Record<string, string> = {
  RESERVADA: 'bg-yellow-100 text-yellow-800',
  SECRETA: 'bg-orange-100 text-orange-800',
  ULTRASSECRETA: 'bg-red-100 text-red-800'
}

const toDateInput = (iso: string | null) => (iso ? iso.slice(0, 10) : '')

const EMPTY_FORM = {
  titulo: '',
  categoria: '',
  grau: 'RESERVADA' as (typeof GRAUS)[number],
  fundamentoLegal: '',
  dataClassificacao: '',
  prazoAnos: 5,
  dataDesclassificacao: '',
  situacao: 'CLASSIFICADA' as (typeof SITUACOES)[number],
  autoridade: '',
  observacoes: ''
}

export default function AdminDocumentosClassificadosPage() {
  const [data, setData] = useState<DocumentoClassificado[]>([])
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
      const r = await fetch('/api/documentos-classificados?limit=500')
      const j = await r.json()
      setData(j?.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleEdit = (d: DocumentoClassificado) => {
    setEditingId(d.id)
    setForm({
      titulo: d.titulo,
      categoria: d.categoria || '',
      grau: (d.grau as (typeof GRAUS)[number]) || 'RESERVADA',
      fundamentoLegal: d.fundamentoLegal || '',
      dataClassificacao: toDateInput(d.dataClassificacao),
      prazoAnos: d.prazoAnos,
      dataDesclassificacao: toDateInput(d.dataDesclassificacao),
      situacao: (d.situacao as (typeof SITUACOES)[number]) || 'CLASSIFICADA',
      autoridade: d.autoridade || '',
      observacoes: d.observacoes || ''
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.titulo.trim()) {
      toast.error('Informe o titulo / assunto')
      return
    }
    if (!form.dataClassificacao) {
      toast.error('Informe a data de classificacao')
      return
    }
    setSaving(true)
    try {
      const url = editingId
        ? `/api/documentos-classificados/${editingId}`
        : '/api/documentos-classificados'
      const method = editingId ? 'PUT' : 'POST'
      const payload = {
        titulo: form.titulo.trim(),
        categoria: form.categoria.trim() || null,
        grau: form.grau,
        fundamentoLegal: form.fundamentoLegal.trim() || null,
        dataClassificacao: form.dataClassificacao,
        prazoAnos: Number(form.prazoAnos),
        dataDesclassificacao: form.dataDesclassificacao || null,
        situacao: form.situacao,
        autoridade: form.autoridade.trim() || null,
        observacoes: form.observacoes.trim() || null
      }
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (r.ok) {
        toast.success(editingId ? 'Documento atualizado' : 'Documento registrado')
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
    if (!confirm('Remover este registro do rol?')) return
    const r = await fetch(`/api/documentos-classificados/${id}`, { method: 'DELETE' })
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
            <Lock className="h-6 w-6" /> Rol de Informacoes Classificadas
          </h1>
          <p className="text-sm text-muted-foreground">
            Documentos classificados e desclassificados (LAI Art. 30)
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={showForm}>
          <Plus className="h-4 w-4 mr-1" /> Novo Registro
        </Button>
      </div>

      <Card className="border-l-4 border-l-camara-primary">
        <CardContent className="p-4 text-sm text-muted-foreground">
          O campo <strong>Titulo / Assunto</strong> deve descrever o tema do documento
          de forma <strong>generica</strong> — nunca reproduza o conteudo sigiloso.
          Este rol e de publicacao obrigatoria e fica visivel no portal publico.
        </CardContent>
      </Card>

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
            <div>
              <Label>Titulo / Assunto (generico) *</Label>
              <Input
                value={form.titulo}
                onChange={e => setForm({ ...form, titulo: e.target.value })}
                placeholder="Ex.: Documentos relativos a seguranca de autoridade"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label>Grau de Sigilo *</Label>
                <select
                  className="w-full mt-1.5 px-3 py-2 border rounded-md text-sm"
                  value={form.grau}
                  onChange={e => {
                    const grau = e.target.value as typeof form.grau
                    setForm({ ...form, grau, prazoAnos: PRAZO_POR_GRAU[grau] ?? form.prazoAnos })
                  }}
                >
                  {GRAUS.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Prazo (anos) *</Label>
                <Input
                  type="number"
                  value={form.prazoAnos}
                  onChange={e => setForm({ ...form, prazoAnos: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Situacao *</Label>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label>Data de Classificacao *</Label>
                <Input
                  type="date"
                  value={form.dataClassificacao}
                  onChange={e => setForm({ ...form, dataClassificacao: e.target.value })}
                />
              </div>
              <div>
                <Label>Data de Desclassificacao</Label>
                <Input
                  type="date"
                  value={form.dataDesclassificacao}
                  onChange={e => setForm({ ...form, dataDesclassificacao: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Vazio = calculada (classificacao + prazo)
                </p>
              </div>
              <div>
                <Label>Categoria</Label>
                <Input
                  value={form.categoria}
                  onChange={e => setForm({ ...form, categoria: e.target.value })}
                  placeholder="Opcional"
                />
              </div>
            </div>

            <div>
              <Label>Fundamento Legal</Label>
              <Input
                value={form.fundamentoLegal}
                onChange={e => setForm({ ...form, fundamentoLegal: e.target.value })}
                placeholder="Ex.: Art. 23, VIII e Art. 24 da Lei 12.527/2011"
              />
            </div>

            <div>
              <Label>Autoridade Classificadora</Label>
              <Input
                value={form.autoridade}
                onChange={e => setForm({ ...form, autoridade: e.target.value })}
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
              Nenhum documento classificado registrado.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-3 py-2">Titulo / Assunto</th>
                    <th className="px-3 py-2">Grau</th>
                    <th className="px-3 py-2">Classificacao</th>
                    <th className="px-3 py-2">Desclassificacao</th>
                    <th className="px-3 py-2 text-center">Situacao</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(d => (
                    <tr key={d.id} className="border-t">
                      <td className="px-3 py-2 font-medium max-w-md">
                        <span className="line-clamp-2">{d.titulo}</span>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${grauBadge[d.grau] || 'bg-gray-100'}`}>
                          {d.grau}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {new Date(d.dataClassificacao).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-3 py-2">
                        {d.dataDesclassificacao
                          ? new Date(d.dataDesclassificacao).toLocaleDateString('pt-BR')
                          : '-'}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          d.situacao === 'DESCLASSIFICADA'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {d.situacao}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(d)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(d.id)}
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
