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
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { FileText, Search, Loader2, Plus, AlertCircle } from 'lucide-react'
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

interface QuickAddPautaItemsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reuniaoId: string
  comissaoId: string
  itensExistentes?: string[] // IDs de proposicoes ja na pauta
  onSuccess?: () => void
}

export function QuickAddPautaItems({
  open,
  onOpenChange,
  reuniaoId,
  comissaoId,
  itensExistentes = [],
  onSuccess
}: QuickAddPautaItemsProps) {
  const [loading, setLoading] = useState(false)
  const [loadingProposicoes, setLoadingProposicoes] = useState(false)
  const [proposicoes, setProposicoes] = useState<ProposicaoPendente[]>([])
  const [selecionados, setSelecionados] = useState<string[]>([])
  const [busca, setBusca] = useState('')

  useEffect(() => {
    if (open) {
      carregarProposicoes()
      setSelecionados([])
      setBusca('')
    }
  }, [open, comissaoId])

  async function carregarProposicoes() {
    try {
      setLoadingProposicoes(true)
      const response = await fetch(`/api/comissoes/${comissaoId}/dashboard`)
      const result = await response.json()

      if (result.success && result.data.proposicoesPendentes) {
        // Filtrar proposicoes que ja estao na pauta
        const pendentes = result.data.proposicoesPendentes
          .filter((p: any) => !itensExistentes.includes(p.id))
          .map((p: any) => ({
            id: p.id,
            tipo: p.tipo,
            numero: p.numero,
            ano: p.ano,
            ementa: p.ementa,
            autorNome: p.autorNome,
            prazoStatus: p.prazo.status
          }))
        setProposicoes(pendentes)
      }
    } catch (error) {
      console.error('Erro ao carregar proposicoes:', error)
      toast.error('Erro ao carregar proposicoes')
    } finally {
      setLoadingProposicoes(false)
    }
  }

  function toggleItem(id: string) {
    setSelecionados(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    )
  }

  function selecionarTodos() {
    const filtradas = proposicoesFiltradas
    if (selecionados.length === filtradas.length) {
      setSelecionados([])
    } else {
      setSelecionados(filtradas.map(p => p.id))
    }
  }

  const proposicoesFiltradas = proposicoes.filter(p => {
    if (!busca) return true
    const termo = busca.toLowerCase()
    return (
      p.tipo.toLowerCase().includes(termo) ||
      p.numero.toString().includes(termo) ||
      p.ano.toString().includes(termo) ||
      p.ementa?.toLowerCase().includes(termo) ||
      p.autorNome?.toLowerCase().includes(termo)
    )
  })

  async function handleSubmit() {
    if (selecionados.length === 0) {
      toast.error('Selecione pelo menos um item')
      return
    }

    try {
      setLoading(true)

      // Adicionar itens em lote
      const response = await fetch(`/api/reunioes-comissao/${reuniaoId}/pauta/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposicaoIds: selecionados
        })
      })

      const result = await response.json()

      if (!result.success) {
        // Fallback: adicionar um por um
        let adicionados = 0
        for (const proposicaoId of selecionados) {
          const prop = proposicoes.find(p => p.id === proposicaoId)
          if (prop) {
            const res = await fetch(`/api/reunioes-comissao/${reuniaoId}/pauta`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                titulo: `Analise: ${prop.tipo} ${prop.numero}/${prop.ano}`,
                descricao: prop.ementa || '',
                tipo: 'ANALISE_PROPOSICAO',
                proposicaoId: prop.id
              })
            })
            if ((await res.json()).success) adicionados++
          }
        }
        toast.success(`${adicionados} item(ns) adicionado(s) a pauta`)
      } else {
        toast.success(`${selecionados.length} item(ns) adicionado(s) a pauta`)
      }

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast.error('Erro ao adicionar itens')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-blue-600" />
            Adicionar Itens a Pauta
          </DialogTitle>
          <DialogDescription>
            Selecione as proposicoes para adicionar a pauta da reuniao
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar proposicoes..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>

          {loadingProposicoes ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : proposicoesFiltradas.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>
                {proposicoes.length === 0
                  ? 'Nenhuma proposicao pendente'
                  : 'Nenhuma proposicao encontrada'}
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {proposicoesFiltradas.length} proposicao(oes) disponivel(is)
                </p>
                <Button variant="ghost" size="sm" onClick={selecionarTodos}>
                  {selecionados.length === proposicoesFiltradas.length
                    ? 'Desmarcar todos'
                    : 'Selecionar todos'}
                </Button>
              </div>

              <div className="max-h-[350px] overflow-y-auto space-y-2 pr-2">
                {proposicoesFiltradas.map(prop => (
                  <div
                    key={prop.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selecionados.includes(prop.id)
                        ? 'bg-blue-50 border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => toggleItem(prop.id)}
                  >
                    <Checkbox
                      checked={selecionados.includes(prop.id)}
                      onCheckedChange={() => toggleItem(prop.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {prop.tipo} {prop.numero}/{prop.ano}
                        </Badge>
                        <DeadlineIndicator
                          dias={0}
                          status={prop.prazoStatus}
                          size="sm"
                          showIcon={false}
                        />
                      </div>
                      {prop.ementa && (
                        <p className="text-sm text-gray-600 truncate mt-1">
                          {prop.ementa}
                        </p>
                      )}
                      {prop.autorNome && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Autor: {prop.autorNome}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {selecionados.length > 0 && (
            <div className="p-3 bg-green-50 rounded-lg text-sm text-green-700">
              {selecionados.length} item(ns) selecionado(s)
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || selecionados.length === 0}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adicionando...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar ({selecionados.length})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
