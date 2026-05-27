import { NextRequest } from 'next/server'
import { revalidateTag } from 'next/cache'
import { z } from 'zod'
import { withErrorHandler, createSuccessResponse, getErrorMessage } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { transparenciaRedirectService } from '@/lib/services/transparencia-redirect-service'

export const dynamic = 'force-dynamic'

const LinkSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  url: z.string().min(1, 'URL obrigatoria'),
  externo: z.boolean(),
  ordem: z.number().int(),
  ativo: z.boolean(),
  descricao: z.string().optional(),
})

const ConfigSchema = z.object({
  slug: z.string().min(1),
  enabled: z.boolean(),
  titulo: z.string().optional(),
  descricao: z.string().optional(),
  links: z.array(LinkSchema),
})

/**
 * GET /api/transparencia/links-relacionados?slug=X — publico
 * GET /api/transparencia/links-relacionados — publico, retorna todos
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')

  if (slug) {
    const config = await transparenciaRedirectService.getLinksRelacionados(slug)
    return createSuccessResponse(config, 'Links relacionados consultados')
  }

  const all = await transparenciaRedirectService.getAllLinksRelacionados()
  return createSuccessResponse(all, 'Links relacionados listados')
})

/**
 * POST /api/transparencia/links-relacionados — admin (config.manage)
 */
export const POST = withAuth(
  async (request: NextRequest) => {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return createSuccessResponse(null, 'JSON invalido', undefined, 400)
    }

    let data: z.infer<typeof ConfigSchema>
    try {
      data = ConfigSchema.parse(body)
    } catch (e) {
      const message = getErrorMessage(e)
      return createSuccessResponse(null, message, undefined, 400)
    }

    await transparenciaRedirectService.setLinksRelacionados(data.slug, {
      enabled: data.enabled,
      titulo: data.titulo,
      descricao: data.descricao,
      links: data.links,
    })

    // Invalida cache no Next.js (multi-instancia)
    revalidateTag('transparencia-menu')
    revalidateTag('transparencia-links-relacionados')

    return createSuccessResponse(
      { slug: data.slug },
      'Links relacionados salvos com sucesso',
    )
  },
  { permissions: 'config.manage' },
)

/**
 * DELETE /api/transparencia/links-relacionados?slug=X — admin
 */
export const DELETE = withAuth(
  async (request: NextRequest) => {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    if (!slug) {
      return createSuccessResponse(null, 'slug obrigatorio', undefined, 400)
    }
    await transparenciaRedirectService.removeLinksRelacionados(slug)
    revalidateTag('transparencia-menu')
    revalidateTag('transparencia-links-relacionados')
    return createSuccessResponse(null, 'Links relacionados removidos')
  },
  { permissions: 'config.manage' },
)
