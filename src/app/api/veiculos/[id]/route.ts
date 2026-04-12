import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
import { withErrorHandler, createSuccessResponse, NotFoundError } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

const UpdateSchema = z.object({
  placa: z.string().min(1).optional(),
  marca: z.string().optional(),
  modelo: z.string().optional(),
  anoFabricacao: z.number().int().optional(),
  anoModelo: z.number().int().optional(),
  chassi: z.string().nullish(),
  renavam: z.string().nullish(),
  cor: z.string().nullish(),
  combustivel: z.string().nullish(),
  dataAquisicao: z.string().optional(),
  valorAquisicao: z.number().optional(),
  valorAtual: z.number().nullish(),
  responsavel: z.string().nullish(),
  lotacao: z.string().nullish(),
  situacao: z.enum(['ATIVO', 'INATIVO', 'ALIENADO', 'EM_MANUTENCAO', 'SINISTRADO']).optional(),
  observacoes: z.string().nullish()
})

export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const item = await prisma.veiculo.findUnique({ where: { id } })
  if (!item) throw new NotFoundError('Veiculo nao encontrado')
  return createSuccessResponse(item)
})

export const PUT = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const body = await request.json()
  const data = UpdateSchema.parse(body)
  const updated = await prisma.veiculo.update({
    where: { id },
    data: {
      ...data,
      dataAquisicao: data.dataAquisicao ? new Date(data.dataAquisicao) : undefined
    }
  })
  return createSuccessResponse(updated, 'Veiculo atualizado')
}, { permissions: 'transparencia.manage' })

export const DELETE = withAuth(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  await prisma.veiculo.delete({ where: { id } })
  return createSuccessResponse(null, 'Veiculo removido')
}, { permissions: 'transparencia.manage' })
