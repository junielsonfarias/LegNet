import { NextRequest } from 'next/server'

// Força rota dinâmica para evitar erro de renderização estática
export const dynamic = 'force-dynamic'
import {
  createSuccessResponse,
  UnauthorizedError,
  ValidationError,
  withErrorHandler
} from '@/lib/error-handler'
import {
  verifyIntegrationToken,
  recordIntegrationUsage
} from '@/lib/integrations/tokens'
import { proposicaoDbService } from '@/lib/services/proposicao-db-service'

const MAX_LIMIT = 100

const normalizeTokenFromHeaders = (request: NextRequest) => {
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim()
  }
  const header = request.headers.get('x-integration-token')
  return header?.trim()
}

export const GET = withErrorHandler(async (request: NextRequest) => {
  const tokenHeader = normalizeTokenFromHeaders(request)
  const token = await verifyIntegrationToken(tokenHeader)

  if (!token) {
    throw new UnauthorizedError('Token de integração inválido ou inativo')
  }

  if (!token.permissoes.includes('proposicoes.read')) {
    throw new UnauthorizedError('Token não possui permissão para leitura de proposições')
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || undefined
  const tipo = searchParams.get('tipo') || undefined
  const autorId = searchParams.get('autorId') || undefined
  const anoParam = searchParams.get('ano')
  const limitParam = searchParams.get('limit')

  const limit = Math.min(Number(limitParam || 50), MAX_LIMIT)

  let ano: number | undefined
  if (anoParam) {
    ano = Number(anoParam)
    if (Number.isNaN(ano)) {
      throw new ValidationError('Parâmetro "ano" inválido')
    }
  }

  const proposicoes = await proposicaoDbService.listPublic({
    status,
    tipo,
    autorId,
    ano,
    limit
  })

  const sanitized = proposicoes.map(proposicao => ({
    id: proposicao.id,
    numero: proposicao.numero,
    ano: proposicao.ano,
    tipo: proposicao.tipo,
    titulo: proposicao.titulo,
    ementa: proposicao.ementa,
    status: proposicao.status,
    dataApresentacao: proposicao.dataApresentacao,
    dataVotacao: proposicao.dataVotacao,
    resultado: proposicao.resultado,
    autor: proposicao.autor,
    votacoes: proposicao.votacoes
  }))

  await recordIntegrationUsage(token.id, request, {
    recurso: 'proposicoes',
    filtros: { status, tipo, autorId, ano: anoParam }
  })

  return createSuccessResponse(sanitized, 'Proposições recuperadas com sucesso', sanitized.length)
})
