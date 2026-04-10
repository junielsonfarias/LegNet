import { NextRequest } from 'next/server'
import { despesasDbService } from '@/lib/services/despesas-db-service'
import { withAuth } from '@/lib/auth/permissions'
import { withErrorHandler, createSuccessResponse, NotFoundError } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const despesa = await despesasDbService.getById(id)

  if (!despesa) {
    throw new NotFoundError('Despesa')
  }

  return createSuccessResponse(despesa)
})

export const PUT = withAuth(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params
    const body = await request.json()

    const despesaExistente = await despesasDbService.getById(id)
    if (!despesaExistente) {
      throw new NotFoundError('Despesa')
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

    return createSuccessResponse(despesaAtualizada, 'Despesa atualizada com sucesso')
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
      throw new NotFoundError('Despesa')
    }

    await despesasDbService.remove(id)

    return createSuccessResponse(null, 'Despesa excluida com sucesso')
  },
  { permissions: 'financeiro.manage' }
)
