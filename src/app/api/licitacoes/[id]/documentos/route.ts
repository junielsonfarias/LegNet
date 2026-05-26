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
  tipo: z.string().optional(),
})

const UpdateDocsSchema = z.object({
  documentosFaseInterna: z.array(DocumentoSchema).optional(),
  documentosFaseExterna: z.array(DocumentoSchema).optional(),
})

/**
 * GET publico: devolve os anexos das duas fases. NotFound se a licitacao nao
 * existir. Resposta minimalista (so os campos de fase e metadados base).
 */
export const GET = withErrorHandler(
  async (_request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const licit = await prisma.licitacao.findUnique({
      where: { id },
      select: {
        id: true,
        numero: true,
        ano: true,
        objeto: true,
        modalidade: true,
        situacao: true,
        documentosFaseInterna: true,
        documentosFaseExterna: true,
      },
    })
    if (!licit) throw new NotFoundError('Licitacao nao encontrada')
    return createSuccessResponse(licit)
  }
)

/**
 * PUT (auth): atualiza apenas os campos de documentos de fase. Permite
 * substituir o array inteiro de cada fase em uma chamada.
 */
export const PUT = withAuth(
  withErrorHandler(async (request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const body = await request.json()
    const data = UpdateDocsSchema.parse(body)

    const existing = await prisma.licitacao.findUnique({ where: { id }, select: { id: true } })
    if (!existing) throw new NotFoundError('Licitacao nao encontrada')

    const updated = await prisma.licitacao.update({
      where: { id },
      data: {
        documentosFaseInterna:
          data.documentosFaseInterna === undefined
            ? undefined
            : data.documentosFaseInterna,
        documentosFaseExterna:
          data.documentosFaseExterna === undefined
            ? undefined
            : data.documentosFaseExterna,
      },
      select: {
        id: true,
        numero: true,
        ano: true,
        documentosFaseInterna: true,
        documentosFaseExterna: true,
      },
    })

    return createSuccessResponse(updated, 'Documentos atualizados')
  }),
  { permissions: 'financeiro.manage' }
)
