import { NextRequest } from 'next/server'
import { z } from 'zod'

import { withAuth } from '@/lib/auth/permissions'
import { createSuccessResponse, ValidationError } from '@/lib/error-handler'
import { logAudit } from '@/lib/audit'
import {
  tramitacoesService,
  tiposTramitacaoService,
  tiposOrgaosService,
  tramitacaoHistoricosService
} from '@/lib/tramitacao-service'

export const dynamic = 'force-dynamic'

const StatusEnum = z.enum(['EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA'])
const ResultadoEnum = z.enum(['APROVADO', 'REJEITADO', 'APROVADO_COM_EMENDAS', 'ARQUIVADO'])

const CreateTramitacaoSchema = z.object({
  proposicaoId: z.string().min(1, 'Proposição é obrigatória'),
  tipoTramitacaoId: z.string().min(1, 'Tipo de tramitação é obrigatório'),
  unidadeId: z.string().optional(),
  dataEntrada: z.string().datetime({ message: 'dataEntrada deve estar no formato ISO 8601' }).optional(),
  dataSaida: z.string().datetime({ message: 'dataSaida deve estar no formato ISO 8601' }).optional(),
  status: StatusEnum.optional(),
  observacoes: z.string().optional(),
  parecer: z.string().optional(),
  resultado: ResultadoEnum.optional(),
  responsavelId: z.string().optional(),
  prazoVencimento: z.string().datetime({ message: 'prazoVencimento deve estar no formato ISO 8601' }).optional(),
  diasVencidos: z.number().int().min(0).optional(),
  automatica: z.boolean().optional()
})

const buildTramitacaoResponse = (tramitacao: ReturnType<typeof tramitacoesService.getAll>[number]) => ({
  ...tramitacao,
  tipoTramitacao: tiposTramitacaoService.getById(tramitacao.tipoTramitacaoId) || null,
  unidade: tiposOrgaosService.getById(tramitacao.unidadeId) || null
})

const filterBySearch = (value: string | undefined | null, search?: string | null) => {
  if (!search) return true
  if (!value) return false
  return value.toLowerCase().includes(search.toLowerCase())
}

export const GET = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)

  const proposicaoId = searchParams.get('proposicaoId')
  const tipoTramitacaoId = searchParams.get('tipoTramitacaoId')
  const unidadeId = searchParams.get('unidadeId')
  const status = searchParams.get('status')?.toUpperCase()
  const resultado = searchParams.get('resultado')?.toUpperCase()
  const search = searchParams.get('search')
  const automatica = searchParams.get('automatica')
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(Number.parseInt(searchParams.get('limit') || '25', 10), 100)

  let itens = tramitacoesService.getAll()

  if (proposicaoId) {
    itens = itens.filter(item => item.proposicaoId === proposicaoId)
  }

  if (tipoTramitacaoId) {
    itens = itens.filter(item => item.tipoTramitacaoId === tipoTramitacaoId)
  }

  if (unidadeId) {
    itens = itens.filter(item => item.unidadeId === unidadeId)
  }

  if (status && StatusEnum.options.includes(status as any)) {
    itens = itens.filter(item => (item.status ?? 'EM_ANDAMENTO').toString().toUpperCase() === status)
  }

  if (resultado && ResultadoEnum.options.includes(resultado as any)) {
    itens = itens.filter(item => (item.resultado ?? '').toString().toUpperCase() === resultado)
  }

  if (automatica !== null) {
    if (automatica === 'true') {
      itens = itens.filter(item => item.automatica === true)
    } else if (automatica === 'false') {
      itens = itens.filter(item => !item.automatica)
    }
  }

  if (from) {
    const fromDate = new Date(from)
    if (!Number.isNaN(fromDate.getTime())) {
      itens = itens.filter(item => new Date(item.dataEntrada).getTime() >= fromDate.getTime())
    }
  }

  if (to) {
    const toDate = new Date(to)
    if (!Number.isNaN(toDate.getTime())) {
      itens = itens.filter(item => new Date(item.dataEntrada).getTime() <= toDate.getTime())
    }
  }

  if (search) {
    itens = itens.filter(item =>
      filterBySearch(item.observacoes, search) ||
      filterBySearch(item.parecer, search)
    )
  }

  const total = itens.length
  const start = (page - 1) * limit
  const end = start + limit
  const paginados = itens.slice(start, end)

  const resposta = paginados.map(buildTramitacaoResponse)

  return createSuccessResponse(
    resposta,
    'Tramitações carregadas com sucesso',
    total,
    200,
    {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  )
}, { permissions: 'tramitacao.view' })

