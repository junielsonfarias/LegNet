import { NextRequest } from 'next/server'
import { z } from 'zod'

import { withAuth } from '@/lib/auth/permissions'
import {
  createSuccessResponse,
  ValidationError,
  NotFoundError
} from '@/lib/error-handler'
import { logAudit } from '@/lib/audit'
import { regraTramitacaoDbService } from '@/lib/services/regra-tramitacao-db-service'

export const dynamic = 'force-dynamic'

const RegraEtapaSchema = z.object({
  id: z.string().optional(),
  ordem: z.number().int().min(0).default(0),
  nome: z.string().min(1, 'Nome da etapa é obrigatório'),
  descricao: z.string().optional(),
  tipoTramitacaoId: z.string().optional(),
  unidadeId: z.string().optional(),
  notificacoes: z.any().optional(),
  alertas: z.any().optional(),
  prazoDias: z.number().int().nullable().optional()
})

const UpdateRegraSchema = z.object({
  nome: z.string().min(1).optional(),
  descricao: z.string().optional(),
  condicoes: z.record(z.any()).optional(),
  acoes: z.record(z.any()).optional(),
  excecoes: z.record(z.any()).optional(),
  ativo: z.boolean().optional(),
  ordem: z.number().int().min(0).optional(),
  etapas: z.array(RegraEtapaSchema).optional()
})

export const GET = withAuth(async (_request: NextRequest, { params }) => {
  const { id } = await params

  const regra = await regraTramitacaoDbService.getById(id)

  if (!regra) {
    throw new NotFoundError('Regra de tramitação')
  }

  return createSuccessResponse(regra, 'Regra de tramitação encontrada')
}, { permissions: 'tramitacao.view' })

export const PUT = withAuth(async (request: NextRequest, { params }, session) => {
  const { id } = await params
  const body = await request.json()
  const payload = UpdateRegraSchema.parse(body)

  const regraAtual = await regraTramitacaoDbService.getById(id)

  if (!regraAtual) {
    throw new NotFoundError('Regra de tramitação')
  }

  const etapas = payload.etapas
  if (etapas) {
    const validation = await regraTramitacaoDbService.validateEtapas(etapas)
    if (!validation.valid) {
      throw new ValidationError(validation.message)
    }
  }

  const regraAtualizada = await regraTramitacaoDbService.update(id, {
    nome: payload.nome,
    descricao: payload.descricao,
    condicoes: payload.condicoes,
    acoes: payload.acoes,
    excecoes: payload.excecoes,
    ativo: payload.ativo,
    ordem: payload.ordem,
    etapas
  })

  await logAudit({
    request,
    session,
    action: 'REGRA_TRAMITACAO_UPDATE',
    entity: 'RegraTramitacao',
    entityId: id,
    metadata: {
      nome: regraAtualizada?.nome,
      etapas: regraAtualizada?.etapas.length ?? 0
    }
  })

  return createSuccessResponse(regraAtualizada, 'Regra de tramitação atualizada com sucesso')
}, { permissions: 'tramitacao.manage' })

export const DELETE = withAuth(async (request: NextRequest, { params }, session) => {
  const { id } = await params

  const regra = await regraTramitacaoDbService.getById(id)

  if (!regra) {
    throw new NotFoundError('Regra de tramitação')
  }

  await regraTramitacaoDbService.remove(id)

  await logAudit({
    request,
    session,
    action: 'REGRA_TRAMITACAO_DELETE',
    entity: 'RegraTramitacao',
    entityId: id,
    metadata: {
      nome: regra.nome
    }
  })

  return createSuccessResponse({ id }, 'Regra de tramitação removida com sucesso')
}, { permissions: 'tramitacao.manage' })
