import { NextRequest } from 'next/server'
import { revalidateTag } from 'next/cache'
import { z } from 'zod'
import { createSuccessResponse, getErrorMessage } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { transparenciaRedirectService } from '@/lib/services/transparencia-redirect-service'
import { cacheHelpers } from '@/lib/cache/memory-cache'

export const dynamic = 'force-dynamic'

const PeriodoSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  url: z.string().url('URL inválida').optional().or(z.literal('')),
  hrefInterno: z.string().optional().or(z.literal('')),
  ano: z.number().int().nullish(),
  ordem: z.number().int(),
  ativo: z.boolean(),
})

const ItemConfigSchema = z
  .object({
    slug: z.string().min(1),
    modo: z.enum(['interno', 'redirect', 'periodos']),
    redirect: z
      .object({
        url: z.string().url('URL externa inválida'),
        label: z.string().nullish().transform((v) => v ?? undefined),
      })
      .optional(),
    periodos: z
      .object({
        titulo: z.string().optional(),
        descricao: z.string().optional(),
        periodos: z.array(PeriodoSchema),
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.modo === 'redirect' && !data.redirect?.url) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'modo="redirect" requer redirect.url',
        path: ['redirect', 'url'],
      })
    }
    if (data.modo === 'periodos') {
      if (!data.periodos || data.periodos.periodos.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'modo="periodos" requer pelo menos 1 periodo',
          path: ['periodos', 'periodos'],
        })
        return
      }
      const invalidos = data.periodos.periodos.filter(
        (p) => !p.label.trim() || (!p.url?.trim() && !p.hrefInterno?.trim()),
      )
      if (invalidos.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Cada periodo precisa de label e URL OU hrefInterno',
          path: ['periodos', 'periodos'],
        })
      }
    }
  })

/**
 * POST /api/transparencia/item-config
 *
 * Endpoint atomico para salvar a configuracao completa de um item do portal
 * /transparencia. Substitui os 2 POST paralelos (redirecionamentos + periodos)
 * que existiam antes. Garante consistencia via prisma.$transaction.
 *
 * Body: { slug, modo, redirect?, periodos? }
 * Resposta: { success, modo, slug }
 *
 * Apos salvar:
 *  - Chama `revalidateTag('transparencia-menu')` -> invalida cache em TODAS
 *    as instancias serverless (multi-instancia safe).
 *  - Invalida tambem o memory-cache local para hits subsequentes na mesma
 *    instancia ate o proximo cold start.
 */
export const POST = withAuth(
  async (request: NextRequest) => {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return createSuccessResponse(null, 'JSON invalido no body', undefined, 400)
    }

    let data: z.infer<typeof ItemConfigSchema>
    try {
      data = ItemConfigSchema.parse(body)
    } catch (e) {
      const zerr = (e as { errors?: unknown }).errors
      const message =
        Array.isArray(zerr) && zerr.length > 0
          ? (zerr as Array<{ message?: string }>)[0]?.message ||
            'Dados invalidos'
          : getErrorMessage(e)
      return createSuccessResponse(null, message, undefined, 400)
    }

    await transparenciaRedirectService.setItemConfig(
      data.slug,
      data.modo,
      data.redirect,
      data.periodos && {
        enabled: data.modo === 'periodos',
        titulo: data.periodos.titulo,
        descricao: data.periodos.descricao,
        periodos: data.periodos.periodos,
      },
    )

    // Invalida em TODAS as instancias Vercel
    revalidateTag('transparencia-menu')
    revalidateTag('transparencia-redirects')

    // Invalida tambem o memory-cache da instancia atual (cold start vs in-memory hit)
    cacheHelpers.invalidateTransparenciaRedirects()
    cacheHelpers.invalidateTransparenciaMenu()

    return createSuccessResponse(
      { slug: data.slug, modo: data.modo },
      'Configuracao salva com sucesso',
    )
  },
  { permissions: 'config.manage' },
)
