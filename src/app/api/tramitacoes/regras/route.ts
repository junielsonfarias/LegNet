import { NextRequest } from 'next/server'
import { z } from 'zod'

import { withAuth } from '@/lib/auth/permissions'
import { createSuccessResponse, ValidationError } from '@/lib/error-handler'
import { logAudit } from '@/lib/audit'
import {
  regrasTramitacaoService,
  regrasTramitacaoEtapasService,
  tiposTramitacaoService,
  tiposOrgaosService
} from '@/lib/tramitacao-service'

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

const validateEtapas = (etapas: z.infer<typeof RegraEtapaSchema>[]) => {
  etapas.forEach(etapa => {
    if (etapa.tipoTramitacaoId) {
      const tipo = tiposTramitacaoService.getById(etapa.tipoTramitacaoId)
      if (!tipo) {
        throw new ValidationError(`Tipo de tramitação não encontrado para a etapa ${etapa.nome}`)
      }
    }

    if (etapa.unidadeId) {
      const unidade = tiposOrgaosService.getById(etapa.unidadeId)
      if (!unidade) {
        throw new ValidationError(`Unidade responsável não encontrada para a etapa ${etapa.nome}`)
      }
    }
  })
}

export const GET = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const ativo = searchParams.get('ativo')

  let regras = regrasTramitacaoService.getAll()

  if (ativo !== null) {
    if (ativo === 'true') {
      regras = regras.filter(regra => regra.ativo)
    } else if (ativo === 'false') {
      regras = regras.filter(regra => !regra.ativo)
    }
  }

  const resposta = regras.map(regra => ({
    ...regra,
    etapas: regrasTramitacaoEtapasService.getByRegra(regra.id)
  }))

  return createSuccessResponse(resposta, 'Regras de tramitação carregadas com sucesso', resposta.length)
}, { permissions: 'tramitacao.view' })

export const POST = withAuth(async (request: NextRequest, _ctx, session) => {
  const body = await request.json()
  const payload = RegraSchema.parse(body)

  const etapas = payload.etapas ?? []
  validateEtapas(etapas)

  const regra = regrasTramitacaoService.create({
    nome: payload.nome,
    descricao: payload.descricao ?? '',
    condicoes: payload.condicoes,
    acoes: payload.acoes,
    excecoes: payload.excecoes,
    ativo: payload.ativo,
    ordem: payload.ordem
  } as any) as any

  const etapasCriadas = etapas
    .sort((a, b) => a.ordem - b.ordem)
    .map((etapa, index) =>
      regrasTramitacaoEtapasService.create({
        regraId: regra.id,
        ordem: etapa.ordem ?? index,
        nome: etapa.nome,
        descricao: etapa.descricao,
        tipoTramitacaoId: etapa.tipoTramitacaoId,
        unidadeId: etapa.unidadeId,
        notificacoes: etapa.notificacoes,
        alertas: etapa.alertas,
        prazoDias: etapa.prazoDias ?? undefined
      })
    )

  await logAudit({
    request,
    session,
    action: 'REGRA_TRAMITACAO_CREATE',
    entity: 'RegraTramitacao',
    entityId: regra.id,
    metadata: {
      nome: regra.nome,
      etapas: etapasCriadas.length
    }
  })

  return createSuccessResponse(
    {
      ...regra,
      etapas: etapasCriadas
    },
    'Regra de tramitação criada com sucesso',
    undefined,
    201
  )
}, { permissions: 'tramitacao.manage' })
