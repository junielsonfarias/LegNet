import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
import { withErrorHandler, createSuccessResponse, NotFoundError } from '@/lib/error-handler'
import { createLogger } from '@/lib/logging/logger'

const log = createLogger('api/rh/cargos-detalhe')

export const dynamic = 'force-dynamic'

const TIPOS = ['EFETIVO', 'COMISSIONADO', 'FUNCAO_GRATIFICADA', 'ELETIVO'] as const

const UpdateSchema = z.object({
  planoCargosId: z.string().nullable().optional(),
  denominacao: z.string().min(1).optional(),
  tipo: z.enum(TIPOS).optional(),
  quantidadeVagas: z.number().int().min(0).nullable().optional(),
  cargaHoraria: z.number().int().min(0).nullable().optional(),
  salarioBase: z.number().min(0).optional(),
  observacoes: z.string().nullable().optional()
})

export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const item = await prisma.cargo.findUnique({
    where: { id },
    include: { planoCargos: { select: { id: true, nome: true, ano: true } } }
  })
  if (!item) throw new NotFoundError('Cargo nao encontrado')
  return createSuccessResponse(item)
})

export const PUT = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const body = await request.json()
  const data = UpdateSchema.parse(body)

  const updated = await prisma.cargo.update({
    where: { id },
    data: {
      ...(data.planoCargosId !== undefined ? { planoCargosId: data.planoCargosId } : {}),
      ...(data.denominacao !== undefined ? { denominacao: data.denominacao } : {}),
      ...(data.tipo !== undefined ? { tipo: data.tipo } : {}),
      ...(data.quantidadeVagas !== undefined ? { quantidadeVagas: data.quantidadeVagas } : {}),
      ...(data.cargaHoraria !== undefined ? { cargaHoraria: data.cargaHoraria } : {}),
      ...(data.salarioBase !== undefined ? { salarioBase: data.salarioBase } : {}),
      ...(data.observacoes !== undefined ? { observacoes: data.observacoes } : {})
    }
  })

  log.info('Cargo atualizado', {
    action: 'cargo_update',
    id,
    tipo: updated.tipo
  })

  return createSuccessResponse(updated, 'Cargo atualizado')
}, { permissions: 'transparencia.manage' })

export const DELETE = withAuth(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  await prisma.cargo.delete({ where: { id } })

  log.info('Cargo removido', {
    action: 'cargo_delete',
    id
  })

  return createSuccessResponse(null, 'Cargo removido')
}, { permissions: 'transparencia.manage' })
