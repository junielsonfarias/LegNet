import { NextRequest, NextResponse } from 'next/server'

import { withAuth } from '@/lib/auth/permissions'
import { publicacoesService } from '@/lib/publicacoes-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const categoriaId = searchParams.get('categoriaId') || undefined
    const autorTipo = (searchParams.get('autorTipo') || undefined) as any
    const publicadaParam = searchParams.get('publicada')
    const publicada = publicadaParam !== null ? publicadaParam === 'true' : undefined
    const search = searchParams.get('search') || searchParams.get('titulo') || undefined
    const tipo = searchParams.get('tipo') || undefined
    const anoParam = searchParams.get('ano')
    const ano = anoParam ? Number(anoParam) : undefined
    const page = Number.parseInt(searchParams.get('page') || '1', 10)
    const limit = Number.parseInt(searchParams.get('limit') || '10', 10)

    const result = await publicacoesService.paginate(
      {
        categoriaId,
        autorTipo,
        publicada,
        search: search || undefined,
        tipo,
        ano: Number.isNaN(ano as number) ? undefined : ano
      },
      { page, limit }
    )

    return NextResponse.json(
      {
        success: true,
        data: result.data,
        pagination: result.pagination
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=300',
          'X-Total-Count': result.pagination.total.toString()
        }
      }
    )
  } catch (error) {
    console.error('Erro ao buscar publicações:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export const POST = withAuth(async (request: NextRequest) => {
  try {
    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json(
        { success: false, error: 'JSON inválido' },
        { status: 400 }
      )
    }

    const { titulo, conteudo, tipo, categoriaId, publicada, autorTipo, autorNome, autorId } = body

    if (!titulo || !conteudo || !tipo) {
      return NextResponse.json(
        { success: false, error: 'Informe título, conteúdo e tipo da publicação.' },
        { status: 400 }
      )
    }

    const novaPublicacao = await publicacoesService.create({
      titulo,
      descricao: body.descricao ?? null,
      tipo,
      numero: body.numero ?? null,
      ano: body.ano ?? undefined,
      data: body.data ?? body.dataPublicacao ?? undefined,
      conteudo,
      arquivo: body.arquivo ?? body.arquivoUrl ?? null,
      tamanho: body.tamanho ?? null,
      publicada: typeof publicada === 'boolean' ? publicada : body.status === 'publicado',
      categoriaId: categoriaId ?? null,
      autorTipo: autorTipo ?? 'OUTRO',
      autorNome: autorNome ?? body.autor ?? 'Administrador',
      autorId: autorId ?? null
    })

    return NextResponse.json(
      {
        success: true,
        data: novaPublicacao,
        message: 'Publicação criada com sucesso'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erro ao criar publicação:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}, { permissions: 'publicacao.manage' })
