import { CheckCircle, XCircle, MinusCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { VotoTipo } from '../../types/votacao'

interface BotoesVotacaoProps {
  onVotar: (voto: VotoTipo) => void
  votando: boolean
}

export function BotoesVotacao({ onVotar, votando }: BotoesVotacaoProps) {
  return (
    <div className="space-y-3 sm:space-y-4">
      <p className="text-center text-slate-300 font-medium text-sm sm:text-base">
        Selecione sua opção de voto:
      </p>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Button
          onClick={() => onVotar('SIM')}
          disabled={votando}
          className="bg-green-600 hover:bg-green-500 active:bg-green-700 text-white h-16 sm:h-20 md:h-24 text-base sm:text-lg md:text-xl font-bold rounded-lg sm:rounded-xl shadow-lg shadow-green-600/20 transition-all active:scale-95 sm:hover:scale-105"
        >
          <div className="flex flex-col items-center gap-1 sm:gap-2">
            <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8" />
            <span>SIM</span>
          </div>
        </Button>
        <Button
          onClick={() => onVotar('NAO')}
          disabled={votando}
          className="bg-red-600 hover:bg-red-500 active:bg-red-700 text-white h-16 sm:h-20 md:h-24 text-base sm:text-lg md:text-xl font-bold rounded-lg sm:rounded-xl shadow-lg shadow-red-600/20 transition-all active:scale-95 sm:hover:scale-105"
        >
          <div className="flex flex-col items-center gap-1 sm:gap-2">
            <XCircle className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8" />
            <span>NÃO</span>
          </div>
        </Button>
        <Button
          onClick={() => onVotar('ABSTENCAO')}
          disabled={votando}
          className="bg-yellow-600 hover:bg-yellow-500 active:bg-yellow-700 text-white h-16 sm:h-20 md:h-24 text-base sm:text-lg md:text-xl font-bold rounded-lg sm:rounded-xl shadow-lg shadow-yellow-600/20 transition-all active:scale-95 sm:hover:scale-105"
        >
          <div className="flex flex-col items-center gap-1 sm:gap-2">
            <MinusCircle className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8" />
            <span>ABST.</span>
          </div>
        </Button>
      </div>
      {votando && (
        <div className="text-center py-2 sm:py-3">
          <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-blue-400 mx-auto" />
          <p className="text-slate-400 mt-1 text-sm">Registrando voto...</p>
        </div>
      )}
    </div>
  )
}
