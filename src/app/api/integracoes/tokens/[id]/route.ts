import { NextRequest } from 'next/server'
import { z } from 'zod'

import {
  createSuccessResponse,
  ConflictError,
  NotFoundError,
  withErrorHandler
} from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'
import {
  sanitizeToken,
  INTEGRATION_PERMISSIONS
} from '@/lib/integrations/tokens'
import { integracaoTokenDbService } from '@/lib/services/integracao-token-db-service'

const TokenPermissionsSchema = z
  .array(z.string())
  .nonempty('Informe ao menos uma permissão')
  .refine(permissoes => permissoes.every(perm => INTEGRATION_PERMISSIONS.includes(perm as any)), {
    message: 'Permissões inválidas'
  })

const TokenUpdateSchema = z.object({
  nome: z.string().min(3).nullish().transform(v => v ?? undefined),
  descricao: z.string().nullish().transform(v => v ?? undefined),
  permissoes: TokenPermissionsSchema.optional(),
  ativo: z.boolean().nullish().transform(v => v ?? undefined),
  rotate: z.boolean().nullish().transform(v => v ?? undefined)
})

const getTokenByIdOrThrow = async (id: string) => {
  const token = await integracaoTokenDbService.getById(id)
  if (!token) {
    throw new NotFoundError('Token')
  }
  return token
}

const getHandler = withAuth(
  withErrorHandler(async (_request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const { id } = await context.params
    const token = await getTokenByIdOrThrow(id)
    return createSuccessResponse(token, 'Token carregado com sucesso')
  }),
  { permissions: 'integration.manage' }
)

const putHandler = withAuth(
  withErrorHandler(async (request: NextRequest, context: { params: Promise<{ id: string }> }, session) => {
    const { id } = await context.params
    const payload = TokenUpdateSchema.parse(await request.json())
    const token = await getTokenByIdOrThrow(id)

    if (payload.nome && payload.nome !== (token as any).nome) {
      const existing = await integracaoTokenDbService.checkDuplicateName(payload.nome, id)
      if (existing) {
        throw new ConflictError('Já existe um token com este nome')
      }
    }

    let result: any

    if (payload.rotate) {
      // Regenerate token
      const regenerated = await integracaoTokenDbService.regenerate(id)

      // Also update other fields if provided
      if (payload.nome || payload.descricao !== undefined || payload.permissoes || payload.ativo !== undefined) {
        const updateData: Record<string, unknown> = {}
        if (payload.nome !== undefined) updateData.nome = payload.nome
        if (payload.descricao !== undefined) updateData.descricao = payload.descricao
        if (payload.permissoes !== undefined) updateData.permissoes = payload.permissoes
        if (payload.ativo !== undefined) updateData.ativo = payload.ativo
        const updated = await integracaoTokenDbService.update(id, updateData)
        result = { token: updated, plainToken: regenerated.plainToken }
      } else {
        result = regenerated
      }
    } else {
      const updateData: Record<string, unknown> = {}
      if (payload.nome !== undefined) updateData.nome = payload.nome
      if (payload.descricao !== undefined) updateData.descricao = payload.descricao
      if (payload.permissoes !== undefined) updateData.permissoes = payload.permissoes
      if (payload.ativo !== undefined) updateData.ativo = payload.ativo
      const updated = await integracaoTokenDbService.update(id, updateData)
      result = { token: updated }
    }

    await logAudit({
      request,
      session,
      action: 'INTEGRATION_TOKEN_UPDATE',
      entity: 'ApiToken',
      entityId: id,
      metadata: {
        rotate: payload.rotate ?? false,
        permissoesAlteradas: payload.permissoes ? true : false,
        ativo: payload.ativo ?? (token as any).ativo
      }
    })

    return createSuccessResponse(
      result,
      'Token atualizado com sucesso'
    )
  }),
  { permissions: 'integration.manage' }
)

const deleteHandler = withAuth(
  withErrorHandler(async (request: NextRequest, context: { params: Promise<{ id: string }> }, session) => {
    const { id } = await context.params
    const token = await getTokenByIdOrThrow(id)

    await integracaoTokenDbService.remove(id)

    await logAudit({
      request,
      session,
      action: 'INTEGRATION_TOKEN_DELETE',
      entity: 'ApiToken',
      entityId: id,
      metadata: {
        nome: (token as any).nome
      }
    })

    return createSuccessResponse(null, 'Token excluído com sucesso')
  }),
  { permissions: 'integration.manage' }
)

export const GET = getHandler
export const PUT = putHandler
export const DELETE = deleteHandler
