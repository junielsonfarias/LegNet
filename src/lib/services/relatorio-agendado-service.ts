/**
 * Serviço de Relatórios Agendados
 * Implementa geração e agendamento de relatórios
 */

import { prisma } from '@/lib/prisma'
import { createLogger } from '@/lib/logging/logger'

const logger = createLogger('relatorio-agendado')

export interface CriarRelatorioAgendadoInput {
  nome: string
  descricao?: string
  tipo: 'PRODUCAO_LEGISLATIVA' | 'PRESENCA_SESSOES' | 'VOTACOES' | 'TRAMITACAO' | 'COMISSOES' | 'TRANSPARENCIA' | 'PERSONALIZADO'
  filtros?: Record<string, any>
  frequencia: 'DIARIO' | 'SEMANAL' | 'QUINZENAL' | 'MENSAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL'
  diaSemana?: number
  diaHora?: string
  destinatarios: string[]
  formato: 'PDF' | 'EXCEL' | 'CSV'
}

export interface ExecutarRelatorioInput {
  tipo: string
  filtros?: Record<string, any>
  formato?: 'PDF' | 'EXCEL' | 'CSV'
}

// Tipos de relatórios disponíveis
export const TIPOS_RELATORIO = {
  PRODUCAO_LEGISLATIVA: 'producao_legislativa',
  PRESENCA_PARLAMENTAR: 'presenca_parlamentar',
  VOTACOES: 'votacoes',
  TRAMITACAO: 'tramitacao',
  PROTOCOLO: 'protocolo',
  PARTICIPACAO_CIDADA: 'participacao_cidada',
  FINANCEIRO: 'financeiro',
  COMISSOES: 'comissoes'
}

/**
 * Cria novo relatório agendado
 */
export async function criarRelatorioAgendado(input: CriarRelatorioAgendadoInput) {
  const relatorio = await prisma.relatorioAgendado.create({
    data: {
      nome: input.nome,
      descricao: input.descricao,
      tipo: input.tipo,
      filtros: JSON.stringify(input.filtros || {}),
      frequencia: input.frequencia,
      diaSemana: input.diaSemana,
      diaHora: input.diaHora,
      destinatarios: JSON.stringify(input.destinatarios),
      formato: input.formato
    }
  })

  logger.info('Relatório agendado criado', {
    action: 'criar_relatorio_agendado',
    relatorioId: relatorio.id,
    tipo: input.tipo
  })

  return relatorio
}

/**
 * Lista relatórios agendados
 */
export async function listarRelatoriosAgendados() {
  return prisma.relatorioAgendado.findMany({
    orderBy: { nome: 'asc' },
    include: {
      _count: {
        select: { execucoes: true }
      }
    }
  })
}

/**
 * Busca relatório agendado por ID
 */
export async function buscarRelatorioAgendado(id: string) {
  return prisma.relatorioAgendado.findUnique({
    where: { id },
    include: {
      execucoes: {
        orderBy: { dataExecucao: 'desc' },
        take: 10
      }
    }
  })
}

/**
 * Atualiza relatório agendado
 */
export async function atualizarRelatorioAgendado(
  id: string,
  input: Partial<CriarRelatorioAgendadoInput>
) {
  const data: Record<string, any> = { ...input }
  if (input.filtros) data.filtros = JSON.stringify(input.filtros)
  if (input.destinatarios) data.destinatarios = JSON.stringify(input.destinatarios)

  const relatorio = await prisma.relatorioAgendado.update({
    where: { id },
    data
  })

  logger.info('Relatório agendado atualizado', {
    action: 'atualizar_relatorio_agendado',
    relatorioId: id
  })

  return relatorio
}

/**
 * Remove relatório agendado
 */
export async function removerRelatorioAgendado(id: string) {
  await prisma.relatorioAgendado.delete({
    where: { id }
  })

  logger.info('Relatório agendado removido', {
    action: 'remover_relatorio_agendado',
    relatorioId: id
  })
}

/**
 * Executa relatório e registra execução
 */
