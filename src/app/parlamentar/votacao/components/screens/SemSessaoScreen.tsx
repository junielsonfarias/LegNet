import { Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export function SemSessaoScreen() {
  return (
    <div className="h-[100dvh] flex items-center justify-center bg-gray-50 p-4 overflow-hidden">
      <Card className="max-w-md w-full mx-4">
        <CardContent className="p-4 sm:p-6 text-center">
          <Clock className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
            Nenhuma Sessão em Andamento
          </h3>
          <p className="text-gray-600 text-sm sm:text-base">
            Não há sessões legislativas em andamento no momento.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
