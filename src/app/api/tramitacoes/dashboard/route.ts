import { NextRequest } from 'next/server'

import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
import { createSuccessResponse } from '@/lib/error-handler'
import { registerApiMetric } from '@/lib/monitoring/metrics'

export const dynamic = 'force-dynamic'

export const GET = withAuth(async (_request: NextRequest) => {
  const startedAt = Date.now()

  // Buscar dados em paralelo
  const [
    total,
    emAndamentoCount,
    concluidasCount,
    canceladasCount,
    vencidasCount,
    unidades,
    tiposTramitacao,
    tempoMedioResult,
    proximosVencimentos
  ] = await Promise.all([
    // Total de tramitações
    prisma.tramitacao.count(),

    // Em andamento
    prisma.tramitacao.count({
      where: { status: 'EM_ANDAMENTO' }
    }),

    // Concluídas
    prisma.tramitacao.count({
      where: { status: 'CONCLUIDA' }
    }),

    // Canceladas
    prisma.tramitacao.count({
      where: { status: 'CANCELADA' }
    }),

    // Vencidas (em andamento com prazo ultrapassado)
    prisma.tramitacao.count({
      where: {
        status: 'EM_ANDAMENTO',
        prazoVencimento: { lt: new Date() }
      }
    }),

    // Todas unidades
    prisma.tramitacaoUnidade.findMany({
      where: { ativo: true },
      select: { id: true, nome: true }
    }),

    // Todos tipos de tramitação
    prisma.tramitacaoTipo.findMany({
      where: { ativo: true },
      select: { id: true, nome: true }
    }),

    // Tempo médio de conclusão (raw query para calcular avg)
    prisma.$queryRaw<{ avg_dias: number | null }[]>`
      SELECT AVG(EXTRACT(DAY FROM ("dataSaida" - "dataEntrada")))::numeric as avg_dias
      FROM "tramitacoes"
      WHERE status = 'CONCLUIDA' AND "dataSaida" IS NOT NULL
    `,

    // Próximos vencimentos
    prisma.tramitacao.findMany({
      where: {
        status: 'EM_ANDAMENTO',
        prazoVencimento: { not: null }
      },
      select: {
        id: true,
        proposicaoId: true,
        prazoVencimento: true,
        unidade: { select: { nome: true } },
        tipoTramitacao: { select: { nome: true } }
      },
      orderBy: { prazoVencimento: 'asc' },
      take: 10
    })
  ])

  // Estatísticas por unidade
  const porUnidadePromises = unidades.map(async unidade => {
    const [totalUnidade, emAndamento, concluidas, canceladas] = await Promise.all([
      prisma.tramitacao.count({ where: { unidadeId: unidade.id } }),
      prisma.tramitacao.count({ where: { unidadeId: unidade.id, status: 'EM_ANDAMENTO' } }),
      prisma.tramitacao.count({ where: { unidadeId: unidade.id, status: 'CONCLUIDA' } }),
      prisma.tramitacao.count({ where: { unidadeId: unidade.id, status: 'CANCELADA' } })
    ])
    return {
      unidadeId: unidade.id,
      unidadeNome: unidade.nome,
      total: totalUnidade,
      emAndamento,
      concluidas,
      canceladas
    }
  })

  // Estatísticas por tipo
  const porTipoPromises = tiposTramitacao.map(async tipo => {
    const [totalTipo, emAndamento, concluidas, canceladas] = await Promise.all([
      prisma.tramitacao.count({ where: { tipoTramitacaoId: tipo.id } }),
      prisma.tramitacao.count({ where: { tipoTramitacaoId: tipo.id, status: 'EM_ANDAMENTO' } }),
      prisma.tramitacao.count({ where: { tipoTramitacaoId: tipo.id, status: 'CONCLUIDA' } }),
      prisma.tramitacao.count({ where: { tipoTramitacaoId: tipo.id, status: 'CANCELADA' } })
    ])
    return {
      tipoTramitacaoId: tipo.id,
      tipoTramitacaoNome: tipo.nome,
      total: totalTipo,
      emAndamento,
      concluidas,
      canceladas
    }
  })

  const [porUnidade, porTipo] = await Promise.all([
    Promise.all(porUnidadePromises),
    Promise.all(porTipoPromises)
  ])

  const tempoMedioConclusao = tempoMedioResult[0]?.avg_dias
    ? Math.round(Number(tempoMedioResult[0].avg_dias))
    : null

  const payload = {
    resumo: {
      total,
      emAndamento: emAndamentoCount,
      concluidas: concluidasCount,
      canceladas: canceladasCount,
      vencidas: vencidasCount,
      tempoMedioConclusao
    },
    proximosVencimentos: proximosVencimentos.map(item => ({
      id: item.id,
      proposicaoId: item.proposicaoId,
      prazoVencimento: item.prazoVencimento?.toISOString() ?? null,
      diasRestantes: item.prazoVencimento
        ? Math.max(0, Math.ceil((item.prazoVencimento.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : null,
      unidade: item.unidade?.nome ?? null,
      tipoTramitacao: item.tipoTramitacao?.nome ?? null
    })),
    porUnidade,
    porTipo
  }

  const response = createSuccessResponse(payload, 'Dashboard de tramitação gerado com sucesso')

  registerApiMetric('tramitacoes_dashboard', Date.now() - startedAt, response.status, {
    totalTramitacoes: total
  })

  return response
}, { permissions: 'relatorio.view' })
