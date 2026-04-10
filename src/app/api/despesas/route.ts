import { NextRequest } from 'next/server'
import { z } from 'zod'
import { despesasDbService } from '@/lib/services/despesas-db-service'
import { withAuth } from '@/lib/auth/permissions'
import { withErrorHandler, createSuccessResponse, ValidationError } from '@/lib/error-handler'
import { safeParseQueryParams } from '@/lib/validation/query-schemas'

export const dynamic = 'force-dynamic'

// Schema de validação para query params de despesas
// Enums devem corresponder ao schema Prisma
const DespesaQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
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
  valorMinimo: z.coerce.number().min(0).optional(),
  valorMaximo: z.coerce.number().min(0).optional()
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

    return createSuccessResponse(novaDespesa, 'Despesa criada com sucesso', undefined, 201)
  },
  { permissions: 'financeiro.manage' }
)
