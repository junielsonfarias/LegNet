/**
 * API de Dados Abertos - Contratos
 * RN-124 PNTP: publicacao obrigatoria em 24h apos assinatura.
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
  const situacao = searchParams.get('situacao') || undefined
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

  const { dados, total } = await dadosAbertosService.getContratos(
    { ano, situacao },
    { page, limit }
  )

  if (formato === 'csv') {
    const csv = convertToCSV(dados, [
      'id', 'numero', 'ano', 'modalidade', 'objeto', 'contratado', 'cnpj_cpf',
      'valor_total', 'data_assinatura', 'data_publicacao', 'vigencia_inicio',
      'vigencia_fim', 'fiscal_contrato', 'situacao', 'arquivo_url', 'licitacao'
    ])
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="contratos.csv"'
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
        prazo_pntp: 'Publicacao em 24h apos assinatura (RN-124).'
      }
    }),
    { maxAge: 60, swr: 300 }
  )
})
