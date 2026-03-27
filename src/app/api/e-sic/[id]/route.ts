import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { esicService } from '@/lib/services/esic-service'

export const dynamic = 'force-dynamic'

/**
 * GET - Buscar solicitação e-SIC por ID (admin)
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
    const solicitacao = await esicService.getById(id)

    if (!solicitacao) {
      return NextResponse.json(
        { success: false, error: 'Solicitação não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: solicitacao })
  } catch (error) {
    console.error('Erro ao buscar solicitação e-SIC:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Atualizar/responder solicitação e-SIC (admin)
 * Ações: responder, prorrogar, negar
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

    const solicitacao = await esicService.getById(id)
    if (!solicitacao) {
      return NextResponse.json(
        { success: false, error: 'Solicitação não encontrada' },
        { status: 404 }
      )
    }

    let resultado

    switch (body.acao) {
      case 'responder':
        if (!body.resposta) {
          return NextResponse.json(
            { success: false, error: 'Campo resposta é obrigatório' },
            { status: 400 }
          )
        }
        resultado = await esicService.responder(id, body.resposta, body.respondidoPor || session.user?.name || 'Sistema')
        break

      case 'prorrogar':
        if (!body.motivo) {
          return NextResponse.json(
            { success: false, error: 'Campo motivo é obrigatório para prorrogação' },
            { status: 400 }
          )
        }
        resultado = await esicService.prorrogar(id, body.motivo)
        break

      case 'negar':
        if (!body.motivo) {
          return NextResponse.json(
            { success: false, error: 'Campo motivo é obrigatório para negativa' },
            { status: 400 }
          )
        }
        resultado = await esicService.negar(id, body.motivo, body.respondidoPor || session.user?.name || 'Sistema')
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Ação inválida. Use: responder, prorrogar ou negar' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      data: resultado,
      message: `Solicitação ${body.acao === 'responder' ? 'respondida' : body.acao === 'prorrogar' ? 'prorrogada' : 'negada'} com sucesso`
    })
  } catch (error) {
    console.error('Erro ao atualizar solicitação e-SIC:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
