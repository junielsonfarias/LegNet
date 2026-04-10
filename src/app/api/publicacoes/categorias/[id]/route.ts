import { NextRequest, NextResponse } from 'next/server'

import { categoriasPublicacaoService } from '@/lib/categorias-publicacao-service'
import { withAuth } from '@/lib/auth/permissions'
import { withErrorHandler, createSuccessResponse, NotFoundError } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandler(async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const categoria = await categoriasPublicacaoService.getById(id)
  if (!categoria) {
    throw new NotFoundError('Categoria')
  }
  return createSuccessResponse(categoria)
})

export const PUT = withAuth(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params
    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json(
        { success: false, error: 'JSON inválido.' },
        { status: 400 }
      )
    }

    const categoria = await categoriasPublicacaoService.update(id, {
      nome: body.nome,
      descricao: body.descricao,
      cor: body.cor,
      ativa: body.ativa,
      ordem: body.ordem
    })

    return NextResponse.json({
      success: true,
      data: categoria,
      message: 'Categoria atualizada com sucesso.'
    })
  },
  { permissions: 'publicacao.manage' }
)

export const PATCH = withAuth(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params
    const body = await request.json().catch(() => null)
    if (!body || typeof body.ativa !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Informe o status desejado.' },
        { status: 400 }
      )
    }

    const categoria = await categoriasPublicacaoService.toggleStatus(id, body.ativa)
    return NextResponse.json({
      success: true,
      data: categoria,
      message: body.ativa ? 'Categoria ativada.' : 'Categoria desativada.'
    })
  },
  { permissions: 'publicacao.manage' }
)

export const DELETE = withAuth(
  async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params
    await categoriasPublicacaoService.remove(id)
    return NextResponse.json({
      success: true,
      data: { removed: true },
      message: 'Categoria removida com sucesso.'
    })
  },
  { permissions: 'publicacao.manage' }
)
