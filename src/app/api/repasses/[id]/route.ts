import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
import { withErrorHandler, createSuccessResponse, NotFoundError } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

const UpdateSchema = z.object({
  orgaoOrigem: z.string().min(1).optional(),
  programa: z.string().nullish(),
  acao: z.string().nullish(),
  valor: z.number().optional(),
  data: z.string().optional(),
  ano: z.number().int().optional(),
  mes: z.number().int().min(1).max(12).optional(),
  fonteRecurso: z.string().nullish(),
  observacoes: z.string().nullish(),
  arquivo: z.string().nullish()
})

export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const item = await prisma.repasse.findUnique({ where: { id } })
  if (!item) throw new NotFoundError('Repasse nao encontrado')
  return createSuccessResponse(item)
})

export const PUT = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const body = await request.json()
  const data = UpdateSchema.parse(body)
  const updated = await prisma.repasse.update({
    where: { id },
    data: { ...data, data: data.data ? new Date(data.data) : undefined }
  })
  return createSuccessResponse(updated, 'Repasse atualizado')
}, { permissions: 'transparencia.manage' })

export const DELETE = withAuth(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  await prisma.repasse.delete({ where: { id } })
  return createSuccessResponse(null, 'Repasse removido')
}, { permissions: 'transparencia.manage' })
