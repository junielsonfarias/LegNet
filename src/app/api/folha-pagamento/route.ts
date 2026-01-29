import { NextRequest, NextResponse } from 'next/server'
import { folhaPagamentoDbService } from '@/lib/services/servidores-db-service'
import { withAuth } from '@/lib/auth/permissions'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ano = searchParams.get('ano')
    const mes = searchParams.get('mes')
    const situacao = searchParams.get('situacao')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const result = await folhaPagamentoDbService.paginate(
      {
        ano: ano ? parseInt(ano) : undefined,
        mes: mes ? parseInt(mes) : undefined,
        situacao: situacao || undefined
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
    console.error('Erro ao buscar folhas de pagamento:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export const POST = withAuth(
  async (request: NextRequest) => {
    const body = await request.json()

    if (!body.competencia || !body.mes || !body.ano) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatorios nao fornecidos (competencia, mes, ano)' },
        { status: 400 }
      )
    }

    const novaFolha = await folhaPagamentoDbService.create({
      competencia: body.competencia,
      mes: body.mes,
      ano: body.ano,
      totalServidores: body.totalServidores ? parseInt(body.totalServidores) : null,
      totalBruto: body.totalBruto ? parseFloat(body.totalBruto) : null,
      totalDeducoes: body.totalDeducoes ? parseFloat(body.totalDeducoes) : null,
      totalLiquido: body.totalLiquido ? parseFloat(body.totalLiquido) : null,
      dataProcessamento: body.dataProcessamento,
      situacao: body.situacao,
      observacoes: body.observacoes
    })

    return NextResponse.json({
      success: true,
      data: novaFolha,
      message: 'Folha de pagamento criada com sucesso'
    }, { status: 201 })
  },
  { permissions: 'financeiro.manage' }
)
