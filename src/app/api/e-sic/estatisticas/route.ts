import { NextRequest, NextResponse } from 'next/server'
import { esicService } from '@/lib/services/esic-service'
import { withErrorHandler, createSuccessResponse } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

/**
 * GET - Estatísticas do e-SIC (público)
 * Não requer autenticação
 */
export const GET = withErrorHandler(async (_request: NextRequest) => {
  const estatisticas = await esicService.estatisticas()

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
