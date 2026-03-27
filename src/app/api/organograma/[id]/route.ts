import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { organogramaService } from '@/lib/services/organograma-service'

export const dynamic = 'force-dynamic'

/**
 * GET - Buscar unidade por ID (admin)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { id } = await params
    const unidade = await organogramaService.getById(id)

    if (!unidade) {
      return NextResponse.json(
        { success: false, error: 'Unidade não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: unidade })
  } catch (error) {
    console.error('Erro ao buscar unidade:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Atualizar unidade (admin)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()

    const unidadeExistente = await organogramaService.getById(id)
    if (!unidadeExistente) {
      return NextResponse.json(
        { success: false, error: 'Unidade não encontrada' },
        { status: 404 }
      )
    }

    const unidade = await organogramaService.update(id, {
      nome: body.nome,
      sigla: body.sigla,
      descricao: body.descricao,
      responsavel: body.responsavel,
      cargo: body.cargo,
      email: body.email,
      telefone: body.telefone,
      parentId: body.parentId,
      ordem: body.ordem
    })

    return NextResponse.json({
      success: true,
      data: unidade,
      message: 'Unidade atualizada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar unidade:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Soft delete de unidade (admin)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { id } = await params

    const unidadeExistente = await organogramaService.getById(id)
    if (!unidadeExistente) {
      return NextResponse.json(
        { success: false, error: 'Unidade não encontrada' },
        { status: 404 }
      )
    }

    await organogramaService.delete(id)

    return NextResponse.json({
      success: true,
      message: 'Unidade removida com sucesso'
    })
  } catch (error) {
    console.error('Erro ao remover unidade:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
