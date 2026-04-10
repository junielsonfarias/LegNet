import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createSuccessResponse, NotFoundError, validateId, withErrorHandler } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const OficioUpdateSchema = z.object({
  numero: z.string().min(1).nullish().transform(v => v ?? undefined),
  data: z.string().nullish().transform(v => v ?? undefined),
  remetente: z.string().min(1).nullish().transform(v => v ?? undefined),
  assunto: z.string().min(1).nullish().transform(v => v ?? undefined),
  arquivo: z.string().nullable().optional(),
  observacoes: z.string().nullable().optional(),
  lido: z.boolean().nullish().transform(v => v ?? undefined)
})

export const GET = withAuth(withErrorHandler(async (
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id } = await context.params
  const oficioId = validateId(id, 'Ofício')

  const oficio = await prisma.oficio.findUnique({ where: { id: oficioId } })
  if (!oficio) throw new NotFoundError('Ofício')

  return createSuccessResponse(oficio)
}), { permissions: 'sessao.view' })

export const PUT = withAuth(withErrorHandler(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
  session
) => {
  const { id } = await context.params
  const oficioId = validateId(id, 'Ofício')
  const body = await request.json()
  const data = OficioUpdateSchema.parse(body)

  const existing = await prisma.oficio.findUnique({ where: { id: oficioId } })
  if (!existing) throw new NotFoundError('Ofício')

  const updateData: Record<string, unknown> = {}
  if (data.numero !== undefined) updateData.numero = data.numero
  if (data.data !== undefined) updateData.data = new Date(data.data)
  if (data.remetente !== undefined) updateData.remetente = data.remetente
  if (data.assunto !== undefined) updateData.assunto = data.assunto
  if (data.arquivo !== undefined) updateData.arquivo = data.arquivo
  if (data.observacoes !== undefined) updateData.observacoes = data.observacoes
  if (data.lido !== undefined) updateData.lido = data.lido

  const oficio = await prisma.oficio.update({ where: { id: oficioId }, data: updateData })

  await logAudit({
    request, session,
    action: 'OFICIO_UPDATE',
    entity: 'Oficio',
    entityId: oficioId,
    metadata: { numero: oficio.numero }
  })

  return createSuccessResponse(oficio, 'Ofício atualizado com sucesso')
}), { permissions: 'sessao.manage' })

export const DELETE = withAuth(withErrorHandler(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
  session
) => {
  const { id } = await context.params
  const oficioId = validateId(id, 'Ofício')

  const existing = await prisma.oficio.findUnique({ where: { id: oficioId } })
  if (!existing) throw new NotFoundError('Ofício')

  await prisma.oficio.delete({ where: { id: oficioId } })

  await logAudit({
    request, session,
    action: 'OFICIO_DELETE',
    entity: 'Oficio',
    entityId: oficioId,
    metadata: { numero: existing.numero }
  })

  return createSuccessResponse(null, 'Ofício removido com sucesso')
}), { permissions: 'sessao.manage' })
