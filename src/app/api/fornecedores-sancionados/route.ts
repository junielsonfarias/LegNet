import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
import { withErrorHandler, createSuccessResponse } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

const TIPOS = ['ADVERTENCIA', 'MULTA', 'SUSPENSAO_TEMPORARIA', 'IMPEDIMENTO', 'DECLARACAO_INIDONEIDADE'] as const

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  tipoSancao: z.enum(TIPOS).optional(),
  ativo: z.coerce.boolean().optional(),
  busca: z.string().optional()
})

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const params = QuerySchema.parse(Object.fromEntries(searchParams))

  const where: Record<string, unknown> = {}
  if (params.tipoSancao) where.tipoSancao = params.tipoSancao
  if (params.ativo !== undefined) where.ativo = params.ativo
  if (params.busca) {
    where.OR = [
      { nome: { contains: params.busca, mode: 'insensitive' } },
      { cnpjCpf: { contains: params.busca } }
    ]
  }

  const [data, total] = await Promise.all([
    prisma.fornecedorSancionado.findMany({
      where,
      orderBy: [{ dataInicio: 'desc' }],
      skip: (params.page - 1) * params.limit,
      take: params.limit
    }),
    prisma.fornecedorSancionado.count({ where })
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
  cnpjCpf: z.string().min(1),
  tipoSancao: z.enum(TIPOS),
  motivo: z.string().min(1),
  numeroProcesso: z.string().optional(),
  orgaoSancionador: z.string().min(1),
  dataInicio: z.string(),
  dataFim: z.string().optional(),
  ativo: z.boolean().default(true),
  fundamentoLegal: z.string().optional(),
  observacoes: z.string().optional(),
  arquivo: z.string().optional()
})

export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json()
  const data = CreateSchema.parse(body)
  const created = await prisma.fornecedorSancionado.create({
    data: {
      ...data,
      dataInicio: new Date(data.dataInicio),
      dataFim: data.dataFim ? new Date(data.dataFim) : null
    }
  })
  return createSuccessResponse(created, 'Sancao criada', undefined, 201)
}, { permissions: 'transparencia.manage' })
