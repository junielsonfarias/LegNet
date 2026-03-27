import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ano = searchParams.get('ano') ? parseInt(searchParams.get('ano')!) : new Date().getFullYear()
    const mes = searchParams.get('mes') ? parseInt(searchParams.get('mes')!) : undefined

    const where: Record<string, unknown> = { ano }
    if (mes) where.mes = mes

    const diarias = await prisma.diaria.findMany({
      where,
      orderBy: [{ mes: 'desc' }, { dataInicio: 'desc' }],
    })

    const total = diarias.reduce((acc, d) => acc + Number(d.valorTotal), 0)

    return NextResponse.json({ success: true, data: diarias, total })
  } catch (error) {
    console.error('Erro ao listar diarias:', error)
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 })
  }
}
