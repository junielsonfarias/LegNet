import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/auth/permissions'
import { z } from 'zod'
import { tiposProposicaoDbService } from '@/lib/services/tipos-proposicao-db-service'
import { withErrorHandler, createSuccessResponse, NotFoundError, ValidationError } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

const APLICACOES_QUORUM = [
  'VOTACAO_SIMPLES', 'VOTACAO_ABSOLUTA', 'VOTACAO_QUALIFICADA', 'VOTACAO_URGENCIA'
] as const

const TipoProposicaoUpdateSchema = z.object({
  nome: z.string().min(3).nullish().transform(v => v ?? undefined),
  sigla: z.string().min(1).max(10).optional(),
  descricao: z.string().nullish().transform(v => v ?? undefined),
  prazoLimite: z.number().int().min(0).optional().nullable(),
  requerVotacao: z.boolean().nullish().transform(v => v ?? undefined),
  requerSancao: z.boolean().nullish().transform(v => v ?? undefined),
  numeracaoAnual: z.boolean().nullish().transform(v => v ?? undefined),
  prefixoNumeracao: z.string().nullish().transform(v => v ?? undefined),
  ativo: z.boolean().nullish().transform(v => v ?? undefined),
  ordem: z.number().int().nullish().transform(v => v ?? undefined),
  corBadge: z.string().nullish().transform(v => v ?? undefined),
  icone: z.string().nullish().transform(v => v ?? undefined),
  quorumAplicacao: z.enum(APLICACOES_QUORUM).nullish().transform(v => v ?? undefined),
  quorumAplicacao2Turno: z.enum(APLICACOES_QUORUM).nullish().transform(v => v ?? undefined),
  totalTurnos: z.number().int().min(1).max(2).optional(),
  intersticioDias: z.number().int().min(0).max(30).optional()
})

interface RouteParams {
  params: Promise<{ id: string }>
}

export const GET = withErrorHandler(async (_request: NextRequest, { params }: RouteParams) => {
  const { id } = await params
  const tipo = await tiposProposicaoDbService.getById(id)
  if (!tipo) {
    throw new NotFoundError('Tipo de proposição')
  }
  return createSuccessResponse(tipo)
})

export const PUT = withAuth(async (request: NextRequest, context: RouteParams) => {
  const { id } = await context.params
  const body = await request.json()
  const validatedData = TipoProposicaoUpdateSchema.parse(body)

  const existente = await tiposProposicaoDbService.getById(id)
  if (!existente) {
    throw new NotFoundError('Tipo de proposição')
  }

  const tipo = await tiposProposicaoDbService.update(id, validatedData)
  return createSuccessResponse(tipo, 'Tipo de proposição atualizado com sucesso')
}, { permissions: 'config.manage' })

export const DELETE = withAuth(async (request: NextRequest, context: RouteParams) => {
  const { id } = await context.params

  const existente = await tiposProposicaoDbService.getById(id)
  if (!existente) {
    throw new NotFoundError('Tipo de proposição')
  }

  const proposicoesCount = await tiposProposicaoDbService.countProposicoesByCodigo(existente.codigo)
  if (proposicoesCount > 0) {
    throw new ValidationError(
      `Não é possível excluir. Existem ${proposicoesCount} proposição(ões) usando este tipo.`,
      { proposicoesCount }
    )
  }

  await tiposProposicaoDbService.remove(id)
  return createSuccessResponse({ removed: true }, 'Tipo de proposição excluído com sucesso')
}, { permissions: 'config.manage' })
