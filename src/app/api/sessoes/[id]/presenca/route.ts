import { NextRequest } from 'next/server'
import { z } from 'zod'
import {
  withErrorHandler,
  createSuccessResponse,
  NotFoundError
} from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { assertSessaoPermitePresenca, obterSessaoParaControle, resolverSessaoId } from '@/lib/services/sessao-controle'
import { presencaDbService } from '@/lib/services/presenca-db-service'
import { parlamentarDbService } from '@/lib/services/parlamentar-db-service'

export const dynamic = 'force-dynamic'

const PresencaSchema = z.object({
  parlamentarId: z.string(),
  presente: z.boolean(),
  justificativa: z.string().nullable().optional()
})

// GET - Listar presenças da sessão
export const GET = withErrorHandler(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id } = await context.params
  // Resolver ID (aceita CUID ou slug no formato sessao-{numero}-{ano})
  const sessaoId = await resolverSessaoId(id)

  await obterSessaoParaControle(sessaoId)

  const presencas = await presencaDbService.listBySessao(sessaoId)

  return createSuccessResponse(presencas, 'Presenças listadas com sucesso')
})

// POST - Registrar/Atualizar presença
// SEGURANÇA: Requer autenticação e permissão de gestão de sessões
export const POST = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: rawId } = await context.params
  // Resolver ID (aceita CUID ou slug no formato sessao-{numero}-{ano})
  const sessaoId = await resolverSessaoId(rawId)
  const body = await request.json()

  const validatedData = PresencaSchema.parse(body)

  // Verificar se sessão existe e permite presença
  const sessao = await obterSessaoParaControle(sessaoId)
  assertSessaoPermitePresenca(sessao)

  // Verificar se parlamentar existe
  const parlamentar = await parlamentarDbService.getById(validatedData.parlamentarId)
  if (!parlamentar) {
    throw new NotFoundError('Parlamentar')
  }

  // Criar ou atualizar presença via serviço
  const presenca = await presencaDbService.registrar({
    sessaoId,
    parlamentarId: validatedData.parlamentarId,
    presente: validatedData.presente,
    justificativa: validatedData.justificativa
  })

  return createSuccessResponse(presenca, 'Presença registrada com sucesso')
}, { permissions: 'sessao.manage' })
