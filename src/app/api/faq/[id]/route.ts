import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
import { withErrorHandler, createSuccessResponse, NotFoundError } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

const UpdateSchema = z.object({
  pergunta: z.string().min(1).optional(),
  resposta: z.string().min(1).optional(),
  categoria: z.string().nullable().optional(),
  ordem: z.number().int().optional(),
  ativo: z.boolean().optional()
})

export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const item = await prisma.perguntaFrequente.findUnique({ where: { id } })
  if (!item) throw new NotFoundError('Pergunta nao encontrada')
  return createSuccessResponse(item)
})

export const PUT = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const body = await request.json()
  const data = UpdateSchema.parse(body)

  const updated = await prisma.perguntaFrequente.update({
    where: { id },
    data: {
      ...(data.pergunta !== undefined ? { pergunta: data.pergunta } : {}),
      ...(data.resposta !== undefined ? { resposta: data.resposta } : {}),
      ...(data.categoria !== undefined ? { categoria: data.categoria } : {}),
      ...(data.ordem !== undefined ? { ordem: data.ordem } : {}),
      ...(data.ativo !== undefined ? { ativo: data.ativo } : {})
    }
  })

  return createSuccessResponse(updated, 'Pergunta atualizada')
}, { permissions: 'transparencia.manage' })

export const DELETE = withAuth(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  await prisma.perguntaFrequente.delete({ where: { id } })
  return createSuccessResponse(null, 'Pergunta removida')
}, { permissions: 'transparencia.manage' })
