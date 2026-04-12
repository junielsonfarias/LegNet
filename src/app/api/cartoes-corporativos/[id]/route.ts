import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
import { withErrorHandler, createSuccessResponse, NotFoundError } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

const UpdateSchema = z.object({
  portador: z.string().min(1).optional(),
  cnpjCpfPortador: z.string().nullish(),
  estabelecimento: z.string().min(1).optional(),
  cnpjEstabelecimento: z.string().nullish(),
  dataCompra: z.string().optional(),
  valor: z.number().optional(),
  descricao: z.string().min(1).optional(),
  numeroFatura: z.string().nullish(),
  numeroParcela: z.number().int().nullish(),
  ano: z.number().int().optional(),
  mes: z.number().int().min(1).max(12).optional(),
  observacoes: z.string().nullish(),
  arquivo: z.string().nullish()
})

export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const item = await prisma.cartaoCorporativo.findUnique({ where: { id } })
  if (!item) throw new NotFoundError('Lancamento nao encontrado')
  return createSuccessResponse(item)
})

export const PUT = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const body = await request.json()
  const data = UpdateSchema.parse(body)
  const updated = await prisma.cartaoCorporativo.update({
    where: { id },
    data: { ...data, dataCompra: data.dataCompra ? new Date(data.dataCompra) : undefined }
  })
  return createSuccessResponse(updated, 'Lancamento atualizado')
}, { permissions: 'transparencia.manage' })

export const DELETE = withAuth(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  await prisma.cartaoCorporativo.delete({ where: { id } })
  return createSuccessResponse(null, 'Lancamento removido')
}, { permissions: 'transparencia.manage' })
