'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText } from 'lucide-react'
import type { PautaItemApi } from '@/lib/api/pauta-api'
import { PautaItem } from './PautaItem'

interface Presenca {
  parlamentar: {
    id: string
    nome: string
    apelido?: string | null
  }
  presente: boolean
}

interface GrupoItens {
  secao: string
  itens: PautaItemApi[]
}

interface PautaSectionProps {
  groupedItens: GrupoItens[]
  currentItem: PautaItemApi | null
  sessaoEmAndamento: boolean
  executando: boolean
  presencas?: Presenca[]
  onExecutarAcaoItem: (
    itemId: string,
    acao: 'iniciar' | 'pausar' | 'retomar' | 'votacao' | 'finalizar' | 'vista' | 'retomarVista' | 'subir' | 'descer',
    resultado?: 'CONCLUIDO' | 'APROVADO' | 'REJEITADO' | 'RETIRADO' | 'ADIADO',
    parlamentarId?: string
  ) => void
  onAtualizarTipoAcao: (itemId: string, tipoAcao: 'LEITURA' | 'DISCUSSAO' | 'VOTACAO' | 'COMUNICADO' | 'HOMENAGEM') => void
  onAbrirModalRetirada: (itemId: string, itemTitulo: string) => void
}

export function PautaSection({
  groupedItens,
  currentItem,
  sessaoEmAndamento,
  executando,
  presencas,
  onExecutarAcaoItem,
  onAtualizarTipoAcao,
  onAbrirModalRetirada
}: PautaSectionProps) {
  return (
    <Card className="border-slate-700 bg-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <FileText className="h-5 w-5 text-blue-400" /> Pauta da sessao
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {groupedItens.length === 0 && (
          <p className="text-sm text-slate-400">Nenhum item cadastrado para esta pauta.</p>
        )}

        {groupedItens.map(grupo => (
          <div key={grupo.secao} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-200">
                {grupo.secao.replace(/_/g, ' ')}
              </h2>
              <span className="text-sm text-slate-400">{grupo.itens.length} item(s)</span>
            </div>

            <div className="space-y-3">
              {grupo.itens.map(item => (
                <PautaItem
                  key={item.id}
                  item={item}
                  isAtual={currentItem?.id === item.id}
                  sessaoEmAndamento={sessaoEmAndamento}
                  executando={executando}
                  presencas={presencas}
                  onIniciar={() => onExecutarAcaoItem(item.id, 'iniciar')}
                  onPausar={() => onExecutarAcaoItem(item.id, 'pausar')}
                  onRetomar={() => onExecutarAcaoItem(item.id, 'retomar')}
                  onVotacao={() => onExecutarAcaoItem(item.id, 'votacao')}
                  onFinalizar={(resultado) => onExecutarAcaoItem(item.id, 'finalizar', resultado)}
                  onVista={(parlamentarId) => onExecutarAcaoItem(item.id, 'vista', undefined, parlamentarId)}
                  onRetomarVista={() => onExecutarAcaoItem(item.id, 'retomarVista')}
                  onSubir={() => onExecutarAcaoItem(item.id, 'subir')}
                  onDescer={() => onExecutarAcaoItem(item.id, 'descer')}
                  onAtualizarTipoAcao={(tipoAcao) => onAtualizarTipoAcao(item.id, tipoAcao)}
                  onRetirar={() => onAbrirModalRetirada(item.id, item.titulo)}
                />
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
