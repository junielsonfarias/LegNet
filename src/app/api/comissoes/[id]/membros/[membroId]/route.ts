import { NextRequest } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import {
  createSuccessResponse,
  NotFoundError,
  validateId,
  ValidationError,
  withErrorHandler
} from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { syncComissaoHistorico } from '@/lib/participation-history'

export const dynamic = 'force-dynamic'

const MembroComissaoUpdateSchema = z.object({
  parlamentarId: z.string().min(1).optional(),
  cargo: z.enum(['PRESIDENTE', 'VICE_PRESIDENTE', 'RELATOR', 'MEMBRO']).optional(),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional().nullable(),
  ativo: z.boolean().optional(),
  observacoes: z.string().optional()
})

export const PUT = withAuth(withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string; membroId: string } }
) => {
  const comissaoId = validateId(params.id, 'Comissão')
  const membroId = validateId(params.membroId, 'Membro da comissão')

  const body = await request.json()
  const data = MembroComissaoUpdateSchema.parse(body)

  const [comissao, membro] = await Promise.all([
    prisma.comissao.findUnique({ where: { id: comissaoId } }),
    prisma.membroComissao.findUnique({ where: { id: membroId } })
  ])

  if (!comissao) {
    throw new NotFoundError('Comissão')
  }

  if (!membro || membro.comissaoId !== comissaoId) {
    throw new NotFoundError('Membro da comissão')
  }

  const inicio = data.dataInicio ? new Date(data.dataInicio) : null
  const fim = data.dataFim !== undefined ? (data.dataFim ? new Date(data.dataFim) : null) : undefined

  if (inicio && Number.isNaN(inicio.getTime())) {
    throw new ValidationError('Data de início inválida')
  }

  if (fim !== undefined && fim !== null && Number.isNaN(fim.getTime())) {
    throw new ValidationError('Data de fim inválida')
  }

  if (inicio && fim && fim < inicio) {
    throw new ValidationError('A data de fim não pode ser anterior à data de início')
  }

  const updated = await prisma.membroComissao.update({
    where: { id: membroId },
    data: {
      ...(data.parlamentarId && { parlamentarId: data.parlamentarId }),
      ...(data.cargo && { cargo: data.cargo }),
      ...(inicio && { dataInicio: inicio }),
      ...(fim !== undefined && { dataFim: fim }),
      ...(data.ativo !== undefined && { ativo: data.ativo }),
      ...(data.observacoes !== undefined && { observacoes: data.observacoes || null })
    },
    include: {
      parlamentar: {
        select: {
          id: true,
          nome: true,
          apelido: true,
          partido: true
        }
      }
    }
  })

  await syncComissaoHistorico(comissaoId)

  return createSuccessResponse(updated, 'Membro atualizado com sucesso')
}), { permissions: 'comissao.manage' })

export const DELETE = withAuth(withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: { id: string; membroId: string } }
) => {
  const comissaoId = validateId(params.id, 'Comissão')
  const membroId = validateId(params.membroId, 'Membro da comissão')

  const membro = await prisma.membroComissao.findUnique({ where: { id: membroId } })
  if (!membro || membro.comissaoId !== comissaoId) {
    throw new NotFoundError('Membro da comissão')
  }

  await prisma.membroComissao.delete({ where: { id: membroId } })

  await syncComissaoHistorico(comissaoId)

  return createSuccessResponse(null, 'Membro removido com sucesso')
}), { permissions: 'comissao.manage' })

