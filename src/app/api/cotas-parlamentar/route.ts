import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
import { withErrorHandler, createSuccessResponse } from '@/lib/error-handler'
import { PaginationSchema } from '@/lib/validation/query-schemas'

export const dynamic = 'force-dynamic'

const TIPOS = ['DECLARACAO', 'GASTO'] as const

const DocumentoSchema = z.object({
  nome: z.string().min(1),
  url: z.string().url()
})

// P2-C: usa PaginationSchema central com override de limit max (cotas tem volume baixo)
const QuerySchema = PaginationSchema.extend({
  limit: z.coerce.number().int().min(1).max(500).default(50),
  ano: z.coerce.number().int().optional(),
  anoInicio: z.coerce.number().int().optional(),
  anoFim: z.coerce.number().int().optional(),
  mes: z.coerce.number().int().min(1).max(12).optional(),
  mesInicio: z.coerce.number().int().min(1).max(12).optional(),
  mesFim: z.coerce.number().int().min(1).max(12).optional(),
  parlamentarId: z.string().optional(),
  parlamentar: z.string().optional(),
  tipo: z.enum(TIPOS).optional()
})

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const params = QuerySchema.parse(Object.fromEntries(searchParams))

  const where: Record<string, unknown> = {}

  if (params.ano) where.ano = params.ano
  else if (params.anoInicio || params.anoFim) {
    where.ano = {
      ...(params.anoInicio ? { gte: params.anoInicio } : {}),
      ...(params.anoFim ? { lte: params.anoFim } : {})
    }
  }

  if (params.mes) where.mes = params.mes
  else if (params.mesInicio || params.mesFim) {
    where.mes = {
      ...(params.mesInicio ? { gte: params.mesInicio } : {}),
      ...(params.mesFim ? { lte: params.mesFim } : {})
    }
  }

  if (params.parlamentarId) where.parlamentarId = params.parlamentarId
  if (params.parlamentar) {
    where.nomeParlamentar = { contains: params.parlamentar, mode: 'insensitive' }
  }
  if (params.tipo) where.tipo = params.tipo

  const [data, total] = await Promise.all([
    prisma.cotaParlamentar.findMany({
      where,
      orderBy: [{ ano: 'desc' }, { mes: 'desc' }, { createdAt: 'desc' }],
      skip: (params.page - 1) * params.limit,
      take: params.limit
    }),
    prisma.cotaParlamentar.count({ where })
  ])

  return createSuccessResponse(data, undefined, undefined, 200, {
    total,
    page: params.page,
    limit: params.limit,
    totalPages: Math.ceil(total / params.limit)
  })
})

const CreateSchema = z.object({
  mes: z.number().int().min(1).max(12).nullable().optional(),
  ano: z.number().int().min(1900).max(3000),
  parlamentarId: z.string().nullable().optional(),
  nomeParlamentar: z.string().nullable().optional(),
  observacao: z.string().min(1, 'Observacao e obrigatoria'),
  documentos: z.array(DocumentoSchema).nullable().optional(),
  valor: z.number().nullable().optional(),
  tipo: z.enum(TIPOS).default('DECLARACAO')
})

export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json()
  const data = CreateSchema.parse(body)

  const created = await prisma.cotaParlamentar.create({
    data: {
      mes: data.mes ?? null,
      ano: data.ano,
      parlamentarId: data.parlamentarId ?? null,
      nomeParlamentar: data.nomeParlamentar ?? null,
      observacao: data.observacao,
      documentos: data.documentos ?? undefined,
      valor: data.valor ?? null,
      tipo: data.tipo
    }
  })

  return createSuccessResponse(created, 'Cota parlamentar criada', undefined, 201)
}, { permissions: 'transparencia.manage' })
