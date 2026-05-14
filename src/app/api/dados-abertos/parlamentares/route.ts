/**
 * API de Dados Abertos - Parlamentares
 * Retorna lista de parlamentares com dados publicos
 */

import { NextRequest, NextResponse } from 'next/server'
import { dadosAbertosService } from '@/lib/services/dados-abertos-service'
import { enforceRateLimit } from '@/lib/middleware/rate-limit'
import { withErrorHandler } from '@/lib/error-handler'
import { withPublicCache } from '@/lib/http-cache'
import { convertToCSV } from '@/lib/utils/csv-export'


export const GET = withErrorHandler(async (request: NextRequest) => {
  enforceRateLimit(request, 'PUBLIC')

  const { searchParams } = new URL(request.url)
  const formato = searchParams.get('formato') || 'json'
  const legislaturaId = searchParams.get('legislatura') || undefined

  const [info, { dados }] = await Promise.all([
    dadosAbertosService.getInfo(),
    dadosAbertosService.getParlamentares({ legislaturaId })
  ])

  // Retornar em formato CSV se solicitado
  if (formato === 'csv') {
    const csv = convertToCSV(dados, [
      'id', 'nome', 'apelido', 'partido', 'cargo', 'email', 'telefone'
    ])
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="parlamentares.csv"'
      }
    })
  }

  return withPublicCache(
    NextResponse.json({
    dados,
    metadados: {
      total: dados.length,
      atualizacao: new Date().toISOString(),
      fonte: info.nomeCasa
    }
  }),
    { maxAge: 60, swr: 300 }
  )
})
