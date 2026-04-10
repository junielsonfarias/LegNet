import { NextRequest } from 'next/server'
import { withErrorHandler, createSuccessResponse } from '@/lib/error-handler'
import { transparenciaService } from '@/lib/transparencia-dados-service'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const categoria = searchParams.get('categoria')

  // Se categoria foi especificada, retorna subcategorias
  if (categoria) {
    const resultado = await transparenciaService.getPorSubcategoria(categoria)
    return createSuccessResponse({
      categoria,
      subcategorias: resultado.subcategorias,
      total: resultado.data.length
    })
  }

  // Retornar todas as categorias com estatísticas
  const categorias = await transparenciaService.getCategorias()
  const estatisticas = await transparenciaService.getEstatisticasPorCategoria()

  return createSuccessResponse({
    categorias,
    estatisticas
  })
})
