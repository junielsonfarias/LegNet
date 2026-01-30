import { NextRequest } from 'next/server'
import { createSuccessResponse } from '@/lib/error-handler'
import { transparenciaService } from '@/lib/transparencia-service'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  const estatisticas = transparenciaService.getEstatisticas()
  const anos = transparenciaService.getAnos()
  const tipos = transparenciaService.getTipos()
  const categorias = transparenciaService.getCategorias()
  const estatisticasPorCategoria = transparenciaService.getEstatisticasPorCategoria()

  return createSuccessResponse({
    ...estatisticas,
    anos,
    tipos,
    categorias,
    porCategoria: estatisticasPorCategoria
  })
}
