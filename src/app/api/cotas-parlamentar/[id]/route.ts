import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
import { withErrorHandler, createSuccessResponse, NotFoundError } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

const DocumentoSchema = z.object({
  nome: z.string().min(1),
  url: z.string().url()
})

const UpdateSchema = z.object({
  mes: z.number().int().min(1).max(12).nullable().optional(),
  ano: z.number().int().optional(),
  parlamentarId: z.string().nullable().optional(),
  nomeParlamentar: z.string().nullable().optional(),
  observacao: z.string().min(1).optional(),
  documentos: z.array(DocumentoSchema).nullable().optional(),
  valor: z.number().nullable().optional(),
  tipo: z.enum(['DECLARACAO', 'GASTO']).optional()
})

export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const item = await prisma.cotaParlamentar.findUnique({ where: { id } })
  if (!item) throw new NotFoundError('Cota parlamentar nao encontrada')
  return createSuccessResponse(item)
})

export const PUT = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const body = await request.json()
  const data = UpdateSchema.parse(body)

  const updated = await prisma.cotaParlamentar.update({
    where: { id },
    data: {
      ...(data.mes !== undefined ? { mes: data.mes } : {}),
      ...(data.ano !== undefined ? { ano: data.ano } : {}),
      ...(data.parlamentarId !== undefined ? { parlamentarId: data.parlamentarId } : {}),
      ...(data.nomeParlamentar !== undefined ? { nomeParlamentar: data.nomeParlamentar } : {}),
      ...(data.observacao !== undefined ? { observacao: data.observacao } : {}),
      ...(data.documentos !== undefined ? { documentos: data.documentos ?? undefined } : {}),
      ...(data.valor !== undefined ? { valor: data.valor } : {}),
      ...(data.tipo !== undefined ? { tipo: data.tipo } : {})
    }
  })

  return createSuccessResponse(updated, 'Cota parlamentar atualizada')
}, { permissions: 'transparencia.manage' })

export const DELETE = withAuth(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  await prisma.cotaParlamentar.delete({ where: { id } })
  return createSuccessResponse(null, 'Cota parlamentar removida')
}, { permissions: 'transparencia.manage' })
