import { NextRequest } from 'next/server'
import { createSuccessResponse } from '@/lib/error-handler'
import { transparenciaService } from '@/lib/transparencia-dados-service'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const categoria = searchParams.get('categoria')

  // Se categoria foi especificada, retorna subcategorias
  if (categoria) {
    const subcategorias = transparenciaService.getSubcategorias(categoria)
    const resultado = transparenciaService.getPorSubcategoria(categoria)
    return createSuccessResponse({
      categoria,
      subcategorias: resultado.subcategorias,
      total: resultado.data.length
    })
  }

  // Retornar todas as categorias com estatísticas
  const categorias = transparenciaService.getCategorias()
  const estatisticas = transparenciaService.getEstatisticasPorCategoria()

  return createSuccessResponse({
    categorias,
    estatisticas
  })
}
