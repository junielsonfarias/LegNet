import { NextRequest } from 'next/server'
import { z } from 'zod'
import {
  withErrorHandler,
  createSuccessResponse,
  ValidationError
} from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { obterSessaoParaControle, resolverSessaoId } from '@/lib/services/sessao-controle'
import { pautasDbService } from '@/lib/services/pautas-db-service'

export const dynamic = 'force-dynamic'

const DestaqueSchema = z.object({
  titulo: z.string().min(1, 'Titulo e obrigatorio'),
  descricao: z.string().nullish().transform(v => v ?? undefined),
  tipoVotacao: z.enum(['NOMINAL', 'SECRETA', 'SIMBOLICA', 'LEITURA']).default('NOMINAL'),
  parlamentarId: z.string().nullish().transform(v => v ?? undefined)
})

const VotarDestaqueSchema = z.object({
  votosSim: z.number().int().min(0),
  votosNao: z.number().int().min(0),
  votosAbstencao: z.number().int().min(0),
  resultado: z.enum(['APROVADO', 'REJEITADO'])
})

// GET - Listar destaques de um item
export const GET = withErrorHandler(async (
  request: NextRequest,
  context: { params: Promise<{ id: string; itemId: string }> }
) => {
  const { id, itemId } = await context.params
  const sessaoId = await resolverSessaoId(id)
  const destaques = await pautasDbService.listDestaques(sessaoId, itemId)
  return createSuccessResponse(destaques, 'Destaques listados com sucesso')
})

// POST - Criar destaque
export const POST = withAuth(withErrorHandler(async (
  request: NextRequest,
  context: { params: Promise<{ id: string; itemId: string }> }
) => {
  const { id, itemId } = await context.params
  const sessaoId = await resolverSessaoId(id)

  // Verificar sessao em andamento
  const sessao = await obterSessaoParaControle(sessaoId)
  if (sessao.status !== 'EM_ANDAMENTO') {
    throw new ValidationError('A sessao deve estar em andamento para criar destaques')
  }

  const body = await request.json()
  const data = DestaqueSchema.parse(body)

  const destaque = await pautasDbService.createDestaque(sessaoId, itemId, {
    titulo: data.titulo,
    descricao: data.descricao,
    tipoVotacao: data.tipoVotacao,
    parlamentarId: data.parlamentarId
  })

  return createSuccessResponse(destaque, 'Destaque criado com sucesso')
}), { permissions: 'sessao.manage' })

// PATCH - Votar/atualizar destaque
export const PATCH = withAuth(withErrorHandler(async (
  request: NextRequest,
  context: { params: Promise<{ id: string; itemId: string }> }
) => {
  const { id } = await context.params
  const sessaoId = await resolverSessaoId(id)

  const url = new URL(request.url)
  const destaqueId = url.searchParams.get('destaqueId')
  if (!destaqueId) {
    throw new ValidationError('ID do destaque e obrigatorio')
  }

  // Verificar sessao em andamento
  const sessao = await obterSessaoParaControle(sessaoId)
  if (sessao.status !== 'EM_ANDAMENTO') {
    throw new ValidationError('A sessao deve estar em andamento para votar destaques')
  }

  const body = await request.json()
  const data = VotarDestaqueSchema.parse(body)

  const destaqueAtualizado = await pautasDbService.voteDestaque(destaqueId, data)

  return createSuccessResponse(destaqueAtualizado, 'Destaque votado com sucesso')
}), { permissions: 'sessao.manage' })

// DELETE - Remover destaque
export const DELETE = withAuth(withErrorHandler(async (
  request: NextRequest,
  context: { params: Promise<{ id: string; itemId: string }> }
) => {
  const { id, itemId } = await context.params
  const sessaoId = await resolverSessaoId(id)

  const url = new URL(request.url)
  const destaqueId = url.searchParams.get('destaqueId')
  if (!destaqueId) {
    throw new ValidationError('ID do destaque e obrigatorio')
  }

  await pautasDbService.removeDestaque(sessaoId, itemId, destaqueId)

  return createSuccessResponse(null, 'Destaque excluido com sucesso')
}), { permissions: 'sessao.manage' })
