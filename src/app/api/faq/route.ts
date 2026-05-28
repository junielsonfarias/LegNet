import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
import { createSuccessResponse } from '@/lib/error-handler'
import { PaginationSchema } from '@/lib/validation/query-schemas'

export const dynamic = 'force-dynamic'

// BL-3: usa PaginationSchema central
const QuerySchema = PaginationSchema.extend({
  limit: z.coerce.number().int().min(1).max(500).default(500),
  categoria: z.string().optional(),
  ativo: z.enum(['true', 'false']).optional()
})

// GET protegido (transparencia.manage): usado pelo painel admin. O FAQ
// publico e servido pela pagina SSR /transparencia/faq (so perguntas ativas).
export const GET = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const params = QuerySchema.parse(Object.fromEntries(searchParams))

  const where: Record<string, unknown> = {}
  if (params.categoria) where.categoria = params.categoria
  if (params.ativo) where.ativo = params.ativo === 'true'

  const [data, total] = await Promise.all([
    prisma.perguntaFrequente.findMany({
      where,
      orderBy: [{ ordem: 'asc' }, { createdAt: 'asc' }],
      skip: (params.page - 1) * params.limit,
      take: params.limit
    }),
    prisma.perguntaFrequente.count({ where })
  ])

  return createSuccessResponse(data, undefined, undefined, 200, {
    total,
    page: params.page,
    limit: params.limit,
    totalPages: Math.ceil(total / params.limit)
  })
}, { permissions: 'transparencia.manage' })

const CreateSchema = z.object({
  pergunta: z.string().min(1, 'Pergunta e obrigatoria'),
  resposta: z.string().min(1, 'Resposta e obrigatoria'),
  categoria: z.string().nullable().optional(),
  ordem: z.number().int().default(0),
  ativo: z.boolean().default(true)
})

export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json()
  const data = CreateSchema.parse(body)

  const created = await prisma.perguntaFrequente.create({
    data: {
      pergunta: data.pergunta,
      resposta: data.resposta,
      categoria: data.categoria ?? null,
      ordem: data.ordem,
      ativo: data.ativo
    }
  })

  return createSuccessResponse(created, 'Pergunta criada', undefined, 201)
}, { permissions: 'transparencia.manage' })
