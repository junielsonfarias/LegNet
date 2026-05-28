import { NextRequest } from 'next/server'
import { z } from 'zod'
import { despesasDbService } from '@/lib/services/despesas-db-service'
import { withAuth } from '@/lib/auth/permissions'
import { withErrorHandler, createSuccessResponse, ValidationError } from '@/lib/error-handler'
import {
  safeParseQueryParams,
  PaginationSchema,
  FinanceiroFilterBaseSchema,
} from '@/lib/validation/query-schemas'
import { createLogger } from '@/lib/logging/logger'

const log = createLogger('api/financeiro/despesas')

export const dynamic = 'force-dynamic'

// P2-C: estende schemas centrais (PaginationSchema + FinanceiroFilterBaseSchema)
// com campos especificos de despesa. Situacao tem enum stricto que mapeia
// para Prisma.
const DespesaQuerySchema = PaginationSchema
  .merge(FinanceiroFilterBaseSchema)
  .extend({
    situacao: z.enum(['EMPENHADA', 'LIQUIDADA', 'PAGA', 'ANULADA', 'PARCIALMENTE_PAGA']).nullish().transform(v => v ?? undefined),
    ano: z.coerce.number().int().min(2000).max(2100).optional(),
    mes: z.coerce.number().int().min(1).max(12).optional(),
    credor: z.string().nullish().transform(v => v ?? undefined),
    elemento: z.string().nullish().transform(v => v ?? undefined),
    funcao: z.string().nullish().transform(v => v ?? undefined),
    programa: z.string().nullish().transform(v => v ?? undefined),
    licitacaoId: z.string().nullish().transform(v => v ?? undefined),
    contratoId: z.string().nullish().transform(v => v ?? undefined),
    convenioId: z.string().nullish().transform(v => v ?? undefined),
  }).refine(
    data => !data.valorMinimo || !data.valorMaximo || data.valorMinimo <= data.valorMaximo,
    { message: 'valorMinimo deve ser menor ou igual a valorMaximo' }
  )

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)

  const validation = safeParseQueryParams(searchParams, DespesaQuerySchema)
  if (!validation.success) {
    throw new ValidationError('Parâmetros inválidos', validation.error.errors)
  }

  const {
    page, limit, situacao, ano, mes, credor, elemento,
    funcao, programa, licitacaoId, contratoId, convenioId,
    valorMinimo, valorMaximo
  } = validation.data

  const result = await despesasDbService.paginate(
    {
      situacao,
      ano,
      mes,
      credor,
      elemento,
      funcao,
      programa,
      licitacaoId,
      contratoId,
      convenioId,
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

export const POST = withAuth(
  async (request: NextRequest) => {
    const body = await request.json()

    if (!body.numeroEmpenho || !body.credor || !body.valorEmpenhado) {
      log.warn('Despesa bloqueada por validação', {
        action: 'despesa_validation_failed',
        motivo: 'campos_obrigatorios_ausentes'
      })
      throw new ValidationError('Campos obrigatorios nao fornecidos (numeroEmpenho, credor, valorEmpenhado)')
    }

    const dataDespesa = body.data ? new Date(body.data) : new Date()

    const novaDespesa = await despesasDbService.create({
      numeroEmpenho: body.numeroEmpenho,
      ano: body.ano || dataDespesa.getFullYear(),
      mes: body.mes || dataDespesa.getMonth() + 1,
      data: dataDespesa,
      credor: body.credor,
      cnpjCpf: body.cnpjCpf,
      unidade: body.unidade,
      elemento: body.elemento,
      funcao: body.funcao,
      subfuncao: body.subfuncao,
      programa: body.programa,
      acao: body.acao,
      valorEmpenhado: parseFloat(body.valorEmpenhado),
      valorLiquidado: body.valorLiquidado ? parseFloat(body.valorLiquidado) : null,
      valorPago: body.valorPago ? parseFloat(body.valorPago) : null,
      situacao: body.situacao,
      fonteRecurso: body.fonteRecurso,
      modalidade: body.modalidade,
      licitacaoId: body.licitacaoId,
      contratoId: body.contratoId,
      convenioId: body.convenioId,
      observacoes: body.observacoes
    })

    log.info('Despesa criada', {
      action: 'despesa_create',
      id: novaDespesa.id,
      numeroEmpenho: novaDespesa.numeroEmpenho,
      ano: novaDespesa.ano,
      mes: novaDespesa.mes,
      situacao: novaDespesa.situacao
    })

    return createSuccessResponse(novaDespesa, 'Despesa criada com sucesso', undefined, 201)
  },
  { permissions: 'financeiro.manage' }
)
