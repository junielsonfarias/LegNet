'use client'

import { useTransparenciaRedirect } from '@/lib/hooks/use-transparencia-redirect'
import { RedirectBanner } from '@/components/transparencia/redirect-banner'
import { Loader2 } from 'lucide-react'

interface TransparenciaPageWrapperProps {
  slug: string
  nome: string
  children: React.ReactNode
}

/**
 * Wrapper para páginas de transparência que verifica redirecionamento.
 * Se a categoria está configurada como externa, abre URL em nova aba e mostra banner.
 * Caso contrário, renderiza o children (conteúdo interno).
 */
export function TransparenciaPageWrapper({ slug, nome, children }: TransparenciaPageWrapperProps) {
  const { loading, redirect, redirected } = useTransparenciaRedirect(slug)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (redirected && redirect) {
    return (
      <RedirectBanner
        url={redirect.url}
        label={redirect.label}
        categoriaNome={nome}
      />
    )
  }

  return <>{children}</>
}
