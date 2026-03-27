import { NextRequest, NextResponse } from 'next/server'
import { esicService } from '@/lib/services/esic-service'

export const dynamic = 'force-dynamic'

/**
 * POST - Registrar recurso em solicitação e-SIC (público)
 * Não requer autenticação
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (!body.motivo) {
      return NextResponse.json(
        { success: false, error: 'Campo motivo é obrigatório' },
        { status: 400 }
      )
    }

    const solicitacao = await esicService.getById(id)
    if (!solicitacao) {
      return NextResponse.json(
        { success: false, error: 'Solicitação não encontrada' },
        { status: 404 }
      )
    }

    const recurso = await esicService.criarRecurso(id, body.motivo, body.instancia || 1)

    return NextResponse.json({
      success: true,
      data: recurso,
      message: 'Recurso registrado com sucesso'
    }, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar recurso e-SIC:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
