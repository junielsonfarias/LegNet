import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import {
  withErrorHandler,
  createSuccessResponse,
  ValidationError,
  ConflictError
} from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { cargosMesaDbService } from '@/lib/services/cargos-mesa-db-service'

export const dynamic = 'force-dynamic'

const CargoMesaDiretoraSchema = z.object({
  periodoId: z.string().min(1, 'Período é obrigatório'),
  nome: z.string().min(2, 'Nome do cargo deve ter pelo menos 2 caracteres'),
  ordem: z.number().min(1, 'Ordem deve ser maior que 0'),
  obrigatorio: z.boolean().default(true)
})

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const periodoId = searchParams.get('periodoId') || undefined

  const cargos = await cargosMesaDbService.list({ periodoId })
  return createSuccessResponse(cargos, 'Cargos listados com sucesso')
})

export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json()
  const validatedData = CargoMesaDiretoraSchema.parse(body)

  const periodo = await prisma.periodoLegislatura.findUnique({
    where: { id: validatedData.periodoId }
  })
  if (!periodo) throw new ValidationError('Período não encontrado')

  const existing = await cargosMesaDbService.checkDuplicate(validatedData.periodoId, validatedData.nome)
  if (existing) throw new ConflictError('Já existe um cargo com este nome neste período')

  const cargo = await cargosMesaDbService.create(validatedData)
  return createSuccessResponse(cargo, 'Cargo criado com sucesso', undefined, 201)
}, { permissions: 'mesa.manage' })
