import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
import { withErrorHandler, createSuccessResponse, NotFoundError } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

const UpdateSchema = z.object({
  nome: z.string().min(1).optional(),
  cnpjCpf: z.string().optional(),
  tipoSancao: z.enum(['ADVERTENCIA', 'MULTA', 'SUSPENSAO_TEMPORARIA', 'IMPEDIMENTO', 'DECLARACAO_INIDONEIDADE']).optional(),
  motivo: z.string().min(1).optional(),
  numeroProcesso: z.string().nullish(),
  orgaoSancionador: z.string().min(1).optional(),
  dataInicio: z.string().optional(),
  dataFim: z.string().nullish(),
  ativo: z.boolean().optional(),
  fundamentoLegal: z.string().nullish(),
  observacoes: z.string().nullish(),
  arquivo: z.string().nullish()
})

export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const item = await prisma.fornecedorSancionado.findUnique({ where: { id } })
  if (!item) throw new NotFoundError('Sancao nao encontrada')
  return createSuccessResponse(item)
})

export const PUT = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const body = await request.json()
  const data = UpdateSchema.parse(body)
  const updated = await prisma.fornecedorSancionado.update({
    where: { id },
    data: {
      ...data,
      dataInicio: data.dataInicio ? new Date(data.dataInicio) : undefined,
      dataFim: data.dataFim ? new Date(data.dataFim) : undefined
    }
  })
  return createSuccessResponse(updated, 'Sancao atualizada')
}, { permissions: 'transparencia.manage' })

export const DELETE = withAuth(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  await prisma.fornecedorSancionado.delete({ where: { id } })
  return createSuccessResponse(null, 'Sancao removida')
}, { permissions: 'transparencia.manage' })
