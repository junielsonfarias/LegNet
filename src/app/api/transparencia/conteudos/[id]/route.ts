import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
import { createSuccessResponse, NotFoundError } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

/**
 * GET - Buscar conteúdo de transparência por ID (admin)
 */
export const GET = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const conteudo = await prisma.transparenciaConteudo.findUnique({
    where: { id }
  })

  if (!conteudo) {
    throw new NotFoundError('Conteúdo')
  }

  return createSuccessResponse(conteudo)
})

/**
 * PATCH - Atualizar conteúdo de transparência (admin)
 */
export const PATCH = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const body = await request.json()

  const conteudoExistente = await prisma.transparenciaConteudo.findUnique({
    where: { id }
  })
  if (!conteudoExistente) {
    throw new NotFoundError('Conteúdo')
  }

  const conteudo = await prisma.transparenciaConteudo.update({
    where: { id },
    data: {
      titulo: body.titulo,
      descricao: body.descricao,
      categoriaSlug: body.categoriaSlug,
      subcategoria: body.subcategoria,
      tipo: body.tipo,
      ano: body.ano !== undefined ? parseInt(body.ano) : undefined,
      dataPublicacao: body.dataPublicacao ? new Date(body.dataPublicacao) : undefined,
      url: body.url,
      arquivo: body.arquivo,
      status: body.status,
    }
  })

  return createSuccessResponse(conteudo, 'Conteúdo de transparência atualizado com sucesso')
})

/**
 * DELETE - Excluir conteúdo de transparência (admin)
 */
export const DELETE = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params

  const conteudoExistente = await prisma.transparenciaConteudo.findUnique({
    where: { id }
  })
  if (!conteudoExistente) {
    throw new NotFoundError('Conteúdo')
  }

  await prisma.transparenciaConteudo.delete({
    where: { id }
  })

  return createSuccessResponse({ removed: true }, 'Conteúdo de transparência excluído com sucesso')
})
