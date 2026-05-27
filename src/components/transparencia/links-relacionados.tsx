'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ExternalLink, ChevronRight, Link2 } from 'lucide-react'

interface LinkRelacionado {
  id: string
  label: string
  url: string
  externo: boolean
  ordem: number
  ativo: boolean
  descricao?: string
}

interface ConfiguracaoLinksRelacionados {
  enabled: boolean
  titulo?: string
  descricao?: string
  links: LinkRelacionado[]
}

interface Props {
  /** Slug do item no catalogo de transparencia */
  slug: string
  /** Titulo padrao quando admin nao configurar */
  tituloFallback?: string
}

/**
 * Renderiza uma secao "Links Relacionados" dentro de uma pagina de
 * transparencia. Util para:
 *  - Serie historica: links para sistemas legados (ex: "Consulte ate 2021")
 *  - Documentos correlatos: ex: na pagina de RGF mostrar link para LRF
 *  - Sistemas externos relacionados ao tema
 *
 * Renderiza NADA quando:
 *  - Config nao existe no banco
 *  - Config tem enabled=false
 *  - Nenhum link ativo cadastrado
 */
export function LinksRelacionados({ slug, tituloFallback = 'Links Relacionados' }: Props) {
  const [config, setConfig] = useState<ConfiguracaoLinksRelacionados | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelado = false
    fetch(`/api/transparencia/links-relacionados?slug=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelado) return
        if (j?.data) setConfig(j.data)
      })
      .catch(() => {
        // Falha silenciosa — secao apenas nao aparece
      })
      .finally(() => {
        if (!cancelado) setLoading(false)
      })
    return () => {
      cancelado = true
    }
  }, [slug])

  if (loading) return null
  if (!config || !config.enabled) return null

  const ativos = config.links.filter((l) => l.ativo).sort((a, b) => a.ordem - b.ordem)
  if (ativos.length === 0) return null

  return (
    <section
      aria-label={config.titulo || tituloFallback}
      className="bg-white rounded-lg border shadow-sm mt-4"
    >
      <div className="px-4 sm:px-6 py-4 border-b">
        <div className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-camara-primary" />
          <h2 className="text-base sm:text-lg font-semibold text-camara-primary">
            {config.titulo || tituloFallback}
          </h2>
        </div>
        {config.descricao && (
          <p className="text-sm text-muted-foreground mt-1">{config.descricao}</p>
        )}
      </div>

      <ul className="divide-y">
        {ativos.map((link) => {
          const conteudo = (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-camara-primary group-hover:text-camara-primary/80">
                  {link.label}
                </p>
                {link.descricao && (
                  <p className="text-xs text-muted-foreground mt-0.5">{link.descricao}</p>
                )}
              </div>
              {link.externo ? (
                <ExternalLink className="h-4 w-4 text-camara-primary/50 group-hover:text-camara-primary flex-shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 text-camara-primary/50 group-hover:text-camara-primary flex-shrink-0" />
              )}
            </>
          )
          const className =
            'flex items-center gap-3 px-4 sm:px-6 py-3 hover:bg-gray-50 transition-colors group'

          if (link.externo) {
            return (
              <li key={link.id}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={className}
                  title="Abrir em nova aba (sistema externo)"
                >
                  {conteudo}
                </a>
              </li>
            )
          }

          return (
            <li key={link.id}>
              <Link href={link.url} className={className}>
                {conteudo}
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
