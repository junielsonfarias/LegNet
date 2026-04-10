import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  buscarGlobal,
  buscarRapida,
  type TipoResultado
} from '@/lib/services/busca-service'
import { createSuccessResponse, ValidationError, withErrorHandler } from '@/lib/error-handler'
import { safeParseQueryParams } from '@/lib/validation/query-schemas'

export const dynamic = 'force-dynamic'

const BuscaQuerySchema = z.object({
  q: z.string().min(2, 'Termo de busca deve ter pelo menos 2 caracteres'),
  tipos: z.string().nullish().transform(v => v ?? undefined),
  dataInicio: z.string().datetime().nullish().transform(v => v ?? undefined),
  dataFim: z.string().datetime().nullish().transform(v => v ?? undefined),
  autorId: z.string().nullish().transform(v => v ?? undefined),
  status: z.string().nullish().transform(v => v ?? undefined),
  limite: z.coerce.number().int().min(1).max(100).default(20),
  pagina: z.coerce.number().int().min(1).default(1),
  rapida: z.enum(['true', 'false']).nullish().transform(v => v ?? undefined)
})

const TIPOS_VALIDOS = ['proposicao', 'parlamentar', 'sessao', 'publicacao', 'noticia', 'comissao'] as const

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)

  const validation = safeParseQueryParams(searchParams, BuscaQuerySchema)
  if (!validation.success) {
    throw new ValidationError('Parâmetros inválidos')
  }

  const { q: termo, tipos: tiposParam, dataInicio, dataFim, autorId, status, limite, pagina, rapida } = validation.data

  if (rapida === 'true') {
    const limiteRapida = Math.min(limite, 10)
    const resultados = await buscarRapida(termo, limiteRapida)
    return NextResponse.json({ resultados })
  }

  let tipos: TipoResultado[] | undefined
  if (tiposParam) {
    const tiposArray = tiposParam.split(',')
    tipos = tiposArray.filter(t => TIPOS_VALIDOS.includes(t as typeof TIPOS_VALIDOS[number])) as TipoResultado[]
    if (tipos.length === 0) tipos = undefined
  }

  const resultado = await buscarGlobal(termo, {
    tipos,
    dataInicio: dataInicio ? new Date(dataInicio) : undefined,
    dataFim: dataFim ? new Date(dataFim) : undefined,
    autorId: autorId || undefined,
    status: status || undefined,
    limite,
    offset: (pagina - 1) * limite,
  })

  return NextResponse.json(resultado)
})
