'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Briefcase, Plus, Loader2, Trash2, Save, X, Pencil, FileText } from 'lucide-react'
import { toast } from 'sonner'

interface Plano {
  id: string
  nome: string
  lei: string | null
  ano: number
  descricao: string | null
  ativo: boolean
  _count?: { cargos: number }
}

interface Cargo {
  id: string
  planoCargosId: string | null
  denominacao: string
  tipo: string
  quantidadeVagas: number | null
  cargaHoraria: number | null
  salarioBase: number
  observacoes: string | null
  planoCargos?: { id: string; nome: string; ano: number } | null
}

const TIPOS = ['EFETIVO', 'COMISSIONADO', 'FUNCAO_GRATIFICADA', 'ELETIVO'] as const
const tipoLabels: Record<string, string> = {
  EFETIVO: 'Efetivo',
  COMISSIONADO: 'Comissionado',
  FUNCAO_GRATIFICADA: 'Funcao Gratificada',
  ELETIVO: 'Eletivo'
}

const EMPTY_PLANO = {
  nome: '',
  lei: '',
  ano: new Date().getFullYear(),
  descricao: '',
  ativo: true
}

const EMPTY_CARGO = {
  planoCargosId: '',
  denominacao: '',
  tipo: 'EFETIVO' as (typeof TIPOS)[number],
  quantidadeVagas: '',
  cargaHoraria: '',
  salarioBase: '',
  observacoes: ''
}

