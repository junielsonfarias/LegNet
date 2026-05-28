import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
import { withErrorHandler, createSuccessResponse } from '@/lib/error-handler'
import { PaginationSchema } from '@/lib/validation/query-schemas'

export const dynamic = 'force-dynamic'

const ABRANGENCIAS = ['MUNICIPAL', 'ESTADUAL', 'NACIONAL', 'INTERNACIONAL'] as const

const QuerySchema = PaginationSchema.extend({
  limit: z.coerce.number().int().min(1).max(500).default(500),
  ano: z.coerce.number().int().optional(),
  abrangencia: z.enum(ABRANGENCIAS).optional()
})

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const params = QuerySchema.parse(Object.fromEntries(searchParams))

  const where: Record<string, unknown> = {}
  if (params.ano) where.ano = params.ano
  if (params.abrangencia) where.abrangencia = params.abrangencia

  const [data, total] = await Promise.all([
    prisma.valorDiariaTabela.findMany({
      where,
      orderBy: [{ ano: 'desc' }, { categoria: 'asc' }],
      skip: (params.page - 1) * params.limit,
      take: params.limit
    }),
    prisma.valorDiariaTabela.count({ where })
  ])

  return createSuccessResponse(data, undefined, undefined, 200, {
    total,
    page: params.page,
    limit: params.limit,
    totalPages: Math.ceil(total / params.limit)
  })
})

const CreateSchema = z.object({
  categoria: z.string().min(1, 'Categoria e obrigatoria'),
  abrangencia: z.enum(ABRANGENCIAS).default('ESTADUAL'),
  descricao: z.string().nullable().optional(),
  valor: z.number().min(0),
  ano: z.number().int().min(1900).max(3000),
  ativo: z.boolean().default(true),
  observacoes: z.string().nullable().optional()
})

export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json()
  const data = CreateSchema.parse(body)

  const created = await prisma.valorDiariaTabela.create({
    data: {
      categoria: data.categoria,
      abrangencia: data.abrangencia,
      descricao: data.descricao ?? null,
      valor: data.valor,
      ano: data.ano,
      ativo: data.ativo,
      observacoes: data.observacoes ?? null
    }
  })

  return createSuccessResponse(created, 'Valor de diaria criado', undefined, 201)
}, { permissions: 'transparencia.manage' })
