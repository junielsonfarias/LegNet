import { NextRequest } from 'next/server'
import { z } from 'zod'

import {
  createSuccessResponse,
  NotFoundError,
  validateId,
  ValidationError,
  withErrorHandler
} from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { syncComissaoHistorico } from '@/lib/participation-history'
import { comissaoDbService } from '@/lib/services/comissao-db-service'

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
  context: { params: Promise<{ id: string; membroId: string }> }
) => {
  const { id: rawId, membroId: rawMembroId } = await context.params
  const comissaoId = validateId(rawId, 'Comissão')
  const membroId = validateId(rawMembroId, 'Membro da comissão')

  const body = await request.json()
  const data = MembroComissaoUpdateSchema.parse(body)

  const [comissao, membro] = await Promise.all([
    comissaoDbService.exists(comissaoId),
    comissaoDbService.getMembroById(membroId)
  ])

  if (!comissao) {
    throw new NotFoundError('Comissão')
  }

  if (!membro || membro.comissaoId !== comissaoId) {
    throw new NotFoundError('Membro da comissão')
  }

  const inicio = data.dataInicio ? new Date(data.dataInicio) : undefined
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

  const updated = await comissaoDbService.updateMembro(membroId, {
    parlamentarId: data.parlamentarId,
    cargo: data.cargo,
    dataInicio: inicio,
    dataFim: fim,
    ativo: data.ativo,
    observacoes: data.observacoes !== undefined ? (data.observacoes || null) : undefined
  })

  await syncComissaoHistorico(comissaoId)

  return createSuccessResponse(updated, 'Membro atualizado com sucesso')
}), { permissions: 'comissao.manage' })

export const DELETE = withAuth(withErrorHandler(async (
  _request: NextRequest,
  context: { params: Promise<{ id: string; membroId: string }> }
) => {
  const { id: rawId, membroId: rawMembroId } = await context.params
  const comissaoId = validateId(rawId, 'Comissão')
  const membroId = validateId(rawMembroId, 'Membro da comissão')

  const membro = await comissaoDbService.getMembroById(membroId)
  if (!membro || membro.comissaoId !== comissaoId) {
    throw new NotFoundError('Membro da comissão')
  }

  await comissaoDbService.removeMembro(membroId)

  await syncComissaoHistorico(comissaoId)

  return createSuccessResponse(null, 'Membro removido com sucesso')
}), { permissions: 'comissao.manage' })
