import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withErrorHandler,
  createSuccessResponse, getErrorMessage } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { transparenciaRedirectService } from '@/lib/services/transparencia-redirect-service'

export const dynamic = 'force-dynamic'

const PeriodoSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  url: z.string().url('URL inválida').optional().or(z.literal('')),
  hrefInterno: z.string().optional().or(z.literal('')),
  ano: z.number().int().nullish(),
  ordem: z.number().int(),
  ativo: z.boolean()
})

const ConfigPeriodosSchema = z.object({
  slug: z.string().min(1),
  enabled: z.boolean(),
  titulo: z.string().optional(),
  descricao: z.string().optional(),
  periodos: z.array(PeriodoSchema)
})

// GET - publico, consulta config de periodos
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')

  if (slug) {
    const config = await transparenciaRedirectService.getPeriodos(slug)
    return createSuccessResponse(config, 'Periodos consultados')
  }

  const all = await transparenciaRedirectService.getAllPeriodos()
  return createSuccessResponse(all, 'Periodos listados')
})

// POST - admin, salva config de periodos
export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json()
  console.log('[periodos POST] body recebido:', JSON.stringify(body))
  let data
  try {
    data = ConfigPeriodosSchema.parse(body)
  } catch (e) {
    const zerr = (e as { errors?: unknown }).errors
    console.error('[periodos POST] Zod falhou:', zerr ?? getErrorMessage(e))
    throw e
  }
  console.log('[periodos POST] validado, salvando slug=', data.slug)

  const result = await transparenciaRedirectService.setPeriodos(data.slug, {
    enabled: data.enabled,
    titulo: data.titulo,
    descricao: data.descricao,
    periodos: data.periodos
  })

  console.log('[periodos POST] salvo com sucesso:', data.slug)
  return createSuccessResponse(result, 'Periodos salvos com sucesso')
}, { permissions: 'config.manage' })

// DELETE - admin, remove config de periodos
export const DELETE = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')
  if (!slug) {
    return createSuccessResponse(null, 'slug obrigatorio', undefined, 400)
  }
  await transparenciaRedirectService.removePeriodos(slug)
  return createSuccessResponse(null, 'Periodos removidos')
}, { permissions: 'config.manage' })
