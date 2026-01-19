/**
 * Serviço de Analytics e Dashboard
 * Implementa MEL-003: Dashboard com métricas legislativas
 *
 * Funcionalidades:
 * - Cálculo de produtividade legislativa
 * - Estatísticas de participação
 * - Gráficos de tendências
 * - Métricas por período
 * - Relatórios gerenciais
 */

import { prisma } from '@/lib/prisma'
import { createLogger } from '@/lib/logging/logger'
import {
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  differenceInDays,
  formatDateShort,
  formatDateLong
} from '@/lib/utils/date'

const logger = createLogger('analytics')

// Período para análise
export interface PeriodoAnalise {
  inicio: Date
  fim: Date
  nome?: string
}

// Métricas de proposições
export interface MetricasProposicoes {
  total: number
  porTipo: Record<string, number>
  porStatus: Record<string, number>
  porAutor: Array<{ autorId: string; nome: string; quantidade: number }>
  porMes: Array<{ mes: string; quantidade: number }>
  taxaAprovacao: number
  tempoMedioTramitacao: number
}

// Métricas de sessões
export interface MetricasSessoes {
  total: number
  porTipo: Record<string, number>
  porStatus: Record<string, number>
  porMes: Array<{ mes: string; quantidade: number }>
  duracaoMedia: number
  presencaMedia: number
}

// Métricas de votações
export interface MetricasVotacoes {
  total: number
  aprovadas: number
  rejeitadas: number
  empates: number
  participacaoMedia: number
  porMes: Array<{ mes: string; aprovadas: number; rejeitadas: number }>
}

// Métricas de parlamentares
export interface MetricasParlamentar {
  parlamentarId: string
  nome: string
  proposicoesApresentadas: number
  proposicoesAprovadas: number
  presencaSessoes: number
  totalSessoes: number
  taxaPresenca: number
  participacaoVotacoes: number
  totalVotacoes: number
  taxaParticipacaoVotacoes: number
}

// Dashboard completo
export interface DashboardMetrics {
  periodo: PeriodoAnalise
  proposicoes: MetricasProposicoes
  sessoes: MetricasSessoes
  votacoes: MetricasVotacoes
  destaques: {
    proposicoesMaisVotadas: Array<{ id: string; numero: string; votos: number }>
    parlamentaresMaisAtivos: Array<{ id: string; nome: string; proposicoes: number }>
    sessoesComMaisItens: Array<{ id: string; data: string; itens: number }>
  }
  comparativo?: {
    periodoAnterior: PeriodoAnalise
    variacaoProposicoes: number
    variacaoSessoes: number
    variacaoAprovacoes: number
  }
}

/**
 * Calcula métricas de proposições para um período
 */
export async function calcularMetricasProposicoes(
  periodo: PeriodoAnalise
): Promise<MetricasProposicoes> {
  const { inicio, fim } = periodo

  // Total de proposições no período
  const proposicoes = await prisma.proposicao.findMany({
    where: {
      dataApresentacao: {
        gte: inicio,
        lte: fim
      }
    },
    include: {
      autor: {
        select: { id: true, nome: true }
      }
    }
  })

  // Por tipo
  const porTipo: Record<string, number> = {}
  for (const p of proposicoes) {
    porTipo[p.tipo] = (porTipo[p.tipo] || 0) + 1
  }

  // Por status
  const porStatus: Record<string, number> = {}
  for (const p of proposicoes) {
    porStatus[p.status] = (porStatus[p.status] || 0) + 1
  }

  // Por autor
  const autorCount: Record<string, { nome: string; quantidade: number }> = {}
  for (const p of proposicoes) {
    if (p.autor) {
      if (!autorCount[p.autor.id]) {
        autorCount[p.autor.id] = { nome: p.autor.nome, quantidade: 0 }
      }
      autorCount[p.autor.id].quantidade++
    }
  }
  const porAutor = Object.entries(autorCount)
    .map(([autorId, data]) => ({ autorId, ...data }))
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, 10)

  // Por mês
  const porMes: Array<{ mes: string; quantidade: number }> = []
  const mesesMap: Record<string, number> = {}
  for (const p of proposicoes) {
    const mes = formatDateShort(p.dataApresentacao).substring(3) // MM/YYYY
    mesesMap[mes] = (mesesMap[mes] || 0) + 1
  }
  for (const [mes, quantidade] of Object.entries(mesesMap)) {
    porMes.push({ mes, quantidade })
  }
  porMes.sort((a, b) => a.mes.localeCompare(b.mes))

  // Taxa de aprovação
  const aprovadas = proposicoes.filter(p => p.status === 'APROVADA').length
  const votadas = proposicoes.filter(p =>
    ['APROVADA', 'REJEITADA', 'ARQUIVADA'].includes(p.status)
  ).length
  const taxaAprovacao = votadas > 0 ? (aprovadas / votadas) * 100 : 0

  // Tempo médio de tramitação (proposições concluídas)
  const concluidas = proposicoes.filter(p =>
    p.status === 'APROVADA' || p.status === 'REJEITADA'
  )
  let tempoTotal = 0
  for (const p of concluidas) {
    const dataFim = p.dataVotacao || p.updatedAt
    tempoTotal += differenceInDays(dataFim, p.dataApresentacao)
  }
  const tempoMedioTramitacao = concluidas.length > 0
    ? tempoTotal / concluidas.length
    : 0

  logger.debug('Métricas de proposições calculadas', {
    action: 'calcular_metricas_proposicoes',
    periodo: { inicio, fim },
    total: proposicoes.length
  })

  return {
    total: proposicoes.length,
    porTipo,
    porStatus,
    porAutor,
    porMes,
    taxaAprovacao: Math.round(taxaAprovacao * 100) / 100,
    tempoMedioTramitacao: Math.round(tempoMedioTramitacao)
  }
}

