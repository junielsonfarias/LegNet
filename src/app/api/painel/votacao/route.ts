/**
 * API do Painel - Controle de Votacao
 * POST: Inicia/Finaliza votacao, registra votos
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  iniciarVotacao,
  finalizarVotacao,
  registrarVoto,
  getEstadoPainel
} from '@/lib/services/painel-tempo-real-service'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Nao autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { sessaoId, acao, proposicaoId, parlamentarId, voto, tempoVotacao } = body

    if (!sessaoId || !acao) {
      return NextResponse.json(
        { error: 'sessaoId e acao sao obrigatorios' },
        { status: 400 }
      )
    }

    switch (acao) {
      case 'iniciar':
        if (!proposicaoId) {
          return NextResponse.json(
            { error: 'proposicaoId e obrigatorio para iniciar votacao' },
            { status: 400 }
          )
        }
        const votacaoIniciada = await iniciarVotacao(sessaoId, proposicaoId, tempoVotacao || 300)
        if (!votacaoIniciada) {
          return NextResponse.json(
            { error: 'Erro ao iniciar votacao' },
            { status: 400 }
          )
        }
        return NextResponse.json({
          success: true,
          message: 'Votacao iniciada com sucesso',
          data: votacaoIniciada
        })

      case 'finalizar':
        const votacaoFinalizada = await finalizarVotacao(sessaoId)
        if (!votacaoFinalizada) {
          return NextResponse.json(
            { error: 'Nenhuma votacao ativa para finalizar' },
            { status: 400 }
          )
        }
        return NextResponse.json({
          success: true,
          message: 'Votacao finalizada',
          data: votacaoFinalizada
        })

      case 'votar':
        if (!parlamentarId || !voto) {
          return NextResponse.json(
            { error: 'parlamentarId e voto sao obrigatorios' },
            { status: 400 }
          )
        }
        if (!['SIM', 'NAO', 'ABSTENCAO'].includes(voto)) {
          return NextResponse.json(
            { error: 'Voto invalido. Use: SIM, NAO, ABSTENCAO' },
            { status: 400 }
          )
        }
        const votoRegistrado = await registrarVoto(sessaoId, parlamentarId, voto)
        if (!votoRegistrado) {
          return NextResponse.json(
            { error: 'Erro ao registrar voto. Votacao pode estar fechada ou parlamentar nao encontrado.' },
            { status: 400 }
          )
        }
        return NextResponse.json({
          success: true,
          message: 'Voto registrado com sucesso'
        })

      default:
        return NextResponse.json(
          { error: 'Acao invalida. Use: iniciar, finalizar, votar' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Erro no controle de votacao:', error)
    return NextResponse.json(
      { error: 'Erro no controle de votacao' },
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
        { error: 'sessaoId e obrigatorio' },
        { status: 400 }
      )
    }

    const estado = await getEstadoPainel(sessaoId)

    return NextResponse.json({
      success: true,
      data: estado?.votacaoAtiva || null
    })
  } catch (error) {
    console.error('Erro ao buscar votacao:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar votacao' },
      { status: 500 }
    )
  }
}
