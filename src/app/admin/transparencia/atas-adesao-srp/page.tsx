'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Layers, Loader2, Plus, Trash2, ArrowLeft, Save, X, ExternalLink, FileText,
} from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { useConfirm } from '@/lib/hooks/use-confirm-dialog'
import { toast } from 'sonner'

interface DocumentoItem {
  nome: string
  url: string
}

interface AtaItem {
  id: string
  numero: string
  ano: number
  objeto: string
  orgaoGerenciador: string
  fornecedor: string
  cnpjFornecedor: string | null
  valorTotal: number | string
  vigenciaInicio: string
  vigenciaFim: string
  numeroAtaOriginal: string | null
  orgaoOrigem: string | null
  documentos: DocumentoItem[] | null
  arquivo: string | null
  dataPublicacao: string | null
  situacao: string
  observacoes: string | null
}

const SITUACOES = ['VIGENTE', 'ENCERRADA', 'CANCELADA'] as const

const EMPTY_FORM = {
  numero: '',
  ano: new Date().getFullYear(),
  objeto: '',
  orgaoGerenciador: '',
  fornecedor: '',
  cnpjFornecedor: '',
  valorTotal: 0,
  vigenciaInicio: '',
  vigenciaFim: '',
  numeroAtaOriginal: '',
  orgaoOrigem: '',
  documentos: [] as DocumentoItem[],
  arquivo: '',
  dataPublicacao: '',
  situacao: 'VIGENTE',
  observacoes: '',
}

function formatValor(v: number | string) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function dataDoISO(s: string | null) {
  if (!s) return ''
  return s.slice(0, 10)
}

