import { NextRequest, NextResponse } from 'next/server'

import { publicacoesService } from '@/lib/publicacoes-service'

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

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
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
  } catch (error) {
    console.error('Erro ao atualizar publicação:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar publicação.' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
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
  } catch (error) {
    console.error('Erro ao atualizar publicação:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar publicação.' },
      { status: 500 }
    )
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await publicacoesService.remove(params.id)
    return NextResponse.json({
      success: true,
      data: { removed: true },
      message: 'Publicação removida com sucesso.'
    })
  } catch (error) {
    console.error('Erro ao remover publicação:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao remover publicação.' },
      { status: 500 }
    )
  }
}


