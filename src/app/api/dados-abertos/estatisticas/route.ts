import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandler } from '@/lib/error-handler'
import { withPublicCache } from '@/lib/http-cache'


export const GET = withErrorHandler(async (_request: NextRequest) => {
  const anoAtual = new Date().getFullYear()
  const inicioAno = new Date(anoAtual, 0, 1)

  // Queries em paralelo para performance
  const [
    totalProposicoes,
    proposicoesPorStatus,
    proposicoesPorMes,
    totalSessoes,
    sessoesPorStatus,
    totalParlamentares
  ] = await Promise.all([
    // Total proposições do ano
    prisma.proposicao.count({
      where: { dataApresentacao: { gte: inicioAno } }
    }),

    // Proposições por status (do ano)
    prisma.proposicao.groupBy({
      by: ['status'],
      _count: true,
      where: { dataApresentacao: { gte: inicioAno } }
    }),

    // Proposições por mês (últimos 6 meses)
    prisma.$queryRaw`
      SELECT
        TO_CHAR("dataApresentacao", 'YYYY-MM') as mes,
        TO_CHAR("dataApresentacao", 'Mon') as mes_label,
        COUNT(*)::int as total
      FROM proposicoes
      WHERE "dataApresentacao" >= NOW() - INTERVAL '6 months'
      GROUP BY mes, mes_label
      ORDER BY mes ASC
    ` as Promise<Array<{ mes: string; mes_label: string; total: number }>>,

    // Total sessões do ano
    prisma.sessao.count({
      where: { data: { gte: inicioAno } }
    }),

    // Sessões por status
    prisma.sessao.groupBy({
      by: ['status'],
      _count: true,
      where: { data: { gte: inicioAno } }
    }),

    // Total parlamentares ativos
    prisma.parlamentar.count({
      where: { ativo: true }
    })
  ])

  // Formatar dados
  const statusMap: Record<string, number> = {}
  proposicoesPorStatus.forEach(s => {
    statusMap[s.status] = s._count
  })

  const sessoesMap: Record<string, number> = {}
  sessoesPorStatus.forEach(s => {
    sessoesMap[s.status] = s._count
  })

  return withPublicCache(
    NextResponse.json({
    success: true,
    data: {
      ano: anoAtual,
      proposicoes: {
        total: totalProposicoes,
        aprovadas: statusMap['APROVADA'] || 0,
        rejeitadas: statusMap['REJEITADA'] || 0,
        emTramitacao: statusMap['EM_TRAMITACAO'] || 0,
        porMes: proposicoesPorMes
      },
      sessoes: {
        total: totalSessoes,
        realizadas: sessoesMap['CONCLUIDA'] || 0,
        agendadas: sessoesMap['AGENDADA'] || 0
      },
      parlamentares: totalParlamentares
    }
  }),
    { maxAge: 60, swr: 300 }
  )
})
