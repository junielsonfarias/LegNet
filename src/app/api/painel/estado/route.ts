/**
 * API do Painel em Tempo Real - Estado
 * GET: Retorna estado atual do painel para uma sessao
 */

import { NextRequest, NextResponse } from 'next/server'
import { getEstadoPainel } from '@/lib/services/painel-tempo-real-service'

export const dynamic = 'force-dynamic'

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
      data: estado,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Erro ao buscar estado do painel:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar estado do painel' },
      { status: 500 }
    )
  }
}
