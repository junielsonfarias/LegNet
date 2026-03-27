import { NextRequest } from 'next/server'
import { z } from 'zod'

import { withAuth } from '@/lib/auth/permissions'
import { createSuccessResponse, ValidationError } from '@/lib/error-handler'
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

const RegraSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  condicoes: z.record(z.any()).default({}),
  acoes: z.record(z.any()),
  excecoes: z.record(z.any()).optional(),
  ativo: z.boolean().default(true),
  ordem: z.number().int().min(0).default(0),
  etapas: z.array(RegraEtapaSchema).optional()
})

export const GET = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const ativo = searchParams.get('ativo')

  const filters: { ativo?: boolean } = {}
  if (ativo !== null) {
    filters.ativo = ativo === 'true'
  }

  const regras = await regraTramitacaoDbService.list(filters)

  return createSuccessResponse(regras, 'Regras de tramitação carregadas com sucesso', regras.length)
}, { permissions: 'tramitacao.view' })

export const POST = withAuth(async (request: NextRequest, _ctx, session) => {
  const body = await request.json()
  const payload = RegraSchema.parse(body)

  const etapas = payload.etapas ?? []
  if (etapas.length > 0) {
    const validation = await regraTramitacaoDbService.validateEtapas(etapas)
    if (!validation.valid) {
      throw new ValidationError(validation.message)
    }
  }

  const regra = await regraTramitacaoDbService.create({
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
    action: 'REGRA_TRAMITACAO_CREATE',
    entity: 'RegraTramitacao',
    entityId: regra.id,
    metadata: {
      nome: regra.nome,
      etapas: regra.etapas.length
    }
  })

  return createSuccessResponse(
    regra,
    'Regra de tramitação criada com sucesso',
    undefined,
    201
  )
}, { permissions: 'tramitacao.manage' })
