import { NextRequest } from 'next/server'
import { licitacoesDbService } from '@/lib/services/licitacoes-db-service'
import { withAuth } from '@/lib/auth/permissions'
import { withErrorHandler, createSuccessResponse, NotFoundError } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const licitacao = await licitacoesDbService.getById(id)

  if (!licitacao) {
    throw new NotFoundError('Licitacao')
  }

  return createSuccessResponse(licitacao)
})

export const PUT = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const body = await request.json()

  const licitacaoExistente = await licitacoesDbService.getById(id)
  if (!licitacaoExistente) {
    throw new NotFoundError('Licitacao')
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

  return createSuccessResponse(licitacaoAtualizada, 'Licitacao atualizada com sucesso')
}, { permissions: 'financeiro.manage' })

export const DELETE = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params

  const licitacaoExistente = await licitacoesDbService.getById(id)
  if (!licitacaoExistente) {
    throw new NotFoundError('Licitacao')
  }

  await licitacoesDbService.remove(id)

  return createSuccessResponse(null, 'Licitacao excluida com sucesso')
}, { permissions: 'financeiro.manage' })
