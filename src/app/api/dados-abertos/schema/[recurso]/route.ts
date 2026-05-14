import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandler, NotFoundError } from '@/lib/error-handler'
import { withPublicCache } from '@/lib/http-cache'
import { RESOURCE_SCHEMAS, toJsonSchema } from '@/lib/services/dados-abertos-schemas'


/**
 * GET /api/dados-abertos/schema/[recurso]
 *
 * Retorna o JSONSchema (Draft 2020-12) do recurso solicitado.
 * Exemplos: /api/dados-abertos/schema/parlamentares,
 *          /api/dados-abertos/schema/contratos
 */
export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ recurso: string }> }
) => {
  const { recurso } = await params
  const rs = RESOURCE_SCHEMAS[recurso]
  if (!rs) {
    throw new NotFoundError(`Schema do recurso "${recurso}"`)
  }

  return withPublicCache(NextResponse.json(toJsonSchema(rs)), { maxAge: 600, swr: 1800 })
})
