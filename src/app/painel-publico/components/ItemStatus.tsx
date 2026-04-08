'use client'

import { Card, CardContent } from '@/components/ui/card'
import {
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Vote,
  FileText,
  BookOpen,
  Award,
  Minus,
  Gavel
} from 'lucide-react'
import type { PautaItem, EstatisticasVotacao } from '../types'

interface ItemStatusProps {
  itemAtual: PautaItem
  estatisticas: EstatisticasVotacao
  totalPresentes: number
}

function getProposicaoLabel(item: PautaItem): string | null {
  if (!item.proposicao) return null
  const tipo = item.proposicao.tipo || ''
  const tipoLabel: Record<string, string> = {
    'PROJETO_LEI': 'Projeto de Lei',
    'PROJETO_LEI_COMPLEMENTAR': 'Projeto de Lei Complementar',
    'PROJETO_RESOLUCAO': 'Projeto de Resolucao',
    'DECRETO_LEGISLATIVO': 'Decreto Legislativo',
    'EMENDA_LEI_ORGANICA': 'Emenda a Lei Organica',
    'INDICACAO': 'Indicacao',
    'REQUERIMENTO': 'Requerimento',
    'MOCAO': 'Mocao',
    'VOTO_PESAR': 'Voto de Pesar',
    'VOTO_APLAUSO': 'Voto de Aplauso',
  }
  return `${tipoLabel[tipo] || tipo} nº ${item.proposicao.numero}/${item.proposicao.ano}`
}

