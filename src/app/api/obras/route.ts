import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
import { withErrorHandler, createSuccessResponse } from '@/lib/error-handler'
import { createLogger } from '@/lib/logging/logger'
import { PaginationSchema } from '@/lib/validation/query-schemas'

const log = createLogger('api/transparencia/obras')

export const dynamic = 'force-dynamic'

const SITUACOES = ['PLANEJADA', 'EM_ANDAMENTO', 'PARALISADA', 'CONCLUIDA', 'CANCELADA'] as const

const QuerySchema = PaginationSchema.extend({
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
      { descricao: { contains: params.busca, mode: 'insensitive' } },
      { endereco: { contains: params.busca, mode: 'insensitive' } },
      { bairro: { contains: params.busca, mode: 'insensitive' } }
    ]
  }

  const [data, total] = await Promise.all([
    prisma.obra.findMany({
      where,
      orderBy: [{ dataInicio: 'desc' }],
      skip: (params.page - 1) * params.limit,
      take: params.limit
    }),
    prisma.obra.count({ where })
  ])

  return createSuccessResponse(data, undefined, undefined, 200, {
    total,
    page: params.page,
    limit: params.limit,
    totalPages: Math.ceil(total / params.limit)
  })
})

const CreateSchema = z.object({
  descricao: z.string().min(1),
  endereco: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  valorEstimado: z.number().optional(),
  valorContratado: z.number().optional(),
  valorExecutado: z.number().optional(),
  // Fase M (PNTP 10.3) — execução física e pagamento
  valorPago: z.number().optional(),
  quantidadeContratada: z.number().optional(),
  quantidadeExecutada: z.number().optional(),
  unidadeMedida: z.string().optional(),
  dataUltimaMedicao: z.string().optional(),
  dataInicio: z.string().optional(),
  dataPrevistaFim: z.string().optional(),
  dataConclusao: z.string().optional(),
  percentualExecucao: z.number().int().min(0).max(100).optional(),
  situacao: z.enum(SITUACOES).default('PLANEJADA'),
  motivoParalisacao: z.string().optional(),
  contratoId: z.string().optional(),
  arquivo: z.string().optional(),
  observacoes: z.string().optional()
})

export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json()
  const data = CreateSchema.parse(body)
  const created = await prisma.obra.create({
    data: {
      ...data,
      dataInicio: data.dataInicio ? new Date(data.dataInicio) : null,
      dataPrevistaFim: data.dataPrevistaFim ? new Date(data.dataPrevistaFim) : null,
      dataConclusao: data.dataConclusao ? new Date(data.dataConclusao) : null,
      dataUltimaMedicao: data.dataUltimaMedicao ? new Date(data.dataUltimaMedicao) : null
    }
  })
  log.info('Obra criada', {
    action: 'obra_create',
    id: created.id,
    situacao: created.situacao,
    percentualExecucao: created.percentualExecucao
  })

  return createSuccessResponse(created, 'Obra criada', undefined, 201)
}, { permissions: 'transparencia.manage' })
