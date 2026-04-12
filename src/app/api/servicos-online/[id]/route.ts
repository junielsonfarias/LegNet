import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
import { withErrorHandler, createSuccessResponse, NotFoundError } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

const UpdateSchema = z.object({
  nome: z.string().min(1).optional(),
  descricao: z.string().nullish(),
  url: z.string().url().optional(),
  categoria: z.string().nullish(),
  icone: z.string().nullish(),
  publicoAlvo: z.string().nullish(),
  requisitos: z.string().nullish(),
  ordem: z.number().int().optional(),
  ativo: z.boolean().optional()
})

export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const item = await prisma.servicoOnline.findUnique({ where: { id } })
  if (!item) throw new NotFoundError('Servico nao encontrado')
  return createSuccessResponse(item)
})

export const PUT = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const body = await request.json()
  const data = UpdateSchema.parse(body)
  const updated = await prisma.servicoOnline.update({ where: { id }, data })
  return createSuccessResponse(updated, 'Servico atualizado')
}, { permissions: 'transparencia.manage' })

export const DELETE = withAuth(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  await prisma.servicoOnline.delete({ where: { id } })
  return createSuccessResponse(null, 'Servico removido')
}, { permissions: 'transparencia.manage' })
