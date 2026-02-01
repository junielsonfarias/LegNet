'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import {
  Workflow,
  Zap,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  Building2,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'

import {
  useTramitacaoRegras
} from '@/lib/hooks/use-tramitacoes'
import type { TramitacaoRegraPayload } from '@/lib/api/tramitacoes-api'

interface TipoTramitacao {
  id: string
  nome: string
}

interface TipoOrgao {
  id: string
  nome: string
}

interface RegraFormState {
  nome: string
  descricao: string
  condicoesText: string
  acoesText: string
  excecoesText: string
  ativo: boolean
  ordem: number
}

interface EtapaFormState {
  id?: string
  nome: string
  descricao: string
  ordem: number
  tipoTramitacaoId?: string
  unidadeId?: string
  prazoDias?: number | null
}

const defaultRegraForm: RegraFormState = {
  nome: '',
  descricao: '',
  condicoesText: JSON.stringify({}, null, 2),
  acoesText: JSON.stringify({
    proximaUnidade: '',
    tipoTramitacao: '',
    notificacoes: [],
    alertas: []
  }, null, 2),
  excecoesText: '',
  ativo: true,
  ordem: 0
}

const defaultEtapaForm: EtapaFormState = {
  nome: '',
  descricao: '',
  ordem: 0,
  tipoTramitacaoId: undefined,
  unidadeId: undefined,
  prazoDias: null
}

const parseJsonField = (value: string, fieldLabel: string) => {
  if (!value || value.trim() === '') return undefined
  try {
    return JSON.parse(value)
  } catch (error) {
    console.error(`Erro ao parsear JSON no campo "${fieldLabel}":`, error)
    throw new Error(`JSON inválido em "${fieldLabel}"`)
  }
}

const stringify = (value: unknown, fallback = '{}') => {
  try {
    if (value === undefined || value === null) return fallback
    return JSON.stringify(value, null, 2)
  } catch (error) {
    console.error('Erro ao serializar valor JSON:', error)
    return fallback
  }
}

