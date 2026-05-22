import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
import { createSuccessResponse, NotFoundError } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

const TIPOS = ['PROCESSADO', 'NAO_PROCESSADO'] as const

const UpdateSchema = z.object({
  ano: z.number().int().min(1900).max(3000).optional(),
  credor: z.string().min(1).optional(),
  cnpjCpf: z.string().nullable().optional(),
  numeroEmpenho: z.string().nullable().optional(),
  descricao: z.string().nullable().optional(),
  tipo: z.enum(TIPOS).optional(),
  valorInscrito: z.number().min(0).optional(),
  valorPago: z.number().min(0).optional(),
  valorCancelado: z.number().min(0).optional(),
  observacoes: z.string().nullable().optional()
})

export const GET = withAuth(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const item = await prisma.restoPagar.findUnique({ where: { id } })
  if (!item) throw new NotFoundError('Resto a pagar nao encontrado')
  return createSuccessResponse(item)
}, { permissions: 'transparencia.manage' })

export const PUT = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const body = await request.json()
  const data = UpdateSchema.parse(body)

  const updated = await prisma.restoPagar.update({
    where: { id },
    data: {
      ...(data.ano !== undefined ? { ano: data.ano } : {}),
      ...(data.credor !== undefined ? { credor: data.credor } : {}),
      ...(data.cnpjCpf !== undefined ? { cnpjCpf: data.cnpjCpf } : {}),
      ...(data.numeroEmpenho !== undefined ? { numeroEmpenho: data.numeroEmpenho } : {}),
      ...(data.descricao !== undefined ? { descricao: data.descricao } : {}),
      ...(data.tipo !== undefined ? { tipo: data.tipo } : {}),
      ...(data.valorInscrito !== undefined ? { valorInscrito: data.valorInscrito } : {}),
      ...(data.valorPago !== undefined ? { valorPago: data.valorPago } : {}),
      ...(data.valorCancelado !== undefined ? { valorCancelado: data.valorCancelado } : {}),
      ...(data.observacoes !== undefined ? { observacoes: data.observacoes } : {})
    }
  })

  return createSuccessResponse(updated, 'Resto a pagar atualizado')
}, { permissions: 'transparencia.manage' })

export const DELETE = withAuth(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  await prisma.restoPagar.delete({ where: { id } })
  return createSuccessResponse(null, 'Resto a pagar removido')
}, { permissions: 'transparencia.manage' })
