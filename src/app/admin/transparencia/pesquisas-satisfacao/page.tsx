'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  CheckCircle2, Loader2, Plus, Trash2, ArrowLeft, Save, X, BarChart3, ExternalLink, ClipboardCheck,
} from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { toast } from 'sonner'

type Tipo = 'ESCALA_1_5' | 'SIM_NAO' | 'TEXTO' | 'MULTIPLA_ESCOLHA'

interface Pergunta {
  id: string
  label: string
  tipo: Tipo
  obrigatoria?: boolean
  opcoes?: string[]
}

interface PesquisaResumo {
  id: string
  titulo: string
  descricao: string | null
  periodoInicio: string
  periodoFim: string | null
  ativa: boolean
  publicaResultados: boolean
  totalRespostas: number
}

const TIPOS: { value: Tipo; label: string }[] = [
  { value: 'ESCALA_1_5', label: 'Escala 1 a 5' },
  { value: 'SIM_NAO', label: 'Sim / Nao' },
  { value: 'MULTIPLA_ESCOLHA', label: 'Multipla escolha' },
  { value: 'TEXTO', label: 'Texto livre' },
]

const EMPTY_FORM = {
  titulo: '',
  descricao: '',
  periodoInicio: new Date().toISOString().slice(0, 10),
  periodoFim: '',
  ativa: true,
  publicaResultados: true,
  perguntas: [] as Pergunta[],
}

function gerarIdPergunta() {
  return `p_${Math.random().toString(36).slice(2, 8)}`
}

