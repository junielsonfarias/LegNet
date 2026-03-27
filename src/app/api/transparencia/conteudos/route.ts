import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET - Listar conteúdos de transparência
 * Público: apenas status='publicado' | Admin (com sessão): todos
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoriaSlug = searchParams.get('categoriaSlug') || undefined
    const subcategoria = searchParams.get('subcategoria') || undefined
    const tipo = searchParams.get('tipo') || undefined
    const ano = searchParams.get('ano') ? parseInt(searchParams.get('ano')!) : undefined
    const statusParam = searchParams.get('status') || undefined
    const busca = searchParams.get('busca') || undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Verificar se é admin
    const session = await getServerSession(authOptions)
    const isAdmin = !!session

    // Montar filtros
    const where: any = {}

    if (!isAdmin) {
      where.status = 'publicado'
    } else if (statusParam) {
      where.status = statusParam
    }

    if (categoriaSlug) {
      where.categoriaSlug = categoriaSlug
    }

    if (subcategoria) {
      where.subcategoria = subcategoria
    }

    if (tipo) {
      where.tipo = tipo
    }

    if (ano) {
      where.ano = ano
    }

    if (busca) {
      where.OR = [
        { titulo: { contains: busca, mode: 'insensitive' } },
        { descricao: { contains: busca, mode: 'insensitive' } }
      ]
    }

    const skip = (page - 1) * limit

    const [data, total] = await Promise.all([
      prisma.transparenciaConteudo.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.transparenciaConteudo.count({ where })
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    }, {
      headers: {
        'Cache-Control': isAdmin ? 'private, no-store' : 'public, max-age=300',
        'X-Total-Count': total.toString()
      }
    })
  } catch (error) {
    console.error('Erro ao listar conteúdos de transparência:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST - Criar conteúdo de transparência (admin)
 * Requer autenticação
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()

    if (!body.titulo || !body.categoriaSlug) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios não fornecidos (titulo, categoriaSlug)' },
        { status: 400 }
      )
    }

    const conteudo = await prisma.transparenciaConteudo.create({
      data: {
        titulo: body.titulo,
        descricao: body.descricao,
        categoriaSlug: body.categoriaSlug,
        subcategoria: body.subcategoria || '',
        tipo: body.tipo || 'documento',
        ano: body.ano ? parseInt(body.ano) : new Date().getFullYear(),
        dataPublicacao: body.dataPublicacao ? new Date(body.dataPublicacao) : new Date(),
        url: body.url,
        arquivo: body.arquivo,
        status: body.status || 'rascunho',
      }
    })

    return NextResponse.json({
      success: true,
      data: conteudo,
      message: 'Conteúdo de transparência criado com sucesso'
    }, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar conteúdo de transparência:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
