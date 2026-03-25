'use client'

import { ExternalLink, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface RedirectBannerProps {
  url: string
  label?: string
  categoriaNome: string
}

/**
 * Banner exibido quando a página de transparência redireciona para site externo.
 * Oferece opção de abrir novamente ou voltar ao portal.
 */
export function RedirectBanner({ url, label, categoriaNome }: RedirectBannerProps) {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
          <ExternalLink className="h-8 w-8" />
        </div>

        <h2 className="text-2xl font-bold text-foreground">
          {categoriaNome}
        </h2>

        <p className="text-muted-foreground">
          Esta informação está disponível em um portal externo.
          Uma nova aba foi aberta automaticamente.
        </p>

        {label && (
          <p className="text-sm text-muted-foreground italic">
            {label}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Button
            onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
            className="gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Abrir novamente
          </Button>

          <Button variant="outline" asChild className="gap-2">
            <Link href="/transparencia">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Portal
            </Link>
          </Button>
        </div>

        <div className="pt-4">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-800 underline break-all"
          >
            {url}
          </a>
        </div>
      </div>
    </div>
  )
}
