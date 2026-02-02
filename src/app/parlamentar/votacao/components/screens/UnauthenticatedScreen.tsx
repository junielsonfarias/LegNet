import { AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function UnauthenticatedScreen() {
  return (
    <div className="h-[100dvh] flex items-center justify-center bg-gray-50 p-4 overflow-hidden">
      <Card className="max-w-md w-full mx-4">
        <CardContent className="p-4 sm:p-6 text-center">
          <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-red-500 mx-auto mb-3 sm:mb-4" />
          <p className="text-red-600 mb-3 sm:mb-4 text-sm sm:text-base">
            Você precisa estar logado para acessar esta página
          </p>
          <Button asChild size="sm" className="sm:size-default">
            <a href="/admin/login">Fazer Login</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
