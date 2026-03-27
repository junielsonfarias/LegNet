import { NextRequest, NextResponse } from 'next/server'
import { ouvidoriaService } from '@/lib/services/ouvidoria-service'

export const dynamic = 'force-dynamic'

/**
 * GET - Estatísticas da ouvidoria (público)
 * Não requer autenticação
 */
export async function GET(request: NextRequest) {
  try {
    const estatisticas = await ouvidoriaService.estatisticas()

    return NextResponse.json({
      success: true,
      data: estatisticas
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300'
      }
    })
  } catch (error) {
    console.error('Erro ao buscar estatísticas da ouvidoria:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
