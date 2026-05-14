/**
 * API de Dados Abertos - Servidores
 * Retorna lista de servidores (efetivos, comissionados, terceirizados, estagiarios).
 * Sem CPF por LGPD. Cumpre PNTP Nivel Diamante - Categoria Pessoal.
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
  const vinculo = searchParams.get('vinculo') || undefined
  const unidade = searchParams.get('unidade') || undefined
  const situacao = searchParams.get('situacao') || undefined
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

  const { dados, total } = await dadosAbertosService.getServidores(
    { vinculo, unidade, situacao },
    { page, limit }
  )

  if (formato === 'csv') {
    const csv = convertToCSV(dados, [
      'id', 'nome', 'matricula', 'cargo', 'funcao', 'unidade', 'lotacao',
      'vinculo', 'data_admissao', 'data_desligamento', 'carga_horaria',
      'salario_bruto', 'situacao'
    ])
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="servidores.csv"'
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
        observacao: 'CPF omitido em conformidade com a LGPD.'
      }
    }),
    { maxAge: 60, swr: 300 }
  )
})
