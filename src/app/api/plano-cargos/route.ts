import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
import { withErrorHandler, createSuccessResponse } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(100),
  ano: z.coerce.number().int().optional(),
  ativo: z.enum(['true', 'false']).optional()
})

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const params = QuerySchema.parse(Object.fromEntries(searchParams))

  const where: Record<string, unknown> = {}
  if (params.ano) where.ano = params.ano
  if (params.ativo) where.ativo = params.ativo === 'true'

  const [data, total] = await Promise.all([
    prisma.planoCargos.findMany({
      where,
      orderBy: [{ ano: 'desc' }, { nome: 'asc' }],
      skip: (params.page - 1) * params.limit,
      take: params.limit,
      include: { _count: { select: { cargos: true } } }
    }),
    prisma.planoCargos.count({ where })
  ])

  return createSuccessResponse(data, undefined, undefined, 200, {
    total,
    page: params.page,
    limit: params.limit,
    totalPages: Math.ceil(total / params.limit)
  })
})

const CreateSchema = z.object({
  nome: z.string().min(1, 'Nome e obrigatorio'),
  lei: z.string().nullable().optional(),
  ano: z.number().int().min(1900).max(3000),
  descricao: z.string().nullable().optional(),
  ativo: z.boolean().default(true)
})

export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json()
  const data = CreateSchema.parse(body)

  const created = await prisma.planoCargos.create({
    data: {
      nome: data.nome,
      lei: data.lei ?? null,
      ano: data.ano,
      descricao: data.descricao ?? null,
      ativo: data.ativo
    }
  })

  return createSuccessResponse(created, 'Plano de cargos criado', undefined, 201)
}, { permissions: 'transparencia.manage' })
