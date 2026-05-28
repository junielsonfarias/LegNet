import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
import { withErrorHandler, createSuccessResponse } from '@/lib/error-handler'
import { createLogger } from '@/lib/logging/logger'
import { PaginationSchema } from '@/lib/validation/query-schemas'

const log = createLogger('api/rh/cargos')

export const dynamic = 'force-dynamic'

const TIPOS = ['EFETIVO', 'COMISSIONADO', 'FUNCAO_GRATIFICADA', 'ELETIVO'] as const

// QW-6: usa PaginationSchema central com override de limit max para listagens grandes
const QuerySchema = PaginationSchema.extend({
  limit: z.coerce.number().int().min(1).max(500).default(500),
  planoCargosId: z.string().optional(),
  tipo: z.enum(TIPOS).optional(),
  denominacao: z.string().optional()
})

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const params = QuerySchema.parse(Object.fromEntries(searchParams))

  const where: Record<string, unknown> = {}
  if (params.planoCargosId) where.planoCargosId = params.planoCargosId
  if (params.tipo) where.tipo = params.tipo
  if (params.denominacao) {
    where.denominacao = { contains: params.denominacao, mode: 'insensitive' }
  }

  const [data, total] = await Promise.all([
    prisma.cargo.findMany({
      where,
      orderBy: { denominacao: 'asc' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
      include: { planoCargos: { select: { id: true, nome: true, ano: true } } }
    }),
    prisma.cargo.count({ where })
  ])

  return createSuccessResponse(data, undefined, undefined, 200, {
    total,
    page: params.page,
    limit: params.limit,
    totalPages: Math.ceil(total / params.limit)
  })
})

const CreateSchema = z.object({
  planoCargosId: z.string().nullable().optional(),
  denominacao: z.string().min(1, 'Denominacao e obrigatoria'),
  tipo: z.enum(TIPOS).default('EFETIVO'),
  quantidadeVagas: z.number().int().min(0).nullable().optional(),
  cargaHoraria: z.number().int().min(0).nullable().optional(),
  salarioBase: z.number().min(0),
  observacoes: z.string().nullable().optional()
})

export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json()
  const data = CreateSchema.parse(body)

  const created = await prisma.cargo.create({
    data: {
      planoCargosId: data.planoCargosId ?? null,
      denominacao: data.denominacao,
      tipo: data.tipo,
      quantidadeVagas: data.quantidadeVagas ?? null,
      cargaHoraria: data.cargaHoraria ?? null,
      salarioBase: data.salarioBase,
      observacoes: data.observacoes ?? null
    }
  })

  log.info('Cargo criado', {
    action: 'cargo_create',
    id: created.id,
    denominacao: created.denominacao,
    tipo: created.tipo
  })

  return createSuccessResponse(created, 'Cargo criado', undefined, 201)
}, { permissions: 'transparencia.manage' })
