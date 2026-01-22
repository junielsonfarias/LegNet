import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ReuniaoComissaoService } from '@/lib/services/reuniao-comissao-service'

// POST - Adicionar item na pauta
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const { id: reuniaoId } = await params
    const body = await request.json()

    if (!body.titulo) {
      return NextResponse.json(
        { success: false, error: 'Titulo do item e obrigatorio' },
        { status: 400 }
      )
    }

    const item = await ReuniaoComissaoService.adicionarItemPauta(reuniaoId, {
      titulo: body.titulo,
      descricao: body.descricao,
      tipo: body.tipo,
      proposicaoId: body.proposicaoId,
      parecerId: body.parecerId,
      tempoEstimado: body.tempoEstimado
    })

    return NextResponse.json({
      success: true,
      data: item,
      message: 'Item adicionado a pauta'
    })
  } catch (error) {
    console.error('Erro ao adicionar item na pauta:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro ao adicionar item' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar item da pauta ou reordenar
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const { id: reuniaoId } = await params
    const body = await request.json()

    // Se for reordenacao (array de itens)
    if (body.itensOrdenados && Array.isArray(body.itensOrdenados)) {
      await ReuniaoComissaoService.reordenarPauta(reuniaoId, body.itensOrdenados)
      return NextResponse.json({
        success: true,
        message: 'Pauta reordenada com sucesso'
      })
    }

    // Se for atualizacao de um item especifico
    if (!body.itemId) {
      return NextResponse.json(
        { success: false, error: 'ID do item e obrigatorio para atualizacao' },
        { status: 400 }
      )
    }

    const item = await ReuniaoComissaoService.atualizarItemPauta(body.itemId, {
      titulo: body.titulo,
      descricao: body.descricao,
      tipo: body.tipo,
      status: body.status,
      resultado: body.resultado,
      observacoes: body.observacoes,
      tempoReal: body.tempoReal
    })

    return NextResponse.json({
      success: true,
      data: item,
      message: 'Item atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar pauta:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro ao atualizar pauta' },
      { status: 500 }
    )
  }
}

// DELETE - Remover item da pauta
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')

    if (!itemId) {
      return NextResponse.json(
        { success: false, error: 'ID do item e obrigatorio' },
        { status: 400 }
      )
    }

    await ReuniaoComissaoService.removerItemPauta(itemId)

    return NextResponse.json({
      success: true,
      message: 'Item removido da pauta'
    })
  } catch (error) {
    console.error('Erro ao remover item da pauta:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro ao remover item' },
      { status: 500 }
    )
  }
}
