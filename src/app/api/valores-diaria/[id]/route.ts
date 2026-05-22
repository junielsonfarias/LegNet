import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
import { withErrorHandler, createSuccessResponse, NotFoundError } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

const ABRANGENCIAS = ['MUNICIPAL', 'ESTADUAL', 'NACIONAL', 'INTERNACIONAL'] as const

const UpdateSchema = z.object({
  categoria: z.string().min(1).optional(),
  abrangencia: z.enum(ABRANGENCIAS).optional(),
  descricao: z.string().nullable().optional(),
  valor: z.number().min(0).optional(),
  ano: z.number().int().min(1900).max(3000).optional(),
  ativo: z.boolean().optional(),
  observacoes: z.string().nullable().optional()
})

export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const item = await prisma.valorDiariaTabela.findUnique({ where: { id } })
  if (!item) throw new NotFoundError('Valor de diaria nao encontrado')
  return createSuccessResponse(item)
})

export const PUT = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const body = await request.json()
  const data = UpdateSchema.parse(body)

  const updated = await prisma.valorDiariaTabela.update({
    where: { id },
    data: {
      ...(data.categoria !== undefined ? { categoria: data.categoria } : {}),
      ...(data.abrangencia !== undefined ? { abrangencia: data.abrangencia } : {}),
      ...(data.descricao !== undefined ? { descricao: data.descricao } : {}),
      ...(data.valor !== undefined ? { valor: data.valor } : {}),
      ...(data.ano !== undefined ? { ano: data.ano } : {}),
      ...(data.ativo !== undefined ? { ativo: data.ativo } : {}),
      ...(data.observacoes !== undefined ? { observacoes: data.observacoes } : {})
    }
  })

  return createSuccessResponse(updated, 'Valor de diaria atualizado')
}, { permissions: 'transparencia.manage' })

export const DELETE = withAuth(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  await prisma.valorDiariaTabela.delete({ where: { id } })
  return createSuccessResponse(null, 'Valor de diaria removido')
}, { permissions: 'transparencia.manage' })
