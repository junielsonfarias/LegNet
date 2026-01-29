import { NextRequest, NextResponse } from 'next/server'

import { publicacoesService } from '@/lib/publicacoes-service'
import { withAuth } from '@/lib/auth/permissions'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const publicacao = await publicacoesService.getById(params.id)
    if (!publicacao) {
      return NextResponse.json(
        { success: false, error: 'Publicação não encontrada.' },
        { status: 404 }
      )
    }
    return NextResponse.json({ success: true, data: publicacao })
  } catch (error) {
    console.error('Erro ao buscar publicação:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar publicação.' },
      { status: 500 }
    )
  }
}

export const PUT = withAuth(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json(
        { success: false, error: 'JSON inválido.' },
        { status: 400 }
      )
    }

    const publicacao = await publicacoesService.update(params.id, body)
    return NextResponse.json({
      success: true,
      data: publicacao,
      message: 'Publicação atualizada com sucesso.'
    })
  },
  { permissions: 'publicacao.manage' }
)

export const PATCH = withAuth(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json(
        { success: false, error: 'JSON inválido.' },
        { status: 400 }
      )
    }

    const publicacao = await publicacoesService.update(params.id, body)
    return NextResponse.json({
      success: true,
      data: publicacao,
      message: 'Publicação atualizada com sucesso.'
    })
  },
  { permissions: 'publicacao.manage' }
)

export const DELETE = withAuth(
  async (_request: NextRequest, { params }: { params: { id: string } }) => {
    await publicacoesService.remove(params.id)
    return NextResponse.json({
      success: true,
      data: { removed: true },
      message: 'Publicação removida com sucesso.'
    })
  },
  { permissions: 'publicacao.manage' }
)
