import { NextRequest } from 'next/server'
import {
  withErrorHandler,
  createSuccessResponse,
  NotFoundError,
} from '@/lib/error-handler'
import { pesquisaSatisfacaoService } from '@/lib/services/pesquisa-satisfacao-service'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET publico — devolve resultados agregados.
// Sem auth, mas respeita `publicaResultados=false` (nesse caso 404).
export const GET = withErrorHandler(
  async (_request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const pesquisa = await prisma.pesquisaSatisfacao.findUnique({ where: { id } })
    if (!pesquisa) throw new NotFoundError('Pesquisa nao encontrada')
    if (!pesquisa.publicaResultados) {
      throw new NotFoundError('Resultados nao publicados para esta pesquisa')
    }
    const resultado = await pesquisaSatisfacaoService.resultado(id)
    if (!resultado) throw new NotFoundError('Pesquisa nao encontrada')
    return createSuccessResponse(resultado)
  }
)
