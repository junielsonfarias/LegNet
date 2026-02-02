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
  Minus
} from 'lucide-react'
import type { PautaItem, EstatisticasVotacao } from '../types'

interface ItemStatusProps {
  itemAtual: PautaItem
  estatisticas: EstatisticasVotacao
  totalPresentes: number
}

export function ItemStatus({ itemAtual, estatisticas, totalPresentes }: ItemStatusProps) {
  const { status, tipoAcao } = itemAtual

  return (
    <Card className="bg-white/10 backdrop-blur-lg border border-white/20 text-white">
      <CardContent className="py-8 text-center">
        {/* Item em Leitura (tipoAcao LEITURA) */}
        {status === 'EM_DISCUSSAO' && tipoAcao === 'LEITURA' && (
          <>
            <BookOpen className="h-12 w-12 text-sky-400 mx-auto mb-4" />
            <p className="text-xl text-sky-200 font-bold mb-2">EM LEITURA</p>
            <p className="text-sm text-blue-300">Acompanhe a leitura em plenario</p>
          </>
        )}

        {/* Item em Leitura para Votacao (tipoAcao VOTACAO mas em discussao) */}
        {status === 'EM_DISCUSSAO' && tipoAcao === 'VOTACAO' && (
          <>
            <BookOpen className="h-12 w-12 text-purple-400 mx-auto mb-4" />
            <p className="text-xl text-purple-200 font-bold mb-2">LEITURA DA MATERIA</p>
            <p className="text-sm text-purple-300">Apos a leitura, sera colocada em votacao</p>
          </>
        )}

        {/* Item em Discussao */}
        {status === 'EM_DISCUSSAO' && tipoAcao === 'DISCUSSAO' && (
          <>
            <Users className="h-12 w-12 text-teal-400 mx-auto mb-4" />
            <p className="text-xl text-teal-200 font-bold mb-2">EM DISCUSSAO</p>
            <p className="text-sm text-teal-300">Parlamentares discutindo a materia</p>
          </>
        )}

        {/* Item em Comunicado */}
        {status === 'EM_DISCUSSAO' && tipoAcao === 'COMUNICADO' && (
          <>
            <FileText className="h-12 w-12 text-amber-400 mx-auto mb-4" />
            <p className="text-xl text-amber-200 font-bold mb-2">COMUNICADO</p>
            <p className="text-sm text-amber-300">Comunicado em andamento</p>
          </>
        )}

        {/* Item em Homenagem */}
        {status === 'EM_DISCUSSAO' && tipoAcao === 'HOMENAGEM' && (
          <>
            <Award className="h-12 w-12 text-pink-400 mx-auto mb-4" />
            <p className="text-xl text-pink-200 font-bold mb-2">HOMENAGEM</p>
            <p className="text-sm text-pink-300">Homenagem em andamento</p>
          </>
        )}

        {/* Item em Discussao sem tipoAcao definido */}
        {status === 'EM_DISCUSSAO' && !tipoAcao && (
          <>
            <FileText className="h-12 w-12 text-blue-400 mx-auto mb-4" />
            <p className="text-xl text-blue-200 font-bold mb-2">EM ANDAMENTO</p>
            <p className="text-sm text-blue-300">Acompanhe os trabalhos em plenario</p>
          </>
        )}

        {/* Item em Votacao */}
        {status === 'EM_VOTACAO' && (
          <>
            <Vote className="h-10 w-10 text-orange-400 mx-auto mb-3 animate-pulse" />
            <p className="text-xl text-orange-200 font-bold mb-3">VOTACAO EM ANDAMENTO</p>
            <div className="grid grid-cols-3 gap-2 mb-3">
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
            <Clock className="h-12 w-12 text-slate-400 mx-auto mb-4 opacity-50" />
            <p className="text-lg text-slate-300">Aguardando inicio</p>
            <p className="text-sm text-slate-400 mt-1">Este item ainda nao foi iniciado</p>
          </>
        )}

        {/* Item Concluido sem votacao */}
        {status === 'CONCLUIDO' && (
          <>
            <CheckCircle className="h-12 w-12 text-teal-400 mx-auto mb-4" />
            <p className="text-lg text-teal-200">Item Concluido</p>
            <p className="text-sm text-teal-300 mt-1">
              {tipoAcao === 'LEITURA' ? 'Leitura finalizada' :
               tipoAcao === 'COMUNICADO' ? 'Comunicado realizado' :
               tipoAcao === 'HOMENAGEM' ? 'Homenagem realizada' :
               'Finalizado com sucesso'}
            </p>
          </>
        )}

        {/* Item Aprovado */}
        {status === 'APROVADO' && (
          <>
            <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
            <p className="text-lg text-green-200">Item Aprovado</p>
          </>
        )}

        {/* Item Rejeitado */}
        {status === 'REJEITADO' && (
          <>
            <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-lg text-red-200">Item Rejeitado</p>
          </>
        )}

        {/* Item Adiado */}
        {status === 'ADIADO' && (
          <>
            <Clock className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
            <p className="text-lg text-yellow-200">Item Adiado</p>
          </>
        )}

        {/* Item Retirado */}
        {status === 'RETIRADO' && (
          <>
            <Minus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg text-gray-200">Item Retirado</p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
