import { NextRequest } from 'next/server'
import { z } from 'zod'
import { licitacoesDbService } from '@/lib/services/licitacoes-db-service'
import { withAuth } from '@/lib/auth/permissions'
import { withErrorHandler, createSuccessResponse, ValidationError } from '@/lib/error-handler'
import { safeParseQueryParams } from '@/lib/validation/query-schemas'
import { createLogger } from '@/lib/logging/logger'

const log = createLogger('api/financeiro/licitacoes')

export const dynamic = 'force-dynamic'

// Schema de validação para query params de licitações
// Enums devem corresponder ao schema Prisma
const LicitacaoQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  modalidade: z.enum(['PREGAO_ELETRONICO', 'PREGAO_PRESENCIAL', 'CONCORRENCIA', 'TOMADA_DE_PRECOS', 'CONVITE', 'CONCURSO', 'LEILAO', 'DISPENSA', 'INEXIGIBILIDADE']).nullish().transform(v => v ?? undefined),
  situacao: z.enum(['EM_ANDAMENTO', 'HOMOLOGADA', 'ADJUDICADA', 'REVOGADA', 'ANULADA', 'DESERTA', 'FRACASSADA', 'SUSPENSA']).nullish().transform(v => v ?? undefined),
  ano: z.coerce.number().int().min(2000).max(2100).optional(),
  objeto: z.string().nullish().transform(v => v ?? undefined),
  dataInicio: z.string().nullish().transform(v => v ?? undefined),
  dataFim: z.string().nullish().transform(v => v ?? undefined),
  valorMinimo: z.coerce.number().min(0).optional(),
  valorMaximo: z.coerce.number().min(0).optional()
}).refine(
  data => !data.valorMinimo || !data.valorMaximo || data.valorMinimo <= data.valorMaximo,
  { message: 'valorMinimo deve ser menor ou igual a valorMaximo' }
)

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)

  const validation = safeParseQueryParams(searchParams, LicitacaoQuerySchema)
  if (!validation.success) {
    throw new ValidationError('Parâmetros inválidos', validation.error.errors)
  }

  const {
    page, limit, modalidade, situacao, ano,
    objeto, dataInicio, dataFim, valorMinimo, valorMaximo
  } = validation.data

  const result = await licitacoesDbService.paginate(
    {
      modalidade,
      situacao,
      ano,
      objeto,
      dataInicio,
      dataFim,
      valorMinimo,
      valorMaximo
    },
    { page, limit }
  )

  return createSuccessResponse(result.data, undefined, undefined, 200, {
    total: result.pagination.total,
    page: result.pagination.page,
    limit: result.pagination.limit,
    totalPages: result.pagination.totalPages
  })
})

export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json()

  if (!body.numero || !body.objeto || !body.modalidade || !body.dataAbertura) {
    log.warn('Licitação bloqueada por validação', {
      action: 'licitacao_validation_failed',
      motivo: 'campos_obrigatorios_ausentes'
    })
    throw new ValidationError('Campos obrigatorios nao fornecidos (numero, objeto, modalidade, dataAbertura)')
  }

  const novaLicitacao = await licitacoesDbService.create({
    numero: body.numero,
    ano: body.ano || new Date(body.dataAbertura).getFullYear(),
    modalidade: body.modalidade,
    tipo: body.tipo,
    objeto: body.objeto,
    valorEstimado: body.valorEstimado ? parseFloat(body.valorEstimado) : null,
    dataPublicacao: body.dataPublicacao,
    dataAbertura: body.dataAbertura,
    horaAbertura: body.horaAbertura,
    dataEntregaPropostas: body.dataEntregaPropostas,
    situacao: body.situacao,
    unidadeGestora: body.unidadeGestora,
    linkEdital: body.linkEdital,
    observacoes: body.observacoes
  })

  log.info('Licitação criada', {
    action: 'licitacao_create',
    id: novaLicitacao.id,
    numero: novaLicitacao.numero,
    ano: novaLicitacao.ano,
    modalidade: novaLicitacao.modalidade,
    situacao: novaLicitacao.situacao
  })

  return createSuccessResponse(novaLicitacao, 'Licitacao criada com sucesso', undefined, 201)
}, { permissions: 'financeiro.manage' })