export default function TramitationRulesPage() {
  const {
    regras,
    loading,
    error,
    create,
    update,
    remove,
    refetch
  } = useTramitacaoRegras()

  const [tiposTramitacao, setTiposTramitacao] = useState<TipoTramitacao[]>([])
  const [unidades, setUnidades] = useState<TipoOrgao[]>([])

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<RegraFormState>(defaultRegraForm)
  const [etapas, setEtapas] = useState<EtapaFormState[]>([])
  const [etapaEditingIndex, setEtapaEditingIndex] = useState<number | null>(null)
  const [etapaForm, setEtapaForm] = useState<EtapaFormState>(defaultEtapaForm)

  useEffect(() => {
    async function loadAuxiliaryData() {
      try {
        const [tiposRes, unidadesRes] = await Promise.all([
          fetch('/api/configuracoes/tipos-tramitacao?ativo=true'),
          fetch('/api/configuracoes/unidades-tramitacao?ativo=true')
        ])

        if (tiposRes.ok) {
          const data = await tiposRes.json()
          setTiposTramitacao(data.data ?? [])
        }

        if (unidadesRes.ok) {
          const data = await unidadesRes.json()
          setUnidades(data.data ?? [])
        }
      } catch (err) {
        console.error('Erro ao carregar dados auxiliares', err)
        toast.error('Não foi possível carregar dados auxiliares')
      }
    }
    loadAuxiliaryData()
  }, [])

  useEffect(() => {
    if (error) {
      toast.error(error)
    }
  }, [error])

  const tipoNome = useMemo(() => {
    const map = new Map<string, string>()
    tiposTramitacao.forEach(tipo => map.set(tipo.id, tipo.nome))
    return map
  }, [tiposTramitacao])

  const unidadeNome = useMemo(() => {
    const map = new Map<string, string>()
    unidades.forEach(unidade => map.set(unidade.id, unidade.nome))
    return map
  }, [unidades])

  const openCreateModal = () => {
    setEditingId(null)
    setForm(defaultRegraForm)
    setEtapas([])
    setModalOpen(true)
  }

  const openEditModal = (regraId: string) => {
    const regra = regras.find(item => item.id === regraId)
    if (!regra) return

    setEditingId(regra.id)
    setForm({
      nome: regra.nome,
      descricao: regra.descricao ?? '',
      condicoesText: stringify(regra.condicoes),
      acoesText: stringify(regra.acoes),
      excecoesText: stringify(regra.excecoes ?? {}, ''),
      ativo: regra.ativo,
      ordem: regra.ordem ?? 0
    })
    setEtapas((regra.etapas ?? []).map(etapa => ({
      id: etapa.id,
      nome: etapa.nome,
      descricao: etapa.descricao ?? '',
      ordem: etapa.ordem ?? 0,
      tipoTramitacaoId: etapa.tipoTramitacaoId ?? undefined,
      unidadeId: etapa.unidadeId ?? undefined,
      prazoDias: etapa.prazoDias ?? null
    })))
    setModalOpen(true)
  }

  const handleEtapaSave = () => {
    if (!etapaForm.nome) {
      toast.error('Informe o nome da etapa')
      return
    }

    const updatedEtapas = [...etapas]
    if (etapaEditingIndex !== null) {
      updatedEtapas[etapaEditingIndex] = etapaForm
    } else {
      updatedEtapas.push(etapaForm)
    }

    setEtapas(updatedEtapas.sort((a, b) => a.ordem - b.ordem))
    setEtapaForm(defaultEtapaForm)
    setEtapaEditingIndex(null)
  }

  const handleEtapaEdit = (index: number) => {
    setEtapaEditingIndex(index)
    setEtapaForm(etapas[index])
  }

  const handleEtapaRemove = (index: number) => {
    setEtapas(prev => prev.filter((_, idx) => idx !== index))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    let condicoes: Record<string, unknown>
    let acoes: Record<string, unknown>
    let excecoes: Record<string, unknown> | undefined

    try {
      condicoes = parseJsonField(form.condicoesText, 'Condições') || {}
      acoes = parseJsonField(form.acoesText, 'Ações') || {}
      excecoes = parseJsonField(form.excecoesText, 'Exceções') as Record<string, unknown> | undefined
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'JSON inválido fornecido')
      return
    }

    const payload: TramitacaoRegraPayload = {
      nome: form.nome,
      descricao: form.descricao || undefined,
      condicoes,
      acoes,
      excecoes,
      ativo: form.ativo,
      ordem: form.ordem,
      etapas: etapas.map(etapa => ({
        id: etapa.id,
        ordem: etapa.ordem,
        nome: etapa.nome,
        descricao: etapa.descricao || undefined,
        tipoTramitacaoId: etapa.tipoTramitacaoId || undefined,
        unidadeId: etapa.unidadeId || undefined,
        notificacoes: undefined,
        alertas: undefined,
        prazoDias: etapa.prazoDias ?? undefined
      }))
    }

    let result: any = null
    if (editingId) {
      result = await update(editingId, payload)
    } else {
      result = await create(payload)
    }

    if (result) {
      toast.success(`Regra ${editingId ? 'atualizada' : 'criada'} com sucesso`)
      setModalOpen(false)
      setEditingId(null)
      setForm(defaultRegraForm)
      setEtapas([])
      setEtapaForm(defaultEtapaForm)
      setEtapaEditingIndex(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja remover esta regra de tramitação?')) return
    const success = await remove(id)
    if (success) {
      toast.success('Regra removida')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Workflow className="h-8 w-8 text-camara-primary" />
            Regras automatizadas de tramitação
          </h1>
          <p className="text-gray-600 mt-1">
            Configure regras para automatizar o fluxo de tramitação das proposições.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refetch}>
            <Zap className="mr-2 h-4 w-4" />
            Recarregar
          </Button>
          <Button onClick={openCreateModal}>
            <Plus className="mr-2 h-4 w-4" />
            Nova regra
          </Button>
        </div>
      </div>

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="animate-pulse h-24 bg-gray-100 rounded-lg" />
          ))}
        </div>
      )}

      {!loading && regras.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-gray-600">
            Nenhuma regra configurada até o momento.
          </CardContent>
        </Card>
      )}

      {!loading && regras.length > 0 && (
        <div className="grid gap-4">
          {regras.map(regra => (
            <Card key={regra.id}>
              <CardHeader className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    {regra.nome}
                    {regra.ativo ? (
                      <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                        Ativa
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-600 border-gray-200">
                        Inativa
                      </Badge>
                    )}
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    {regra.descricao || 'Sem descrição informada.'}
                  </p>
                  <div className="text-xs text-gray-500">
                    Ordem de execução: {regra.ordem ?? 0}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEditModal(regra.id)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(regra.id)}>
                    <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                    Remover
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 text-sm text-gray-700">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Play className="h-4 w-4 text-camara-primary" />
                      Condições
                    </h4>
                    <pre className="bg-gray-50 border border-gray-100 rounded-md p-3 whitespace-pre-wrap break-all text-xs">
                      {stringify(regra.condicoes)}
                    </pre>
                  </div>
                  <div className="space-y-2 text-sm text-gray-700">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Pause className="h-4 w-4 text-camara-primary" />
                      Ações
                    </h4>
                    <pre className="bg-gray-50 border border-gray-100 rounded-md p-3 whitespace-pre-wrap break-all text-xs">
                      {stringify(regra.acoes)}
                    </pre>
                  </div>
                </div>
                {regra.excecoes && (
                  <div className="space-y-2 text-sm text-gray-700">
                    <h4 className="font-semibold flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-camara-primary" />
                      Exceções
                    </h4>
                    <pre className="bg-gray-50 border border-gray-100 rounded-md p-3 whitespace-pre-wrap break-all text-xs">
                      {stringify(regra.excecoes)}
                    </pre>
                  </div>
                )}
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-camara-primary" />
                    Etapas ({regra.etapas?.length ?? 0})
                  </h4>
                  {regra.etapas && regra.etapas.length > 0 ? (
                    <div className="space-y-2">
                      {regra.etapas
                        .slice()
                        .sort((a, b) => a.ordem - b.ordem)
                        .map(etapa => (
                          <div key={etapa.id} className="border border-gray-200 rounded-md p-3 text-sm text-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                            <div className="space-y-1">
                              <div className="font-semibold text-gray-900">
                                {etapa.ordem + 1}. {etapa.nome}
                              </div>
                              {etapa.descricao && <div>{etapa.descricao}</div>}
                              <div className="text-xs text-gray-500 space-x-3">
                                {etapa.tipoTramitacaoId && (
                                  <span>Tipo: {tipoNome.get(etapa.tipoTramitacaoId) ?? etapa.tipoTramitacaoId}</span>
                                )}
                                {etapa.unidadeId && (
                                  <span>Unidade: {unidadeNome.get(etapa.unidadeId) ?? etapa.unidadeId}</span>
                                )}
                                {etapa.prazoDias !== undefined && etapa.prazoDias !== null && (
                                  <span>Prazo: {etapa.prazoDias} dia(s)</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">Nenhuma etapa definida.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Editar regra de tramitação' : 'Nova regra de tramitação'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={form.nome}
                  onChange={(event) => setForm(prev => ({ ...prev, nome: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Ordem de execução</Label>
                <Input
                  type="number"
                  value={form.ordem}
                  onChange={(event) => setForm(prev => ({ ...prev, ordem: Number.parseInt(event.target.value) || 0 }))}
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.ativo ? 'true' : 'false'}
                  onValueChange={(value) => setForm(prev => ({ ...prev, ativo: value === 'true' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Ativa</SelectItem>
                    <SelectItem value="false">Inativa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={form.descricao}
                onChange={(event) => setForm(prev => ({ ...prev, descricao: event.target.value }))}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Condições (JSON)</Label>
                <Textarea
                  value={form.condicoesText}
                  onChange={(event) => setForm(prev => ({ ...prev, condicoesText: event.target.value }))}
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label>Ações (JSON)</Label>
                <Textarea
                  value={form.acoesText}
                  onChange={(event) => setForm(prev => ({ ...prev, acoesText: event.target.value }))}
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Exceções (JSON opcional)</Label>
              <Textarea
                value={form.excecoesText}
                onChange={(event) => setForm(prev => ({ ...prev, excecoesText: event.target.value }))}
                rows={4}
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Etapas ({etapas.length})
                  </h3>
                  <p className="text-sm text-gray-600">
                    Defina as etapas executadas quando a regra for acionada.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEtapaForm(defaultEtapaForm)
                    setEtapaEditingIndex(null)
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nova etapa
                </Button>
              </div>

              <div className="border rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Nome da etapa</Label>
                    <Input
                      value={etapaForm.nome}
                      onChange={(event) => setEtapaForm(prev => ({ ...prev, nome: event.target.value }))}
                      placeholder="Ex: Enviar para Comissão"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ordem</Label>
                    <Input
                      type="number"
                      min={0}
                      value={etapaForm.ordem}
                      onChange={(event) => setEtapaForm(prev => ({ ...prev, ordem: Number.parseInt(event.target.value) || 0 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de tramitação (opcional)</Label>
                    <select
                      className="w-full rounded-md border border-gray-200 p-2 text-sm"
                      value={etapaForm.tipoTramitacaoId ?? ''}
                      onChange={(event) => setEtapaForm(prev => ({ ...prev, tipoTramitacaoId: event.target.value || undefined }))}
                    >
                      <option value="">Sem alteração</option>
                      {tiposTramitacao.map(tipo => (
                        <option key={tipo.id} value={tipo.id}>
                          {tipo.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Unidade (opcional)</Label>
                    <select
                      className="w-full rounded-md border border-gray-200 p-2 text-sm"
                      value={etapaForm.unidadeId ?? ''}
                      onChange={(event) => setEtapaForm(prev => ({ ...prev, unidadeId: event.target.value || undefined }))}
                    >
                      <option value="">Sem alteração</option>
                      {unidades.map(unidade => (
                        <option key={unidade.id} value={unidade.id}>
                          {unidade.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Prazo (dias, opcional)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={etapaForm.prazoDias ?? ''}
                      onChange={(event) => setEtapaForm(prev => ({
                        ...prev,
                        prazoDias: event.target.value ? Number.parseInt(event.target.value) : null
                      }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    rows={3}
                    value={etapaForm.descricao}
                    onChange={(event) => setEtapaForm(prev => ({ ...prev, descricao: event.target.value }))}
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  {etapaEditingIndex !== null && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEtapaEditingIndex(null)
                        setEtapaForm(defaultEtapaForm)
                      }}
                    >
                      Cancelar
                    </Button>
                  )}
                  <Button
                    type="button"
                    onClick={handleEtapaSave}
                  >
                    {etapaEditingIndex !== null ? 'Atualizar etapa' : 'Adicionar etapa'}
                  </Button>
                </div>
              </div>

              {etapas.length > 0 && (
                <div className="space-y-2">
                  {etapas
                    .slice()
                    .sort((a, b) => a.ordem - b.ordem)
                    .map((etapa, index) => (
                      <div key={`${etapa.nome}-${index}`} className="border border-gray-200 rounded-md p-3 text-sm text-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div>
                          <div className="font-semibold text-gray-900">
                            {etapa.ordem + 1}. {etapa.nome}
                          </div>
                          <div className="text-xs text-gray-500 flex flex-wrap gap-3">
                            {etapa.tipoTramitacaoId && <span>Tipo: {tipoNome.get(etapa.tipoTramitacaoId) ?? etapa.tipoTramitacaoId}</span>}
                            {etapa.unidadeId && <span>Unidade: {unidadeNome.get(etapa.unidadeId) ?? etapa.unidadeId}</span>}
                            {etapa.prazoDias !== undefined && etapa.prazoDias !== null && <span>Prazo: {etapa.prazoDias} dia(s)</span>}
                          </div>
                          {etapa.descricao && <div className="mt-1 text-xs text-gray-600">{etapa.descricao}</div>}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleEtapaEdit(index)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleEtapaRemove(index)}
                          >
                            <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                            Remover
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingId ? 'Atualizar regra' : 'Salvar regra'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}


