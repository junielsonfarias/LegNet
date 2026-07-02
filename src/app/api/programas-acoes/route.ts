import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
import { withErrorHandler, createSuccessResponse } from '@/lib/error-handler'
import { PaginationSchema } from '@/lib/validation/query-schemas'

export const dynamic = 'force-dynamic'

const TIPOS = ['PROGRAMA', 'ACAO'] as const

const QuerySchema = PaginationSchema.extend({
  limit: z.coerce.number().int().min(1).max(500).default(50),
  ano: z.coerce.number().int().optional(),
  tipo: z.enum(TIPOS).optional(),
  ativo: z.coerce.boolean().optional()
})

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const params = QuerySchema.parse(Object.fromEntries(searchParams))

  const where: Record<string, unknown> = {}
  if (params.ano) where.ano = params.ano
  if (params.tipo) where.tipo = params.tipo
  if (params.ativo !== undefined) where.ativo = params.ativo

  const [data, total] = await Promise.all([
    prisma.programaAcao.findMany({
      where,
      orderBy: [{ ano: 'desc' }, { codigo: 'asc' }],
      skip: (params.page - 1) * params.limit,
      take: params.limit
    }),
    prisma.programaAcao.count({ where })
  ])

  return createSuccessResponse(data, undefined, undefined, 200, {
    total,
    page: params.page,
    limit: params.limit,
    totalPages: Math.ceil(total / params.limit)
  })
})

const CreateSchema = z.object({
  codigo: z.string().min(1),
  nome: z.string().min(1),
  descricao: z.string().optional(),
  tipo: z.enum(TIPOS).default('PROGRAMA'),
  ano: z.number().int(),
  valorPrevisto: z.number().optional(),
  valorExecutado: z.number().optional(),
  unidadeResponsavel: z.string().optional(),
  metaFisica: z.string().optional(),
  ativo: z.boolean().default(true)
})

export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json()
  const data = CreateSchema.parse(body)
  const created = await prisma.programaAcao.create({ data })
  return createSuccessResponse(created, 'Programa/Acao criado', undefined, 201)
}, { permissions: 'transparencia.manage' })