export async function executarRelatorio(
  relatorioId: string,
  input?: ExecutarRelatorioInput
) {
  const inicio = Date.now()

  try {
    // Buscar configuração do relatório
    const relatorio = await prisma.relatorioAgendado.findUnique({
      where: { id: relatorioId }
    })

    if (!relatorio) {
      throw new Error('Relatório não encontrado')
    }

    // Gerar dados do relatório
    const filtros = relatorio.filtros ? JSON.parse(relatorio.filtros) : {}
    const dados = await gerarDadosRelatorio(
      relatorio.tipo,
      filtros
    )

    // Simular geração de arquivo (em produção, gerar PDF/Excel/CSV real)
    const arquivoUrl = `/relatorios/${relatorioId}_${Date.now()}.${relatorio.formato.toLowerCase()}`

    // Registrar execução
    const execucao = await prisma.execucaoRelatorio.create({
      data: {
        relatorioId,
        status: 'SUCESSO',
        arquivoUrl,
        tempoExecucao: Date.now() - inicio
      }
    })

    logger.info('Relatório executado', {
      action: 'executar_relatorio',
      relatorioId,
      execucaoId: execucao.id,
      tempoExecucao: execucao.tempoExecucao
    })

    return {
      execucao,
      dados
    }
  } catch (error: any) {
    // Registrar falha
    await prisma.execucaoRelatorio.create({
      data: {
        relatorioId,
        status: 'ERRO',
        erro: error.message,
        tempoExecucao: Date.now() - inicio
      }
    })

    logger.error('Erro ao executar relatório', {
      action: 'executar_relatorio_erro',
      relatorioId,
      erro: error.message
    })

    throw error
  }
}

/**
 * Gera dados do relatório
 */
async function gerarDadosRelatorio(
  tipo: string,
  filtros: Record<string, any>
): Promise<any> {
  const ano = filtros.ano || new Date().getFullYear()

  switch (tipo) {
    case TIPOS_RELATORIO.PRODUCAO_LEGISLATIVA:
      return gerarRelatorioProducaoLegislativa(ano, filtros)

    case TIPOS_RELATORIO.PRESENCA_PARLAMENTAR:
      return gerarRelatorioPresencaParlamentar(ano, filtros)

    case TIPOS_RELATORIO.VOTACOES:
      return gerarRelatorioVotacoes(ano, filtros)

    case TIPOS_RELATORIO.TRAMITACAO:
      return gerarRelatorioTramitacao(ano, filtros)

    case TIPOS_RELATORIO.PROTOCOLO:
      return gerarRelatorioProtocolo(ano, filtros)

    case TIPOS_RELATORIO.COMISSOES:
      return gerarRelatorioComissoes(ano, filtros)

    default:
      throw new Error(`Tipo de relatório não suportado: ${tipo}`)
  }
}

/**
 * Relatório de Produção Legislativa
 */
async function gerarRelatorioProducaoLegislativa(ano: number, filtros: any) {
  const [
    totalProposicoes,
    porTipo,
    porStatus,
    porAutor,
    porMes
  ] = await Promise.all([
    prisma.proposicao.count({ where: { ano } }),
    prisma.proposicao.groupBy({
      by: ['tipo'],
      where: { ano },
      _count: true
    }),
    prisma.proposicao.groupBy({
      by: ['status'],
      where: { ano },
      _count: true
    }),
    prisma.proposicao.groupBy({
      by: ['autorId'],
      where: { ano },
      _count: true,
      orderBy: { _count: { autorId: 'desc' } },
      take: 10
    }),
    prisma.$queryRaw`
      SELECT
        EXTRACT(MONTH FROM "dataApresentacao") as mes,
        COUNT(*) as total
      FROM proposicoes
      WHERE ano = ${ano}
      GROUP BY EXTRACT(MONTH FROM "dataApresentacao")
      ORDER BY mes
    `
  ])

  // Buscar nomes dos autores
  const autoresIds = porAutor.map(a => a.autorId)
  const autores = await prisma.parlamentar.findMany({
    where: { id: { in: autoresIds } },
    select: { id: true, nome: true, partido: true }
  })

  const autoresMap = new Map(autores.map(a => [a.id, a]))

  return {
    titulo: `Relatório de Produção Legislativa - ${ano}`,
    geradoEm: new Date(),
    resumo: {
      totalProposicoes,
      ano
    },
    porTipo: porTipo.map(t => ({ tipo: t.tipo, quantidade: t._count })),
    porStatus: porStatus.map(s => ({ status: s.status, quantidade: s._count })),
    porAutor: porAutor.map(a => {
      const autor = autoresMap.get(a.autorId)
      return {
        parlamentar: autor?.nome || 'Desconhecido',
        partido: autor?.partido,
        quantidade: a._count
      }
    }),
    porMes
  }
}

