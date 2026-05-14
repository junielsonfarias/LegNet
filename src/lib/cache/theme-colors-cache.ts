/**
 * F1.4 (PLANO-CORRECOES-MAIO-2026) — Cache do tema institucional.
 *
 * `getThemeColors()` em src/app/layout.tsx eh chamado em TODA navegacao para
 * injetar CSS de cores. Antes desta correcao, gerava 1 query Prisma por
 * request. Agora o resultado eh cacheado com `unstable_cache` por 1h, com
 * tag declarada aqui.
 *
 * Toda mutacao de `ConfiguracaoInstitucional` (cores primaria/secundaria/
 * acento) DEVE chamar `invalidateThemeColorsCache()` para invalidar o cache
 * imediatamente.
 */

import { revalidateTag } from 'next/cache'

export const THEME_COLORS_CACHE_TAG = 'theme-colors'

export function invalidateThemeColorsCache(): void {
  try {
    revalidateTag(THEME_COLORS_CACHE_TAG)
  } catch {
    // revalidateTag fora de contexto Next (ex: scripts) — silencioso.
  }
}