/**
 * Calcula métricas de sessões para um período
 */
export async function calcularMetricasSessoes(
  periodo: PeriodoAnalise
): Promise<MetricasSessoes> {
  const { inicio, fim } = periodo

  const sessoes = await prisma.sessao.findMany({
    where: {
      data: {
        gte: inicio,
        lte: fim
      }
    },
    include: {
      presencas: true
    }
  })

  // Por tipo
  const porTipo: Record<string, number> = {}
  for (const s of sessoes) {
    porTipo[s.tipo] = (porTipo[s.tipo] || 0) + 1
  }

  // Por status
  const porStatus: Record<string, number> = {}
  for (const s of sessoes) {
    porStatus[s.status] = (porStatus[s.status] || 0) + 1
  }

  // Por mês
  const porMes: Array<{ mes: string; quantidade: number }> = []
  const mesesMap: Record<string, number> = {}
  for (const s of sessoes) {
    const mes = formatDateShort(s.data).substring(3)
    mesesMap[mes] = (mesesMap[mes] || 0) + 1
  }
  for (const [mes, quantidade] of Object.entries(mesesMap)) {
    porMes.push({ mes, quantidade })
  }
  porMes.sort((a, b) => a.mes.localeCompare(b.mes))

  // Duração média (em minutos) - estimativa baseada em tipo de sessão
  // Nota: O modelo atual só tem horário de início, não tem horário de fim
  const DURACAO_ESTIMADA_POR_TIPO: Record<string, number> = {
    ORDINARIA: 120,      // 2 horas
    EXTRAORDINARIA: 90,  // 1:30h
    SOLENE: 60,          // 1 hora
    ESPECIAL: 90         // 1:30h
  }
  let duracaoTotal = 0
  for (const s of sessoes) {
    duracaoTotal += DURACAO_ESTIMADA_POR_TIPO[s.tipo] || 120
  }
  const duracaoMedia = sessoes.length > 0
    ? duracaoTotal / sessoes.length
    : 0

  // Presença média
  const totalParlamentares = await prisma.parlamentar.count({ where: { ativo: true } })
  let presencaTotal = 0
  for (const s of sessoes) {
    const presentes = s.presencas.filter(p => p.presente).length
    presencaTotal += totalParlamentares > 0 ? (presentes / totalParlamentares) * 100 : 0
  }
  const presencaMedia = sessoes.length > 0 ? presencaTotal / sessoes.length : 0

  return {
    total: sessoes.length,
    porTipo,
    porStatus,
    porMes,
    duracaoMedia: Math.round(duracaoMedia),
    presencaMedia: Math.round(presencaMedia * 100) / 100
  }
}

/**
 * Calcula métricas de votações para um período
 */
