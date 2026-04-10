import { NextRequest, NextResponse } from 'next/server'
import { ouvidoriaService } from '@/lib/services/ouvidoria-service'
import { withErrorHandler } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

/**
 * GET - Estatísticas da ouvidoria (público)
 * Não requer autenticação
 */
export const GET = withErrorHandler(async (_request: NextRequest) => {
  const estatisticas = await ouvidoriaService.estatisticas()

  return new NextResponse(
    JSON.stringify({ success: true, data: estatisticas }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300'
      }
    }
  )
})
