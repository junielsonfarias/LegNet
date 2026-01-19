import { NextRequest, NextResponse } from 'next/server'
import { servidoresDbService } from '@/lib/services/servidores-db-service'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const servidor = await servidoresDbService.getById(id)

    if (!servidor) {
      return NextResponse.json(
        { success: false, error: 'Servidor nao encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: servidor })
  } catch (error) {
    console.error('Erro ao buscar servidor:', error)
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

    const servidorExistente = await servidoresDbService.getById(id)
    if (!servidorExistente) {
      return NextResponse.json(
        { success: false, error: 'Servidor nao encontrado' },
        { status: 404 }
      )
    }

    const servidorAtualizado = await servidoresDbService.update(id, {
      nome: body.nome,
      cpf: body.cpf,
      matricula: body.matricula,
      cargo: body.cargo,
      funcao: body.funcao,
      unidade: body.unidade,
      lotacao: body.lotacao,
      vinculo: body.vinculo,
      dataAdmissao: body.dataAdmissao,
      dataDesligamento: body.dataDesligamento,
      salarioBruto: body.salarioBruto !== undefined ? parseFloat(body.salarioBruto) : undefined,
      situacao: body.situacao,
      observacoes: body.observacoes
    })

    return NextResponse.json({
      success: true,
      data: servidorAtualizado,
      message: 'Servidor atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar servidor:', error)
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

    const servidorExistente = await servidoresDbService.getById(id)
    if (!servidorExistente) {
      return NextResponse.json(
        { success: false, error: 'Servidor nao encontrado' },
        { status: 404 }
      )
    }

    await servidoresDbService.remove(id)

    return NextResponse.json({
      success: true,
      message: 'Servidor excluido com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir servidor:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
