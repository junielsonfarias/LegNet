import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET - Buscar conteúdo de transparência por ID (admin)
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
    const conteudo = await prisma.transparenciaConteudo.findUnique({
      where: { id }
    })

    if (!conteudo) {
      return NextResponse.json(
        { success: false, error: 'Conteúdo não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: conteudo })
  } catch (error) {
    console.error('Erro ao buscar conteúdo de transparência:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Atualizar conteúdo de transparência (admin)
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

    const conteudoExistente = await prisma.transparenciaConteudo.findUnique({
      where: { id }
    })
    if (!conteudoExistente) {
      return NextResponse.json(
        { success: false, error: 'Conteúdo não encontrado' },
        { status: 404 }
      )
    }

    const conteudo = await prisma.transparenciaConteudo.update({
      where: { id },
      data: {
        titulo: body.titulo,
        descricao: body.descricao,
        categoriaSlug: body.categoriaSlug,
        subcategoria: body.subcategoria,
        tipo: body.tipo,
        ano: body.ano !== undefined ? parseInt(body.ano) : undefined,
        dataPublicacao: body.dataPublicacao ? new Date(body.dataPublicacao) : undefined,
        url: body.url,
        arquivo: body.arquivo,
        status: body.status,
      }
    })

    return NextResponse.json({
      success: true,
      data: conteudo,
      message: 'Conteúdo de transparência atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar conteúdo de transparência:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Excluir conteúdo de transparência (admin)
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

    const conteudoExistente = await prisma.transparenciaConteudo.findUnique({
      where: { id }
    })
    if (!conteudoExistente) {
      return NextResponse.json(
        { success: false, error: 'Conteúdo não encontrado' },
        { status: 404 }
      )
    }

    await prisma.transparenciaConteudo.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Conteúdo de transparência excluído com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir conteúdo de transparência:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
