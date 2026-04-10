import { NextRequest, NextResponse } from 'next/server'

import { publicacoesService } from '@/lib/publicacoes-service'
import { withAuth } from '@/lib/auth/permissions'
import { withErrorHandler, createSuccessResponse, NotFoundError } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandler(async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const publicacao = await publicacoesService.getById(id)
  if (!publicacao) {
    throw new NotFoundError('Publicação')
  }
  return createSuccessResponse(publicacao)
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

    const publicacao = await publicacoesService.update(id, body)
    return NextResponse.json({
      success: true,
      data: publicacao,
      message: 'Publicação atualizada com sucesso.'
    })
  },
  { permissions: 'publicacao.manage' }
)

export const PATCH = withAuth(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params
    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json(
        { success: false, error: 'JSON inválido.' },
        { status: 400 }
      )
    }

    const publicacao = await publicacoesService.update(id, body)
    return NextResponse.json({
      success: true,
      data: publicacao,
      message: 'Publicação atualizada com sucesso.'
    })
  },
  { permissions: 'publicacao.manage' }
)

export const DELETE = withAuth(
  async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params
    await publicacoesService.remove(id)
    return NextResponse.json({
      success: true,
      data: { removed: true },
      message: 'Publicação removida com sucesso.'
    })
  },
  { permissions: 'publicacao.manage' }
)
