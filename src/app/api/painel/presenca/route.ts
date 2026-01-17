/**
 * API do Painel - Controle de Presenca
 * POST: Registra presenca de parlamentares
 * GET: Busca lista de presenca
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  registrarPresenca,
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
    const { sessaoId, parlamentarId, presente, justificativa } = body

    if (!sessaoId || !parlamentarId || presente === undefined) {
      return NextResponse.json(
        { error: 'sessaoId, parlamentarId e presente sao obrigatorios' },
        { status: 400 }
      )
    }

    const sucesso = await registrarPresenca(sessaoId, parlamentarId, presente, justificativa)

    if (!sucesso) {
      return NextResponse.json(
        { error: 'Erro ao registrar presenca' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: presente ? 'Presenca registrada' : 'Ausencia registrada'
    })
  } catch (error) {
    console.error('Erro ao registrar presenca:', error)
    return NextResponse.json(
      { error: 'Erro ao registrar presenca' },
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

    if (!estado) {
      return NextResponse.json(
        { error: 'Sessao nao encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        presencas: estado.presencas,
        estatisticas: {
          total: estado.estatisticas.totalParlamentares,
          presentes: estado.estatisticas.presentes,
          ausentes: estado.estatisticas.ausentes,
          percentual: estado.estatisticas.percentualPresenca
        }
      }
    })
  } catch (error) {
    console.error('Erro ao buscar presencas:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar presencas' },
      { status: 500 }
    )
  }
}
