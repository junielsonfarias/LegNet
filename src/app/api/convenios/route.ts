import { NextRequest } from 'next/server'
import { createSuccessResponse, ValidationError, withErrorHandler } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { conveniosDbService } from '@/lib/services/convenios-db-service'
import { createLogger } from '@/lib/logging/logger'
import type { SituacaoConvenio } from '@prisma/client'

const log = createLogger('api/financeiro/convenios')

export const dynamic = 'force-dynamic'

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const situacao = searchParams.get('situacao') as SituacaoConvenio | null
  const ano = searchParams.get('ano')
  const convenente = searchParams.get('convenente')
  const orgaoConcedente = searchParams.get('orgaoConcedente')
  const objeto = searchParams.get('objeto')
  const dataInicio = searchParams.get('dataInicio')
  const dataFim = searchParams.get('dataFim')
  const valorMinimo = searchParams.get('valorMinimo')
  const valorMaximo = searchParams.get('valorMaximo')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')

  const result = await conveniosDbService.paginate(
    {
      situacao: situacao || undefined,
      ano: ano ? parseInt(ano) : undefined,
      convenente: convenente || undefined,
      orgaoConcedente: orgaoConcedente || undefined,
      objeto: objeto || undefined,
      dataInicio: dataInicio || undefined,
      dataFim: dataFim || undefined,
      valorMinimo: valorMinimo ? parseFloat(valorMinimo) : undefined,
      valorMaximo: valorMaximo ? parseFloat(valorMaximo) : undefined
    },
    { page, limit }
  )

  return createSuccessResponse(result.data, undefined, undefined, 200, {
    total: result.pagination.total,
    page: result.pagination.page,
    limit: result.pagination.limit,
    totalPages: result.pagination.totalPages
  })
})

export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json()

  if (!body.numero || !body.convenente || !body.orgaoConcedente || !body.objeto || !body.valorTotal) {
    log.warn('Convênio bloqueado por validação', {
      action: 'convenio_validation_failed',
      motivo: 'campos_obrigatorios_ausentes'
    })
    throw new ValidationError('Campos obrigatorios nao fornecidos')
  }

  const novoConvenio = await conveniosDbService.create({
    numero: body.numero,
    ano: body.ano || new Date().getFullYear(),
    convenente: body.convenente,
    cnpjConvenente: body.cnpjConvenente,
    orgaoConcedente: body.orgaoConcedente,
    objeto: body.objeto,
    programa: body.programa,
    acao: body.acao,
    valorTotal: parseFloat(body.valorTotal),
    valorRepasse: body.valorRepasse ? parseFloat(body.valorRepasse) : null,
    valorContrapartida: body.valorContrapartida ? parseFloat(body.valorContrapartida) : null,
    dataCelebracao: body.dataCelebracao || new Date().toISOString(),
    vigenciaInicio: body.vigenciaInicio || body.dataCelebracao,
    vigenciaFim: body.vigenciaFim,
    responsavelTecnico: body.responsavelTecnico,
    situacao: body.situacao,
    fonteRecurso: body.fonteRecurso,
    arquivo: body.arquivo,
    observacoes: body.observacoes
  })

  log.info('Convênio criado', {
    action: 'convenio_create',
    id: novoConvenio.id,
    numero: novoConvenio.numero,
    ano: novoConvenio.ano,
    situacao: novoConvenio.situacao
  })

  return createSuccessResponse(novoConvenio, 'Convenio criado com sucesso', undefined, 201)
}, { permissions: 'financeiro.manage' })
