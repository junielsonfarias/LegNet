import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
import { createSuccessResponse } from '@/lib/error-handler'
import { PaginationSchema } from '@/lib/validation/query-schemas'

export const dynamic = 'force-dynamic'

const GRAUS = ['RESERVADA', 'SECRETA', 'ULTRASSECRETA'] as const
const SITUACOES = ['CLASSIFICADA', 'DESCLASSIFICADA'] as const

// BL-3: usa PaginationSchema central
const QuerySchema = PaginationSchema.extend({
  limit: z.coerce.number().int().min(1).max(500).default(500),
  grau: z.enum(GRAUS).optional(),
  situacao: z.enum(SITUACOES).optional()
})

// GET protegido (transparencia.manage): usado pelo painel admin. O rol
// publico (LAI Art. 30) e servido pela pagina SSR
// /transparencia/informacoes-classificadas, que consulta o Prisma direto.
export const GET = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const params = QuerySchema.parse(Object.fromEntries(searchParams))

  const where: Record<string, unknown> = {}
  if (params.grau) where.grau = params.grau
  if (params.situacao) where.situacao = params.situacao

  const [data, total] = await Promise.all([
    prisma.documentoClassificado.findMany({
      where,
      orderBy: [{ dataClassificacao: 'desc' }],
      skip: (params.page - 1) * params.limit,
      take: params.limit
    }),
    prisma.documentoClassificado.count({ where })
  ])

  return createSuccessResponse(data, undefined, undefined, 200, {
    total,
    page: params.page,
    limit: params.limit,
    totalPages: Math.ceil(total / params.limit)
  })
}, { permissions: 'transparencia.manage' })

/** Calcula a data de desclassificacao a partir da classificacao + prazo. */
function calcularDesclassificacao(dataClassificacao: Date, prazoAnos: number): Date {
  const d = new Date(dataClassificacao)
  d.setFullYear(d.getFullYear() + prazoAnos)
  return d
}

const CreateSchema = z.object({
  titulo: z.string().min(1, 'Titulo e obrigatorio'),
  categoria: z.string().nullable().optional(),
  grau: z.enum(GRAUS).default('RESERVADA'),
  fundamentoLegal: z.string().nullable().optional(),
  dataClassificacao: z.string().min(1, 'Data de classificacao e obrigatoria'),
  prazoAnos: z.number().int().min(1).max(100),
  dataDesclassificacao: z.string().nullable().optional(),
  situacao: z.enum(SITUACOES).default('CLASSIFICADA'),
  autoridade: z.string().nullable().optional(),
  observacoes: z.string().nullable().optional()
})

export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json()
  const data = CreateSchema.parse(body)

  const dataClassificacao = new Date(data.dataClassificacao)
  const dataDesclassificacao = data.dataDesclassificacao
    ? new Date(data.dataDesclassificacao)
    : calcularDesclassificacao(dataClassificacao, data.prazoAnos)

  const created = await prisma.documentoClassificado.create({
    data: {
      titulo: data.titulo,
      categoria: data.categoria ?? null,
      grau: data.grau,
      fundamentoLegal: data.fundamentoLegal ?? null,
      dataClassificacao,
      prazoAnos: data.prazoAnos,
      dataDesclassificacao,
      situacao: data.situacao,
      autoridade: data.autoridade ?? null,
      observacoes: data.observacoes ?? null
    }
  })

  return createSuccessResponse(created, 'Documento classificado registrado', undefined, 201)
}, { permissions: 'transparencia.manage' })
