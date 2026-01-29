import { NextRequest, NextResponse } from 'next/server'

import { categoriasPublicacaoService } from '@/lib/categorias-publicacao-service'
import { withAuth } from '@/lib/auth/permissions'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeInativas = searchParams.get('includeInativas') === 'true'
    const search = searchParams.get('search') || undefined

    if (search) {
      const categorias = await categoriasPublicacaoService.search(search)
      return NextResponse.json({ success: true, data: categorias })
    }

    const categorias = await categoriasPublicacaoService.list({ includeInativas })
    return NextResponse.json({ success: true, data: categorias })
  } catch (error) {
    console.error('Erro ao listar categorias de publicação:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao listar categorias.' },
      { status: 500 }
    )
  }
}

export const POST = withAuth(
  async (request: NextRequest) => {
    const body = await request.json().catch(() => null)
    if (!body || typeof body.nome !== 'string' || !body.nome.trim()) {
      return NextResponse.json(
        { success: false, error: 'Informe o nome da categoria.' },
        { status: 400 }
      )
    }

    const categoria = await categoriasPublicacaoService.create({
      nome: body.nome,
      descricao: body.descricao ?? null,
      cor: body.cor ?? null,
      ativa: body.ativa ?? true,
      ordem: body.ordem ?? 0
    })

    return NextResponse.json(
      { success: true, data: categoria, message: 'Categoria criada com sucesso.' },
      { status: 201 }
    )
  },
  { permissions: 'publicacao.manage' }
)
