import { NextRequest, NextResponse } from 'next/server'
import { esicService } from '@/lib/services/esic-service'

export const dynamic = 'force-dynamic'

/**
 * GET - Estatísticas do e-SIC (público)
 * Não requer autenticação
 */
export async function GET(request: NextRequest) {
  try {
    const estatisticas = await esicService.estatisticas()

    return NextResponse.json({
      success: true,
      data: estatisticas
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300'
      }
    })
  } catch (error) {
    console.error('Erro ao buscar estatísticas e-SIC:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
