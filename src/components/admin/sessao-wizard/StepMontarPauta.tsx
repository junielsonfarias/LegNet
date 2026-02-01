'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Trash2,
  Search,
  FileText,
  GripVertical,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'

import type { SessaoFormData } from './StepSessaoInfo'
import { ProposicaoSelector } from './ProposicaoSelector'

export interface PautaItem {
  id: string
  secao: 'EXPEDIENTE' | 'ORDEM_DO_DIA' | 'COMUNICACOES' | 'HONRAS' | 'OUTROS'
  titulo: string
  descricao?: string
  proposicaoId?: string
  proposicaoNumero?: string
  proposicaoTipo?: string
  tempoEstimado?: number
  tipoAcao: 'LEITURA' | 'DISCUSSAO' | 'VOTACAO' | 'COMUNICADO' | 'HOMENAGEM'
}

interface StepMontarPautaProps {
  sessaoInfo: SessaoFormData
  itens: PautaItem[]
  onChange: (itens: PautaItem[]) => void
}

const SECOES = [
  { value: 'EXPEDIENTE', label: 'Expediente' },
  { value: 'ORDEM_DO_DIA', label: 'Ordem do Dia' },
  { value: 'COMUNICACOES', label: 'Comunicacoes' },
  { value: 'HONRAS', label: 'Honras' },
  { value: 'OUTROS', label: 'Outros' }
]

const TIPOS_ACAO = [
  { value: 'LEITURA', label: 'Leitura' },
  { value: 'DISCUSSAO', label: 'Discussao' },
  { value: 'VOTACAO', label: 'Votacao' },
  { value: 'COMUNICADO', label: 'Comunicado' },
  { value: 'HOMENAGEM', label: 'Homenagem' }
]

const TIPOS_SESSAO_LABELS: Record<string, string> = {
  'ORDINARIA': 'Ordinaria',
  'EXTRAORDINARIA': 'Extraordinaria',
  'SOLENE': 'Solene',
  'ESPECIAL': 'Especial'
}

