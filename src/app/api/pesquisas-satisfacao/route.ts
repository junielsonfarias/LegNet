import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
import { withErrorHandler, createSuccessResponse } from '@/lib/error-handler'
import { pesquisaSatisfacaoService } from '@/lib/services/pesquisa-satisfacao-service'

export const dynamic = 'force-dynamic'

const PerguntaSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  tipo: z.enum(['ESCALA_1_5', 'SIM_NAO', 'TEXTO', 'MULTIPLA_ESCOLHA']),
  obrigatoria: z.boolean().optional(),
  opcoes: z.array(z.string()).optional(),
})

const CreateSchema = z.object({
  titulo: z.string().min(1).max(300),
  descricao: z.string().max(5000).optional(),
  periodoInicio: z.string(),
  periodoFim: z.string().optional().nullable(),
  ativa: z.boolean().default(true),
  publicaResultados: z.boolean().default(true),
  perguntas: z.array(PerguntaSchema).min(1, 'Informe ao menos uma pergunta'),
})

// GET publico (lista resumo). Suporta `?somenteAtivas=true`.
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const somenteAtivas = searchParams.get('somenteAtivas') === 'true'
  const lista = await pesquisaSatisfacaoService.list({ somenteAtivas })
  return createSuccessResponse(lista)
})

export const POST = withAuth(
  withErrorHandler(async (request: NextRequest) => {
    const body = await request.json()
    const data = CreateSchema.parse(body)

    const created = await prisma.pesquisaSatisfacao.create({
      data: {
        titulo: data.titulo,
        descricao: data.descricao || null,
        periodoInicio: new Date(data.periodoInicio),
        periodoFim: data.periodoFim ? new Date(data.periodoFim) : null,
        ativa: data.ativa,
        publicaResultados: data.publicaResultados,
        perguntas: data.perguntas,
      },
    })

    return createSuccessResponse(created, 'Pesquisa criada', undefined, 201)
  }),
  { permissions: 'transparencia.manage' }
)
