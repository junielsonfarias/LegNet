import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, NotFoundError, ValidationError, validateId } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'
import { periodosLegislaturaDbService } from '@/lib/services/periodos-legislatura-db-service'

export const dynamic = 'force-dynamic'

const PeriodoUpdateSchema = z.object({
  numero: z.number().min(1).optional(),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional().nullable(),
  descricao: z.string().optional().nullable()
})

export const GET = withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } },
  _session
) => {
  const id = validateId(params.id)
  const periodo = await periodosLegislaturaDbService.getById(id)
  if (!periodo) throw new NotFoundError('Período não encontrado')
  return createSuccessResponse(periodo, 'Período encontrado com sucesso')
}, { permissions: 'periodo.view' })

export const PUT = withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } },
  session
) => {
  const id = validateId(params.id)
  const body = await request.json()
  const validatedData = PeriodoUpdateSchema.parse(body)

  const existing = await periodosLegislaturaDbService.getById(id)
  if (!existing) throw new NotFoundError('Período não encontrado')

  const updateData: any = {}
  if (validatedData.numero !== undefined) updateData.numero = validatedData.numero
  if (validatedData.dataInicio !== undefined) {
    const d = new Date(validatedData.dataInicio)
    if (isNaN(d.getTime())) throw new ValidationError('Data de início inválida')
    updateData.dataInicio = d
  }
  if (validatedData.dataFim !== undefined) {
    if (validatedData.dataFim) {
      const d = new Date(validatedData.dataFim)
      if (isNaN(d.getTime())) throw new ValidationError('Data de fim inválida')
      updateData.dataFim = d
    } else {
      updateData.dataFim = null
    }
  }
  if (validatedData.descricao !== undefined) updateData.descricao = validatedData.descricao || null

  const periodo = await periodosLegislaturaDbService.update(id, updateData)

  await logAudit({
    request, session,
    action: 'PERIODO_UPDATE',
    entity: 'PeriodoLegislatura',
    entityId: periodo.id,
    metadata: { updates: validatedData }
  })

  return createSuccessResponse(periodo, 'Período atualizado com sucesso')
}, { permissions: 'periodo.manage' })

export const DELETE = withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } },
  session
) => {
  const id = validateId(params.id)
  const periodo = await periodosLegislaturaDbService.getById(id)
  if (!periodo) throw new NotFoundError('Período não encontrado')

  await prisma.cargoMesaDiretora.deleteMany({ where: { periodoId: id } })
  await periodosLegislaturaDbService.remove(id)

  await logAudit({
    request, session,
    action: 'PERIODO_DELETE',
    entity: 'PeriodoLegislatura',
    entityId: id,
    metadata: { numero: periodo.numero }
  })

  return createSuccessResponse(null, 'Período excluído com sucesso')
}, { permissions: 'periodo.manage' })
