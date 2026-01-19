import { NextRequest, NextResponse } from 'next/server'
import { receitasDbService } from '@/lib/services/receitas-db-service'
import type { CategoriaReceita, OrigemReceita, SituacaoReceita } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoria = searchParams.get('categoria') as CategoriaReceita | null
    const origem = searchParams.get('origem') as OrigemReceita | null
    const situacao = searchParams.get('situacao') as SituacaoReceita | null
    const ano = searchParams.get('ano')
    const mes = searchParams.get('mes')
    const contribuinte = searchParams.get('contribuinte')
    const valorMinimo = searchParams.get('valorMinimo')
    const valorMaximo = searchParams.get('valorMaximo')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const result = await receitasDbService.paginate(
      {
        categoria: categoria || undefined,
        origem: origem || undefined,
        situacao: situacao || undefined,
        ano: ano ? parseInt(ano) : undefined,
        mes: mes ? parseInt(mes) : undefined,
        contribuinte: contribuinte || undefined,
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
    console.error('Erro ao buscar receitas:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.categoria || !body.origem || !body.valorArrecadado) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatorios nao fornecidos (categoria, origem, valorArrecadado)' },
        { status: 400 }
      )
    }

    const dataReceita = body.data ? new Date(body.data) : new Date()

    const novaReceita = await receitasDbService.create({
      numero: body.numero,
      ano: body.ano || dataReceita.getFullYear(),
      mes: body.mes || dataReceita.getMonth() + 1,
      data: dataReceita,
      contribuinte: body.contribuinte,
      cnpjCpf: body.cnpjCpf,
      unidade: body.unidade,
      categoria: body.categoria,
      origem: body.origem,
      especie: body.especie,
      rubrica: body.rubrica,
      valorPrevisto: body.valorPrevisto ? parseFloat(body.valorPrevisto) : null,
      valorArrecadado: parseFloat(body.valorArrecadado),
      situacao: body.situacao,
      fonteRecurso: body.fonteRecurso,
      observacoes: body.observacoes
    })

    return NextResponse.json({
      success: true,
      data: novaReceita,
      message: 'Receita criada com sucesso'
    }, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar receita:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
