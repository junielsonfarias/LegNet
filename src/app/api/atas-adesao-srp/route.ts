import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
import { withErrorHandler, createSuccessResponse } from '@/lib/error-handler'
import { PaginationSchema } from '@/lib/validation/query-schemas'

export const dynamic = 'force-dynamic'

const DocumentoSchema = z.object({
  nome: z.string().min(1),
  url: z.string().url(),
})

// BL-3: usa PaginationSchema central (override limit max 200)
const QuerySchema = PaginationSchema.extend({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  ano: z.coerce.number().int().optional(),
  situacao: z.string().optional(),
  busca: z.string().optional(),
})

const CreateSchema = z.object({
  numero: z.string().min(1).max(50),
  ano: z.number().int(),
  objeto: z.string().min(1),
  orgaoGerenciador: z.string().min(1),
  fornecedor: z.string().min(1),
  cnpjFornecedor: z.string().optional().nullable(),
  valorTotal: z.number().nonnegative(),
  vigenciaInicio: z.string(),
  vigenciaFim: z.string(),
  numeroAtaOriginal: z.string().optional().nullable(),
  orgaoOrigem: z.string().optional().nullable(),
  documentos: z.array(DocumentoSchema).optional(),
  arquivo: z.string().optional().nullable(),
  dataPublicacao: z.string().optional().nullable(),
  situacao: z.string().default('VIGENTE'),
  observacoes: z.string().optional().nullable(),
})

// GET publico — lista paginada
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const params = QuerySchema.parse(Object.fromEntries(searchParams))

  const where: Record<string, unknown> = {}
  if (params.ano) where.ano = params.ano
  if (params.situacao) where.situacao = params.situacao
  if (params.busca) {
    where.OR = [
      { numero: { contains: params.busca, mode: 'insensitive' } },
      { objeto: { contains: params.busca, mode: 'insensitive' } },
      { fornecedor: { contains: params.busca, mode: 'insensitive' } },
      { orgaoGerenciador: { contains: params.busca, mode: 'insensitive' } },
    ]
  }

  const [data, total] = await Promise.all([
    prisma.ataAdesaoSRP.findMany({
      where,
      orderBy: [{ ano: 'desc' }, { numero: 'desc' }],
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    prisma.ataAdesaoSRP.count({ where }),
  ])

  return createSuccessResponse(data, undefined, undefined, 200, {
    total,
    page: params.page,
    limit: params.limit,
    totalPages: Math.ceil(total / params.limit),
  })
})

export const POST = withAuth(
  withErrorHandler(async (request: NextRequest) => {
    const body = await request.json()
    const data = CreateSchema.parse(body)

    const created = await prisma.ataAdesaoSRP.create({
      data: {
        numero: data.numero,
        ano: data.ano,
        objeto: data.objeto,
        orgaoGerenciador: data.orgaoGerenciador,
        fornecedor: data.fornecedor,
        cnpjFornecedor: data.cnpjFornecedor || null,
        valorTotal: data.valorTotal,
        vigenciaInicio: new Date(data.vigenciaInicio),
        vigenciaFim: new Date(data.vigenciaFim),
        numeroAtaOriginal: data.numeroAtaOriginal || null,
        orgaoOrigem: data.orgaoOrigem || null,
        documentos: data.documentos && data.documentos.length > 0 ? data.documentos : undefined,
        arquivo: data.arquivo || null,
        dataPublicacao: data.dataPublicacao ? new Date(data.dataPublicacao) : null,
        situacao: data.situacao,
        observacoes: data.observacoes || null,
      },
    })

    return createSuccessResponse(created, 'Ata de Adesao a SRP criada', undefined, 201)
  }),
  { permissions: 'transparencia.manage' }
)
