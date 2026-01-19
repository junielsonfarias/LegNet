import { NextRequest, NextResponse } from 'next/server'
import { despesasDbService } from '@/lib/services/despesas-db-service'
import type { SituacaoDespesa } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const situacao = searchParams.get('situacao') as SituacaoDespesa | null
    const ano = searchParams.get('ano')
    const mes = searchParams.get('mes')
    const credor = searchParams.get('credor')
    const elemento = searchParams.get('elemento')
    const funcao = searchParams.get('funcao')
    const programa = searchParams.get('programa')
    const licitacaoId = searchParams.get('licitacaoId')
    const contratoId = searchParams.get('contratoId')
    const convenioId = searchParams.get('convenioId')
    const valorMinimo = searchParams.get('valorMinimo')
    const valorMaximo = searchParams.get('valorMaximo')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const result = await despesasDbService.paginate(
      {
        situacao: situacao || undefined,
        ano: ano ? parseInt(ano) : undefined,
        mes: mes ? parseInt(mes) : undefined,
        credor: credor || undefined,
        elemento: elemento || undefined,
        funcao: funcao || undefined,
        programa: programa || undefined,
        licitacaoId: licitacaoId || undefined,
        contratoId: contratoId || undefined,
        convenioId: convenioId || undefined,
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
    console.error('Erro ao buscar despesas:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.numeroEmpenho || !body.credor || !body.valorEmpenhado) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatorios nao fornecidos (numeroEmpenho, credor, valorEmpenhado)' },
        { status: 400 }
      )
    }

    const dataDespesa = body.data ? new Date(body.data) : new Date()

    const novaDespesa = await despesasDbService.create({
      numeroEmpenho: body.numeroEmpenho,
      ano: body.ano || dataDespesa.getFullYear(),
      mes: body.mes || dataDespesa.getMonth() + 1,
      data: dataDespesa,
      credor: body.credor,
      cnpjCpf: body.cnpjCpf,
      unidade: body.unidade,
      elemento: body.elemento,
      funcao: body.funcao,
      subfuncao: body.subfuncao,
      programa: body.programa,
      acao: body.acao,
      valorEmpenhado: parseFloat(body.valorEmpenhado),
      valorLiquidado: body.valorLiquidado ? parseFloat(body.valorLiquidado) : null,
      valorPago: body.valorPago ? parseFloat(body.valorPago) : null,
      situacao: body.situacao,
      fonteRecurso: body.fonteRecurso,
      modalidade: body.modalidade,
      licitacaoId: body.licitacaoId,
      contratoId: body.contratoId,
      convenioId: body.convenioId,
      observacoes: body.observacoes
    })

    return NextResponse.json({
      success: true,
      data: novaDespesa,
      message: 'Despesa criada com sucesso'
    }, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar despesa:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
