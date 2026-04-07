import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createSuccessResponse, NotFoundError, validateId } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'
import { cargosMesaDbService } from '@/lib/services/cargos-mesa-db-service'

export const dynamic = 'force-dynamic'

const CargoUpdateSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').nullish().transform(v => v ?? undefined),
  ordem: z.number().min(1).nullish().transform(v => v ?? undefined),
  obrigatorio: z.boolean().nullish().transform(v => v ?? undefined)
})

export const GET = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
  _session
) => {
  const { id: rawId } = await context.params
  const id = validateId(rawId)
  const cargo = await cargosMesaDbService.getById(id)
  if (!cargo) throw new NotFoundError('Cargo não encontrado')
  return createSuccessResponse(cargo, 'Cargo encontrado com sucesso')
}, { permissions: 'periodo.view' })

export const PUT = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
  session
) => {
  const { id: rawId } = await context.params
  const id = validateId(rawId)
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
  context: { params: Promise<{ id: string }> },
  session
) => {
  const { id: rawId } = await context.params
  const id = validateId(rawId)

  const cargo = await cargosMesaDbService.getById(id)
  if (!cargo) throw new NotFoundError('Cargo não encontrado')

  // Excluir membros relacionados primeiro, depois o cargo
  await cargosMesaDbService.removeWithMembros(id)

  await logAudit({
    request, session,
    action: 'CARGO_MESA_DELETE',
    entity: 'CargoMesaDiretora',
    entityId: id,
    metadata: { nome: cargo.nome }
  })

  return createSuccessResponse(null, 'Cargo excluído com sucesso')
}, { permissions: 'periodo.manage' })
