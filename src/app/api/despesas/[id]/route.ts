import { NextRequest, NextResponse } from 'next/server'
import { despesasDbService } from '@/lib/services/despesas-db-service'
import { withAuth } from '@/lib/auth/permissions'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const despesa = await despesasDbService.getById(id)

    if (!despesa) {
      return NextResponse.json(
        { success: false, error: 'Despesa nao encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: despesa })
  } catch (error) {
    console.error('Erro ao buscar despesa:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export const PUT = withAuth(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params
    const body = await request.json()

    const despesaExistente = await despesasDbService.getById(id)
    if (!despesaExistente) {
      return NextResponse.json(
        { success: false, error: 'Despesa nao encontrada' },
        { status: 404 }
      )
    }

    const despesaAtualizada = await despesasDbService.update(id, {
      numeroEmpenho: body.numeroEmpenho,
      ano: body.ano,
      mes: body.mes,
      data: body.data,
      credor: body.credor,
      cnpjCpf: body.cnpjCpf,
      unidade: body.unidade,
      elemento: body.elemento,
      funcao: body.funcao,
      subfuncao: body.subfuncao,
      programa: body.programa,
      acao: body.acao,
      valorEmpenhado: body.valorEmpenhado !== undefined ? parseFloat(body.valorEmpenhado) : undefined,
      valorLiquidado: body.valorLiquidado !== undefined ? parseFloat(body.valorLiquidado) : undefined,
      valorPago: body.valorPago !== undefined ? parseFloat(body.valorPago) : undefined,
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
      data: despesaAtualizada,
      message: 'Despesa atualizada com sucesso'
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

    const despesaExistente = await despesasDbService.getById(id)
    if (!despesaExistente) {
      return NextResponse.json(
        { success: false, error: 'Despesa nao encontrada' },
        { status: 404 }
      )
    }

    await despesasDbService.remove(id)

    return NextResponse.json({
      success: true,
      message: 'Despesa excluida com sucesso'
    })
  },
  { permissions: 'financeiro.manage' }
)
