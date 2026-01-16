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
  tramitacoesService,
  tiposTramitacaoService,
  tiposOrgaosService,
  tramitacaoHistoricosService,
  tramitacaoNotificacoesService
} from '@/lib/tramitacao-service'

export const dynamic = 'force-dynamic'

const StatusEnum = z.enum(['EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA'])
const ResultadoEnum = z.enum(['APROVADO', 'REJEITADO', 'APROVADO_COM_EMENDAS', 'ARQUIVADO'])

const UpdateTramitacaoSchema = z.object({
  tipoTramitacaoId: z.string().optional(),
  unidadeId: z.string().optional(),
  dataEntrada: z.string().datetime({ message: 'dataEntrada deve estar no formato ISO 8601' }).optional(),
  dataSaida: z
    .union([
      z.string().datetime({ message: 'dataSaida deve estar no formato ISO 8601' }),
      z.null()
    ])
    .optional(),
  status: StatusEnum.optional(),
  observacoes: z.union([z.string(), z.null()]).optional(),
  parecer: z.union([z.string(), z.null()]).optional(),
  resultado: z.union([ResultadoEnum, z.null()]).optional(),
  responsavelId: z.union([z.string(), z.null()]).optional(),
  prazoVencimento: z
    .union([
      z.string().datetime({ message: 'prazoVencimento deve estar no formato ISO 8601' }),
      z.null()
    ])
    .optional(),
  diasVencidos: z.union([z.number().int().min(0), z.null()]).optional(),
  automatica: z.boolean().optional()
})

const buildTramitacaoResponse = (tramitacao: ReturnType<typeof tramitacoesService.getAll>[number]) => ({
  ...tramitacao,
  tipoTramitacao: tiposTramitacaoService.getById(tramitacao.tipoTramitacaoId) || null,
  unidade: tiposOrgaosService.getById(tramitacao.unidadeId) || null
})

const ActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('advance'),
    comentario: z.union([z.string(), z.null()]).optional(),
    regraId: z.string().optional(),
    etapaId: z.string().optional()
  }),
  z.object({
    action: z.literal('reopen'),
    observacoes: z.union([z.string(), z.null()]).optional()
  }),
  z.object({
    action: z.literal('finalize'),
    observacoes: z.union([z.string(), z.null()]).optional(),
    resultado: z.union([ResultadoEnum, z.null()]).optional()
  })
])

export const GET = withAuth(async (_request: NextRequest, { params }) => {
  const id = validateId(params?.id)
  const tramitacao = tramitacoesService.getById(id)

  if (!tramitacao) {
    throw new NotFoundError('Tramitação não encontrada')
  }

  const historicos = tramitacaoHistoricosService.getByTramitacao(id)
  const notificacoes = tramitacaoNotificacoesService.getByTramitacao(id)

  return createSuccessResponse(
    {
      ...buildTramitacaoResponse(tramitacao),
      historicos,
      notificacoes
    },
    'Tramitação encontrada'
  )
}, { permissions: 'tramitacao.view' })

