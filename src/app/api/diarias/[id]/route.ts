import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { diariasService } from '@/lib/services/diarias-service'

export const dynamic = 'force-dynamic'

/**
 * GET - Buscar diária por ID (admin)
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
    const diaria = await diariasService.getById(id)

    if (!diaria) {
      return NextResponse.json(
        { success: false, error: 'Diária não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: diaria })
  } catch (error) {
    console.error('Erro ao buscar diária:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Atualizar diária (admin)
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

    const diariaExistente = await diariasService.getById(id)
    if (!diariaExistente) {
      return NextResponse.json(
        { success: false, error: 'Diária não encontrada' },
        { status: 404 }
      )
    }

    const diaria = await diariasService.update(id, {
      destino: body.destino,
      motivo: body.motivo,
      valorUnitario: body.valorUnitario !== undefined ? parseFloat(body.valorUnitario) : undefined,
      quantidade: body.quantidade !== undefined ? parseInt(body.quantidade) : undefined,
      dataInicio: body.dataInicio,
      dataFim: body.dataFim,
      comprovante: body.comprovante,
      nome: body.nome,
      cargo: body.cargo
    })

    return NextResponse.json({
      success: true,
      data: diaria,
      message: 'Diária atualizada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar diária:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Excluir diária (admin)
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

    const diariaExistente = await diariasService.getById(id)
    if (!diariaExistente) {
      return NextResponse.json(
        { success: false, error: 'Diária não encontrada' },
        { status: 404 }
      )
    }

    await diariasService.delete(id)

    return NextResponse.json({
      success: true,
      message: 'Diária excluída com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir diária:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
