import { NextRequest } from 'next/server'
import { z } from 'zod'

import { withAuth } from '@/lib/auth/permissions'
import { createSuccessResponse, ValidationError, NotFoundError } from '@/lib/error-handler'
import { tiposTramitacaoDbService } from '@/lib/services/tipos-tramitacao-db-service'

export const dynamic = 'force-dynamic'

const UpdateTipoTramitacaoSchema = z.object({
  nome: z.string().min(1).nullish().transform(v => v ?? undefined),
  descricao: z.string().nullish().transform(v => v ?? undefined),
  prazoRegimental: z.number().int().min(0).optional(),
  prazoLegal: z.number().int().min(0).optional(),
  ativo: z.boolean().nullish().transform(v => v ?? undefined),
  ordem: z.number().int().min(0).optional(),
  unidadeResponsavelId: z.string().nullable().optional()
})

// GET - Obter tipo de tramitação por ID
export const GET = withAuth(async (
  request: NextRequest,
  { params }
) => {
  const { id } = await params

  const tipo = await tiposTramitacaoDbService.getByIdWithCount(id)

  if (!tipo) {
    throw new NotFoundError('Tipo de tramitação não encontrado')
  }

  return createSuccessResponse(tipo)
}, { permissions: 'config.view' })

// PUT - Atualizar tipo de tramitação
export const PUT = withAuth(async (
  request: NextRequest,
  { params }
) => {
  const { id } = await params
  const body = await request.json()

  const validation = UpdateTipoTramitacaoSchema.safeParse(body)
  if (!validation.success) {
    throw new ValidationError('Dados inválidos', validation.error.errors)
  }

  const data = validation.data

  // Verificar se existe
  const existente = await tiposTramitacaoDbService.getById(id)

  if (!existente) {
    throw new NotFoundError('Tipo de tramitação não encontrado')
  }

  // Verificar nome duplicado (se estiver alterando)
  if (data.nome && data.nome !== existente.nome) {
    const duplicado = await tiposTramitacaoDbService.checkDuplicateName(data.nome, id)

    if (duplicado) {
      throw new ValidationError('Já existe um tipo de tramitação com este nome')
    }
  }

  const tipo = await tiposTramitacaoDbService.update(id, data)

  return createSuccessResponse(tipo)
}, { permissions: 'config.manage' })

// DELETE - Excluir tipo de tramitação
export const DELETE = withAuth(async (
  request: NextRequest,
  { params }
) => {
  const { id } = await params

  // Verificar se existe
  const existente = await tiposTramitacaoDbService.getByIdWithCount(id)

  if (!existente) {
    throw new NotFoundError('Tipo de tramitação não encontrado')
  }

  // Verificar se está em uso
  if (existente._count.tramitacoes > 0) {
    throw new ValidationError(
      `Este tipo de tramitação está em uso em ${existente._count.tramitacoes} tramitação(ões). ` +
      'Desative-o em vez de excluir.'
    )
  }

  await tiposTramitacaoDbService.remove(id)

  return createSuccessResponse({ message: 'Tipo de tramitação excluído com sucesso' })
}, { permissions: 'config.manage' })
