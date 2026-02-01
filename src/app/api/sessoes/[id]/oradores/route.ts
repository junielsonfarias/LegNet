/**
 * API para gerenciar oradores de uma sessão
 * GET: Lista oradores da sessão
 * POST: Inscreve novo orador
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, NotFoundError, ValidationError, withErrorHandler } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

const OradorCreateSchema = z.object({
  parlamentarId: z.string().min(1, 'Parlamentar é obrigatório'),
  tipo: z.enum([
    'PEQUENO_EXPEDIENTE',
    'GRANDE_EXPEDIENTE',
    'LIDERANCA',
    'ORDEM_DO_DIA',
    'EXPLICACAO_PESSOAL',
    'APARTE',
    'TRIBUNA_LIVRE',
    'COMUNICACAO'
  ]),
  tempoLimite: z.number().int().min(1).optional(),
  assunto: z.string().optional(),
  observacoes: z.string().optional()
})

// GET - Lista oradores da sessão
export const GET = withAuth(withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const sessaoId = params.id
  const { searchParams } = new URL(request.url)
  const tipo = searchParams.get('tipo')
  const status = searchParams.get('status')

  // Verificar se sessão existe
  const sessao = await prisma.sessao.findUnique({
    where: { id: sessaoId }
  })

  if (!sessao) {
    throw new NotFoundError('Sessão')
  }

  const oradores = await prisma.oradorSessao.findMany({
    where: {
      sessaoId,
      ...(tipo && { tipo: tipo as any }),
      ...(status && { status: status as any })
    },
    include: {
      parlamentar: {
        select: {
          id: true,
          nome: true,
          apelido: true,
          partido: true,
          foto: true
        }
      }
    },
    orderBy: [
      { tipo: 'asc' },
      { ordem: 'asc' }
    ]
  })

  // Agrupar por tipo
  const oradoresPorTipo = oradores.reduce((acc, orador) => {
    if (!acc[orador.tipo]) acc[orador.tipo] = []
    acc[orador.tipo].push(orador)
    return acc
  }, {} as Record<string, typeof oradores>)

  return createSuccessResponse({
    oradores,
    oradoresPorTipo,
    totais: {
      total: oradores.length,
      inscritos: oradores.filter(o => o.status === 'INSCRITO').length,
      falando: oradores.filter(o => o.status === 'FALANDO').length,
      concluidos: oradores.filter(o => o.status === 'CONCLUIDO').length
    }
  })
}), { permissions: 'sessao.view' })

// POST - Inscreve novo orador
export const POST = withAuth(withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } },
  session
) => {
  const sessaoId = params.id
  const body = await request.json()
  const payload = OradorCreateSchema.parse(body)

  // Verificar se sessão existe
  const sessao = await prisma.sessao.findUnique({
    where: { id: sessaoId }
  })

  if (!sessao) {
    throw new NotFoundError('Sessão')
  }

  // Verificar se parlamentar existe
  const parlamentar = await prisma.parlamentar.findUnique({
    where: { id: payload.parlamentarId }
  })

  if (!parlamentar) {
    throw new NotFoundError('Parlamentar')
  }

  // Verificar se já está inscrito no mesmo tipo
  const inscricaoExistente = await prisma.oradorSessao.findFirst({
    where: {
      sessaoId,
      parlamentarId: payload.parlamentarId,
      tipo: payload.tipo,
      status: { in: ['INSCRITO', 'FALANDO'] }
    }
  })

  if (inscricaoExistente) {
    throw new ValidationError('Parlamentar já está inscrito para este tipo de pronunciamento')
  }

  // Obter próxima ordem
  const ultimaOrdem = await prisma.oradorSessao.findFirst({
    where: { sessaoId, tipo: payload.tipo },
    orderBy: { ordem: 'desc' }
  })

  const orador = await prisma.oradorSessao.create({
    data: {
      sessaoId,
      parlamentarId: payload.parlamentarId,
      tipo: payload.tipo,
      ordem: (ultimaOrdem?.ordem || 0) + 1,
      tempoLimite: payload.tempoLimite,
      assunto: payload.assunto,
      observacoes: payload.observacoes,
      status: 'INSCRITO'
    },
    include: {
      parlamentar: {
        select: {
          id: true,
          nome: true,
          apelido: true,
          partido: true
        }
      }
    }
  })

  await logAudit({
    request,
    session,
    action: 'ORADOR_INSCRITO',
    entity: 'OradorSessao',
    entityId: orador.id,
    metadata: {
      sessaoId,
      parlamentarId: payload.parlamentarId,
      tipo: payload.tipo
    }
  })

  return createSuccessResponse(orador, 'Orador inscrito com sucesso')
}), { permissions: 'sessao.manage' })
