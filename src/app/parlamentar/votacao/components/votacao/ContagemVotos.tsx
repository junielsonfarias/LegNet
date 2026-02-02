import { CheckCircle, XCircle, MinusCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ResultadoVotacao } from '../../types/votacao'

interface ContagemVotosProps {
  resultado: ResultadoVotacao
}

export function ContagemVotos({ resultado }: ContagemVotosProps) {
  return (
    <div className="bg-slate-800/80 rounded-xl sm:rounded-2xl border border-slate-700 p-4 sm:p-5">
      <h4 className="text-white font-semibold text-sm sm:text-base mb-3 text-center">
        Resultado da Votação
      </h4>
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="text-center p-3 bg-green-900/30 rounded-lg border border-green-500/30">
          <div className="text-2xl sm:text-3xl font-bold text-green-400">
            {resultado.votosSim}
          </div>
          <div className="text-xs sm:text-sm text-green-300">SIM</div>
        </div>
        <div className="text-center p-3 bg-red-900/30 rounded-lg border border-red-500/30">
          <div className="text-2xl sm:text-3xl font-bold text-red-400">
            {resultado.votosNao}
          </div>
          <div className="text-xs sm:text-sm text-red-300">NÃO</div>
        </div>
        <div className="text-center p-3 bg-yellow-900/30 rounded-lg border border-yellow-500/30">
          <div className="text-2xl sm:text-3xl font-bold text-yellow-400">
            {resultado.votosAbstencao}
          </div>
          <div className="text-xs sm:text-sm text-yellow-300">ABSTENÇÃO</div>
        </div>
      </div>
      <div className="text-center text-slate-400 text-xs sm:text-sm mt-3">
        Total: {resultado.totalVotos} votos
      </div>
    </div>
  )
}

interface MeuVotoProps {
  voto: string | null
}

export function MeuVoto({ voto }: MeuVotoProps) {
  return (
    <div className="bg-slate-800/80 rounded-xl sm:rounded-2xl border border-slate-700 p-4 sm:p-5">
      <h4 className="text-white font-semibold text-sm sm:text-base mb-3 text-center">
        Seu Voto
      </h4>
      {voto ? (
        <div className="flex items-center justify-center">
          <div className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-full text-lg sm:text-xl font-bold text-white",
            voto === 'SIM' ? 'bg-green-600' :
            voto === 'NAO' ? 'bg-red-600' :
            'bg-yellow-600'
          )}>
            {voto === 'SIM' && <CheckCircle className="h-6 w-6" />}
            {voto === 'NAO' && <XCircle className="h-6 w-6" />}
            {voto === 'ABSTENCAO' && <MinusCircle className="h-6 w-6" />}
            {voto === 'NAO' ? 'NÃO' :
             voto === 'ABSTENCAO' ? 'ABSTENÇÃO' :
             voto}
          </div>
        </div>
      ) : (
        <div className="text-center text-slate-400">
          <MinusCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Você não registrou voto nesta matéria</p>
        </div>
      )}
    </div>
  )
}
