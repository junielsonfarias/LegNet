import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { conteudoEducativoService } from '@/lib/services/conteudo-educativo-service'

export const dynamic = 'force-dynamic'

/**
 * GET - Buscar conteúdo educativo por ID (admin)
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
    const conteudo = await conteudoEducativoService.getById(id)

    if (!conteudo) {
      return NextResponse.json(
        { success: false, error: 'Conteúdo não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: conteudo })
  } catch (error) {
    console.error('Erro ao buscar conteúdo educativo:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Atualizar conteúdo educativo (admin)
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

    const conteudoExistente = await conteudoEducativoService.getById(id)
    if (!conteudoExistente) {
      return NextResponse.json(
        { success: false, error: 'Conteúdo não encontrado' },
        { status: 404 }
      )
    }

    const conteudo = await conteudoEducativoService.update(id, {
      titulo: body.titulo,
      slug: body.slug,
      resumo: body.resumo,
      conteudo: body.conteudo,
      categoria: body.categoria,
      imagem: body.imagem,
      publicado: body.publicado,
      ordem: body.ordem
    })

    return NextResponse.json({
      success: true,
      data: conteudo,
      message: 'Conteúdo educativo atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar conteúdo educativo:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Excluir conteúdo educativo (admin)
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

    const conteudoExistente = await conteudoEducativoService.getById(id)
    if (!conteudoExistente) {
      return NextResponse.json(
        { success: false, error: 'Conteúdo não encontrado' },
        { status: 404 }
      )
    }

    await conteudoEducativoService.delete(id)

    return NextResponse.json({
      success: true,
      message: 'Conteúdo educativo excluído com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir conteúdo educativo:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
