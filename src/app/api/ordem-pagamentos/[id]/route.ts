import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
import { withErrorHandler, createSuccessResponse, NotFoundError } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

const UpdateSchema = z.object({
  numero: z.string().min(1).optional(),
  ano: z.number().int().optional(),
  mes: z.number().int().min(1).max(12).optional(),
  data: z.string().optional(),
  credor: z.string().min(1).optional(),
  cnpjCpf: z.string().optional(),
  valor: z.number().optional(),
  dataVencimento: z.string().nullish(),
  dataPagamento: z.string().nullish(),
  ordemCronologica: z.number().int().nullish(),
  fonteRecurso: z.string().nullish(),
  despesaId: z.string().nullish(),
  observacoes: z.string().nullish()
})

export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const item = await prisma.ordemPagamento.findUnique({ where: { id }, include: { despesa: true } })
  if (!item) throw new NotFoundError('Ordem nao encontrada')
  return createSuccessResponse(item)
})

export const PUT = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const body = await request.json()
  const data = UpdateSchema.parse(body)
  const updated = await prisma.ordemPagamento.update({
    where: { id },
    data: {
      ...data,
      data: data.data ? new Date(data.data) : undefined,
      dataVencimento: data.dataVencimento ? new Date(data.dataVencimento) : undefined,
      dataPagamento: data.dataPagamento ? new Date(data.dataPagamento) : undefined
    }
  })
  return createSuccessResponse(updated, 'Ordem atualizada')
}, { permissions: 'transparencia.manage' })

export const DELETE = withAuth(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  await prisma.ordemPagamento.delete({ where: { id } })
  return createSuccessResponse(null, 'Ordem removida')
}, { permissions: 'transparencia.manage' })
