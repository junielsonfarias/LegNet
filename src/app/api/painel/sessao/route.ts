/**
 * API do Painel - Controle de Sessao
 * POST: Inicia/Finaliza sessao
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  iniciarSessao,
  finalizarSessao,
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
    const { sessaoId, acao } = body

    if (!sessaoId || !acao) {
      return NextResponse.json(
        { error: 'sessaoId e acao sao obrigatorios' },
        { status: 400 }
      )
    }

    let resultado

    switch (acao) {
      case 'iniciar':
        resultado = await iniciarSessao(sessaoId)
        if (!resultado) {
          return NextResponse.json(
            { error: 'Erro ao iniciar sessao' },
            { status: 400 }
          )
        }
        return NextResponse.json({
          success: true,
          message: 'Sessao iniciada com sucesso',
          data: resultado
        })

      case 'finalizar':
        await finalizarSessao(sessaoId)
        return NextResponse.json({
          success: true,
          message: 'Sessao finalizada com sucesso'
        })

      case 'suspender':
        // Implementar suspensao se necessario
        return NextResponse.json({
          success: true,
          message: 'Sessao suspensa'
        })

      case 'retomar':
        resultado = await iniciarSessao(sessaoId)
        return NextResponse.json({
          success: true,
          message: 'Sessao retomada',
          data: resultado
        })

      default:
        return NextResponse.json(
          { error: 'Acao invalida. Use: iniciar, finalizar, suspender, retomar' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Erro ao controlar sessao:', error)
    return NextResponse.json(
      { error: 'Erro ao controlar sessao' },
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
      data: estado?.sessao || null
    })
  } catch (error) {
    console.error('Erro ao buscar sessao:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar sessao' },
      { status: 500 }
    )
  }
}
