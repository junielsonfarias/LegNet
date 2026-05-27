import { unstable_cache } from 'next/cache'
import { withErrorHandler, createSuccessResponse } from '@/lib/error-handler'
import { transparenciaRedirectService } from '@/lib/services/transparencia-redirect-service'
import {
  ITENS_TRANSPARENCIA,
  SECOES,
  type ItemResolvido,
  type MenuResolvido,
} from '@/lib/transparencia/itens-catalogo'

export const dynamic = 'force-dynamic'

/**
 * Resolve o menu completo a partir do catalogo + sobreposicoes admin.
 *
 * Cache: `unstable_cache` do Next.js com a tag `'transparencia-menu'`.
 * Quando o admin salva config via `POST /api/transparencia/item-config`,
 * chama `revalidateTag('transparencia-menu')` -> invalida em TODAS as
 * instancias serverless da Vercel. Multi-instancia safe.
 *
 * Itens com `ocultoNoMenu=true` aparecem em `itens` (mapa por slug, util para
 * paginas internas que usam TransparenciaPageWrapper) mas NAO entram em
 * `secoes` (a home /transparencia nao os exibe).
 */
const resolveMenu = unstable_cache(
  async (): Promise<MenuResolvido> => {
    const [redirects, periodos] = await Promise.all([
      transparenciaRedirectService.getAll(),
      transparenciaRedirectService.getAllPeriodos(),
    ])

    const redirectMap = new Map(redirects.map((r) => [r.slug, r]))

    const itensResolvidos: ItemResolvido[] = ITENS_TRANSPARENCIA.map((item) => {
      // 1. Redirect direto tem prioridade (sobrepoe tudo)
      const redirect = redirectMap.get(item.slug)
      if (redirect?.enabled && redirect.url) {
        return {
          ...item,
          modo: 'redirect',
          urlExterna: redirect.url,
        }
      }

      // 2. Periodos: substitui sub-itens padrao
      const cfgPeriodos = periodos[item.slug]
      if (cfgPeriodos?.enabled && cfgPeriodos.periodos.length > 0) {
        const ativos = cfgPeriodos.periodos
          .filter((p) => p.ativo)
          .sort((a, b) => a.ordem - b.ordem)
        if (ativos.length > 0) {
          return {
            ...item,
            modo: 'periodos',
            subItensResolvidos: ativos.map((p) => ({
              slug: p.id,
              label: p.label,
              href: p.hrefInterno || undefined,
              urlExterna: p.url || undefined,
              ano: p.ano ?? null,
            })),
            periodosTitulo: cfgPeriodos.titulo,
            periodosDescricao: cfgPeriodos.descricao,
          }
        }
      }

      // 3. Default: rota interna padrao (com sub-itens padrao do catalogo, se houver)
      return {
        ...item,
        modo: 'interno',
        subItensResolvidos: item.subItensPadrao?.map((sub) => ({
          slug: sub.slug,
          label: sub.label,
          href: sub.hrefInterno,
          urlExterna: sub.urlExterna,
        })),
      }
    })

    const itensMap: Record<string, ItemResolvido> = {}
    for (const item of itensResolvidos) itensMap[item.slug] = item

    // Secoes incluem apenas itens visiveis (ocultoNoMenu=false). Itens ocultos
    // continuam em `itens` para o TransparenciaPageWrapper consumir.
    const secoes = SECOES.map((secao) => ({
      ...secao,
      itens: itensResolvidos.filter((i) => i.secao === secao.slug && !i.ocultoNoMenu),
    }))

    return { secoes, itens: itensMap }
  },
  ['transparencia-menu-v1'],
  {
    revalidate: 300, // 5min — fallback se revalidateTag falhar
    tags: ['transparencia-menu'],
  },
)

/**
 * GET /api/transparencia/menu — publico
 */
export const GET = withErrorHandler(async () => {
  const menu = await resolveMenu()
  return createSuccessResponse(menu, 'Menu de transparencia')
})
