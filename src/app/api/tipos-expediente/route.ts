/**
 * API para gerenciar tipos de expediente
 * GET: Lista todos os tipos
 * POST: Cria novo tipo
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createSuccessResponse, ValidationError, withErrorHandler } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'
import { tiposExpedienteDbService } from '@/lib/services/tipos-expediente-db-service'

export const dynamic = 'force-dynamic'

const TipoExpedienteSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100),
  descricao: z.string().nullish().transform(v => v ?? undefined),
  ordem: z.number().int().min(0).nullish().transform(v => v ?? undefined),
  tempoMaximo: z.number().int().min(1).nullish().transform(v => v ?? undefined),
  ativo: z.boolean().nullish().transform(v => v ?? undefined)
})

// GET - Lista tipos de expediente
export const GET = withAuth(withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const includeInactive = searchParams.get('includeInactive') === 'true'
  const ativoParam = searchParams.get('ativo')
  const filtroAtivo = includeInactive ? undefined : (ativoParam === 'false' ? false : true)

  const tipos = await tiposExpedienteDbService.list({
    ativo: filtroAtivo
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
  const existente = await tiposExpedienteDbService.checkDuplicateName(payload.nome)

  if (existente) {
    throw new ValidationError('Já existe um tipo de expediente com este nome')
  }

  // Obter próxima ordem se não informada
  if (payload.ordem === undefined) {
    payload.ordem = await tiposExpedienteDbService.getNextOrder()
  }

  const tipo = await tiposExpedienteDbService.create({
    nome: payload.nome,
    descricao: payload.descricao,
    ordem: payload.ordem,
    tempoMaximo: payload.tempoMaximo,
    ativo: payload.ativo ?? true
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
