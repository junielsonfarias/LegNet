import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  buscarGlobal,
  buscarRapida,
  type TipoResultado
} from '@/lib/services/busca-service'
import { safeParseQueryParams } from '@/lib/validation/query-schemas'

export const dynamic = 'force-dynamic'

// Schema de validação para busca
const BuscaQuerySchema = z.object({
  q: z.string().min(2, 'Termo de busca deve ter pelo menos 2 caracteres'),
  tipos: z.string().optional(),
  dataInicio: z.string().datetime().optional(),
  dataFim: z.string().datetime().optional(),
  autorId: z.string().optional(),
  status: z.string().optional(),
  limite: z.coerce.number().int().min(1).max(100).default(20),
  pagina: z.coerce.number().int().min(1).default(1),
  rapida: z.enum(['true', 'false']).optional()
})

// Lista de tipos válidos para busca
const TIPOS_VALIDOS = ['proposicao', 'parlamentar', 'sessao', 'publicacao', 'noticia', 'comissao'] as const

/**
 * GET /api/busca - Busca global
 *
 * Query params:
 * - q: termo de busca (obrigatório)
 * - tipos: tipos separados por vírgula (proposicao,parlamentar,sessao,publicacao,noticia,comissao)
 * - dataInicio: data inicial (ISO)
 * - dataFim: data final (ISO)
 * - autorId: ID do autor (para proposições)
 * - status: status (para proposições)
 * - limite: quantidade por página (default: 20, max: 100)
 * - pagina: página atual (default: 1)
 * - rapida: se "true", retorna busca rápida para autocomplete
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Validar query params com Zod
    const validation = safeParseQueryParams(searchParams, BuscaQuerySchema)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { q: termo, tipos: tiposParam, dataInicio, dataFim, autorId, status, limite, pagina, rapida } = validation.data

    // Busca rápida para autocomplete
    if (rapida === 'true') {
      const limiteRapida = Math.min(limite, 10) // Máximo 10 para busca rápida
      const resultados = await buscarRapida(termo, limiteRapida)
      return NextResponse.json({ resultados })
    }

    // Validar e filtrar tipos
    let tipos: TipoResultado[] | undefined
    if (tiposParam) {
      const tiposArray = tiposParam.split(',')
      tipos = tiposArray.filter(t => TIPOS_VALIDOS.includes(t as typeof TIPOS_VALIDOS[number])) as TipoResultado[]
      if (tipos.length === 0) {
        tipos = undefined
      }
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
  } catch (error) {
    console.error('Erro na busca:', error)
    return NextResponse.json(
      { error: 'Erro interno ao realizar busca' },
      { status: 500 }
    )
  }
}
