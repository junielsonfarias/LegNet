/**
 * API do Painel - Controle de Votacao
 * POST: Inicia/Finaliza votacao, registra votos
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validação inicial para determinar a ação
    const baseValidation = VotacaoBaseSchema.safeParse(body)
    if (!baseValidation.success) {
      return NextResponse.json(
        { success: false, error: baseValidation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { acao, sessaoId } = baseValidation.data

    switch (acao) {
      case 'iniciar': {
        const validation = VotacaoIniciarSchema.safeParse(body)
        if (!validation.success) {
          return NextResponse.json(
            { success: false, error: validation.error.errors[0].message },
            { status: 400 }
          )
        }
        const { proposicaoId, tempoVotacao } = validation.data
        const votacaoIniciada = await iniciarVotacao(sessaoId, proposicaoId, tempoVotacao)
        if (!votacaoIniciada) {
          return NextResponse.json(
            { success: false, error: 'Erro ao iniciar votação' },
            { status: 400 }
          )
        }
        return NextResponse.json({
          success: true,
          message: 'Votação iniciada com sucesso',
          data: votacaoIniciada
        })
      }

      case 'finalizar': {
        const votacaoFinalizada = await finalizarVotacao(sessaoId)
        if (!votacaoFinalizada) {
          return NextResponse.json(
            { success: false, error: 'Nenhuma votação ativa para finalizar' },
            { status: 400 }
          )
        }
        return NextResponse.json({
          success: true,
          message: 'Votação finalizada',
          data: votacaoFinalizada
        })
      }

      case 'votar': {
        const validation = VotacaoVotarSchema.safeParse(body)
        if (!validation.success) {
          return NextResponse.json(
            { success: false, error: validation.error.errors[0].message },
            { status: 400 }
          )
        }
        const { parlamentarId, voto } = validation.data
        const votoRegistrado = await registrarVoto(sessaoId, parlamentarId, voto)
        if (!votoRegistrado) {
          return NextResponse.json(
            { success: false, error: 'Erro ao registrar voto. Votação pode estar fechada ou parlamentar não encontrado.' },
            { status: 400 }
          )
        }
        return NextResponse.json({
          success: true,
          message: 'Voto registrado com sucesso'
        })
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Ação inválida' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Erro no controle de votação:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno no controle de votação' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessaoId = searchParams.get('sessaoId')

    if (!sessaoId) {
      return NextResponse.json(
        { success: false, error: 'sessaoId é obrigatório' },
        { status: 400 }
      )
    }

    const estado = await getEstadoPainel(sessaoId)

    return NextResponse.json({
      success: true,
      data: estado?.votacaoAtiva || null
    })
  } catch (error) {
    console.error('Erro ao buscar votação:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar votação' },
      { status: 500 }
    )
  }
}
