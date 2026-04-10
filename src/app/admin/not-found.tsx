import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, LayoutDashboard } from 'lucide-react'

export default function AdminNotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="text-6xl font-bold text-gray-300 mb-4">404</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Pagina nao encontrada
          </h1>
          <p className="text-gray-500 mb-6">
            O recurso que voce procura nao existe ou foi movido.
          </p>
          <div className="flex gap-3 justify-center">
            <Button asChild variant="outline" size="sm">
              <Link href="/admin">
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/sessoes">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Sessoes
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
