import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
import { withErrorHandler, createSuccessResponse, NotFoundError } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

const UpdateSchema = z.object({
  numero: z.string().min(1).optional(),
  serie: z.string().nullish(),
  chaveAcesso: z.string().nullish(),
  fornecedor: z.string().min(1).optional(),
  cnpjCpf: z.string().optional(),
  dataEmissao: z.string().optional(),
  dataLiquidacao: z.string().nullish(),
  dataPagamento: z.string().nullish(),
  valor: z.number().optional(),
  situacao: z.enum(['EMITIDA', 'LIQUIDADA', 'PAGA', 'CANCELADA']).optional(),
  ano: z.number().int().optional(),
  mes: z.number().int().min(1).max(12).optional(),
  despesaId: z.string().nullish(),
  arquivo: z.string().nullish(),
  observacoes: z.string().nullish()
})

export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const item = await prisma.notaFiscal.findUnique({ where: { id }, include: { despesa: true } })
  if (!item) throw new NotFoundError('Nota fiscal nao encontrada')
  return createSuccessResponse(item)
})

export const PUT = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const body = await request.json()
  const data = UpdateSchema.parse(body)
  const updated = await prisma.notaFiscal.update({
    where: { id },
    data: {
      ...data,
      dataEmissao: data.dataEmissao ? new Date(data.dataEmissao) : undefined,
      dataLiquidacao: data.dataLiquidacao ? new Date(data.dataLiquidacao) : undefined,
      dataPagamento: data.dataPagamento ? new Date(data.dataPagamento) : undefined
    }
  })
  return createSuccessResponse(updated, 'Nota fiscal atualizada')
}, { permissions: 'transparencia.manage' })

export const DELETE = withAuth(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  await prisma.notaFiscal.delete({ where: { id } })
  return createSuccessResponse(null, 'Nota fiscal removida')
}, { permissions: 'transparencia.manage' })
