import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ReuniaoComissaoService } from '@/lib/services/reuniao-comissao-service'

// GET - Listar reunioes de comissao
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const comissaoId = searchParams.get('comissaoId') || undefined
    const status = searchParams.get('status') as any || undefined
    const ano = searchParams.get('ano') ? parseInt(searchParams.get('ano')!) : undefined
    const skip = searchParams.get('skip') ? parseInt(searchParams.get('skip')!) : undefined
    const take = searchParams.get('take') ? parseInt(searchParams.get('take')!) : 20

    const resultado = await ReuniaoComissaoService.listarReunioes({
      comissaoId,
      status,
      ano,
      skip,
      take
    })

    return NextResponse.json({
      success: true,
      data: resultado.reunioes,
      total: resultado.total
    })
  } catch (error) {
    console.error('Erro ao listar reunioes:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao listar reunioes' },
      { status: 500 }
    )
  }
}

// POST - Criar nova reuniao
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { comissaoId, tipo, data, horaInicio, local, motivoConvocacao, quorumMinimo, observacoes } = body

    if (!comissaoId || !data) {
      return NextResponse.json(
        { success: false, error: 'Comissao e data sao obrigatorios' },
        { status: 400 }
      )
    }

    const reuniao = await ReuniaoComissaoService.criarReuniao({
      comissaoId,
      tipo,
      data: new Date(data),
      horaInicio: horaInicio ? new Date(horaInicio) : undefined,
      local,
      motivoConvocacao,
      quorumMinimo,
      observacoes,
      criadoPorId: session.user?.id
    })

    return NextResponse.json({
      success: true,
      data: reuniao,
      message: 'Reuniao criada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao criar reuniao:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro ao criar reuniao' },
      { status: 500 }
    )
  }
}
