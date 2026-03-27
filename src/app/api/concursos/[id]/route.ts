import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { concursosService } from '@/lib/services/concursos-service'

export const dynamic = 'force-dynamic'

/**
 * GET - Buscar concurso por ID (admin)
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
    const concurso = await concursosService.getById(id)

    if (!concurso) {
      return NextResponse.json(
        { success: false, error: 'Concurso não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: concurso })
  } catch (error) {
    console.error('Erro ao buscar concurso:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Atualizar concurso (admin)
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

    const concursoExistente = await concursosService.getById(id)
    if (!concursoExistente) {
      return NextResponse.json(
        { success: false, error: 'Concurso não encontrado' },
        { status: 404 }
      )
    }

    const concurso = await concursosService.update(id, {
      titulo: body.titulo,
      edital: body.edital,
      descricao: body.descricao,
      status: body.status,
      dataPublicacao: body.dataPublicacao,
      dataInscricaoInicio: body.dataInscricaoInicio,
      dataInscricaoFim: body.dataInscricaoFim,
      dataProva: body.dataProva,
      vagas: body.vagas !== undefined ? parseInt(body.vagas) : undefined,
      observacoes: body.observacoes,
      arquivo: body.arquivo
    })

    return NextResponse.json({
      success: true,
      data: concurso,
      message: 'Concurso atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar concurso:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Excluir concurso (admin)
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

    const concursoExistente = await concursosService.getById(id)
    if (!concursoExistente) {
      return NextResponse.json(
        { success: false, error: 'Concurso não encontrado' },
        { status: 404 }
      )
    }

    await concursosService.delete(id)

    return NextResponse.json({
      success: true,
      message: 'Concurso excluído com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir concurso:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
