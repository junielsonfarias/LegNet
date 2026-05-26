import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
import {
  withErrorHandler,
  createSuccessResponse,
  NotFoundError,
} from '@/lib/error-handler'
import { pesquisaSatisfacaoService } from '@/lib/services/pesquisa-satisfacao-service'

export const dynamic = 'force-dynamic'

const PerguntaSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  tipo: z.enum(['ESCALA_1_5', 'SIM_NAO', 'TEXTO', 'MULTIPLA_ESCOLHA']),
  obrigatoria: z.boolean().optional(),
  opcoes: z.array(z.string()).optional(),
})

const UpdateSchema = z.object({
  titulo: z.string().min(1).max(300).optional(),
  descricao: z.string().max(5000).nullish(),
  periodoInicio: z.string().optional(),
  periodoFim: z.string().nullish(),
  ativa: z.boolean().optional(),
  publicaResultados: z.boolean().optional(),
  perguntas: z.array(PerguntaSchema).optional(),
})

export const GET = withErrorHandler(
  async (_request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const pesquisa = await pesquisaSatisfacaoService.getCompleta(id)
    if (!pesquisa) throw new NotFoundError('Pesquisa nao encontrada')
    return createSuccessResponse(pesquisa)
  }
)

export const PUT = withAuth(
  withErrorHandler(async (request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const body = await request.json()
    const data = UpdateSchema.parse(body)

    const existing = await prisma.pesquisaSatisfacao.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('Pesquisa nao encontrada')

    const updated = await prisma.pesquisaSatisfacao.update({
      where: { id },
      data: {
        titulo: data.titulo ?? undefined,
        descricao: data.descricao === undefined ? undefined : data.descricao,
        periodoInicio: data.periodoInicio ? new Date(data.periodoInicio) : undefined,
        periodoFim:
          data.periodoFim === undefined
            ? undefined
            : data.periodoFim
            ? new Date(data.periodoFim)
            : null,
        ativa: data.ativa ?? undefined,
        publicaResultados: data.publicaResultados ?? undefined,
        perguntas: data.perguntas ?? undefined,
      },
    })

    return createSuccessResponse(updated, 'Pesquisa atualizada')
  }),
  { permissions: 'transparencia.manage' }
)

export const DELETE = withAuth(
  withErrorHandler(async (_request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const existing = await prisma.pesquisaSatisfacao.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('Pesquisa nao encontrada')

    await prisma.pesquisaSatisfacao.delete({ where: { id } })
    return createSuccessResponse(null, 'Pesquisa removida')
  }),
  { permissions: 'transparencia.manage' }
)
