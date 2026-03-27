import { NextRequest } from 'next/server'
import { z } from 'zod'
import {
  withErrorHandler,
  createSuccessResponse,
  NotFoundError,
  ConflictError,
  validateId
} from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { parlamentarDbService } from '@/lib/services/parlamentar-db-service'

// Configurar para renderização dinâmica
export const dynamic = 'force-dynamic'

// Schema de validação para mandato
const MandatoSchema = z.object({
  legislaturaId: z.string().min(1, 'Legislatura é obrigatória'),
  numeroVotos: z.number().min(0, 'Número de votos deve ser positivo').default(0),
  cargo: z.enum(['PRESIDENTE', 'VICE_PRESIDENTE', 'PRIMEIRO_SECRETARIO', 'SEGUNDO_SECRETARIO', 'VEREADOR']),
  dataInicio: z.string().min(1, 'Data de início é obrigatória'),
  dataFim: z.string().optional()
})

// Schema de validação para filiação
const FiliacaoSchema = z.object({
  partido: z.string().min(2, 'Partido deve ter pelo menos 2 caracteres'),
  dataInicio: z.string().min(1, 'Data de início é obrigatória'),
  dataFim: z.string().optional()
})

// Schema de validação para atualização
const UpdateParlamentarSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  apelido: z.string().min(2, 'Apelido deve ter pelo menos 2 caracteres').optional(),
  cargo: z.enum(['PRESIDENTE', 'VICE_PRESIDENTE', 'PRIMEIRO_SECRETARIO', 'SEGUNDO_SECRETARIO', 'VEREADOR']).optional(),
  partido: z.string().min(2, 'Partido deve ter pelo menos 2 caracteres').optional(),
  legislatura: z.string().min(4, 'Legislatura deve ter pelo menos 4 caracteres').optional(),
  email: z.string().email('Email inválido').optional(),
  telefone: z.string().min(10, 'Telefone deve ter pelo menos 10 caracteres').optional(),
  biografia: z.string().optional(),
  foto: z.string().optional().nullable(),
  gabinete: z.string().optional().nullable(),
  ativo: z.boolean().optional(),
  mandatos: z.array(MandatoSchema).optional(),
  filiacoes: z.array(FiliacaoSchema).optional()
})

// GET - Buscar parlamentar por ID
export const GET = withErrorHandler(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: rawId } = await context.params
  const id = validateId(rawId, 'Parlamentar')

  const parlamentar = await parlamentarDbService.getById(id)
  if (!parlamentar) {
    throw new NotFoundError('Parlamentar')
  }

  return createSuccessResponse(parlamentar, 'Parlamentar encontrado com sucesso')
})

// PUT - Atualizar parlamentar
export const PUT = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: rawId } = await context.params
  const id = validateId(rawId, 'Parlamentar')
  const body = await request.json()

  const validatedData = UpdateParlamentarSchema.parse(body)

  // Verificar se parlamentar existe
  const existing = await parlamentarDbService.getById(id)
  if (!existing) {
    throw new NotFoundError('Parlamentar')
  }

  // Verificar duplicatas
  if (validatedData.nome || validatedData.apelido) {
    const duplicate = await parlamentarDbService.checkDuplicate(
      validatedData.nome || existing.nome,
      validatedData.apelido || existing.apelido || '',
      id
    )
    if (duplicate) {
      throw new ConflictError('Já existe um parlamentar com este nome ou apelido')
    }
  }

  const updatedParlamentar = await parlamentarDbService.update(id, validatedData)

  return createSuccessResponse(updatedParlamentar, 'Parlamentar atualizado com sucesso')
}, { permissions: 'parlamentar.manage' })

// DELETE - Excluir parlamentar (soft delete)
export const DELETE = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: rawId } = await context.params
  const id = validateId(rawId, 'Parlamentar')

  const existing = await parlamentarDbService.getById(id)
  if (!existing) {
    throw new NotFoundError('Parlamentar')
  }

  await parlamentarDbService.remove(id)

  return createSuccessResponse(null, 'Parlamentar excluído com sucesso')
}, { permissions: 'parlamentar.manage' })