export const POST = withAuth(async (request: NextRequest, _ctx, session) => {
  const body = await request.json()
  const payload = CreateTramitacaoSchema.parse(body)

  const tipo = tiposTramitacaoService.getById(payload.tipoTramitacaoId)
  if (!tipo) {
    throw new ValidationError('Tipo de tramitação não encontrado')
  }

  const resolvedUnidadeId = payload.unidadeId ?? tipo.unidadeResponsavelId ?? tipo.unidadeResponsavel ?? null
  if (!resolvedUnidadeId) {
    throw new ValidationError('Unidade responsável não informada e não configurada no tipo de tramitação selecionado.')
  }

  const unidade = tiposOrgaosService.getById(resolvedUnidadeId)
  if (!unidade) {
    throw new ValidationError('Unidade responsável não encontrada')
  }

  const status = (payload.status ?? 'EM_ANDAMENTO').toUpperCase() as z.infer<typeof StatusEnum>
  const dataEntradaISO = payload.dataEntrada ? new Date(payload.dataEntrada).toISOString() : new Date().toISOString()
  let dataSaidaISO = payload.dataSaida ? new Date(payload.dataSaida).toISOString() : undefined

  if (status === 'CONCLUIDA' && !dataSaidaISO) {
    dataSaidaISO = new Date().toISOString()
  }

  let prazoVencimentoISO = payload.prazoVencimento ? new Date(payload.prazoVencimento).toISOString() : undefined
  if (!prazoVencimentoISO && status === 'EM_ANDAMENTO') {
    prazoVencimentoISO = tramitacoesService.calcularPrazoVencimento(tipo.id).toISOString()
  }

  let diasVencidos = payload.diasVencidos
  if (diasVencidos === undefined && prazoVencimentoISO) {
    const diff = Date.now() - new Date(prazoVencimentoISO).getTime()
    diasVencidos = diff > 0 ? Math.floor(diff / (1000 * 60 * 60 * 24)) : 0
  }

  const tramitacao = tramitacoesService.create({
    proposicaoId: payload.proposicaoId,
    tipoTramitacaoId: tipo.id,
    unidadeId: resolvedUnidadeId,
    dataEntrada: dataEntradaISO,
    dataSaida: dataSaidaISO,
    status,
    observacoes: payload.observacoes,
    parecer: payload.parecer,
    resultado: payload.resultado,
    responsavelId: payload.responsavelId,
    prazoVencimento: prazoVencimentoISO,
    diasVencidos,
    automatica: payload.automatica ?? false
  })

  await tramitacaoHistoricosService.create({
    tramitacaoId: tramitacao.id,
    acao: 'CRIACAO',
    descricao: payload.observacoes || 'Tramitação criada',
    usuarioId: session.user.id,
    proposicaoId: tramitacao.proposicaoId,
    dadosNovos: tramitacao
  })

  await logAudit({
    request,
    session,
    action: 'TRAMITACAO_CREATE',
    entity: 'Tramitacao',
    entityId: tramitacao.id,
    metadata: {
      proposicaoId: payload.proposicaoId,
      tipoTramitacaoId: tipo.id,
      unidadeId: resolvedUnidadeId,
      status
    }
  })

  return createSuccessResponse(
    buildTramitacaoResponse(tramitacao),
    'Tramitação criada com sucesso',
    undefined,
    201
  )
}, { permissions: 'tramitacao.manage' })
