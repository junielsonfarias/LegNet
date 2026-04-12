import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
import { withErrorHandler, createSuccessResponse, NotFoundError } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

const UpdateSchema = z.object({
  titulo: z.string().min(1).optional(),
  descricao: z.string().nullish(),
  ano: z.number().int().optional(),
  mes: z.number().int().nullish(),
  dataPublicacao: z.string().optional(),
  arquivo: z.string().nullish(),
  url: z.string().url().nullish().or(z.literal('')),
  responsavel: z.string().nullish(),
  observacoes: z.string().nullish(),
  status: z.string().optional()
})

export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const doc = await prisma.documentoTransparencia.findUnique({ where: { id } })
  if (!doc) throw new NotFoundError('Documento nao encontrado')
  return createSuccessResponse(doc)
})

export const PUT = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const body = await request.json()
  const data = UpdateSchema.parse(body)
  const updated = await prisma.documentoTransparencia.update({
    where: { id },
    data: {
      ...data,
      dataPublicacao: data.dataPublicacao ? new Date(data.dataPublicacao) : undefined
    }
  })
  return createSuccessResponse(updated, 'Documento atualizado')
}, { permissions: 'transparencia.manage' })

export const DELETE = withAuth(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  await prisma.documentoTransparencia.delete({ where: { id } })
  return createSuccessResponse(null, 'Documento removido')
}, { permissions: 'transparencia.manage' })
