import { NextRequest } from 'next/server'
import { z } from 'zod'
import {
  withErrorHandler,
  createSuccessResponse,
  NotFoundError,
  ValidationError
} from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { resolverSessaoId } from '@/lib/services/sessao-controle'
import { mesaSessaoDbService } from '@/lib/services/mesa-sessao-db-service'

export const dynamic = 'force-dynamic'

// Schema de validação para criação/atualização da mesa da sessão
const MesaSessaoSchema = z.object({
  membros: z.array(z.object({
    parlamentarId: z.string().min(1, 'Parlamentar é obrigatório'),
    cargo: z.enum(['PRESIDENTE', 'VICE_PRESIDENTE', 'PRIMEIRO_SECRETARIO', 'SEGUNDO_SECRETARIO']),
    titular: z.boolean().default(true),
    observacoes: z.string().nullish().transform(v => v ?? undefined)
  })).min(1, 'Pelo menos um membro é obrigatório')
    .refine(
      (membros) => {
        const cargos = membros.map(m => m.cargo)
        return new Set(cargos).size === cargos.length
      },
      { message: 'Não pode haver cargos duplicados na mesa' }
    )
    .refine(
      (membros) => {
        const parlamentarIds = membros.map(m => m.parlamentarId)
        return new Set(parlamentarIds).size === parlamentarIds.length
      },
      { message: 'O mesmo parlamentar não pode ocupar dois cargos' }
    ),
  observacoes: z.string().nullish().transform(v => v ?? undefined)
})

// GET - Obter mesa da sessão
export const GET = withErrorHandler(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: rawId } = await context.params
  const id = await resolverSessaoId(rawId)

  const resultado = await mesaSessaoDbService.getMesaSessao(id)

  if (!resultado) {
    throw new NotFoundError('Sessão')
  }

  const message = resultado.mesaSessao
    ? 'Mesa da sessão encontrada'
    : resultado.mesaDiretora
      ? 'Usando mesa diretora do período'
      : 'Nenhuma mesa encontrada'

  return createSuccessResponse(resultado, message)
})

// POST - Criar/atualizar mesa da sessão
export const POST = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
  session
) => {
  const { id: rawId } = await context.params
  const id = await resolverSessaoId(rawId)
  const body = await request.json()

  const validation = MesaSessaoSchema.safeParse(body)
  if (!validation.success) {
    throw new ValidationError(validation.error.errors[0].message)
  }

  const { membros, observacoes } = validation.data

  // Verificar se o usuário está autenticado
  if (!session?.user?.id) {
    throw new ValidationError('Usuário não autenticado')
  }

  try {
    const mesa = await mesaSessaoDbService.createOrUpdate(id, membros, observacoes, session.user.id)
    return createSuccessResponse(mesa, 'Mesa da sessão salva com sucesso')
  } catch (error: any) {
    if (error.message === 'Sessão não encontrada') {
      throw new NotFoundError('Sessão')
    }
    throw new ValidationError(error.message)
  }
}, { roles: ['ADMIN', 'SECRETARIA', 'OPERADOR'] })

// DELETE - Remover mesa da sessão (volta a usar mesa diretora)
export const DELETE = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
  _session
) => {
  const { id: rawId } = await context.params
  const id = await resolverSessaoId(rawId)

  try {
    await mesaSessaoDbService.remove(id)
    return createSuccessResponse(null, 'Mesa da sessão removida. A sessão usará a mesa diretora do período.')
  } catch (error: any) {
    if (error.message === 'Sessão não encontrada') {
      throw new NotFoundError('Sessão')
    }
    throw new ValidationError(error.message)
  }
}, { roles: ['ADMIN', 'SECRETARIA'] })
