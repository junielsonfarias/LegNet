import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
import {
  withErrorHandler,
  createSuccessResponse,
  NotFoundError,
} from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

const DocumentoSchema = z.object({
  nome: z.string().min(1),
  url: z.string().url(),
})

const UpdateSchema = z.object({
  numero: z.string().min(1).max(50).optional(),
  ano: z.number().int().optional(),
  objeto: z.string().min(1).optional(),
  orgaoGerenciador: z.string().min(1).optional(),
  fornecedor: z.string().min(1).optional(),
  cnpjFornecedor: z.string().nullish(),
  valorTotal: z.number().nonnegative().optional(),
  vigenciaInicio: z.string().optional(),
  vigenciaFim: z.string().optional(),
  numeroAtaOriginal: z.string().nullish(),
  orgaoOrigem: z.string().nullish(),
  documentos: z.array(DocumentoSchema).nullish(),
  arquivo: z.string().nullish(),
  dataPublicacao: z.string().nullish(),
  situacao: z.string().optional(),
  observacoes: z.string().nullish(),
})

export const GET = withErrorHandler(
  async (_request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const ata = await prisma.ataAdesaoSRP.findUnique({ where: { id } })
    if (!ata) throw new NotFoundError('Ata nao encontrada')
    return createSuccessResponse(ata)
  }
)

export const PUT = withAuth(
  withErrorHandler(async (request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const body = await request.json()
    const data = UpdateSchema.parse(body)

    const existing = await prisma.ataAdesaoSRP.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('Ata nao encontrada')

    const updated = await prisma.ataAdesaoSRP.update({
      where: { id },
      data: {
        numero: data.numero ?? undefined,
        ano: data.ano ?? undefined,
        objeto: data.objeto ?? undefined,
        orgaoGerenciador: data.orgaoGerenciador ?? undefined,
        fornecedor: data.fornecedor ?? undefined,
        cnpjFornecedor: data.cnpjFornecedor === undefined ? undefined : data.cnpjFornecedor,
        valorTotal: data.valorTotal ?? undefined,
        vigenciaInicio: data.vigenciaInicio ? new Date(data.vigenciaInicio) : undefined,
        vigenciaFim: data.vigenciaFim ? new Date(data.vigenciaFim) : undefined,
        numeroAtaOriginal:
          data.numeroAtaOriginal === undefined ? undefined : data.numeroAtaOriginal,
        orgaoOrigem: data.orgaoOrigem === undefined ? undefined : data.orgaoOrigem,
        documentos:
          data.documentos === undefined
            ? undefined
            : data.documentos && data.documentos.length > 0
            ? data.documentos
            : undefined,
        arquivo: data.arquivo === undefined ? undefined : data.arquivo,
        dataPublicacao:
          data.dataPublicacao === undefined
            ? undefined
            : data.dataPublicacao
            ? new Date(data.dataPublicacao)
            : null,
        situacao: data.situacao ?? undefined,
        observacoes: data.observacoes === undefined ? undefined : data.observacoes,
      },
    })

    return createSuccessResponse(updated, 'Ata atualizada')
  }),
  { permissions: 'transparencia.manage' }
)

export const DELETE = withAuth(
  withErrorHandler(async (_request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const existing = await prisma.ataAdesaoSRP.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('Ata nao encontrada')
    await prisma.ataAdesaoSRP.delete({ where: { id } })
    return createSuccessResponse(null, 'Ata removida')
  }),
  { permissions: 'transparencia.manage' }
)
