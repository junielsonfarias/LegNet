import { NextRequest } from 'next/server'
import { z } from 'zod'
import {
  createSuccessResponse,
  ConflictError,
  withErrorHandler
} from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'
import { integracaoTokenDbService } from '@/lib/services/integracao-token-db-service'
import { INTEGRATION_PERMISSIONS } from '@/lib/integrations/tokens'

const TokenPermissionsSchema = z
  .array(z.string())
  .nonempty('Informe ao menos uma permissão')
  .refine(permissoes => permissoes.every(perm => INTEGRATION_PERMISSIONS.includes(perm as any)), {
    message: 'Permissões inválidas'
  })

const TokenCreateSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
  descricao: z.string().nullish().transform(v => v ?? undefined),
  permissoes: TokenPermissionsSchema,
  ativo: z.boolean().nullish().transform(v => v ?? undefined)
})

const listTokens = withAuth(
  withErrorHandler(async (request: NextRequest) => {
    const tokens = await integracaoTokenDbService.list()
    return createSuccessResponse(tokens, 'Tokens listados com sucesso', tokens.length)
  }),
  { permissions: 'integration.manage' }
)

const createToken = withAuth(
  withErrorHandler(async (request: NextRequest, _ctx, session) => {
    const body = await request.json()
    const payload = TokenCreateSchema.parse(body)

    const existing = await integracaoTokenDbService.checkDuplicateName(payload.nome)
    if (existing) {
      throw new ConflictError('Já existe um token com este nome')
    }

    const result = await integracaoTokenDbService.create(payload)

    await logAudit({
      request, session,
      action: 'INTEGRATION_TOKEN_CREATE',
      entity: 'ApiToken',
      entityId: result.token.id,
      metadata: { permissoes: payload.permissoes, ativo: payload.ativo ?? true }
    })

    return createSuccessResponse(result, 'Token criado com sucesso', undefined, 201)
  }),
  { permissions: 'integration.manage' }
)

export const GET = listTokens
export const POST = createToken
