'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CalendarDays, Plus, Loader2, Trash2, Save, X, Pencil } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { useConfirm } from '@/lib/hooks/use-confirm-dialog'
import { toast } from 'sonner'

interface Agenda {
  id: string
  parlamentarId: string | null
  parlamentarNome: string | null
  titulo: string
  descricao: string | null
  local: string | null
  dataInicio: string
  dataFim: string | null
  tipo: string
}

interface Parlamentar {
  id: string
  nome: string
}

const TIPOS = ['COMPROMISSO', 'REUNIAO', 'EVENTO', 'VIAGEM', 'AUDIENCIA'] as const
const tipoLabels: Record<string, string> = {
  COMPROMISSO: 'Compromisso',
  REUNIAO: 'Reuniao',
  EVENTO: 'Evento',
  VIAGEM: 'Viagem',
  AUDIENCIA: 'Audiencia'
}

const toDateTimeInput = (iso: string | null) => (iso ? iso.slice(0, 16) : '')

const EMPTY_FORM = {
  parlamentarId: '',
  parlamentarNome: '',
  titulo: '',
  descricao: '',
  local: '',
  dataInicio: '',
  dataFim: '',
  tipo: 'COMPROMISSO' as (typeof TIPOS)[number]
}

export default function AdminAgendaParlamentarPage() {
  const confirm = useConfirm()
  const [data, setData] = useState<Agenda[]>([])
  const [parlamentares, setParlamentares] = useState<Parlamentar[]>([])
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
      const r = await fetch('/api/agenda-parlamentar?limit=500')
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

  const handleEdit = (a: Agenda) => {
    setEditingId(a.id)
    setForm({
      parlamentarId: a.parlamentarId || '',
      parlamentarNome: a.parlamentarNome || '',
      titulo: a.titulo,
      descricao: a.descricao || '',
      local: a.local || '',
      dataInicio: toDateTimeInput(a.dataInicio),
      dataFim: toDateTimeInput(a.dataFim),
      tipo: (a.tipo as (typeof TIPOS)[number]) || 'COMPROMISSO'
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.titulo.trim()) {
      toast.error('Informe o titulo do compromisso')
      return
    }
    if (!form.dataInicio) {
      toast.error('Informe a data de inicio')
      return
    }
    setSaving(true)
    try {
      const url = editingId ? `/api/agenda-parlamentar/${editingId}` : '/api/agenda-parlamentar'
      const method = editingId ? 'PUT' : 'POST'
      const payload = {
        parlamentarId: form.parlamentarId || null,
        parlamentarNome: form.parlamentarNome.trim() || null,
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim() || null,
        local: form.local.trim() || null,
        dataInicio: form.dataInicio,
        dataFim: form.dataFim || null,
        tipo: form.tipo
      }
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (r.ok) {
        toast.success(editingId ? 'Compromisso atualizado' : 'Compromisso criado')
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
    const ok = await confirm({
      title: 'Remover compromisso?',
      description: 'O compromisso será removido da agenda pública.',
      variant: 'destructive',
      confirmLabel: 'Remover',
    })
    if (!ok) return
    const r = await fetch(`/api/agenda-parlamentar/${id}`, { method: 'DELETE' })
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
            <CalendarDays className="h-6 w-6" /> Agenda Externa dos Parlamentares
          </h1>
          <p className="text-sm text-muted-foreground">
            Compromissos, reunioes e eventos externos dos vereadores
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={showForm}>
          <Plus className="h-4 w-4 mr-1" /> Novo Compromisso
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              {editingId ? 'Editar compromisso' : 'Novo compromisso'}
            </CardTitle>
            <Button size="icon" variant="ghost" onClick={closeForm}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Parlamentar</Label>
                <select
                  className="w-full mt-1.5 px-3 py-2 border rounded-md text-sm"
                  value={form.parlamentarId}
                  onChange={e => {
                    const pid = e.target.value
                    const p = parlamentares.find(x => x.id === pid)
                    setForm({ ...form, parlamentarId: pid, parlamentarNome: p?.nome || '' })
                  }}
                >
                  <option value="">— (Camara / mandato coletivo) —</option>
                  {parlamentares.map(p => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Tipo</Label>
                <select
                  className="w-full mt-1.5 px-3 py-2 border rounded-md text-sm"
                  value={form.tipo}
                  onChange={e => setForm({ ...form, tipo: e.target.value as typeof form.tipo })}
                >
                  {TIPOS.map(t => (
                    <option key={t} value={t}>{tipoLabels[t]}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label>Titulo *</Label>
              <Input
                value={form.titulo}
                onChange={e => setForm({ ...form, titulo: e.target.value })}
                placeholder="Ex.: Reuniao com a comunidade do bairro"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label>Inicio *</Label>
                <Input
                  type="datetime-local"
                  value={form.dataInicio}
                  onChange={e => setForm({ ...form, dataInicio: e.target.value })}
                />
              </div>
              <div>
                <Label>Termino</Label>
                <Input
                  type="datetime-local"
                  value={form.dataFim}
                  onChange={e => setForm({ ...form, dataFim: e.target.value })}
                />
              </div>
              <div>
                <Label>Local</Label>
                <Input
                  value={form.local}
                  onChange={e => setForm({ ...form, local: e.target.value })}
                  placeholder="Opcional"
                />
              </div>
            </div>

            <div>
              <Label>Descricao</Label>
              <Textarea
                rows={2}
                value={form.descricao}
                onChange={e => setForm({ ...form, descricao: e.target.value })}
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
            <EmptyState
              as="plain"
              icon={CalendarDays}
              title="Nenhum compromisso cadastrado"
              description="Cadastre os compromissos da agenda parlamentar pública (reuniões, audiências, eventos)."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-3 py-2">Inicio</th>
                    <th className="px-3 py-2">Titulo</th>
                    <th className="px-3 py-2">Parlamentar</th>
                    <th className="px-3 py-2">Tipo</th>
                    <th className="px-3 py-2">Local</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(a => (
                    <tr key={a.id} className="border-t">
                      <td className="px-3 py-2 whitespace-nowrap">
                        {new Date(a.dataInicio).toLocaleString('pt-BR', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="px-3 py-2 max-w-xs">
                        <span className="line-clamp-1 font-medium">{a.titulo}</span>
                      </td>
                      <td className="px-3 py-2">{a.parlamentarNome || '-'}</td>
                      <td className="px-3 py-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">
                          {tipoLabels[a.tipo] || a.tipo}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{a.local || '-'}</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(a)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(a.id)}
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
