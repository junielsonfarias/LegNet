import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createSuccessResponse, ValidationError, withErrorHandler } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { contratosDbService } from '@/lib/services/contratos-db-service'
import {
  safeParseQueryParams,
  PaginationSchema,
  FinanceiroFilterBaseSchema,
} from '@/lib/validation/query-schemas'
import { createLogger } from '@/lib/logging/logger'

const log = createLogger('api/financeiro/contratos')

export const dynamic = 'force-dynamic'

// P2-C: estende schemas centrais (PaginationSchema + FinanceiroFilterBaseSchema)
// com campos especificos de contrato. Enums stritos mapeam para Prisma.
const ContratoQuerySchema = PaginationSchema
  .merge(FinanceiroFilterBaseSchema)
  .extend({
    modalidade: z.enum(['CONTRATO_ORIGINAL', 'ADITIVO', 'APOSTILAMENTO', 'RESCISAO']).nullish().transform(v => v ?? undefined),
    situacao: z.enum(['VIGENTE', 'ENCERRADO', 'RESCINDIDO', 'SUSPENSO']).nullish().transform(v => v ?? undefined),
    ano: z.coerce.number().int().min(2000).max(2100).optional(),
    contratado: z.string().nullish().transform(v => v ?? undefined),
    objeto: z.string().nullish().transform(v => v ?? undefined),
    licitacaoId: z.string().nullish().transform(v => v ?? undefined),
    dataInicio: z.string().nullish().transform(v => v ?? undefined),
    dataFim: z.string().nullish().transform(v => v ?? undefined),
  }).refine(
    data => !data.valorMinimo || !data.valorMaximo || data.valorMinimo <= data.valorMaximo,
    { message: 'valorMinimo deve ser menor ou igual a valorMaximo' }
  )

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)

  // Validar query params com Zod
  const validation = safeParseQueryParams(searchParams, ContratoQuerySchema)
  if (!validation.success) {
    throw new ValidationError('Parâmetros inválidos', validation.error.errors)
  }

  const {
    page, limit, modalidade, situacao, ano, contratado,
    objeto, licitacaoId, dataInicio, dataFim, valorMinimo, valorMaximo
  } = validation.data

  const result = await contratosDbService.paginate(
    {
      modalidade,
      situacao,
      ano,
      contratado,
      objeto,
      licitacaoId,
      dataInicio,
      dataFim,
      valorMinimo,
      valorMaximo
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

  if (!body.numero || !body.objeto || !body.contratado || !body.valorTotal || !body.dataAssinatura) {
    log.warn('Contrato bloqueado por validação', {
      action: 'contrato_validation_failed',
      motivo: 'campos_obrigatorios_ausentes'
    })
    throw new ValidationError('Campos obrigatorios nao fornecidos')
  }

  const novoContrato = await contratosDbService.create({
    numero: body.numero,
    ano: body.ano || new Date(body.dataAssinatura).getFullYear(),
    modalidade: body.modalidade || 'OUTROS',
    objeto: body.objeto,
    contratado: body.contratado,
    cnpjCpf: body.cnpjCpf,
    valorTotal: parseFloat(body.valorTotal),
    dataAssinatura: body.dataAssinatura,
    vigenciaInicio: body.vigenciaInicio || body.dataAssinatura,
    vigenciaFim: body.vigenciaFim,
    fiscalContrato: body.fiscalContrato,
    situacao: body.situacao,
    licitacaoId: body.licitacaoId,
    arquivo: body.arquivo,
    observacoes: body.observacoes
  })

  log.info('Contrato criado', {
    action: 'contrato_create',
    id: novoContrato.id,
    numero: novoContrato.numero,
    ano: novoContrato.ano,
    modalidade: novoContrato.modalidade,
    situacao: novoContrato.situacao
  })

  return createSuccessResponse(novoContrato, 'Contrato criado com sucesso', undefined, 201)
}, { permissions: 'financeiro.manage' })
