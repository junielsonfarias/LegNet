import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
import { withErrorHandler, createSuccessResponse, NotFoundError } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

const UpdateSchema = z.object({
  codigo: z.string().min(1).optional(),
  nome: z.string().min(1).optional(),
  descricao: z.string().nullish(),
  tipo: z.enum(['PROGRAMA', 'ACAO']).optional(),
  ano: z.number().int().optional(),
  valorPrevisto: z.number().nullish(),
  valorExecutado: z.number().nullish(),
  unidadeResponsavel: z.string().nullish(),
  metaFisica: z.string().nullish(),
  ativo: z.boolean().optional()
})

export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const item = await prisma.programaAcao.findUnique({ where: { id } })
  if (!item) throw new NotFoundError('Nao encontrado')
  return createSuccessResponse(item)
})

export const PUT = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const body = await request.json()
  const data = UpdateSchema.parse(body)
  const updated = await prisma.programaAcao.update({ where: { id }, data })
  return createSuccessResponse(updated, 'Atualizado')
}, { permissions: 'transparencia.manage' })

export const DELETE = withAuth(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  await prisma.programaAcao.delete({ where: { id } })
  return createSuccessResponse(null, 'Removido')
}, { permissions: 'transparencia.manage' })
