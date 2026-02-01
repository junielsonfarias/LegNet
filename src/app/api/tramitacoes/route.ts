import { NextRequest } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
import { createSuccessResponse, ValidationError } from '@/lib/error-handler'
import { addBusinessDays } from '@/lib/utils/date'

export const dynamic = 'force-dynamic'

const StatusEnum = z.enum(['RECEBIDA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA'])
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

  const where: any = {}

  if (proposicaoId) {
    where.proposicaoId = proposicaoId
  }

  if (tipoTramitacaoId) {
    where.tipoTramitacaoId = tipoTramitacaoId
  }

  if (unidadeId) {
    where.unidadeId = unidadeId
  }

  if (status && StatusEnum.options.includes(status as any)) {
    where.status = status
  }

  if (resultado && ResultadoEnum.options.includes(resultado as any)) {
    where.resultado = resultado
  }

  if (automatica !== null) {
    if (automatica === 'true') {
      where.automatica = true
    } else if (automatica === 'false') {
      where.automatica = false
    }
  }

  if (from || to) {
    where.dataEntrada = {}
    if (from) {
      const fromDate = new Date(from)
      if (!Number.isNaN(fromDate.getTime())) {
        where.dataEntrada.gte = fromDate
      }
    }
    if (to) {
      const toDate = new Date(to)
      if (!Number.isNaN(toDate.getTime())) {
        where.dataEntrada.lte = toDate
      }
    }
  }

  if (search) {
    where.OR = [
      { observacoes: { contains: search, mode: 'insensitive' } },
      { parecer: { contains: search, mode: 'insensitive' } }
    ]
  }

  const [tramitacoes, total] = await Promise.all([
    prisma.tramitacao.findMany({
      where,
      include: {
        tipoTramitacao: true,
        unidade: true,
        proposicao: {
          select: {
            id: true,
            numero: true,
            ano: true,
            tipo: true,
            titulo: true
          }
        },
        responsavel: {
          select: {
            id: true,
            nome: true
          }
        }
      },
      orderBy: { dataEntrada: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.tramitacao.count({ where })
  ])

  return createSuccessResponse(
    tramitacoes,
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

export const POST = withAuth(async (request: NextRequest, { user }) => {
  const body = await request.json()
  const payload = CreateTramitacaoSchema.parse(body)

  // Verificar se proposição existe
  const proposicao = await prisma.proposicao.findUnique({
    where: { id: payload.proposicaoId }
  })

  if (!proposicao) {
    throw new ValidationError('Proposição não encontrada')
  }

  // Buscar tipo de tramitação
  const tipo = await prisma.tramitacaoTipo.findUnique({
    where: { id: payload.tipoTramitacaoId },
    include: { unidadeResponsavel: true }
  })

  if (!tipo) {
    throw new ValidationError('Tipo de tramitação não encontrado')
  }

  // Resolver unidade
  const resolvedUnidadeId = payload.unidadeId ?? tipo.unidadeResponsavelId
  if (!resolvedUnidadeId) {
    throw new ValidationError('Unidade responsável não informada e não configurada no tipo de tramitação selecionado.')
  }

  const unidade = await prisma.tramitacaoUnidade.findUnique({
    where: { id: resolvedUnidadeId }
  })

  if (!unidade) {
    throw new ValidationError('Unidade responsável não encontrada')
  }

  const status = (payload.status ?? 'RECEBIDA') as 'RECEBIDA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA'
  const dataEntrada = payload.dataEntrada ? new Date(payload.dataEntrada) : new Date()
  let dataSaida = payload.dataSaida ? new Date(payload.dataSaida) : undefined

  if (status === 'CONCLUIDA' && !dataSaida) {
    dataSaida = new Date()
  }

  // Calcular prazo de vencimento (para status ativos: RECEBIDA ou EM_ANDAMENTO)
  let prazoVencimento: Date | undefined = payload.prazoVencimento ? new Date(payload.prazoVencimento) : undefined
  if (!prazoVencimento && (status === 'RECEBIDA' || status === 'EM_ANDAMENTO') && tipo.prazoRegimental > 0) {
    prazoVencimento = addBusinessDays(dataEntrada, tipo.prazoRegimental) ?? undefined
  }

  // Calcular dias vencidos
  let diasVencidos = payload.diasVencidos
  if (diasVencidos === undefined && prazoVencimento) {
    const diff = Date.now() - prazoVencimento.getTime()
    diasVencidos = diff > 0 ? Math.floor(diff / (1000 * 60 * 60 * 24)) : 0
  }

  const tramitacao = await prisma.tramitacao.create({
    data: {
      proposicaoId: payload.proposicaoId,
      tipoTramitacaoId: tipo.id,
      unidadeId: resolvedUnidadeId,
      dataEntrada,
      dataSaida,
      status,
      observacoes: payload.observacoes,
      parecer: payload.parecer,
      resultado: payload.resultado as any,
      responsavelId: payload.responsavelId,
      prazoVencimento,
      diasVencidos,
      automatica: payload.automatica ?? false
    },
    include: {
      tipoTramitacao: true,
      unidade: true,
      proposicao: {
        select: {
          id: true,
          numero: true,
          ano: true,
          tipo: true,
          titulo: true
        }
      }
    }
  })

  // Criar registro no histórico
  await prisma.tramitacaoHistorico.create({
    data: {
      tramitacaoId: tramitacao.id,
      acao: 'CRIACAO',
      descricao: payload.observacoes || 'Tramitação criada',
      usuarioId: user?.id,
      dadosNovos: tramitacao as any
    }
  })

  // Atualizar status da proposição baseado no tipo de tramitação/unidade
  const tipoNomeLower = tipo.nome.toLowerCase()
  const unidadeNomeLower = unidade.nome.toLowerCase()
  const observacoesLower = (payload.observacoes || '').toLowerCase()

  // Detecta se é tramitação para "Aguardando Pauta"
  const isAguardandoPauta =
    tipoNomeLower.includes('aguardando pauta') ||
    tipoNomeLower.includes('pauta') ||
    observacoesLower.includes('aguardando pauta') ||
    (unidade.tipo === 'SECRETARIA' && (
      observacoesLower.includes('pauta') ||
      observacoesLower.includes('aguardando')
    ))

  // Detecta se é tramitação para "Plenário" (em pauta)
  const isEmPauta =
    unidade.tipo === 'PLENARIO' ||
    unidadeNomeLower.includes('plenário') ||
    unidadeNomeLower.includes('plenario') ||
    tipoNomeLower.includes('plenário') ||
    tipoNomeLower.includes('plenario')

  // Determinar novo status da proposição
  let novoStatusProposicao: string | null = null

  if (isEmPauta) {
    novoStatusProposicao = 'EM_PAUTA'
  } else if (isAguardandoPauta) {
    novoStatusProposicao = 'AGUARDANDO_PAUTA'
  } else if (proposicao.status === 'APRESENTADA') {
    novoStatusProposicao = 'EM_TRAMITACAO'
  }

  if (novoStatusProposicao && novoStatusProposicao !== proposicao.status) {
    await prisma.proposicao.update({
      where: { id: payload.proposicaoId },
      data: { status: novoStatusProposicao as any }
    })
  }

  return createSuccessResponse(
    tramitacao,
    'Tramitação criada com sucesso',
    undefined,
    201
  )
}, { permissions: 'tramitacao.manage' })
