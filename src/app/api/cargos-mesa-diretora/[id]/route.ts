import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, NotFoundError, validateId } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'
import { cargosMesaDbService } from '@/lib/services/cargos-mesa-db-service'

export const dynamic = 'force-dynamic'

const CargoUpdateSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').optional(),
  ordem: z.number().min(1).optional(),
  obrigatorio: z.boolean().optional()
})

export const GET = withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } },
  _session
) => {
  const id = validateId(params.id)
  const cargo = await cargosMesaDbService.getById(id)
  if (!cargo) throw new NotFoundError('Cargo não encontrado')
  return createSuccessResponse(cargo, 'Cargo encontrado com sucesso')
}, { permissions: 'periodo.view' })

export const PUT = withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } },
  session
) => {
  const id = validateId(params.id)
  const body = await request.json()
  const validatedData = CargoUpdateSchema.parse(body)

  const existing = await cargosMesaDbService.getById(id)
  if (!existing) throw new NotFoundError('Cargo não encontrado')

  const cargo = await cargosMesaDbService.update(id, validatedData)

  await logAudit({
    request, session,
    action: 'CARGO_MESA_UPDATE',
    entity: 'CargoMesaDiretora',
    entityId: cargo.id,
    metadata: { updates: validatedData }
  })

  return createSuccessResponse(cargo, 'Cargo atualizado com sucesso')
}, { permissions: 'periodo.manage' })

export const DELETE = withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } },
  session
) => {
  const id = validateId(params.id)

  const cargo = await cargosMesaDbService.getById(id)
  if (!cargo) throw new NotFoundError('Cargo não encontrado')

  // Excluir membros relacionados primeiro
  await prisma.membroMesaDiretora.deleteMany({ where: { cargoId: id } })
  await cargosMesaDbService.remove(id)

  await logAudit({
    request, session,
    action: 'CARGO_MESA_DELETE',
    entity: 'CargoMesaDiretora',
    entityId: id,
    metadata: { nome: cargo.nome }
  })

  return createSuccessResponse(null, 'Cargo excluído com sucesso')
}, { permissions: 'periodo.manage' })
