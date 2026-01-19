import { NextRequest, NextResponse } from 'next/server'
import { bensPatrimoniaisDbService } from '@/lib/services/bens-patrimoniais-db-service'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const bem = await bensPatrimoniaisDbService.getById(id)

    if (!bem) {
      return NextResponse.json(
        { success: false, error: 'Bem patrimonial nao encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: bem })
  } catch (error) {
    console.error('Erro ao buscar bem patrimonial:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const bemExistente = await bensPatrimoniaisDbService.getById(id)
    if (!bemExistente) {
      return NextResponse.json(
        { success: false, error: 'Bem patrimonial nao encontrado' },
        { status: 404 }
      )
    }

    const bemAtualizado = await bensPatrimoniaisDbService.update(id, {
      tipo: body.tipo,
      tombamento: body.tombamento,
      descricao: body.descricao,
      especificacao: body.especificacao,
      dataAquisicao: body.dataAquisicao,
      valorAquisicao: body.valorAquisicao !== undefined ? parseFloat(body.valorAquisicao) : undefined,
      valorAtual: body.valorAtual !== undefined ? parseFloat(body.valorAtual) : undefined,
      localizacao: body.localizacao,
      responsavel: body.responsavel,
      situacao: body.situacao,
      matriculaImovel: body.matriculaImovel,
      enderecoImovel: body.enderecoImovel,
      areaImovel: body.areaImovel !== undefined ? parseFloat(body.areaImovel) : undefined,
      observacoes: body.observacoes
    })

    return NextResponse.json({
      success: true,
      data: bemAtualizado,
      message: 'Bem patrimonial atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar bem patrimonial:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const bemExistente = await bensPatrimoniaisDbService.getById(id)
    if (!bemExistente) {
      return NextResponse.json(
        { success: false, error: 'Bem patrimonial nao encontrado' },
        { status: 404 }
      )
    }

    await bensPatrimoniaisDbService.remove(id)

    return NextResponse.json({
      success: true,
      message: 'Bem patrimonial excluido com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir bem patrimonial:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