/**
 * Relatório de Presença Parlamentar
 */
async function gerarRelatorioPresencaParlamentar(ano: number, filtros: any) {
  const [
    totalSessoes,
    presencas
  ] = await Promise.all([
    prisma.sessao.count({
      where: {
        data: {
          gte: new Date(`${ano}-01-01`),
          lte: new Date(`${ano}-12-31`)
        },
        status: 'CONCLUIDA'
      }
    }),
    prisma.presencaSessao.groupBy({
      by: ['parlamentarId', 'presente'],
      where: {
        sessao: {
          data: {
            gte: new Date(`${ano}-01-01`),
            lte: new Date(`${ano}-12-31`)
          },
          status: 'CONCLUIDA'
        }
      },
      _count: true
    })
  ])

  // Processar presenças por parlamentar
  const presencasPorParlamentar: Record<string, { presentes: number; ausentes: number }> = {}

  presencas.forEach(p => {
    if (!presencasPorParlamentar[p.parlamentarId]) {
      presencasPorParlamentar[p.parlamentarId] = { presentes: 0, ausentes: 0 }
    }
    if (p.presente) {
      presencasPorParlamentar[p.parlamentarId].presentes = p._count
    } else {
      presencasPorParlamentar[p.parlamentarId].ausentes = p._count
    }
  })

  // Buscar parlamentares
  const parlamentaresIds = Object.keys(presencasPorParlamentar)
  const parlamentares = await prisma.parlamentar.findMany({
    where: { id: { in: parlamentaresIds } },
    select: { id: true, nome: true, partido: true }
  })

  const parlamentaresMap = new Map(parlamentares.map(p => [p.id, p]))

  const ranking = Object.entries(presencasPorParlamentar)
    .map(([id, dados]) => {
      const parlamentar = parlamentaresMap.get(id)
      const total = dados.presentes + dados.ausentes
      return {
        parlamentar: parlamentar?.nome || 'Desconhecido',
        partido: parlamentar?.partido,
        presentes: dados.presentes,
        ausentes: dados.ausentes,
        percentual: total > 0 ? Math.round((dados.presentes / total) * 100) : 0
      }
    })
    .sort((a, b) => b.percentual - a.percentual)

  return {
    titulo: `Relatório de Presença Parlamentar - ${ano}`,
    geradoEm: new Date(),
    resumo: {
      totalSessoes,
      ano
    },
    ranking
  }
}

/**
 * Relatório de Votações
 */
async function gerarRelatorioVotacoes(ano: number, filtros: any) {
  const [
    totalVotacoes,
    porResultado,
    votacoesPorParlamentar
  ] = await Promise.all([
    prisma.votacao.count({
      where: {
        createdAt: {
          gte: new Date(`${ano}-01-01`),
          lte: new Date(`${ano}-12-31`)
        }
      }
    }),
    prisma.votacao.groupBy({
      by: ['voto'],
      where: {
        createdAt: {
          gte: new Date(`${ano}-01-01`),
          lte: new Date(`${ano}-12-31`)
        }
      },
      _count: true
    }),
    prisma.votacao.groupBy({
      by: ['parlamentarId'],
      where: {
        createdAt: {
          gte: new Date(`${ano}-01-01`),
          lte: new Date(`${ano}-12-31`)
        }
      },
      _count: true
    })
  ])

  return {
    titulo: `Relatório de Votações - ${ano}`,
    geradoEm: new Date(),
    resumo: {
      totalVotacoes,
      ano
    },
    porResultado: porResultado.map(r => ({ voto: r.voto, quantidade: r._count })),
    totalParlamentaresVotantes: votacoesPorParlamentar.length
  }
}

/**
 * Relatório de Tramitação
 */
