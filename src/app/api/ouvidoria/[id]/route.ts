import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ouvidoriaService } from '@/lib/services/ouvidoria-service'

export const dynamic = 'force-dynamic'

/**
 * GET - Buscar manifestação por ID (admin)
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
    const manifestacao = await ouvidoriaService.getById(id)

    if (!manifestacao) {
      return NextResponse.json(
        { success: false, error: 'Manifestação não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: manifestacao })
  } catch (error) {
    console.error('Erro ao buscar manifestação:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Ações na manifestação (admin)
 * Ações: responder, encaminhar, concluir
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

    const manifestacao = await ouvidoriaService.getById(id)
    if (!manifestacao) {
      return NextResponse.json(
        { success: false, error: 'Manifestação não encontrada' },
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
        resultado = await ouvidoriaService.responder(id, body.resposta, body.respondidoPor || session.user?.name || 'Sistema')
        break

      case 'encaminhar':
        if (!body.setor) {
          return NextResponse.json(
            { success: false, error: 'Campo setor é obrigatório para encaminhamento' },
            { status: 400 }
          )
        }
        resultado = await ouvidoriaService.encaminhar(id, body.setor, body.respondidoPor || session.user?.name || 'Sistema')
        break

      case 'concluir':
        resultado = await ouvidoriaService.concluir(id, body.respondidoPor || session.user?.name || 'Sistema')
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Ação inválida. Use: responder, encaminhar ou concluir' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      data: resultado,
      message: `Manifestação ${body.acao === 'responder' ? 'respondida' : body.acao === 'encaminhar' ? 'encaminhada' : 'concluída'} com sucesso`
    })
  } catch (error) {
    console.error('Erro ao atualizar manifestação:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
