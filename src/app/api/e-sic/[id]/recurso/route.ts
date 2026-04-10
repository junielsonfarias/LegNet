import { NextRequest } from 'next/server'
import { z } from 'zod'
import { esicService } from '@/lib/services/esic-service'
import { withErrorHandler, createSuccessResponse, ValidationError, NotFoundError } from '@/lib/error-handler'

const RecursoSchema = z.object({
  motivo: z.string().min(10).max(5000).trim(),
  instancia: z.number().int().min(1).max(3).optional().default(1)
})

export const dynamic = 'force-dynamic'

/**
 * POST - Registrar recurso em solicitação e-SIC (público)
 * Não requer autenticação
 */
export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const body = await request.json()

  const parsed = RecursoSchema.safeParse(body)
  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors.map(e => e.message).join(', '))
  }

  const solicitacao = await esicService.getById(id)
  if (!solicitacao) {
    throw new NotFoundError('Solicitação')
  }

  const recurso = await esicService.criarRecurso(id, parsed.data.motivo, parsed.data.instancia)

  return createSuccessResponse(recurso, 'Recurso registrado com sucesso', undefined, 201)
})
