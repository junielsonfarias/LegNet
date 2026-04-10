import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createSuccessResponse, ValidationError, withErrorHandler } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { contratosDbService } from '@/lib/services/contratos-db-service'
import { safeParseQueryParams } from '@/lib/validation/query-schemas'

export const dynamic = 'force-dynamic'

// Schema de validação para query params de contratos
// Enums devem corresponder ao schema Prisma
const ContratoQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  modalidade: z.enum(['CONTRATO_ORIGINAL', 'ADITIVO', 'APOSTILAMENTO', 'RESCISAO']).nullish().transform(v => v ?? undefined),
  situacao: z.enum(['VIGENTE', 'ENCERRADO', 'RESCINDIDO', 'SUSPENSO']).nullish().transform(v => v ?? undefined),
  ano: z.coerce.number().int().min(2000).max(2100).optional(),
  contratado: z.string().nullish().transform(v => v ?? undefined),
  objeto: z.string().nullish().transform(v => v ?? undefined),
  licitacaoId: z.string().nullish().transform(v => v ?? undefined),
  dataInicio: z.string().nullish().transform(v => v ?? undefined),
  dataFim: z.string().nullish().transform(v => v ?? undefined),
  valorMinimo: z.coerce.number().min(0).optional(),
  valorMaximo: z.coerce.number().min(0).optional()
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

  return createSuccessResponse(novoContrato, 'Contrato criado com sucesso', undefined, 201)
}, { permissions: 'financeiro.manage' })
