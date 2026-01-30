import { NextRequest } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
import {
  createSuccessResponse,
  ValidationError,
  NotFoundError
} from '@/lib/error-handler'
import { addBusinessDays } from '@/lib/utils/date'
import { avancarEtapaFluxo } from '@/lib/services/tramitacao-service'

export const dynamic = 'force-dynamic'

const StatusEnum = z.enum(['EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA'])
const ResultadoEnum = z.enum(['APROVADO', 'REJEITADO', 'APROVADO_COM_EMENDAS', 'ARQUIVADO'])

const UpdateTramitacaoSchema = z.object({
  tipoTramitacaoId: z.string().optional(),
  unidadeId: z.string().optional(),
  dataEntrada: z.string().datetime({ message: 'dataEntrada deve estar no formato ISO 8601' }).optional(),
  dataSaida: z
    .union([
      z.string().datetime({ message: 'dataSaida deve estar no formato ISO 8601' }),
      z.null()
    ])
    .optional(),
  status: StatusEnum.optional(),
  observacoes: z.union([z.string(), z.null()]).optional(),
  parecer: z.union([z.string(), z.null()]).optional(),
  resultado: z.union([ResultadoEnum, z.null()]).optional(),
  responsavelId: z.union([z.string(), z.null()]).optional(),
  prazoVencimento: z
    .union([
      z.string().datetime({ message: 'prazoVencimento deve estar no formato ISO 8601' }),
      z.null()
    ])
    .optional(),
  diasVencidos: z.union([z.number().int().min(0), z.null()]).optional(),
  automatica: z.boolean().optional()
})

const ActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('advance'),
    comentario: z.union([z.string(), z.null()]).optional(),
    parecer: z.string().optional(),
    resultado: ResultadoEnum.optional()
  }),
  z.object({
    action: z.literal('reopen'),
    observacoes: z.union([z.string(), z.null()]).optional()
  }),
  z.object({
    action: z.literal('finalize'),
    observacoes: z.union([z.string(), z.null()]).optional(),
    resultado: z.union([ResultadoEnum, z.null()]).optional()
  })
])

// GET - Obter tramitação por ID
export const GET = withAuth(async (_request: NextRequest, { params }) => {
  const { id } = await params

  const tramitacao = await prisma.tramitacao.findUnique({
    where: { id },
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
      },
      historicos: {
        orderBy: { data: 'desc' }
      },
      notificacoes: {
        orderBy: { enviadoEm: 'desc' }
      },
      fluxoEtapa: {
        include: {
          fluxo: true
        }
      }
    }
  })

  if (!tramitacao) {
    throw new NotFoundError('Tramitação não encontrada')
  }

  return createSuccessResponse(tramitacao, 'Tramitação encontrada')
}, { permissions: 'tramitacao.view' })

