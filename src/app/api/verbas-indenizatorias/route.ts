import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ano = searchParams.get('ano') ? parseInt(searchParams.get('ano')!) : new Date().getFullYear()
    const mes = searchParams.get('mes') ? parseInt(searchParams.get('mes')!) : undefined
    const parlamentarId = searchParams.get('parlamentarId') || undefined

    const where: Record<string, unknown> = { ano }
    if (mes) where.mes = mes
    if (parlamentarId) where.parlamentarId = parlamentarId

    const verbas = await prisma.verbaIndenizatoria.findMany({
      where,
      orderBy: [{ mes: 'desc' }, { tipo: 'asc' }],
    })

    const total = verbas.reduce((acc, v) => acc + Number(v.valor), 0)

    return NextResponse.json({ success: true, data: verbas, total })
  } catch (error) {
    console.error('Erro ao listar verbas indenizatorias:', error)
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 })
  }
}
