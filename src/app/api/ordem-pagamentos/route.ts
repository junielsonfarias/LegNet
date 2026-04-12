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
  credor: z.string().optional()
})

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const params = QuerySchema.parse(Object.fromEntries(searchParams))

  const where: Record<string, unknown> = {}
  if (params.ano) where.ano = params.ano
  if (params.mes) where.mes = params.mes
  if (params.credor) where.credor = { contains: params.credor, mode: 'insensitive' }

  const [data, total] = await Promise.all([
    prisma.ordemPagamento.findMany({
      where,
      orderBy: [{ ano: 'desc' }, { mes: 'desc' }, { ordemCronologica: 'asc' }],
      skip: (params.page - 1) * params.limit,
      take: params.limit
    }),
    prisma.ordemPagamento.count({ where })
  ])

  return createSuccessResponse(data, undefined, undefined, 200, {
    total,
    page: params.page,
    limit: params.limit,
    totalPages: Math.ceil(total / params.limit)
  })
})

const CreateSchema = z.object({
  numero: z.string().min(1),
  ano: z.number().int(),
  mes: z.number().int().min(1).max(12),
  data: z.string(),
  credor: z.string().min(1),
  cnpjCpf: z.string(),
  valor: z.number(),
  dataVencimento: z.string().optional(),
  dataPagamento: z.string().optional(),
  ordemCronologica: z.number().int().optional(),
  fonteRecurso: z.string().optional(),
  despesaId: z.string().optional(),
  observacoes: z.string().optional()
})

export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json()
  const data = CreateSchema.parse(body)
  const created = await prisma.ordemPagamento.create({
    data: {
      ...data,
      data: new Date(data.data),
      dataVencimento: data.dataVencimento ? new Date(data.dataVencimento) : null,
      dataPagamento: data.dataPagamento ? new Date(data.dataPagamento) : null
    }
  })
  return createSuccessResponse(created, 'Ordem de pagamento criada', undefined, 201)
}, { permissions: 'transparencia.manage' })