export default function AdminAtasAdesaoSRPPage() {
  const confirm = useConfirm()
  const [lista, setLista] = useState<AtaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/atas-adesao-srp?limit=200')
      const j = await r.json()
      setLista(j?.data || [])
    } catch {
      toast.error('Erro ao carregar atas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const closeForm = () => {
    setShowForm(false)
    setEditing(null)
    setForm(EMPTY_FORM)
  }

  const handleEdit = (a: AtaItem) => {
    setEditing(a.id)
    setForm({
      numero: a.numero,
      ano: a.ano,
      objeto: a.objeto,
      orgaoGerenciador: a.orgaoGerenciador,
      fornecedor: a.fornecedor,
      cnpjFornecedor: a.cnpjFornecedor || '',
      valorTotal: Number(a.valorTotal),
      vigenciaInicio: dataDoISO(a.vigenciaInicio),
      vigenciaFim: dataDoISO(a.vigenciaFim),
      numeroAtaOriginal: a.numeroAtaOriginal || '',
      orgaoOrigem: a.orgaoOrigem || '',
      documentos: a.documentos || [],
      arquivo: a.arquivo || '',
      dataPublicacao: dataDoISO(a.dataPublicacao),
      situacao: a.situacao,
      observacoes: a.observacoes || '',
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.numero.trim() || !form.objeto.trim() || !form.orgaoGerenciador.trim() || !form.fornecedor.trim()) {
      toast.error('Preencha os campos obrigatorios')
      return
    }
    if (!form.vigenciaInicio || !form.vigenciaFim) {
      toast.error('Informe a vigencia')
      return
    }
    setSaving(true)
    try {
      const payload = {
        numero: form.numero,
        ano: Number(form.ano),
        objeto: form.objeto,
        orgaoGerenciador: form.orgaoGerenciador,
        fornecedor: form.fornecedor,
        cnpjFornecedor: form.cnpjFornecedor || null,
        valorTotal: Number(form.valorTotal),
        vigenciaInicio: form.vigenciaInicio,
        vigenciaFim: form.vigenciaFim,
        numeroAtaOriginal: form.numeroAtaOriginal || null,
        orgaoOrigem: form.orgaoOrigem || null,
        documentos: form.documentos.filter((d) => d.nome && d.url),
        arquivo: form.arquivo || null,
        dataPublicacao: form.dataPublicacao || null,
        situacao: form.situacao,
        observacoes: form.observacoes || null,
      }
      const url = editing ? `/api/atas-adesao-srp/${editing}` : '/api/atas-adesao-srp'
      const r = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (r.ok) {
        toast.success(editing ? 'Ata atualizada' : 'Ata cadastrada')
        closeForm()
        load()
      } else {
        const e = await r.json().catch(() => ({}))
        toast.error(e?.message || e?.error || 'Erro ao salvar')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Remover ata?',
      description: 'Esta ação não pode ser desfeita.',
      variant: 'destructive',
      confirmLabel: 'Remover',
    })
    if (!ok) return
    try {
      const r = await fetch(`/api/atas-adesao-srp/${id}`, { method: 'DELETE' })
      if (r.ok) {
        toast.success('Ata removida')
        load()
      } else {
        toast.error('Erro ao remover')
      }
    } catch {
      toast.error('Erro ao remover')
    }
  }

  const addDocumento = () => {
    setForm({ ...form, documentos: [...form.documentos, { nome: '', url: '' }] })
  }

  const updateDocumento = (idx: number, patch: Partial<DocumentoItem>) => {
    const next = [...form.documentos]
    next[idx] = { ...next[idx], ...patch }
    setForm({ ...form, documentos: next })
  }

  const removeDocumento = (idx: number) => {
    setForm({ ...form, documentos: form.documentos.filter((_, i) => i !== idx) })
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/transparencia"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar para Transparencia
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Layers className="h-6 w-6" /> Atas de Adesao a Registro de Precos
            </h1>
            <p className="text-sm text-muted-foreground">
              Adesoes a Atas SRP gerenciadas por outros orgaos (PNTP 8.5, Lei 14.133/2021)
            </p>
          </div>
          {!showForm && (
            <Button onClick={() => { setShowForm(true); setEditing(null); setForm(EMPTY_FORM) }}>
              <Plus className="h-4 w-4 mr-1" />
              Nova adesao
            </Button>
          )}
        </div>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {editing ? 'Editar adesao' : 'Nova adesao a SRP'}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={closeForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label>Numero *</Label>
                <Input value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} placeholder="001" />
              </div>
              <div>
                <Label>Ano *</Label>
                <Input type="number" value={form.ano} onChange={(e) => setForm({ ...form, ano: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Situacao</Label>
                <select
                  value={form.situacao}
                  onChange={(e) => setForm({ ...form, situacao: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {SITUACOES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <Label>Objeto *</Label>
              <Textarea value={form.objeto} onChange={(e) => setForm({ ...form, objeto: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Orgao gerenciador *</Label>
                <Input value={form.orgaoGerenciador} onChange={(e) => setForm({ ...form, orgaoGerenciador: e.target.value })} placeholder="Prefeitura Municipal" />
              </div>
              <div>
                <Label>Fornecedor *</Label>
                <Input value={form.fornecedor} onChange={(e) => setForm({ ...form, fornecedor: e.target.value })} />
              </div>
              <div>
                <Label>CNPJ do fornecedor</Label>
                <Input value={form.cnpjFornecedor} onChange={(e) => setForm({ ...form, cnpjFornecedor: e.target.value })} />
              </div>
              <div>
                <Label>Valor total (R$) *</Label>
                <Input type="number" step="0.01" value={form.valorTotal} onChange={(e) => setForm({ ...form, valorTotal: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Vigencia inicio *</Label>
                <Input type="date" value={form.vigenciaInicio} onChange={(e) => setForm({ ...form, vigenciaInicio: e.target.value })} />
              </div>
              <div>
                <Label>Vigencia fim *</Label>
                <Input type="date" value={form.vigenciaFim} onChange={(e) => setForm({ ...form, vigenciaFim: e.target.value })} />
              </div>
              <div>
                <Label>Numero da ata original</Label>
                <Input value={form.numeroAtaOriginal} onChange={(e) => setForm({ ...form, numeroAtaOriginal: e.target.value })} placeholder="123/2025" />
              </div>
              <div>
                <Label>Orgao de origem</Label>
                <Input value={form.orgaoOrigem} onChange={(e) => setForm({ ...form, orgaoOrigem: e.target.value })} />
              </div>
              <div>
                <Label>Data de publicacao</Label>
                <Input type="date" value={form.dataPublicacao} onChange={(e) => setForm({ ...form, dataPublicacao: e.target.value })} />
                <p className="text-xs text-muted-foreground mt-1">RN-124: publicar em ate 24h apos assinatura</p>
              </div>
              <div>
                <Label>URL do arquivo principal (PDF)</Label>
                <Input value={form.arquivo} onChange={(e) => setForm({ ...form, arquivo: e.target.value })} placeholder="https://..." />
              </div>
            </div>
            <div>
              <Label>Observacoes</Label>
              <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={2} />
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">Documentos anexos</h3>
                <Button size="sm" variant="outline" onClick={addDocumento}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar documento
                </Button>
              </div>
              {form.documentos.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-3">
                  Nenhum documento anexado. Voce pode anexar ata original, termo de adesao, pesquisa de mercado, etc.
                </p>
              ) : (
                <div className="space-y-2">
                  {form.documentos.map((d, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <Input
                        placeholder="Nome (ex.: Ata Original)"
                        value={d.nome}
                        onChange={(e) => updateDocumento(idx, { nome: e.target.value })}
                        className="flex-1"
                      />
                      <Input
                        placeholder="URL"
                        value={d.url}
                        onChange={(e) => updateDocumento(idx, { url: e.target.value })}
                        className="flex-1"
                      />
                      <Button variant="ghost" size="sm" onClick={() => removeDocumento(idx)} title="Remover">
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={closeForm}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                Salvar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Atas cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : lista.length === 0 ? (
            <EmptyState
              as="plain"
              icon={FileText}
              title="Nenhuma ata cadastrada"
              description="Cadastre as Atas de Adesão SRP (Sistema de Registro de Preços) para transparência."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="px-3 py-2">Numero/Ano</th>
                    <th className="px-3 py-2">Fornecedor</th>
                    <th className="px-3 py-2">Valor</th>
                    <th className="px-3 py-2">Vigencia</th>
                    <th className="px-3 py-2">Situacao</th>
                    <th className="px-3 py-2 text-right">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map((a) => (
                    <tr key={a.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium">{a.numero}/{a.ano}</td>
                      <td className="px-3 py-2">{a.fornecedor}</td>
                      <td className="px-3 py-2">{formatValor(a.valorTotal)}</td>
                      <td className="px-3 py-2 text-xs">
                        {dataDoISO(a.vigenciaInicio)} a {dataDoISO(a.vigenciaFim)}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${a.situacao === 'VIGENTE' ? 'bg-green-100 text-green-700' : a.situacao === 'CANCELADA' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                          {a.situacao}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="inline-flex gap-1">
                          <Link
                            href={`/transparencia/atas-adesao-srp`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 px-2 py-1"
                            title="Ver publico"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                          <Button variant="outline" size="sm" onClick={() => handleEdit(a)}>
                            Editar
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDelete(a.id)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
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
