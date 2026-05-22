'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FileText, Plus, Loader2, Trash2, Save, X, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { RedirectConfig } from '@/components/admin/redirect-config'

interface Documento {
  id: string
  tipo: string
  titulo: string
  descricao: string | null
  ano: number
  mes: number | null
  dataPublicacao: string
  arquivo: string | null
  url: string | null
  responsavel: string | null
  status: string
}

const TIPOS = [
  { value: 'BALANCETE_FINANCEIRO', label: 'Balancete Financeiro' },
  { value: 'BALANCO_ANUAL', label: 'Balanco Anual' },
  { value: 'PARECER_TCM', label: 'Parecer TCM' },
  { value: 'JULGAMENTO_CONTAS_EXECUTIVO', label: 'Julgamento Contas Executivo' },
  { value: 'PLANEJAMENTO_ESTRATEGICO', label: 'Planejamento Estrategico' },
  { value: 'CARTA_SERVICOS', label: 'Carta de Servicos' },
  { value: 'LGPD_GOVERNO_DIGITAL', label: 'LGPD / Governo Digital' },
  { value: 'PLANO_ANUAL_CONTRATACOES', label: 'Plano Anual de Contratacoes (PAC)' },
  { value: 'RELATORIO_GESTAO', label: 'Relatorio de Gestao' },
  { value: 'RGF', label: 'Relatorio de Gestao Fiscal (RGF)' },
  { value: 'LDO', label: 'Lei de Diretrizes Orcamentarias (LDO)' },
  { value: 'LOA', label: 'Lei Orcamentaria Anual (LOA)' },
  { value: 'PPA', label: 'Plano Plurianual (PPA)' },
  { value: 'PLANO_DADOS_ABERTOS', label: 'Plano de Dados Abertos' },
  { value: 'REGULAMENTO_OUVIDORIA', label: 'Regulamento da Ouvidoria' }
] as const

const EMPTY_FORM = {
  tipo: 'BALANCETE_FINANCEIRO' as (typeof TIPOS)[number]['value'],
  titulo: '',
  descricao: '',
  ano: new Date().getFullYear(),
  mes: '',
  dataPublicacao: new Date().toISOString().split('T')[0],
  arquivo: '',
  url: '',
  responsavel: '',
  status: 'publicado'
}

