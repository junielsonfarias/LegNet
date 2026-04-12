import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
import { withErrorHandler, createSuccessResponse } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  ano: z.coerce.number().int().optional(),
  mes: z.coerce.number().int().min(1).max(12).optional(),
  portador: z.string().optional()
})

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const params = QuerySchema.parse(Object.fromEntries(searchParams))

  const where: Record<string, unknown> = {}
  if (params.ano) where.ano = params.ano
  if (params.mes) where.mes = params.mes
  if (params.portador) where.portador = { contains: params.portador, mode: 'insensitive' }

  const [data, total] = await Promise.all([
    prisma.cartaoCorporativo.findMany({
      where,
      orderBy: [{ ano: 'desc' }, { mes: 'desc' }, { dataCompra: 'desc' }],
      skip: (params.page - 1) * params.limit,
      take: params.limit
    }),
    prisma.cartaoCorporativo.count({ where })
  ])

  return createSuccessResponse(data, undefined, undefined, 200, {
    total,
    page: params.page,
    limit: params.limit,
    totalPages: Math.ceil(total / params.limit)
  })
})

const CreateSchema = z.object({
  portador: z.string().min(1),
  cnpjCpfPortador: z.string().optional(),
  estabelecimento: z.string().min(1),
  cnpjEstabelecimento: z.string().optional(),
  dataCompra: z.string(),
  valor: z.number(),
  descricao: z.string().min(1),
  numeroFatura: z.string().optional(),
  numeroParcela: z.number().int().optional(),
  ano: z.number().int(),
  mes: z.number().int().min(1).max(12),
  observacoes: z.string().optional(),
  arquivo: z.string().optional()
})

export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json()
  const data = CreateSchema.parse(body)
  const created = await prisma.cartaoCorporativo.create({
    data: { ...data, dataCompra: new Date(data.dataCompra) }
  })
  return createSuccessResponse(created, 'Lancamento criado', undefined, 201)
}, { permissions: 'transparencia.manage' })
