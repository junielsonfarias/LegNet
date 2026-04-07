import { NextRequest } from 'next/server'
import { z } from 'zod'
import {
  withErrorHandler,
  createSuccessResponse,
  ValidationError,
  NotFoundError,
  validateId
} from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { pareceresDbService } from '@/lib/services/pareceres-db-service'

export const dynamic = 'force-dynamic'

const VotarSchema = z.object({
  parlamentarId: z.string().min(1, 'Parlamentar é obrigatório'),
  voto: z.enum(['SIM', 'NAO', 'ABSTENCAO']),
  observacoes: z.string().nullish().transform(v => v ?? undefined)
})

const EncerrarVotacaoSchema = z.object({
  resultado: z.enum(['APROVADO_COMISSAO', 'REJEITADO_COMISSAO']),
  motivoRejeicao: z.string().nullish().transform(v => v ?? undefined)
})

// POST - Registrar voto de membro da comissão sobre o parecer
// SEGURANÇA: Requer autenticação e permissão de gestão de comissões
export const POST = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: rawId } = await context.params
  const parecerId = validateId(rawId, 'Parecer')
  const body = await request.json()

  // Verificar se é uma ação de encerrar votação
  if (body.action === 'encerrar') {
    const validatedData = EncerrarVotacaoSchema.parse(body)
    try {
      const parecerAtualizado = await pareceresDbService.closeVoting(
        parecerId,
        validatedData.resultado,
        validatedData.motivoRejeicao
      )
      return createSuccessResponse(
        parecerAtualizado,
        `Votação encerrada. Parecer ${validatedData.resultado === 'APROVADO_COMISSAO' ? 'aprovado' : 'rejeitado'} pela comissão.`
      )
    } catch (error: any) {
      throw new ValidationError(error.message)
    }
  }

  const validatedData = VotarSchema.parse(body)

  try {
    const resultado = await pareceresDbService.votar(
      parecerId,
      validatedData.parlamentarId,
      validatedData.voto,
      validatedData.observacoes
    )
    return createSuccessResponse(resultado, 'Voto registrado com sucesso')
  } catch (error: any) {
    if (error.message === 'Parecer não encontrado') {
      throw new NotFoundError('Parecer')
    }
    throw new ValidationError(error.message)
  }
}, { permissions: 'comissao.manage' })

// GET - Obter votos do parecer
export const GET = withErrorHandler(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: rawId } = await context.params
  const parecerId = validateId(rawId, 'Parecer')

  try {
    const votingStatus = await pareceresDbService.getVotingStatus(parecerId)
    return createSuccessResponse(votingStatus, 'Votos obtidos com sucesso')
  } catch (error: any) {
    if (error.message === 'Parecer não encontrado') {
      throw new NotFoundError('Parecer')
    }
    throw error
  }
})
