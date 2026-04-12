import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
import { withErrorHandler, createSuccessResponse } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

const SITUACOES = ['ATIVO', 'INATIVO', 'ALIENADO', 'EM_MANUTENCAO', 'SINISTRADO'] as const

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  situacao: z.enum(SITUACOES).optional(),
  busca: z.string().optional()
})

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const params = QuerySchema.parse(Object.fromEntries(searchParams))

  const where: Record<string, unknown> = {}
  if (params.situacao) where.situacao = params.situacao
  if (params.busca) {
    where.OR = [
      { placa: { contains: params.busca, mode: 'insensitive' } },
      { modelo: { contains: params.busca, mode: 'insensitive' } },
      { marca: { contains: params.busca, mode: 'insensitive' } }
    ]
  }

  const [data, total] = await Promise.all([
    prisma.veiculo.findMany({
      where,
      orderBy: [{ marca: 'asc' }, { modelo: 'asc' }],
      skip: (params.page - 1) * params.limit,
      take: params.limit
    }),
    prisma.veiculo.count({ where })
  ])

  return createSuccessResponse(data, undefined, undefined, 200, {
    total,
    page: params.page,
    limit: params.limit,
    totalPages: Math.ceil(total / params.limit)
  })
})

const CreateSchema = z.object({
  placa: z.string().min(1),
  marca: z.string().min(1),
  modelo: z.string().min(1),
  anoFabricacao: z.number().int(),
  anoModelo: z.number().int(),
  chassi: z.string().optional(),
  renavam: z.string().optional(),
  cor: z.string().optional(),
  combustivel: z.string().optional(),
  dataAquisicao: z.string(),
  valorAquisicao: z.number(),
  valorAtual: z.number().optional(),
  responsavel: z.string().optional(),
  lotacao: z.string().optional(),
  situacao: z.enum(SITUACOES).default('ATIVO'),
  observacoes: z.string().optional()
})

export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json()
  const data = CreateSchema.parse(body)
  const created = await prisma.veiculo.create({
    data: {
      ...data,
      dataAquisicao: new Date(data.dataAquisicao)
    }
  })
  return createSuccessResponse(created, 'Veiculo criado', undefined, 201)
}, { permissions: 'transparencia.manage' })