export function ItemStatus({ itemAtual, estatisticas, totalPresentes }: ItemStatusProps) {
  const status = itemAtual.status
  const tipoAcao = itemAtual.tipoAcao as string | null | undefined
  const proposicaoLabel = getProposicaoLabel(itemAtual)
  const descricao = itemAtual.proposicao?.titulo || itemAtual.descricao

  return (
    <Card className="bg-white/10 backdrop-blur-lg border border-white/20 text-white">
      <CardContent className="py-6 sm:py-8 text-center">
        {/* Item em Leitura (tipoAcao LEITURA) */}
        {status === 'EM_DISCUSSAO' && tipoAcao === 'LEITURA' && (
          <>
            <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 text-sky-400 mx-auto mb-3" />
            <p className="text-lg sm:text-xl text-sky-200 font-bold mb-1">EM LEITURA</p>
            {proposicaoLabel && (
              <p className="text-sm sm:text-base text-sky-300 font-semibold mb-1">{proposicaoLabel}</p>
            )}
            {descricao && (
              <p className="text-xs sm:text-sm text-blue-300/80 line-clamp-2 max-w-lg mx-auto">{descricao}</p>
            )}
          </>
        )}

        {/* Item em Leitura e Votacao */}
        {status === 'EM_DISCUSSAO' && tipoAcao === 'LEITURA_VOTACAO' && (
          <>
            <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 text-sky-400 mx-auto mb-3" />
            <p className="text-lg sm:text-xl text-sky-200 font-bold mb-1">EM LEITURA</p>
            {proposicaoLabel && (
              <p className="text-sm sm:text-base text-sky-300 font-semibold mb-1">{proposicaoLabel}</p>
            )}
            {descricao && (
              <p className="text-xs sm:text-sm text-sky-300/80 line-clamp-2 max-w-lg mx-auto">{descricao}</p>
            )}
            <p className="text-xs text-sky-400/60 mt-2">Apos leitura, sera colocada em votacao</p>
          </>
        )}

        {/* Item em Leitura para Votacao (legado VOTACAO) */}
        {status === 'EM_DISCUSSAO' && tipoAcao === 'VOTACAO' && (
          <>
            <Gavel className="h-10 w-10 sm:h-12 sm:w-12 text-purple-400 mx-auto mb-3" />
            <p className="text-lg sm:text-xl text-purple-200 font-bold mb-1">LEITURA E DISCUSSAO</p>
            {proposicaoLabel && (
              <p className="text-sm sm:text-base text-purple-300 font-semibold mb-1">{proposicaoLabel}</p>
            )}
            {descricao && (
              <p className="text-xs sm:text-sm text-purple-300/70 line-clamp-2 max-w-lg mx-auto">{descricao}</p>
            )}
            <p className="text-xs text-purple-400/60 mt-2">Apos leitura e discussao, sera colocada em votacao</p>
          </>
        )}

        {/* Item em Discussao e Votacao */}
        {status === 'EM_DISCUSSAO' && tipoAcao === 'DISCUSSAO_VOTACAO' && (
          <>
            <Users className="h-10 w-10 sm:h-12 sm:w-12 text-teal-400 mx-auto mb-3" />
            <p className="text-lg sm:text-xl text-teal-200 font-bold mb-1">EM DISCUSSAO</p>
            {proposicaoLabel && (
              <p className="text-sm sm:text-base text-teal-300 font-semibold mb-1">{proposicaoLabel}</p>
            )}
            {descricao && (
              <p className="text-xs sm:text-sm text-teal-300/70 line-clamp-2 max-w-lg mx-auto">{descricao}</p>
            )}
            <p className="text-xs text-teal-400/60 mt-2">Apos discussao, sera colocada em votacao</p>
          </>
        )}

        {/* Item em Discussao */}
        {status === 'EM_DISCUSSAO' && tipoAcao === 'DISCUSSAO' && (
          <>
            <Users className="h-10 w-10 sm:h-12 sm:w-12 text-teal-400 mx-auto mb-3" />
            <p className="text-lg sm:text-xl text-teal-200 font-bold mb-1">EM DISCUSSAO</p>
            {proposicaoLabel && (
              <p className="text-sm sm:text-base text-teal-300 font-semibold mb-1">{proposicaoLabel}</p>
            )}
            {descricao && (
              <p className="text-xs sm:text-sm text-teal-300/70 line-clamp-2 max-w-lg mx-auto">{descricao}</p>
            )}
          </>
        )}

        {/* Item em Comunicado */}
        {status === 'EM_DISCUSSAO' && tipoAcao === 'COMUNICADO' && (
          <>
            <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-amber-400 mx-auto mb-3" />
            <p className="text-lg sm:text-xl text-amber-200 font-bold mb-1">COMUNICADO</p>
            {descricao && (
              <p className="text-xs sm:text-sm text-amber-300/70 line-clamp-2 max-w-lg mx-auto">{descricao}</p>
            )}
          </>
        )}

        {/* Item em Homenagem */}
        {status === 'EM_DISCUSSAO' && tipoAcao === 'HOMENAGEM' && (
          <>
            <Award className="h-10 w-10 sm:h-12 sm:w-12 text-pink-400 mx-auto mb-3" />
            <p className="text-lg sm:text-xl text-pink-200 font-bold mb-1">HOMENAGEM</p>
            {descricao && (
              <p className="text-xs sm:text-sm text-pink-300/70 line-clamp-2 max-w-lg mx-auto">{descricao}</p>
            )}
          </>
        )}

        {/* Item em Discussao sem tipoAcao definido */}
        {status === 'EM_DISCUSSAO' && !tipoAcao && (
          <>
            <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-blue-400 mx-auto mb-3" />
            <p className="text-lg sm:text-xl text-blue-200 font-bold mb-1">EM ANDAMENTO</p>
            {descricao && (
              <p className="text-xs sm:text-sm text-blue-300/70 line-clamp-2 max-w-lg mx-auto">{descricao}</p>
            )}
          </>
        )}

        {/* Item em Votacao */}
        {status === 'EM_VOTACAO' && (
          <>
            <Vote className="h-10 w-10 text-orange-400 mx-auto mb-3 animate-pulse" />
            <p className="text-lg sm:text-xl text-orange-200 font-bold mb-1">VOTACAO EM ANDAMENTO</p>
            {proposicaoLabel && (
              <p className="text-sm text-orange-300 font-semibold mb-2">{proposicaoLabel}</p>
            )}
            <div className="grid grid-cols-3 gap-2 mb-3 max-w-xs mx-auto">
              <div className="text-center p-2 bg-green-900/40 rounded-lg">
                <div className="text-2xl font-bold text-green-400">{estatisticas.sim}</div>
                <div className="text-[10px] text-green-300">SIM</div>
              </div>
              <div className="text-center p-2 bg-red-900/40 rounded-lg">
                <div className="text-2xl font-bold text-red-400">{estatisticas.nao}</div>
                <div className="text-[10px] text-red-300">NAO</div>
              </div>
              <div className="text-center p-2 bg-yellow-900/40 rounded-lg">
                <div className="text-2xl font-bold text-yellow-400">{estatisticas.abstencao}</div>
                <div className="text-[10px] text-yellow-300">ABST.</div>
              </div>
            </div>
            <p className="text-xs text-orange-300">
              {estatisticas.total}/{totalPresentes} votos registrados
            </p>
          </>
        )}

        {/* Item Pendente */}
        {status === 'PENDENTE' && (
          <>
            <Clock className="h-10 w-10 sm:h-12 sm:w-12 text-slate-400 mx-auto mb-3 opacity-50" />
            <p className="text-lg text-slate-300">Aguardando inicio</p>
            {descricao && (
              <p className="text-xs text-slate-400 mt-1 line-clamp-1 max-w-md mx-auto">{descricao}</p>
            )}
          </>
        )}

        {/* Item Concluido */}
        {status === 'CONCLUIDO' && (
          <>
            <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-teal-400 mx-auto mb-3" />
            <p className="text-lg text-teal-200 font-semibold">
              {tipoAcao === 'LEITURA' || tipoAcao === 'LEITURA_VOTACAO' ? 'Leitura Concluida' :
               tipoAcao === 'DISCUSSAO' || tipoAcao === 'DISCUSSAO_VOTACAO' ? 'Discussao Concluida' :
               tipoAcao === 'COMUNICADO' ? 'Comunicado Realizado' :
               tipoAcao === 'HOMENAGEM' ? 'Homenagem Realizada' :
               'Item Concluido'}
            </p>
            {proposicaoLabel && (
              <p className="text-sm text-teal-300/70 mt-1">{proposicaoLabel}</p>
            )}
          </>
        )}

        {/* Item Aprovado */}
        {status === 'APROVADO' && (
          <>
            <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-green-400 mx-auto mb-3" />
            <p className="text-lg text-green-200 font-bold">APROVADO</p>
            {proposicaoLabel && (
              <p className="text-sm text-green-300 font-semibold mt-1">{proposicaoLabel}</p>
            )}
            {descricao && (
              <p className="text-xs text-green-300/60 mt-1 line-clamp-1 max-w-md mx-auto">{descricao}</p>
            )}
          </>
        )}

        {/* Item Rejeitado */}
        {status === 'REJEITADO' && (
          <>
            <XCircle className="h-10 w-10 sm:h-12 sm:w-12 text-red-400 mx-auto mb-3" />
            <p className="text-lg text-red-200 font-bold">REJEITADO</p>
            {proposicaoLabel && (
              <p className="text-sm text-red-300 font-semibold mt-1">{proposicaoLabel}</p>
            )}
          </>
        )}

        {/* Item Adiado */}
        {status === 'ADIADO' && (
          <>
            <Clock className="h-10 w-10 sm:h-12 sm:w-12 text-yellow-400 mx-auto mb-3" />
            <p className="text-lg text-yellow-200 font-semibold">Item Adiado</p>
            {proposicaoLabel && (
              <p className="text-sm text-yellow-300/70 mt-1">{proposicaoLabel}</p>
            )}
          </>
        )}

        {/* Item Retirado */}
        {status === 'RETIRADO' && (
          <>
            <Minus className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-lg text-gray-200 font-semibold">Item Retirado da Pauta</p>
            {proposicaoLabel && (
              <p className="text-sm text-gray-300/70 mt-1">{proposicaoLabel}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