export async function calcularMetricasVotacoes(
  periodo: PeriodoAnalise
): Promise<MetricasVotacoes> {
  const { inicio, fim } = periodo

  // Busca proposições votadas no período
  const proposicoesVotadas = await prisma.proposicao.findMany({
    where: {
      dataVotacao: {
        gte: inicio,
        lte: fim
      },
      status: {
        in: ['APROVADA', 'REJEITADA']
      }
    }
  })

  const aprovadas = proposicoesVotadas.filter(p => p.status === 'APROVADA').length
  const rejeitadas = proposicoesVotadas.filter(p => p.status === 'REJEITADA').length

  // Por mês
  const porMes: Array<{ mes: string; aprovadas: number; rejeitadas: number }> = []
  const mesesMap: Record<string, { aprovadas: number; rejeitadas: number }> = {}

  for (const p of proposicoesVotadas) {
    if (p.dataVotacao) {
      const mes = formatDateShort(p.dataVotacao).substring(3)
      if (!mesesMap[mes]) {
        mesesMap[mes] = { aprovadas: 0, rejeitadas: 0 }
      }
      if (p.status === 'APROVADA') {
        mesesMap[mes].aprovadas++
      } else {
        mesesMap[mes].rejeitadas++
      }
    }
  }

  for (const [mes, dados] of Object.entries(mesesMap)) {
    porMes.push({ mes, ...dados })
  }
  porMes.sort((a, b) => a.mes.localeCompare(b.mes))

  // Participação média em votações
  const totalParlamentares = await prisma.parlamentar.count({ where: { ativo: true } })
  const votos = await prisma.votacao.findMany({
    where: {
      proposicao: {
        dataVotacao: {
          gte: inicio,
          lte: fim
        }
      }
    }
  })

  // Agrupa por proposição para calcular participação
  const votosPorProposicao: Record<string, number> = {}
  for (const v of votos) {
    votosPorProposicao[v.proposicaoId] = (votosPorProposicao[v.proposicaoId] || 0) + 1
  }

  let participacaoTotal = 0
  const numProposicoes = Object.keys(votosPorProposicao).length
  for (const qtd of Object.values(votosPorProposicao)) {
    participacaoTotal += totalParlamentares > 0 ? (qtd / totalParlamentares) * 100 : 0
  }
  const participacaoMedia = numProposicoes > 0 ? participacaoTotal / numProposicoes : 0

  return {
    total: proposicoesVotadas.length,
    aprovadas,
    rejeitadas,
    empates: 0, // Simplificado
    participacaoMedia: Math.round(participacaoMedia * 100) / 100,
    porMes
  }
}

/**
 * Calcula métricas individuais de parlamentares
 */
export async function calcularMetricasParlamentares(
  periodo: PeriodoAnalise
): Promise<MetricasParlamentar[]> {
  const { inicio, fim } = periodo

  const parlamentares = await prisma.parlamentar.findMany({
    where: { ativo: true },
    include: {
      proposicoes: {
        where: {
          dataApresentacao: {
            gte: inicio,
            lte: fim
          }
        }
      },
      presencas: {
        where: {
          sessao: {
            data: {
              gte: inicio,
              lte: fim
            }
          }
        }
      },
      votacoes: {
        where: {
          proposicao: {
            dataVotacao: {
              gte: inicio,
              lte: fim
            }
          }
        }
      }
    }
  })

  // Total de sessões e votações no período
  const totalSessoes = await prisma.sessao.count({
    where: {
      data: { gte: inicio, lte: fim },
      status: 'CONCLUIDA'
    }
  })

  const totalVotacoes = await prisma.proposicao.count({
    where: {
      dataVotacao: { gte: inicio, lte: fim },
      status: { in: ['APROVADA', 'REJEITADA'] }
    }
  })

  const metricas: MetricasParlamentar[] = parlamentares.map(p => {
    const proposicoesApresentadas = p.proposicoes.length
    const proposicoesAprovadas = p.proposicoes.filter(
      prop => prop.status === 'APROVADA'
    ).length
    const presencaSessoes = p.presencas.filter(pr => pr.presente).length
    const participacaoVotacoes = p.votacoes.length

    return {
      parlamentarId: p.id,
      nome: p.nome,
      proposicoesApresentadas,
      proposicoesAprovadas,
      presencaSessoes,
      totalSessoes,
      taxaPresenca: totalSessoes > 0
        ? Math.round((presencaSessoes / totalSessoes) * 100 * 100) / 100
        : 0,
      participacaoVotacoes,
      totalVotacoes,
      taxaParticipacaoVotacoes: totalVotacoes > 0
        ? Math.round((participacaoVotacoes / totalVotacoes) * 100 * 100) / 100
        : 0
    }
  })

  // Ordena por taxa de presença
  metricas.sort((a, b) => b.taxaPresenca - a.taxaPresenca)

  return metricas
}

