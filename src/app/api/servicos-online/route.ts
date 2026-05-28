import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
import { withErrorHandler, createSuccessResponse } from '@/lib/error-handler'
import { PaginationSchema } from '@/lib/validation/query-schemas'

export const dynamic = 'force-dynamic'

const QuerySchema = PaginationSchema.extend({
  limit: z.coerce.number().int().min(1).max(200).default(100),
  categoria: z.string().optional(),
  ativo: z.coerce.boolean().optional()
})

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const params = QuerySchema.parse(Object.fromEntries(searchParams))

  const where: Record<string, unknown> = {}
  if (params.categoria) where.categoria = params.categoria
  if (params.ativo !== undefined) where.ativo = params.ativo

  const [data, total] = await Promise.all([
    prisma.servicoOnline.findMany({
      where,
      orderBy: [{ ordem: 'asc' }, { nome: 'asc' }],
      skip: (params.page - 1) * params.limit,
      take: params.limit
    }),
    prisma.servicoOnline.count({ where })
  ])

  return createSuccessResponse(data, undefined, undefined, 200, {
    total,
    page: params.page,
    limit: params.limit,
    totalPages: Math.ceil(total / params.limit)
  })
})

const CreateSchema = z.object({
  nome: z.string().min(1),
  descricao: z.string().optional(),
  url: z.string().url(),
  categoria: z.string().optional(),
  icone: z.string().optional(),
  publicoAlvo: z.string().optional(),
  requisitos: z.string().optional(),
  ordem: z.number().int().default(0),
  ativo: z.boolean().default(true)
})

export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json()
  const data = CreateSchema.parse(body)
  const created = await prisma.servicoOnline.create({ data })
  return createSuccessResponse(created, 'Servico criado', undefined, 201)
}, { permissions: 'transparencia.manage' })
