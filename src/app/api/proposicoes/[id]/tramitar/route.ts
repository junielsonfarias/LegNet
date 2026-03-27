/**
 * API POST /api/proposicoes/[id]/tramitar
 * Avanca a tramitacao de uma proposicao para a proxima etapa do fluxo
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/permissions'
import { createSuccessResponse, NotFoundError, ValidationError, validateId } from '@/lib/error-handler'
import { logAudit } from '@/lib/audit'
import {
  avancarEtapaFluxo,
  obterEtapaAtual,
  tramitarParaAguardandoPauta,
  findProposicaoBasic,
  updateProposicaoStatus
} from '@/lib/services/tramitacao-service'

// Schema de validacao
const TramitarSchema = z.object({
  // Acao a ser executada (padrao: AVANCAR_ETAPA)
  acao: z.enum(['AVANCAR_ETAPA', 'AGUARDANDO_PAUTA']).optional().default('AVANCAR_ETAPA'),
  observacoes: z.string().optional(),
  parecer: z.enum([
    'FAVORAVEL',
    'CONTRARIO',
    'FAVORAVEL_COM_EMENDAS',
    'PELA_INCONSTITUCIONALIDADE',
    'INCOMPETENCIA'
  ]).optional(),
  resultado: z.enum([
    'APROVADO',
    'REJEITADO',
    'APROVADO_COM_EMENDAS',
    'ARQUIVADO'
  ]).optional()
})

/**
 * POST - Avanca a tramitacao da proposicao
 */
