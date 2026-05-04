'use client'

import { useState } from 'react'
import { Plus, Loader2, Save, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'

interface Props {
  sessaoId: string
  onCreated?: () => void
}

const TIPOS_PROPOSICAO = [
  { codigo: 'PROJETO_LEI', label: 'Projeto de Lei (PL)' },
  { codigo: 'PROJETO_RESOLUCAO', label: 'Projeto de Resolução (PR)' },
  { codigo: 'PROJETO_DECRETO', label: 'Projeto de Decreto Legislativo (PDL)' },
  { codigo: 'INDICACAO', label: 'Indicação (IND)' },
  { codigo: 'REQUERIMENTO', label: 'Requerimento (REQ)' },
  { codigo: 'MOCAO', label: 'Moção (MOC)' },
  { codigo: 'VOTO_PESAR', label: 'Voto de Pesar' },
  { codigo: 'VOTO_APLAUSO', label: 'Voto de Aplauso' }
]

const RESULTADOS = [
  { value: 'APROVADA', label: 'Aprovada', cor: 'text-green-700' },
  { value: 'REJEITADA', label: 'Rejeitada', cor: 'text-red-700' },
  { value: 'ADIADA', label: 'Adiada', cor: 'text-orange-700' },
  { value: 'RETIRADA', label: 'Retirada', cor: 'text-purple-700' },
  { value: 'LEITURA', label: 'Apenas leitura', cor: 'text-blue-700' }
] as const

type Resultado = (typeof RESULTADOS)[number]['value']

export function ProposicaoRetroativaModal({ sessaoId, onCreated }: Props) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    tipo: 'PROJETO_LEI',
    numero: '',
    ano: new Date().getFullYear(),
    titulo: '',
    ementa: '',
    resultado: 'APROVADA' as Resultado,
    motivo: ''
  })

  const reset = () => {
    setForm({
      tipo: 'PROJETO_LEI',
      numero: '',
      ano: new Date().getFullYear(),
      titulo: '',
      ementa: '',
      resultado: 'APROVADA',
      motivo: ''
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.numero.trim() || !form.titulo.trim() || !form.ementa.trim() || !form.motivo.trim()) {
      toast.error('Preencha tipo, número, título, ementa e motivo.')
      return
    }
    setSubmitting(true)
    try {
      const response = await fetch(`/api/sessoes/${sessaoId}/proposicao-retroativa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: form.tipo,
          numero: form.numero.trim(),
          ano: Number(form.ano),
          titulo: form.titulo.trim(),
          ementa: form.ementa.trim(),
          resultado: form.resultado,
          motivo: form.motivo.trim()
        })
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao registrar proposição retroativa')
      }
      toast.success(data.message || 'Proposição retroativa registrada')
      setOpen(false)
      reset()
      onCreated?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao registrar proposição retroativa')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset() }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-amber-300 text-amber-800 hover:bg-amber-50">
          <Plus className="h-4 w-4 mr-1" />
          Adicionar proposição já votada
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Proposição já votada (entrada retroativa)</DialogTitle>
          <DialogDescription>
            Registre uma proposição que já foi votada nesta sessão concluída. O resultado é
            informado diretamente, sem passar por validações regimentais (CLJ, prazos, etc).
          </DialogDescription>
        </DialogHeader>

        <div className="border border-amber-300 bg-amber-50 rounded-md p-3 flex items-start gap-2 text-sm text-amber-900">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <p>
            Esta operação registra dados pretéritos. A proposição será marcada com badge{' '}
            <strong>RETROATIVA</strong> em todas as exibições. O motivo é obrigatório e fica registrado em auditoria.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-1">
              <Label htmlFor="tipo">Tipo *</Label>
              <select
                id="tipo"
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
              >
                {TIPOS_PROPOSICAO.map((t) => (
                  <option key={t.codigo} value={t.codigo}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="numero">Número *</Label>
              <Input
                id="numero"
                value={form.numero}
                onChange={(e) => setForm({ ...form, numero: e.target.value })}
                placeholder="Ex: 0042"
                required
              />
            </div>
            <div>
              <Label htmlFor="ano">Ano *</Label>
              <Input
                id="ano"
                type="number"
                min="1900"
                max="2100"
                value={form.ano}
                onChange={(e) => setForm({ ...form, ano: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              placeholder="Título resumido da proposição"
              required
            />
          </div>

          <div>
            <Label htmlFor="ementa">Ementa *</Label>
            <Textarea
              id="ementa"
              rows={3}
              value={form.ementa}
              onChange={(e) => setForm({ ...form, ementa: e.target.value })}
              placeholder='Ementa completa: "Dispõe sobre..."'
              required
            />
          </div>

          <div>
            <Label htmlFor="resultado">Resultado *</Label>
            <select
              id="resultado"
              value={form.resultado}
              onChange={(e) => setForm({ ...form, resultado: e.target.value as Resultado })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              required
            >
              {RESULTADOS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Para registrar votos individuais por parlamentar, use a tela &quot;Lançamento Retroativo&quot;
              após criar a proposição.
            </p>
          </div>

          <div>
            <Label htmlFor="motivo">Motivo / origem do registro retroativo *</Label>
            <Textarea
              id="motivo"
              rows={2}
              value={form.motivo}
              onChange={(e) => setForm({ ...form, motivo: e.target.value })}
              placeholder='Ex: "Importação do sistema antigo CR2 — Lote 2024-001"'
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Obrigatório para auditoria (RN-003). Fica registrado e visível em consultas.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Registrando...</>
              ) : (
                <><Save className="h-4 w-4 mr-2" />Registrar proposição retroativa</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
