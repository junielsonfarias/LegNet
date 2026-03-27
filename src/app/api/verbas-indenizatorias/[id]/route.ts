import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { verbasIndenizatoriasService } from '@/lib/services/verbas-indenizatorias-service'

export const dynamic = 'force-dynamic'

/**
 * GET - Buscar verba indenizatória por ID (admin)
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
    const verba = await verbasIndenizatoriasService.getById(id)

    if (!verba) {
      return NextResponse.json(
        { success: false, error: 'Verba indenizatória não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: verba })
  } catch (error) {
    console.error('Erro ao buscar verba indenizatória:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Atualizar verba indenizatória (admin)
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

    const verbaExistente = await verbasIndenizatoriasService.getById(id)
    if (!verbaExistente) {
      return NextResponse.json(
        { success: false, error: 'Verba indenizatória não encontrada' },
        { status: 404 }
      )
    }

    const verba = await verbasIndenizatoriasService.update(id, {
      tipo: body.tipo,
      descricao: body.descricao,
      valor: body.valor !== undefined ? parseFloat(body.valor) : undefined,
      mes: body.mes !== undefined ? parseInt(body.mes) : undefined,
      ano: body.ano !== undefined ? parseInt(body.ano) : undefined,
      parlamentarId: body.parlamentarId,
      nomeParlamentar: body.nomeParlamentar,
      comprovante: body.comprovante
    })

    return NextResponse.json({
      success: true,
      data: verba,
      message: 'Verba indenizatória atualizada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar verba indenizatória:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Excluir verba indenizatória (admin)
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

    const verbaExistente = await verbasIndenizatoriasService.getById(id)
    if (!verbaExistente) {
      return NextResponse.json(
        { success: false, error: 'Verba indenizatória não encontrada' },
        { status: 404 }
      )
    }

    await verbasIndenizatoriasService.delete(id)

    return NextResponse.json({
      success: true,
      message: 'Verba indenizatória excluída com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir verba indenizatória:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
