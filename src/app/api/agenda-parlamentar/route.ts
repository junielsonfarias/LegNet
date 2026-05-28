import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
import { withErrorHandler, createSuccessResponse } from '@/lib/error-handler'
import { PaginationSchema } from '@/lib/validation/query-schemas'

export const dynamic = 'force-dynamic'

const TIPOS = ['COMPROMISSO', 'REUNIAO', 'EVENTO', 'VIAGEM', 'AUDIENCIA'] as const

// BL-3: usa PaginationSchema central (overrride limit max p/ listagens grandes)
const QuerySchema = PaginationSchema.extend({
  limit: z.coerce.number().int().min(1).max(500).default(500),
  parlamentarId: z.string().optional(),
  tipo: z.enum(TIPOS).optional()
})

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const params = QuerySchema.parse(Object.fromEntries(searchParams))

  const where: Record<string, unknown> = {}
  if (params.parlamentarId) where.parlamentarId = params.parlamentarId
  if (params.tipo) where.tipo = params.tipo

  const [data, total] = await Promise.all([
    prisma.agendaParlamentar.findMany({
      where,
      orderBy: { dataInicio: 'desc' },
      skip: (params.page - 1) * params.limit,
      take: params.limit
    }),
    prisma.agendaParlamentar.count({ where })
  ])

  return createSuccessResponse(data, undefined, undefined, 200, {
    total,
    page: params.page,
    limit: params.limit,
    totalPages: Math.ceil(total / params.limit)
  })
})

const CreateSchema = z.object({
  parlamentarId: z.string().nullable().optional(),
  parlamentarNome: z.string().nullable().optional(),
  titulo: z.string().min(1, 'Titulo e obrigatorio'),
  descricao: z.string().nullable().optional(),
  local: z.string().nullable().optional(),
  dataInicio: z.string().min(1, 'Data de inicio e obrigatoria'),
  dataFim: z.string().nullable().optional(),
  tipo: z.enum(TIPOS).default('COMPROMISSO')
})

export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json()
  const data = CreateSchema.parse(body)

  const created = await prisma.agendaParlamentar.create({
    data: {
      parlamentarId: data.parlamentarId ?? null,
      parlamentarNome: data.parlamentarNome ?? null,
      titulo: data.titulo,
      descricao: data.descricao ?? null,
      local: data.local ?? null,
      dataInicio: new Date(data.dataInicio),
      dataFim: data.dataFim ? new Date(data.dataFim) : null,
      tipo: data.tipo
    }
  })

  return createSuccessResponse(created, 'Compromisso registrado', undefined, 201)
}, { permissions: 'transparencia.manage' })
