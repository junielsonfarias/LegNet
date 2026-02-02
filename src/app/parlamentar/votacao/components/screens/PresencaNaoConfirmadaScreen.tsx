import { Users, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export function PresencaNaoConfirmadaScreen() {
  return (
    <div className="h-[100dvh] flex items-center justify-center bg-gray-50 p-4 overflow-hidden">
      <Card className="max-w-md w-full mx-4">
        <CardContent className="p-4 sm:p-6 text-center">
          <Users className="h-10 w-10 sm:h-12 sm:w-12 text-yellow-500 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
            Presença Não Confirmada
          </h3>
          <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">
            Sua presença ainda não foi confirmada pelo operador da sessão.
          </p>
          <p className="text-xs sm:text-sm text-gray-500">
            Aguarde a confirmação de presença para acessar a pauta e votar.
          </p>
          <div className="mt-3 sm:mt-4 flex items-center justify-center gap-2 text-xs sm:text-sm text-blue-600">
            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
            Aguardando confirmação...
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
