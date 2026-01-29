import { NextRequest, NextResponse } from 'next/server'
import { licitacoesDbService } from '@/lib/services/licitacoes-db-service'
import { withAuth } from '@/lib/auth/permissions'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const licitacao = await licitacoesDbService.getById(id)

    if (!licitacao) {
      return NextResponse.json(
        { success: false, error: 'Licitacao nao encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: licitacao
    })
  } catch (error) {
    console.error('Erro ao buscar licitacao:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export const PUT = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const body = await request.json()

  const licitacaoExistente = await licitacoesDbService.getById(id)
  if (!licitacaoExistente) {
    return NextResponse.json(
      { success: false, error: 'Licitacao nao encontrada' },
      { status: 404 }
    )
  }

  const licitacaoAtualizada = await licitacoesDbService.update(id, {
    numero: body.numero,
    ano: body.ano,
    modalidade: body.modalidade,
    tipo: body.tipo,
    objeto: body.objeto,
    valorEstimado: body.valorEstimado !== undefined ? parseFloat(body.valorEstimado) : undefined,
    dataPublicacao: body.dataPublicacao,
    dataAbertura: body.dataAbertura,
    horaAbertura: body.horaAbertura,
    dataEntregaPropostas: body.dataEntregaPropostas,
    situacao: body.situacao,
    unidadeGestora: body.unidadeGestora,
    linkEdital: body.linkEdital,
    observacoes: body.observacoes
  })

  return NextResponse.json({
    success: true,
    data: licitacaoAtualizada,
    message: 'Licitacao atualizada com sucesso'
  })
}, { permissions: 'financeiro.manage' })

export const DELETE = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params

  const licitacaoExistente = await licitacoesDbService.getById(id)
  if (!licitacaoExistente) {
    return NextResponse.json(
      { success: false, error: 'Licitacao nao encontrada' },
      { status: 404 }
    )
  }

  await licitacoesDbService.remove(id)

  return NextResponse.json({
    success: true,
    message: 'Licitacao excluida com sucesso'
  })
}, { permissions: 'financeiro.manage' })
