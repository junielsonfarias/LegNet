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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { FileText, User, Wand2, Loader2, AlertCircle, Check } from 'lucide-react'
import { toast } from 'sonner'
import {
  gerarTextoParecer,
  getTiposParecer,
  type TipoParecer
} from '@/lib/services/parecer-template-service'

interface Proposicao {
  id: string
  tipo: string
  numero: string
  ano: number
  ementa: string | null
  autorNome?: string | null
}

interface Membro {
  id: string
  cargo: string
  parlamentarId: string
  nome: string
}

interface QuickParecerFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  comissaoId: string
  comissaoNome: string
  comissaoSigla?: string
  membros: Membro[]
  proposicao?: Proposicao | null
  onSuccess?: (parecerId: string) => void
}

export function QuickParecerForm({
  open,
  onOpenChange,
  comissaoId,
  comissaoNome,
  comissaoSigla,
  membros,
  proposicao: proposicaoInicial,
  onSuccess
}: QuickParecerFormProps) {
  const [loading, setLoading] = useState(false)
  const [loadingProposicoes, setLoadingProposicoes] = useState(false)
  const [proposicoes, setProposicoes] = useState<Proposicao[]>([])

  const [formData, setFormData] = useState({
    proposicaoId: proposicaoInicial?.id || '',
    relatorId: '',
    tipo: 'FAVORAVEL' as TipoParecer,
    texto: ''
  })

  const tiposParecer = getTiposParecer()

  // Carregar proposicoes pendentes se nao houver proposicao inicial
  useEffect(() => {
    if (open && !proposicaoInicial) {
      carregarProposicoes()
    }

    if (open && proposicaoInicial) {
      setFormData(prev => ({ ...prev, proposicaoId: proposicaoInicial.id }))
    }
    // carregarProposicoes é definida no mesmo escopo e estável para estes deps
  }, [open, proposicaoInicial, comissaoId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Selecionar relator automaticamente se houver apenas um com cargo RELATOR
  useEffect(() => {
    if (open && membros.length > 0 && !formData.relatorId) {
      const relator = membros.find(m => m.cargo === 'RELATOR')
      if (relator) {
        setFormData(prev => ({ ...prev, relatorId: relator.parlamentarId }))
      }
    }
  }, [open, membros, formData.relatorId])

  async function carregarProposicoes() {
    try {
      setLoadingProposicoes(true)
      const response = await fetch(`/api/comissoes/${comissaoId}/dashboard`)
      const result = await response.json()

      if (result.success && result.data.proposicoesPendentes) {
        setProposicoes(result.data.proposicoesPendentes.map((p: any) => ({
          id: p.id,
          tipo: p.tipo,
          numero: p.numero,
          ano: p.ano,
          ementa: p.ementa,
          autorNome: p.autorNome
        })))
      }
    } catch (error) {
      console.error('Erro ao carregar proposicoes:', error)
    } finally {
      setLoadingProposicoes(false)
    }
  }

  function gerarTextoAutomatico() {
    const prop = proposicaoInicial || proposicoes.find(p => p.id === formData.proposicaoId)
    const relator = membros.find(m => m.parlamentarId === formData.relatorId)

    if (!prop) {
      toast.error('Selecione uma proposicao primeiro')
      return
    }

    if (!relator) {
      toast.error('Selecione o relator primeiro')
      return
    }

    const texto = gerarTextoParecer(
      formData.tipo,
      {
        tipo: prop.tipo,
        numero: prop.numero,
        ano: prop.ano,
        ementa: prop.ementa || undefined,
        autorNome: prop.autorNome || undefined
      },
      {
        nome: relator.nome,
        cargo: relator.cargo === 'RELATOR' ? 'Relator' : 'Membro'
      },
      {
        nome: comissaoNome,
        sigla: comissaoSigla
      }
    )

    setFormData(prev => ({ ...prev, texto }))
    toast.success('Texto gerado com sucesso!')
  }

  async function handleSubmit() {
    if (!formData.proposicaoId) {
      toast.error('Selecione uma proposicao')
      return
    }

    if (!formData.relatorId) {
      toast.error('Selecione o relator')
      return
    }

    if (!formData.texto.trim()) {
      toast.error('O parecer deve ter um texto')
      return
    }

    try {
      setLoading(true)

      const response = await fetch('/api/pareceres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comissaoId,
          proposicaoId: formData.proposicaoId,
          relatorId: formData.relatorId,
          tipo: formData.tipo,
          texto: formData.texto,
          status: 'RASCUNHO'
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar parecer')
      }

      toast.success('Parecer criado com sucesso!')
      onOpenChange(false)
      onSuccess?.(result.data.id)

      // Reset form
      setFormData({
        proposicaoId: '',
        relatorId: '',
        tipo: 'FAVORAVEL',
        texto: ''
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar parecer')
    } finally {
      setLoading(false)
    }
  }

  const proposicaoSelecionada = proposicaoInicial || proposicoes.find(p => p.id === formData.proposicaoId)
  const relatorSelecionado = membros.find(m => m.parlamentarId === formData.relatorId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Novo Parecer
          </DialogTitle>
          <DialogDescription>
            {comissaoSigla ? `${comissaoSigla} - ` : ''}{comissaoNome}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Proposicao */}
          <div className="space-y-2">
            <Label>Proposicao</Label>
            {proposicaoInicial ? (
              <div className="p-3 border rounded-lg bg-gray-50">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {proposicaoInicial.tipo} {proposicaoInicial.numero}/{proposicaoInicial.ano}
                  </Badge>
                </div>
                {proposicaoInicial.ementa && (
                  <p className="text-sm text-gray-600 mt-1">{proposicaoInicial.ementa}</p>
                )}
              </div>
            ) : loadingProposicoes ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando...
              </div>
            ) : proposicoes.length === 0 ? (
              <div className="flex items-center gap-2 text-yellow-600">
                <AlertCircle className="h-4 w-4" />
                Nenhuma proposicao pendente
              </div>
            ) : (
              <Select
                value={formData.proposicaoId}
                onValueChange={value => setFormData(prev => ({ ...prev, proposicaoId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a proposicao" />
                </SelectTrigger>
                <SelectContent>
                  {proposicoes.map(prop => (
                    <SelectItem key={prop.id} value={prop.id}>
                      {prop.tipo} {prop.numero}/{prop.ano}
                      {prop.ementa && ` - ${prop.ementa.substring(0, 50)}...`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Relator */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <User className="h-4 w-4" />
              Relator
            </Label>
            <Select
              value={formData.relatorId}
              onValueChange={value => setFormData(prev => ({ ...prev, relatorId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o relator" />
              </SelectTrigger>
              <SelectContent>
                {membros.map(membro => (
                  <SelectItem key={membro.parlamentarId} value={membro.parlamentarId}>
                    {membro.nome}
                    {membro.cargo === 'PRESIDENTE' && ' (Presidente)'}
                    {membro.cargo === 'VICE_PRESIDENTE' && ' (Vice)'}
                    {membro.cargo === 'RELATOR' && ' (Relator)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipo do Parecer */}
          <div className="space-y-2">
            <Label>Tipo do Parecer</Label>
            <Select
              value={formData.tipo}
              onValueChange={(value: TipoParecer) => setFormData(prev => ({ ...prev, tipo: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tiposParecer.map(tipo => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Botao Gerar Texto */}
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={gerarTextoAutomatico}
              disabled={!formData.proposicaoId || !formData.relatorId}
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Gerar Texto Automatico
            </Button>
          </div>

          {/* Texto do Parecer */}
          <div className="space-y-2">
            <Label>Texto do Parecer</Label>
            <Textarea
              value={formData.texto}
              onChange={e => setFormData(prev => ({ ...prev, texto: e.target.value }))}
              placeholder="Digite ou gere o texto do parecer..."
              rows={12}
              className="font-mono text-sm"
            />
          </div>

          {/* Preview */}
          {formData.proposicaoId && formData.relatorId && (
            <div className="p-3 bg-blue-50 rounded-lg text-sm">
              <p className="text-blue-700">
                <strong>Parecer {formData.tipo}</strong> sobre{' '}
                {proposicaoSelecionada?.tipo} {proposicaoSelecionada?.numero}/{proposicaoSelecionada?.ano}
              </p>
              <p className="text-blue-600">
                Relator: {relatorSelecionado?.nome}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Criar Parecer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
