/**
 * Helpers de cache HTTP para APIs públicas de leitura.
 *
 * Adiciona `Cache-Control` com `s-maxage` + `stale-while-revalidate`, permitindo
 * cache em CDN (Vercel Edge) e em proxies reversos (nginx no VPS) sem impactar
 * rotas autenticadas. Multi-tenant: use `Vary` para segmentar por slug/host.
 *
 * Uso:
 *   return withPublicCache(NextResponse.json(data), { maxAge: 60, swr: 300 })
 */

import { NextResponse } from 'next/server'

export interface PublicCacheOptions {
  /** Segundos de cache "fresco" no CDN (s-maxage). Default: 60. */
  maxAge?: number
  /** Segundos extras aceitando resposta stale enquanto revalida. Default: 300. */
  swr?: number
  /** Se true, também aceita cache privado no browser. Default: false (só CDN). */
  allowBrowser?: boolean
}

export const PUBLIC_CACHE_DEFAULTS: Required<Omit<PublicCacheOptions, 'allowBrowser'>> = {
  maxAge: 60,
  swr: 300,
}

export const withPublicCache = (
  response: NextResponse,
  opts: PublicCacheOptions = {}
): NextResponse => {
  const maxAge = opts.maxAge ?? PUBLIC_CACHE_DEFAULTS.maxAge
  const swr = opts.swr ?? PUBLIC_CACHE_DEFAULTS.swr

  const directives = opts.allowBrowser
    ? [`public`, `max-age=0`, `s-maxage=${maxAge}`, `stale-while-revalidate=${swr}`]
    : [`public`, `s-maxage=${maxAge}`, `stale-while-revalidate=${swr}`]

  response.headers.set('Cache-Control', directives.join(', '))
  response.headers.set('CDN-Cache-Control', `public, s-maxage=${maxAge}`)

  // Segmenta o cache por tenant quando aplicável
  const existingVary = response.headers.get('Vary')
  const varyParts = new Set(
    (existingVary ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  )
  varyParts.add('x-tenant-slug')
  varyParts.add('Accept')
  response.headers.set('Vary', Array.from(varyParts).join(', '))

  return response
}

/** Cache-Control "no-store" para rotas sensíveis (explícito é melhor que implícito). */
export const withNoCache = (response: NextResponse): NextResponse => {
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  return response
}
