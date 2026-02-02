import { CheckCircle, XCircle, MinusCircle, Vote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface VotoRegistradoProps {
  voto: string
  onAlterar: () => void
  disabled?: boolean
}

export function VotoRegistrado({ voto, onAlterar, disabled }: VotoRegistradoProps) {
  return (
    <div className="bg-green-900/30 rounded-xl sm:rounded-2xl border border-green-500/30 p-4 sm:p-5 text-center space-y-3">
      <div className="flex items-center justify-center gap-3">
        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-green-500/20 rounded-full flex items-center justify-center">
          <CheckCircle className="h-6 w-6 sm:h-7 sm:w-7 text-green-400" />
        </div>
        <div className="text-left">
          <h3 className="text-green-300 text-base sm:text-lg font-semibold">
            Voto Registrado
          </h3>
          <p className="text-slate-400 text-xs">
            Você pode alterar antes do encerramento
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 sm:gap-4">
        <div className={cn(
          "flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-full text-lg sm:text-xl font-bold text-white",
          voto === 'SIM' ? 'bg-green-600' :
          voto === 'NAO' ? 'bg-red-600' :
          'bg-yellow-600'
        )}>
          {voto === 'SIM' && <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />}
          {voto === 'NAO' && <XCircle className="h-5 w-5 sm:h-6 sm:w-6" />}
          {voto === 'ABSTENCAO' && <MinusCircle className="h-5 w-5 sm:h-6 sm:w-6" />}
          {voto === 'NAO' ? 'NÃO' : voto === 'ABSTENCAO' ? 'ABSTENÇÃO' : voto}
        </div>

        <Button
          onClick={onAlterar}
          variant="outline"
          className="border-orange-500/50 text-orange-300 hover:bg-orange-500/20 hover:text-orange-200 h-10 sm:h-12 px-4 sm:px-5"
          disabled={disabled}
        >
          <Vote className="h-4 w-4 mr-2" />
          Alterar
        </Button>
      </div>
    </div>
  )
}
