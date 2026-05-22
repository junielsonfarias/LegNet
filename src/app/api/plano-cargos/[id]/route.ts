import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
import { withErrorHandler, createSuccessResponse, NotFoundError } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

const UpdateSchema = z.object({
  nome: z.string().min(1).optional(),
  lei: z.string().nullable().optional(),
  ano: z.number().int().min(1900).max(3000).optional(),
  descricao: z.string().nullable().optional(),
  ativo: z.boolean().optional()
})

export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const item = await prisma.planoCargos.findUnique({
    where: { id },
    include: { cargos: { orderBy: { denominacao: 'asc' } } }
  })
  if (!item) throw new NotFoundError('Plano de cargos nao encontrado')
  return createSuccessResponse(item)
})

export const PUT = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const body = await request.json()
  const data = UpdateSchema.parse(body)

  const updated = await prisma.planoCargos.update({
    where: { id },
    data: {
      ...(data.nome !== undefined ? { nome: data.nome } : {}),
      ...(data.lei !== undefined ? { lei: data.lei } : {}),
      ...(data.ano !== undefined ? { ano: data.ano } : {}),
      ...(data.descricao !== undefined ? { descricao: data.descricao } : {}),
      ...(data.ativo !== undefined ? { ativo: data.ativo } : {})
    }
  })

  return createSuccessResponse(updated, 'Plano de cargos atualizado')
}, { permissions: 'transparencia.manage' })

export const DELETE = withAuth(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  await prisma.planoCargos.delete({ where: { id } })
  return createSuccessResponse(null, 'Plano de cargos removido')
}, { permissions: 'transparencia.manage' })
