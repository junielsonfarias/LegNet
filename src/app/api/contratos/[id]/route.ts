import { NextRequest, NextResponse } from 'next/server'
import { contratosDbService } from '@/lib/services/contratos-db-service'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const contrato = await contratosDbService.getById(id)

    if (!contrato) {
      return NextResponse.json(
        { success: false, error: 'Contrato nao encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: contrato })
  } catch (error) {
    console.error('Erro ao buscar contrato:', error)
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

    const contratoExistente = await contratosDbService.getById(id)
    if (!contratoExistente) {
      return NextResponse.json(
        { success: false, error: 'Contrato nao encontrado' },
        { status: 404 }
      )
    }

    const contratoAtualizado = await contratosDbService.update(id, {
      numero: body.numero,
      ano: body.ano,
      modalidade: body.modalidade,
      objeto: body.objeto,
      contratado: body.contratado,
      cnpjCpf: body.cnpjCpf,
      valorTotal: body.valorTotal !== undefined ? parseFloat(body.valorTotal) : undefined,
      dataAssinatura: body.dataAssinatura,
      vigenciaInicio: body.vigenciaInicio,
      vigenciaFim: body.vigenciaFim,
      fiscalContrato: body.fiscalContrato,
      situacao: body.situacao,
      licitacaoId: body.licitacaoId,
      arquivo: body.arquivo,
      observacoes: body.observacoes
    })

    return NextResponse.json({
      success: true,
      data: contratoAtualizado,
      message: 'Contrato atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar contrato:', error)
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

    const contratoExistente = await contratosDbService.getById(id)
    if (!contratoExistente) {
      return NextResponse.json(
        { success: false, error: 'Contrato nao encontrado' },
        { status: 404 }
      )
    }

    await contratosDbService.remove(id)

    return NextResponse.json({
      success: true,
      message: 'Contrato excluido com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir contrato:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
