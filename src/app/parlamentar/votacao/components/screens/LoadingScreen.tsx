import { Loader2 } from 'lucide-react'

export function LoadingScreen() {
  return (
    <div className="h-[100dvh] flex items-center justify-center bg-gray-50 p-4 overflow-hidden">
      <div className="text-center">
        <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-blue-600 mx-auto mb-3 sm:mb-4" />
        <p className="text-gray-600 text-sm sm:text-base">Carregando...</p>
      </div>
    </div>
  )
}
