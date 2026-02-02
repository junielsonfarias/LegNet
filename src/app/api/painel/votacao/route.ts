/**
 * API do Painel - Controle de Votacao
 * POST: Inicia/Finaliza votacao, registra votos
 * SEGURANÇA: Requer autenticação e permissão votacao.manage
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/permissions'
import { withErrorHandler, createSuccessResponse, ValidationError } from '@/lib/error-handler'
import {
  iniciarVotacao,
  finalizarVotacao,
  registrarVoto,
  getEstadoPainel
} from '@/lib/services/painel-tempo-real-service'

export const dynamic = 'force-dynamic'

// Schema de validação para votação
const VotacaoBaseSchema = z.object({
  sessaoId: z.string().min(1, 'sessaoId é obrigatório'),
  acao: z.enum(['iniciar', 'finalizar', 'votar'], {
    errorMap: () => ({ message: 'Ação inválida. Use: iniciar, finalizar, votar' })
  })
})

const VotacaoIniciarSchema = VotacaoBaseSchema.extend({
  acao: z.literal('iniciar'),
  proposicaoId: z.string().min(1, 'proposicaoId é obrigatório para iniciar votação'),
  tempoVotacao: z.number().min(30).max(3600).optional().default(300)
})

const VotacaoFinalizarSchema = VotacaoBaseSchema.extend({
  acao: z.literal('finalizar')
})

const VotacaoVotarSchema = VotacaoBaseSchema.extend({
  acao: z.literal('votar'),
  parlamentarId: z.string().min(1, 'parlamentarId é obrigatório'),
  voto: z.enum(['SIM', 'NAO', 'ABSTENCAO'], {
    errorMap: () => ({ message: 'Voto inválido. Use: SIM, NAO, ABSTENCAO' })
  })
})

/**
 * POST - Controle de votação (iniciar, finalizar, votar)
 * SEGURANÇA: Requer permissão votacao.manage
 */
export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json()

  // Validação inicial para determinar a ação
  const baseValidation = VotacaoBaseSchema.safeParse(body)
  if (!baseValidation.success) {
    throw new ValidationError(baseValidation.error.errors[0].message)
  }

  const { acao, sessaoId } = baseValidation.data

  switch (acao) {
    case 'iniciar': {
      const validation = VotacaoIniciarSchema.safeParse(body)
      if (!validation.success) {
        throw new ValidationError(validation.error.errors[0].message)
      }
      const { proposicaoId, tempoVotacao } = validation.data
      const votacaoIniciada = await iniciarVotacao(sessaoId, proposicaoId, tempoVotacao)
      if (!votacaoIniciada) {
        throw new ValidationError('Erro ao iniciar votação')
      }
      return createSuccessResponse(votacaoIniciada, 'Votação iniciada com sucesso')
    }

    case 'finalizar': {
      const votacaoFinalizada = await finalizarVotacao(sessaoId)
      if (!votacaoFinalizada) {
        throw new ValidationError('Nenhuma votação ativa para finalizar')
      }
      return createSuccessResponse(votacaoFinalizada, 'Votação finalizada')
    }

    case 'votar': {
      const validation = VotacaoVotarSchema.safeParse(body)
      if (!validation.success) {
        throw new ValidationError(validation.error.errors[0].message)
      }
      const { parlamentarId, voto } = validation.data
      const votoRegistrado = await registrarVoto(sessaoId, parlamentarId, voto)
      if (!votoRegistrado) {
        throw new ValidationError('Erro ao registrar voto. Votação pode estar fechada ou parlamentar não encontrado.')
      }
      return createSuccessResponse({ registered: true }, 'Voto registrado com sucesso')
    }

    default:
      throw new ValidationError('Ação inválida')
  }
}, { permissions: 'votacao.manage' })

/**
 * GET - Buscar estado da votação
 * SEGURANÇA: Requer autenticação (GET é menos restritivo)
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const sessaoId = searchParams.get('sessaoId')

  if (!sessaoId) {
    throw new ValidationError('sessaoId é obrigatório')
  }

  const estado = await getEstadoPainel(sessaoId)

  return createSuccessResponse(estado?.votacaoAtiva || null, 'Estado da votação')
})