export default function AdminDocumentosPage() {
  const [data, setData] = useState<Documento[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState<string>('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm({ ...EMPTY_FORM })
  }

  const handleEdit = (d: Documento) => {
    setEditingId(d.id)
    setForm({
      tipo: d.tipo as (typeof TIPOS)[number]['value'],
      titulo: d.titulo,
      descricao: d.descricao || '',
      ano: d.ano,
      mes: d.mes != null ? String(d.mes) : '',
      dataPublicacao: d.dataPublicacao.split('T')[0],
      arquivo: d.arquivo || '',
      url: d.url || '',
      responsavel: d.responsavel || '',
      status: d.status
    })
    setShowForm(true)
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const url = filtroTipo
        ? `/api/documentos-transparencia?limit=100&tipo=${filtroTipo}`
        : '/api/documentos-transparencia?limit=100'
      const r = await fetch(url)
      const j = await r.json()
      setData(j?.data || [])
    } finally {
      setLoading(false)
    }
  }, [filtroTipo])

  useEffect(() => {
    load()
  }, [load])

  const handleSave = async () => {
    if (!form.arquivo && !form.url) {
      toast.error('Informe um arquivo OU uma URL externa')
      return
    }
    setSaving(true)
    try {
      const url = editingId ? `/api/documentos-transparencia/${editingId}` : '/api/documentos-transparencia'
      const method = editingId ? 'PUT' : 'POST'
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: form.tipo,
          titulo: form.titulo,
          descricao: form.descricao || undefined,
          ano: Number(form.ano),
          mes: form.mes ? Number(form.mes) : null,
          dataPublicacao: form.dataPublicacao,
          arquivo: form.arquivo || undefined,
          url: form.url || undefined,
          responsavel: form.responsavel || undefined,
          status: form.status
        })
      })
      if (r.ok) {
        toast.success(editingId ? 'Documento atualizado' : 'Documento criado')
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
    if (!confirm('Remover este documento?')) return
    const r = await fetch(`/api/documentos-transparencia/${id}`, { method: 'DELETE' })
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
            <FileText className="h-6 w-6" /> Documentos Oficiais
          </h1>
          <p className="text-sm text-muted-foreground">
            Balancetes, Balancos, Pareceres TCM, Julgamento de Contas, Planejamento Estrategico, Carta de Servicos, LGPD e PAC
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={showForm}>
          <Plus className="h-4 w-4 mr-1" /> Novo Documento
        </Button>
      </div>

      <RedirectConfig slug="documentos-oficiais" label="Documentos Oficiais" />

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Label>Filtrar por tipo:</Label>
            <select
              className="px-3 py-2 border rounded-md text-sm"
              value={filtroTipo}
              onChange={e => setFiltroTipo(e.target.value)}
            >
              <option value="">Todos os tipos</option>
              {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </CardContent>
      </Card>

      {showForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{editingId ? 'Editar documento' : 'Novo documento'}</CardTitle>
            <Button size="icon" variant="ghost" onClick={closeForm}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <Label>Tipo *</Label>
              <select
                className="w-full mt-1.5 px-3 py-2 border rounded-md text-sm"
                value={form.tipo}
                onChange={e => setForm({ ...form, tipo: e.target.value as typeof form.tipo })}
              >
                {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <Label>Status</Label>
              <select
                className="w-full mt-1.5 px-3 py-2 border rounded-md text-sm"
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
              >
                <option value="publicado">Publicado</option>
                <option value="rascunho">Rascunho</option>
                <option value="arquivado">Arquivado</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <Label>Titulo *</Label>
              <Input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} />
            </div>
            <div className="md:col-span-3">
              <Label>Descricao</Label>
              <Textarea rows={2} value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
            </div>
            <div>
              <Label>Ano *</Label>
              <Input type="number" value={form.ano} onChange={e => setForm({ ...form, ano: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Mes (opcional)</Label>
              <Input type="number" min={1} max={12} value={form.mes} onChange={e => setForm({ ...form, mes: e.target.value })} />
            </div>
            <div>
              <Label>Data publicacao *</Label>
              <Input type="date" value={form.dataPublicacao} onChange={e => setForm({ ...form, dataPublicacao: e.target.value })} />
            </div>
            <div className="md:col-span-3">
              <Label>Arquivo (URL/path)</Label>
              <Input placeholder="/uploads/balancete-2024.pdf" value={form.arquivo} onChange={e => setForm({ ...form, arquivo: e.target.value })} />
            </div>
            <div className="md:col-span-3">
              <Label>OU URL externa</Label>
              <Input placeholder="https://portal-antigo.exemplo.gov.br/documento" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />
              <p className="text-xs text-muted-foreground mt-1">Informe arquivo OU url, nao precisa os dois.</p>
            </div>
            <div className="md:col-span-3">
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
            <p className="text-center py-12 text-muted-foreground">Nenhum documento cadastrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-3 py-2">Tipo</th>
                    <th className="px-3 py-2">Titulo</th>
                    <th className="px-3 py-2">Ano</th>
                    <th className="px-3 py-2">Publicacao</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(d => (
                    <tr key={d.id} className="border-t">
                      <td className="px-3 py-2 text-xs">{TIPOS.find(t => t.value === d.tipo)?.label || d.tipo}</td>
                      <td className="px-3 py-2">{d.titulo}</td>
                      <td className="px-3 py-2">{d.ano}{d.mes ? `/${String(d.mes).padStart(2, '0')}` : ''}</td>
                      <td className="px-3 py-2">{new Date(d.dataPublicacao).toLocaleDateString('pt-BR')}</td>
                      <td className="px-3 py-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">{d.status}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(d)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(d.id)} className="text-destructive">
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
