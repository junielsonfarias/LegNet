/**
 * API para gerenciar tipos de expediente
 * GET: Lista todos os tipos
 * POST: Cria novo tipo
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, ValidationError, withErrorHandler } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

const TipoExpedienteSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100),
  descricao: z.string().optional(),
  ordem: z.number().int().min(0).optional(),
  tempoMaximo: z.number().int().min(1).optional(),
  ativo: z.boolean().optional()
})

// GET - Lista tipos de expediente
export const GET = withAuth(withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const apenasAtivos = searchParams.get('ativo') !== 'false'

  const tipos = await prisma.tipoExpediente.findMany({
    where: apenasAtivos ? { ativo: true } : {},
    orderBy: { ordem: 'asc' }
  })

  return createSuccessResponse(tipos)
}), { permissions: 'sessao.view' })

// POST - Cria novo tipo
export const POST = withAuth(withErrorHandler(async (
  request: NextRequest,
  _context,
  session
) => {
  const body = await request.json()
  const payload = TipoExpedienteSchema.parse(body)

  // Verificar se já existe tipo com mesmo nome
  const existente = await prisma.tipoExpediente.findFirst({
    where: { nome: { equals: payload.nome, mode: 'insensitive' } }
  })

  if (existente) {
    throw new ValidationError('Já existe um tipo de expediente com este nome')
  }

  // Obter próxima ordem se não informada
  if (payload.ordem === undefined) {
    const ultimaOrdem = await prisma.tipoExpediente.findFirst({
      orderBy: { ordem: 'desc' }
    })
    payload.ordem = (ultimaOrdem?.ordem || 0) + 1
  }

  const tipo = await prisma.tipoExpediente.create({
    data: {
      nome: payload.nome,
      descricao: payload.descricao,
      ordem: payload.ordem,
      tempoMaximo: payload.tempoMaximo,
      ativo: payload.ativo ?? true
    }
  })

  await logAudit({
    request,
    session,
    action: 'TIPO_EXPEDIENTE_CRIADO',
    entity: 'TipoExpediente',
    entityId: tipo.id,
    metadata: { nome: tipo.nome }
  })

  return createSuccessResponse(tipo, 'Tipo de expediente criado com sucesso')
}), { permissions: 'config.manage' })
