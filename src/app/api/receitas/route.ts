import { NextRequest } from 'next/server'
import { z } from 'zod'
import { receitasDbService } from '@/lib/services/receitas-db-service'
import { withAuth } from '@/lib/auth/permissions'
import { withErrorHandler, createSuccessResponse, ValidationError } from '@/lib/error-handler'
import { safeParseQueryParams } from '@/lib/validation/query-schemas'

export const dynamic = 'force-dynamic'

// Schema de validação para query params de receitas
// Enums devem corresponder ao schema Prisma
const ReceitaQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  categoria: z.enum(['RECEITA_CORRENTE', 'RECEITA_CAPITAL', 'RECEITA_INTRAORCAMENTARIA']).nullish().transform(v => v ?? undefined),
  origem: z.enum(['TRIBUTARIA', 'CONTRIBUICOES', 'PATRIMONIAL', 'SERVICOS', 'TRANSFERENCIAS', 'OUTRAS']).nullish().transform(v => v ?? undefined),
  situacao: z.enum(['PREVISTA', 'ARRECADADA', 'PARCIALMENTE_ARRECADADA', 'CANCELADA']).nullish().transform(v => v ?? undefined),
  ano: z.coerce.number().int().min(2000).max(2100).optional(),
  mes: z.coerce.number().int().min(1).max(12).optional(),
  contribuinte: z.string().nullish().transform(v => v ?? undefined),
  valorMinimo: z.coerce.number().min(0).optional(),
  valorMaximo: z.coerce.number().min(0).optional()
}).refine(
  data => !data.valorMinimo || !data.valorMaximo || data.valorMinimo <= data.valorMaximo,
  { message: 'valorMinimo deve ser menor ou igual a valorMaximo' }
)

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)

  const validation = safeParseQueryParams(searchParams, ReceitaQuerySchema)
  if (!validation.success) {
    throw new ValidationError('Parâmetros inválidos', validation.error.errors)
  }

  const {
    page, limit, categoria, origem, situacao,
    ano, mes, contribuinte, valorMinimo, valorMaximo
  } = validation.data

  const result = await receitasDbService.paginate(
    {
      categoria,
      origem,
      situacao,
      ano,
      mes,
      contribuinte,
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

  if (!body.categoria || !body.origem || !body.valorArrecadado) {
    throw new ValidationError('Campos obrigatorios nao fornecidos (categoria, origem, valorArrecadado)')
  }

  const dataReceita = body.data ? new Date(body.data) : new Date()

  const novaReceita = await receitasDbService.create({
    numero: body.numero,
    ano: body.ano || dataReceita.getFullYear(),
    mes: body.mes || dataReceita.getMonth() + 1,
    data: dataReceita,
    contribuinte: body.contribuinte,
    cnpjCpf: body.cnpjCpf,
    unidade: body.unidade,
    categoria: body.categoria,
    origem: body.origem,
    especie: body.especie,
    rubrica: body.rubrica,
    valorPrevisto: body.valorPrevisto ? parseFloat(body.valorPrevisto) : null,
    valorArrecadado: parseFloat(body.valorArrecadado),
    situacao: body.situacao,
    fonteRecurso: body.fonteRecurso,
    observacoes: body.observacoes
  })

  return createSuccessResponse(novaReceita, 'Receita criada com sucesso', undefined, 201)
}, { permissions: 'financeiro.manage' })
