import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
import { withErrorHandler, createSuccessResponse } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

const GRAUS = ['RESERVADA', 'SECRETA', 'ULTRASSECRETA'] as const
const SITUACOES = ['CLASSIFICADA', 'DESCLASSIFICADA'] as const

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(500),
  grau: z.enum(GRAUS).optional(),
  situacao: z.enum(SITUACOES).optional()
})

// GET publico: o rol de informacoes classificadas e de publicacao
// obrigatoria (LAI Art. 30). Expoe apenas metadados — nunca o conteudo
// sigiloso (o campo `titulo` descreve o assunto de forma generica).
export const GET = withErrorHandler(async (request: NextRequest) => {
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
})

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
