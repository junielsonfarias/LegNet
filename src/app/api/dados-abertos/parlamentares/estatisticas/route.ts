/**
 * API de Dados Abertos - Estatísticas dos Parlamentares
 * Retorna contagem de sessões e proposições por parlamentar
 */

import { NextRequest, NextResponse } from 'next/server'
import { dadosAbertosService } from '@/lib/services/dados-abertos-service'
import { enforceRateLimit } from '@/lib/middleware/rate-limit'
import { withErrorHandler } from '@/lib/error-handler'
import { withPublicCache } from '@/lib/http-cache'


export const GET = withErrorHandler(async (request: NextRequest) => {
  enforceRateLimit(request, 'PUBLIC')

  const [info, { dados, total }] = await Promise.all([
    dadosAbertosService.getInfo(),
    dadosAbertosService.getEstatisticasParlamentares()
  ])

  return withPublicCache(
    NextResponse.json({
    dados,
    metadados: {
      total,
      atualizacao: new Date().toISOString(),
      fonte: info.nomeCasa
    }
  }),
    { maxAge: 60, swr: 300 }
  )
})
