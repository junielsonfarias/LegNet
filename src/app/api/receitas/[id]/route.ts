import { NextRequest, NextResponse } from 'next/server'
import { receitasDbService } from '@/lib/services/receitas-db-service'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const receita = await receitasDbService.getById(id)

    if (!receita) {
      return NextResponse.json(
        { success: false, error: 'Receita nao encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: receita })
  } catch (error) {
    console.error('Erro ao buscar receita:', error)
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

    const receitaExistente = await receitasDbService.getById(id)
    if (!receitaExistente) {
      return NextResponse.json(
        { success: false, error: 'Receita nao encontrada' },
        { status: 404 }
      )
    }

    const receitaAtualizada = await receitasDbService.update(id, {
      numero: body.numero,
      ano: body.ano,
      mes: body.mes,
      data: body.data,
      contribuinte: body.contribuinte,
      cnpjCpf: body.cnpjCpf,
      unidade: body.unidade,
      categoria: body.categoria,
      origem: body.origem,
      especie: body.especie,
      rubrica: body.rubrica,
      valorPrevisto: body.valorPrevisto !== undefined ? parseFloat(body.valorPrevisto) : undefined,
      valorArrecadado: body.valorArrecadado !== undefined ? parseFloat(body.valorArrecadado) : undefined,
      situacao: body.situacao,
      fonteRecurso: body.fonteRecurso,
      observacoes: body.observacoes
    })

    return NextResponse.json({
      success: true,
      data: receitaAtualizada,
      message: 'Receita atualizada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar receita:', error)
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

    const receitaExistente = await receitasDbService.getById(id)
    if (!receitaExistente) {
      return NextResponse.json(
        { success: false, error: 'Receita nao encontrada' },
        { status: 404 }
      )
    }

    await receitasDbService.remove(id)

    return NextResponse.json({
      success: true,
      message: 'Receita excluida com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir receita:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
