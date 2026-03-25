'use client'

import { useEffect } from 'react'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Erro no painel admin:', error)
  }, [error])

  return (
    <div className="flex items-center justify-center h-[60vh] px-4">
      <div className="text-center max-w-md">
        <h2 className="text-xl font-bold text-foreground mb-2">Erro no Painel</h2>
        <p className="text-muted-foreground mb-4">
          Ocorreu um erro inesperado no painel administrativo.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm"
          >
            Tentar novamente
          </button>
          <a
            href="/admin"
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors text-sm"
          >
            Voltar ao Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
