import { NextRequest } from 'next/server'
import { folhaPagamentoDbService } from '@/lib/services/servidores-db-service'
import { withErrorHandler, createSuccessResponse } from '@/lib/error-handler'
import { withPublicCache } from '@/lib/http-cache'

/**
 * GET - Folhas de pagamento (público). Expõe apenas os TOTAIS agregados por
 * competência (totalBruto/totalLiquido/totalServidores), não salários
 * individuais — coerente com a transparência (PNTP). Ver ERR-063.
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const ano = searchParams.get('ano')
  const mes = searchParams.get('mes')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 200)

  const result = await folhaPagamentoDbService.paginate(
    {
      ano: ano ? parseInt(ano) : undefined,
      mes: mes ? parseInt(mes) : undefined,
    },
    { page, limit },
  )

  return withPublicCache(
    createSuccessResponse(result.data, undefined, result.pagination.total, 200, {
      page: result.pagination.page,
      limit: result.pagination.limit,
      total: result.pagination.total,
      totalPages: result.pagination.totalPages,
    }),
    { maxAge: 60, swr: 300 },
  )
})
