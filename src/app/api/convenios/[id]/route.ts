import { NextRequest, NextResponse } from 'next/server'
import { conveniosDbService } from '@/lib/services/convenios-db-service'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const convenio = await conveniosDbService.getById(id)

    if (!convenio) {
      return NextResponse.json(
        { success: false, error: 'Convenio nao encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: convenio })
  } catch (error) {
    console.error('Erro ao buscar convenio:', error)
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

    const convenioExistente = await conveniosDbService.getById(id)
    if (!convenioExistente) {
      return NextResponse.json(
        { success: false, error: 'Convenio nao encontrado' },
        { status: 404 }
      )
    }

    const convenioAtualizado = await conveniosDbService.update(id, {
      numero: body.numero,
      ano: body.ano,
      convenente: body.convenente,
      cnpjConvenente: body.cnpjConvenente,
      orgaoConcedente: body.orgaoConcedente,
      objeto: body.objeto,
      programa: body.programa,
      acao: body.acao,
      valorTotal: body.valorTotal !== undefined ? parseFloat(body.valorTotal) : undefined,
      valorRepasse: body.valorRepasse !== undefined ? parseFloat(body.valorRepasse) : undefined,
      valorContrapartida: body.valorContrapartida !== undefined ? parseFloat(body.valorContrapartida) : undefined,
      dataCelebracao: body.dataCelebracao,
      vigenciaInicio: body.vigenciaInicio,
      vigenciaFim: body.vigenciaFim,
      responsavelTecnico: body.responsavelTecnico,
      situacao: body.situacao,
      fonteRecurso: body.fonteRecurso,
      arquivo: body.arquivo,
      observacoes: body.observacoes
    })

    return NextResponse.json({
      success: true,
      data: convenioAtualizado,
      message: 'Convenio atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar convenio:', error)
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

    const convenioExistente = await conveniosDbService.getById(id)
    if (!convenioExistente) {
      return NextResponse.json(
        { success: false, error: 'Convenio nao encontrado' },
        { status: 404 }
      )
    }

    await conveniosDbService.remove(id)

    return NextResponse.json({
      success: true,
      message: 'Convenio excluido com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir convenio:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
