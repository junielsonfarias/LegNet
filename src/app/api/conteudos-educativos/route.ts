import { NextRequest } from 'next/server'
import { createSuccessResponse, NotFoundError, withErrorHandler } from '@/lib/error-handler'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const publicado = searchParams.get('publicado')
  const slug = searchParams.get('slug')
  const categoria = searchParams.get('categoria')

  if (slug) {
    const conteudo = await prisma.conteudoEducativo.findUnique({ where: { slug } })
    if (!conteudo) {
      throw new NotFoundError('Conteudo educativo')
    }
    return createSuccessResponse(conteudo)
  }

  const where: Record<string, unknown> = {}
  if (publicado === 'true') where.publicado = true
  if (categoria) where.categoria = categoria

  const conteudos = await prisma.conteudoEducativo.findMany({
    where,
    orderBy: [{ categoria: 'asc' }, { ordem: 'asc' }],
  })

  return createSuccessResponse(conteudos)
})
