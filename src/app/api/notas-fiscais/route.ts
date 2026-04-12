import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
import { withErrorHandler, createSuccessResponse } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

const SITUACOES = ['EMITIDA', 'LIQUIDADA', 'PAGA', 'CANCELADA'] as const

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  ano: z.coerce.number().int().optional(),
  mes: z.coerce.number().int().min(1).max(12).optional(),
  situacao: z.enum(SITUACOES).optional(),
  fornecedor: z.string().optional()
})

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const params = QuerySchema.parse(Object.fromEntries(searchParams))

  const where: Record<string, unknown> = {}
  if (params.ano) where.ano = params.ano
  if (params.mes) where.mes = params.mes
  if (params.situacao) where.situacao = params.situacao
  if (params.fornecedor) where.fornecedor = { contains: params.fornecedor, mode: 'insensitive' }

  const [data, total] = await Promise.all([
    prisma.notaFiscal.findMany({
      where,
      orderBy: [{ ano: 'desc' }, { mes: 'desc' }, { dataEmissao: 'desc' }],
      skip: (params.page - 1) * params.limit,
      take: params.limit
    }),
    prisma.notaFiscal.count({ where })
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
  serie: z.string().optional(),
  chaveAcesso: z.string().optional(),
  fornecedor: z.string().min(1),
  cnpjCpf: z.string().min(1),
  dataEmissao: z.string(),
  dataLiquidacao: z.string().optional(),
  dataPagamento: z.string().optional(),
  valor: z.number(),
  situacao: z.enum(SITUACOES).default('EMITIDA'),
  ano: z.number().int(),
  mes: z.number().int().min(1).max(12),
  despesaId: z.string().optional(),
  arquivo: z.string().optional(),
  observacoes: z.string().optional()
})

export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json()
  const data = CreateSchema.parse(body)
  const created = await prisma.notaFiscal.create({
    data: {
      ...data,
      dataEmissao: new Date(data.dataEmissao),
      dataLiquidacao: data.dataLiquidacao ? new Date(data.dataLiquidacao) : null,
      dataPagamento: data.dataPagamento ? new Date(data.dataPagamento) : null
    }
  })
  return createSuccessResponse(created, 'Nota fiscal criada', undefined, 201)
}, { permissions: 'transparencia.manage' })
