import { NextRequest } from 'next/server'
import { z } from 'zod'

import { withAuth } from '@/lib/auth/permissions'
import { createSuccessResponse } from '@/lib/error-handler'
import { list, create } from '@/lib/services/tramitacao-service'

export const dynamic = 'force-dynamic'

const StatusEnum = z.enum(['RECEBIDA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA'])
const ResultadoEnum = z.enum(['APROVADO', 'REJEITADO', 'APROVADO_COM_EMENDAS', 'ARQUIVADO'])

const CreateTramitacaoSchema = z.object({
  proposicaoId: z.string().min(1, 'Proposição é obrigatória'),
  tipoTramitacaoId: z.string().min(1, 'Tipo de tramitação é obrigatório'),
  unidadeId: z.string().nullish().transform(v => v ?? undefined),
  dataEntrada: z.string().datetime({ message: 'dataEntrada deve estar no formato ISO 8601' }).optional(),
  dataSaida: z.string().datetime({ message: 'dataSaida deve estar no formato ISO 8601' }).optional(),
  status: StatusEnum.optional(),
  observacoes: z.string().nullish().transform(v => v ?? undefined),
  parecer: z.string().nullish().transform(v => v ?? undefined),
  resultado: ResultadoEnum.optional(),
  responsavelId: z.string().nullish().transform(v => v ?? undefined),
  prazoVencimento: z.string().datetime({ message: 'prazoVencimento deve estar no formato ISO 8601' }).optional(),
  diasVencidos: z.number().int().min(0).optional(),
  automatica: z.boolean().nullish().transform(v => v ?? undefined)
})

export const GET = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)

  const automaticaParam = searchParams.get('automatica')
  let automatica: boolean | null = null
  if (automaticaParam === 'true') {
    automatica = true
  } else if (automaticaParam === 'false') {
    automatica = false
  }

  const filters = {
    proposicaoId: searchParams.get('proposicaoId') || undefined,
    tipoTramitacaoId: searchParams.get('tipoTramitacaoId') || undefined,
    unidadeId: searchParams.get('unidadeId') || undefined,
    status: searchParams.get('status')?.toUpperCase() || undefined,
    resultado: searchParams.get('resultado')?.toUpperCase() || undefined,
    automatica,
    from: searchParams.get('from') || undefined,
    to: searchParams.get('to') || undefined,
    search: searchParams.get('search') || undefined
  }

  const pagination = {
    page: Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10)),
    limit: Math.min(Number.parseInt(searchParams.get('limit') || '25', 10), 100)
  }

  const result = await list(filters, pagination)

  return createSuccessResponse(
    result.tramitacoes,
    'Tramitações carregadas com sucesso',
    result.total,
    200,
    {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages
    }
  )
}, { permissions: 'tramitacao.view' })

export const POST = withAuth(async (request: NextRequest, { user }) => {
  const body = await request.json()
  const payload = CreateTramitacaoSchema.parse(body)

  const tramitacao = await create(payload, user?.id)

  return createSuccessResponse(
    tramitacao,
    'Tramitação criada com sucesso',
    undefined,
    201
  )
}, { permissions: 'tramitacao.manage' })
