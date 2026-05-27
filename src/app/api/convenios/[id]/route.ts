import { NextRequest } from 'next/server'
import { createSuccessResponse, NotFoundError, withErrorHandler } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { conveniosDbService } from '@/lib/services/convenios-db-service'
import { createLogger } from '@/lib/logging/logger'

const log = createLogger('api/financeiro/convenios-detalhe')

export const dynamic = 'force-dynamic'

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const convenio = await conveniosDbService.getById(id)

  if (!convenio) {
    throw new NotFoundError('Convenio')
  }

  return createSuccessResponse(convenio)
})

export const PUT = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const body = await request.json()

  const convenioExistente = await conveniosDbService.getById(id)
  if (!convenioExistente) {
    throw new NotFoundError('Convenio')
  }

  const convenioAtualizado = await conveniosDbService.update(id, {
    numero: body.numero,
    ano: body.ano,
    convenente: body.convenente,
    cnpjConvenente: body.cnpjConvenente,
    orgaoConcedente: body.orgaoConcedente,
    objeto: body.objeto,
    programa: body.programa,
    acao: body.acao,
    valorTotal: body.valorTotal !== undefined ? parseFloat(body.valorTotal) : undefined,
    valorRepasse: body.valorRepasse !== undefined ? parseFloat(body.valorRepasse) : undefined,
    valorContrapartida: body.valorContrapartida !== undefined ? parseFloat(body.valorContrapartida) : undefined,
    dataCelebracao: body.dataCelebracao,
    vigenciaInicio: body.vigenciaInicio,
    vigenciaFim: body.vigenciaFim,
    responsavelTecnico: body.responsavelTecnico,
    situacao: body.situacao,
    fonteRecurso: body.fonteRecurso,
    arquivo: body.arquivo,
    observacoes: body.observacoes
  })

  log.info('Convênio atualizado', {
    action: 'convenio_update',
    id,
    situacao: convenioAtualizado.situacao
  })

  return createSuccessResponse(convenioAtualizado, 'Convenio atualizado com sucesso')
}, { permissions: 'financeiro.manage' })

export const DELETE = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params

  const convenioExistente = await conveniosDbService.getById(id)
  if (!convenioExistente) {
    throw new NotFoundError('Convenio')
  }

  await conveniosDbService.remove(id)

  log.info('Convênio excluído', {
    action: 'convenio_delete',
    id,
    numero: convenioExistente.numero
  })

  return createSuccessResponse(null, 'Convenio excluido com sucesso')
}, { permissions: 'financeiro.manage' })