export const POST = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
  session
) => {
  const { id: rawId } = await params
  const proposicaoId = validateId(rawId, 'Proposição')

  // Verifica se proposicao existe
  const proposicao = await findProposicaoBasic(proposicaoId)

  if (!proposicao) {
    throw new NotFoundError('Proposição')
  }

  // Valida payload
  const body = await request.json()
  const payload = TramitarSchema.safeParse(body)

  if (!payload.success) {
    throw new ValidationError(payload.error.issues[0]?.message ?? 'Dados inválidos')
  }

  const { acao, observacoes, parecer, resultado } = payload.data

  // Obtem IP do cliente
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown'

  // Executa acao conforme solicitado
  if (acao === 'AGUARDANDO_PAUTA') {
    // Tramita diretamente para Aguardando Pauta (Secretaria Legislativa)
    const resultadoTramitar = await tramitarParaAguardandoPauta(
      proposicaoId,
      observacoes,
      session.user.id,
      ip
    )

    if (!resultadoTramitar.valid) {
      throw new ValidationError(resultadoTramitar.errors.join('; '))
    }

    // Registra auditoria
    await logAudit({
      request,
      session,
      action: 'TRAMITACAO_AGUARDANDO_PAUTA',
      entity: 'Tramitacao',
      entityId: resultadoTramitar.tramitacaoId || proposicaoId,
      metadata: {
        proposicaoId,
        proposicaoNumero: `${proposicao.numero}/${proposicao.ano}`,
        novoStatus: 'AGUARDANDO_PAUTA',
        observacoes
      }
    })

    return createSuccessResponse(
      {
        proposicaoId,
        tramitacaoId: resultadoTramitar.tramitacaoId,
        proposicaoStatus: 'AGUARDANDO_PAUTA',
        warnings: resultadoTramitar.warnings
      },
      'Proposição tramitada para Aguardando Pauta'
    )
  }

  // Acao padrao: AVANCAR_ETAPA
  const resultadoAvancar = await avancarEtapaFluxo(
    proposicaoId,
    observacoes,
    parecer,
    resultado,
    session.user.id,
    ip
  )

  // Se nao ha tramitacao ativa, tenta atualizar o status diretamente baseado no resultado
  if (!resultadoAvancar.success) {
    // Verifica se o erro e por falta de tramitacao
    const erroSemTramitacao = resultadoAvancar.errors.some((e: string) =>
      e.includes('não possui tramitação') || e.includes('tramitação em andamento')
    )

    if (erroSemTramitacao && resultado) {
      // Atualiza status da proposicao diretamente baseado no resultado
      let novoStatus: 'APROVADA' | 'REJEITADA' | 'ARQUIVADA' | 'EM_TRAMITACAO' = 'EM_TRAMITACAO'
      if (resultado === 'APROVADO' || resultado === 'APROVADO_COM_EMENDAS') {
        novoStatus = 'APROVADA'
      } else if (resultado === 'REJEITADO') {
        novoStatus = 'REJEITADA'
      } else if (resultado === 'ARQUIVADO') {
        novoStatus = 'ARQUIVADA'
      }

      await updateProposicaoStatus(proposicaoId, novoStatus)

      // Registra auditoria
      await logAudit({
        request,
        session,
        action: 'TRAMITACAO_STATUS_DIRETO',
        entity: 'Proposicao',
        entityId: proposicaoId,
        metadata: {
          proposicaoId,
          proposicaoNumero: `${proposicao.numero}/${proposicao.ano}`,
          resultado,
          novoStatus,
          observacoes
        }
      })

      return createSuccessResponse(
        {
          proposicaoId,
          tramitacaoAnterior: null,
          tramitacaoNova: null,
          etapaFinal: true,
          proposicaoStatus: novoStatus,
          warnings: ['Status atualizado diretamente (sem fluxo de tramitação configurado)']
        },
        'Status da proposição atualizado com sucesso'
      )
    }

    throw new ValidationError(resultadoAvancar.errors.join('; '))
  }

  // Registra auditoria
  await logAudit({
    request,
    session,
    action: 'TRAMITACAO_AVANCADA',
    entity: 'Tramitacao',
    entityId: resultadoAvancar.tramitacaoNova?.id || resultadoAvancar.tramitacaoAnterior?.id || proposicaoId,
    metadata: {
      proposicaoId,
      proposicaoNumero: `${proposicao.numero}/${proposicao.ano}`,
      etapaAnterior: resultadoAvancar.tramitacaoAnterior?.etapa,
      etapaNova: resultadoAvancar.tramitacaoNova?.etapa,
      parecer,
      resultado,
      etapaFinal: resultadoAvancar.etapaFinal,
      novoStatusProposicao: resultadoAvancar.proposicaoStatus
    }
  })

  return createSuccessResponse(
    {
      proposicaoId,
      tramitacaoAnterior: resultadoAvancar.tramitacaoAnterior,
      tramitacaoNova: resultadoAvancar.tramitacaoNova,
      etapaFinal: resultadoAvancar.etapaFinal,
      proposicaoStatus: resultadoAvancar.proposicaoStatus,
      warnings: resultadoAvancar.warnings
    },
    resultadoAvancar.etapaFinal
      ? 'Tramitação finalizada com sucesso'
      : 'Tramitação avançada para próxima etapa'
  )
}, { permissions: 'tramitacao.manage' })

/**
 * GET - Obtem informacoes da etapa atual da tramitacao
 */
export const GET = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
  session
) => {
  const { id: rawId } = await params
  const proposicaoId = validateId(rawId, 'Proposição')

  // Verifica se proposicao existe
  const proposicao = await findProposicaoBasic(proposicaoId)

  if (!proposicao) {
    throw new NotFoundError('Proposição')
  }

  // Obtem etapa atual
  const etapaAtual = await obterEtapaAtual(proposicaoId)

  return createSuccessResponse(
    {
      proposicao: {
        id: proposicao.id,
        numero: proposicao.numero,
        ano: proposicao.ano,
        tipo: proposicao.tipo,
        titulo: proposicao.titulo,
        status: proposicao.status
      },
      tramitacao: etapaAtual?.tramitacao || null,
      etapaAtual: etapaAtual?.etapa || null,
      fluxo: etapaAtual?.fluxo || null,
      podeAvancar: etapaAtual?.tramitacao?.status === 'EM_ANDAMENTO',
      requerParecer: etapaAtual?.etapa?.requerParecer || false,
      ehEtapaFinal: etapaAtual?.etapa?.ehEtapaFinal || false,
      habilitaPauta: etapaAtual?.etapa?.habilitaPauta || false
    },
    'Informações de tramitação obtidas com sucesso'
  )
}, { permissions: 'proposicao.view' })
