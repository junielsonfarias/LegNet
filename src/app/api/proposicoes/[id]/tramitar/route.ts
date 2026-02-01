/**
 * API POST /api/proposicoes/[id]/tramitar
 * Avança a tramitação de uma proposição para a próxima etapa do fluxo
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/permissions'
import { createSuccessResponse, NotFoundError, ValidationError, validateId } from '@/lib/error-handler'
import { logAudit } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import {
  avancarEtapaFluxo,
  obterEtapaAtual,
  tramitarParaAguardandoPauta
} from '@/lib/services/tramitacao-service'

// Schema de validação
const TramitarSchema = z.object({
  // Ação a ser executada (padrão: AVANCAR_ETAPA)
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
 * POST - Avança a tramitação da proposição
 */
export const POST = withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } },
  session
) => {
  const proposicaoId = validateId(params.id, 'Proposição')

  // Verifica se proposição existe
  const proposicao = await prisma.proposicao.findUnique({
    where: { id: proposicaoId },
    select: {
      id: true,
      numero: true,
      ano: true,
      tipo: true,
      titulo: true,
      status: true
    }
  })

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

  // Obtém IP do cliente
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown'

  // Executa ação conforme solicitado
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

  // Ação padrão: AVANCAR_ETAPA
  const resultadoAvancar = await avancarEtapaFluxo(
    proposicaoId,
    observacoes,
    parecer,
    resultado,
    session.user.id,
    ip
  )

  if (!resultadoAvancar.success) {
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
 * GET - Obtém informações da etapa atual da tramitação
 */
export const GET = withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } },
  session
) => {
  const proposicaoId = validateId(params.id, 'Proposição')

  // Verifica se proposição existe
  const proposicao = await prisma.proposicao.findUnique({
    where: { id: proposicaoId },
    select: {
      id: true,
      numero: true,
      ano: true,
      tipo: true,
      titulo: true,
      status: true
    }
  })

  if (!proposicao) {
    throw new NotFoundError('Proposição')
  }

  // Obtém etapa atual
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