export default function AdminPesquisasSatisfacaoPage() {
  const [lista, setLista] = useState<PesquisaResumo[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/pesquisas-satisfacao')
      const j = await r.json()
      setLista(j?.data || [])
    } catch {
      toast.error('Erro ao carregar pesquisas')
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

  const handleEdit = async (p: PesquisaResumo) => {
    try {
      const r = await fetch(`/api/pesquisas-satisfacao/${p.id}`)
      const j = await r.json()
      const d = j?.data
      if (!d) return
      setEditing(p.id)
      setForm({
        titulo: d.titulo || '',
        descricao: d.descricao || '',
        periodoInicio: d.periodoInicio?.slice(0, 10) || '',
        periodoFim: d.periodoFim?.slice(0, 10) || '',
        ativa: !!d.ativa,
        publicaResultados: !!d.publicaResultados,
        perguntas: d.perguntas || [],
      })
      setShowForm(true)
    } catch {
      toast.error('Erro ao carregar pesquisa')
    }
  }

  const handleSave = async () => {
    if (!form.titulo.trim()) {
      toast.error('Informe o titulo')
      return
    }
    if (form.perguntas.length === 0) {
      toast.error('Adicione ao menos uma pergunta')
      return
    }
    setSaving(true)
    try {
      const payload = {
        titulo: form.titulo,
        descricao: form.descricao || undefined,
        periodoInicio: form.periodoInicio,
        periodoFim: form.periodoFim || null,
        ativa: form.ativa,
        publicaResultados: form.publicaResultados,
        perguntas: form.perguntas,
      }
      const url = editing
        ? `/api/pesquisas-satisfacao/${editing}`
        : '/api/pesquisas-satisfacao'
      const r = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (r.ok) {
        toast.success(editing ? 'Pesquisa atualizada' : 'Pesquisa criada')
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
    if (!confirm('Remover esta pesquisa e todas as respostas? Esta acao nao pode ser desfeita.')) return
    try {
      const r = await fetch(`/api/pesquisas-satisfacao/${id}`, { method: 'DELETE' })
      if (r.ok) {
        toast.success('Pesquisa removida')
        load()
      } else {
        toast.error('Erro ao remover')
      }
    } catch {
      toast.error('Erro ao remover')
    }
  }

  const addPergunta = () => {
    setForm({
      ...form,
      perguntas: [
        ...form.perguntas,
        { id: gerarIdPergunta(), label: '', tipo: 'ESCALA_1_5', obrigatoria: true },
      ],
    })
  }

  const updatePergunta = (idx: number, patch: Partial<Pergunta>) => {
    const next = [...form.perguntas]
    next[idx] = { ...next[idx], ...patch }
    setForm({ ...form, perguntas: next })
  }

  const removePergunta = (idx: number) => {
    setForm({ ...form, perguntas: form.perguntas.filter((_, i) => i !== idx) })
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
              <CheckCircle2 className="h-6 w-6" /> Pesquisas de Satisfacao
            </h1>
            <p className="text-sm text-muted-foreground">
              Formularios anonimos para avaliar servicos da Camara (PNTP 15.6, Lei 13.460/2017)
            </p>
          </div>
          {!showForm && (
            <Button onClick={() => { setShowForm(true); setEditing(null); setForm(EMPTY_FORM) }}>
              <Plus className="h-4 w-4 mr-1" />
              Nova pesquisa
            </Button>
          )}
        </div>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {editing ? 'Editar pesquisa' : 'Nova pesquisa'}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={closeForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Titulo *</Label>
              <Input
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                placeholder="Ex.: Satisfacao com o atendimento da Ouvidoria"
              />
            </div>
            <div>
              <Label>Descricao</Label>
              <Textarea
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                rows={2}
                placeholder="Breve explicacao sobre o objetivo da pesquisa"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Periodo inicio *</Label>
                <Input
                  type="date"
                  value={form.periodoInicio}
                  onChange={(e) => setForm({ ...form, periodoInicio: e.target.value })}
                />
              </div>
              <div>
                <Label>Periodo fim</Label>
                <Input
                  type="date"
                  value={form.periodoFim}
                  onChange={(e) => setForm({ ...form, periodoFim: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-4">
              <Label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.ativa}
                  onChange={(e) => setForm({ ...form, ativa: e.target.checked })}
                />
                Ativa (aceitando respostas)
              </Label>
              <Label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.publicaResultados}
                  onChange={(e) => setForm({ ...form, publicaResultados: e.target.checked })}
                />
                Publicar resultados ao cidadao
              </Label>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">Perguntas</h3>
                <Button size="sm" variant="outline" onClick={addPergunta}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar pergunta
                </Button>
              </div>
              {form.perguntas.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma pergunta adicionada. Clique em &ldquo;Adicionar pergunta&rdquo;.
                </p>
              ) : (
                <div className="space-y-3">
                  {form.perguntas.map((p, idx) => (
                    <div key={p.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="text-sm font-semibold mt-2 w-6 text-right">{idx + 1}.</span>
                        <div className="flex-1 space-y-2">
                          <Input
                            value={p.label}
                            onChange={(e) => updatePergunta(idx, { label: e.target.value })}
                            placeholder="Texto da pergunta"
                          />
                          <div className="flex flex-wrap gap-2 items-center">
                            <select
                              value={p.tipo}
                              onChange={(e) => updatePergunta(idx, { tipo: e.target.value as Tipo })}
                              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                            >
                              {TIPOS.map((t) => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                              ))}
                            </select>
                            <Label className="flex items-center gap-1.5 text-xs cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!p.obrigatoria}
                                onChange={(e) => updatePergunta(idx, { obrigatoria: e.target.checked })}
                              />
                              Obrigatoria
                            </Label>
                          </div>
                          {p.tipo === 'MULTIPLA_ESCOLHA' && (
                            <div>
                              <Label className="text-xs">Opcoes (uma por linha)</Label>
                              <Textarea
                                value={(p.opcoes || []).join('\n')}
                                onChange={(e) => updatePergunta(idx, { opcoes: e.target.value.split('\n').filter(Boolean) })}
                                rows={3}
                                placeholder="Otimo&#10;Bom&#10;Regular&#10;Ruim"
                              />
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePergunta(idx)}
                          title="Remover pergunta"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={closeForm}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                Salvar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pesquisas cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : lista.length === 0 ? (
            <EmptyState
              as="plain"
              icon={ClipboardCheck}
              title="Nenhuma pesquisa cadastrada"
              description="Crie pesquisas de satisfação para o cidadão avaliar os serviços da Câmara."
            />
          ) : (
            <div className="space-y-2">
              {lista.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 border rounded-lg p-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{p.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.totalRespostas} resposta(s)
                      {' · '}
                      {p.ativa ? (
                        <span className="text-green-700">Ativa</span>
                      ) : (
                        <span>Inativa</span>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/transparencia/pesquisas-satisfacao/${p.id}/resultados`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1"
                      title="Ver resultados publicos"
                    >
                      <BarChart3 className="h-3.5 w-3.5" />
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(p)}>
                      Editar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(p.id)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