/**
 * Gera dashboard completo com todas as métricas
 */
export async function gerarDashboard(
  periodo: PeriodoAnalise,
  incluirComparativo: boolean = false
): Promise<DashboardMetrics> {
  const [proposicoes, sessoes, votacoes] = await Promise.all([
    calcularMetricasProposicoes(periodo),
    calcularMetricasSessoes(periodo),
    calcularMetricasVotacoes(periodo)
  ])

  // Destaques
  const proposicoesMaisVotadas = await prisma.proposicao.findMany({
    where: {
      dataVotacao: { gte: periodo.inicio, lte: periodo.fim }
    },
    include: {
      _count: {
        select: { votacoes: true }
      }
    },
    orderBy: {
      votacoes: { _count: 'desc' }
    },
    take: 5
  })

  const parlamentaresMaisAtivos = proposicoes.porAutor.slice(0, 5).map(a => ({
    id: a.autorId,
    nome: a.nome,
    proposicoes: a.quantidade
  }))

  const sessoesComMaisItens = await prisma.sessao.findMany({
    where: {
      data: { gte: periodo.inicio, lte: periodo.fim }
    },
    include: {
      pautaSessao: {
        include: {
          _count: { select: { itens: true } }
        }
      }
    },
    orderBy: {
      data: 'desc'
    },
    take: 5
  })

  const dashboard: DashboardMetrics = {
    periodo,
    proposicoes,
    sessoes,
    votacoes,
    destaques: {
      proposicoesMaisVotadas: proposicoesMaisVotadas.map(p => ({
        id: p.id,
        numero: p.numero,
        votos: p._count.votacoes
      })),
      parlamentaresMaisAtivos,
      sessoesComMaisItens: sessoesComMaisItens.map(s => ({
        id: s.id,
        data: formatDateShort(s.data),
        itens: s.pautaSessao?._count?.itens || 0
      }))
    }
  }

  // Comparativo com período anterior
  if (incluirComparativo) {
    const duracaoPeriodo = differenceInDays(periodo.fim, periodo.inicio)
    const periodoAnterior: PeriodoAnalise = {
      inicio: new Date(periodo.inicio.getTime() - duracaoPeriodo * 24 * 60 * 60 * 1000),
      fim: new Date(periodo.inicio.getTime() - 1),
      nome: 'Período anterior'
    }

    const [propAnterior, sessAnterior, votAnterior] = await Promise.all([
      calcularMetricasProposicoes(periodoAnterior),
      calcularMetricasSessoes(periodoAnterior),
      calcularMetricasVotacoes(periodoAnterior)
    ])

    dashboard.comparativo = {
      periodoAnterior,
      variacaoProposicoes: propAnterior.total > 0
        ? ((proposicoes.total - propAnterior.total) / propAnterior.total) * 100
        : 0,
      variacaoSessoes: sessAnterior.total > 0
        ? ((sessoes.total - sessAnterior.total) / sessAnterior.total) * 100
        : 0,
      variacaoAprovacoes: votAnterior.aprovadas > 0
        ? ((votacoes.aprovadas - votAnterior.aprovadas) / votAnterior.aprovadas) * 100
        : 0
    }
  }

  logger.info('Dashboard gerado', {
    action: 'gerar_dashboard',
    periodo: { inicio: periodo.inicio, fim: periodo.fim },
    proposicoes: proposicoes.total,
    sessoes: sessoes.total,
    votacoes: votacoes.total
  })

  return dashboard
}

/**
 * Gera dashboard para o mês atual
 */
export async function gerarDashboardMesAtual(): Promise<DashboardMetrics> {
  const hoje = new Date()
  const periodo: PeriodoAnalise = {
    inicio: startOfMonth(hoje),
    fim: endOfMonth(hoje),
    nome: `${formatDateShort(hoje).substring(3)}`
  }

  return gerarDashboard(periodo, true)
}

