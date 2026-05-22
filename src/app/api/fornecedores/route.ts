import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
import { createSuccessResponse } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

const SITUACOES = ['ATIVO', 'INATIVO', 'SUSPENSO'] as const
const TIPOS_PESSOA = ['PF', 'PJ'] as const

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(500),
  situacao: z.enum(SITUACOES).optional(),
  nome: z.string().optional()
})

// GET protegido: retorna o registro completo (inclui CPF/email/telefone).
// A pagina publica /transparencia/fornecedores NAO usa esta rota — ela e
// SSR com select de campos publicos e CPF mascarado (RN-156 / LGPD).
export const GET = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const params = QuerySchema.parse(Object.fromEntries(searchParams))

  const where: Record<string, unknown> = {}
  if (params.situacao) where.situacao = params.situacao
  if (params.nome) where.nome = { contains: params.nome, mode: 'insensitive' }

  const [data, total] = await Promise.all([
    prisma.fornecedor.findMany({
      where,
      orderBy: { nome: 'asc' },
      skip: (params.page - 1) * params.limit,
      take: params.limit
    }),
    prisma.fornecedor.count({ where })
  ])

  return createSuccessResponse(data, undefined, undefined, 200, {
    total,
    page: params.page,
    limit: params.limit,
    totalPages: Math.ceil(total / params.limit)
  })
}, { permissions: 'transparencia.manage' })

const CreateSchema = z.object({
  nome: z.string().min(1, 'Nome e obrigatorio'),
  cnpjCpf: z.string().nullable().optional(),
  tipoPessoa: z.enum(TIPOS_PESSOA).default('PJ'),
  ramoAtividade: z.string().nullable().optional(),
  municipio: z.string().nullable().optional(),
  uf: z.string().max(2).nullable().optional(),
  telefone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal('')),
  situacao: z.enum(SITUACOES).default('ATIVO'),
  observacoes: z.string().nullable().optional()
})

export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json()
  const data = CreateSchema.parse(body)

  const created = await prisma.fornecedor.create({
    data: {
      nome: data.nome,
      cnpjCpf: data.cnpjCpf ?? null,
      tipoPessoa: data.tipoPessoa,
      ramoAtividade: data.ramoAtividade ?? null,
      municipio: data.municipio ?? null,
      uf: data.uf ?? null,
      telefone: data.telefone ?? null,
      email: data.email ? data.email : null,
      situacao: data.situacao,
      observacoes: data.observacoes ?? null
    }
  })

  return createSuccessResponse(created, 'Fornecedor criado', undefined, 201)
}, { permissions: 'transparencia.manage' })
