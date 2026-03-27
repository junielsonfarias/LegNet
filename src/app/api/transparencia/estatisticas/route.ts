import { NextRequest } from 'next/server'
import { createSuccessResponse } from '@/lib/error-handler'
import { transparenciaService } from '@/lib/transparencia-dados-service'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  const estatisticas = await transparenciaService.getEstatisticas()
  const anos = await transparenciaService.getAnos()
  const tipos = await transparenciaService.getTipos()
  const categorias = await transparenciaService.getCategorias()
  const estatisticasPorCategoria = await transparenciaService.getEstatisticasPorCategoria()

  return createSuccessResponse({
    ...estatisticas,
    anos,
    tipos,
    categorias,
    porCategoria: estatisticasPorCategoria
  })
}
