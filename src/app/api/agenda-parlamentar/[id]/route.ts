import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
import { withErrorHandler, createSuccessResponse, NotFoundError } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

const TIPOS = ['COMPROMISSO', 'REUNIAO', 'EVENTO', 'VIAGEM', 'AUDIENCIA'] as const

const UpdateSchema = z.object({
  parlamentarId: z.string().nullable().optional(),
  parlamentarNome: z.string().nullable().optional(),
  titulo: z.string().min(1).optional(),
  descricao: z.string().nullable().optional(),
  local: z.string().nullable().optional(),
  dataInicio: z.string().min(1).optional(),
  dataFim: z.string().nullable().optional(),
  tipo: z.enum(TIPOS).optional()
})

export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const item = await prisma.agendaParlamentar.findUnique({ where: { id } })
  if (!item) throw new NotFoundError('Compromisso nao encontrado')
  return createSuccessResponse(item)
})

export const PUT = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const body = await request.json()
  const data = UpdateSchema.parse(body)

  const updated = await prisma.agendaParlamentar.update({
    where: { id },
    data: {
      ...(data.parlamentarId !== undefined ? { parlamentarId: data.parlamentarId } : {}),
      ...(data.parlamentarNome !== undefined ? { parlamentarNome: data.parlamentarNome } : {}),
      ...(data.titulo !== undefined ? { titulo: data.titulo } : {}),
      ...(data.descricao !== undefined ? { descricao: data.descricao } : {}),
      ...(data.local !== undefined ? { local: data.local } : {}),
      ...(data.dataInicio !== undefined ? { dataInicio: new Date(data.dataInicio) } : {}),
      ...(data.dataFim !== undefined
        ? { dataFim: data.dataFim ? new Date(data.dataFim) : null }
        : {}),
      ...(data.tipo !== undefined ? { tipo: data.tipo } : {})
    }
  })

  return createSuccessResponse(updated, 'Compromisso atualizado')
}, { permissions: 'transparencia.manage' })

export const DELETE = withAuth(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  await prisma.agendaParlamentar.delete({ where: { id } })
  return createSuccessResponse(null, 'Compromisso removido')
}, { permissions: 'transparencia.manage' })
