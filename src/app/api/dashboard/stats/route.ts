import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'

// Configurar para renderização dinâmica
export const dynamic = 'force-dynamic'

// GET - Buscar estatísticas do dashboard
export const GET = withAuth(async (request: NextRequest, _ctx, session) => {
  const userRole = session?.user?.role || 'USER'
  const userId = session?.user?.id

  // Buscar configuração institucional
  const configInstitucional = await prisma.configuracaoInstitucional.findFirst({
    where: { slug: 'principal' }
  })

  // Buscar legislatura ativa
  const legislaturaAtiva = await prisma.legislatura.findFirst({
    where: { ativa: true },
    include: {
      periodos: {
        where: {
          dataInicio: { lte: new Date() },
          OR: [
            { dataFim: null },
            { dataFim: { gte: new Date() } }
          ]
        },
        orderBy: { numero: 'desc' },
        take: 1
      }
    }
  })

  // Contagens básicas
  const [
    totalParlamentares,
    parlamentaresAtivos,
    totalSessoes,
    sessoesRealizadas,
    sessoesAgendadas,
    totalProposicoes,
    proposicoesAprovadas,
    proposicoesEmTramitacao,
    proposicoesPendentes,
    totalComissoes,
    comissoesAtivas,
    totalMembrosComissao,
    totalNoticias,
    totalUsuarios,
    votacoesHoje
  ] = await Promise.all([
    prisma.parlamentar.count(),
    prisma.parlamentar.count({ where: { ativo: true } }),
    prisma.sessao.count(),
    prisma.sessao.count({ where: { status: 'CONCLUIDA' } }),
    prisma.sessao.count({ where: { status: 'AGENDADA' } }),
    prisma.proposicao.count(),
    prisma.proposicao.count({ where: { status: 'APROVADA' } }),
    prisma.proposicao.count({ where: { status: 'EM_TRAMITACAO' } }),
    prisma.proposicao.count({
      where: {
        status: { in: ['APRESENTADA', 'EM_TRAMITACAO', 'AGUARDANDO_PAUTA', 'EM_PAUTA'] }
      }
    }),
    prisma.comissao.count(),
    prisma.comissao.count({ where: { ativa: true } }),
    prisma.membroComissao.count({ where: { ativo: true } }),
    prisma.noticia.count(),
    prisma.user.count(),
    // Votações de hoje
    prisma.votacao.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      }
    })
  ])

  // Buscar próxima sessão agendada
  const proximaSessao = await prisma.sessao.findFirst({
    where: {
      status: 'AGENDADA',
      data: { gte: new Date() }
    },
    orderBy: { data: 'asc' },
    select: {
      id: true,
      numero: true,
      tipo: true,
      data: true,
      horario: true
    }
  })

  // Sessão em andamento (se houver)
  const sessaoEmAndamento = await prisma.sessao.findFirst({
    where: { status: 'EM_ANDAMENTO' },
    include: {
      presencas: true,
      pautaSessao: {
        include: {
          itens: true
        }
      }
    }
  })

  // Estatisticas especificas para PARLAMENTAR
  let estatisticasParlamentar: { minhasProposicoes: number; aprovadas: number; emTramitacao: number } | null = null
  if (userRole === 'PARLAMENTAR' && userId) {
    const parlamentar = await prisma.parlamentar.findFirst({
      where: {
        usuario: { id: userId }
      }
    })

    if (parlamentar) {
      const [minhasProposicoes, aprovadas, emTramitacao] = await Promise.all([
        prisma.proposicao.count({ where: { autorId: parlamentar.id } }),
        prisma.proposicao.count({ where: { autorId: parlamentar.id, status: 'APROVADA' } }),
        prisma.proposicao.count({ where: { autorId: parlamentar.id, status: 'EM_TRAMITACAO' } })
      ])

      estatisticasParlamentar = {
        minhasProposicoes,
        aprovadas,
        emTramitacao
      }
    }
  }

  // Calcular presença média (se houver sessões concluídas)
  let presencaMedia = 0
  if (sessoesRealizadas > 0) {
    const presencas = await prisma.presencaSessao.groupBy({
      by: ['presente'],
      _count: true
    })
    const totalPresencas = presencas.reduce((acc, p) => acc + p._count, 0)
    const presentes = presencas.find(p => p.presente === true)?._count || 0
    presencaMedia = totalPresencas > 0 ? Math.round((presentes / totalPresencas) * 100) : 0
  }

  // Contar logs de hoje (para estatísticas do sistema)
  let logsHoje = 0
  try {
    logsHoje = await prisma.auditLog.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    })
  } catch {
    // AuditLog pode não existir ainda
    logsHoje = 0
  }

  // Montar resposta
  const stats = {
    // Dados institucionais
    instituicao: {
      nome: configInstitucional?.nomeCasa || 'Câmara Municipal',
      sigla: configInstitucional?.sigla || null,
      cidade: configInstitucional?.enderecoCidade || null,
      estado: configInstitucional?.enderecoEstado || null,
      legislatura: legislaturaAtiva ? {
        id: legislaturaAtiva.id,
        numero: legislaturaAtiva.numero,
        descricao: `${legislaturaAtiva.anoInicio}/${legislaturaAtiva.anoFim}`,
        periodoAtual: legislaturaAtiva.periodos[0] ? {
          numero: legislaturaAtiva.periodos[0].numero,
          descricao: legislaturaAtiva.periodos[0].descricao
        } : null
      } : null
    },

    // Contagens gerais
    parlamentares: {
      total: totalParlamentares,
      ativos: parlamentaresAtivos,
      presencaMedia
    },
    sessoes: {
      total: totalSessoes,
      realizadas: sessoesRealizadas,
      agendadas: sessoesAgendadas,
      canceladas: totalSessoes - sessoesRealizadas - sessoesAgendadas
    },
    proposicoes: {
      total: totalProposicoes,
      aprovadas: proposicoesAprovadas,
      emTramitacao: proposicoesEmTramitacao,
      pendentes: proposicoesPendentes,
      rejeitadas: totalProposicoes - proposicoesAprovadas - proposicoesEmTramitacao - proposicoesPendentes
    },
    comissoes: {
      total: totalComissoes,
      ativas: comissoesAtivas,
      membros: totalMembrosComissao
    },
    noticias: {
      total: totalNoticias
    },

    // Estatísticas do dia
    hoje: {
      votacoes: votacoesHoje
    },

    // Sistema
    sistema: {
      usuarios: totalUsuarios,
      logsHoje,
      uptime: '99.9%' // TODO: Implementar monitoramento real
    },

    // Sessão atual/próxima
    sessaoAtual: sessaoEmAndamento ? {
      id: sessaoEmAndamento.id,
      numero: sessaoEmAndamento.numero,
      tipo: sessaoEmAndamento.tipo,
      presentes: sessaoEmAndamento.presencas.filter(p => p.presente).length,
      totalParlamentares: parlamentaresAtivos,
      itensNaPauta: sessaoEmAndamento.pautaSessao?.itens.length || 0
    } : null,

    proximaSessao: proximaSessao ? {
      id: proximaSessao.id,
      numero: proximaSessao.numero,
      tipo: proximaSessao.tipo,
      data: proximaSessao.data,
      horario: proximaSessao.horario
    } : null,

    // Estatísticas específicas do parlamentar (se aplicável)
    parlamentar: estatisticasParlamentar
  }

  return createSuccessResponse(stats, 'Estatísticas carregadas com sucesso')
}, { permissions: 'dashboard.view' })
