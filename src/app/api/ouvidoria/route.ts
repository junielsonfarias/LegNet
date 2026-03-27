import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ouvidoriaService } from '@/lib/services/ouvidoria-service'
import type { TipoManifestacao, StatusManifestacao } from '@prisma/client'

export const dynamic = 'force-dynamic'

/**
 * GET - Listar manifestações da ouvidoria (admin)
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
    const tipo = searchParams.get('tipo') || undefined
    const status = searchParams.get('status') || undefined
    const prioridade = searchParams.get('prioridade') || undefined
    const ano = searchParams.get('ano') ? parseInt(searchParams.get('ano')!) : undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const busca = searchParams.get('busca') || undefined

    const result = await ouvidoriaService.paginate(
      { tipo: tipo as TipoManifestacao | undefined, status: status as StatusManifestacao | undefined, prioridade, ano, search: busca },
      { page, limit }
    )

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    })
  } catch (error) {
    console.error('Erro ao listar manifestações da ouvidoria:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST - Criar nova manifestação na ouvidoria (público)
 * Não requer autenticação
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validar campos obrigatórios
    if (!body.tipo || !body.assunto || !body.descricao) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios não fornecidos (tipo, assunto, descricao)' },
        { status: 400 }
      )
    }

    // Se não for anônimo, exigir nome e email
    if (!body.anonimo && (!body.nome || !body.email)) {
      return NextResponse.json(
        { success: false, error: 'Para manifestações não anônimas, nome e email são obrigatórios' },
        { status: 400 }
      )
    }

    const manifestacao = await ouvidoriaService.create({
      anonimo: body.anonimo || false,
      nome: body.nome,
      email: body.email,
      telefone: body.telefone,
      cpf: body.cpf,
      tipo: body.tipo,
      assunto: body.assunto,
      descricao: body.descricao,
      setor: body.setor
    })

    return NextResponse.json({
      success: true,
      data: {
        id: manifestacao.id,
        protocolo: manifestacao.protocolo
      },
      message: 'Manifestação registrada com sucesso'
    }, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar manifestação na ouvidoria:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
