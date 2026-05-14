/**
 * API de Dados Abertos - Proposicoes
 * Retorna lista de proposicoes legislativas
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
  const tipo = searchParams.get('tipo') || undefined
  const status = searchParams.get('status') || undefined
  const autorId = searchParams.get('autor') || undefined
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

  const { dados, total } = await dadosAbertosService.getProposicoes(
    { ano, tipo, status, autorId },
    { page, limit }
  )

  if (formato === 'csv') {
    const csv = convertToCSV(dados.map(p => ({
      ...p,
      autor_nome: p.autor?.nome || '',
      autor_partido: p.autor?.partido || ''
    })), [
      'id', 'numero', 'ano', 'tipo', 'ementa', 'status', 'data_apresentacao', 'data_votacao', 'autor_nome', 'autor_partido'
    ])
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="proposicoes.csv"'
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
        fonte: info.nomeCasa
      }
    }),
    { maxAge: 60, swr: 300 }
  )
})
