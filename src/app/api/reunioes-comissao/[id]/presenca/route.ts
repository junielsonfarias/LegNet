import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ReuniaoComissaoService } from '@/lib/services/reuniao-comissao-service'

// GET - Listar presencas da reuniao
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const { id: reuniaoId } = await params
    const presencas = await ReuniaoComissaoService.obterPresencas(reuniaoId)
    const quorum = await ReuniaoComissaoService.verificarQuorum(reuniaoId)

    return NextResponse.json({
      success: true,
      data: {
        presencas,
        quorum
      }
    })
  } catch (error) {
    console.error('Erro ao listar presencas:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao listar presencas' },
      { status: 500 }
    )
  }
}

// POST - Registrar presenca
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const { id: reuniaoId } = await params
    const body = await request.json()

    if (!body.membroComissaoId) {
      return NextResponse.json(
        { success: false, error: 'ID do membro e obrigatorio' },
        { status: 400 }
      )
    }

    const presenca = await ReuniaoComissaoService.registrarPresenca(
      reuniaoId,
      body.membroComissaoId,
      body.presente ?? true,
      body.justificativa
    )

    // Verificar quorum apos registrar presenca
    const quorum = await ReuniaoComissaoService.verificarQuorum(reuniaoId)

    return NextResponse.json({
      success: true,
      data: {
        presenca,
        quorum
      },
      message: 'Presenca registrada'
    })
  } catch (error) {
    console.error('Erro ao registrar presenca:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro ao registrar presenca' },
      { status: 500 }
    )
  }
}

// PUT - Registrar saida
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const { id: reuniaoId } = await params
    const body = await request.json()

    if (!body.membroComissaoId) {
      return NextResponse.json(
        { success: false, error: 'ID do membro e obrigatorio' },
        { status: 400 }
      )
    }

    const presenca = await ReuniaoComissaoService.registrarSaida(
      reuniaoId,
      body.membroComissaoId
    )

    return NextResponse.json({
      success: true,
      data: presenca,
      message: 'Saida registrada'
    })
  } catch (error) {
    console.error('Erro ao registrar saida:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro ao registrar saida' },
      { status: 500 }
    )
  }
}
