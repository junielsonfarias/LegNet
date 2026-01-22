import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ReuniaoComissaoService } from '@/lib/services/reuniao-comissao-service'

// GET - Buscar reuniao por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const { id } = await params
    const reuniao = await ReuniaoComissaoService.buscarReuniaoPorId(id)

    if (!reuniao) {
      return NextResponse.json(
        { success: false, error: 'Reuniao nao encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: reuniao
    })
  } catch (error) {
    console.error('Erro ao buscar reuniao:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar reuniao' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar reuniao
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const reuniao = await ReuniaoComissaoService.atualizarReuniao(id, {
      tipo: body.tipo,
      data: body.data ? new Date(body.data) : undefined,
      horaInicio: body.horaInicio ? new Date(body.horaInicio) : undefined,
      horaFim: body.horaFim ? new Date(body.horaFim) : undefined,
      local: body.local,
      motivoConvocacao: body.motivoConvocacao,
      pautaTexto: body.pautaTexto,
      ataTexto: body.ataTexto,
      quorumMinimo: body.quorumMinimo,
      observacoes: body.observacoes
    })

    return NextResponse.json({
      success: true,
      data: reuniao,
      message: 'Reuniao atualizada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar reuniao:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro ao atualizar reuniao' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir reuniao
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const { id } = await params
    await ReuniaoComissaoService.excluirReuniao(id)

    return NextResponse.json({
      success: true,
      message: 'Reuniao excluida com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir reuniao:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro ao excluir reuniao' },
      { status: 500 }
    )
  }
}
