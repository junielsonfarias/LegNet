import { NextRequest } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import {
  createSuccessResponse,
  ConflictError,
  NotFoundError,
  withErrorHandler
} from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'
import {
  generateIntegrationToken,
  sanitizeToken,
  INTEGRATION_PERMISSIONS
} from '@/lib/integrations/tokens'

const TokenPermissionsSchema = z
  .array(z.string())
  .nonempty('Informe ao menos uma permissão')
  .refine(permissoes => permissoes.every(perm => INTEGRATION_PERMISSIONS.includes(perm as any)), {
    message: 'Permissões inválidas'
  })

const TokenUpdateSchema = z.object({
  nome: z.string().min(3).optional(),
  descricao: z.string().optional(),
  permissoes: TokenPermissionsSchema.optional(),
  ativo: z.boolean().optional(),
  rotate: z.boolean().optional()
})

const getTokenById = async (id: string) => {
  const token = await prisma.apiToken.findUnique({ where: { id } })
  if (!token) {
    throw new NotFoundError('Token')
  }
  return token
}

const getHandler = withAuth(
  withErrorHandler(async (_request: NextRequest, { params }: { params: { id: string } }) => {
    const token = await getTokenById(params.id)
    return createSuccessResponse(sanitizeToken(token), 'Token carregado com sucesso')
  }),
  { permissions: 'integration.manage' }
)

const putHandler = withAuth(
  withErrorHandler(async (request: NextRequest, { params }: { params: { id: string } }, session) => {
    const payload = TokenUpdateSchema.parse(await request.json())
    const token = await getTokenById(params.id)

    if (payload.nome && payload.nome !== token.nome) {
      const existing = await prisma.apiToken.findUnique({ where: { nome: payload.nome } })
      if (existing) {
        throw new ConflictError('Já existe um token com este nome')
      }
    }

    let plainToken: string | undefined
    let hashedToken: string | undefined

    if (payload.rotate) {
      const generated = generateIntegrationToken()
      plainToken = generated.plain
      hashedToken = generated.hashed
    }

    const updated = await prisma.apiToken.update({
      where: { id: params.id },
      data: {
        nome: payload.nome ?? token.nome,
        descricao: payload.descricao !== undefined ? payload.descricao : token.descricao,
        permissoes: payload.permissoes ?? token.permissoes,
        ativo: payload.ativo !== undefined ? payload.ativo : token.ativo,
        ...(hashedToken ? { hashedToken } : {})
      }
    })

    await logAudit({
      request,
      session,
      action: 'INTEGRATION_TOKEN_UPDATE',
      entity: 'ApiToken',
      entityId: params.id,
      metadata: {
        rotate: payload.rotate ?? false,
        permissoesAlteradas: payload.permissoes ? true : false,
        ativo: payload.ativo ?? updated.ativo
      }
    })

    return createSuccessResponse(
      {
        token: sanitizeToken(updated),
        ...(plainToken ? { plainToken } : {})
      },
      'Token atualizado com sucesso'
    )
  }),
  { permissions: 'integration.manage' }
)

const deleteHandler = withAuth(
  withErrorHandler(async (request: NextRequest, { params }: { params: { id: string } }, session) => {
    const token = await getTokenById(params.id)

    await prisma.apiToken.delete({ where: { id: params.id } })

    await logAudit({
      request,
      session,
      action: 'INTEGRATION_TOKEN_DELETE',
      entity: 'ApiToken',
      entityId: params.id,
      metadata: {
        nome: token.nome
      }
    })

    return createSuccessResponse(null, 'Token excluído com sucesso')
  }),
  { permissions: 'integration.manage' }
)

export const GET = getHandler
export const PUT = putHandler
export const DELETE = deleteHandler

