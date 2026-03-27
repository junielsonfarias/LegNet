import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined
    const where: Record<string, unknown> = {}
    if (status) where.status = status

    const concursos = await prisma.concurso.findMany({ where, orderBy: { dataPublicacao: 'desc' } })
    return NextResponse.json({ success: true, data: concursos })
  } catch (error) {
    console.error('Erro ao listar concursos:', error)
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 })
  }
}
