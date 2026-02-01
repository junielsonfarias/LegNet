'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, MapPin, FileText, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { DeadlineIndicator } from './DeadlineIndicator'

interface ProposicaoPendente {
  id: string
  tipo: string
  numero: string
  ano: number
  ementa: string | null
  autorNome: string | null
  prazoStatus: 'ok' | 'warning' | 'expired'
}

interface MeetingDefaults {
  numero: number
  ano: number
  data: string
  horaInicio: string
  local: string
  tipo: 'ORDINARIA' | 'EXTRAORDINARIA' | 'ESPECIAL'
  quorumMinimo: number
}

interface QuickMeetingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  comissaoId: string
  comissaoNome: string
  onSuccess?: (reuniaoId: string) => void
}

export function QuickMeetingDialog({
  open,
  onOpenChange,
  comissaoId,
  comissaoNome,
  onSuccess
}: QuickMeetingDialogProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [loadingDefaults, setLoadingDefaults] = useState(true)

  // Dados do formulario
  const [formData, setFormData] = useState<MeetingDefaults>({
    numero: 1,
    ano: new Date().getFullYear(),
    data: '',
    horaInicio: '14:00',
    local: 'Sala das Comissoes',
    tipo: 'ORDINARIA',
    quorumMinimo: 2
  })

  // Proposicoes para a pauta
  const [proposicoesPendentes, setProposicoesPendentes] = useState<ProposicaoPendente[]>([])
  const [itensSelecionados, setItensSelecionados] = useState<string[]>([])

  // Carregar defaults quando abrir o dialog
  useEffect(() => {
    if (open) {
      carregarDefaults()
    } else {
      // Reset ao fechar
      setStep(1)
      setItensSelecionados([])
    }
    // carregarDefaults é definida no mesmo escopo e estável para estes deps
  }, [open, comissaoId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function carregarDefaults() {
    try {
      setLoadingDefaults(true)

      // Carregar defaults e proposicoes pendentes em paralelo
      const [defaultsRes, dashboardRes] = await Promise.all([
        fetch(`/api/comissoes/${comissaoId}/meeting-defaults`).catch(() => null),
        fetch(`/api/comissoes/${comissaoId}/dashboard`)
      ])

      // Usar dados do dashboard como fallback para proposicoes
      if (dashboardRes.ok) {
        const dashboardData = await dashboardRes.json()
        if (dashboardData.success) {
          setProposicoesPendentes(
            dashboardData.data.proposicoesPendentes.map((p: any) => ({
              id: p.id,
              tipo: p.tipo,
              numero: p.numero,
              ano: p.ano,
              ementa: p.ementa,
              autorNome: p.autorNome,
              prazoStatus: p.prazo.status
            }))
          )
        }
      }

      // Tentar usar defaults da API, senao usar valores padrao
      if (defaultsRes?.ok) {
        const defaultsData = await defaultsRes.json()
        if (defaultsData.success) {
          setFormData(defaultsData.data)
        }
      } else {
        // Calcular defaults basicos
        const hoje = new Date()
        const proximaSemana = new Date(hoje)
        proximaSemana.setDate(hoje.getDate() + 7)
        // Ajustar para dia util
        if (proximaSemana.getDay() === 0) proximaSemana.setDate(proximaSemana.getDate() + 1)
        if (proximaSemana.getDay() === 6) proximaSemana.setDate(proximaSemana.getDate() + 2)

        setFormData(prev => ({
          ...prev,
          data: proximaSemana.toISOString().split('T')[0]
        }))
      }
    } catch (error) {
      console.error('Erro ao carregar defaults:', error)
    } finally {
      setLoadingDefaults(false)
    }
  }

  function toggleItem(id: string) {
    setItensSelecionados(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    )
  }

  function selecionarTodos() {
    if (itensSelecionados.length === proposicoesPendentes.length) {
      setItensSelecionados([])
    } else {
      setItensSelecionados(proposicoesPendentes.map(p => p.id))
    }
  }

  async function handleSubmit() {
    if (!formData.data) {
      toast.error('Informe a data da reuniao')
      return
    }

    try {
      setLoading(true)

      // Criar reuniao
      const response = await fetch('/api/reunioes-comissao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comissaoId,
          tipo: formData.tipo,
          data: formData.data,
          horaInicio: formData.data + 'T' + formData.horaInicio + ':00',
          local: formData.local,
          quorumMinimo: formData.quorumMinimo
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar reuniao')
      }

      const reuniaoId = result.data.id

      // Se houver itens selecionados, adicionar a pauta em lote
      if (itensSelecionados.length > 0) {
        await fetch(`/api/reunioes-comissao/${reuniaoId}/pauta/bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            proposicaoIds: itensSelecionados
          })
        })
      }

      toast.success('Reuniao criada com sucesso!')
      onOpenChange(false)
      onSuccess?.(reuniaoId)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar reuniao')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Nova Reuniao - {comissaoNome}
          </DialogTitle>
          <DialogDescription>
            {step === 1 ? 'Defina data, hora e local da reuniao' : 'Selecione itens para a pauta'}
          </DialogDescription>
        </DialogHeader>

        {/* Indicador de passos */}
        <div className="flex items-center justify-center gap-2 py-2">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${step === 1 ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}`}>
            <span className="w-5 h-5 rounded-full bg-current text-white flex items-center justify-center text-xs">1</span>
            Dados
          </div>
          <ArrowRight className="h-4 w-4 text-gray-300" />
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${step === 2 ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}`}>
            <span className="w-5 h-5 rounded-full bg-current text-white flex items-center justify-center text-xs">2</span>
            Pauta
          </div>
        </div>

        {loadingDefaults ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : step === 1 ? (
          /* Passo 1: Dados basicos */
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data" className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Data
                </Label>
                <Input
                  id="data"
                  type="date"
                  value={formData.data}
                  onChange={e => setFormData(prev => ({ ...prev, data: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hora" className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Horario
                </Label>
                <Input
                  id="hora"
                  type="time"
                  value={formData.horaInicio}
                  onChange={e => setFormData(prev => ({ ...prev, horaInicio: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="local" className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                Local
              </Label>
              <Input
                id="local"
                value={formData.local}
                onChange={e => setFormData(prev => ({ ...prev, local: e.target.value }))}
                placeholder="Local da reuniao"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value: 'ORDINARIA' | 'EXTRAORDINARIA' | 'ESPECIAL') =>
                    setFormData(prev => ({ ...prev, tipo: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ORDINARIA">Ordinaria</SelectItem>
                    <SelectItem value="EXTRAORDINARIA">Extraordinaria</SelectItem>
                    <SelectItem value="ESPECIAL">Especial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quorum Minimo</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.quorumMinimo}
                  onChange={e => setFormData(prev => ({ ...prev, quorumMinimo: parseInt(e.target.value) || 2 }))}
                />
              </div>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg text-sm">
              <p className="text-blue-700">
                <strong>{formData.numero}ª Reunião {formData.tipo}</strong> de {formData.ano}
              </p>
            </div>
          </div>
        ) : (
          /* Passo 2: Selecao de itens para pauta */
          <div className="space-y-4 py-4">
            {proposicoesPendentes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma proposicao pendente de analise</p>
                <p className="text-sm">Voce pode adicionar itens manualmente depois</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    {proposicoesPendentes.length} proposicao(oes) pendente(s)
                  </p>
                  <Button variant="ghost" size="sm" onClick={selecionarTodos}>
                    {itensSelecionados.length === proposicoesPendentes.length
                      ? 'Desmarcar todos'
                      : 'Selecionar todos'}
                  </Button>
                </div>

                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                  {proposicoesPendentes.map(prop => (
                    <div
                      key={prop.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        itensSelecionados.includes(prop.id)
                          ? 'bg-blue-50 border-blue-200'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => toggleItem(prop.id)}
                    >
                      <Checkbox
                        checked={itensSelecionados.includes(prop.id)}
                        onCheckedChange={() => toggleItem(prop.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {prop.tipo} {prop.numero}/{prop.ano}
                          </span>
                          <DeadlineIndicator
                            dias={0}
                            status={prop.prazoStatus}
                            size="sm"
                            showIcon={false}
                          />
                        </div>
                        {prop.ementa && (
                          <p className="text-sm text-gray-600 truncate">
                            {prop.ementa}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {itensSelecionados.length > 0 && (
                  <div className="p-3 bg-green-50 rounded-lg text-sm text-green-700">
                    {itensSelecionados.length} item(ns) serao adicionados a pauta
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <DialogFooter className="flex justify-between">
          <div>
            {step === 2 && (
              <Button variant="ghost" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Voltar
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            {step === 1 ? (
              <Button onClick={() => setStep(2)}>
                Proximo
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4 mr-2" />
                    Criar Reuniao
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
