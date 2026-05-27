import { NextRequest } from 'next/server'
import { createSuccessResponse, NotFoundError, withErrorHandler } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { contratosDbService } from '@/lib/services/contratos-db-service'
import { createLogger } from '@/lib/logging/logger'

const log = createLogger('api/financeiro/contratos-detalhe')

export const dynamic = 'force-dynamic'

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const contrato = await contratosDbService.getById(id)

  if (!contrato) {
    throw new NotFoundError('Contrato')
  }

  return createSuccessResponse(contrato)
})

export const PUT = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const body = await request.json()

  const contratoExistente = await contratosDbService.getById(id)
  if (!contratoExistente) {
    throw new NotFoundError('Contrato')
  }

  const contratoAtualizado = await contratosDbService.update(id, {
    numero: body.numero,
    ano: body.ano,
    modalidade: body.modalidade,
    objeto: body.objeto,
    contratado: body.contratado,
    cnpjCpf: body.cnpjCpf,
    valorTotal: body.valorTotal !== undefined ? parseFloat(body.valorTotal) : undefined,
    dataAssinatura: body.dataAssinatura,
    vigenciaInicio: body.vigenciaInicio,
    vigenciaFim: body.vigenciaFim,
    fiscalContrato: body.fiscalContrato,
    situacao: body.situacao,
    licitacaoId: body.licitacaoId,
    arquivo: body.arquivo,
    observacoes: body.observacoes
  })

  log.info('Contrato atualizado', {
    action: 'contrato_update',
    id,
    situacao: contratoAtualizado.situacao
  })

  return createSuccessResponse(contratoAtualizado, 'Contrato atualizado com sucesso')
}, { permissions: 'financeiro.manage' })

export const DELETE = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params

  const contratoExistente = await contratosDbService.getById(id)
  if (!contratoExistente) {
    throw new NotFoundError('Contrato')
  }

  await contratosDbService.remove(id)

  log.info('Contrato excluído', {
    action: 'contrato_delete',
    id,
    numero: contratoExistente.numero
  })

  return createSuccessResponse(null, 'Contrato excluido com sucesso')
}, { permissions: 'financeiro.manage' })
