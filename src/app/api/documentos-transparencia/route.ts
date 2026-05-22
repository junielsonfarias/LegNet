import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
import { withErrorHandler, createSuccessResponse, ValidationError } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

const TIPOS = [
  'BALANCETE_FINANCEIRO',
  'BALANCO_ANUAL',
  'PARECER_TCM',
  'JULGAMENTO_CONTAS_EXECUTIVO',
  'PLANEJAMENTO_ESTRATEGICO',
  'CARTA_SERVICOS',
  'LGPD_GOVERNO_DIGITAL',
  'PLANO_ANUAL_CONTRATACOES',
  'RELATORIO_GESTAO',
  'RGF',
  'LDO',
  'LOA',
  'PPA',
  'PLANO_DADOS_ABERTOS',
  'REGULAMENTO_OUVIDORIA'
] as const

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  tipo: z.enum(TIPOS).optional(),
  ano: z.coerce.number().int().optional(),
  status: z.string().optional()
})

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const params = QuerySchema.parse(Object.fromEntries(searchParams))

  const where: Record<string, unknown> = { status: params.status || 'publicado' }
  if (params.tipo) where.tipo = params.tipo
  if (params.ano) where.ano = params.ano

  const [data, total] = await Promise.all([
    prisma.documentoTransparencia.findMany({
      where,
      orderBy: [{ ano: 'desc' }, { dataPublicacao: 'desc' }],
      skip: (params.page - 1) * params.limit,
      take: params.limit
    }),
    prisma.documentoTransparencia.count({ where })
  ])

  return createSuccessResponse(data, undefined, undefined, 200, {
    total,
    page: params.page,
    limit: params.limit,
    totalPages: Math.ceil(total / params.limit)
  })
})

const CreateSchema = z.object({
  tipo: z.enum(TIPOS),
  titulo: z.string().min(1),
  descricao: z.string().optional(),
  ano: z.number().int(),
  mes: z.number().int().nullish(),
  dataPublicacao: z.string(),
  arquivo: z.string().optional(),
  url: z.string().url().optional().or(z.literal('')),
  responsavel: z.string().optional(),
  observacoes: z.string().optional(),
  status: z.string().default('publicado')
})

export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json()
  const data = CreateSchema.parse(body)
  if (!data.arquivo && !data.url) {
    throw new ValidationError('Informe um arquivo ou URL externa')
  }
  const created = await prisma.documentoTransparencia.create({
    data: {
      ...data,
      mes: data.mes ?? null,
      dataPublicacao: new Date(data.dataPublicacao),
      url: data.url || null
    }
  })
  return createSuccessResponse(created, 'Documento criado', undefined, 201)
}, { permissions: 'transparencia.manage' })
