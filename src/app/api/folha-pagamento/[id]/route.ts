import { NextRequest } from 'next/server'
import { folhaPagamentoDbService } from '@/lib/services/servidores-db-service'
import { withAuth } from '@/lib/auth/permissions'
import { createSuccessResponse, NotFoundError } from '@/lib/error-handler'
import { createLogger } from '@/lib/logging/logger'

const log = createLogger('api/rh/folha-pagamento-detalhe')

export const dynamic = 'force-dynamic'

// SEGURANCA: GET protegido pois dados financeiros sensiveis
export const GET = withAuth(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params
    const folha = await folhaPagamentoDbService.getById(id)

    if (!folha) {
      throw new NotFoundError('Folha de pagamento')
    }

    return createSuccessResponse(folha)
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
      throw new NotFoundError('Folha de pagamento')
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

    log.info('Folha de pagamento atualizada', {
      action: 'folha_update',
      id,
      situacao: folhaAtualizada.situacao
    })

    return createSuccessResponse(folhaAtualizada, 'Folha de pagamento atualizada com sucesso')
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
      throw new NotFoundError('Folha de pagamento')
    }

    await folhaPagamentoDbService.remove(id)

    log.info('Folha de pagamento excluída', {
      action: 'folha_delete',
      id,
      competencia: folhaExistente.competencia
    })

    return createSuccessResponse(null, 'Folha de pagamento excluida com sucesso')
  },
  { permissions: 'financeiro.manage' }
)