// PUT - Atualizar tramitação ou executar ação
export const PUT = withAuth(async (request: NextRequest, { params, user }) => {
  const { id } = await params
  const body = await request.json()

  // Verificar se é uma ação especial
  const actionResult = ActionSchema.safeParse(body)
  if (actionResult.success) {
    const actionPayload = actionResult.data

    const atual = await prisma.tramitacao.findUnique({
      where: { id },
      include: { proposicao: true }
    })

    if (!atual) {
      throw new NotFoundError('Tramitação não encontrada')
    }

    // Ação: Avançar para próxima etapa
    if (actionPayload.action === 'advance') {
      const resultado = await avancarEtapaFluxo(
        atual.proposicaoId,
        actionPayload.comentario || undefined,
        actionPayload.parecer as any,
        actionPayload.resultado as any,
        user?.id,
        request.headers.get('x-forwarded-for') || undefined
      )

      return createSuccessResponse(
        resultado,
        resultado.etapaFinal ? 'Tramitação finalizada' : 'Tramitação avançada para a próxima etapa'
      )
    }

    // Ação: Reabrir tramitação
    if (actionPayload.action === 'reopen') {
      const tipo = await prisma.tramitacaoTipo.findUnique({
        where: { id: atual.tipoTramitacaoId }
      })

      const prazoVencimento = tipo?.prazoRegimental
        ? addBusinessDays(new Date(), tipo.prazoRegimental)
        : null

      const tramitacao = await prisma.tramitacao.update({
        where: { id },
        data: {
          status: 'EM_ANDAMENTO',
          dataSaida: null,
          resultado: null,
          observacoes: actionPayload.observacoes
            ? `${atual.observacoes || ''}\n[Reaberta] ${actionPayload.observacoes}`.trim()
            : atual.observacoes,
          diasVencidos: 0,
          prazoVencimento
        },
        include: {
          tipoTramitacao: true,
          unidade: true
        }
      })

      await prisma.tramitacaoHistorico.create({
        data: {
          tramitacaoId: id,
          acao: 'REABERTURA',
          descricao: actionPayload.observacoes || 'Tramitação reaberta',
          usuarioId: user?.id
        }
      })

      return createSuccessResponse(tramitacao, 'Tramitação reaberta com sucesso')
    }

    // Ação: Finalizar tramitação
    if (actionPayload.action === 'finalize') {
      const tramitacao = await prisma.tramitacao.update({
        where: { id },
        data: {
          status: 'CONCLUIDA',
          dataSaida: new Date(),
          resultado: actionPayload.resultado as any,
          observacoes: actionPayload.observacoes
            ? `${atual.observacoes || ''}\n[Finalizada] ${actionPayload.observacoes}`.trim()
            : atual.observacoes
        },
        include: {
          tipoTramitacao: true,
          unidade: true
        }
      })

      await prisma.tramitacaoHistorico.create({
        data: {
          tramitacaoId: id,
          acao: 'FINALIZACAO',
          descricao: actionPayload.observacoes || 'Tramitação finalizada',
          usuarioId: user?.id,
          dadosNovos: { resultado: actionPayload.resultado }
        }
      })

      return createSuccessResponse(tramitacao, 'Tramitação finalizada com sucesso')
    }
  }

  // Atualização normal
  const payload = UpdateTramitacaoSchema.parse(body)

  const atual = await prisma.tramitacao.findUnique({
    where: { id }
  })

  if (!atual) {
    throw new NotFoundError('Tramitação não encontrada')
  }

  // Verificar tipo de tramitação
  const tipoId = payload.tipoTramitacaoId ?? atual.tipoTramitacaoId
  const tipo = await prisma.tramitacaoTipo.findUnique({
    where: { id: tipoId }
  })

  if (!tipo) {
    throw new ValidationError('Tipo de tramitação não encontrado')
  }

  // Resolver unidade (unidadeId é obrigatório, usar atual como fallback)
  const resolvedUnidadeId = payload.unidadeId ??
    (payload.tipoTramitacaoId && tipo.unidadeResponsavelId ? tipo.unidadeResponsavelId : atual.unidadeId)

  if (resolvedUnidadeId !== atual.unidadeId) {
    const unidade = await prisma.tramitacaoUnidade.findUnique({
      where: { id: resolvedUnidadeId }
    })

    if (!unidade) {
      throw new ValidationError('Unidade responsável não encontrada')
    }
  }

  const status = (payload.status ?? atual.status) as 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA'
  const dataEntrada = payload.dataEntrada ? new Date(payload.dataEntrada) : atual.dataEntrada
  let dataSaida = payload.dataSaida === null
    ? null
    : payload.dataSaida
      ? new Date(payload.dataSaida)
      : atual.dataSaida

  if (status === 'CONCLUIDA' && !dataSaida) {
    dataSaida = new Date()
  }

  // Calcular prazo
  let prazoVencimento = payload.prazoVencimento === null
    ? null
    : payload.prazoVencimento
      ? new Date(payload.prazoVencimento)
      : atual.prazoVencimento

  if (!prazoVencimento && status === 'EM_ANDAMENTO' && tipo.prazoRegimental > 0) {
    prazoVencimento = addBusinessDays(dataEntrada, tipo.prazoRegimental)
  }

  // Calcular dias vencidos
  let diasVencidos = payload.diasVencidos === null ? null : payload.diasVencidos ?? atual.diasVencidos
  if (diasVencidos === null && prazoVencimento) {
    const diff = Date.now() - prazoVencimento.getTime()
    diasVencidos = diff > 0 ? Math.floor(diff / (1000 * 60 * 60 * 24)) : 0
  }

  const tramitacao = await prisma.tramitacao.update({
    where: { id },
    data: {
      tipoTramitacaoId: tipoId,
      unidadeId: resolvedUnidadeId,
      dataEntrada,
      dataSaida,
      status,
      observacoes: payload.observacoes === undefined ? undefined : payload.observacoes,
      parecer: payload.parecer === undefined ? undefined : payload.parecer,
      resultado: payload.resultado === undefined ? undefined : payload.resultado as any,
      responsavelId: payload.responsavelId === undefined ? undefined : payload.responsavelId,
      prazoVencimento,
      diasVencidos,
      automatica: payload.automatica ?? atual.automatica
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

  await prisma.tramitacaoHistorico.create({
    data: {
      tramitacaoId: id,
      acao: 'ATUALIZACAO',
      descricao: 'Tramitação atualizada',
      usuarioId: user?.id,
      dadosAnteriores: atual as any,
      dadosNovos: tramitacao as any
    }
  })

  return createSuccessResponse(tramitacao, 'Tramitação atualizada com sucesso')
}, { permissions: 'tramitacao.manage' })

// DELETE - Excluir tramitação
export const DELETE = withAuth(async (request: NextRequest, { params, user }) => {
  const { id } = await params

  const tramitacao = await prisma.tramitacao.findUnique({
    where: { id }
  })

  if (!tramitacao) {
    throw new NotFoundError('Tramitação não encontrada')
  }

  // Excluir em cascata (históricos e notificações)
  await prisma.$transaction([
    prisma.tramitacaoHistorico.deleteMany({ where: { tramitacaoId: id } }),
    prisma.tramitacaoNotificacao.deleteMany({ where: { tramitacaoId: id } }),
    prisma.tramitacao.delete({ where: { id } })
  ])

  return createSuccessResponse({ id }, 'Tramitação removida com sucesso')
}, { permissions: 'tramitacao.manage' })