export default function AdminPlanoCargosPage() {
  const [planos, setPlanos] = useState<Plano[]>([])
  const [cargos, setCargos] = useState<Cargo[]>([])
  const [loading, setLoading] = useState(true)

  const [showPlanoForm, setShowPlanoForm] = useState(false)
  const [editingPlanoId, setEditingPlanoId] = useState<string | null>(null)
  const [planoForm, setPlanoForm] = useState({ ...EMPTY_PLANO })
  const [savingPlano, setSavingPlano] = useState(false)

  const [showCargoForm, setShowCargoForm] = useState(false)
  const [editingCargoId, setEditingCargoId] = useState<string | null>(null)
  const [cargoForm, setCargoForm] = useState({ ...EMPTY_CARGO })
  const [savingCargo, setSavingCargo] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [rp, rc] = await Promise.all([
        fetch('/api/plano-cargos?limit=200'),
        fetch('/api/cargos?limit=500')
      ])
      const jp = await rp.json()
      const jc = await rc.json()
      setPlanos(jp?.data || [])
      setCargos(jc?.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  // --- Planos ---
  const closePlanoForm = () => {
    setShowPlanoForm(false)
    setEditingPlanoId(null)
    setPlanoForm({ ...EMPTY_PLANO })
  }

  const handleEditPlano = (p: Plano) => {
    setEditingPlanoId(p.id)
    setPlanoForm({
      nome: p.nome,
      lei: p.lei || '',
      ano: p.ano,
      descricao: p.descricao || '',
      ativo: p.ativo
    })
    setShowPlanoForm(true)
  }

  const handleSavePlano = async () => {
    if (!planoForm.nome.trim()) {
      toast.error('Informe o nome do plano')
      return
    }
    setSavingPlano(true)
    try {
      const url = editingPlanoId ? `/api/plano-cargos/${editingPlanoId}` : '/api/plano-cargos'
      const method = editingPlanoId ? 'PUT' : 'POST'
      const payload = {
        nome: planoForm.nome.trim(),
        lei: planoForm.lei.trim() || null,
        ano: Number(planoForm.ano),
        descricao: planoForm.descricao.trim() || null,
        ativo: planoForm.ativo
      }
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (r.ok) {
        toast.success(editingPlanoId ? 'Plano atualizado' : 'Plano criado')
        closePlanoForm()
        load()
      } else {
        const e = await r.json().catch(() => ({}))
        toast.error(e?.message || 'Erro ao salvar')
      }
    } finally {
      setSavingPlano(false)
    }
  }

  const handleDeletePlano = async (id: string) => {
    if (!confirm('Remover este plano? Os cargos vinculados ficarao sem plano.')) return
    const r = await fetch(`/api/plano-cargos/${id}`, { method: 'DELETE' })
    if (r.ok) {
      toast.success('Removido')
      load()
    } else {
      toast.error('Erro ao remover')
    }
  }

  // --- Cargos ---
  const closeCargoForm = () => {
    setShowCargoForm(false)
    setEditingCargoId(null)
    setCargoForm({ ...EMPTY_CARGO })
  }

  const handleEditCargo = (c: Cargo) => {
    setEditingCargoId(c.id)
    setCargoForm({
      planoCargosId: c.planoCargosId || '',
      denominacao: c.denominacao,
      tipo: (c.tipo as (typeof TIPOS)[number]) || 'EFETIVO',
      quantidadeVagas: c.quantidadeVagas != null ? String(c.quantidadeVagas) : '',
      cargaHoraria: c.cargaHoraria != null ? String(c.cargaHoraria) : '',
      salarioBase: String(c.salarioBase),
      observacoes: c.observacoes || ''
    })
    setShowCargoForm(true)
  }

  const handleSaveCargo = async () => {
    if (!cargoForm.denominacao.trim()) {
      toast.error('Informe a denominacao do cargo')
      return
    }
    if (!cargoForm.salarioBase || Number(cargoForm.salarioBase) < 0) {
      toast.error('Informe o salario base')
      return
    }
    setSavingCargo(true)
    try {
      const url = editingCargoId ? `/api/cargos/${editingCargoId}` : '/api/cargos'
      const method = editingCargoId ? 'PUT' : 'POST'
      const payload = {
        planoCargosId: cargoForm.planoCargosId || null,
        denominacao: cargoForm.denominacao.trim(),
        tipo: cargoForm.tipo,
        quantidadeVagas: cargoForm.quantidadeVagas ? Number(cargoForm.quantidadeVagas) : null,
        cargaHoraria: cargoForm.cargaHoraria ? Number(cargoForm.cargaHoraria) : null,
        salarioBase: Number(cargoForm.salarioBase),
        observacoes: cargoForm.observacoes.trim() || null
      }
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (r.ok) {
        toast.success(editingCargoId ? 'Cargo atualizado' : 'Cargo criado')
        closeCargoForm()
        load()
      } else {
        const e = await r.json().catch(() => ({}))
        toast.error(e?.message || 'Erro ao salvar')
      }
    } finally {
      setSavingCargo(false)
    }
  }

  const handleDeleteCargo = async (id: string) => {
    if (!confirm('Remover este cargo?')) return
    const r = await fetch(`/api/cargos/${id}`, { method: 'DELETE' })
    if (r.ok) {
      toast.success('Removido')
      load()
    } else {
      toast.error('Erro ao remover')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Briefcase className="h-6 w-6" /> Plano de Cargos e Remuneracao
        </h1>
        <p className="text-sm text-muted-foreground">
          Planos de cargos vigentes e relacao de cargos com remuneracao base
        </p>
      </div>

      {/* === PLANOS DE CARGOS === */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" /> Planos de Cargos
          </CardTitle>
          <Button size="sm" onClick={() => setShowPlanoForm(true)} disabled={showPlanoForm}>
            <Plus className="h-4 w-4 mr-1" /> Novo Plano
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {showPlanoForm && (
            <div className="border rounded-md p-4 space-y-3 bg-gray-50/50">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">
                  {editingPlanoId ? 'Editar plano' : 'Novo plano'}
                </span>
                <Button size="icon" variant="ghost" onClick={closePlanoForm}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <Label>Nome *</Label>
                  <Input
                    value={planoForm.nome}
                    onChange={e => setPlanoForm({ ...planoForm, nome: e.target.value })}
                    placeholder="Ex.: Plano de Cargos, Carreiras e Salarios"
                  />
                </div>
                <div>
                  <Label>Lei</Label>
                  <Input
                    value={planoForm.lei}
                    onChange={e => setPlanoForm({ ...planoForm, lei: e.target.value })}
                    placeholder="Ex.: Lei 123/2024"
                  />
                </div>
                <div>
                  <Label>Ano *</Label>
                  <Input
                    type="number"
                    value={planoForm.ano}
                    onChange={e => setPlanoForm({ ...planoForm, ano: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <Label>Descricao</Label>
                <Textarea
                  rows={2}
                  value={planoForm.descricao}
                  onChange={e => setPlanoForm({ ...planoForm, descricao: e.target.value })}
                  placeholder="Opcional"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={planoForm.ativo}
                  onChange={e => setPlanoForm({ ...planoForm, ativo: e.target.checked })}
                />
                Plano vigente
              </label>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={closePlanoForm}>Cancelar</Button>
                <Button size="sm" onClick={handleSavePlano} disabled={savingPlano}>
                  {savingPlano ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                  {editingPlanoId ? 'Atualizar' : 'Salvar'}
                </Button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : planos.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm">
              Nenhum plano cadastrado.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-3 py-2">Nome</th>
                    <th className="px-3 py-2">Lei</th>
                    <th className="px-3 py-2">Ano</th>
                    <th className="px-3 py-2 text-center">Cargos</th>
                    <th className="px-3 py-2 text-center">Vigente</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {planos.map(p => (
                    <tr key={p.id} className="border-t">
                      <td className="px-3 py-2 font-medium">{p.nome}</td>
                      <td className="px-3 py-2 text-muted-foreground">{p.lei || '-'}</td>
                      <td className="px-3 py-2">{p.ano}</td>
                      <td className="px-3 py-2 text-center">{p._count?.cargos ?? 0}</td>
                      <td className="px-3 py-2 text-center">
                        {p.ativo ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">Sim</span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">Nao</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => handleEditPlano(p)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDeletePlano(p.id)}
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

      {/* === CARGOS === */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Briefcase className="h-4 w-4" /> Cargos
          </CardTitle>
          <Button size="sm" onClick={() => setShowCargoForm(true)} disabled={showCargoForm}>
            <Plus className="h-4 w-4 mr-1" /> Novo Cargo
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {showCargoForm && (
            <div className="border rounded-md p-4 space-y-3 bg-gray-50/50">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">
                  {editingCargoId ? 'Editar cargo' : 'Novo cargo'}
                </span>
                <Button size="icon" variant="ghost" onClick={closeCargoForm}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Denominacao *</Label>
                  <Input
                    value={cargoForm.denominacao}
                    onChange={e => setCargoForm({ ...cargoForm, denominacao: e.target.value })}
                    placeholder="Ex.: Assessor Legislativo"
                  />
                </div>
                <div>
                  <Label>Plano de Cargos</Label>
                  <select
                    className="w-full mt-1.5 px-3 py-2 border rounded-md text-sm"
                    value={cargoForm.planoCargosId}
                    onChange={e => setCargoForm({ ...cargoForm, planoCargosId: e.target.value })}
                  >
                    <option value="">— Sem plano vinculado —</option>
                    {planos.map(p => (
                      <option key={p.id} value={p.id}>{p.nome} ({p.ano})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <Label>Tipo</Label>
                  <select
                    className="w-full mt-1.5 px-3 py-2 border rounded-md text-sm"
                    value={cargoForm.tipo}
                    onChange={e => setCargoForm({ ...cargoForm, tipo: e.target.value as typeof cargoForm.tipo })}
                  >
                    {TIPOS.map(t => (
                      <option key={t} value={t}>{tipoLabels[t]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Salario Base (R$) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={cargoForm.salarioBase}
                    onChange={e => setCargoForm({ ...cargoForm, salarioBase: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Vagas</Label>
                  <Input
                    type="number"
                    value={cargoForm.quantidadeVagas}
                    onChange={e => setCargoForm({ ...cargoForm, quantidadeVagas: e.target.value })}
                    placeholder="Opcional"
                  />
                </div>
                <div>
                  <Label>Carga Horaria (h/sem)</Label>
                  <Input
                    type="number"
                    value={cargoForm.cargaHoraria}
                    onChange={e => setCargoForm({ ...cargoForm, cargaHoraria: e.target.value })}
                    placeholder="Opcional"
                  />
                </div>
              </div>
              <div>
                <Label>Observacoes</Label>
                <Textarea
                  rows={2}
                  value={cargoForm.observacoes}
                  onChange={e => setCargoForm({ ...cargoForm, observacoes: e.target.value })}
                  placeholder="Opcional"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={closeCargoForm}>Cancelar</Button>
                <Button size="sm" onClick={handleSaveCargo} disabled={savingCargo}>
                  {savingCargo ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                  {editingCargoId ? 'Atualizar' : 'Salvar'}
                </Button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : cargos.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm">
              Nenhum cargo cadastrado.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-3 py-2">Denominacao</th>
                    <th className="px-3 py-2">Tipo</th>
                    <th className="px-3 py-2">Plano</th>
                    <th className="px-3 py-2 text-center">Vagas</th>
                    <th className="px-3 py-2 text-right">Salario Base</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {cargos.map(c => (
                    <tr key={c.id} className="border-t">
                      <td className="px-3 py-2 font-medium">{c.denominacao}</td>
                      <td className="px-3 py-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">
                          {tipoLabels[c.tipo] || c.tipo}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {c.planoCargos?.nome || '-'}
                      </td>
                      <td className="px-3 py-2 text-center">{c.quantidadeVagas ?? '-'}</td>
                      <td className="px-3 py-2 text-right">
                        {Number(c.salarioBase).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => handleEditCargo(c)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDeleteCargo(c.id)}
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
