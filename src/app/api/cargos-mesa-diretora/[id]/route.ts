import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, NotFoundError, validateId } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'

// Configurar para renderização dinâmica
export const dynamic = 'force-dynamic'

// Schema de validação para atualização
const CargoUpdateSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').optional(),
  ordem: z.number().min(1).optional(),
  obrigatorio: z.boolean().optional()
})

// GET - Buscar cargo por ID
export const GET = withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } },
  _session
) => {
  const id = validateId(params.id)

  const cargo = await prisma.cargoMesaDiretora.findUnique({
    where: { id },
    include: {
      periodo: {
        include: { legislatura: true }
      },
      membros: {
        include: { parlamentar: true }
      }
    }
  })

  if (!cargo) {
    throw new NotFoundError('Cargo não encontrado')
  }

  return createSuccessResponse(cargo, 'Cargo encontrado com sucesso')
}, { permissions: 'periodo.view' })

// PUT - Atualizar cargo
export const PUT = withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } },
  session
) => {
  const id = validateId(params.id)
  const body = await request.json()

  // Validar dados
  const validatedData = CargoUpdateSchema.parse(body)

  // Verificar se cargo existe
  const existingCargo = await prisma.cargoMesaDiretora.findUnique({
    where: { id }
  })

  if (!existingCargo) {
    throw new NotFoundError('Cargo não encontrado')
  }

  const cargo = await prisma.cargoMesaDiretora.update({
    where: { id },
    data: validatedData,
    include: {
      periodo: {
        include: { legislatura: true }
      }
    }
  })

  await logAudit({
    request,
    session,
    action: 'CARGO_MESA_UPDATE',
    entity: 'CargoMesaDiretora',
    entityId: cargo.id,
    metadata: {
      updates: validatedData
    }
  })

  return createSuccessResponse(cargo, 'Cargo atualizado com sucesso')
}, { permissions: 'periodo.manage' })

// DELETE - Excluir cargo
export const DELETE = withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } },
  session
) => {
  const id = validateId(params.id)

  // Verificar se cargo existe
  const cargo = await prisma.cargoMesaDiretora.findUnique({
    where: { id },
    include: { membros: true }
  })

  if (!cargo) {
    throw new NotFoundError('Cargo não encontrado')
  }

  // Excluir membros relacionados primeiro
  if (cargo.membros.length > 0) {
    await prisma.membroMesaDiretora.deleteMany({
      where: { cargoId: id }
    })
  }

  await prisma.cargoMesaDiretora.delete({
    where: { id }
  })

  await logAudit({
    request,
    session,
    action: 'CARGO_MESA_DELETE',
    entity: 'CargoMesaDiretora',
    entityId: id,
    metadata: {
      nome: cargo.nome
    }
  })

  return createSuccessResponse(null, 'Cargo excluído com sucesso')
}, { permissions: 'periodo.manage' })
