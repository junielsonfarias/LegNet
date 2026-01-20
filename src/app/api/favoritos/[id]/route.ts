import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// Schema de atualização
const updateSchema = z.object({
  notificarMudancas: z.boolean().optional(),
  notificarVotacao: z.boolean().optional(),
  notificarParecer: z.boolean().optional(),
  anotacao: z.string().nullable().optional(),
})

/**
 * GET /api/favoritos/[id] - Busca um favorito específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params

    const favorito = await prisma.favorito.findUnique({
      where: { id },
    })

    if (!favorito) {
      return NextResponse.json({ error: 'Favorito não encontrado' }, { status: 404 })
    }

    if (favorito.userId !== session.user.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    return NextResponse.json({ favorito })
  } catch (error) {
    console.error('Erro ao buscar favorito:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

/**
 * PATCH /api/favoritos/[id] - Atualiza configurações do favorito
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validacao = updateSchema.safeParse(body)

    if (!validacao.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', detalhes: validacao.error.errors },
        { status: 400 }
      )
    }

    const favorito = await prisma.favorito.findUnique({
      where: { id },
    })

    if (!favorito) {
      return NextResponse.json({ error: 'Favorito não encontrado' }, { status: 404 })
    }

    if (favorito.userId !== session.user.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const atualizado = await prisma.favorito.update({
      where: { id },
      data: validacao.data,
    })

    return NextResponse.json({ favorito: atualizado })
  } catch (error) {
    console.error('Erro ao atualizar favorito:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

/**
 * DELETE /api/favoritos/[id] - Remove um favorito
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params

    const favorito = await prisma.favorito.findUnique({
      where: { id },
    })

    if (!favorito) {
      return NextResponse.json({ error: 'Favorito não encontrado' }, { status: 404 })
    }

    if (favorito.userId !== session.user.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    await prisma.favorito.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao remover favorito:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