async function gerarRelatorioTramitacao(ano: number, filtros: any) {
  const [
    totalTramitacoes,
    porUnidade,
    tempoMedio
  ] = await Promise.all([
    prisma.tramitacao.count({
      where: {
        dataEntrada: {
          gte: new Date(`${ano}-01-01`),
          lte: new Date(`${ano}-12-31`)
        }
      }
    }),
    prisma.tramitacao.groupBy({
      by: ['unidadeId'],
      where: {
        dataEntrada: {
          gte: new Date(`${ano}-01-01`),
          lte: new Date(`${ano}-12-31`)
        }
      },
      _count: true
    }),
    prisma.$queryRaw`
      SELECT AVG(EXTRACT(EPOCH FROM ("updatedAt" - "createdAt"))) / 86400 as dias_medio
      FROM tramitacoes
      WHERE EXTRACT(YEAR FROM data) = ${ano}
    `
  ])

  return {
    titulo: `Relatório de Tramitação - ${ano}`,
    geradoEm: new Date(),
    resumo: {
      totalTramitacoes,
      ano,
      tempoMedio
    },
    porUnidade
  }
}

/**
 * Relatório de Protocolo
 */
async function gerarRelatorioProtocolo(ano: number, filtros: any) {
  const [
    total,
    porTipo,
    porSituacao,
    porPrioridade
  ] = await Promise.all([
    prisma.protocolo.count({ where: { ano } }),
    prisma.protocolo.groupBy({
      by: ['tipo'],
      where: { ano },
      _count: true
    }),
    prisma.protocolo.groupBy({
      by: ['situacao'],
      where: { ano },
      _count: true
    }),
    prisma.protocolo.groupBy({
      by: ['prioridade'],
      where: { ano },
      _count: true
    })
  ])

  return {
    titulo: `Relatório de Protocolo - ${ano}`,
    geradoEm: new Date(),
    resumo: { total, ano },
    porTipo: porTipo.map(t => ({ tipo: t.tipo, quantidade: t._count })),
    porSituacao: porSituacao.map(s => ({ situacao: s.situacao, quantidade: s._count })),
    porPrioridade: porPrioridade.map(p => ({ prioridade: p.prioridade, quantidade: p._count }))
  }
}

/**
 * Relatório de Comissões
 */
async function gerarRelatorioComissoes(ano: number, filtros: any) {
  const [
    totalComissoes,
    totalPareceres,
    pareceresPorComissao
  ] = await Promise.all([
    prisma.comissao.count({ where: { ativa: true } }),
    prisma.parecer.count({
      where: {
        createdAt: {
          gte: new Date(`${ano}-01-01`),
          lte: new Date(`${ano}-12-31`)
        }
      }
    }),
    prisma.parecer.groupBy({
      by: ['comissaoId'],
      where: {
        createdAt: {
          gte: new Date(`${ano}-01-01`),
          lte: new Date(`${ano}-12-31`)
        }
      },
      _count: true
    })
  ])

  // Buscar nomes das comissões
  const comissoesIds = pareceresPorComissao.map(p => p.comissaoId)
  const comissoes = await prisma.comissao.findMany({
    where: { id: { in: comissoesIds } },
    select: { id: true, nome: true, sigla: true }
  })

  const comissoesMap = new Map(comissoes.map(c => [c.id, c]))

  return {
    titulo: `Relatório de Comissões - ${ano}`,
    geradoEm: new Date(),
    resumo: {
      totalComissoes,
      totalPareceres,
      ano
    },
    pareceresPorComissao: pareceresPorComissao.map(p => {
      const comissao = comissoesMap.get(p.comissaoId)
      return {
        comissao: comissao?.nome || 'Desconhecida',
        sigla: comissao?.sigla,
        quantidade: p._count
      }
    })
  }
}

/**
 * Lista tipos de relatórios disponíveis
 */
export function listarTiposRelatorio() {
  return [
    { id: TIPOS_RELATORIO.PRODUCAO_LEGISLATIVA, nome: 'Produção Legislativa', descricao: 'Proposições apresentadas por tipo, status e autor' },
    { id: TIPOS_RELATORIO.PRESENCA_PARLAMENTAR, nome: 'Presença Parlamentar', descricao: 'Frequência dos parlamentares nas sessões' },
    { id: TIPOS_RELATORIO.VOTACOES, nome: 'Votações', descricao: 'Estatísticas de votações nominais' },
    { id: TIPOS_RELATORIO.TRAMITACAO, nome: 'Tramitação', descricao: 'Movimentação de processos' },
    { id: TIPOS_RELATORIO.PROTOCOLO, nome: 'Protocolo', descricao: 'Documentos de entrada e saída' },
    { id: TIPOS_RELATORIO.COMISSOES, nome: 'Comissões', descricao: 'Pareceres emitidos pelas comissões' }
  ]
}
