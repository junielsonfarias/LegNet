/**
 * API de Dados Abertos - Ordem Cronologica de Pagamentos
 * RN-008 (LRF / Lei 8.666 art. 5): ordem cronologica e publica obrigatoria.
 * Cumpre PNTP Nivel Diamante - Categoria Financeiro.
 */

import { NextRequest, NextResponse } from 'next/server'
import { dadosAbertosService } from '@/lib/services/dados-abertos-service'
import { enforceRateLimit } from '@/lib/middleware/rate-limit'
import { withErrorHandler } from '@/lib/error-handler'
import { withPublicCache } from '@/lib/http-cache'
import { convertToCSV } from '@/lib/utils/csv-export'


export const GET = withErrorHandler(async (request: NextRequest) => {
  enforceRateLimit(request, 'PUBLIC')

  const info = await dadosAbertosService.getInfo()

  const { searchParams } = new URL(request.url)
  const formato = searchParams.get('formato') || 'json'
  const anoParam = searchParams.get('ano')
  const ano = anoParam ? parseInt(anoParam, 10) : undefined
  const mesParam = searchParams.get('mes')
  const mes = mesParam ? parseInt(mesParam, 10) : undefined
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

  const { dados, total } = await dadosAbertosService.getOrdensPagamento(
    { ano, mes },
    { page, limit }
  )

  if (formato === 'csv') {
    const csv = convertToCSV(dados, [
      'id', 'numero', 'ano', 'mes', 'data', 'credor', 'cnpj_cpf', 'valor',
      'data_vencimento', 'data_pagamento', 'ordem_cronologica', 'fonte_recurso',
      'empenho'
    ])
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="ordem-pagamentos.csv"'
      }
    })
  }

  return withPublicCache(
    NextResponse.json({
      dados,
      metadados: {
        total,
        pagina: page,
        limite: limit,
        paginas: Math.ceil(total / limit),
        atualizacao: new Date().toISOString(),
        fonte: info.nomeCasa,
        licenca: 'CC-BY 4.0',
        referencia_legal: 'Lei 8.666/93 art. 5 e LRF - ordem cronologica publica.'
      }
    }),
    { maxAge: 60, swr: 300 }
  )
})
