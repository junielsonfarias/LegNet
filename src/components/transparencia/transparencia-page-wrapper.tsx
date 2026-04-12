'use client'

import { useSearchParams } from 'next/navigation'
import { useTransparenciaRedirect } from '@/lib/hooks/use-transparencia-redirect'
import { useTransparenciaPeriodos } from '@/lib/hooks/use-transparencia-periodos'
import { RedirectBanner } from '@/components/transparencia/redirect-banner'
import { PeriodSelectorScreen } from '@/components/transparencia/period-selector-screen'
import { Loader2 } from 'lucide-react'

interface TransparenciaPageWrapperProps {
  slug: string
  nome: string
  children: React.ReactNode
}

/**
 * Wrapper para paginas de transparencia.
 *
 * Logica de exibicao (em ordem de precedencia):
 *  1. Se ha redirecionamento legacy ativo (`transparencia.redirect.<slug>`)
 *     -> mostra banner e abre URL externa.
 *  2. Se ha periodos cadastrados (`transparencia.periodos.<slug>`) E o usuario
 *     ainda nao escolheu periodo (?periodo=...) -> mostra tela de selecao.
 *  3. Caso contrario -> renderiza o children (conteudo interno padrao).
 */
export function TransparenciaPageWrapper({ slug, nome, children }: TransparenciaPageWrapperProps) {
  const searchParams = useSearchParams()
  const periodoSelecionado = searchParams?.get('periodo')

  const redirect = useTransparenciaRedirect(slug)
  const periodos = useTransparenciaPeriodos(slug)

  // Aguarda ambos os hooks para evitar flash
  if (redirect.loading || periodos.loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // 1) Redirect externo legacy
  if (redirect.redirected && redirect.redirect) {
    return (
      <RedirectBanner
        url={redirect.redirect.url}
        label={redirect.redirect.label}
        categoriaNome={nome}
      />
    )
  }

  // 2) Tela de selecao de periodo (so se nao houver query param ?periodo=)
  if (periodos.enabled && !periodoSelecionado) {
    return (
      <PeriodSelectorScreen
        titulo={periodos.config?.titulo}
        descricao={periodos.config?.descricao}
        categoriaNome={nome}
        periodos={periodos.periodos}
      />
    )
  }

  // 3) Conteudo interno padrao
  return <>{children}</>
}
