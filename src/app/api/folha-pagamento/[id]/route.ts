import { NextRequest, NextResponse } from 'next/server'
import { folhaPagamentoDbService } from '@/lib/services/servidores-db-service'
import { withAuth } from '@/lib/auth/permissions'

export const dynamic = 'force-dynamic'

// SEGURANÇA: GET protegido pois dados financeiros sensíveis
export const GET = withAuth(
  async (
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
  ) => {
    try {
      const { id } = await context.params
      const folha = await folhaPagamentoDbService.getById(id)

      if (!folha) {
        return NextResponse.json(
          { success: false, error: 'Folha de pagamento nao encontrada' },
          { status: 404 }
        )
      }

      return NextResponse.json({ success: true, data: folha })
    } catch (error) {
      console.error('Erro ao buscar folha de pagamento:', error)
      return NextResponse.json(
        { success: false, error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }
  },
  { permissions: 'financeiro.manage' }
)

export const PUT = withAuth(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params
    const body = await request.json()

    const folhaExistente = await folhaPagamentoDbService.getById(id)
    if (!folhaExistente) {
      return NextResponse.json(
        { success: false, error: 'Folha de pagamento nao encontrada' },
        { status: 404 }
      )
    }

    const folhaAtualizada = await folhaPagamentoDbService.update(id, {
      competencia: body.competencia,
      mes: body.mes,
      ano: body.ano,
      totalServidores: body.totalServidores !== undefined ? parseInt(body.totalServidores) : undefined,
      totalBruto: body.totalBruto !== undefined ? parseFloat(body.totalBruto) : undefined,
      totalDeducoes: body.totalDeducoes !== undefined ? parseFloat(body.totalDeducoes) : undefined,
      totalLiquido: body.totalLiquido !== undefined ? parseFloat(body.totalLiquido) : undefined,
      dataProcessamento: body.dataProcessamento,
      situacao: body.situacao,
      observacoes: body.observacoes
    })

    return NextResponse.json({
      success: true,
      data: folhaAtualizada,
      message: 'Folha de pagamento atualizada com sucesso'
    })
  },
  { permissions: 'financeiro.manage' }
)

export const DELETE = withAuth(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params

    const folhaExistente = await folhaPagamentoDbService.getById(id)
    if (!folhaExistente) {
      return NextResponse.json(
        { success: false, error: 'Folha de pagamento nao encontrada' },
        { status: 404 }
      )
    }

    await folhaPagamentoDbService.remove(id)

    return NextResponse.json({
      success: true,
      message: 'Folha de pagamento excluida com sucesso'
    })
  },
  { permissions: 'financeiro.manage' }
)
