import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { esicService } from '@/lib/services/esic-service'
import type { StatusESIC } from '@prisma/client'

export const dynamic = 'force-dynamic'

/**
 * GET - Listar solicitações e-SIC (admin)
 * Requer autenticação
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined
    const ano = searchParams.get('ano') ? parseInt(searchParams.get('ano')!) : undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const busca = searchParams.get('busca') || undefined

    const result = await esicService.paginate(
      { status: status as StatusESIC | undefined, ano, search: busca },
      { page, limit }
    )

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    })
  } catch (error) {
    console.error('Erro ao listar solicitações e-SIC:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST - Criar nova solicitação e-SIC (público)
 * Não requer autenticação
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validar campos obrigatórios
    if (!body.nome || !body.email || !body.assunto || !body.descricao) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios não fornecidos (nome, email, assunto, descricao)' },
        { status: 400 }
      )
    }

    const solicitacao = await esicService.create({
      nome: body.nome,
      email: body.email,
      cpf: body.cpf,
      telefone: body.telefone,
      tipoSolicitante: body.tipoSolicitante,
      assunto: body.assunto,
      descricao: body.descricao,
      orgao: body.orgao,
      formaResposta: body.formaResposta
    })

    return NextResponse.json({
      success: true,
      data: {
        id: solicitacao.id,
        protocolo: solicitacao.protocolo,
        prazoResposta: solicitacao.prazoResposta
      },
      message: 'Solicitação registrada com sucesso'
    }, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar solicitação e-SIC:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
