import { NextRequest } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import {
  createSuccessResponse,
  ConflictError,
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

const TokenCreateSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
  descricao: z.string().optional(),
  permissoes: TokenPermissionsSchema,
  ativo: z.boolean().optional()
})

const listTokens = withAuth(
  withErrorHandler(async (request: NextRequest) => {
    const tokens = await prisma.apiToken.findMany({
      orderBy: { createdAt: 'desc' }
    })

    const sanitized = tokens.map(token => sanitizeToken(token))
    return createSuccessResponse(sanitized, 'Tokens listados com sucesso', sanitized.length)
  }),
  { permissions: 'integration.manage' }
)

const createToken = withAuth(
  withErrorHandler(async (request: NextRequest, _ctx, session) => {
    const body = await request.json()
    const payload = TokenCreateSchema.parse(body)

    const existing = await prisma.apiToken.findUnique({ where: { nome: payload.nome } })
    if (existing) {
      throw new ConflictError('Já existe um token com este nome')
    }

    const { plain, hashed } = generateIntegrationToken()

    const token = await prisma.apiToken.create({
      data: {
        nome: payload.nome,
        descricao: payload.descricao || null,
        hashedToken: hashed,
        permissoes: payload.permissoes,
        ativo: payload.ativo ?? true
      }
    })

    await logAudit({
      request,
      session,
      action: 'INTEGRATION_TOKEN_CREATE',
      entity: 'ApiToken',
      entityId: token.id,
      metadata: {
        permissoes: payload.permissoes,
        ativo: payload.ativo ?? true
      }
    })

    return createSuccessResponse(
      {
        token: sanitizeToken(token),
        plainToken: plain
      },
      'Token criado com sucesso',
      undefined,
      201
    )
  }),
  { permissions: 'integration.manage' }
)

export const GET = listTokens
export const POST = createToken

