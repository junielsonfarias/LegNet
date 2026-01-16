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

  if (!token.permissoes.includes('sessoes.read')) {
    throw new UnauthorizedError('Token não possui permissão para leitura de sessões')
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || undefined
  const tipo = searchParams.get('tipo') || undefined
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const limitParam = searchParams.get('limit')

  const limit = Math.min(Number(limitParam || 50), MAX_LIMIT)

  const where: Record<string, any> = {}
  if (status) {
    where.status = status
  }
  if (tipo) {
    where.tipo = tipo
  }
  if (from || to) {
    where.data = {}
    if (from) {
      const fromDate = new Date(from)
      if (Number.isNaN(fromDate.getTime())) {
        throw new ValidationError('Parâmetro "from" inválido')
      }
      where.data.gte = fromDate
    }
    if (to) {
      const toDate = new Date(to)
      if (Number.isNaN(toDate.getTime())) {
        throw new ValidationError('Parâmetro "to" inválido')
      }
      where.data.lte = toDate
    }
  }

  const sessoes = await prisma.sessao.findMany({
    where,
    orderBy: { data: 'desc' },
    take: limit,
    include: {
      legislatura: {
        select: {
          id: true,
          numero: true,
          anoInicio: true,
          anoFim: true
        }
      },
      periodo: {
        select: {
          id: true,
          numero: true,
          dataInicio: true,
          dataFim: true
        }
      },
      pautaSessao: {
        include: {
          itens: true
        }
      }
    }
  })

  const sanitized = sessoes.map(sessao => ({
    id: sessao.id,
    numero: sessao.numero,
    tipo: sessao.tipo,
    data: sessao.data,
    horario: sessao.horario,
    local: sessao.local,
    status: sessao.status,
    descricao: sessao.descricao,
    finalizada: sessao.finalizada,
    legislatura: sessao.legislatura,
    periodo: sessao.periodo,
    pauta: sessao.pautaSessao
      ? {
          status: sessao.pautaSessao.status,
          tempoTotalEstimado: sessao.pautaSessao.tempoTotalEstimado,
          itens: sessao.pautaSessao.itens.map(item => ({
            id: item.id,
            secao: item.secao,
            ordem: item.ordem,
            titulo: item.titulo,
            tempoEstimado: item.tempoEstimado
          }))
        }
      : null
  }))

  await recordIntegrationUsage(token.id, request, {
    recurso: 'sessoes',
    filtros: { status, tipo, from, to }
  })

  return createSuccessResponse(sanitized, 'Sessões recuperadas com sucesso', sanitized.length)
})