export const PUT = withAuth(async (request: NextRequest, { params }, session) => {
  const id = validateId(params?.id)
  const body = await request.json()

  const actionResult = ActionSchema.safeParse(body)
  if (actionResult.success) {
    const actionPayload = actionResult.data
    const atual = tramitacoesService.getById(id)
    if (!atual) {
      throw new NotFoundError('Tramitação não encontrada')
    }

    if (actionPayload.action === 'advance') {
      const resultado = tramitacoesService.advance(id, {
        usuarioId: session.user.id,
        comentario: actionPayload.comentario,
        regraId: actionPayload.regraId,
        etapaId: actionPayload.etapaId
      })

      await logAudit({
        request,
        session,
        action: 'TRAMITACAO_ADVANCE',
        entity: 'Tramitacao',
        entityId: id,
        metadata: {
          proposicaoId: atual.proposicaoId,
          regraId: resultado.regraAplicada?.id ?? null,
          etapaDestinoId: resultado.etapaDestino?.id ?? null,
          novaEtapaId: resultado.novaEtapa?.id ?? null
        }
      })

      return createSuccessResponse(
        {
          etapaFinalizada: buildTramitacaoResponse(resultado.etapaFinalizada),
          novaEtapa: resultado.novaEtapa ? buildTramitacaoResponse(resultado.novaEtapa) : null,
          regraAplicada: resultado.regraAplicada,
          etapaDestino: resultado.etapaDestino,
          historicos: resultado.historicos,
          notificacoes: resultado.notificacoes
        },
        resultado.novaEtapa ? 'Tramitação avançada para a próxima etapa' : 'Tramitação finalizada'
      )
    }

    if (actionPayload.action === 'reopen') {
      const resultado = tramitacoesService.reopen(id, {
        usuarioId: session.user.id,
        observacoes: actionPayload.observacoes
      })

      await logAudit({
        request,
        session,
        action: 'TRAMITACAO_REOPEN',
        entity: 'Tramitacao',
        entityId: id,
        metadata: {
          proposicaoId: resultado.tramitacao.proposicaoId,
          motivo: actionPayload.observacoes ?? null
        }
      })

      return createSuccessResponse(
        buildTramitacaoResponse(resultado.tramitacao),
        'Tramitação reaberta com sucesso'
      )
    }

    if (actionPayload.action === 'finalize') {
      const resultado = tramitacoesService.finalize(id, {
        usuarioId: session.user.id,
        resultado: actionPayload.resultado ?? undefined,
        observacoes: actionPayload.observacoes ?? undefined
      })

      await logAudit({
        request,
        session,
        action: 'TRAMITACAO_FINALIZE',
        entity: 'Tramitacao',
        entityId: id,
        metadata: {
          proposicaoId: resultado.tramitacao.proposicaoId,
          resultado: resultado.tramitacao.resultado ?? null
        }
      })

      return createSuccessResponse(
        buildTramitacaoResponse(resultado.tramitacao),
        'Tramitação finalizada com sucesso'
      )
    }
  }

  const payload = UpdateTramitacaoSchema.parse(body)

  const atual = tramitacoesService.getById(id)
  if (!atual) {
    throw new NotFoundError('Tramitação não encontrada')
  }

  const tipoId = payload.tipoTramitacaoId ?? atual.tipoTramitacaoId
  const tipo = tiposTramitacaoService.getById(tipoId)
  if (!tipo) {
    throw new ValidationError('Tipo de tramitação não encontrado')
  }

  const resolvedUnidadeId =
    payload.unidadeId ??
    (payload.tipoTramitacaoId
      ? (tipo.unidadeResponsavelId ?? tipo.unidadeResponsavel ?? atual.unidadeId)
      : atual.unidadeId)

  const unidade = tiposOrgaosService.getById(resolvedUnidadeId)
  if (!unidade) {
    throw new ValidationError('Unidade responsável não encontrada')
  }

  const status = (payload.status ?? atual.status ?? 'EM_ANDAMENTO').toUpperCase() as z.infer<typeof StatusEnum>

  const dataEntrada = payload.dataEntrada ? new Date(payload.dataEntrada).toISOString() : atual.dataEntrada
  let dataSaida = payload.dataSaida === null ? undefined : payload.dataSaida ? new Date(payload.dataSaida).toISOString() : atual.dataSaida

  if (status === 'CONCLUIDA' && !dataSaida) {
    dataSaida = new Date().toISOString()
  }

  let prazoVencimento = payload.prazoVencimento === null
    ? undefined
    : payload.prazoVencimento
      ? new Date(payload.prazoVencimento).toISOString()
      : atual.prazoVencimento

  if (!prazoVencimento && status === 'EM_ANDAMENTO') {
    prazoVencimento = tramitacoesService.calcularPrazoVencimento(tipo.id).toISOString()
  }

  let diasVencidos = payload.diasVencidos === null ? undefined : payload.diasVencidos ?? atual.diasVencidos
  if (diasVencidos === undefined && prazoVencimento) {
    const diff = Date.now() - new Date(prazoVencimento).getTime()
    diasVencidos = diff > 0 ? Math.floor(diff / (1000 * 60 * 60 * 24)) : 0
  }

  const atualizado = tramitacoesService.update({
    ...atual,
    tipoTramitacaoId: tipoId,
    unidadeId: resolvedUnidadeId,
    dataEntrada,
    dataSaida,
    status,
    observacoes: payload.observacoes === undefined ? atual.observacoes : payload.observacoes ?? undefined,
    parecer: payload.parecer === undefined ? atual.parecer : payload.parecer ?? undefined,
    resultado: payload.resultado === undefined ? atual.resultado : payload.resultado ?? undefined,
    responsavelId: payload.responsavelId === undefined ? atual.responsavelId : payload.responsavelId ?? undefined,
    prazoVencimento,
    diasVencidos,
    automatica: payload.automatica ?? atual.automatica
  })

  await tramitacaoHistoricosService.create({
    tramitacaoId: atualizado.id,
    acao: 'ATUALIZACAO',
    descricao: 'Tramitação atualizada',
    usuarioId: session.user.id,
    proposicaoId: atualizado.proposicaoId,
    dadosAnteriores: atual,
    dadosNovos: atualizado
  })

  await logAudit({
    request,
    session,
    action: 'TRAMITACAO_UPDATE',
    entity: 'Tramitacao',
    entityId: atualizado.id,
    metadata: {
      tipoTramitacaoId: tipoId,
      unidadeId: resolvedUnidadeId,
      status
    }
  })

  return createSuccessResponse(
    buildTramitacaoResponse(atualizado),
    'Tramitação atualizada com sucesso'
  )
}, { permissions: 'tramitacao.manage' })

export const DELETE = withAuth(async (request: NextRequest, { params }, session) => {
  const id = validateId(params?.id)
  const tramitacao = tramitacoesService.getById(id)

  if (!tramitacao) {
    throw new NotFoundError('Tramitação não encontrada')
  }

  tramitacoesService.delete(id)
  tramitacaoHistoricosService.deleteByTramitacao(id)
  tramitacaoNotificacoesService.deleteByTramitacao(id)

  await logAudit({
    request,
    session,
    action: 'TRAMITACAO_DELETE',
    entity: 'Tramitacao',
    entityId: id,
    metadata: {
      proposicaoId: tramitacao.proposicaoId,
      tipoTramitacaoId: tramitacao.tipoTramitacaoId,
      unidadeId: tramitacao.unidadeId
    }
  })

  return createSuccessResponse({ id }, 'Tramitação removida com sucesso')
}, { permissions: 'tramitacao.manage' })
