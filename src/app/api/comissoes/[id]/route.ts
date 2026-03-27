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
import { comissaoDbService } from '@/lib/services/comissao-db-service'
import { syncComissaoHistorico } from '@/lib/participation-history'

// Configurar para renderização dinâmica
export const dynamic = 'force-dynamic'

// Schema de validação para atualização
const UpdateComissaoSchema = z.object({
  nome: z.string().min(3, 'Nome da comissão deve ter pelo menos 3 caracteres').optional(),
  descricao: z.string().optional(),
  tipo: z.enum(['PERMANENTE', 'TEMPORARIA', 'ESPECIAL', 'INQUERITO']).optional(),
  ativa: z.boolean().optional()
})

// GET - Buscar comissão por ID
export const GET = withErrorHandler(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: rawId } = await context.params
  const id = validateId(rawId, 'Comissão')

  const comissao = await comissaoDbService.getById(id)
  if (!comissao) {
    throw new NotFoundError('Comissão')
  }

  return createSuccessResponse(comissao, 'Comissão encontrada com sucesso')
})

// PUT - Atualizar comissão
export const PUT = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: rawId } = await context.params
  const id = validateId(rawId, 'Comissão')
  const body = await request.json()

  const validatedData = UpdateComissaoSchema.parse(body)

  const existing = await comissaoDbService.getById(id)
  if (!existing) {
    throw new NotFoundError('Comissão')
  }

  // Verificar duplicatas (se nome foi alterado)
  if (validatedData.nome && validatedData.nome !== existing.nome) {
    const duplicate = await comissaoDbService.checkDuplicateName(validatedData.nome, id)
    if (duplicate) {
      throw new ConflictError('Já existe uma comissão com este nome')
    }
  }

  const updatedComissao = await comissaoDbService.update(id, validatedData)

  await syncComissaoHistorico(id)

  return createSuccessResponse(updatedComissao, 'Comissão atualizada com sucesso')
}, { permissions: 'comissao.manage' })

// DELETE - Excluir comissão
export const DELETE = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: rawId } = await context.params
  const id = validateId(rawId, 'Comissão')

  const existing = await comissaoDbService.getById(id)
  if (!existing) {
    throw new NotFoundError('Comissão')
  }

  await comissaoDbService.remove(id)

  // Desativar histórico de participação
  await comissaoDbService.deactivateHistoricoParticipacao(id)

  return createSuccessResponse(null, 'Comissão excluída com sucesso')
}, { permissions: 'comissao.manage' })
