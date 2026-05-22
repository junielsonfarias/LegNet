import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
import { withErrorHandler, createSuccessResponse, NotFoundError } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

const SITUACOES = ['ATIVO', 'INATIVO', 'SUSPENSO'] as const
const TIPOS_PESSOA = ['PF', 'PJ'] as const

const UpdateSchema = z.object({
  nome: z.string().min(1).optional(),
  cnpjCpf: z.string().nullable().optional(),
  tipoPessoa: z.enum(TIPOS_PESSOA).optional(),
  ramoAtividade: z.string().nullable().optional(),
  municipio: z.string().nullable().optional(),
  uf: z.string().max(2).nullable().optional(),
  telefone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal('')),
  situacao: z.enum(SITUACOES).optional(),
  observacoes: z.string().nullable().optional()
})

export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const item = await prisma.fornecedor.findUnique({ where: { id } })
  if (!item) throw new NotFoundError('Fornecedor nao encontrado')
  return createSuccessResponse(item)
})

export const PUT = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const body = await request.json()
  const data = UpdateSchema.parse(body)

  const updated = await prisma.fornecedor.update({
    where: { id },
    data: {
      ...(data.nome !== undefined ? { nome: data.nome } : {}),
      ...(data.cnpjCpf !== undefined ? { cnpjCpf: data.cnpjCpf } : {}),
      ...(data.tipoPessoa !== undefined ? { tipoPessoa: data.tipoPessoa } : {}),
      ...(data.ramoAtividade !== undefined ? { ramoAtividade: data.ramoAtividade } : {}),
      ...(data.municipio !== undefined ? { municipio: data.municipio } : {}),
      ...(data.uf !== undefined ? { uf: data.uf } : {}),
      ...(data.telefone !== undefined ? { telefone: data.telefone } : {}),
      ...(data.email !== undefined ? { email: data.email ? data.email : null } : {}),
      ...(data.situacao !== undefined ? { situacao: data.situacao } : {}),
      ...(data.observacoes !== undefined ? { observacoes: data.observacoes } : {})
    }
  })

  return createSuccessResponse(updated, 'Fornecedor atualizado')
}, { permissions: 'transparencia.manage' })

export const DELETE = withAuth(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  await prisma.fornecedor.delete({ where: { id } })
  return createSuccessResponse(null, 'Fornecedor removido')
}, { permissions: 'transparencia.manage' })
