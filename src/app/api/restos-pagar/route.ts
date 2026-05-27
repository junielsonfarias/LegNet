import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
import { createSuccessResponse } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

const TIPOS = ['PROCESSADO', 'NAO_PROCESSADO'] as const

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(500),
  ano: z.coerce.number().int().optional(),
  tipo: z.enum(TIPOS).optional()
})

// GET protegido: a pagina publica /transparencia/restos-pagar e SSR e
// consulta o Prisma diretamente (com CPF mascarado). Esta rota serve o admin.
export const GET = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const params = QuerySchema.parse(Object.fromEntries(searchParams))

  const where: Record<string, unknown> = {}
  if (params.ano) where.ano = params.ano
  if (params.tipo) where.tipo = params.tipo

  const [data, total] = await Promise.all([
    prisma.restoPagar.findMany({
      where,
      orderBy: [{ ano: 'desc' }, { credor: 'asc' }],
      skip: (params.page - 1) * params.limit,
      take: params.limit
    }),
    prisma.restoPagar.count({ where })
  ])

  return createSuccessResponse(data, undefined, undefined, 200, {
    total,
    page: params.page,
    limit: params.limit,
    totalPages: Math.ceil(total / params.limit)
  })
}, { permissions: 'transparencia.manage' })

const CreateSchema = z.object({
  ano: z.number().int().min(1900).max(3000),
  credor: z.string().min(1, 'Credor e obrigatorio'),
  cnpjCpf: z.string().nullable().optional(),
  numeroEmpenho: z.string().nullable().optional(),
  descricao: z.string().nullable().optional(),
  tipo: z.enum(TIPOS).default('PROCESSADO'),
  valorInscrito: z.number().min(0),
  valorPago: z.number().min(0).default(0),
  valorCancelado: z.number().min(0).default(0),
  observacoes: z.string().nullable().optional()
})

export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json()
  const data = CreateSchema.parse(body)

  const created = await prisma.restoPagar.create({
    data: {
      ano: data.ano,
      credor: data.credor,
      cnpjCpf: data.cnpjCpf ?? null,
      numeroEmpenho: data.numeroEmpenho ?? null,
      descricao: data.descricao ?? null,
      tipo: data.tipo,
      valorInscrito: data.valorInscrito,
      valorPago: data.valorPago,
      valorCancelado: data.valorCancelado,
      observacoes: data.observacoes ?? null
    }
  })

  return createSuccessResponse(created, 'Resto a pagar registrado', undefined, 201)
}, { permissions: 'transparencia.manage' })
