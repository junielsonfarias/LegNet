import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, NotFoundError, ValidationError, validateId } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'

// Configurar para renderização dinâmica
export const dynamic = 'force-dynamic'

// Schema de validação para atualização
const PeriodoUpdateSchema = z.object({
  numero: z.number().min(1).optional(),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional().nullable(),
  descricao: z.string().optional().nullable()
})

// GET - Buscar período por ID
export const GET = withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } },
  _session
) => {
  const id = validateId(params.id)

  const periodo = await prisma.periodoLegislatura.findUnique({
    where: { id },
    include: {
      legislatura: true,
      cargos: {
        orderBy: { ordem: 'asc' }
      }
    }
  })

  if (!periodo) {
    throw new NotFoundError('Período não encontrado')
  }

  return createSuccessResponse(periodo, 'Período encontrado com sucesso')
}, { permissions: 'periodo.view' })

// PUT - Atualizar período
export const PUT = withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } },
  session
) => {
  const id = validateId(params.id)
  const body = await request.json()

  // Validar dados
  const validatedData = PeriodoUpdateSchema.parse(body)

  // Verificar se período existe
  const existingPeriodo = await prisma.periodoLegislatura.findUnique({
    where: { id },
    include: { legislatura: true }
  })

  if (!existingPeriodo) {
    throw new NotFoundError('Período não encontrado')
  }

  // Preparar dados para atualização
  const updateData: any = {}

  if (validatedData.numero !== undefined) {
    updateData.numero = validatedData.numero
  }

  if (validatedData.dataInicio !== undefined) {
    const dataInicio = new Date(validatedData.dataInicio)
    if (isNaN(dataInicio.getTime())) {
      throw new ValidationError('Data de início inválida')
    }
    updateData.dataInicio = dataInicio
  }

  if (validatedData.dataFim !== undefined) {
    if (validatedData.dataFim) {
      const dataFim = new Date(validatedData.dataFim)
      if (isNaN(dataFim.getTime())) {
        throw new ValidationError('Data de fim inválida')
      }
      updateData.dataFim = dataFim
    } else {
      updateData.dataFim = null
    }
  }

  if (validatedData.descricao !== undefined) {
    updateData.descricao = validatedData.descricao || null
  }

  const periodo = await prisma.periodoLegislatura.update({
    where: { id },
    data: updateData,
    include: {
      legislatura: true,
      cargos: {
        orderBy: { ordem: 'asc' }
      }
    }
  })

  await logAudit({
    request,
    session,
    action: 'PERIODO_UPDATE',
    entity: 'PeriodoLegislatura',
    entityId: periodo.id,
    metadata: {
      updates: validatedData
    }
  })

  return createSuccessResponse(periodo, 'Período atualizado com sucesso')
}, { permissions: 'periodo.manage' })

// DELETE - Excluir período
export const DELETE = withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } },
  session
) => {
  const id = validateId(params.id)

  // Verificar se período existe
  const periodo = await prisma.periodoLegislatura.findUnique({
    where: { id },
    include: { cargos: true }
  })

  if (!periodo) {
    throw new NotFoundError('Período não encontrado')
  }

  // Excluir cargos relacionados primeiro
  if (periodo.cargos.length > 0) {
    await prisma.cargoMesaDiretora.deleteMany({
      where: { periodoId: id }
    })
  }

  await prisma.periodoLegislatura.delete({
    where: { id }
  })

  await logAudit({
    request,
    session,
    action: 'PERIODO_DELETE',
    entity: 'PeriodoLegislatura',
    entityId: id,
    metadata: {
      numero: periodo.numero
    }
  })

  return createSuccessResponse(null, 'Período excluído com sucesso')
}, { permissions: 'periodo.manage' })
