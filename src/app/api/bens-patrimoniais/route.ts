import { NextRequest, NextResponse } from 'next/server'
import { bensPatrimoniaisDbService } from '@/lib/services/bens-patrimoniais-db-service'
import type { TipoBem, SituacaoBem } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo') as TipoBem | null
    const situacao = searchParams.get('situacao') as SituacaoBem | null
    const descricao = searchParams.get('descricao')
    const localizacao = searchParams.get('localizacao')
    const responsavel = searchParams.get('responsavel')
    const valorMinimo = searchParams.get('valorMinimo')
    const valorMaximo = searchParams.get('valorMaximo')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const result = await bensPatrimoniaisDbService.paginate(
      {
        tipo: tipo || undefined,
        situacao: situacao || undefined,
        descricao: descricao || undefined,
        localizacao: localizacao || undefined,
        responsavel: responsavel || undefined,
        valorMinimo: valorMinimo ? parseFloat(valorMinimo) : undefined,
        valorMaximo: valorMaximo ? parseFloat(valorMaximo) : undefined
      },
      { page, limit }
    )

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300',
        'X-Total-Count': result.pagination.total.toString()
      }
    })
  } catch (error) {
    console.error('Erro ao buscar bens patrimoniais:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.tipo || !body.descricao) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatorios nao fornecidos (tipo, descricao)' },
        { status: 400 }
      )
    }

    const novoBem = await bensPatrimoniaisDbService.create({
      tipo: body.tipo,
      tombamento: body.tombamento,
      descricao: body.descricao,
      especificacao: body.especificacao,
      dataAquisicao: body.dataAquisicao,
      valorAquisicao: body.valorAquisicao ? parseFloat(body.valorAquisicao) : null,
      valorAtual: body.valorAtual ? parseFloat(body.valorAtual) : null,
      localizacao: body.localizacao,
      responsavel: body.responsavel,
      situacao: body.situacao,
      matriculaImovel: body.matriculaImovel,
      enderecoImovel: body.enderecoImovel,
      areaImovel: body.areaImovel ? parseFloat(body.areaImovel) : null,
      observacoes: body.observacoes
    })

    return NextResponse.json({
      success: true,
      data: novoBem,
      message: 'Bem patrimonial criado com sucesso'
    }, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar bem patrimonial:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
