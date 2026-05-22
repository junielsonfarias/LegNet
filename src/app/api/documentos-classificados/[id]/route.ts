import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
import { withErrorHandler, createSuccessResponse, NotFoundError } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

const GRAUS = ['RESERVADA', 'SECRETA', 'ULTRASSECRETA'] as const
const SITUACOES = ['CLASSIFICADA', 'DESCLASSIFICADA'] as const

const UpdateSchema = z.object({
  titulo: z.string().min(1).optional(),
  categoria: z.string().nullable().optional(),
  grau: z.enum(GRAUS).optional(),
  fundamentoLegal: z.string().nullable().optional(),
  dataClassificacao: z.string().min(1).optional(),
  prazoAnos: z.number().int().min(1).max(100).optional(),
  dataDesclassificacao: z.string().nullable().optional(),
  situacao: z.enum(SITUACOES).optional(),
  autoridade: z.string().nullable().optional(),
  observacoes: z.string().nullable().optional()
})

export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const item = await prisma.documentoClassificado.findUnique({ where: { id } })
  if (!item) throw new NotFoundError('Documento classificado nao encontrado')
  return createSuccessResponse(item)
})

export const PUT = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const body = await request.json()
  const data = UpdateSchema.parse(body)

  const updated = await prisma.documentoClassificado.update({
    where: { id },
    data: {
      ...(data.titulo !== undefined ? { titulo: data.titulo } : {}),
      ...(data.categoria !== undefined ? { categoria: data.categoria } : {}),
      ...(data.grau !== undefined ? { grau: data.grau } : {}),
      ...(data.fundamentoLegal !== undefined ? { fundamentoLegal: data.fundamentoLegal } : {}),
      ...(data.dataClassificacao !== undefined ? { dataClassificacao: new Date(data.dataClassificacao) } : {}),
      ...(data.prazoAnos !== undefined ? { prazoAnos: data.prazoAnos } : {}),
      ...(data.dataDesclassificacao !== undefined
        ? { dataDesclassificacao: data.dataDesclassificacao ? new Date(data.dataDesclassificacao) : null }
        : {}),
      ...(data.situacao !== undefined ? { situacao: data.situacao } : {}),
      ...(data.autoridade !== undefined ? { autoridade: data.autoridade } : {}),
      ...(data.observacoes !== undefined ? { observacoes: data.observacoes } : {})
    }
  })

  return createSuccessResponse(updated, 'Documento classificado atualizado')
}, { permissions: 'transparencia.manage' })

export const DELETE = withAuth(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  await prisma.documentoClassificado.delete({ where: { id } })
  return createSuccessResponse(null, 'Documento classificado removido')
}, { permissions: 'transparencia.manage' })