/**
 * Gera dashboard para o ano atual
 */
export async function gerarDashboardAnoAtual(): Promise<DashboardMetrics> {
  const hoje = new Date()
  const periodo: PeriodoAnalise = {
    inicio: startOfYear(hoje),
    fim: endOfYear(hoje),
    nome: String(hoje.getFullYear())
  }

  return gerarDashboard(periodo, true)
}

/**
 * Gera relatório de produtividade legislativa
 */
export async function gerarRelatorioProdutividade(
  periodo: PeriodoAnalise
): Promise<{
  periodo: PeriodoAnalise
  indicadores: {
    proposicoesApresentadas: number
    proposicoesAprovadas: number
    taxaAprovacao: number
    sessoesRealizadas: number
    presencaMedia: number
    tempoMedioTramitacao: number
  }
  ranking: {
    parlamentares: MetricasParlamentar[]
    comissoes: Array<{ id: string; nome: string; pareceresEmitidos: number }>
  }
  tendencias: {
    proposicoesPorMes: Array<{ mes: string; quantidade: number }>
    aprovacoesPorMes: Array<{ mes: string; aprovadas: number; rejeitadas: number }>
  }
}> {
  const [proposicoes, sessoes, votacoes, parlamentares] = await Promise.all([
    calcularMetricasProposicoes(periodo),
    calcularMetricasSessoes(periodo),
    calcularMetricasVotacoes(periodo),
    calcularMetricasParlamentares(periodo)
  ])

  // Comissões com mais pareceres
  // Conta pareceres via tramitações que passaram por unidades do tipo COMISSAO
  const tramitacoesComParecer = await prisma.tramitacao.findMany({
    where: {
      parecer: { not: null },
      unidade: { tipo: 'COMISSAO' },
      createdAt: { gte: periodo.inicio, lte: periodo.fim }
    },
    select: {
      unidadeId: true,
      unidade: { select: { nome: true } }
    }
  })

  // Agrupa por unidade (comissão)
  const pareceresPorUnidade: Record<string, { nome: string; count: number }> = {}
  for (const t of tramitacoesComParecer) {
    if (!pareceresPorUnidade[t.unidadeId]) {
      pareceresPorUnidade[t.unidadeId] = { nome: t.unidade.nome, count: 0 }
    }
    pareceresPorUnidade[t.unidadeId].count++
  }

  const rankingComissoes = Object.entries(pareceresPorUnidade)
    .map(([id, data]) => ({
      id,
      nome: data.nome,
      pareceresEmitidos: data.count
    }))
    .sort((a, b) => b.pareceresEmitidos - a.pareceresEmitidos)
    .slice(0, 5)

  return {
    periodo,
    indicadores: {
      proposicoesApresentadas: proposicoes.total,
      proposicoesAprovadas: votacoes.aprovadas,
      taxaAprovacao: proposicoes.taxaAprovacao,
      sessoesRealizadas: sessoes.total,
      presencaMedia: sessoes.presencaMedia,
      tempoMedioTramitacao: proposicoes.tempoMedioTramitacao
    },
    ranking: {
      parlamentares: parlamentares.slice(0, 10),
      comissoes: rankingComissoes
    },
    tendencias: {
      proposicoesPorMes: proposicoes.porMes,
      aprovacoesPorMes: votacoes.porMes
    }
  }
}

/**
 * Resumo das funcionalidades de analytics
 */
export const FUNCIONALIDADES_ANALYTICS = {
  'calcularMetricasProposicoes': 'Calcula métricas de proposições por período',
  'calcularMetricasSessoes': 'Calcula métricas de sessões por período',
  'calcularMetricasVotacoes': 'Calcula métricas de votações por período',
  'calcularMetricasParlamentares': 'Calcula métricas individuais de parlamentares',
  'gerarDashboard': 'Gera dashboard completo com todas as métricas',
  'gerarDashboardMesAtual': 'Dashboard do mês atual com comparativo',
  'gerarDashboardAnoAtual': 'Dashboard do ano atual com comparativo',
  'gerarRelatorioProdutividade': 'Relatório completo de produtividade legislativa'
}
