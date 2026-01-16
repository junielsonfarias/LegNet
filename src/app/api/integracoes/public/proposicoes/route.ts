import { NextRequest } from 'next/server'

import { prisma } from '@/lib/prisma'

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

  const where: Record<string, any> = {}
  if (status) {
    where.status = status
  }
  if (tipo) {
    where.tipo = tipo
  }
  if (autorId) {
    where.autorId = autorId
  }
  if ( anoParam) {
    const ano = Number(anoParam)
    if (Number.isNaN(ano)) {
      throw new ValidationError('Parâmetro "ano" inválido')
    }
    where.ano = ano
  }

  const proposicoes = await prisma.proposicao.findMany({
    where,
    orderBy: { dataApresentacao: 'desc' },
    take: limit,
    include: {
      autor: {
        select: {
          id: true,
          nome: true,
          apelido: true,
          partido: true
        }
      },
      votacoes: {
        select: {
          id: true,
          voto: true,
          parlamentarId: true,
          createdAt: true
        }
      }
    }
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

