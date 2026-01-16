import { NextRequest } from 'next/server'
import { z } from 'zod'

import { withAuth } from '@/lib/auth/permissions'
import {
  createSuccessResponse,
  validateId,
  ValidationError,
  NotFoundError
} from '@/lib/error-handler'
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

export const GET = withAuth(async (_request: NextRequest, { params }) => {
  const id = validateId(params?.id)
  const regra = regrasTramitacaoService.getById(id)

  if (!regra) {
    throw new NotFoundError('Regra de tramitação não encontrada')
  }

  return createSuccessResponse({
    ...regra,
    etapas: regrasTramitacaoEtapasService.getByRegra(id)
  }, 'Regra de tramitação encontrada')
}, { permissions: 'tramitacao.view' })

export const PUT = withAuth(async (request: NextRequest, { params }, session) => {
  const id = validateId(params?.id)
  const body = await request.json()
  const payload = UpdateRegraSchema.parse(body)

  const regraAtual = regrasTramitacaoService.getById(id)
  if (!regraAtual) {
    throw new NotFoundError('Regra de tramitação não encontrada')
  }

  const etapas = payload.etapas
  if (etapas) {
    validateEtapas(etapas)
  }

  const regraAtualizada = regrasTramitacaoService.update({
    ...regraAtual,
    ...(payload.nome !== undefined ? { nome: payload.nome } : {}),
    ...(payload.descricao !== undefined ? { descricao: payload.descricao } : {}),
    ...(payload.condicoes !== undefined ? { condicoes: payload.condicoes } : {}),
    ...(payload.acoes !== undefined ? { acoes: payload.acoes } : {}),
    ...(payload.excecoes !== undefined ? { excecoes: payload.excecoes } : {}),
    ...(payload.ativo !== undefined ? { ativo: payload.ativo } : {}),
    ...(payload.ordem !== undefined ? { ordem: payload.ordem } : {})
  } as any) as any

  let etapasAtuais = regrasTramitacaoEtapasService.getByRegra(id)

  if (etapas) {
    regrasTramitacaoEtapasService.deleteByRegra(id)
    etapasAtuais = etapas
      .sort((a, b) => a.ordem - b.ordem)
      .map((etapa, index) =>
        regrasTramitacaoEtapasService.create({
          regraId: id,
          ordem: etapa.ordem ?? index,
          nome: etapa.nome,
          descricao: etapa.descricao,
          tipoTramitacaoId: etapa.tipoTramitacaoId,
          unidadeId: etapa.unidadeId,
          notificacoes: etapa.notificacoes,
          alertas: etapa.alertas,
          prazoDias: etapa.prazoDias ?? undefined
        })
      ) as any
  }

  await logAudit({
    request,
    session,
    action: 'REGRA_TRAMITACAO_UPDATE',
    entity: 'RegraTramitacao',
    entityId: id,
    metadata: {
      nome: regraAtualizada.nome,
      etapas: etapasAtuais.length
    }
  })

  return createSuccessResponse({
    ...regraAtualizada,
    etapas: etapasAtuais
  }, 'Regra de tramitação atualizada com sucesso')
}, { permissions: 'tramitacao.manage' })

export const DELETE = withAuth(async (request: NextRequest, { params }, session) => {
  const id = validateId(params?.id)
  const regra = regrasTramitacaoService.getById(id)

  if (!regra) {
    throw new NotFoundError('Regra de tramitação não encontrada')
  }

  regrasTramitacaoEtapasService.deleteByRegra(id)
  regrasTramitacaoService.delete(id)

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
