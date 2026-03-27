import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const publicado = searchParams.get('publicado')
    const slug = searchParams.get('slug')
    const categoria = searchParams.get('categoria')

    if (slug) {
      const conteudo = await prisma.conteudoEducativo.findUnique({ where: { slug } })
      if (!conteudo) {
        return NextResponse.json({ success: false, error: 'Conteudo nao encontrado' }, { status: 404 })
      }
      return NextResponse.json({ success: true, data: conteudo })
    }

    const where: Record<string, unknown> = {}
    if (publicado === 'true') where.publicado = true
    if (categoria) where.categoria = categoria

    const conteudos = await prisma.conteudoEducativo.findMany({
      where,
      orderBy: [{ categoria: 'asc' }, { ordem: 'asc' }],
    })

    return NextResponse.json({ success: true, data: conteudos })
  } catch (error) {
    console.error('Erro ao listar conteudos educativos:', error)
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 })
  }
}
