import { NextRequest } from 'next/server'
import { z } from 'zod'
import {
  withErrorHandler,
  createSuccessResponse
} from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { transparenciaRedirectService } from '@/lib/services/transparencia-redirect-service'

export const dynamic = 'force-dynamic'

const RedirectSchema = z.object({
  slug: z.string().min(1),
  enabled: z.boolean(),
  url: z.string().url('URL inválida').or(z.literal('')),
  label: z.string().optional()
})

// GET - Listar redirecionamentos (PUBLICO - necessario para o frontend verificar)
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')

  if (slug) {
    const redirect = await transparenciaRedirectService.get(slug)
    return createSuccessResponse(redirect, 'Redirecionamento consultado')
  }

  const fullMap = await transparenciaRedirectService.getFullMap()
  return createSuccessResponse(fullMap, 'Configurações de transparência')
})

// POST - Salvar redirecionamento (ADMIN)
export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json()
  const data = RedirectSchema.parse(body)

  if (data.enabled && !data.url) {
    return createSuccessResponse(null, 'URL é obrigatória quando redirecionamento está ativo', undefined, 400)
  }

  const result = await transparenciaRedirectService.set(data.slug, {
    enabled: data.enabled,
    url: data.url,
    label: data.label
  })

  return createSuccessResponse(result, 'Redirecionamento salvo com sucesso')
}, { permissions: 'config.manage' })
