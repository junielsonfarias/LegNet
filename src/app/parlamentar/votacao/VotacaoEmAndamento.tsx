'use client'

import { Vote, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { VotacaoHeader } from './components/headers/VotacaoHeader'
import { ProposicaoCard } from './components/votacao/ProposicaoCard'
import { BotoesVotacao } from './components/votacao/BotoesVotacao'
import { VotoRegistrado } from './components/votacao/VotoRegistrado'
import type { SessaoCompleta, ParlamentarInfo, PautaItem, VotoTipo, ConfiguracaoInstitucional } from './types/votacao'

interface VotacaoEmAndamentoProps {
  sessao: SessaoCompleta
  itemEmVotacao: PautaItem
  parlamentarInfo: ParlamentarInfo | null
  nomeParlamentar: string
  tempoSessao: number
  votoRegistrado: string | null
  votando: boolean
  configuracao: ConfiguracaoInstitucional
  onVotar: (voto: VotoTipo) => void
  onAlterarVoto: () => void
}

export function VotacaoEmAndamento({
  sessao,
  itemEmVotacao,
  parlamentarInfo,
  nomeParlamentar,
  tempoSessao,
  votoRegistrado,
  votando,
  configuracao,
  onVotar,
  onAlterarVoto
}: VotacaoEmAndamentoProps) {
  return (
    <div className="h-[100dvh] bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col overflow-hidden">
      <VotacaoHeader
        sessao={sessao}
        parlamentarInfo={parlamentarInfo}
        nomeParlamentar={nomeParlamentar}
        tempoSessao={tempoSessao}
        configuracao={configuracao}
        variant="dark"
        statusBadge={
          <Badge className="bg-orange-500/20 text-orange-300 border border-orange-500/40 text-xs sm:text-sm px-3 py-1 animate-pulse">
            <Vote className="h-4 w-4 mr-1.5" />
            VOTAÇÃO
          </Badge>
        }
      />

      {/* Conteúdo principal - Votação (scrollável apenas se necessário) */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        <div className="flex-1 flex flex-col justify-center p-3 sm:p-4">
          <div className="w-full max-w-xl mx-auto space-y-3 sm:space-y-4">
            {/* Card da proposição */}
            <ProposicaoCard item={itemEmVotacao} variant="votacao" />

            {/* Área de votação */}
            {votoRegistrado ? (
              <VotoRegistrado
                voto={votoRegistrado}
                onAlterar={onAlterarVoto}
                disabled={votando}
              />
            ) : (
              <BotoesVotacao onVotar={onVotar} votando={votando} />
            )}
          </div>
        </div>
      </div>

      {/* Footer - fixo no rodapé */}
      <div className="flex-shrink-0 bg-slate-800/50 border-t border-slate-700 px-3 py-2">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-slate-500 text-[10px] sm:text-xs">
          <span>{configuracao.sigla || 'CM'} - Sistema Legislativo</span>
          <div className="flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Atualização automática</span>
          </div>
        </div>
      </div>
    </div>
  )
}