export function StepMontarPauta({ sessaoInfo, itens, onChange }: StepMontarPautaProps) {
  const [showSelector, setShowSelector] = useState(false)
  const [showManualForm, setShowManualForm] = useState(false)
  const [secaoAtual, setSecaoAtual] = useState<PautaItem['secao']>('ORDEM_DO_DIA')
  const [manualItem, setManualItem] = useState({
    titulo: '',
    descricao: '',
    secao: 'ORDEM_DO_DIA' as PautaItem['secao'],
    tipoAcao: 'LEITURA' as PautaItem['tipoAcao'],
    tempoEstimado: 5
  })

  const handleAddProposicao = useCallback((proposicao: {
    id: string
    numero: string
    ano: number
    tipo: string
    titulo: string
    ementa: string
    etapaAtual?: string
  }) => {
    const novoItem: PautaItem = {
      id: `item-${Date.now()}`,
      secao: secaoAtual,
      titulo: `${proposicao.numero}/${proposicao.ano} - ${proposicao.titulo}`,
      descricao: proposicao.ementa,
      proposicaoId: proposicao.id,
      proposicaoNumero: `${proposicao.numero}/${proposicao.ano}`,
      proposicaoTipo: proposicao.tipo,
      tempoEstimado: 15,
      tipoAcao: secaoAtual === 'ORDEM_DO_DIA' ? 'VOTACAO' : 'LEITURA'
    }

    onChange([...itens, novoItem])
    setShowSelector(false)
  }, [itens, onChange, secaoAtual])

  const handleAddManualItem = () => {
    if (!manualItem.titulo.trim()) return

    const novoItem: PautaItem = {
      id: `item-${Date.now()}`,
      secao: manualItem.secao,
      titulo: manualItem.titulo,
      descricao: manualItem.descricao,
      tempoEstimado: manualItem.tempoEstimado,
      tipoAcao: manualItem.tipoAcao
    }

    onChange([...itens, novoItem])
    setManualItem({
      titulo: '',
      descricao: '',
      secao: 'ORDEM_DO_DIA',
      tipoAcao: 'LEITURA',
      tempoEstimado: 5
    })
    setShowManualForm(false)
  }

  const handleRemoveItem = (itemId: string) => {
    onChange(itens.filter(item => item.id !== itemId))
  }

  const itensPorSecao = SECOES.map(secao => ({
    ...secao,
    itens: itens.filter(item => item.secao === secao.value)
  }))

  const tempoTotal = itens.reduce((acc, item) => acc + (item.tempoEstimado || 0), 0)

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold">Montar Pauta</h2>
        <p className="text-sm text-gray-500">
          Sessão: <strong>{sessaoInfo.numero}ª {TIPOS_SESSAO_LABELS[sessaoInfo.tipo]}</strong>
          {sessaoInfo.data && ` - ${new Date(sessaoInfo.data + 'T00:00:00').toLocaleDateString('pt-BR')}`}
          {sessaoInfo.horario && ` as ${sessaoInfo.horario}`}
        </p>
      </div>

      {/* Acoes */}
      <div className="flex flex-wrap gap-2 justify-center">
        <Button
          variant="outline"
          onClick={() => {
            setSecaoAtual('ORDEM_DO_DIA')
            setShowSelector(true)
          }}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar Proposicao
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowManualForm(true)}
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          Item Manual
        </Button>
      </div>

      {/* Aviso sobre proposicoes elegiveis */}
      <div className="p-3 bg-blue-50 rounded-lg text-sm">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
          <div>
            <p className="text-blue-800">
              <strong>RN-057:</strong> Apenas proposicoes com status &quot;Aguardando Pauta&quot; ou tramitacao para Plenario podem ser adicionadas na Ordem do Dia.
            </p>
          </div>
        </div>
      </div>

      {/* Selector de Proposicao */}
      {showSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold">Selecionar Proposicao</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowSelector(false)}>
                X
              </Button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <ProposicaoSelector onSelect={handleAddProposicao} />
            </div>
          </div>
        </div>
      )}

      {/* Form Manual */}
      {showManualForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h3 className="font-semibold mb-4">Adicionar Item Manual</h3>
            <div className="space-y-4">
              <div>
                <Label>Titulo *</Label>
                <Input
                  value={manualItem.titulo}
                  onChange={(e) => setManualItem({ ...manualItem, titulo: e.target.value })}
                  placeholder="Ex: Abertura e verificacao de quorum"
                />
              </div>
              <div>
                <Label>Secao</Label>
                <select
                  value={manualItem.secao}
                  onChange={(e) => setManualItem({ ...manualItem, secao: e.target.value as PautaItem['secao'] })}
                  className="w-full p-2 border rounded-md"
                >
                  {SECOES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Tipo de Acao</Label>
                <select
                  value={manualItem.tipoAcao}
                  onChange={(e) => setManualItem({ ...manualItem, tipoAcao: e.target.value as PautaItem['tipoAcao'] })}
                  className="w-full p-2 border rounded-md"
                >
                  {TIPOS_ACAO.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Tempo Estimado (min)</Label>
                <Input
                  type="number"
                  min="1"
                  value={manualItem.tempoEstimado}
                  onChange={(e) => setManualItem({ ...manualItem, tempoEstimado: parseInt(e.target.value) || 5 })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowManualForm(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddManualItem} disabled={!manualItem.titulo.trim()}>
                  Adicionar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Itens por Secao */}
      <div className="space-y-4">
        {itensPorSecao.map((secao) => (
          <div key={secao.value} className="border rounded-lg">
            <div className="p-3 bg-gray-50 border-b flex justify-between items-center">
              <h4 className="font-medium">{secao.label}</h4>
              <Badge variant="outline">{secao.itens.length} itens</Badge>
            </div>
            {secao.itens.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                Nenhum item nesta secao
              </div>
            ) : (
              <div className="divide-y">
                {secao.itens.map((item, index) => (
                  <div key={item.id} className="p-3 flex items-start gap-3">
                    <div className="text-gray-400">
                      <GripVertical className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{index + 1}.</span>
                        <span>{item.titulo}</span>
                        {item.proposicaoTipo && (
                          <Badge variant="outline" className="text-xs">
                            {item.proposicaoTipo}
                          </Badge>
                        )}
                        <Badge className="text-xs">{item.tipoAcao}</Badge>
                      </div>
                      {item.descricao && (
                        <p className="text-sm text-gray-500 line-clamp-2">{item.descricao}</p>
                      )}
                      <div className="text-xs text-gray-400 mt-1">
                        Tempo estimado: {item.tempoEstimado || 0} min
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Resumo */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Total de itens na pauta:</span>
          <span className="font-medium">{itens.length}</span>
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-sm text-gray-600">Tempo total estimado:</span>
          <span className="font-medium">{tempoTotal} minutos ({Math.floor(tempoTotal / 60)}h {tempoTotal % 60}min)</span>
        </div>
      </div>
    </div>
  )
}
