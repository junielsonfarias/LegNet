'use client'

import { Clock, FileText, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { VotacaoHeader } from './components/headers/VotacaoHeader'
import type { SessaoCompleta, ParlamentarInfo, ConfiguracaoInstitucional } from './types/votacao'

interface AguardandoScreenProps {
  sessao: SessaoCompleta
  parlamentarInfo: ParlamentarInfo | null
  nomeParlamentar: string
  tempoSessao: number
  configuracao: ConfiguracaoInstitucional
  itensRestantes: number
}

export function AguardandoScreen({
  sessao,
  parlamentarInfo,
  nomeParlamentar,
  tempoSessao,
  configuracao,
  itensRestantes
}: AguardandoScreenProps) {
  return (
    <div className="h-[100dvh] bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col overflow-hidden">
      <VotacaoHeader
        sessao={sessao}
        parlamentarInfo={parlamentarInfo}
        nomeParlamentar={nomeParlamentar}
        tempoSessao={tempoSessao}
        configuracao={configuracao}
        variant="compact"
        statusBadge={
          <Badge className="bg-slate-700/50 text-slate-400 border border-slate-600/50 text-[9px] sm:text-xs">
            <Clock className="h-3 w-3 mr-1" />
            AGUARDANDO
          </Badge>
        }
      />

      {/* Conteúdo - Aguardando */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4 sm:space-y-5 max-w-md">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-800 flex items-center justify-center mx-auto ring-4 ring-slate-700/50">
            <Clock className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-white text-xl sm:text-2xl md:text-3xl font-semibold">
              Aguardando Matéria
            </h1>
            <p className="text-slate-400 text-sm sm:text-base mt-2">
              Nenhuma matéria em votação no momento
            </p>
          </div>
          {itensRestantes > 0 && (
            <div className="bg-slate-800/50 rounded-lg px-4 py-2 inline-block">
              <p className="text-slate-300 text-sm">
                <FileText className="h-4 w-4 inline mr-1.5" />
                {itensRestantes} {itensRestantes === 1 ? 'item restante' : 'itens restantes'} na pauta
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
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
