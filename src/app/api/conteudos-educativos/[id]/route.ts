import { NextRequest } from 'next/server'
import { createSuccessResponse, NotFoundError } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { conteudoEducativoService } from '@/lib/services/conteudo-educativo-service'

export const dynamic = 'force-dynamic'

/**
 * GET - Buscar conteúdo educativo por ID (admin)
 */
export const GET = withAuth(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params
    const conteudo = await conteudoEducativoService.getById(id)

    if (!conteudo) {
      throw new NotFoundError('Conteúdo educativo')
    }

    return createSuccessResponse(conteudo)
  }
)

/**
 * PATCH - Atualizar conteúdo educativo (admin)
 */
export const PATCH = withAuth(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params
    const body = await request.json()

    const conteudoExistente = await conteudoEducativoService.getById(id)
    if (!conteudoExistente) {
      throw new NotFoundError('Conteúdo educativo')
    }

    const conteudo = await conteudoEducativoService.update(id, {
      titulo: body.titulo,
      slug: body.slug,
      resumo: body.resumo,
      conteudo: body.conteudo,
      categoria: body.categoria,
      imagem: body.imagem,
      publicado: body.publicado,
      ordem: body.ordem
    })

    return createSuccessResponse(conteudo, 'Conteúdo educativo atualizado com sucesso')
  }
)

/**
 * DELETE - Excluir conteúdo educativo (admin)
 */
export const DELETE = withAuth(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params

    const conteudoExistente = await conteudoEducativoService.getById(id)
    if (!conteudoExistente) {
      throw new NotFoundError('Conteúdo educativo')
    }

    await conteudoEducativoService.delete(id)

    return createSuccessResponse(null, 'Conteúdo educativo excluído com sucesso')
  }
)
